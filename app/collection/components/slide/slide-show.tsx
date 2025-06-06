'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { slidesApi } from '@/api-client/slides-api';
import { storageApi } from '@/api-client/storage-api';
import { debounce } from 'lodash';
import { SlideElementPayload } from '@/types/slideInterface';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import LoadingIndicator from '@/components/common/loading-indicator';

interface SlideElement {
    slideElementId: string;
    slideElementType: 'IMAGE' | 'TEXT';
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    rotation: number;
    layerOrder: number;
    content: string | null;
    sourceUrl: string | null;
}

interface Slide {
    slideId: string;
    transitionEffect: string | null;
    transitionDuration: number;
    autoAdvanceSeconds: number;
    slideElements: SlideElement[];
}

export interface Activity {
    activityId: string;
    activityType: string;
    title: string;
    description: string;
    isPublished: boolean;
    orderIndex: number;
    backgroundColor: string;
    backgroundImage: string | null;
    customBackgroundMusic: string | null;
    slide: Slide;
}

interface SlideShowProps {
    activities: Activity[];
    editMode?: boolean; // Thêm prop editMode để kiểm soát chế độ chỉnh sửa
}

const ORIGINAL_CANVAS_WIDTH = 812; // Kích thước gốc của canvas

// Tạo component Spinner inline
const Spinner = () => (
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent border-blue-500" role="status" aria-label="Loading"></div>
);

const SlideShow: React.FC<SlideShowProps> = ({ activities, editMode = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const fabricCanvas = useRef<fabric.Canvas | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Theo dõi thay đổi để lưu
    const hasChanges = useRef(false);

    // Lấy slide hiện tại
    const currentActivity = activities?.[currentSlideIndex];
    const currentSlide = currentActivity?.slide;

    // Khởi tạo canvas
    const initCanvas = (canvasEl: HTMLCanvasElement, backgroundColor: string) => {
        const canvas = new fabric.Canvas(canvasEl, {
            width: 1200, // Kích thước mới cho preview
            height: 680,
            backgroundColor,
            selection: editMode, // Cho phép chọn chỉ trong chế độ chỉnh sửa
        });

        // Thêm sự kiện cho chế độ chỉnh sửa
        if (editMode) {
            canvas.on('object:modified', handleObjectModified);
            canvas.on('object:added', () => {
                hasChanges.current = true;
            });
            canvas.on('text:changed', handleTextChanged);
        }

        fabricCanvas.current = canvas;
        return canvas;
    };

    // Xử lý khi đối tượng được chỉnh sửa
    const handleObjectModified = (options: any) => {
        if (!editMode || !options.target) return;
        hasChanges.current = true;

        const obj = options.target;
        const slideElementId = obj.get('slideElementId');
        if (!slideElementId) return;

        updateSlideElement(obj);
    };

    // Xử lý khi text thay đổi
    const handleTextChanged = (options: any) => {
        if (!editMode || !options.target) return;
        hasChanges.current = true;

        const obj = options.target;
        const slideElementId = obj.get('slideElementId');
        if (!slideElementId) return;

        updateSlideElement(obj);
    };

    // Hàm cập nhật slide element thông qua API
    const updateSlideElement = debounce((obj: fabric.Object) => {
        if (!obj || !currentSlide) return;

        const slideElementId = obj.get('slideElementId');
        if (!slideElementId) return;

        const canvas = fabricCanvas.current;
        if (!canvas) return;

        setIsSaving(true);

        const zoom = canvas.getZoom();
        const cw = canvas.getWidth()! / zoom;
        const ch = canvas.getHeight()! / zoom;

        const rawLeft = obj.left! / zoom;
        const rawTop = obj.top! / zoom;

        let w: number, h: number;
        if (obj.type === 'image') {
            w = (obj as fabric.Image).getScaledWidth() / zoom;
            h = (obj as fabric.Image).getScaledHeight() / zoom;
        } else {
            w = obj.width!;
            h = (obj as fabric.Textbox).getScaledHeight() / zoom;
        }

        const base = {
            positionX: (rawLeft / cw) * 100,
            positionY: (rawTop / ch) * 100,
            width: (w / cw) * 100,
            height: (h / ch) * 100,
            rotation: obj.angle || 0,
            layerOrder: canvas.getObjects().indexOf(obj),
        };

        let payload: SlideElementPayload;
        if (obj.type === 'textbox') {
            const fontSizePercent =
                ((obj as fabric.Textbox).fontSize! / ORIGINAL_CANVAS_WIDTH) * 100;
            const textboxJson = {
                ...obj.toJSON(),
                fontSize: fontSizePercent,
            };
            if (textboxJson.styles && Object.keys(textboxJson.styles).length > 0) {
                for (const lineIndex in textboxJson.styles) {
                    const line = textboxJson.styles[lineIndex];
                    for (const charIndex in line) {
                        if (line[charIndex].fontSize) {
                            line[charIndex].fontSize =
                                (line[charIndex].fontSize / ORIGINAL_CANVAS_WIDTH) * 100;
                        }
                    }
                }
            }
            payload = {
                ...base,
                slideElementType: 'TEXT',
                content: JSON.stringify(textboxJson),
            };
        } else {
            payload = {
                ...base,
                slideElementType: 'IMAGE',
                sourceUrl: obj.get('sourceUrl') || (obj as fabric.Image).getSrc(),
            };
        }

        slidesApi
            .updateSlidesElement(currentSlide.slideId, slideElementId, payload)
            .then(() => {
                console.log('Element updated successfully');
                hasChanges.current = false;
            })
            .catch((err) => {
                console.error('Error updating element:', err);
            })
            .finally(() => {
                setIsSaving(false);
            });
    }, 500);

    // Thêm phần tử mới vào slide
    const addSlideElement = async (element: any) => {
        if (!currentSlide || !fabricCanvas.current) return;

        setIsSaving(true);
        try {
            const response = await slidesApi.addSlidesElement(
                currentSlide.slideId,
                element
            );

            if (response.data && response.data.data) {
                const newElement = response.data.data;
                // Cập nhật đối tượng fabric với ID từ server
                const fabricObject = fabricCanvas.current.getActiveObject();
                if (fabricObject) {
                    fabricObject.set('slideElementId', newElement.slideElementId);
                }
                fabricCanvas.current.renderAll();
                hasChanges.current = false;
                console.log('Element added successfully');
            }
        } catch (error) {
            console.error('Error adding element:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Xóa phần tử khỏi slide
    const deleteSlideElement = async (slideElementId: string, obj: fabric.Object) => {
        if (!currentSlide || !fabricCanvas.current) return;

        setIsSaving(true);
        try {
            // Kiểm tra nếu là ảnh từ AWS S3, xóa file từ storage
            if (obj.type === 'image') {
                const src = (obj as fabric.Image).getSrc();
                if (src && src.includes('s3.amazonaws.com')) {
                    const filePath = src.split('s3.amazonaws.com/')[1];
                    await storageApi.deleteSingleFile(filePath);
                }
            }

            await slidesApi.deleteSlidesElement(currentSlide.slideId, slideElementId);
            fabricCanvas.current.remove(obj);
            fabricCanvas.current.renderAll();
            hasChanges.current = false;
            console.log('Element deleted successfully');
        } catch (error) {
            console.error('Error deleting element:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Render slide lên canvas
    const renderSlide = async (activity: Activity) => {
        if (!activity || !activity.slide) {
            console.error('Không có dữ liệu slide để hiển thị');
            return;
        }

        setLoading(true);
        console.log('Đang render slide:', activity.title);
        console.log('Slide elements:', activity.slide.slideElements);

        const canvas = fabricCanvas.current;
        if (!canvas) return;

        // Xóa nội dung canvas hiện tại
        canvas.clear();
        canvas.backgroundColor = activity.backgroundColor || '#fff';
        canvas.renderAll();

        // Sắp xếp elements theo layerOrder
        const sortedElements = [...activity.slide.slideElements].sort(
            (a, b) => a.layerOrder - b.layerOrder
        );

        // Load all images first
        const imagePromises = sortedElements
            .filter(
                (element) => element.slideElementType === 'IMAGE' && element.sourceUrl
            )
            .map(
                (element) =>
                    new Promise<{ element: SlideElement; imgElement: HTMLImageElement }>(
                        (resolve, reject) => {
                            const imgElement = new Image();
                            imgElement.onload = () => resolve({ element, imgElement });
                            imgElement.onerror = (err) => reject(err);
                            imgElement.crossOrigin = 'anonymous'; // Cho phép CORS
                            imgElement.src = element.sourceUrl!;
                        }
                    )
            );

        try {
            const loadedImages = await Promise.all(imagePromises);

            // Add all elements to canvas in order
            sortedElements.forEach((element) => {
                const {
                    slideElementId,
                    positionX,
                    positionY,
                    width,
                    height,
                    rotation,
                    slideElementType,
                    content,
                    sourceUrl,
                } = element;
                const canvasWidth = canvas.getWidth();
                const canvasHeight = canvas.getHeight();

                // Tính toán vị trí và kích thước thực tế
                const left = (positionX / 100) * canvasWidth;
                const top = (positionY / 100) * canvasHeight;
                const elementWidth = (width / 100) * canvasWidth;
                const elementHeight = (height / 100) * canvasHeight;

                if (slideElementType === 'IMAGE' && sourceUrl) {
                    const loadedImage = loadedImages.find(
                        (img) => img.element.sourceUrl === sourceUrl
                    );
                    if (!loadedImage) {
                        console.error(`Không tìm thấy ảnh đã tải cho ${sourceUrl}`);
                        return;
                    }
                    const { imgElement } = loadedImage;
                    console.log('Ảnh tải thành công:', sourceUrl, {
                        width: imgElement.width,
                        height: imgElement.height,
                    });
                    const img = new fabric.Image(imgElement);
                    if (!img.width || !img.height) {
                        console.error(`Lỗi: Ảnh không có kích thước hợp lệ - ${sourceUrl}`);
                        return;
                    }
                    const scaleX = img.width > 0 ? elementWidth / img.width : 1;
                    const scaleY = img.height > 0 ? elementHeight / img.height : 1;
                    img.set({
                        left,
                        top,
                        angle: rotation,
                        scaleX,
                        scaleY,
                        selectable: editMode,
                        slideElementId, // Lưu ID của element
                        sourceUrl, // Lưu URL nguồn
                    });
                    console.log('Thêm ảnh vào canvas:', { left, top, scaleX, scaleY });
                    canvas.add(img);
                } else if (slideElementType === 'TEXT' && content) {
                    try {
                        const json = JSON.parse(content);
                        const fontSizePixel = (json.fontSize / 100) * canvasWidth;
                        const { type, version, ...validProps } = json;
                        const textbox = new fabric.Textbox(json.text || '', {
                            ...validProps,
                            fontSize: fontSizePixel,
                            left,
                            top,
                            width: elementWidth,
                            height: elementHeight,
                            angle: rotation,
                            selectable: editMode,
                            slideElementId, // Lưu ID của element
                        });

                        if (json.styles && Object.keys(json.styles).length > 0) {
                            for (const lineIndex in json.styles) {
                                const line = json.styles[lineIndex];
                                for (const charIndex in line) {
                                    if (line[charIndex].fontSize) {
                                        line[charIndex].fontSize =
                                            (line[charIndex].fontSize / 100) * canvasWidth;
                                    }
                                    textbox.setSelectionStyles(
                                        line[charIndex],
                                        parseInt(lineIndex),
                                        parseInt(charIndex)
                                    );
                                }
                            }
                        }

                        canvas.add(textbox);
                    } catch (error) {
                        console.error('Lỗi khi phân tích content của text element:', error);
                    }
                }
            });

            canvas.renderAll();
            console.log(
                'Objects trong canvas (sau khi render):',
                canvas.getObjects()
            );
        } catch (err) {
            console.error('Lỗi tải ảnh:', err);
        } finally {
            setLoading(false);
        }
    };

    // Khởi tạo canvas và render slide hiện tại
    useEffect(() => {
        if (!canvasRef.current || !activities || activities.length === 0) return;

        const canvas = initCanvas(
            canvasRef.current,
            activities[currentSlideIndex]?.backgroundColor || '#fff'
        );

        renderSlide(activities[currentSlideIndex]);

        return () => {
            if (canvas) {
                canvas.dispose();
            }
        };
    }, [activities, currentSlideIndex]);

    // Xử lý phím khi xem slide
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                handleNextSlide();
            } else if (e.key === 'ArrowLeft') {
                handlePrevSlide();
            } else if (e.key === 'Delete' && editMode) {
                // Xóa đối tượng đang được chọn
                const canvas = fabricCanvas.current;
                if (!canvas) return;

                const activeObject = canvas.getActiveObject();
                if (activeObject) {
                    const slideElementId = activeObject.get('slideElementId');
                    if (slideElementId) {
                        deleteSlideElement(slideElementId, activeObject);
                    } else {
                        canvas.remove(activeObject);
                        canvas.renderAll();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentSlideIndex, activities, editMode]);

    // Xử lý chuyển slide
    const handleNextSlide = () => {
        if (activities && currentSlideIndex < activities.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1);
        }
    };

    const handlePrevSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
        }
    };

    if (!activities || activities.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen">
                Không tìm thấy slide
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="mb-2 text-lg font-medium">
                {currentActivity?.title || 'Slide'}
                {isSaving && <span className="ml-2 text-blue-500 text-sm">(Đang lưu...)</span>}
            </div>

            <div
                style={{
                    position: 'relative',
                    width: '1200px',
                    height: '680px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
            >
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
                        <LoadingIndicator variant="default" size="lg" />
                    </div>
                )}
                <canvas ref={canvasRef} />
            </div>

            <div className="flex gap-4 mt-4">
                <Button
                    onClick={handlePrevSlide}
                    disabled={currentSlideIndex === 0 || loading}
                    variant="outline"
                    size="sm"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Trước
                </Button>
                <div className="px-2 py-1 bg-gray-200 rounded text-sm">
                    {currentSlideIndex + 1} / {activities.length}
                </div>
                <Button
                    onClick={handleNextSlide}
                    disabled={currentSlideIndex === activities.length - 1 || loading}
                    variant="outline"
                    size="sm"
                >
                    Tiếp
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>

            {editMode && (
                <div className="mt-4 text-sm text-gray-500">
                    <p>Chế độ chỉnh sửa: Bạn có thể kéo, thay đổi kích thước và chỉnh sửa các phần tử. Nhấn Delete để xóa phần tử đang chọn.</p>
                </div>
            )}
        </div>
    );
};

export default SlideShow;
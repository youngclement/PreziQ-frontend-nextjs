'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { FabricImage } from 'fabric';
import { useIsMobile } from '@/hooks/use-mobile';
import gsap from 'gsap';
import { animationMap } from '@/app/collection/components/slide/utils/animationMap';
export type SlideElement = {
  slideElementId: string;
  slideElementType: 'TEXT' | 'IMAGE';
  positionX: number; // %
  positionY: number; // %
  width: number; // %
  height: number; // %
  rotation: number; // deg
  layerOrder: number;
  content: string | null;
  sourceUrl: string | null;
  entryAnimation: string | null;
  entryAnimationDuration: number | null;
  entryAnimationDelay: number | null;
  exitAnimation: string | null;
  exitAnimationDuration: number | null;
  exitAnimationDelay: number | null;
};

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
  activity: Activity;
  width?: number;
  height?: number;
}

const InfoSlideViewer: React.FC<SlideShowProps> = ({
  activity,
  width = 900,
  height = 510,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const isMobile = useIsMobile();
  const { backgroundColor, backgroundImage, slide } = activity;

  // Kích thước chuẩn
  const STANDARD_CANVAS_WIDTH = 812;
  const STANDARD_CANVAS_HEIGHT = (STANDARD_CANVAS_WIDTH * height) / width;

  // Tính toán kích thước canvas responsive
  const getCanvasDimensions = () => {
    if (isMobile) {
      const windowWidth = window.innerWidth;
      const canvasWidth = Math.min(windowWidth * 0.95, 360);
      const canvasHeight = canvasWidth * (height / width);
      return { canvasWidth, canvasHeight };
    }
    return { canvasWidth: width, canvasHeight: height };
  };

  const { canvasWidth, canvasHeight } = getCanvasDimensions();

  // const animationMap: {
  //   [key: string]: (
  //     target: fabric.Object,
  //     canvas: fabric.Canvas,
  //     callback?: () => void
  //   ) => void;
  // } = {
  //   Fade: (target, canvas, callback) => {
  //     const initialOpacity = target.opacity ?? 1;
  //     target.set('opacity', 0);
  //     canvas.renderAll();
  //     gsap.to(target, {
  //       duration: 1,
  //       opacity: initialOpacity,
  //       onUpdate: () => canvas.renderAll(),
  //       onComplete: callback,
  //     });
  //   },
  //   SlideInLeft: (target, canvas, callback) => {
  //     const initialLeft = target.left ?? 0;
  //     target.set('left', initialLeft - 100);
  //     canvas.renderAll();
  //     gsap.to(target, {
  //       duration: 0.5,
  //       left: initialLeft,
  //       opacity: 1,
  //       ease: 'power2.out',
  //       onUpdate: () => canvas.renderAll(),
  //       onComplete: callback,
  //     });
  //   },
  //   Bounce: (target, canvas, callback) => {
  //     const initialTop = target.top ?? 0;
  //     target.set('top', initialTop - 100);
  //     target.set('opacity', 0);
  //     canvas.renderAll();
  //     gsap.to(target, {
  //       duration: 0.5,
  //       top: initialTop,
  //       opacity: 1,
  //       ease: 'bounce.out',
  //       onUpdate: () => canvas.renderAll(),
  //       onComplete: callback,
  //     });
  //   },
  // };

  // Khởi tạo canvas
  const initCanvas = (
    canvasEl: HTMLCanvasElement,
    backgroundColor: string,
    backgroundImage: string | null
  ) => {
    const canvas = new fabric.Canvas(canvasEl, {
      width: canvasWidth,
      height: canvasHeight,
      selection: false,
    });

    canvas.backgroundColor = backgroundColor || '#fff';
    if (backgroundImage) {
      FabricImage.fromURL(backgroundImage).then((img) => {
        img.set({
          scaleX: canvas.getWidth() / img.width,
          scaleY: canvas.getHeight() / img.height,
          originX: 'left',
          originY: 'top',
        });
        canvas.backgroundImage = img;
        canvas.renderAll();
      });
    }

    fabricCanvas.current = canvas;
    return canvas;
  };

  // Hàm chuyển đổi SlideElement thành Fabric Object
  const slideElementToFabric = (
    element: SlideElement,
    canvas: fabric.Canvas,
    loadedImages: { element: SlideElement; imgElement: HTMLImageElement }[],
    scaleX: number,
    scaleY: number
  ): fabric.Object | null => {
    const zoom = canvas.getZoom();
    const canvasWidth = canvas.getWidth() / zoom;
    const canvasHeight = canvas.getHeight() / zoom;

    // Tính toán vị trí và kích thước dựa trên tỷ lệ chuẩn, sau đó scale
    const left = (element.positionX / 100) * STANDARD_CANVAS_WIDTH * scaleX;
    const top = (element.positionY / 100) * STANDARD_CANVAS_HEIGHT * scaleY;
    const width = (element.width / 100) * STANDARD_CANVAS_WIDTH * scaleX;
    const height = (element.height / 100) * STANDARD_CANVAS_HEIGHT * scaleY;

    if (element.slideElementType === 'TEXT' && element.content) {
      try {
        const textboxJson = JSON.parse(element.content);
        const fontSizePercent = textboxJson.fontSize || 2.4630541871921183;
        const fontSize =
          (fontSizePercent / 100) * STANDARD_CANVAS_WIDTH * scaleX;

        const styles: { [line: string]: { [char: string]: any } } = {};

        if (textboxJson.styles && Array.isArray(textboxJson.styles)) {
          const lines = (textboxJson.text || '').split('\n');
          let charPosWithoutNewlines = 0;

          textboxJson.styles.forEach((styleEntry: any) => {
            if (
              styleEntry.start !== undefined &&
              styleEntry.end !== undefined
            ) {
              let currentPos = 0;
              charPosWithoutNewlines = 0;

              for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                const lineLength = lines[lineIndex].length;

                if (
                  styleEntry.start < charPosWithoutNewlines + lineLength &&
                  styleEntry.end > charPosWithoutNewlines
                ) {
                  const startInLine = Math.max(
                    0,
                    styleEntry.start - charPosWithoutNewlines
                  );
                  const endInLine = Math.min(
                    lineLength,
                    styleEntry.end - charPosWithoutNewlines
                  );

                  if (startInLine < endInLine) {
                    const lineKey = lineIndex.toString();
                    styles[lineKey] = styles[lineKey] || {};

                    for (
                      let charIndex = startInLine;
                      charIndex < endInLine;
                      charIndex++
                    ) {
                      const style = { ...styleEntry.style };
                      if (style.fontSize) {
                        style.fontSize =
                          (style.fontSize / 100) *
                          STANDARD_CANVAS_WIDTH *
                          scaleX;
                      }
                      styles[lineKey][charIndex] = style;
                    }
                  }
                }

                charPosWithoutNewlines += lineLength;
                currentPos += lineLength + 1;
              }
            }
          });
        }

        if (
          textboxJson.styles &&
          !Array.isArray(textboxJson.styles) &&
          typeof textboxJson.styles === 'object'
        ) {
          for (const lineIndex in textboxJson.styles) {
            const line = textboxJson.styles[lineIndex];
            styles[lineIndex] = {};
            for (const charIndex in line) {
              const style = { ...line[charIndex] };
              if (style.fontSize) {
                style.fontSize =
                  (style.fontSize / 100) * STANDARD_CANVAS_WIDTH * scaleX;
              }
              styles[lineIndex][charIndex] = style;
            }
          }
        }

        const textbox = new fabric.Textbox(textboxJson.text || 'New Text', {
          left,
          top,
          width,
          height,
          fontSize,
          fontWeight: textboxJson.fontWeight || 'normal',
          fontFamily: textboxJson.fontFamily || 'Arial',
          fontStyle: textboxJson.fontStyle || 'normal',
          lineHeight: textboxJson.lineHeight || 1.16,
          textAlign: textboxJson.textAlign || 'left',
          charSpacing: textboxJson.charSpacing || 0,
          fill: textboxJson.fill || '#000000',
          styles,
          angle: element.rotation || 0,
          originX: 'left',
          originY: 'top',
          minWidth: textboxJson.minWidth || 20,
          splitByGrapheme: textboxJson.splitByGrapheme || false,
          backgroundColor: textboxJson.backgroundColor || '',
          underline: textboxJson.underline || false,
          overline: textboxJson.overline || false,
          linethrough: textboxJson.linethrough || false,
          textBackgroundColor: textboxJson.textBackgroundColor || '',
          direction: textboxJson.direction || 'ltr',
          pathStartOffset: textboxJson.pathStartOffset || 0,
          pathSide: textboxJson.pathSide || 'left',
          pathAlign: textboxJson.pathAlign || 'baseline',
          scaleX: textboxJson.scaleX || 1,
          scaleY: textboxJson.scaleY || 1,
          selectable: false,
        });

        textbox.set('slideElementId', element.slideElementId);
        return textbox;
      } catch (err) {
        console.error('Lỗi khi parse content của TEXT element:', err);
        return null;
      }
    } else if (element.slideElementType === 'IMAGE' && element.sourceUrl) {
      const loadedImage = loadedImages.find(
        (img) => img.element.sourceUrl === element.sourceUrl
      );
      if (!loadedImage) {
        console.warn('Không tìm thấy ảnh đã tải:', element.sourceUrl);
        return null;
      }

      const { imgElement } = loadedImage;
      const img = new fabric.Image(imgElement);
      if (!img.width || !img.height) {
        console.warn('Ảnh không có kích thước hợp lệ:', element.sourceUrl);
        return null;
      }

      const scaleX = img.width > 0 ? width / img.width : 1;
      const scaleY = img.height > 0 ? height / img.height : 1;

      img.set({
        left,
        top,
        angle: element.rotation || 0,
        scaleX,
        scaleY,
        originX: 'left',
        originY: 'top',
        selectable: false,
        slideElementId: element.slideElementId,
      });

      return img;
    }

    console.warn(
      'Loại slideElement không được hỗ trợ:',
      element.slideElementType
    );
    return null;
  };

  const applyEntryAnimation = (
    obj: fabric.Object,
    element: SlideElement,
    scaleX: number,
    scaleY: number
  ) => {
    if (!element.entryAnimation || !animationMap[element.entryAnimation]) {
      return;
    }

    const animation = animationMap[element.entryAnimation];
    const duration = (element.entryAnimationDuration || 1000) / 1000; // Chuyển ms thành giây
    const delay = (element.entryAnimationDelay || 0) / 1000; // Chuyển ms thành giây

    // Điều chỉnh GSAP animation để tôn trọng duration và delay
    setTimeout(() => {
      animation(obj, fabricCanvas.current!, () => {
        // Callback để đảm bảo trạng thái cuối cùng
        fabricCanvas.current?.renderAll();
      });
      // Ghi đè duration và delay
      gsap.set(obj, { delay });
      gsap.to(obj, { duration });
    }, delay * 1000);
  };

  // Hàm render slide
  const renderSlide = async (activity: Activity) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    // Xóa nội dung canvas hiện tại
    canvas.clear();
    canvas.backgroundImage = undefined;
    canvas.backgroundColor = backgroundColor || '#fff';
    canvas.renderAll();

    // Thiết lập hình ảnh nền nếu có
    if (backgroundImage) {
      try {
        const img = await FabricImage.fromURL(backgroundImage);
        img.set({
          scaleX: canvas.getWidth() / img.width,
          scaleY: canvas.getHeight() / img.height,
          originX: 'left',
          originY: 'top',
        });
        canvas.backgroundImage = img;
        canvas.renderAll();
      } catch (err) {
        console.error('Lỗi tải hình nền:', err);
      }
    }

    // Tỷ lệ scale giữa canvas thực tế và canvas chuẩn
    const scaleX = canvas.getWidth() / STANDARD_CANVAS_WIDTH;
    const scaleY = canvas.getHeight() / STANDARD_CANVAS_HEIGHT;

    // Sắp xếp elements theo layerOrder
    const sortedElements = [...activity.slide.slideElements].sort(
      (a, b) => a.layerOrder - b.layerOrder
    );

    // Load tất cả ảnh trước
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
              imgElement.src = element.sourceUrl!;
            }
          )
      );

    try {
      const loadedImages = await Promise.all(imagePromises);

      // Thêm các elements vào canvas
      sortedElements.forEach((element) => {
        const fabricObject = slideElementToFabric(
          element,
          canvas,
          loadedImages,
          scaleX,
          scaleY
        );
        if (fabricObject) {
          canvas.add(fabricObject);
          applyEntryAnimation(fabricObject, element, scaleX, scaleY);
        }
      });

      canvas.renderAll();
    } catch (err) {
      console.error('Lỗi tải ảnh:', err);
    }
  };

  // Khởi tạo canvas và render slide hiện tại
  useEffect(() => {
    if (
      !canvasRef.current ||
      !activity ||
      activity.activityType !== 'INFO_SLIDE' ||
      !activity.slide
    ) {
      return;
    }

    const canvas = initCanvas(
      canvasRef.current,
      activity.backgroundColor || '#fff',
      activity.backgroundImage
    );
    renderSlide(activity);

    // Cập nhật lại kích thước canvas khi thay đổi kích thước cửa sổ
    const handleResize = () => {
      const { canvasWidth, canvasHeight } = getCanvasDimensions();
      if (canvas) {
        canvas.setDimensions({ width: canvasWidth, height: canvasHeight });
        renderSlide(activity); // Render lại slide với kích thước mới
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, [activity, currentSlideIndex, canvasWidth, canvasHeight]);

  return (
    <div
      className="flex items-center justify-center mx-auto"
      style={{
        position: 'relative',
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        maxWidth: '100%',
      }}
    >
      {!activity ||
      activity.activityType !== 'INFO_SLIDE' ||
      !activity.slide ? (
        <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg">
          <p className="text-gray-500">Không có slide nào để hiển thị</p>
        </div>
      ) : (
        <canvas ref={canvasRef} />
      )}
    </div>
  );
};

export default InfoSlideViewer;
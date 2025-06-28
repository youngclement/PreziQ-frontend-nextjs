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
  displayOrder: number;
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
  showAllElements?: boolean;
}

const InfoSlideViewer: React.FC<SlideShowProps> = ({
  activity,
  width = 900,
  height = 510,
  showAllElements = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentDisplayOrder, setCurrentDisplayOrder] = useState(0);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const isMobile = useIsMobile();
  const { backgroundColor, backgroundImage, slide } = activity;

  // Kích thước chuẩn
  const STANDARD_CANVAS_WIDTH = 812;
  const STANDARD_CANVAS_HEIGHT = (STANDARD_CANVAS_WIDTH * height) / width;

  console.log('Rendering InfoSlideViewer with activity:', activity);

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
        textbox.set('entryAnimation', element.entryAnimation);
        textbox.set(
          'entryAnimationDuration',
          element.entryAnimationDuration || 1
        );
        textbox.set('entryAnimationDelay', element.entryAnimationDelay || 0);

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
        entryAnimation: element.entryAnimation,
        entryAnimationDuration: element.entryAnimationDuration || 1,
        entryAnimationDelay: element.entryAnimationDelay || 0,
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
    const duration =
      element.entryAnimationDuration || obj.get('entryAnimationDuration') || 1;
    const delay =
      element.entryAnimationDelay || obj.get('entryAnimationDelay') || 0;

    // Set properties on fabric object for animation functions to use
    obj.set('entryAnimationDuration', duration);
    obj.set('entryAnimationDelay', delay);

    // Apply animation with delay (delay is in seconds for GSAP)
    animation(obj, fabricCanvas.current!, () => {
      // Callback để đảm bảo trạng thái cuối cùng
      fabricCanvas.current?.renderAll();
    });
  };

  // Group elements by displayOrder
  const groupElementsByDisplayOrder = (elements: SlideElement[]) => {
    const groups: { [key: number]: SlideElement[] } = {};
    elements.forEach((element) => {
      const order = element.displayOrder;
      if (!groups[order]) {
        groups[order] = [];
      }
      groups[order].push(element);
    });
    return groups;
  };

  // Get the highest displayOrder
  const getMaxDisplayOrder = (elements: SlideElement[]) => {
    return Math.max(...elements.map((e) => e.displayOrder), -1);
  };

  // Hàm render slide
  const renderSlide = async (
    elements: SlideElement[],
    maxOrder: number,
    currentOrder: number
  ) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    // Khi currentOrder = 0 hoặc showAllElements = true, khởi tạo lần đầu
    if (currentOrder === 0 || showAllElements || currentOrder === -1) {
      canvas.clear();
      canvas.backgroundImage = undefined;
      canvas.backgroundColor = backgroundColor || '#fff';
      canvas.renderAll();

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
          console.error('Error loading background image:', err);
        }
      }
    }

    const scaleX = canvas.getWidth() / STANDARD_CANVAS_WIDTH;
    const scaleY = canvas.getHeight() / STANDARD_CANVAS_HEIGHT;

    const sortedElements = [...elements].sort(
      (a, b) => a.layerOrder - b.layerOrder
    );

    let toLoad: SlideElement[] = [];

    if (showAllElements) {
      // Hiển thị tất cả elements cùng lúc
      toLoad = sortedElements;
    } else {
      // Hiển thị theo displayOrder như cũ
      const groups = groupElementsByDisplayOrder(sortedElements);
      toLoad = groups[currentOrder] || [];
    }

    // Load tất cả ảnh cần thiết
    const imagePromises = toLoad
      .filter((el) => el.slideElementType === 'IMAGE' && el.sourceUrl)
      .map(
        (el) =>
          new Promise<{
            element: SlideElement;
            imgElement: HTMLImageElement;
          }>((resolve, reject) => {
            const imgEl = new Image();
            imgEl.onload = () => resolve({ element: el, imgElement: imgEl });
            imgEl.onerror = reject;
            imgEl.src = el.sourceUrl!;
          })
      );

    try {
      const loadedImages = await Promise.all(imagePromises);

      // Nếu showAllElements = false và currentOrder > 0, không xóa đối tượng cũ, chỉ thêm mới
      // Nếu showAllElements = true, đã clear canvas ở trên rồi
      toLoad.forEach((element) => {
        const fabricObj = slideElementToFabric(
          element,
          canvas,
          loadedImages,
          scaleX,
          scaleY
        );
        if (fabricObj) {
          canvas.add(fabricObj);
          // Chỉ apply animation nếu không hiển thị tất cả elements
          if (!showAllElements) {
            applyEntryAnimation(fabricObj, element, scaleX, scaleY);
          }
        }
      });

      canvas.renderAll();
    } catch (err) {
      console.error('Lỗi tải ảnh:', err);
    }
  };

  // Handle mouse click to advance displayOrder
  const handleCanvasClick = () => {
    // Chỉ xử lý click nếu không hiển thị tất cả elements
    if (showAllElements) return;

    console.log('Canvas clicked, currentDisplayOrder:', currentDisplayOrder);
    console.log(
      'Max display order:',
      getMaxDisplayOrder(activity.slide.slideElements)
    );
    const maxDisplayOrder = getMaxDisplayOrder(activity.slide.slideElements);
    if (currentDisplayOrder < maxDisplayOrder) {
      console.log('đk ok');
      setCurrentDisplayOrder((prev) => prev + 1);
      console.log(currentDisplayOrder);
    }
    // Stop at maxDisplayOrder + 1 (no further clicks needed)
  };
  // 1) Khi slide thay đổi, reset và init canvas
  useEffect(() => {
    if (
      !canvasRef.current ||
      activity.activityType !== 'INFO_SLIDE' ||
      !activity.slide
    )
      return;
    // Reset display order về 0
    setCurrentDisplayOrder(0);
    // Dispose canvas cũ nếu có
    fabricCanvas.current?.dispose();
    const canvas = initCanvas(
      canvasRef.current,
      activity.backgroundColor || '#fff',
      activity.backgroundImage
    );

    // Chỉ thêm click handler nếu không hiển thị tất cả elements
    if (!showAllElements) {
      canvas.on('mouse:down', handleCanvasClick);
    }

    // Vẽ các phần tử đầu tiên (displayOrder = 0) khi slide mới
    // Hoặc tất cả elements nếu showAllElements = true
    renderSlide(
      activity.slide.slideElements,
      getMaxDisplayOrder(activity.slide.slideElements),
      showAllElements ? -1 : 0 // -1 để trigger hiển thị tất cả
    );

    // Resize handler chỉ thay đổi size
    const handleResize = () => {
      const { canvasWidth, canvasHeight } = getCanvasDimensions();
      canvas.setDimensions({ width: canvasWidth, height: canvasHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, [activity.slide.slideId, showAllElements]);
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // 2) Render slide mỗi khi currentDisplayOrder thay đổi (chỉ khi không hiển thị tất cả)
  useEffect(() => {
    if (
      !fabricCanvas.current ||
      activity.activityType !== 'INFO_SLIDE' ||
      !activity.slide ||
      showAllElements // Không cần re-render khi showAllElements = true
    )
      return;
    renderSlide(
      activity.slide.slideElements,
      getMaxDisplayOrder(activity.slide.slideElements),
      currentDisplayOrder
    );
  }, [currentDisplayOrder, showAllElements]);
  // eslint-disable-next-line react-hooks/exhaustive-deps

  return (
    <div
      className='flex items-center justify-center mx-auto'
      style={{
        position: 'relative',
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        maxWidth: '100%',
        pointerEvents: 'auto',
        zIndex: 20,
      }}
    >
      {!activity ||
      activity.activityType !== 'INFO_SLIDE' ||
      !activity.slide ? (
        <div className='flex items-center justify-center h-[400px] bg-gray-100 rounded-lg'>
          <p className='text-gray-500'>Không có slide nào để hiển thị</p>
        </div>
      ) : (
        <canvas ref={canvasRef} />
      )}
    </div>
  );
};

export default InfoSlideViewer;

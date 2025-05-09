'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { FabricImage } from 'fabric';
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
  const { backgroundColor, backgroundImage, slide } = activity;

  console.log('backgroundImage', backgroundImage);
  // Khởi tạo canvas
  const initCanvas = (
    canvasEl: HTMLCanvasElement,
    backgroundColor: string,
    backgroundImage: string | null
  ) => {
    const canvas = new fabric.Canvas(canvasEl, {
      width: width,
      height: height,
      selection: false, // Vô hiệu hóa chọn trong chế độ xem
    });

    // Set background
    if (backgroundImage) {
      FabricImage.fromURL(backgroundImage).then((img) => {
        img.set({
          scaleX: canvas.getWidth() / img.width,
          scaleY: canvas.getHeight() / img.height,
          originX: 'left',
          originY: 'top',
        });
        canvas.backgroundImage = img;
      });
    }

    fabricCanvas.current = canvas;
    return canvas;
  };

  const ORIGINAL_CANVAS_WIDTH = 812;

  const renderSlide = async (activity: Activity) => {
    console.log('Slide elements:', activity.slide.slideElements);
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    // Xóa nội dung canvas hiện tại
    canvas.clear();
    canvas.backgroundColor = activity.backgroundColor || '#fff';

    if (backgroundImage) {
      FabricImage.fromURL(backgroundImage).then((img) => {
        img.set({
          scaleX: canvas.getWidth() / img.width,
          scaleY: canvas.getHeight() / img.height,
          originX: 'left',
          originY: 'top',
        });
        canvas.backgroundImage = img;
      });
    }

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
              imgElement.src = element.sourceUrl!;
            }
          )
      );

    try {
      const loadedImages = await Promise.all(imagePromises);

      // Add all elements to canvas in order
      sortedElements.forEach((element) => {
        const {
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
            return;
          }
          const { imgElement } = loadedImage;
          console.log('Ảnh tải thành công:', sourceUrl, {
            width: imgElement.width,
            height: imgElement.height,
          });
          const img = new fabric.Image(imgElement);
          if (!img.width || !img.height) {
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
            selectable: false,
          });
          canvas.add(img);
        } else if (slideElementType === 'TEXT' && content) {
          const json = JSON.parse(content);
          const fontSizePixel = (json.fontSize / 100) * ORIGINAL_CANVAS_WIDTH;
          const { type, version, ...validProps } = json;
          const textbox = new fabric.Textbox(json.text, {
            ...validProps,
            fontSize: fontSizePixel,
            left,
            top,
            width: elementWidth,
            height: elementHeight,
            angle: rotation,
            selectable: false,
          });

          // Sửa cách xử lý styles
          if (json.styles && Object.keys(json.styles).length > 0) {
            for (const lineIndex in json.styles) {
              const line = json.styles[lineIndex];
              for (const charIndex in line) {
                const style = line[charIndex];
                if (style.fontSize) {
                  const scaledFontSize =
                    (style.fontSize / 100) * ORIGINAL_CANVAS_WIDTH;
                  textbox.setSelectionStyles(
                    { ...style, fontSize: scaledFontSize },
                    parseInt(charIndex),
                    parseInt(charIndex) + 1
                  );
                } else {
                  textbox.setSelectionStyles(
                    style,
                    parseInt(charIndex),
                    parseInt(charIndex) + 1
                  );
                }
              }
            }
          }

          canvas.add(textbox);
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
      backgroundImage
    );
    renderSlide(activity);

    return () => {
      canvas.dispose();
    };
  }, [activity, currentSlideIndex, width, height]);

  return (
    <div
      className="flex items-center justify-center"
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
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

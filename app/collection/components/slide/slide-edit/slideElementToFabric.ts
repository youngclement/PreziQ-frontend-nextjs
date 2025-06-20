import * as fabric from 'fabric';
import { SlideElementPayload } from '@/types/slideInterface';

export const slideElementToFabric = (
  element: SlideElementPayload,
  canvas: fabric.Canvas,
  loadedImages: { element: SlideElementPayload; imgElement: HTMLImageElement }[]
): fabric.Object | null => {
  const zoom = canvas.getZoom();
  const canvasWidth = canvas.getWidth() / zoom;
  const canvasHeight = canvas.getHeight() / zoom;

  const left = (element.positionX / 100) * canvasWidth * zoom;
  const top = (element.positionY / 100) * canvasHeight * zoom;
  const width = (element.width / 100) * canvasWidth;
  const height = (element.height / 100) * canvasHeight;

  if (element.slideElementType === 'TEXT' && element.content) {
    try {
      const textboxJson = JSON.parse(element.content);
      const fontSizePercent = textboxJson.fontSize || 2.4630541871921183;
      const fontSize = (fontSizePercent / 100) * 812;

      // Xử lý styles
      const styles: { [line: string]: { [char: string]: any } } = {};

      if (textboxJson.styles && Array.isArray(textboxJson.styles)) {
        const lines = (textboxJson.text || '').split('\n');
        let currentPos = 0;
        let charPosWithoutNewlines = 0; // Vị trí ký tự không tính \n

        textboxJson.styles.forEach((styleEntry: any) => {
          if (styleEntry.start !== undefined && styleEntry.end !== undefined) {
            currentPos = 0;
            charPosWithoutNewlines = 0;

            // Duyệt qua từng dòng để ánh xạ style
            for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
              const lineLength = lines[lineIndex].length;

              // Kiểm tra nếu style có giao với dòng hiện tại
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

                  // Áp dụng style cho các ký tự trong dòng
                  for (
                    let charIndex = startInLine;
                    charIndex < endInLine;
                    charIndex++
                  ) {
                    const style = { ...styleEntry.style };
                    if (style.fontSize) {
                      style.fontSize = (style.fontSize / 100) * 812;
                    }
                    styles[lineKey][charIndex] = style;
                  }
                }
              }

              currentPos += lineLength + 1; // +1 cho ký tự \n
              charPosWithoutNewlines += lineLength; // Không tính \n
            }
          }
        });
      }

      // Xử lý styles theo định dạng cũ (nếu có)
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
              style.fontSize = (style.fontSize / 100) * 812;
            }
            styles[lineIndex][charIndex] = style;
          }
        }
      }

      // Tạo Textbox
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
      });
      textbox.set('slideElementId', element.slideElementId); // Set animation properties
      if (element.entryAnimation) {
        textbox.set('entryAnimation', element.entryAnimation);
      }
      if (element.entryAnimationDuration) {
        textbox.set('entryAnimationDuration', element.entryAnimationDuration);
      }
      if (element.entryAnimationDelay) {
        textbox.set('entryAnimationDelay', element.entryAnimationDelay);
      }

      return textbox;
    } catch (err) {
      console.error('Lỗi khi parse content của TEXT element:', err);
      return null;
    }
  } else if (element.slideElementType === 'IMAGE' && element.sourceUrl) {
    const loadedImage = loadedImages.find(
      (img) => img.element.slideElementId === element.slideElementId
    );
    if (!loadedImage || !loadedImage.imgElement) {
      console.warn(
        'Không tìm thấy hình ảnh đã tải cho element:',
        element.slideElementId
      );
      return null;
    }

    const imgElement = loadedImage.imgElement;
    const imgWidth = imgElement.width;
    const imgHeight = imgElement.height;

    if (!imgWidth || !imgHeight) {
      console.error('Hình ảnh không có kích thước hợp lệ:', element.sourceUrl);
      return null;
    }

    const scaleX = width / imgWidth;
    const scaleY = height / imgHeight;

    const image = new fabric.Image(imgElement, {
      left,
      top,
      scaleX,
      scaleY,
      angle: element.rotation || 0,
      originX: 'left',
      originY: 'top',
    });
    image.set('slideElementId', element.slideElementId);
    image.set('sourceUrl', element.sourceUrl); // Set animation properties
    if (element.entryAnimation) {
      image.set('entryAnimation', element.entryAnimation);
    }
    if (element.entryAnimationDuration) {
      image.set('entryAnimationDuration', element.entryAnimationDuration);
    }
    if (element.entryAnimationDelay) {
      image.set('entryAnimationDelay', element.entryAnimationDelay);
    }

    return image;
  }

  console.warn(
    'Loại slideElement không được hỗ trợ:',
    element.slideElementType
  );
  return null;
};

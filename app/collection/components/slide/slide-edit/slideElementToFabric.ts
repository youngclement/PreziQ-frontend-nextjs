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

  // Tính toán vị trí và kích thước dựa trên phần trăm
  const left = (element.positionX / 100) * canvasWidth * zoom;
  const top = (element.positionY / 100) * canvasHeight * zoom;
  const width = (element.width / 100) * canvasWidth;
  const height = (element.height / 100) * canvasHeight;

  if (element.slideElementType === 'TEXT' && element.content) {
    try {
      const textboxJson = JSON.parse(element.content);
      const fontSizePercent = textboxJson.fontSize || 2.4630541871921183; // Giá trị mặc định nếu không có
      const fontSize = (fontSizePercent / 100) * 812; // ORIGINAL_CANVAS_WIDTH = 812

      // Chuẩn bị styles cho Textbox
      const styles: { [line: string]: { [char: string]: any } } = {};
      if (textboxJson.styles && Array.isArray(textboxJson.styles)) {
        textboxJson.styles.forEach((styleEntry: any, index: number) => {
          if (styleEntry.start !== undefined && styleEntry.end !== undefined) {
            const lineIndex = '0'; // Giả sử văn bản chỉ có một dòng, cần điều chỉnh nếu hỗ trợ nhiều dòng
            styles[lineIndex] = styles[lineIndex] || {};
            for (let i = styleEntry.start; i < styleEntry.end; i++) {
              const style = { ...styleEntry.style };
              // Chuyển đổi fontSize trong styles từ phần trăm sang pixel
              if (style.fontSize) {
                style.fontSize = (style.fontSize / 100) * 812;
              }
              styles[lineIndex][i] = style;
            }
          }
        });
      }

      // Tính width và height ban đầu từ dữ liệu server
      const baseWidth = (element.width / 100) * canvasWidth;
      const baseHeight = (element.height / 100) * canvasHeight;

      // Lấy scaleX và scaleY từ content
      const scaleX = textboxJson.scaleX || 1;
      const scaleY = textboxJson.scaleY || 1;

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
        scaleX,
        scaleY
      });

      textbox.set('slideElementId', element.slideElementId);
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
    image.set('sourceUrl', element.sourceUrl);
    return image;
  }

  console.warn(
    'Loại slideElement không được hỗ trợ:',
    element.slideElementType
  );
  return null;
};

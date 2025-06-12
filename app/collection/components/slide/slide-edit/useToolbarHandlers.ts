'use client';

import * as fabric from 'fabric';
import { FabricImage } from 'fabric';
import { slidesApi } from '@/api-client/slides-api';
import type { SlideElementPayload } from '@/types/slideInterface';
import { debounce } from 'lodash';

const ORIGINAL_CANVAS_WIDTH = 812;

type StyleObj = Partial<{
  fontWeight: string;
  fontStyle: string;
  underline: boolean;
}>;

export const ToolbarHandlers = (
  canvas: fabric.Canvas,
  slideId: string,
  onUpdate?: (data: {
    title?: string;
    content?: string;
    slideElements: SlideElementPayload[];
  }) => void,
  slideElementsRef: React.MutableRefObject<SlideElementPayload[]> = { current: [] },
  currentTitle: string = '', // Pass current title
  currentContent: string = '' // Pass current content
) => {
  console.log('slideId', slideElementsRef.current);
  const updateTextboxElement = debounce((textbox: fabric.Textbox) => {
    const slideElementId = textbox.get('slideElementId');
    if (!slideElementId) return;

    const canvas = textbox.canvas;
    if (!canvas) return;

    const zoom = canvas.getZoom();
    const cw = canvas.getWidth()! / zoom;
    const ch = canvas.getHeight()! / zoom;

    const currentElement = slideElementsRef.current.find(
      (el) => el.slideElementId === slideElementId
    );
    const displayOrder = currentElement?.displayOrder || 0;

    const rawLeft = textbox.left! / zoom;
    const rawTop = textbox.top! / zoom;
    const w = textbox.width!;
    const h = textbox.height!;

    const fontSizePercent = (textbox.fontSize! / ORIGINAL_CANVAS_WIDTH) * 100;
    const textboxJson = {
      ...textbox.toJSON(),
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

    const payload: SlideElementPayload = {
      positionX: (rawLeft / cw) * 100,
      positionY: (rawTop / ch) * 100,
      width: (w / cw) * 100,
      height: (h / ch) * 100,
      rotation: textbox.angle || 0,
      layerOrder: canvas.getObjects().indexOf(textbox),
      slideElementType: 'TEXT',
      displayOrder: displayOrder,
      content: JSON.stringify(textboxJson),
    };
    // console.log("Payload sent to API:", JSON.parse(payload.content));
    slidesApi
      .updateSlidesElement(slideId, slideElementId, payload)
      .then((res) => {
        const updatedElement = {
          slideElementId: res.data.data.slideElementId,
          ...payload,
        };

        const updatedSlideElements = slideElementsRef.current.map((el) =>
          el.slideElementId === slideElementId ? updatedElement : el
        );

        if (onUpdate) {
          onUpdate({ slideElements: updatedSlideElements });
        }
      });
  }, 500);

  const updateImageElement = debounce((image: fabric.Image) => {
    const slideElementId = image.get('slideElementId');
    if (!slideElementId) return;

    const canvas = image.canvas;
    if (!canvas) return;


    const zoom = canvas.getZoom();
    const cw = canvas.getWidth()! / zoom;
    const ch = canvas.getHeight()! / zoom;

    const rawLeft = image.left! / zoom;
    const rawTop = image.top! / zoom;
    const w = image.getScaledWidth() / zoom;
    const h = image.getScaledHeight() / zoom;

    const currentElement = slideElementsRef.current.find(
      (el) => el.slideElementId === slideElementId
    );
    const displayOrder = currentElement?.displayOrder || 0;

    const payload: SlideElementPayload = {
      positionX: (rawLeft / cw) * 100,
      positionY: (rawTop / ch) * 100,
      width: (w / cw) * 100,
      height: (h / ch) * 100,
      rotation: image.angle || 0,
      layerOrder: canvas.getObjects().indexOf(image),
      slideElementType: 'IMAGE',
      sourceUrl: image.get('sourceUrl') || image.getSrc(),
      displayOrder: displayOrder,
    };

    slidesApi
      .updateSlidesElement(slideId, slideElementId, payload)
      .then((res) => console.log('Updated image', res.data))
      .catch((err) => console.error('Update image failed', err));
  }, 500);

  const addTextbox = async () => {
    let textbox: fabric.Textbox | null = null; 

    try {
      canvas.set('isCreating', true);
      // Tạo textbox mới
      const defaultFontSizePercent = (20 / ORIGINAL_CANVAS_WIDTH) * 100;
      textbox = new fabric.Textbox('New Text', {
        left: 50,
        top: 250,
        fontSize: 20,
        width: 100,
        fill: '#000000',
        fontFamily: 'Arial',
      });

      // Set isNew flag
      textbox.set('isNew', true);

      // Thêm vào canvas
      canvas.add(textbox);
      canvas.setActiveObject(textbox);
      canvas.renderAll();

      // Lấy thông số để tạo payload
      const cw = canvas.getWidth();
      const ch = canvas.getHeight();
      const w = textbox.getScaledWidth();
      const h = textbox.getScaledHeight();

      // Tính toán displayOrder mới
      const maxDisplayOrder = Math.max(
        -1,
        ...slideElementsRef.current.map((el) => el.displayOrder)
      );

      // Tạo payload
      const payload: SlideElementPayload = {
        positionX: (textbox.left! / cw) * 100,
        positionY: (textbox.top! / ch) * 100,
        width: (w / cw) * 100,
        height: (h / ch) * 100,
        rotation: textbox.angle || 0,
        layerOrder: canvas.getObjects().indexOf(textbox),
        slideElementType: 'TEXT',
        displayOrder: maxDisplayOrder + 1,
        content: JSON.stringify({
          ...textbox.toJSON(),
          fontSize: defaultFontSizePercent,
        }),
      };

      // Gọi API để thêm element
      const response = await slidesApi.addSlidesElement(slideId, payload);
      console.log('API addSlidesElement thành công:', response.data);

      // Update textbox với ID từ server
      textbox.set('isNew', false);
      textbox.set('slideElementId', response.data.data.slideElementId);
      textbox.set('displayOrder', maxDisplayOrder + 1);

      // Tạo element mới với đầy đủ thông tin
      const newElement = {
        slideElementId: response.data.data.slideElementId,
        ...payload,
      };

      // Tạo mảng elements mới bằng cách copy mảng cũ và thêm element mới
      const updatedElements = [...slideElementsRef.current, newElement];

      // Emit event để thông báo element mới được tạo
      window.dispatchEvent(
        new CustomEvent('slide:element:created', {
          detail: {
            slideId,
            element: newElement,
          },
        })
      );

      // Cập nhật state qua onUpdate
      if (onUpdate) {
        onUpdate({
          slideElements: updatedElements,
        });
      }

      // Emit event selection changed
      window.dispatchEvent(
        new CustomEvent('fabric:selection-changed', {
          detail: {
            slideId,
            animationName: 'none',
            objectId: response.data.data.slideElementId,
          },
        })
      );
    } catch (err) {
      if (textbox) {
        canvas.remove(textbox);
        canvas.renderAll();
      }
    } finally {
      canvas.set('isCreating', false);
    }
  };

  function onAddImage(e: Event) {
    const ev = e as CustomEvent<{ url: string; slideId?: string }>;
    console.log('ev', ev.detail);
    if (ev.detail.slideId && ev.detail.slideId !== slideId) {
      console.log(
        `Bỏ qua fabric:add-image vì slideId không khớp: ${ev.detail.slideId} !== ${slideId}`
      );
      return;
    }
    const { url } = ev.detail;

    if (canvas.get('isCreating')) {
      console.log('Bỏ qua addImage vì đang tạo');
      return;
    }
    canvas.set('isCreating', true);

    FabricImage.fromURL(url)
      .then((img) => {
        img.set({ left: 100, top: 100, scaleX: 0.5, scaleY: 0.5, isNew: true });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();

        const cw = canvas.getWidth()!;
        const ch = canvas.getHeight()!;
        const w = img.getScaledWidth();
        const h = img.getScaledHeight();

        const payload: SlideElementPayload = {
          positionX: (img.left! / cw) * 100,
          positionY: (img.top! / ch) * 100,
          width: (w / cw) * 100,
          height: (h / ch) * 100,
          rotation: img.angle || 0,
          layerOrder: canvas.getObjects().indexOf(img),
          slideElementType: 'IMAGE',
          sourceUrl: url,
          displayOrder: 0, // Mặc định là 0, có thể cập nhật sau
        };

        slidesApi
          .addSlidesElement(slideId, payload)
          .then((res) => {
            console.log('Tạo image element thành công:', res.data);
            img.set('slideElementId', res.data.data.slideElementId);
            img.set('isNew', false);

            // Tạo element mới từ response
            const newElement = {
              slideElementId: res.data.data.slideElementId,
              ...payload,
            };

            window.dispatchEvent(
              new CustomEvent('slide:element:created', {
                detail: {
                  slideId,
                  element: newElement,
                },
              })
            );

            const updatedSlideElements = [
              ...slideElementsRef.current,
              newElement,
            ];

            if (onUpdate) {
              onUpdate({
                slideElements: updatedSlideElements,
              });
            }

            console.log('Data đã gửi:', {
              slideElements: updatedSlideElements,
            });
          })
          .catch((err) => {
            console.error('Lỗi khi tạo image element:', err);
            canvas.remove(img);
            canvas.renderAll();
          })
          .finally(() => {
            canvas.set('isCreating', false);
          });
      })
      .catch((err) => {
        console.error('Failed to load image:', err);
        canvas.set('isCreating', false);
      });
  }

  const addShape = (shape: 'rect' | 'circle' | 'triangle' | 'arrow') => {
    let obj: fabric.Object;

    switch (shape) {
      case 'rect':
        obj = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 60,
          fill: '#3498db',
        });
        break;
      case 'circle':
        obj = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 40,
          fill: '#e74c3c',
        });
        break;
      case 'triangle':
        obj = new fabric.Triangle({
          left: 100,
          top: 100,
          width: 60,
          height: 60,
          fill: '#9b59b6',
        });
        break;
      case 'arrow':
        obj = new fabric.Path('M 0 0 L 100 0 L 90 -10 M 100 0 L 90 10', {
          stroke: '#2c3e50',
          strokeWidth: 4,
          fill: '',
        });
        break;
    }

    canvas.add(obj!);
    canvas.setActiveObject(obj!);
    canvas.renderAll();
  };

  function applyStyleToSelection(
    textbox: fabric.Textbox,
    styleName: string,
    styleValue: any
  ) {
    if (!textbox.isEditing) return;

    const start = textbox.selectionStart || 0;
    const end = textbox.selectionEnd || 0;

    // console.log('Selected range:', {
    //   start: textbox.selectionStart,
    //   end: textbox.selectionEnd,
    //   text: textbox.text!.slice(textbox.selectionStart!, textbox.selectionEnd!),
    // });

    if (start === end) return;

    if (start === 0 && end === textbox.text!.length) {
      textbox.set(styleName as any, styleValue);
      removeStyleProperty(textbox, styleName as keyof StyleObj);
    } else {
      textbox.setSelectionStyles({ [styleName]: styleValue }, start, end);
    }

    textbox.dirty = true;
    canvas.requestRenderAll();
    updateTextboxElement(textbox);
  }

  function removeStyleProperty(
    textbox: fabric.Textbox,
    prop: keyof StyleObj | 'fill' | 'fontSize' | 'fontFamily'
  ) {
    if (!textbox.styles) return;

    const styles = textbox.styles as unknown as Record<
      string,
      Record<string, any>
    >;

    for (const lineIndex in styles) {
      const line = styles[lineIndex];
      for (const charIndex in line) {
        const charStyles = line[charIndex];
        delete charStyles[prop];
        if (Object.keys(charStyles).length === 0) {
          delete line[charIndex];
        }
      }
      if (Object.keys(line).length === 0) {
        delete styles[lineIndex];
      }
    }

    textbox.styles = styles as any;
    textbox.dirty = true;
  }

  const changeColor = (e: CustomEvent<{ color?: string; gradient?: any }>) => {
    const active = canvas.getActiveObject();
    if (!active || active.type !== 'textbox') {
      console.log('No active textbox, skipping color change');
      return;
    }

    const textbox = active as fabric.Textbox;
    if (!e.detail.color) {
      return;
    }

    const start = textbox.isEditing ? textbox.selectionStart || 0 : 0;
    const end = textbox.isEditing
      ? textbox.selectionEnd || textbox.text!.length
      : textbox.text!.length;

    // console.log('Applying color:', {
    //   color: e.detail.color,
    //   isEditing: textbox.isEditing,
    //   start,
    //   end,
    // });

    if (textbox.isEditing && start !== end) {
      // Áp dụng màu cho vùng chọn
      applyStyleToSelection(textbox, 'fill', e.detail.color);
    } else {
      // Áp dụng màu cho toàn bộ textbox
      textbox.set('fill', e.detail.color);
      removeStyleProperty(textbox, 'fill');
    }

    textbox.dirty = true;
    canvas.requestRenderAll();
    updateTextboxElement(textbox);
    emitFormatState(start, end);
  };

  const changeAlign = (
    e: CustomEvent<{ align: fabric.Textbox['textAlign'] }>
  ) => {
    const active = canvas.getActiveObject();
    if (active && active.type === 'textbox') {
      const textbox = active as fabric.Textbox;

      textbox.set({ textAlign: e.detail.align });

      // Đánh dấu textbox là dirty để đảm bảo render đúng
      textbox.dirty = true;

      canvas.renderAll();

      updateTextboxElement(textbox);

      emitFormatState();
    }
  };

  const clearCanvas = () => {
    // canvas.getObjects().forEach((obj) => {
    //   if (obj !== title && obj !== content) canvas.remove(obj);
    // });
    canvas.renderAll();
  };

  function emitFormatState(startIdx?: number, endIdx?: number) {
    const obj = canvas.getActiveObject();
    let textTransform = 'none';

    // console.log('emitFormatState called', {
    //   startIdx,
    //   endIdx,
    //   isEditing: obj?.type === 'textbox' && (obj as fabric.Textbox).isEditing,
    // });

    if (obj && obj.type === 'textbox') {
      const tb = obj as fabric.Textbox;
      const alignment = tb.textAlign || 'left';
      let fontFamily = tb.fontFamily || 'Roboto';
      let fontSize = tb.fontSize || 16;
      let fill = (tb.fill as string) || '#000000';
      let boldActive = false;
      let italicActive = false;
      let underlineActive = false;

      if (
        tb.isEditing &&
        startIdx !== undefined &&
        endIdx !== undefined &&
        startIdx < endIdx
      ) {
        const selectedText = tb.text!.slice(startIdx, endIdx);
        console.log('Selected text:', selectedText);

        if (
          selectedText === selectedText.toUpperCase() &&
          selectedText !== selectedText.toLowerCase()
        ) {
          textTransform = 'uppercase';
        } else if (selectedText === selectedText.toLowerCase()) {
          textTransform = 'lowercase';
        } else if (
          selectedText.length > 0 &&
          selectedText[0] === selectedText[0].toUpperCase() &&
          selectedText.slice(1) === selectedText.slice(1).toLowerCase()
        ) {
          textTransform = 'capitalize';
        }

        const selStyles = tb.getSelectionStyles(
          startIdx,
          endIdx,
          true
        ) as Array<{
          fontWeight?: string;
          fontStyle?: string;
          underline?: boolean;
          fontFamily?: string;
          fontSize?: number;
          fill?: string;
        }>;

        console.log('Selection styles:', selStyles);

        boldActive = selStyles.every((s) => s.fontWeight === 'bold');
        italicActive = selStyles.every((s) => s.fontStyle === 'italic');
        underlineActive = selStyles.every((s) => s.underline === true);

        // Lấy giá trị của ký tự đầu tiên trong vùng chọn
        if (selStyles.length > 0) {
          fontFamily = selStyles[0].fontFamily || tb.fontFamily || 'Roboto';
          fontSize = selStyles[0].fontSize || tb.fontSize || 16;
          fill = selStyles[0].fill || (tb.fill as string) || '#000000';
        }
      } else {
        boldActive = tb.fontWeight === 'bold';
        italicActive = tb.fontStyle === 'italic';
        underlineActive = tb.underline === true;

        const allText = tb.text || '';
        if (
          allText === allText.toUpperCase() &&
          allText !== allText.toLowerCase()
        ) {
          textTransform = 'uppercase';
        } else if (allText === allText.toLowerCase()) {
          textTransform = 'lowercase';
        } else if (
          allText.length > 0 &&
          allText[0] === allText[0].toUpperCase() &&
          allText.slice(1) === allText.slice(1).toLowerCase()
        ) {
          textTransform = 'capitalize';
        }

        if (tb.styles) {
          const allStyles = tb.getSelectionStyles(0, tb.text!.length, true);
          boldActive =
            boldActive && allStyles.every((s) => s.fontWeight === 'bold');
          italicActive =
            italicActive && allStyles.every((s) => s.fontStyle === 'italic');
          underlineActive =
            underlineActive && allStyles.every((s) => s.underline === true);
        }
      }

      // console.log('Emitting format state:', {
      //   bold: boldActive,
      //   italic: italicActive,
      //   underline: underlineActive,
      //   alignment,
      //   textTransform,
      //   fontFamily,
      //   fontSize,
      //   fill,
      // });

      window.dispatchEvent(
        new CustomEvent('toolbar:format-change', {
          detail: {
            bold: boldActive,
            italic: italicActive,
            underline: underlineActive,
            alignment,
            textTransform,
            fontFamily,
            fontSize,
            fill,
          },
        })
      );
    } else {
      console.log('No active textbox, emitting default state');
      window.dispatchEvent(
        new CustomEvent('toolbar:format-change', {
          detail: {
            bold: false,
            italic: false,
            underline: false,
            alignment: 'left',
            textTransform: 'none',
            fontFamily: 'Roboto',
            fontSize: 16,
            fill: '#000000',
          },
        })
      );
    }
  }

  const handleToggleStyle = (
    e: CustomEvent<{ style: 'bold' | 'italic' | 'underline' }>
  ) => {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'textbox') return;

    const textbox = obj as fabric.Textbox;

    if (textbox.isEditing) {
      const start = textbox.selectionStart || 0;
      const end = textbox.selectionEnd || 0;
      if (start === end) return;

      const selStyles = textbox.getSelectionStyles(start, end, true);

      if (e.detail.style === 'bold') {
        const allBold = selStyles.every((s) => s.fontWeight === 'bold');
        const newVal = allBold ? 'normal' : 'bold';
        if (start === 0 && end === textbox.text!.length) {
          textbox.set('fontWeight', newVal);
          removeStyleProperty(textbox, 'fontWeight');
        } else {
          applyStyleToSelection(textbox, 'fontWeight', newVal);
        }
      }
      if (e.detail.style === 'italic') {
        const allItalic = selStyles.every((s) => s.fontStyle === 'italic');
        const newVal = allItalic ? 'normal' : 'italic';
        if (start === 0 && end === textbox.text!.length) {
          textbox.set('fontStyle', newVal);
          removeStyleProperty(textbox, 'fontStyle');
        } else {
          applyStyleToSelection(textbox, 'fontStyle', newVal);
        }
      }
      if (e.detail.style === 'underline') {
        const allUnderlined = selStyles.every((s) => s.underline === true);
        const newVal = !allUnderlined;
        if (start === 0 && end === textbox.text!.length) {
          textbox.set('underline', newVal);
          removeStyleProperty(textbox, 'underline');
        } else {
          applyStyleToSelection(textbox, 'underline', newVal);
        }
      }
    } else {
      if (e.detail.style === 'bold') {
        const current = textbox.fontWeight || 'normal';
        const newVal = current === 'bold' ? 'normal' : 'bold';
        textbox.set('fontWeight', newVal);
        removeStyleProperty(textbox, 'fontWeight');
      }
      if (e.detail.style === 'italic') {
        const current = textbox.fontStyle || 'normal';
        const newVal = current === 'italic' ? 'normal' : 'italic';
        textbox.set('fontStyle', newVal);
        removeStyleProperty(textbox, 'fontStyle');
      }
      if (e.detail.style === 'underline') {
        const current = textbox.underline || false;
        textbox.set('underline', !current);
        removeStyleProperty(textbox, 'underline');
      }
    }

    textbox.dirty = true;
    canvas.requestRenderAll();
    emitFormatState(textbox.selectionStart, textbox.selectionEnd);
    updateTextboxElement(textbox);
  };

  const handleFontSizeChange = (e: CustomEvent<{ size: number }>) => {
    console.log('handleFontSizeChange triggered:', e.detail);
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'textbox') {
      console.log('No active textbox, skipping font size change');
      return;
    }

    const textbox = obj as fabric.Textbox;
    const start = textbox.isEditing ? textbox.selectionStart || 0 : 0;
    const end = textbox.isEditing
      ? textbox.selectionEnd || textbox.text!.length
      : textbox.text!.length;

    if (textbox.isEditing && start !== end) {
      // Áp dụng cho vùng chọn
      applyStyleToSelection(textbox, 'fontSize', e.detail.size);
    } else {
      // Áp dụng cho toàn bộ textbox
      textbox.set('fontSize', e.detail.size);
      removeStyleProperty(textbox, 'fontSize');
    }

    textbox.dirty = true;
    canvas.requestRenderAll();
    updateTextboxElement(textbox);
    emitFormatState(start, end);
  };

  const handleFontFamilyChange = (e: CustomEvent<{ font: string }>) => {
    const font = e.detail.font;
    const active = canvas.getActiveObject();

    if (!active || active.type !== 'textbox') return;

    const textbox = active as fabric.Textbox;
    if (textbox.isEditing) {
      const start = textbox.selectionStart || 0;
      const end = textbox.selectionEnd || 0;
      if (start === end) return;

      if (textbox.isEditing && start !== end) {
        applyStyleToSelection(textbox, 'fontFamily', font);
      } else {
        textbox.set('fontFamily', font);
        removeStyleProperty(textbox, 'fontFamily');
      }
    } else {
      textbox.set('fontFamily', font);
      removeStyleProperty(textbox, 'fontFamily');
    }
    textbox.dirty = true;
    canvas.requestRenderAll();
    updateTextboxElement(textbox);
    emitFormatState();
  };

  const handleAlignElement = (
    e: CustomEvent<{ alignType: 'center-h' | 'center-v' | 'center-both' }>
  ) => {
    const active = canvas.getActiveObject();
    if (!active || !['textbox', 'image'].includes(active.type)) return;

    const obj = active as fabric.Textbox | fabric.Image;
    const zoom = canvas.getZoom();
    const canvasWidth = canvas.getWidth()! / zoom;
    const canvasHeight = canvas.getHeight()! / zoom;

    let newLeft = obj.left! / zoom; // Normalize current position
    let newTop = obj.top! / zoom;

    // Use consistent size calculations
    let objWidth: number;
    let objHeight: number;

    if (obj.type === 'textbox') {
      objWidth = (obj as fabric.Textbox).getScaledWidth() / zoom;
      objHeight = (obj as fabric.Textbox).getScaledHeight() / zoom;
    } else {
      objWidth = obj.getScaledWidth() / zoom;
      objHeight = obj.getScaledHeight() / zoom;
    }

    if (
      e.detail.alignType === 'center-h' ||
      e.detail.alignType === 'center-both'
    ) {
      newLeft = (canvasWidth - objWidth) / 2;
    }
    if (
      e.detail.alignType === 'center-v' ||
      e.detail.alignType === 'center-both'
    ) {
      newTop = (canvasHeight - objHeight) / 2;
    }

    // Apply position in canvas coordinates (account for zoom)
    obj.set({ left: newLeft * zoom, top: newTop * zoom });
    canvas.renderAll();

    // Update API with consistent payload
    if (obj.type === 'textbox') {
      updateTextboxElement(obj as fabric.Textbox);
    } else {
      updateImageElement(obj as fabric.Image);
    }
  };

  const handleTextTransform = (
    e: CustomEvent<{
      transform: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
    }>
  ) => {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'textbox') return;

    const textbox = obj as fabric.Textbox;
    let newText = textbox.text || '';

    if (textbox.isEditing) {
      const start = textbox.selectionStart || 0;
      const end = textbox.selectionEnd || 0;
      if (start === end) return;

      const selectedText = newText.slice(start, end);
      let transformedText = selectedText;
      switch (e.detail.transform) {
        case 'uppercase':
          transformedText = selectedText.toUpperCase();
          break;
        case 'lowercase':
          transformedText = selectedText.toLowerCase();
          break;
        case 'capitalize':
          transformedText =
            selectedText.charAt(0).toUpperCase() +
            selectedText.slice(1).toLowerCase();
          break;
        case 'none':
          transformedText = selectedText;
          break;
      }

      newText = newText.slice(0, start) + transformedText + newText.slice(end);
      textbox.set({ text: newText });
      textbox.setSelectionStart(start);
      textbox.setSelectionEnd(start + transformedText.length);
    } else {
      switch (e.detail.transform) {
        case 'uppercase':
          newText = newText.toUpperCase();
          break;
        case 'lowercase':
          newText = newText.toLowerCase();
          break;
        case 'capitalize':
          newText = newText
            .split(' ')
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(' ');
          break;
        case 'none':
          break;
      }
      textbox.set({ text: newText });
    }

    canvas.requestRenderAll();
    emitFormatState(textbox.selectionStart, textbox.selectionEnd);
    updateTextboxElement(textbox);
  };

  const deleteObject = () => {
    const active = canvas.getActiveObject();
    if (active) {
      canvas.remove(active);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  };

  const groupObjects = () => {
    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length || activeObjects.length < 2) return;

    const group = new fabric.Group(activeObjects);
    canvas.discardActiveObject();
    activeObjects.forEach((obj) => canvas.remove(obj));
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();
  };

  const ungroupObjects = () => {
    const activeObject = canvas.getActiveObject();

    if (!activeObject || activeObject.type !== 'group') return;

    const group = activeObject as fabric.Group;

    const objects = group.removeAll();

    canvas.remove(group);

    objects.forEach((obj) => canvas.add(obj));

    const selection = new fabric.ActiveSelection(objects, { canvas });
    canvas.setActiveObject(selection);

    canvas.requestRenderAll();
  };

  const arrangeObject = (
    action: 'bringToFront' | 'bringForward' | 'sendBackwards' | 'sendToBack'
  ) => {
    const obj = canvas.getActiveObject();
    if (!obj) return;

    // Thực hiện hành động sắp xếp
    switch (action) {
      case 'bringToFront':
        canvas.bringObjectToFront(obj);
        break;
      case 'bringForward':
        canvas.bringObjectForward(obj);
        break;
      case 'sendBackwards':
        canvas.sendObjectBackwards(obj);
        break;
      case 'sendToBack':
        canvas.sendObjectToBack(obj);
        break;
    }

    canvas.renderAll();

    // Cập nhật layerOrder cho tất cả đối tượng
    const objects = canvas.getObjects();
    const updates = objects
      .filter((o) => ['textbox', 'image'].includes(o.type!))
      .map((o, index) => {
        const slideElementId = o.get('slideElementId');
        if (!slideElementId) return null;

        const zoom = canvas.getZoom();
        const canvasWidth = canvas.getWidth()! / zoom;
        const canvasHeight = canvas.getHeight()! / zoom;
        const rawLeft = o.left! / zoom;
        const rawTop = o.top! / zoom;

        const currentElement = slideElementsRef.current.find(
          (el) => el.slideElementId === slideElementId
        );
        const displayOrder = currentElement?.displayOrder || 0;

        let payload: SlideElementPayload;

        if (o.type === 'textbox') {
          const textbox = o as fabric.Textbox;
          const w = textbox.getScaledWidth() / zoom;
          const h = textbox.getScaledHeight() / zoom;
          const fontSizePercent =
            (textbox.fontSize! / ORIGINAL_CANVAS_WIDTH) * 100;
          const textboxJson = {
            ...textbox.toJSON(),
            fontSize: fontSizePercent,
            scaleX: textbox.scaleX || 1,
            scaleY: textbox.scaleY || 1,
          };

          if (
            textboxJson.styles &&
            Object.keys(textboxJson.styles).length > 0
          ) {
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
            positionX: (rawLeft / canvasWidth) * 100,
            positionY: (rawTop / canvasHeight) * 100,
            width: (w / canvasWidth) * 100,
            height: (h / canvasHeight) * 100,
            rotation: o.angle || 0,
            layerOrder: index,
            slideElementType: 'TEXT',
            content: JSON.stringify(textboxJson),
            displayOrder: displayOrder,
          };
        } else {
          const image = o as fabric.Image;
          const w = image.getScaledWidth() / zoom;
          const h = image.getScaledHeight() / zoom;

          payload = {
            positionX: (rawLeft / canvasWidth) * 100,
            positionY: (rawTop / canvasHeight) * 100,
            width: (w / canvasWidth) * 100,
            height: (h / canvasHeight) * 100,
            rotation: o.angle || 0,
            layerOrder: index,
            slideElementType: 'IMAGE',
            sourceUrl: image.get('sourceUrl') || image.getSrc(),
            displayOrder: displayOrder,
          };
        }

        return { slideElementId, payload };
      })
      .filter(
        (
          update
        ): update is { slideElementId: string; payload: SlideElementPayload } =>
          update !== null
      );

    // Cập nhật hàng loạt tất cả phần tử
    Promise.all(
      updates.map(({ slideElementId, payload }) =>
        slidesApi.updateSlidesElement(slideId, slideElementId, payload)
      )
    )
      .then((results) => {
        console.log(
          'Đã cập nhật hàng loạt layerOrder cho tất cả phần tử:',
          results
        );

        // Tạo mảng slideElements mới với layerOrder đã cập nhật
        const updatedSlideElements = slideElementsRef.current.map((el) => {
          const update = updates.find(
            (u) => u.slideElementId === el.slideElementId
          );
          if (update) {
            return {
              ...el,
              ...update.payload,
            } as SlideElementPayload;
          }
          return el;
        });

        // Gọi onUpdate để cập nhật state
        if (onUpdate) {
          onUpdate({
            slideElements: updatedSlideElements,
          });
        }
      })
      .catch((err) => {
        console.error('Lỗi khi cập nhật hàng loạt layerOrder:', err);
      });
  };

  // Hàm để tải lại Textbox từ JSON và đảm bảo underline được áp dụng
  const loadTextboxFromJSON = (json: any) => {
    const textbox = new fabric.Textbox(json.text, json);
    if (json.underline) {
      textbox.set('underline', true);
      textbox.dirty = true; // Đánh dấu là dirty để buộc render lại
    }
    canvas.add(textbox);
    canvas.renderAll();
    return textbox;
  };

  canvas.on('text:selection:changed', (e) => {
    const tb = e.target as fabric.Textbox;
    emitFormatState(tb.selectionStart, tb.selectionEnd);
  });

  canvas.on('text:editing:entered', () => emitFormatState());
  canvas.on('text:editing:exited', () => emitFormatState());
  canvas.on('object:modified', () => emitFormatState());
  canvas.on('selection:created', () => emitFormatState());
  canvas.on('selection:updated', () => emitFormatState());

  let isAddingTextbox = false;
  let textboxAddTimeout: NodeJS.Timeout | null = null;

  const debouncedAddTextbox = (e: CustomEvent<{ slideId?: string }>) => {
    const eventSlideId = e.detail.slideId;
    console.log('eventSlideId: ', eventSlideId);
    if (eventSlideId && eventSlideId !== slideId) {
      console.log(
        `Bỏ qua fabric:add-textbox vì slideId không khớp: ${e.detail.slideId} !== ${slideId}`
      );
      return;
    }
    isAddingTextbox = true;

    if (textboxAddTimeout) {
      clearTimeout(textboxAddTimeout);
    }

    console.log('Sự kiện fabric:add-textbox được kích hoạt');
    addTextbox();

    textboxAddTimeout = setTimeout(() => {
      isAddingTextbox = false;
      textboxAddTimeout = null;
    }, 500);
  };

  window.addEventListener(
    'fabric:add-textbox',
    debouncedAddTextbox as EventListener
  );
  window.addEventListener(
    'fabric:toggle-style',
    handleToggleStyle as EventListener
  );
  window.addEventListener(
    'fabric:font-size',
    handleFontSizeChange as EventListener
  );
  window.addEventListener(
    'fabric:font-family',
    handleFontFamilyChange as EventListener
  );
  window.addEventListener('fabric:change-color', changeColor as EventListener);
  window.addEventListener('fabric:change-align', changeAlign as EventListener);
  window.addEventListener('fabric:add-image', onAddImage);
  window.addEventListener('fabric:arrange', (e: Event) => {
    const { action } = (e as CustomEvent<{ action: string }>).detail;
    arrangeObject(action as any);
  });
  window.addEventListener('fabric:add-rect', () => addShape('rect'));
  window.addEventListener('fabric:add-circle', () => addShape('circle'));
  window.addEventListener('fabric:add-triangle', () => addShape('triangle'));
  window.addEventListener('fabric:add-arrow', () => addShape('arrow'));
  window.addEventListener('fabric:group', groupObjects);
  window.addEventListener('fabric:ungroup', ungroupObjects);
  window.addEventListener('fabric:clear', clearCanvas);
  window.addEventListener('fabric:delete', deleteObject);
  window.addEventListener(
    'fabric:align-element',
    handleAlignElement as EventListener
  );
  window.addEventListener(
    'fabric:text-transform',
    handleTextTransform as EventListener
  );

  return () => {
    window.removeEventListener(
      'fabric:add-textbox',
      debouncedAddTextbox as EventListener
    );
    window.removeEventListener(
      'fabric:toggle-style',
      handleToggleStyle as EventListener
    );
    window.removeEventListener(
      'fabric:font-size',
      handleFontSizeChange as EventListener
    );
    window.removeEventListener(
      'fabric:font-family',
      handleFontFamilyChange as EventListener
    );
    window.removeEventListener(
      'fabric:change-color',
      changeColor as EventListener
    );
    window.removeEventListener(
      'fabric:change-align',
      changeAlign as EventListener
    );
    window.removeEventListener('fabric:add-image', onAddImage);
    window.removeEventListener('fabric:arrange', (e: Event) => {
      const { action } = (e as CustomEvent<{ action: string }>).detail;
      arrangeObject(action as any);
    });
    window.removeEventListener('fabric:add-rect', () => addShape('rect'));
    window.removeEventListener('fabric:add-circle', () => addShape('circle'));
    window.removeEventListener('fabric:add-triangle', () =>
      addShape('triangle')
    );
    window.removeEventListener('fabric:add-arrow', () => addShape('arrow'));
    window.removeEventListener('fabric:group', groupObjects);
    window.removeEventListener('fabric:ungroup', ungroupObjects);
    window.removeEventListener('fabric:clear', clearCanvas);
    window.removeEventListener('fabric:delete', deleteObject);
    window.removeEventListener(
      'fabric:align-element',
      handleAlignElement as EventListener
    );
    window.removeEventListener(
      'fabric:text-transform',
      handleTextTransform as EventListener
    );
  };
};

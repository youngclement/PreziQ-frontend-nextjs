import * as fabric from 'fabric';
import { createGradientFill } from './fabricHelpers';
import WebFont from 'webfontloader';

export const ToolbarHandlers = (
  canvas: fabric.Canvas,
  title: fabric.Textbox,
  content: fabric.Textbox
) => {
  const addTextbox = () => {
    const textbox = new fabric.Textbox('New Text', {
      left: 150,
      top: 250,
      fontSize: 20,
      width: 300,
    });
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
  };

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

  const changeColor = (e: CustomEvent<{ color?: string; gradient?: any }>) => {
    const active = canvas.getActiveObjects();
    active.forEach((obj) => {
      if ('set' in obj) {
        const fill = e.detail.gradient
          ? createGradientFill(obj, e.detail.gradient)
          : e.detail.color;
        obj.set('fill', fill);
        obj.dirty = true;
      }
    });
    canvas.requestRenderAll();
  };

  const changeAlign = (
    e: CustomEvent<{ align: fabric.Textbox['textAlign'] }>
  ) => {
    const active = canvas.getActiveObject();
    if (active && active.type === 'textbox') {
      (active as fabric.Textbox).set({ textAlign: e.detail.align });
      canvas.renderAll();
    }
  };

  const clearCanvas = () => {
    canvas.getObjects().forEach((obj) => {
      if (obj !== title && obj !== content) canvas.remove(obj);
    });
    canvas.renderAll();
  };

  const handleToggleStyle = (
    e: CustomEvent<{ style: 'bold' | 'italic' | 'underline' }>
  ) => {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'textbox') return;

    const textbox = obj as fabric.Textbox;

    if (e.detail.style === 'bold') {
      const current = textbox.fontWeight;
      textbox.set('fontWeight', current === 'bold' ? 'normal' : 'bold');
    }

    if (e.detail.style === 'italic') {
      const current = textbox.fontStyle;
      textbox.set('fontStyle', current === 'italic' ? 'normal' : 'italic');
    }

    if (e.detail.style === 'underline') {
      textbox.set('underline', !textbox.underline);
    }

    canvas.requestRenderAll();
  };

  const handleFontSizeChange = (e: CustomEvent<{ size: number }>) => {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'textbox') {
      (obj as fabric.Textbox).set('fontSize', e.detail.size);
      canvas.requestRenderAll();
    }
  };

  const handleFontFamilyChange = (e: CustomEvent<{ font: string }>) => {
    const font = e.detail.font;
    const active = canvas.getActiveObject();

    if (!active) return;

    if (active.type === 'activeselection') {
      // Đổi font cho tất cả object trong selection
      (active as fabric.ActiveSelection).getObjects().forEach((obj) => {
        if (obj.type === 'textbox') {
          (obj as fabric.Textbox).set('fontFamily', font);
        }
      });

      canvas.requestRenderAll();
    }

    // ✅ Đổi font cho 1 textbox
    else if (active.type === 'textbox') {
      (active as fabric.Textbox).set('fontFamily', font);
      canvas.requestRenderAll();
    }

    // ❗ Nếu đang là 'group' thì KHÔNG xử lý được
    else if (active.type === 'group') {
      alert('Hãy ungroup trước khi chỉnh font');
    }
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

    // Tách các object ra khỏi group
    const objects = group.removeAll();

    // Remove group khỏi canvas
    canvas.remove(group);

    // Add lại từng object vào canvas
    objects.forEach((obj) => canvas.add(obj));

    // Tạo selection từ các object mới add
    const selection = new fabric.ActiveSelection(objects, { canvas });
    canvas.setActiveObject(selection);

    canvas.requestRenderAll();
  };

  const arrangeObject = (
    action: 'bringToFront' | 'bringForward' | 'sendBackwards' | 'sendToBack'
  ) => {
    const obj = canvas.getActiveObject();
    if (!obj) return;

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

    canvas.requestRenderAll();
  };

  window.addEventListener('fabric:add-text', addTextbox);
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
  window.addEventListener('fabric:arrange', (e: Event) => {
    const { action } = (e as CustomEvent<{ action: string }>).detail;
    arrangeObject(action as any);
  });
  window.addEventListener('fabric:add-rect', () => addShape('rect'));
  window.addEventListener('fabric:add-circle', () => addShape('circle'));
  window.addEventListener('fabric:add-triangle', () => addShape('triangle'));
  window.addEventListener('fabric:add-arrow', () => addShape('arrow'));
  window.addEventListener('fabric:change-color', changeColor as EventListener);
  window.addEventListener('fabric:change-align', changeAlign as EventListener);
  window.addEventListener('fabric:group', groupObjects);
  window.addEventListener('fabric:ungroup', ungroupObjects);
  window.addEventListener('fabric:clear', clearCanvas);
  window.addEventListener('fabric:delete', deleteObject);
};

import * as fabric from 'fabric';

export const initFabricEvents = (
  canvas: fabric.Canvas,
  onUpdate: (data: { title: string; content: string }) => void
) => {
  const title = new fabric.Textbox('Slide Title', {
    left: 100,
    top: 50,
    fontSize: 28,
    fontWeight: 'bold',
    width: 600,
  });

  const content = new fabric.Textbox('Slide Content...', {
    left: 100,
    top: 150,
    fontSize: 20,
    width: 600,
  });

  canvas.add(title);
  canvas.add(content);

  const updateSlide = () => {
    onUpdate({
      title: title.text || '',
      content: content.text || '',
    });
  };

  canvas.on('text:changed', updateSlide);
  canvas.on('object:modified', updateSlide);

  
  return { title, content };
};

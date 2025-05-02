import * as fabric from 'fabric';

export const createGradientFill = (
  obj: fabric.Object,
  gradient: { stops: string[]; direction: string }
) => {
  const { stops, direction } = gradient;

  return new fabric.Gradient({
    type: 'linear',
    gradientUnits: 'pixels',
    coords:
      direction === 'horizontal'
        ? { x1: 0, y1: 0, x2: obj.width || 100, y2: 0 }
        : { x1: 0, y1: 0, x2: 0, y2: obj.height || 100 },
    colorStops: stops.map((color, index) => ({
      offset: index / (stops.length - 1),
      color,
    })),
  });
};

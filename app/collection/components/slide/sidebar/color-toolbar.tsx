'use client';

const solidColors = [
  '#000000',
  '#555555',
  '#777777',
  '#999999',
  '#cccccc',
  '#ffffff',
  '#ff0000',
  '#ff66a3',
  '#ff99ff',
  '#cc99ff',
  '#9966ff',
  '#3300cc',
  '#009999',
  '#00ccff',
  '#66ffff',
  '#66ccff',
  '#3399ff',
  '#003399',
  '#00cc66',
  '#99cc33',
  '#ccff66',
  '#ffcc33',
  '#ffaa33',
  '#ff9933',
];

const gradientColors = [
  'linear-gradient(to right, #000000, #444444)',
  'linear-gradient(to right, #7a4f01, #ffba00)',
  'linear-gradient(to right, #000428, #004e92)',
  'linear-gradient(to right, #e0eafc, #cfdef3)',
  'linear-gradient(to right, #fceabb, #f8b500)',
  'linear-gradient(to right, #89f7fe, #66a6ff)',
  'linear-gradient(to right, #ff416c, #ff4b2b)',
  'linear-gradient(to right, #ff9a9e, #fad0c4)',
  'linear-gradient(to right, #a18cd1, #fbc2eb)',
  'linear-gradient(to right, #c2e9fb, #a1c4fd)',
  'linear-gradient(to right, #84fab0, #8fd3f4)',
  'linear-gradient(to right, #fccb90, #d57eeb)',
  'linear-gradient(to right, #f6d365, #fda085)',
  'linear-gradient(to right, #ff9a9e, #fecfef)',
];

const parseGradientStops = (gradient: string): string[] => {
  const match = gradient.match(/linear-gradient$$to (right|left), (.+)$$/);
  if (!match) return [];
  return match[2].split(',').map((c) => c.trim());
};

const ColorCircle = ({
  color,
  isGradient = false,
  gradientStops,
}: {
  color: string;
  isGradient?: boolean;
  gradientStops?: string[];
}) => {
  const handleClick = () => {
    if (isGradient && gradientStops) {
      const event = new CustomEvent('fabric:change-color', {
        detail: {
          gradient: {
            stops: gradientStops,
            direction: 'horizontal',
          },
        },
      });
      window.dispatchEvent(event);
    } else {
      const event = new CustomEvent('fabric:change-color', {
        detail: { color },
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="w-8 h-8 rounded-full cursor-pointer border border-gray-300 hover:scale-110 transition-transform"
      style={{
        background: isGradient ? color : undefined,
        backgroundColor: isGradient ? undefined : color,
      }}
    />
  );
};

export default function ColorPalette() {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">Màu đồng nhất</h4>
        <div className="grid grid-cols-6 gap-2">
          {solidColors.map((color, index) => (
            <ColorCircle key={index} color={color} />
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mt-4 mb-2">Màu gradient</h4>
        <div className="grid grid-cols-6 gap-2">
          {gradientColors.map((gradient, index) => (
            <ColorCircle
              key={index}
              color={gradient}
              isGradient
              gradientStops={parseGradientStops(gradient)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

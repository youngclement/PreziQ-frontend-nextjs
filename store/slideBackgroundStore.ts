// 📁 src/store/slideBackgroundStore.ts
import create from 'zustand';

interface SlideBackground {
  backgroundImage: string;
  backgroundColor: string;
}

interface SlideBackgroundStore {
  backgrounds: Record<string, SlideBackground>;
  setBackground: (slideId: string, bg: SlideBackground) => void;
  getBackground: (slideId: string) => SlideBackground | undefined;
}

export const useSlideBackgroundStore = create<SlideBackgroundStore>(
  (set, get) => ({
    backgrounds: {},
    setBackground: (slideId, bg) => {
      set((state) => ({
        backgrounds: {
          ...state.backgrounds,
          [slideId]: bg,
        },
      }));
    },
    getBackground: (slideId) => get().backgrounds[slideId],
  })
);

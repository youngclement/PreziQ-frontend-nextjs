// 1) Định nghĩa phần chung
interface BaseSlideElementPayload {
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  layerOrder: number;

  entryAnimation?: string;
  entryAnimationDuration?: number;
  entryAnimationDelay?: number;
  exitAnimation?: string;
  exitAnimationDuration?: number;
  exitAnimationDelay?: number;
}

export type SlideElementPayload = BaseSlideElementPayload &
  (
    | {
        slideElementType: 'TEXT';
        content: string;
        sourceUrl?: never;
      }
    | {
        slideElementType: 'IMAGE';
        sourceUrl: string;
        content?: never;
      }
  );

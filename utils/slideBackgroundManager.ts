// src/utils/slideBackgroundManager.ts

export interface SlideBg {
  backgroundImage: string;
  backgroundColor: string;
}

class SlideBackgroundManager {
  private store: Record<string, SlideBg> = {};

  /** Lấy bg hiện tại (khởi tạo nếu chưa có) */
  get(activityId: string): SlideBg {
    if (!this.store[activityId]) {
      this.store[activityId] = {
        backgroundImage: '',
        backgroundColor: '#FFFFFF',
      };
    }
    return this.store[activityId];
  }

  /**
   * Cập nhật bg; nếu user chỉ đổi màu thì pass { backgroundColor: .., backgroundImage: '' }
   * và ngược lại khi đổi ảnh thì pass { backgroundImage: .., backgroundColor: '' }
   */
  set(activityId: string, props: Partial<SlideBg>) {
    const prev = this.get(activityId);
    this.store[activityId] = {
      backgroundImage:
        props.backgroundImage !== undefined
          ? props.backgroundImage
          : prev.backgroundImage,
      backgroundColor:
        props.backgroundColor !== undefined
          ? props.backgroundColor
          : prev.backgroundColor,
    };
  }
}

export const slideBackgroundManager = new SlideBackgroundManager();

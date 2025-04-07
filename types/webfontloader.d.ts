declare module 'webfontloader' {
  interface WebFontConfig {
    google?: {
      families: string[];
    };
    custom?: {
      families: string[];
      urls?: string[];
    };
    active?: () => void;
    inactive?: () => void;
    fontloading?: (familyName: string, fvd: string) => void;
    fontactive?: (familyName: string, fvd: string) => void;
    fontinactive?: (familyName: string, fvd: string) => void;
  }

  const WebFont: {
    load(config: WebFontConfig): void;
  };

  export default WebFont;
}

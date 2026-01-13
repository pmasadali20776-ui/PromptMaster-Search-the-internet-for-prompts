
export interface ImagePrompt {
  title: string;
  prompt: string;
  source: string;
  tags?: string[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface GeneratedImage {
  url: string;
  base64: string;
  prompt: string;
}

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  hue: number;
  vibrance: number;
  sharpness: number;
}

export type ThemeMode = 'dark' | 'bright';
export type ConnectionStatus = 'checking' | 'online' | 'offline' | 'error' | 'throttled';

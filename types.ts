
export interface StoryPage {
  page: 'Capa' | number;
  title?: string | null;
  narrative: string;
  image_prompt: string;
  imageUrl?: string;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

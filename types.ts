export interface StoryPage {
  page: 'Capa' | number;
  title?: string | null;
  narrative: string;
  image_prompt: string;
  imageUrl?: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
    webkitAudioContext?: typeof AudioContext;
  }
}
export interface StoryPage {
  page: 'Capa' | number;
  title?: string | null;
  narrative: string;
  image_prompt: string;
  imageUrl?: string;
}

declare global {
  // FIX: The TypeScript error "Subsequent property declarations must have the same
  // type" for `window.aistudio` indicates a conflict with another global
  // declaration that uses a named type `AIStudio`. To resolve this, we define
  // the `AIStudio` interface here and use it, ensuring all declarations for
  // `window.aistudio` are compatible and can be merged.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // FIX: Added the `readonly` modifier to resolve the "All declarations of 'aistudio' must have identical modifiers" error.
    readonly aistudio: AIStudio;
    webkitAudioContext: typeof AudioContext;
  }
}

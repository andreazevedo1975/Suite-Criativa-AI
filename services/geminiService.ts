// FIX: Replaced the non-exported `VideosOperation` type with the correct `Lro` type for long-running operations.
import { GoogleGenAI, Type, Modality, GenerateContentResponse, GenerateImagesResponse, Lro } from "@google/genai";
import { StoryPage } from '../types';

// Helper function to pause execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Wrapper function to handle rate limiting with exponential backoff
const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> => {
    let delay = initialDelay;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiCall();
        } catch (error: any) {
            // Check if the error is a rate limit error (often status 429)
            // The Gemini API client might not expose status codes directly, so we check the message.
            const isRateLimitError = error.message?.includes('429') || error.message?.toLowerCase().includes('quota');

            if (isRateLimitError && i < maxRetries - 1) {
                console.warn(`Rate limit hit. Retrying in ${delay}ms...`);
                await sleep(delay);
                delay *= 2; // Exponential backoff
            } else {
                let userFriendlyError = "Ocorreu um erro ao se comunicar com a API.";
                if (isRateLimitError) {
                    userFriendlyError = "Você excedeu sua cota de API. Por favor, verifique seu plano e detalhes de faturamento ou tente novamente mais tarde. Para mais informações, acesse: https://ai.google.dev/gemini-api/docs/rate-limits";
                } else if (error.message) {
                    userFriendlyError = error.message;
                }
                throw new Error(userFriendlyError);
            }
        }
    }
    // This line should theoretically not be reached
    throw new Error("Falha na chamada à API após múltiplas tentativas.");
};


// This function creates a new AI client.
// It's used for Veo models to ensure the latest API key is picked up after user selection.
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// BUG FIX: Encapsulate video polling logic to avoid code duplication and improve maintainability.
const pollVideoOperation = async (initialOperation: Lro): Promise<string> => {
    const localAi = getAIClient();
    let operation = initialOperation;

    while (!operation.done) {
        await sleep(5000); // Wait 5 seconds between polls
        try {
            operation = await withRetry(() => localAi.operations.getVideosOperation({ operation }));
        } catch (e: any) {
            console.error("Polling failed:", e);
            throw new Error("A verificação do status da geração do vídeo falhou.");
        }
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Falha ao obter o link de download do vídeo após a conclusão.");

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error("Não foi possível baixar o vídeo gerado.");
    }
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
}

const ai = getAIClient();

const storySchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'O título principal do livro de histórias.' },
    pages: {
      type: Type.ARRAY,
      description: 'Uma série de páginas para o livro de histórias.',
      items: {
        type: Type.OBJECT,
        properties: {
          page: { type: Type.STRING, description: 'O número da página ou "Capa" para a primeira página.' },
          narrative: { type: Type.STRING, description: 'O texto da história para esta página. Deve ser envolvente para uma criança.' },
          image_prompt: { type: Type.STRING, description: 'Um comando detalhado e imaginativo para um gerador de imagens de IA criar uma ilustração para esta página. O estilo deve ser consistente em todo o livro.' }
        },
        required: ['page', 'narrative', 'image_prompt']
      }
    }
  },
  required: ['title', 'pages']
};

// BUG FIX: Added types for the storybook response to avoid using `any` and make parsing safer.
interface StoryPageData {
    page: string;
    narrative: string;
    image_prompt: string;
}
interface StoryDataResponse {
    title: string;
    pages: StoryPageData[];
}


export const createStorybook = async (topic: string, numPages: number): Promise<Omit<StoryPage, 'imageUrl'>[]> => {
    const prompt = `Crie um pequeno livro de histórias para crianças sobre "${topic}".
    A história deve ter uma capa e ${numPages} páginas de história.
    Para cada página, forneça uma narrativa e um comando de imagem detalhado e criativo para gerar uma ilustração.
    O tom deve ser divertido, envolvente e apropriado para crianças pequenas.
    O estilo de arte deve ser 'livro de histórias infantil fofo, arte digital colorida'.`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: storySchema,
        },
    }));

    const storyData: StoryDataResponse = JSON.parse(response.text);
    
    // BUG FIX: Make page finding case-insensitive and handle parsing more robustly.
    const coverPageData = storyData.pages.find(p => p.page.toLowerCase() === 'capa');

    const coverPage: Omit<StoryPage, 'imageUrl'> = {
        page: 'Capa',
        title: storyData.title,
        narrative: `Uma história sobre ${topic}`,
        image_prompt: coverPageData?.image_prompt || `Capa de livro de histórias infantil fofa para uma história sobre ${topic}, título: "${storyData.title}", arte digital colorida`,
    };
    
    const storyPages: Omit<StoryPage, 'imageUrl'>[] = storyData.pages
      .filter(p => p.page.toLowerCase() !== 'capa')
      .map((p, index) => ({
          page: index + 1,
          narrative: p.narrative,
          image_prompt: p.image_prompt,
      }));

    return [coverPage, ...storyPages];
};

export const generateStoryPageImage = async (prompt: string): Promise<string> => {
    const response: GenerateImagesResponse = await withRetry(() => ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `${prompt}, estilo de livro de histórias infantil fofo, arte digital colorida`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    }));

    return response.generatedImages[0].image.imageBytes;
};

export const generateImage = async (prompt: string): Promise<string> => {
    const response: GenerateImagesResponse = await withRetry(() => ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    }));

    return response.generatedImages[0].image.imageBytes;
};

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64ImageData,
                        mimeType: mimeType,
                    },
                },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }));
    
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData) {
        return part.inlineData.data;
    }
    throw new Error("Nenhuma imagem editada foi retornada pela API.");
};


export const generateVideoFromText = async (prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> => {
    const localAi = getAIClient();
    const initialOperation: Lro = await withRetry(() => localAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    }));
    return await pollVideoOperation(initialOperation);
};

export const generateVideoFromImage = async (base64Image: string, mimeType: string, prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> => {
    const localAi = getAIClient();
    const initialOperation: Lro = await withRetry(() => localAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
            imageBytes: base64Image,
            mimeType: mimeType,
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    }));
    return await pollVideoOperation(initialOperation);
};

export const analyzeImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64ImageData,
                        mimeType: mimeType,
                    },
                },
                { text: prompt },
            ]
        },
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    }));

    return response.text;
};

export const analyzeVideoFrames = async (frames: { data: string, mimeType: string }[], prompt: string): Promise<string> => {
    const imageParts = frames.map(frame => ({
        inlineData: {
            data: frame.data,
            mimeType: frame.mimeType,
        }
    }));

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: {
            parts: [
                ...imageParts,
                { text: prompt },
            ]
        },
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    }));

    return response.text;
};

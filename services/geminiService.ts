// FIX: Replaced the non-exported `VideosOperation` type with the correct `Lro` type for long-running operations.
import { GoogleGenAI, Type, Modality, GenerateContentResponse, GenerateImagesResponse, Lro } from "@google/genai";
import { StoryPage } from '../types';

// Helper function to pause execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Wrapper function to handle rate limiting with exponential backoff
// INCREASED RETRIES AND DELAY to handle "Quota Exceeded" errors more robustly
const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 8, initialDelay = 4000): Promise<T> => {
    let delay = initialDelay;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiCall();
        } catch (error: any) {
            // Check if the error is a rate limit error (status 429) or Service Unavailable (503)
            // The Gemini API client might return different error structures, so we check various properties.
            const errorMessage = error.message?.toLowerCase() || '';
            const isRateLimitError = errorMessage.includes('429') || 
                                     errorMessage.includes('quota') || 
                                     errorMessage.includes('resource_exhausted');
            const isServerBusy = errorMessage.includes('503') || errorMessage.includes('overloaded');

            if ((isRateLimitError || isServerBusy) && i < maxRetries - 1) {
                console.warn(`API Error (${isRateLimitError ? 'Rate Limit' : 'Server Busy'}). Retrying in ${delay}ms...`);
                await sleep(delay);
                // Add a small jitter to avoid thundering herd if multiple requests retry at once
                const jitter = Math.random() * 500;
                delay = Math.min(delay * 1.5 + jitter, 60000); // Exponential backoff capped at 60s
            } else {
                // If it's the last retry or a different error, throw user-friendly message
                let userFriendlyError = "Ocorreu um erro ao se comunicar com a API.";
                
                if (isRateLimitError) {
                    userFriendlyError = "Você excedeu sua cota de API. Por favor, verifique seu plano e detalhes de faturamento ou tente novamente mais tarde. Para mais informações, acesse: https://ai.google.dev/gemini-api/docs/rate-limits";
                } else if (isServerBusy) {
                    userFriendlyError = "Os servidores da IA estão sobrecarregados no momento. Tentando novamente...";
                } else if (error.message) {
                    userFriendlyError = error.message;
                }
                
                // Only throw if we are done retrying
                if (i === maxRetries - 1) {
                    throw new Error(userFriendlyError);
                }
            }
        }
    }
    // This line should theoretically not be reached due to the throw inside the loop
    throw new Error("Falha na chamada à API após múltiplas tentativas.");
};


// This function creates a new AI client.
// It's used to ensure the latest API key is picked up after user selection.
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// BUG FIX: Encapsulate video polling logic to avoid code duplication and improve maintainability.
const pollVideoOperation = async (initialOperation: Lro): Promise<string> => {
    let operation = initialOperation;

    while (!operation.done) {
        await sleep(5000); // Wait 5 seconds between polls
        try {
            operation = await withRetry(() => getAIClient().operations.getVideosOperation({ operation }));
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


export const createStorybook = async (
    topic: string, 
    numPages: number,
    typography: string = "Legível e Moderna",
    coverStyle: string = "Livro infantil colorido e fofo",
    coverFormat: string = "Capa Digital Padrão"
): Promise<Omit<StoryPage, 'imageUrl'>[]> => {
    const prompt = `Crie um pequeno livro de histórias para crianças sobre "${topic}".
    A história deve ter uma capa e ${numPages} páginas de história.
    
    Diretrizes de Estilo:
    1. Estilo Visual Geral (Arte): "${coverStyle}". Incorpore palavras-chave deste estilo em TODOS os 'image_prompt'.
    2. Estilo Tipográfico Sugerido (Conceito): "${typography}". O título e o clima da narrativa devem combinar com esta vibração.
    3. Formato/Modelo da Capa (Apenas para a página 'Capa'): "${coverFormat}". A descrição visual da capa deve incluir explicitamente características deste formato físico ou digital.
    
    Para cada página, forneça uma narrativa e um comando de imagem (image_prompt) detalhado.
    O 'image_prompt' deve descrever a cena visualmente, mencionando o estilo artístico "${coverStyle}".
    O tom da narrativa deve ser divertido, envolvente e apropriado para crianças pequenas.`;

    // CHANGED: Switched from 'gemini-3-pro-preview' to 'gemini-2.5-flash'
    // Reason: 'gemini-2.5-flash' has significantly higher rate limits (RPM/TPM) than 3-pro on the free tier,
    // reducing "Quota Exceeded" errors while still providing excellent quality for creative writing.
    const response: GenerateContentResponse = await withRetry(() => getAIClient().models.generateContent({
        model: 'gemini-2.5-flash',
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
        image_prompt: coverPageData?.image_prompt || `Capa de livro de histórias infantil, estilo ${coverStyle}, formato ${coverFormat}, título: "${storyData.title}", arte digital vibrante`,
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
    const response: GenerateImagesResponse = await withRetry(() => getAIClient().models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `${prompt}, high quality, detailed, children's book illustration`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    }));

    return response.generatedImages[0].image.imageBytes;
};

export const generateImage = async (prompt: string, aspectRatio: string = '1:1'): Promise<string> => {
    const response: GenerateImagesResponse = await withRetry(() => getAIClient().models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio,
        },
    }));

    return response.generatedImages[0].image.imageBytes;
};

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const response: GenerateContentResponse = await withRetry(() => getAIClient().models.generateContent({
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
    
    // FIX: Iterate through parts to find the image part, as it might not be the first one.
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
    }
    throw new Error("Nenhuma imagem editada foi retornada pela API.");
};


export const generateVideoFromText = async (prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> => {
    const initialOperation: Lro = await withRetry(() => getAIClient().models.generateVideos({
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
    const initialOperation: Lro = await withRetry(() => getAIClient().models.generateVideos({
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
    // Kept 3-pro here as logic/analysis benefits from the larger model, 
    // but the updated withRetry logic will handle the rate limits better.
    const response: GenerateContentResponse = await withRetry(() => getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
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

    const response: GenerateContentResponse = await withRetry(() => getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
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
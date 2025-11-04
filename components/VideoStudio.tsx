import React, { useState, useCallback, useEffect } from 'react';
import { generateVideoFromText, generateVideoFromImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import ApiKeySelector from './ApiKeySelector';
import Loader from './Loader';

type VideoTab = 'fromText' | 'fromImage';

const loadingMessages = [
    "Criando sua obra-prima em vídeo...",
    "Isso pode levar alguns minutos, aguarde!",
    "Reunindo pixels e organizando-os perfeitamente...",
    "A IA está fazendo sua mágica...",
    "Finalizando o corte do diretor...",
];

interface VideoStudioContentProps {
  resetApiKey?: () => void;
}

const VideoStudioContent: React.FC<VideoStudioContentProps> = ({ resetApiKey }) => {
  const [activeTab, setActiveTab] = useState<VideoTab>('fromText');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  
  useEffect(() => {
    let interval: number;
    if (loading) {
      interval = window.setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // BUG FIX: Clean up object URLs to prevent memory leaks.
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [imageUrl, videoUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (imageUrl) URL.revokeObjectURL(imageUrl); // Revoke old image URL
    if (videoUrl) URL.revokeObjectURL(videoUrl); // Also clear old video
    
    if (file) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setVideoUrl(null);
    } else {
      setImageFile(null);
      setImageUrl(null);
    }
  };

  const handleSubmit = useCallback(async () => {
    setError(null);
    if(videoUrl) URL.revokeObjectURL(videoUrl); // Revoke previous video URL
    setVideoUrl(null);
    setLoading(true);
    setLoadingMessage(loadingMessages[0]);

    try {
      let url;
      if (activeTab === 'fromImage') {
        if (!imageFile) throw new Error("Por favor, selecione uma imagem.");
        const base64Image = await fileToBase64(imageFile);
        url = await generateVideoFromImage(base64Image, imageFile.type, prompt, aspectRatio);
      } else {
        if (!prompt) throw new Error("Por favor, insira um comando.");
        url = await generateVideoFromText(prompt, aspectRatio);
      }
      setVideoUrl(url);
    } catch (e: any) {
      console.error(e);
      let errorMessage = e.message || "Falha ao gerar o vídeo. Por favor, tente novamente.";
      if (e.message?.includes("Requested entity was not found")) {
        errorMessage = "Chave de API não encontrada ou inválida. Por favor, selecione uma chave válida.";
        resetApiKey?.();
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [prompt, aspectRatio, activeTab, imageFile, resetApiKey, videoUrl]);

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl h-fit">
        <div className="flex border-b border-gray-700 mb-6">
          <button onClick={() => setActiveTab('fromText')} className={`px-4 py-2 font-medium ${activeTab === 'fromText' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}>A partir de Texto</button>
          <button onClick={() => setActiveTab('fromImage')} className={`px-4 py-2 font-medium ${activeTab === 'fromImage' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}>A partir de Imagem</button>
        </div>
        
        {error && <p className="bg-red-900/50 text-red-300 p-3 rounded-md mb-4">{error}</p>}

        <div className="space-y-4">
          {activeTab === 'fromImage' && (
            <div>
              <label htmlFor="video-image-upload" className="block text-sm font-medium text-gray-300 mb-2">Carregar Imagem Inicial</label>
              <input
                id="video-image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
              />
            </div>
          )}
          <div>
            <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-300 mb-2">Comando</label>
            <textarea
              id="video-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Um holograma de neon de um gato dirigindo em alta velocidade"
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300 mb-2">Proporção da Tela</label>
            <select
              id="aspect-ratio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="16:9">16:9 (Paisagem)</option>
              <option value="9:16">9:16 (Retrato)</option>
            </select>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 text-white font-bold py-3 px-4 rounded-md transition">
            {loading ? 'Gerando...' : 'Gerar Vídeo'}
          </button>
        </div>
      </div>
      
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl flex items-center justify-center min-h-[400px]">
        {loading ? <Loader message={loadingMessage} /> : 
         videoUrl ? (
            <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-full rounded-md" />
         ) : imageUrl ? (
            <img src={imageUrl} alt="Quadro inicial" className="max-w-full max-h-[400px] rounded-md" />
         ) : (
            <p className="text-gray-500">Seu vídeo gerado aparecerá aqui</p>
         )
        }
      </div>
    </div>
  );
};

const VideoStudio: React.FC = () => (
  <ApiKeySelector>
    <VideoStudioContent />
  </ApiKeySelector>
);

export default VideoStudio;
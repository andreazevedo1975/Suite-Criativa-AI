import React, { useState, useCallback, useEffect, useRef } from 'react';
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

  // Video controls state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
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

  // Clean up object URLs to prevent memory leaks.
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [imageUrl, videoUrl]);

  // Reset video controls when new video loads
  useEffect(() => {
    if (videoUrl) {
        setIsPlaying(true);
        setIsMuted(false);
    }
  }, [videoUrl]);

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

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

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
            <div className="flex flex-col items-center w-full max-w-full">
                <video 
                    ref={videoRef}
                    src={videoUrl} 
                    autoPlay 
                    loop 
                    className="max-w-full max-h-[500px] rounded-md shadow-lg"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />
                <div className="flex gap-4 mt-6">
                    <button 
                        onClick={togglePlay}
                        className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-full transition-colors duration-200"
                    >
                        {isPlaying ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>Pausar</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                <span>Tocar</span>
                            </>
                        )}
                    </button>
                    <button 
                        onClick={toggleMute}
                        className={`flex items-center space-x-2 font-medium py-2 px-6 rounded-full transition-colors duration-200 ${isMuted ? 'bg-red-900/50 text-red-200 hover:bg-red-900/70' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                    >
                        {isMuted ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <span>Ativar Som</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                </svg>
                                <span>Mudo</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
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
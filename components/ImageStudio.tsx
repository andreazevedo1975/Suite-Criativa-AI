import React, { useState, useCallback, useEffect } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import Loader from './Loader';

type StudioTab = 'text-to-image' | 'edit';

const randomPrompts = [
  "Uma cidade futurista feita de cristal flutuando nas nuvens ao pôr do sol",
  "Um pequeno robô jardineiro regando flores bioluminescentes em um planeta alienígena",
  "Um retrato a óleo de um gato vestindo roupas reais do século 18, detalhado",
  "Uma cabana aconchegante na floresta durante uma nevasca, estilo pixel art isométrico",
  "Um dragão oriental feito de fumaça e relâmpagos sobrevoando um oceano tempestuoso",
  "Uma biblioteca infinita com livros voadores e escadas em espiral, estilo surrealista",
  "Um cyberpunk street food vendor servindo neon noodles na chuva"
];

const ImageStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudioTab>('text-to-image');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // BUG FIX: Clean up object URLs to prevent memory leaks.
  useEffect(() => {
    return () => {
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl);
      }
    };
  }, [originalImageUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl); // Revoke the old URL
    }
    if (file) {
      setImageFile(file);
      setOriginalImageUrl(URL.createObjectURL(file));
      setGeneratedImageUrl(null);
    } else {
      setImageFile(null);
      setOriginalImageUrl(null);
    }
  };

  const handleRandomPrompt = () => {
    const random = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
    setPrompt(random);
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt) {
      setError("Por favor, insira um comando.");
      return;
    }
    setError(null);
    setLoading(true);
    setGeneratedImageUrl(null);
    try {
      const base64Image = await generateImage(prompt, aspectRatio);
      setGeneratedImageUrl(`data:image/png;base64,${base64Image}`);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Falha ao gerar a imagem. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [prompt, aspectRatio]);

  const handleEdit = useCallback(async () => {
    if (!prompt || !imageFile) {
      setError("Por favor, carregue uma imagem e insira um comando de edição.");
      return;
    }
    setError(null);
    setLoading(true);
    setGeneratedImageUrl(null);
    try {
      const base64Image = await fileToBase64(imageFile);
      const editedBase64 = await editImage(base64Image, imageFile.type, prompt);
      setGeneratedImageUrl(`data:image/png;base64,${editedBase64}`);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Falha ao editar a imagem. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [prompt, imageFile]);

  const renderTextToImageTab = () => (
    <>
      <div className="mb-4">
        <label htmlFor="generate-prompt" className="block text-sm font-medium text-gray-300 mb-2">Descrição da Imagem (Prompt)</label>
        <div className="relative">
            <textarea
            id="generate-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Um majestoso gato astronauta flutuando no espaço, arte digital"
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition pr-10"
            rows={3}
            />
            <button 
                onClick={handleRandomPrompt}
                className="absolute top-2 right-2 text-gray-400 hover:text-purple-400 transition-colors p-1"
                title="Gerar prompt aleatório"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.312-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.312.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
        <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">Dica: Seja detalhado sobre luz, estilo e composição.</span>
            <button onClick={handleRandomPrompt} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                🎲 Surpreenda-me
            </button>
        </div>
      </div>
      
      <div className="mb-6">
        <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300 mb-2">Proporção (Aspect Ratio)</label>
        <select
            id="aspect-ratio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        >
            <option value="1:1">1:1 (Quadrado)</option>
            <option value="16:9">16:9 (Paisagem)</option>
            <option value="9:16">9:16 (Retrato - Stories)</option>
            <option value="4:3">4:3 (Foto Padrão)</option>
            <option value="3:4">3:4 (Retrato Padrão)</option>
        </select>
      </div>

      <button onClick={handleGenerate} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 text-white font-bold py-3 px-4 rounded-md transition shadow-lg hover:shadow-indigo-500/30">
        {loading ? 'Gerando...' : 'Gerar Imagem'}
      </button>
    </>
  );

  const renderEditTab = () => (
    <>
      <div className="mb-4">
        <label htmlFor="image-upload" className="block text-sm font-medium text-gray-300 mb-2">Carregar Imagem</label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="edit-prompt" className="block text-sm font-medium text-gray-300 mb-2">Instruções de Edição</label>
        <textarea
          id="edit-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Adicione um filtro retrô, troque o fundo por uma praia, remova a pessoa..."
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          rows={3}
        />
      </div>
      <button onClick={handleEdit} disabled={loading || !imageFile} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition">
        {loading ? 'Editando...' : 'Editar Imagem'}
      </button>
    </>
  );
  
  const hasResult = originalImageUrl || generatedImageUrl;

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl h-fit">
        <div className="flex border-b border-gray-700 mb-6">
          <button 
            onClick={() => setActiveTab('text-to-image')} 
            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'text-to-image' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Texto para Imagem
          </button>
          <button 
            onClick={() => setActiveTab('edit')} 
            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'edit' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Editar Imagem
          </button>
        </div>
        {error && <p className="bg-red-900/50 text-red-300 p-3 rounded-md mb-4">{error}</p>}
        {activeTab === 'text-to-image' ? renderTextToImageTab() : renderEditTab()}
      </div>

      <div className="bg-gray-800 p-8 rounded-lg shadow-xl flex items-center justify-center min-h-[400px]">
        {loading ? <Loader message={activeTab === 'text-to-image' ? "Pintando pixels..." : "Aplicando magia de edição..."} /> : 
         !hasResult ? (
            <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <p>Sua imagem gerada aparecerá aqui</p>
            </div>
         ) : (
            <div className={`grid ${originalImageUrl && generatedImageUrl ? 'grid-cols-2' : 'grid-cols-1'} gap-4 w-full`}>
              {originalImageUrl && (
                <div className="text-center">
                  <h3 className="font-bold mb-2 text-white">Original</h3>
                  <img src={originalImageUrl} alt="Original" className="rounded-md mx-auto max-h-[400px] shadow-lg" />
                </div>
              )}
              {generatedImageUrl && (
                <div className="text-center">
                   <h3 className="font-bold mb-2 text-white">{activeTab === 'edit' ? 'Editada' : 'Gerada'}</h3>
                  <img src={generatedImageUrl} alt="Gerada" className="rounded-md mx-auto max-h-[400px] shadow-lg border border-gray-700" />
                  <a href={generatedImageUrl} download={`imagem-gerada-${Date.now()}.png`} className="inline-block mt-3 text-sm text-indigo-400 hover:text-indigo-300">
                    Baixar Imagem
                  </a>
                </div>
              )}
            </div>
          )
        }
      </div>
    </div>
  );
};

export default ImageStudio;
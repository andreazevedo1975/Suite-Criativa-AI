import React, { useState, useCallback, useEffect } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import Loader from './Loader';

type StudioTab = 'generate' | 'edit';

const ImageStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudioTab>('generate');
  const [prompt, setPrompt] = useState('');
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

  const handleGenerate = useCallback(async () => {
    if (!prompt) {
      setError("Por favor, insira um comando.");
      return;
    }
    setError(null);
    setLoading(true);
    setGeneratedImageUrl(null);
    try {
      const base64Image = await generateImage(prompt);
      setGeneratedImageUrl(`data:image/png;base64,${base64Image}`);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Falha ao gerar a imagem. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [prompt]);

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

  const renderGenerateTab = () => (
    <>
      <div className="mb-4">
        <label htmlFor="generate-prompt" className="block text-sm font-medium text-gray-300 mb-2">Comando</label>
        <textarea
          id="generate-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Um majestoso gato astronauta flutuando no espaço, arte digital"
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          rows={2}
        />
      </div>
      <button onClick={handleGenerate} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 text-white font-bold py-3 px-4 rounded-md transition">
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
          placeholder="Ex: Adicione um filtro retrô, ou remova a pessoa no fundo"
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          rows={2}
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
          <button onClick={() => setActiveTab('generate')} className={`px-4 py-2 font-medium ${activeTab === 'generate' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}>Gerar</button>
          <button onClick={() => setActiveTab('edit')} className={`px-4 py-2 font-medium ${activeTab === 'edit' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}>Editar</button>
        </div>
        {error && <p className="bg-red-900/50 text-red-300 p-3 rounded-md mb-4">{error}</p>}
        {activeTab === 'generate' ? renderGenerateTab() : renderEditTab()}
      </div>

      <div className="bg-gray-800 p-8 rounded-lg shadow-xl flex items-center justify-center min-h-[400px]">
        {loading ? <Loader message={activeTab === 'generate' ? "Gerando sua obra-prima..." : "Aplicando edições..."} /> : 
         !hasResult ? <p className="text-gray-500">Sua imagem gerada aparecerá aqui</p> : (
            <div className={`grid ${originalImageUrl && generatedImageUrl ? 'grid-cols-2' : 'grid-cols-1'} gap-4 w-full`}>
              {originalImageUrl && (
                <div className="text-center">
                  <h3 className="font-bold mb-2 text-white">Original</h3>
                  <img src={originalImageUrl} alt="Original" className="rounded-md mx-auto max-h-[400px]" />
                </div>
              )}
              {generatedImageUrl && (
                <div className="text-center">
                   <h3 className="font-bold mb-2 text-white">{activeTab === 'edit' ? 'Editada' : 'Gerada'}</h3>
                  <img src={generatedImageUrl} alt="Gerada" className="rounded-md mx-auto max-h-[400px]" />
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
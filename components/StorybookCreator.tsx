import React, { useState } from 'react';
import { createStorybook, generateStoryPageImage } from '../services/geminiService';
import { StoryPage } from '../types';
import Loader from './Loader';

const StorybookCreator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [numPages, setNumPages] = useState(4);
  const [storybook, setStorybook] = useState<StoryPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const handleGenerateStory = async () => {
    if (!topic) {
      setError("Por favor, insira um tema para a história.");
      return;
    }
    setError(null);
    setLoading(true);
    setStorybook([]);
    try {
      const pages = await createStorybook(topic, numPages);
      setStorybook(pages);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Falha ao criar a história. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async (pageKey: string, prompt: string) => {
    setImageLoading(prev => ({ ...prev, [pageKey]: true }));
    setError(null); // Clear previous errors
    try {
      const base64Image = await generateStoryPageImage(prompt);
      setStorybook(prev => 
        prev.map(p => {
            const key = p.page === 'Capa' ? 'Capa' : `page-${p.page}`;
            if (key === pageKey) {
                return { ...p, imageUrl: `data:image/png;base64,${base64Image}` };
            }
            return p;
        })
      );
    } catch (e: any) {
      console.error(e);
      setError(e.message || `Falha ao gerar a imagem para a página ${pageKey}.`);
    } finally {
        setImageLoading(prev => ({ ...prev, [pageKey]: false }));
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-white mb-4">Criador de Histórias Infantis</h2>
        <p className="text-gray-400 mb-6">Insira um tema, escolha o número de páginas, e a IA irá gerar uma história curta completa com ilustrações que você pode criar página por página.</p>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-grow">
            <label htmlFor="story-topic" className="block text-sm font-medium text-gray-300 mb-2">Tema da História</label>
            <input
              id="story-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: um coelho corajoso que queria voar"
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
          <div>
            <label htmlFor="num-pages" className="block text-sm font-medium text-gray-300 mb-2">Páginas</label>
            <select 
              id="num-pages"
              value={numPages}
              onChange={e => setNumPages(Number(e.target.value))}
              className="w-full sm:w-auto bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition h-[50px]"
            >
              <option value={4}>4</option>
              <option value={6}>6</option>
              <option value={8}>8</option>
              <option value={10}>10</option>
            </select>
          </div>
          <button onClick={handleGenerateStory} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 text-white font-bold py-3 px-6 rounded-md transition duration-300 h-[50px]">
            {loading ? 'Criando...' : 'Criar História'}
          </button>
        </div>
        {error && <p className="bg-red-900/50 text-red-300 p-3 rounded-md mt-4">{error}</p>}
      </div>

      {loading && <Loader message="Escrevendo sua história..." />}

      {storybook.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {storybook.map((page) => {
            const pageKey = page.page === 'Capa' ? 'Capa' : `page-${page.page}`;
            const isLoadingImage = imageLoading[pageKey];
            return (
              <div key={pageKey} className="bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col">
                <div className="h-64 bg-gray-700 flex items-center justify-center">
                  {isLoadingImage ? <Loader message="Desenhando..." /> : 
                   page.imageUrl ? <img src={page.imageUrl} alt={`Ilustração para ${page.title || `página ${page.page}`}`} className="w-full h-full object-cover" /> :
                   <div className="text-center p-4">
                     <p className="text-gray-400 text-sm mb-4">Pronto para a imagem!</p>
                     <button onClick={() => handleGenerateImage(pageKey, page.image_prompt)} className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md text-sm transition">
                       Gerar Imagem
                     </button>
                   </div>
                  }
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2">{page.title || `Página ${page.page}`}</h3>
                  <p className="text-gray-300 flex-grow">{page.narrative}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StorybookCreator;
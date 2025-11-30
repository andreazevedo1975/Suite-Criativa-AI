import React, { useState, useEffect, useCallback } from 'react';
import Loader from './Loader';

interface ApiKeySelectorProps {
  children: React.ReactNode;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ children }) => {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkApiKey = useCallback(async () => {
    try {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        // Fallback when aistudio is not present in the environment
        console.warn("AIStudio object not found on window");
        setHasApiKey(false);
      }
    } catch (e) {
      console.error("Error checking for API key:", e);
      setError("Não foi possível verificar o status da chave de API. Por favor, tente novamente.");
      setHasApiKey(false);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectKey = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Assume success to avoid race condition and immediately allow user to proceed.
        setHasApiKey(true); 
      } else {
        setError("Funcionalidade de seleção de chave não disponível neste ambiente.");
      }
    } catch (e) {
      console.error("Error opening API key selection:", e);
      setError("Falha ao abrir o diálogo de seleção de chave de API.");
    }
  };

  if (hasApiKey === null) {
    return <Loader message="Verificando o status da Chave de API..." />;
  }
  
  // This wrapper allows us to handle API key errors gracefully in child components
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { resetApiKey: () => setHasApiKey(false) } as any);
    }
    return child;
  });

  if (!hasApiKey) {
    return (
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-4">Chave de API Necessária para Geração de Vídeo</h2>
        <p className="text-gray-400 mb-6">
          A geração de vídeo com Veo exige que você selecione uma chave de API do Google AI Studio.
          Este é um passo obrigatório antes de poder criar vídeos. Por favor, garanta que seu projeto tenha o faturamento ativado.
        </p>
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={handleSelectKey}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            Selecionar Chave de API
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            Saiba mais sobre faturamento
          </a>
        </div>
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    );
  }

  return <>{childrenWithProps}</>;
};

export default ApiKeySelector;
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { analyzeImage, analyzeVideoFrames } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import Loader from './Loader';

type AnalyzerTab = 'image' | 'video';

// BUG FIX: Replaced the simple markdown parser with a more robust version to handle various formatting cases correctly.
const parseMarkdown = (text: string): string => {
    let html = text
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Lists
    html = html.replace(/^\s*[\*-] (.*$)/gim, '<li>$1</li>');
    // Group adjacent <li>s into a single <ul>
    html = html.replace(/<\/li>\n<li>/g, '</li><li>'); 
    const listRegex = /(<li>.*?<\/li>)/gs;
    html = html.replace(listRegex, '<ul>$1</ul>');

    // Paragraphs (treat sequences of non-empty lines as paragraphs)
    html = html.split('\n\n').map(paragraph => {
        if (!paragraph.trim()) return '';
        // Avoid wrapping block elements in <p> tags
        if (paragraph.trim().startsWith('<h') || paragraph.trim().startsWith('<ul')) {
            return paragraph;
        }
        return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
}

const Analyzer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyzerTab>('image');
  const [prompt, setPrompt] = useState('Descreva isto em detalhes.');
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // BUG FIX: Clean up object URLs to prevent memory leaks.
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl); // Revoke old URL before creating a new one
    }
    if (selectedFile) {
      setFile(selectedFile);
      setFilePreviewUrl(URL.createObjectURL(selectedFile));
      setAnalysisResult(null);
    } else {
      setFile(null);
      setFilePreviewUrl(null);
    }
  };

  const extractVideoFrames = useCallback(async (videoFile: File, frameCount: number): Promise<{ data: string, mimeType: string }[]> => {
    return new Promise((resolve, reject) => {
        if (!videoRef.current || !canvasRef.current) {
            return reject("Elementos de vídeo não estão prontos");
        }
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Contexto do canvas não disponível");
        
        const videoSrc = URL.createObjectURL(videoFile);

        // BUG FIX: Revoke the object URL after extraction is done to prevent memory leaks.
        const cleanup = () => {
            URL.revokeObjectURL(videoSrc);
            video.onloadeddata = null;
            video.onerror = null;
            video.onseeked = null;
        };

        const frames: { data: string, mimeType: string }[] = [];
        let framesExtracted = 0;
        
        video.onloadeddata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const duration = video.duration;
            if (duration === 0) {
                cleanup();
                return resolve([]);
            };

            const interval = duration / frameCount;

            const extractFrame = (time: number) => {
                video.currentTime = time;
            };

            video.onseeked = () => {
                if (framesExtracted >= frameCount) return;
                ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const frameDataUrl = canvas.toDataURL('image/jpeg');
                frames.push({ data: frameDataUrl.split(',')[1], mimeType: 'image/jpeg' });
                framesExtracted++;

                if (framesExtracted === frameCount) {
                    cleanup();
                    resolve(frames);
                } else {
                    extractFrame(interval * framesExtracted);
                }
            };
            
            extractFrame(0);
        };
        
        video.onerror = (e) => {
            cleanup();
            reject(e);
        };
        video.src = videoSrc;
    });
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!prompt || !file) {
      setError("Por favor, carregue um arquivo e insira um comando.");
      return;
    }
    setError(null);
    setLoading(true);
    setAnalysisResult(null);

    try {
      let result;
      if (activeTab === 'image') {
        const base64Image = await fileToBase64(file);
        result = await analyzeImage(base64Image, file.type, prompt);
      } else {
        const frames = await extractVideoFrames(file, 5);
        if (frames.length === 0) {
            throw new Error("Não foi possível extrair frames do vídeo. O arquivo pode estar corrompido ou em um formato não suportado.");
        }
        result = await analyzeVideoFrames(frames, prompt);
      }
      setAnalysisResult(result);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Falha ao realizar a análise. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [prompt, file, activeTab, extractVideoFrames]);

  return (
    <div>
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">Analisador de Conteúdo</h2>
            <p className="text-gray-400 mt-2">Carregue uma imagem ou vídeo e pergunte qualquer coisa ao Gemini sobre ele. Usando o Modo de Pensamento para uma análise profunda.</p>
        </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl h-fit">
          <div className="flex border-b border-gray-700 mb-6">
            <button onClick={() => setActiveTab('image')} className={`px-4 py-2 font-medium ${activeTab === 'image' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}>Analisar Imagem</button>
            <button onClick={() => setActiveTab('video')} className={`px-4 py-2 font-medium ${activeTab === 'video' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}>Analisar Vídeo</button>
          </div>
          {error && <p className="bg-red-900/50 text-red-300 p-3 rounded-md mb-4">{error}</p>}
          <div className="space-y-4">
            <div>
              <label htmlFor="analyzer-upload" className="block text-sm font-medium text-gray-300 mb-2">Carregar {activeTab === 'image' ? 'Imagem' : 'Vídeo'}</label>
              <input
                id="analyzer-upload"
                type="file"
                accept={activeTab === 'image' ? "image/*" : "video/*"}
                onChange={handleFileChange}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
              />
               {activeTab === 'video' && <p className="text-xs text-gray-500 mt-2">Nota: A análise é realizada em 5 quadros-chave do vídeo.</p>}
            </div>
            <div>
              <label htmlFor="analyzer-prompt" className="block text-sm font-medium text-gray-300 mb-2">O que você quer saber?</label>
              <textarea
                id="analyzer-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                rows={3}
              />
            </div>
            <button onClick={handleAnalyze} disabled={loading || !file} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition">
              {loading ? 'Analisando...' : 'Analisar'}
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center space-x-2 text-indigo-300">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.061 12H18a6 6 0 0 1 6 6v3h-3.414"/><path d="M12 12a4.5 4.5 0 0 0-4.5 4.5c0 2.21 1.5 4 3.5 4h8.5a4 4 0 0 0-4-4Z"/><path d="M12 2a4.5 4.5 0 0 0-4.5 4.5c0 2.21 1.5 4 3.5 4h.5a4 4 0 0 0 4-4 4.5 4.5 0 0 0-4.5-4.5Z"/><path d="M6.002 12A4.5 4.5 0 0 1 10.5 7.5c2.21 0 4 1.5 4 3.5v.5a4 4 0 0 1-4 4h-5a3.5 3.5 0 0 1-3.5-3.5A4.5 4.5 0 0 1 6.002 12Z"/></svg>
            <span className="text-sm font-semibold">Desenvolvido com Gemini 2.5 Pro com Modo de Pensamento</span>
          </div>
        </div>
        
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl flex flex-col">
            {filePreviewUrl && (
                <div className="mb-4 border-b border-gray-700 pb-4">
                {activeTab === 'image' ? 
                    <img src={filePreviewUrl} alt="Preview" className="rounded-md mx-auto max-h-64" /> :
                    <video ref={videoRef} src={filePreviewUrl} controls className="rounded-md mx-auto max-h-64" />
                }
                </div>
            )}
            <div className="flex-grow flex items-center justify-center">
            {loading ? <Loader message="Analisando conteúdo..." /> :
            analysisResult ? <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white max-w-none" dangerouslySetInnerHTML={{__html: parseMarkdown(analysisResult) }}/> :
                <p className="text-gray-500">Os resultados da análise aparecerão aqui</p>
            }
            </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default Analyzer;
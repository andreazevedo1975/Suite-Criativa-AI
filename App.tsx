import React, { useState } from 'react';
import StorybookCreator from './components/StorybookCreator';
import ImageStudio from './components/ImageStudio';
import VideoStudio from './components/VideoStudio';
import Analyzer from './components/Analyzer';

type Tab = 'storybook' | 'image' | 'video' | 'analyzer';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('storybook');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'storybook':
        return <StorybookCreator />;
      case 'image':
        return <ImageStudio />;
      case 'video':
        return <VideoStudio />;
      case 'analyzer':
        return <Analyzer />;
      default:
        return <StorybookCreator />;
    }
  };

  const TabButton = ({ tab, label }: { tab: Tab; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        activeTab === tab
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Suíte Criativa <span className="text-indigo-400">AI</span>
          </h1>
          <nav className="flex space-x-2">
            <TabButton tab="storybook" label="Criador de Histórias" />
            <TabButton tab="image" label="Estúdio de Imagem" />
            <TabButton tab="video" label="Estúdio de Vídeo" />
            <TabButton tab="analyzer" label="Analisador" />
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default App;
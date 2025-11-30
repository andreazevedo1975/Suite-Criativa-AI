import React, { useState } from 'react';
import { createStorybook, generateStoryPageImage } from '../services/geminiService';
import { StoryPage } from '../types';
import Loader from './Loader';

const randomTopics = [
  "Um dragão que perdeu seu fogo e encontrou novos talentos",
  "Uma aventura espacial com um gato astronauta em busca de peixes estelares",
  "A vida secreta dos brinquedos quando ninguém está olhando",
  "Uma floresta mágica onde as árvores contam piadas",
  "O robô que queria aprender a pintar e colorir o mundo",
  "Uma viagem ao fundo do mar em um submarino amarelo feito de queijo",
  "O cachorro que se tornou prefeito da cidade dos animais",
  "Uma escola de magia para animais de estimação travessos",
  "A menina que podia falar com as plantas e curar flores murchas",
  "Um piquenique na lua com alienígenas amigáveis que adoram sanduíches"
];

const typographyOptions = [
    { value: "Serifa Clássica", label: "Serifa Clássica (Elegante)", example: "Fontes como Times New Roman ou Garamond. Traz um ar de livro de contos de fadas tradicional e sério." },
    { value: "Sans-Serif Redonda", label: "Sans-Serif Redonda (Amigável)", example: "Letras gordinhas e sem pontas (como Arial Rounded). Muito fácil de ler, passa uma sensação moderna e acolhedora." },
    { value: "Manuscrito Lúdico", label: "Manuscrito Lúdico (Pessoal)", example: "Imita a letra de uma criança ou professor primário. Traz um toque humano, artesanal e divertido." },
    { value: "Display Bold", label: "Display Bold (Impactante)", example: "Letras grossas e pesadas. Ótimo para títulos chamativos, estilo cartaz ou capa de revista infantil." },
    { value: "Fantasia Mágica", label: "Fantasia (Decorativo)", example: "Letras com floreios, curvas e detalhes místicos. Lembra títulos de filmes de bruxo ou reinos encantados." },
    { value: "Máquina de Escrever", label: "Máquina de Escrever (Retrô)", example: "Estilo Courier New, com falhas de tinta sutis. Passa uma sensação de documento investigativo ou carta antiga." },
    { value: "Comic Book", label: "Comic Book (Quadrinhos)", example: "Fontes em caixa alta, inclinadas e dinâmicas. Estilo balão de fala de super-heróis, cheio de energia." },
    { value: "Pixel Art Font", label: "Pixel Art (8-bit)", example: "Letras formadas por quadradinhos. Estilo videogame antigo (Minecraft, Mario), ideal para temas digitais." },
    { value: "Caligrafia Elegante", label: "Caligrafia (Formal)", example: "Letras cursivas desenhadas com pena e tinteiro. Estilo convite de casamento real ou carta de princesa." },
    { value: "Quadro Negro", label: "Quadro Negro (Giz)", example: "Textura falhada que imita giz em lousa verde. Perfeito para histórias escolares ou de aprendizado." },
    { value: "Neon Brilhante", label: "Neon (Sci-Fi)", example: "Letras que parecem tubos de luz brilhante. Ideal para histórias espaciais, futuristas ou noturnas." },
    { value: "Gótico Medieval", label: "Gótico Medieval (Antigo)", example: "Letras angulares e ornamentadas, estilo manuscritos de monges. Bom para contos de cavaleiros e lendas." },
    { value: "Letras Bolha", label: "Letras Bolha (Graffiti)", example: "Letras infladas como balões, arredondadas e sobrepostas. Estilo urbano, divertido e street art." },
    { value: "Stencil Militar", label: "Stencil (Aventura)", example: "Letras com cortes (como em caixas de carga). Passa sensação de aventura na selva, exército ou expedição." },
    { value: "Pinceladas Artísticas", label: "Pinceladas (Tinta)", example: "Parece ter sido escrito com um pincel grosso de tinta guache. Artístico, expressivo e imperfeito." },
    { value: "Velho Oeste", label: "Velho Oeste (Cowboy)", example: "Letras largas, ornamentadas e com 'esporas'. Estilo cartaz de 'Procurado' ou saloon antigo." },
    { value: "Glitch Digital", label: "Glitch (Futurista)", example: "Letras distorcidas, cortadas ou duplicadas como um erro de computador. Estilo hacker ou robô com defeito." },
    { value: "Terror Gotejante", label: "Terror Gotejante (Goosebumps)", example: "As letras parecem estar derretendo ou pingando gosma. Divertido para histórias de monstros ou Halloween." },
    { value: "Minimalista Fino", label: "Minimalista Fino (Clean)", example: "Linhas muito finas e elegantes. Estilo revista de design, moderno, limpo e sofisticado." },
    { value: "Vitoriano Vintage", label: "Vitoriano (Ornamentado)", example: "Extremamente decorado, com sombras e detalhes internos. Estilo circo antigo ou rótulo de remédio velho." },
    { value: "Recorte de Papel", label: "Recorte de Papel (Colagem)", example: "As letras parecem ter sido recortadas de revistas com tesoura. Estilo colagem e ameaça anônima (brincadeira)." },
    { value: "Slab Serif Forte", label: "Slab Serif (Industrial)", example: "Letras com bases retangulares grossas (como blocos). Passa força, solidez e confiança." },
    { value: "Cursiva Pessoal", label: "Cursiva (Diário)", example: "Uma letra de mão rápida e fluida, mas legível. Parece um diário pessoal ou anotações de viagem." },
    { value: "Sci-Fi Tecnológico", label: "Sci-Fi Tech (Alien)", example: "Fontes angulares, cortadas ou com números misturados. Parece interface de nave espacial." },
    { value: "Élfico Fantasia", label: "Élfico (Senhor dos Anéis)", example: "Letras finas, altas e elegantes, inspiradas em runas ou escrita antiga. Mágico e etéreo." },
    { value: "Grunge Urbano", label: "Grunge (Sujo)", example: "Letras manchadas, riscadas e sujas. Estilo rock, urbano e rebelde." },
    { value: "Anos 70 Groovy", label: "Anos 70 Groovy (Psicodélico)", example: "Letras curvas, com bases largas e estilo 'hippie'. Colorido e retrô." },
    { value: "Art Deco", label: "Art Deco (Luxo)", example: "Geométrico, simétrico e luxuoso. Estilo anos 20, O Grande Gatsby." },
    { value: "Giz de Cera", label: "Giz de Cera (Infantil)", example: "Textura rugosa e traço irregular, como se uma criança tivesse escrito com força no papel." },
    { value: "Carimbos", label: "Carimbos (Postal)", example: "Letras com falhas de tinta e bordas irregulares, como carimbos de correio ou passaporte." },
    { value: "Graffiti Urbano", label: "Graffiti Tag (Rua)", example: "Estilo difícil de ler, assinatura de rua, spray. Radical e jovem." },
    { value: "Arcade 8-Bit", label: "Arcade (Jogos)", example: "Similar ao Pixel Art, mas focado em placares de jogos e títulos de fliperama clássico." },
    { value: "Marcador Casual", label: "Marcador Permanente", example: "Traço grosso e arredondado, como escrito com uma canetinha Sharpie preta." },
    { value: "Terror Riscado", label: "Terror Riscado (Suspense)", example: "Letras feitas de riscos frenéticos e nervosos. Passa tensão e medo." },
    { value: "Jornal Antigo", label: "Jornal Antigo (Gasto)", example: "Serifa clássica, mas com falhas de impressão e tinta estourada. Estilo manchete histórica." },
    { value: "Tecnologia Cyberpunk", label: "Cyberpunk (Distópico)", example: "Mistura de alfabetos, caracteres japoneses e digitais. Caótico e futurista." },
    { value: "Conto de Fadas", label: "Conto de Fadas (Curvas)", example: "Iniciais gigantes e decoradas (Capitulares), corpo do texto fluido." },
    { value: "Blocos de Construção", label: "Blocos (Brinquedo)", example: "Cada letra é desenhada dentro de um bloco de montar ou cubo. Muito infantil e lúdico." }
];

const coverStyleOptions = [
    { value: "Ilustração Flat Minimalista", label: "Ilustração Flat (Vetorial)", example: "Cores sólidas e vibrantes, sem sombras complexas ou degradês. Formas geométricas simples. Estilo moderno de aplicativos." },
    { value: "Aquarela Suave", label: "Aquarela Suave (Sonhador)", example: "Cores translúcidas que se misturam, texturas de papel visíveis, bordas suaves e manchadas. Delicado e artístico." },
    { value: "Renderização 3D Fofa", label: "3D Render (Estilo Pixar)", example: "Personagens 'gordinhos', iluminação suave, texturas plásticas ou de pele realista. Parece um filme de animação moderno." },
    { value: "Colagem Mixed Media", label: "Colagem Mixed Media (Texturas)", example: "Mistura de recortes de fotos, papéis texturizados, tecido e desenho à mão. Visual eclético e artesanal." },
    { value: "Line Art Detalhado", label: "Line Art (Colorir)", example: "Fundo branco com contornos pretos nítidos e detalhados. Estilo livro de colorir para adultos." },
    { value: "Pintura a Óleo Digital", label: "Pintura a Óleo (Clássico)", example: "Pinceladas visíveis, texturas grossas, cores ricas e mistura suave. Parece uma obra de arte de museu." },
    { value: "Massinha de Modelar", label: "Massinha (Claymation)", example: "Tudo parece feito de plasticina ou massinha Play-Doh. Bordas arredondadas e texturas de impressão digital." },
    { value: "Diorama de Papel", label: "Diorama de Papel (Papercut)", example: "Camadas de papel colorido sobrepostas criando profundidade e sombras. Efeito 3D feito de cartolina." },
    { value: "Cyberpunk Neon", label: "Cyberpunk (Futurista)", example: "Muitos roxos, azuis e rosas neon brilhantes. Ambientes noturnos, chuvosos e tecnológicos." },
    { value: "Steampunk Bronze", label: "Steampunk (Vitoriano)", example: "Tons de marrom, cobre e ouro. Muitas engrenagens, óculos de aviador, vapor e roupas vitorianas." },
    { value: "Ukiyo-e Japonês", label: "Ukiyo-e (Tradicional)", example: "Estilo xilogravura japonesa (como 'A Grande Onda'). Linhas de contorno fortes, cores planas e perspectiva plana." },
    { value: "Pop Art Vibrante", label: "Pop Art (Warhol)", example: "Cores primárias muito fortes, retículas (pontinhos) de impressão, alto contraste. Estilo história em quadrinhos antiga." },
    { value: "Impressionismo", label: "Impressionismo (Luz)", example: "Pinceladas curtas e visíveis, foco na luz e movimento, menos foco em detalhes nítidos. Estilo Monet." },
    { value: "Noir Preto e Branco", label: "Noir (Detetive)", example: "Preto e branco com alto contraste. Sombras dramáticas, persianas, silhuetas e mistério." },
    { value: "Vitral Colorido", label: "Vitral (Mosaico)", example: "Imagens formadas por cacos de vidro colorido com contornos pretos grossos (chumbo). Luz atravessando as cores." },
    { value: "Pixel Art 8-bit", label: "Pixel Art (Retro Game)", example: "Quadradinhos visíveis, resolução baixa, cores limitadas. Estilo Mario Bros ou Minecraft." },
    { value: "Low Poly 3D", label: "Low Poly (Geométrico)", example: "Objetos formados por poucos polígonos (triângulos). Visual facetado, limpo e moderno." },
    { value: "Anime Studio Ghibli", label: "Anime (Ghibli)", example: "Cenários de natureza exuberantes e pintados à mão, personagens expressivos, cores vibrantes e nostálgicas." },
    { value: "Chibi Fofo", label: "Chibi (Kawai)", example: "Personagens com cabeças grandes e corpos pequenos. Olhos gigantes e brilhantes. Extremamente fofo." },
    { value: "Cinematográfico Realista", label: "Cinematográfico (Épico)", example: "Parece uma foto de filme de alto orçamento. Iluminação dramática, profundidade de campo (fundo desfocado), alta resolução." },
    { value: "Poster Vintage 50s", label: "Vintage 50s (Retro)", example: "Cores desbotadas ou pastéis, sorrisos idealizados, texturas de papel envelhecido. Estilo propaganda antiga." },
    { value: "Graffiti Street Art", label: "Graffiti (Urbano)", example: "Cores neon spray, traços grossos, pingos de tinta, estilo mural de rua. Vibrante e rebelde." },
    { value: "Esboço a Carvão", label: "Carvão (Rústico)", example: "Preto e branco, traços sujos e esfumaçados, textura de papel rugoso. Dramático e expressivo." },
    { value: "Blueprint Técnico", label: "Blueprint (Planta)", example: "Fundo azul escuro com linhas brancas técnicas. Parece um projeto de arquitetura ou engenharia." },
    { value: "Feltro e Tecido", label: "Feltro (Artesanato)", example: "Tudo parece feito de tecido, costura visível, botões e texturas de lã. Aconchegante e caseiro." },
    { value: "Psicodélico Anos 60", label: "Psicodélico (Surreal)", example: "Cores que 'machucam' o olho, formas espirais, distorções, arco-íris e cogumelos." },
    { value: "Dark Fantasy", label: "Dark Fantasy (Sombrio)", example: "Ambientes escuros, neblina, criaturas misteriosas, iluminação mágica e tons frios." },
    { value: "Giz Pastel", label: "Giz Pastel (Suave)", example: "Cores muito suaves e poeirentas. Textura aveludada, sem linhas duras. Muito bom para bebês." },
    { value: "Origami Dobradura", label: "Origami (Papel)", example: "Tudo é feito de papel dobrado, com vincos geométricos nítidos. Sem curvas suaves." },
    { value: "Escultura em Mármore", label: "Mármore (Estátua)", example: "Tudo é branco e pedra, com iluminação clássica de museu. Solene e artístico." },
    { value: "Wireframe Neon", label: "Wireframe (Tron)", example: "Fundo preto, objetos desenhados apenas por linhas finas brilhantes (grade). Estilo computador anos 80." },
    { value: "Desenho a Lápis", label: "Lápis de Cor (Escolar)", example: "Riscos visíveis de lápis de cor, preenchimento imperfeito, textura de papel. Parece desenho de criança talentosa." },
    { value: "Livro Clássico", label: "Livro Clássico (Beatrix Potter)", example: "Ilustrações pequenas e detalhadas cercadas por texto, cores naturais (verde, marrom), animais realistas com roupas." },
    { value: "Vaporwave", label: "Vaporwave (Internet 90s)", example: "Estátuas gregas, palmeiras, golfinhos, Windows 95, rosa e ciano. Estética nostálgica da internet." },
    { value: "Renascença", label: "Renascença (Pintura Antiga)", example: "Composição triangular, querubins, drapeados de tecido realista, luz divina. Estilo Leonardo da Vinci." },
    { value: "Surrealismo Dali", label: "Surrealismo (Sonhos)", example: "Relógios derretendo, elefantes com pernas finas, paisagens oníricas e impossíveis." },
    { value: "Xilogravura", label: "Xilogravura (Rústico)", example: "Alto contraste preto e branco (ou sépia), marcas de talho na madeira. Aparência de livro de cordel." },
    { value: "Bordado em Ponto Cruz", label: "Bordado (Caseiro)", example: "A imagem é formada por pequenos 'x' de linha em um tecido. Pixel art analógico." }
];

// Generate numbers from 2 to 20
const pageOptions = Array.from({ length: 19 }, (_, i) => i + 2);

const StorybookCreator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [numPages, setNumPages] = useState(2);
  const [typography, setTypography] = useState(typographyOptions[1].value);
  const [coverStyle, setCoverStyle] = useState(coverStyleOptions[2].value);
  const [storybook, setStorybook] = useState<StoryPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Helper to get current option details
  const selectedTypoOption = typographyOptions.find(opt => opt.value === typography);
  const selectedCoverOption = coverStyleOptions.find(opt => opt.value === coverStyle);

  const generateStory = async (selectedTopic: string, selectedNumPages: number, selectedTypo: string, selectedStyle: string) => {
    if (!selectedTopic) {
      setError("Por favor, insira um tema para a história.");
      return;
    }
    setError(null);
    setLoading(true);
    setStorybook([]);
    try {
      const pages = await createStorybook(selectedTopic, selectedNumPages, selectedTypo, selectedStyle);
      setStorybook(pages);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Falha ao criar a história. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStory = () => {
    generateStory(topic, numPages, typography, coverStyle);
  };

  const handleRandomStory = () => {
    const randomTopic = randomTopics[Math.floor(Math.random() * randomTopics.length)];
    const randomNumPages = pageOptions[Math.floor(Math.random() * pageOptions.length)];
    const randomTypo = typographyOptions[Math.floor(Math.random() * typographyOptions.length)].value;
    const randomStyle = coverStyleOptions[Math.floor(Math.random() * coverStyleOptions.length)].value;

    setTopic(randomTopic);
    setNumPages(randomNumPages);
    setTypography(randomTypo);
    setCoverStyle(randomStyle);

    generateStory(randomTopic, randomNumPages, randomTypo, randomStyle);
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
        <p className="text-gray-400 mb-6">Personalize sua história escolhendo o tema, tamanho, e o estilo visual completo.</p>
        
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
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
                      className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    >
                      {pageOptions.map((num) => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="typography-select" className="block text-sm font-medium text-gray-300 mb-2">Estilo de Tipografia</label>
                    <select
                      id="typography-select"
                      value={typography}
                      onChange={(e) => setTypography(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    >
                      {typographyOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    {selectedTypoOption && (
                        <div className="mt-2 text-sm text-gray-400 bg-gray-700/50 p-3 rounded border border-gray-700">
                            <span className="font-semibold text-indigo-300 block mb-1">Como é o visual:</span> 
                            {selectedTypoOption.example}
                        </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="cover-style-select" className="block text-sm font-medium text-gray-300 mb-2">Estilo de Capa e Arte</label>
                    <select
                      id="cover-style-select"
                      value={coverStyle}
                      onChange={(e) => setCoverStyle(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    >
                      {coverStyleOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    {selectedCoverOption && (
                        <div className="mt-2 text-sm text-gray-400 bg-gray-700/50 p-3 rounded border border-gray-700">
                             <span className="font-semibold text-purple-300 block mb-1">Resultado esperado:</span>
                             {selectedCoverOption.example}
                        </div>
                    )}
                  </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button 
                onClick={handleRandomStory} 
                disabled={loading} 
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white font-bold py-3 px-6 rounded-md transition duration-300 h-[50px] transform hover:scale-105 active:scale-95" 
                title="Gerar história com tema, estilo e tamanho aleatórios"
              >
                🎲 Surpreenda-me
              </button>
              <button 
                onClick={handleGenerateStory} 
                disabled={loading} 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 text-white font-bold py-3 px-6 rounded-md transition duration-300 h-[50px] transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-indigo-500/50"
              >
                {loading ? 'Criando...' : 'Criar História'}
              </button>
            </div>
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
                     <button onClick={() => handleGenerateImage(pageKey, page.image_prompt)} className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md text-sm transition transform hover:scale-105">
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
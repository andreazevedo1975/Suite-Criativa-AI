
import React, { useState, useEffect } from 'react';
import { createStorybook, generateStoryPageImage } from '../services/geminiService';
import { StoryPage } from '../types';
import Loader from './Loader';
import { jsPDF } from "jspdf";

const STORAGE_KEY = 'creative_suite_saved_story';

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
  "Um piquenique na lua com alienígenas amigáveis que adoram sanduíches",
  "O menino que construiu um foguete de papelão que voava de verdade",
  "Uma formiga que queria ser gigante por um dia",
  "O mistério das meias desaparecidas e o monstro da lavanderia",
  "Um pinguim que não gostava de frio e queria morar na praia",
  "A nuvem que chovia doces em vez de água",
  "O urso que abriu uma padaria na floresta",
  "Uma viagem no tempo para a época dos dinossauros bonzinhos",
  "A biblioteca onde os personagens saem dos livros à noite",
  "O super-herói cujos poderes só funcionam quando ele come brócolis",
  "Um circo invisível que só as crianças conseguem ver",
  "Uma abelha que tinha medo de altura",
  "O relógio que andava para trás e mudava o passado",
  "Um castelo feito inteiramente de sorvete que nunca derretia",
  "A raposa detetive que solucionava crimes na floresta",
  "O menino que tinha uma sombra colorida",
  "Uma ilha onde chovia brinquedos toda sexta-feira",
  "O peixinho dourado que queria ser um tubarão",
  "A vassoura mágica que não gostava de varrer, só de dançar",
  "Um mundo onde as pessoas andavam de cabeça para baixo",
  "O espelho que mostrava o futuro engraçado"
];

// Options sorted alphabetically by label with preview styles
const typographyOptions = [
    { 
        value: "Anos 70 Groovy", 
        label: "Anos 70 Groovy (Psicodélico)", 
        example: "Letras curvas, com bases largas e estilo 'hippie'. Colorido e retrô.",
        previewStyle: { fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif', fontWeight: 'bold', color: '#FFD700', letterSpacing: '-1px', textShadow: '2px 2px 0px #FF4500' }
    },
    { 
        value: "Arcade 8-Bit", 
        label: "Arcade (Jogos)", 
        example: "Similar ao Pixel Art, mas focado em placares de jogos e títulos de fliperama clássico.",
        previewStyle: { fontFamily: '"Courier New", monospace', textTransform: 'uppercase', color: '#39FF14', letterSpacing: '2px', textShadow: '0 0 5px #39FF14' }
    },
    { 
        value: "Art Deco", 
        label: "Art Deco (Luxo)", 
        example: "Geométrico, simétrico e luxuoso. Estilo anos 20, O Grande Gatsby.",
        previewStyle: { fontFamily: '"Didot", "Bodoni MT", serif', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 'bold', color: '#E0AA3E' }
    },
    { 
        value: "Blocos de Construção", 
        label: "Blocos (Brinquedo)", 
        example: "Cada letra é desenhada dentro de um bloco de montar ou cubo. Muito infantil e lúdico.",
        previewStyle: { fontFamily: 'Impact, sans-serif', color: '#FFFFFF', backgroundColor: '#FF0000', padding: '0 5px', display: 'inline-block' }
    },
    { 
        value: "Caligrafia Elegante", 
        label: "Caligrafia (Formal)", 
        example: "Letras cursivas desenhadas com pena e tinteiro. Estilo convite de casamento real ou carta de princesa.",
        previewStyle: { fontFamily: '"Brush Script MT", "Lucida Calligraphy", cursive', fontStyle: 'italic', color: '#D4AF37' }
    },
    { 
        value: "Carimbos", 
        label: "Carimbos (Postal)", 
        example: "Letras com falhas de tinta e bordas irregulares, como carimbos de correio ou passaporte.",
        previewStyle: { fontFamily: '"Courier New", monospace', fontWeight: 'bold', opacity: '0.7', transform: 'rotate(-2deg)', display: 'inline-block', color: '#4A5568', border: '2px border-dashed' }
    },
    { 
        value: "Comic Book", 
        label: "Comic Book (Quadrinhos)", 
        example: "Fontes em caixa alta, inclinadas e dinâmicas. Estilo balão de fala de super-heróis, cheio de energia.",
        previewStyle: { fontFamily: '"Comic Sans MS", sans-serif', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', color: '#FFD700', textShadow: '2px 2px 0 #000', WebkitTextStroke: '1px black' }
    },
    { 
        value: "Conto de Fadas", 
        label: "Conto de Fadas (Curvas)", 
        example: "Iniciais gigantes e decoradas (Capitulares), corpo do texto fluido.",
        previewStyle: { fontFamily: 'Georgia, serif', fontVariant: 'small-caps', fontSize: '1.1em', color: '#F6AD55' }
    },
    { 
        value: "Cursiva Pessoal", 
        label: "Cursiva (Diário)", 
        example: "Uma letra de mão rápida e fluida, mas legível. Parece um diário pessoal ou anotações de viagem.",
        previewStyle: { fontFamily: '"Bradley Hand", "Chalkboard SE", cursive', color: '#2B6CB0' }
    },
    { 
        value: "Display Bold", 
        label: "Display Bold (Impactante)", 
        example: "Letras grossas e pesadas. Ótimo para títulos chamativos, estilo cartaz ou capa de revista infantil.",
        previewStyle: { fontFamily: 'Impact, sans-serif', textTransform: 'uppercase', fontSize: '1.2em', color: '#2D3748' }
    },
    { 
        value: "Élfico Fantasia", 
        label: "Élfico (Senhor dos Anéis)", 
        example: "Letras finas, altas e elegantes, inspiradas em runas ou escrita antiga. Mágico e etéreo.",
        previewStyle: { fontFamily: '"Papyrus", fantasy', fontStyle: 'italic', color: '#68D391' }
    },
    { 
        value: "Fantasia Mágica", 
        label: "Fantasia (Decorativo)", 
        example: "Letras com floreios, curvas e detalhes místicos. Lembra títulos de filmes de bruxo ou reinos encantados.",
        previewStyle: { fontFamily: '"Luminari", "Zapfino", fantasy', color: '#9F7AEA', textShadow: '0 0 5px #E9D8FD' }
    },
    { 
        value: "Glitch Digital", 
        label: "Glitch (Futurista)", 
        example: "Letras distorcidas, cortadas ou duplicadas como um erro de computador. Estilo hacker ou robô com defeito.",
        previewStyle: { fontFamily: '"Courier New", monospace', fontWeight: 'bold', textShadow: '2px 0 red, -2px 0 blue', color: 'white' }
    },
    { 
        value: "Gótico Medieval", 
        label: "Gótico Medieval (Antigo)", 
        example: "Letras angulares e ornamentadas, estilo manuscritos de monges. Bom para contos de cavaleiros e lendas.",
        previewStyle: { fontFamily: '"Old English Text MT", "Luminari", serif', fontSize: '1.2em', color: '#744210' }
    },
    { 
        value: "Graffiti Urbano", 
        label: "Graffiti Tag (Rua)", 
        example: "Estilo difícil de ler, assinatura de rua, spray. Radical e jovem.",
        previewStyle: { fontFamily: '"Chalkduster", fantasy', color: '#F56565', transform: 'rotate(-5deg)', display: 'inline-block' }
    },
    { 
        value: "Grunge Urbano", 
        label: "Grunge (Sujo)", 
        example: "Letras manchadas, riscadas e sujas. Estilo rock, urbano e rebelde.",
        previewStyle: { fontFamily: 'Impact, sans-serif', textDecoration: 'line-through', color: '#4A5568' }
    },
    { 
        value: "Jornal Antigo", 
        label: "Jornal Antigo (Gasto)", 
        example: "Serifa clássica, mas com falhas de impressão e tinta estourada. Estilo manchete histórica.",
        previewStyle: { fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: '#1A202C', letterSpacing: '-1px' }
    },
    { 
        value: "Letras Bolha", 
        label: "Letras Bolha (Graffiti)", 
        example: "Letras infladas como balões, arredondadas e sobrepostas. Estilo urbano, divertido e street art.",
        previewStyle: { fontFamily: '"Arial Rounded MT Bold", sans-serif', fontWeight: '900', color: '#63B3ED', WebkitTextStroke: '1px white' }
    },
    { 
        value: "Manuscrito Lúdico", 
        label: "Manuscrito Lúdico (Pessoal)", 
        example: "Imita a letra de uma criança ou professor primário. Traz um toque humano, artesanal e divertido.",
        previewStyle: { fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif', color: '#ED8936' }
    },
    { 
        value: "Máquina de Escrever", 
        label: "Máquina de Escrever (Retrô)", 
        example: "Estilo Courier New, com falhas de tinta sutis. Passa uma sensação de documento investigativo ou carta antiga.",
        previewStyle: { fontFamily: '"Courier New", monospace', fontWeight: 'bold', color: '#2D3748' }
    },
    { 
        value: "Marcador Casual", 
        label: "Marcador Permanente", 
        example: "Traço grosso e arredondado, como escrito com uma canetinha Sharpie preta.",
        previewStyle: { fontFamily: 'Arial, sans-serif', fontWeight: '900', color: '#000000' }
    },
    { 
        value: "Minimalista Fino", 
        label: "Minimalista Fino (Clean)", 
        example: "Linhas muito finas e elegantes. Estilo revista de design, moderno, limpo e sofisticado.",
        previewStyle: { fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '100', letterSpacing: '2px', color: '#A0AEC0' }
    },
    { 
        value: "Neon Brilhante", 
        label: "Neon (Sci-Fi)", 
        example: "Letras que parecem tubos de luz brilhante. Ideal para histórias espaciais, futuristas ou noturnas.",
        previewStyle: { fontFamily: 'sans-serif', color: '#fff', textShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #0ff' }
    },
    { 
        value: "Pinceladas Artísticas", 
        label: "Pinceladas (Tinta)", 
        example: "Parece ter sido escrito com um pincel grosso de tinta guache. Artístico, expressivo e imperfeito.",
        previewStyle: { fontFamily: '"Brush Script MT", cursive', fontSize: '1.2em', color: '#D53F8C' }
    },
    { 
        value: "Pixel Art Font", 
        label: "Pixel Art (8-bit)", 
        example: "Letras formadas por quadradinhos. Estilo videogame antigo (Minecraft, Mario), ideal para temas digitais.",
        previewStyle: { fontFamily: '"Courier New", monospace', fontWeight: 'bold', letterSpacing: '-1px', color: '#38A169' }
    },
    { 
        value: "Quadro Negro", 
        label: "Quadro Negro (Giz)", 
        example: "Textura falhada que imita giz em lousa verde. Perfeito para histórias escolares ou de aprendizado.",
        previewStyle: { fontFamily: '"Chalkduster", "Comic Sans MS", sans-serif', color: '#FFFFFF' }
    },
    { 
        value: "Recorte de Papel", 
        label: "Recorte de Papel (Colagem)", 
        example: "As letras parecem ter sido recortadas de revistas com tesoura. Estilo colagem e ameaça anônima (brincadeira).",
        previewStyle: { fontFamily: 'Impact, sans-serif', backgroundColor: 'white', color: 'black', padding: '2px', transform: 'skew(-10deg)' }
    },
    { 
        value: "Sans-Serif Redonda", 
        label: "Sans-Serif Redonda (Amigável)", 
        example: "Letras gordinhas e sem pontas (como Arial Rounded). Muito fácil de ler, passa uma sensação moderna e acolhedora.",
        previewStyle: { fontFamily: '"Arial Rounded MT Bold", Arial, sans-serif', fontWeight: 'bold', color: '#4299E1' }
    },
    { 
        value: "Sci-Fi Tecnológico", 
        label: "Sci-Fi Tech (Alien)", 
        example: "Fontes angulares, cortadas ou com números misturados. Parece interface de nave espacial.",
        previewStyle: { fontFamily: '"Courier New", monospace', letterSpacing: '4px', textTransform: 'uppercase', color: '#0BC5EA' }
    },
    { 
        value: "Serifa Clássica", 
        label: "Serifa Clássica (Elegante)", 
        example: "Fontes como Times New Roman ou Garamond. Traz um ar de livro de contos de fadas tradicional e sério.",
        previewStyle: { fontFamily: '"Times New Roman", serif', fontSize: '1.1em', color: '#2C5282' }
    },
    { 
        value: "Slab Serif Forte", 
        label: "Slab Serif (Industrial)", 
        example: "Letras com bases retangulares grossas (como blocos). Passa força, solidez e confiança.",
        previewStyle: { fontFamily: '"Rockwell", "Courier New", monospace', fontWeight: 'bold', color: '#2B6CB0' }
    },
    { 
        value: "Stencil Militar", 
        label: "Stencil (Aventura)", 
        example: "Letras com cortes (como em caixas de carga). Passa sensação de aventura na selva, exército ou expedição.",
        previewStyle: { fontFamily: '"Impact", sans-serif', textTransform: 'uppercase', letterSpacing: '2px', color: '#38A169', borderBottom: '2px dashed #38A169' }
    },
    { 
        value: "Tecnologia Cyberpunk", 
        label: "Cyberpunk (Distópico)", 
        example: "Mistura de alfabetos, caracteres japoneses e digitais. Caótico e futurista.",
        previewStyle: { fontFamily: 'monospace', color: '#D53F8C', textShadow: '2px 2px 0px #00FFFF', fontWeight: 'bold' }
    },
    { 
        value: "Terror Gotejante", 
        label: "Terror Gotejante (Goosebumps)", 
        example: "As letras parecem estar derretendo ou pingando gosma. Divertido para histórias de monstros ou Halloween.",
        previewStyle: { fontFamily: '"Chiller", "Jokerman", cursive', color: '#38A169', textShadow: '1px 1px 2px black' }
    },
    { 
        value: "Terror Riscado", 
        label: "Terror Riscado (Suspense)", 
        example: "Letras feitas de riscos frenéticos e nervosos. Passa tensão e medo.",
        previewStyle: { fontFamily: '"Chalkduster", fantasy', color: '#E53E3E', fontStyle: 'italic' }
    },
    { 
        value: "Velho Oeste", 
        label: "Velho Oeste (Cowboy)", 
        example: "Letras largas, ornamentadas e com 'esporas'. Estilo cartaz de 'Procurado' ou saloon antigo.",
        previewStyle: { fontFamily: '"Rye", "Playbill", serif', textTransform: 'uppercase', color: '#744210', letterSpacing: '2px' }
    },
    { 
        value: "Vitoriano Vintage", 
        label: "Vitoriano (Ornamentado)", 
        example: "Extremamente decorado, com sombras e detalhes internos. Estilo circo antigo ou rótulo de remédio velho.",
        previewStyle: { fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold', color: '#553C9A', textDecoration: 'underline double' }
    },
];

// Options sorted alphabetically by label with preview styles
const coverStyleOptions = [
    { 
        value: "Renderização 3D Fofa", 
        label: "3D Render (Estilo Pixar)", 
        example: "Personagens 'gordinhos', iluminação suave, texturas plásticas ou de pele realista. Parece um filme de animação moderno.",
        previewStyle: { background: 'radial-gradient(circle at 30% 30%, #fff, #f3f4f6, #d1d5db)', boxShadow: 'inset -5px -5px 10px rgba(0,0,0,0.1)', color: '#374151' }
    },
    { 
        value: "Anime Studio Ghibli", 
        label: "Anime (Ghibli)", 
        example: "Cenários de natureza exuberantes e pintados à mão, personagens expressivos, cores vibrantes e nostálgicas.",
        previewStyle: { background: 'linear-gradient(to bottom, #63b3ed, #90cdf4, #c6f6d5)', color: '#2c5282' }
    },
    { 
        value: "Aquarela Suave", 
        label: "Aquarela Suave (Sonhador)", 
        example: "Cores translúcidas que se misturam, texturas de papel visíveis, bordas suaves e manchadas. Delicado e artístico.",
        previewStyle: { background: 'linear-gradient(45deg, #fbc2eb 0%, #a6c1ee 100%)', filter: 'contrast(0.9)', color: '#4a5568' }
    },
    { 
        value: "Blueprint Técnico", 
        label: "Blueprint (Planta)", 
        example: "Fundo azul escuro com linhas brancas técnicas. Parece um projeto de arquitetura ou engenharia.",
        previewStyle: { backgroundColor: '#1e3a8a', backgroundImage: 'linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)', backgroundSize: '10px 10px', color: 'white' }
    },
    {
        value: "Capa Animada",
        label: "Capa Animada (Movimento)",
        example: "Uma capa com elementos que parecem se mover sutilmente, trazendo vida à história antes mesmo de abrir.",
        previewStyle: { 
            background: 'linear-gradient(270deg, #ff9a9e, #fad0c4, #fad0c4)', 
            backgroundSize: '400% 400%', 
            animation: 'previewGradient 3s ease infinite', 
            color: '#fff', 
            fontWeight: 'bold',
            textShadow: '0 0 5px rgba(0,0,0,0.2)'
        }
    },
    { 
        value: "Chibi Fofo", 
        label: "Chibi (Kawai)", 
        example: "Personagens com cabeças grandes e corpos pequenos. Olhos gigantes e brilhantes. Extremamente fofo.",
        previewStyle: { background: '#FFF5F7', border: '3px dashed #F687B3', color: '#D53F8C', borderRadius: '15px' }
    },
    { 
        value: "Cinematográfico Realista", 
        label: "Cinematográfico (Épico)", 
        example: "Parece uma foto de filme de alto orçamento. Iluminação dramática, profundidade de campo (fundo desfocado), alta resolução.",
        previewStyle: { background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(https://via.placeholder.com/50)', backgroundSize: 'cover', color: '#f7fafc', letterSpacing: '2px' }
    },
    { 
        value: "Colagem Mixed Media", 
        label: "Colagem Mixed Media (Texturas)", 
        example: "Mistura de recortes de fotos, papéis texturizados, tecido e desenho à mão. Visual eclético e artesanal.",
        previewStyle: { background: '#fff', backgroundImage: 'radial-gradient(#e2e8f0 20%, transparent 20%)', backgroundSize: '10px 10px', borderLeft: '10px solid #f6e05e', transform: 'rotate(-1deg)', color: '#2d3748' }
    },
    { 
        value: "Cyberpunk Neon", 
        label: "Cyberpunk (Futurista)", 
        example: "Muitos roxos, azuis e rosas neon brilhantes. Ambientes noturnos, chuvosos e tecnológicos.",
        previewStyle: { backgroundColor: '#1a202c', border: '2px solid #0bc5ea', boxShadow: '0 0 10px #d53f8c', color: '#0bc5ea' }
    },
    { 
        value: "Dark Fantasy", 
        label: "Dark Fantasy (Sombrio)", 
        example: "Ambientes escuros, neblina, criaturas misteriosas, iluminação mágica e tons frios.",
        previewStyle: { background: 'linear-gradient(to bottom right, #2d3748, #1a202c)', border: '1px solid #718096', color: '#cbd5e0' }
    },
    { 
        value: "Desenho a Lápis", 
        label: "Lápis de Cor (Escolar)", 
        example: "Riscos visíveis de lápis de cor, preenchimento imperfeito, textura de papel. Parece desenho de criança talentosa.",
        previewStyle: { background: '#fff', borderBottom: '3px solid #fc8181', color: '#744210', fontFamily: 'cursive' }
    },
    { 
        value: "Diorama de Papel", 
        label: "Diorama de Papel (Papercut)", 
        example: "Camadas de papel colorido sobrepostas criando profundidade e sombras. Efeito 3D feito de cartolina.",
        previewStyle: { background: '#4fd1c5', boxShadow: 'inset 0 0 0 5px #38b2ac, inset 0 0 0 10px #319795', color: '#fff' }
    },
    { 
        value: "Esboço a Carvão", 
        label: "Carvão (Rústico)", 
        example: "Preto e branco, traços sujos e esfumaçados, textura de papel rugoso. Dramático e expressivo.",
        previewStyle: { background: '#e2e8f0', color: '#1a202c', fontStyle: 'italic', textDecoration: 'underline' }
    },
    { 
        value: "Feltro e Tecido", 
        label: "Feltro (Artesanato)", 
        example: "Tudo parece feito de tecido, costura visível, botões e texturas de lã. Aconchegante e caseiro.",
        previewStyle: { backgroundColor: '#f687b3', backgroundImage: 'radial-gradient(#fff 20%, transparent 20%)', backgroundSize: '8px 8px', border: '2px dashed white', color: 'white' }
    },
    { 
        value: "Giz Pastel", 
        label: "Giz Pastel (Suave)", 
        example: "Cores muito suaves e poeirentas. Textura aveludada, sem linhas duras. Muito bom para bebês.",
        previewStyle: { background: 'linear-gradient(to right, #f687b3, #f6ad55, #68d391)', opacity: '0.8', color: '#fff' }
    },
    { 
        value: "Graffiti Street Art", 
        label: "Graffiti (Urbano)", 
        example: "Cores neon spray, traços grossos, pingos de tinta, estilo mural de rua. Vibrante e rebelde.",
        previewStyle: { background: '#000', color: '#f6e05e', fontFamily: 'Impact, sans-serif', transform: 'skew(-5deg)' }
    },
    { 
        value: "Ilustração Flat Minimalista", 
        label: "Ilustração Flat (Vetorial)", 
        example: "Cores sólidas e vibrantes, sem sombras complexas ou degradês. Formas geométricas simples. Estilo moderno de aplicativos.",
        previewStyle: { backgroundColor: '#4299e1', color: 'white', border: 'none', borderRadius: '4px' }
    },
    { 
        value: "Impressionismo", 
        label: "Impressionismo (Luz)", 
        example: "Pinceladas curtas e visíveis, foco na luz e movimento, menos foco em detalhes nítidos. Estilo Monet.",
        previewStyle: { background: 'linear-gradient(90deg, #9ae6b4, #63b3ed)', filter: 'blur(0.5px)', color: '#2c5282' }
    },
    { 
        value: "Line Art Detalhado", 
        label: "Line Art (Colorir)", 
        example: "Fundo branco com contornos pretos nítidos e detalhados. Estilo livro de colorir para adultos.",
        previewStyle: { background: '#fff', border: '1px solid #000', color: '#000', fontWeight: '100' }
    },
    { 
        value: "Livro Clássico", 
        label: "Livro Clássico (Beatrix Potter)", 
        example: "Ilustrações pequenas e detalhadas cercadas por texto, cores naturais (verde, marrom), animais realistas com roupas.",
        previewStyle: { backgroundColor: '#f0fff4', border: '1px solid #9c4221', color: '#2f855a', fontFamily: 'serif' }
    },
    { 
        value: "Low Poly 3D", 
        label: "Low Poly (Geométrico)", 
        example: "Objetos formados por poucos polígonos (triângulos). Visual facetado, limpo e moderno.",
        previewStyle: { background: 'linear-gradient(45deg, #4fd1c5 25%, #81e6d9 25%, #81e6d9 50%, #4fd1c5 50%, #4fd1c5 75%, #81e6d9 75%)', backgroundSize: '20px 20px', color: '#234e52' }
    },
    { 
        value: "Escultura em Mármore", 
        label: "Mármore (Estátua)", 
        example: "Tudo é branco e pedra, com iluminação clássica de museu. Solene e artístico.",
        previewStyle: { background: '#f7fafc', color: '#718096', textShadow: '1px 1px 2px #cbd5e0' }
    },
    { 
        value: "Massinha de Modelar", 
        label: "Massinha (Claymation)", 
        example: "Tudo parece feito de plasticina ou massinha Play-Doh. Bordas arredondadas e texturas de impressão digital.",
        previewStyle: { backgroundColor: '#ed8936', borderRadius: '15px', color: 'white', fontWeight: 'bold' }
    },
    { 
        value: "Noir Preto e Branco", 
        label: "Noir (Detetive)", 
        example: "Preto e branco com alto contraste. Sombras dramáticas, persianas, silhuetas e mistério.",
        previewStyle: { background: '#000', color: '#fff', borderRight: '10px solid #4a5568' }
    },
    { 
        value: "Origami Dobradura", 
        label: "Origami (Papel)", 
        example: "Tudo é feito de papel dobrado, com vincos geométricos nítidos. Sem curvas suaves.",
        previewStyle: { background: '#fc8181', clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)', color: 'white' }
    },
    { 
        value: "Pintura a Óleo Digital", 
        label: "Pintura a Óleo (Clássico)", 
        example: "Pinceladas visíveis, texturas grossas, cores ricas e mistura suave. Parece uma obra de arte de museu.",
        previewStyle: { background: 'linear-gradient(135deg, #744210, #b7791f)', color: '#fffdd0', fontStyle: 'italic' }
    },
    { 
        value: "Pixel Art 8-bit", 
        label: "Pixel Art (Retro Game)", 
        example: "Quadradinhos visíveis, resolução baixa, cores limitadas. Estilo Mario Bros ou Minecraft.",
        previewStyle: { fontFamily: 'monospace', background: '#000', color: '#48bb78', border: '2px dashed #48bb78' }
    },
    { 
        value: "Pop Art Vibrante", 
        label: "Pop Art (Warhol)", 
        example: "Cores primárias muito fortes, retículas (pontinhos) de impressão, alto contraste. Estilo história em quadrinhos antiga.",
        previewStyle: { backgroundColor: '#f6e05e', color: '#e53e3e', fontWeight: '900', border: '4px solid black' }
    },
    { 
        value: "Poster Vintage 50s", 
        label: "Vintage 50s (Retro)", 
        example: "Cores desbotadas ou pastéis, sorrisos idealizados, texturas de papel envelhecido. Estilo propaganda antiga.",
        previewStyle: { backgroundColor: '#fff5f5', color: '#9b2c2c', border: '1px solid #feb2b2', fontFamily: 'serif' }
    },
    { 
        value: "Psicodélico Anos 60", 
        label: "Psicodélico (Surreal)", 
        example: "Cores que 'machucam' o olho, formas espirais, distorções, arco-íris e cogumelos.",
        previewStyle: { background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)', color: 'white', fontWeight: 'bold' }
    },
    { 
        value: "Renascença", 
        label: "Renascença (Pintura Antiga)", 
        example: "Composição triangular, querubins, drapeados de tecido realista, luz divina. Estilo Leonardo da Vinci.",
        previewStyle: { backgroundColor: '#2c3e50', color: '#f1c40f', fontFamily: 'Times New Roman, serif' }
    },
    { 
        value: "Steampunk Bronze", 
        label: "Steampunk (Vitoriano)", 
        example: "Tons de marrom, cobre e ouro. Muitas engrenagens, óculos de aviador, vapor e roupas vitorianas.",
        previewStyle: { background: 'linear-gradient(to bottom, #744210, #975a16)', border: '2px solid #d69e2e', color: '#fffff0' }
    },
    { 
        value: "Surrealismo Dali", 
        label: "Surrealismo (Sonhos)", 
        example: "Relógios derretendo, elefantes com pernas finas, paisagens oníricas e impossíveis.",
        previewStyle: { background: 'linear-gradient(to top, #4299e1, #ed8936)', color: '#fff', fontStyle: 'italic' }
    },
    { 
        value: "Ukiyo-e Japonês", 
        label: "Ukiyo-e (Tradicional)", 
        example: "Estilo xilogravura japonesa (como 'A Grande Onda'). Linhas de contorno fortes, cores planas e perspectiva plana.",
        previewStyle: { backgroundColor: '#fff', border: '3px double #2c5282', color: '#c53030' }
    },
    { 
        value: "Vaporwave", 
        label: "Vaporwave (Internet 90s)", 
        example: "Estátuas gregas, palmeiras, golfinhos, Windows 95, rosa e ciano. Estética nostálgica da internet.",
        previewStyle: { background: 'linear-gradient(to right, #d53f8c, #0bc5ea)', color: '#fff' }
    },
    { 
        value: "Vitral Colorido", 
        label: "Vitral (Mosaico)", 
        example: "Imagens formadas por cacos de vidro colorido com contornos pretos grossos (chumbo). Luz atravessando as cores.",
        previewStyle: { background: 'conic-gradient(red, yellow, green, blue, red)', border: '4px solid black', color: 'white', textShadow: '0 0 2px black' }
    },
    { 
        value: "Wireframe Neon", 
        label: "Wireframe (Tron)", 
        example: "Fundo preto, objetos desenhados apenas por linhas finas brilhantes (grade). Estilo computador anos 80.",
        previewStyle: { backgroundColor: 'black', border: '1px solid #0f0', color: '#0f0', fontFamily: 'monospace' }
    },
    { 
        value: "Xilogravura", 
        label: "Xilogravura (Rústico)", 
        example: "Alto contraste preto e branco (ou sépia), marcas de talho na madeira. Aparência de livro de cordel.",
        previewStyle: { backgroundColor: '#fff', color: '#000', border: '2px solid #000', fontWeight: 'bold' }
    },
    { 
        value: "Bordado em Ponto Cruz", 
        label: "Bordado (Caseiro)", 
        example: "A imagem é formada por pequenos 'x' de linha em um tecido. Pixel art analógico.",
        previewStyle: { backgroundColor: '#fff5f5', border: '2px dashed #fc8181', color: '#e53e3e' }
    }
];

// Options sorted alphabetically by label with preview styles
const coverFormatOptions = [
    { 
        value: "Álbum de Fotos", 
        label: "Álbum de Fotos", 
        example: "Capa acolchoada com moldura para foto central, cantoneiras de metal, aparência de lembrança de família.",
        previewStyle: { border: '8px solid #744210', backgroundColor: '#f7fafc', color: '#744210', borderRadius: '4px' }
    },
    { 
        value: "Amazon KDP (Trade)", 
        label: "Amazon KDP (Profissional)", 
        example: "Estilo comercial padrão da Amazon, layout limpo, pronto para impressão on-demand, margens profissionais.",
        previewStyle: { borderLeft: '4px solid #cbd5e0', backgroundColor: '#fff', color: '#2d3748', boxShadow: '2px 2px 5px rgba(0,0,0,0.1)' }
    },
    { 
        value: "Brochura (Paperback)", 
        label: "Brochura (Livraria)", 
        example: "Capa flexível tradicional (softcover), acabamento brilhante ou fosco, estilo comum em livrarias.",
        previewStyle: { borderLeft: '3px solid #cbd5e0', backgroundColor: '#fff', color: '#4a5568', borderRadius: '0 4px 4px 0' }
    },
    { 
        value: "Caderno Espiral", 
        label: "Caderno Espiral (Escolar)", 
        example: "Encadernação com mola (espiral) lateral. Estilo caderno de desenho ou diário escolar.",
        previewStyle: { borderLeft: '8px dotted #a0aec0', backgroundColor: '#fff', color: '#2d3748', marginLeft: '5px' }
    },
    { 
        value: "Capa Acolchoada", 
        label: "Capa Acolchoada (Infantil)", 
        example: "Capa grossa e fofinha ao toque, cantos arredondados, comum em livros para bebês.",
        previewStyle: { border: '4px solid #f687b3', borderRadius: '15px', backgroundColor: '#fff5f7', color: '#d53f8c' }
    },
    { 
        value: "Capa de Couro Luxo", 
        label: "Capa de Couro (Antigo/Luxo)", 
        example: "Textura de couro envelhecido, detalhes em dourado (hot stamping), aparência de grimório ou clássico.",
        previewStyle: { backgroundColor: '#4a2511', border: '2px solid #d69e2e', color: '#d69e2e', borderRadius: '2px' }
    },
    { 
        value: "Capa Dura (Hardcover)", 
        label: "Capa Dura (Clássico)", 
        example: "Visual de livro físico robusto, texturas de papelão rígido, lombada visível e acabamento premium.",
        previewStyle: { borderLeft: '10px solid #2c5282', backgroundColor: '#ebf8ff', color: '#2a4365', boxShadow: '5px 5px 10px rgba(0,0,0,0.2)' }
    },
    { 
        value: "Capa Holográfica", 
        label: "Capa Holográfica (Brilhante)", 
        example: "Material prateado que reflete arco-íris dependendo da luz. Muito chamativo e mágico.",
        previewStyle: { background: 'linear-gradient(135deg, #e2e8f0 0%, #ffffff 50%, #e2e8f0 100%)', border: '1px solid #cbd5e0', color: '#718096' }
    },
    { 
        value: "Capa Metalizada", 
        label: "Capa Metalizada (Gold Foil)", 
        example: "Detalhes em folha de ouro ou prata sobre a arte, criando um efeito de relevo brilhante e luxuoso.",
        previewStyle: { background: 'linear-gradient(45deg, #d69e2e, #ecc94b, #d69e2e)', color: 'white', textShadow: '0 1px 1px rgba(0,0,0,0.3)' }
    },
    { 
        value: "Capa de Tecido", 
        label: "Capa de Tecido (Textura)", 
        example: "Encadernação feita em tecido de linho ou algodão, com o título bordado ou impresso sobre a trama.",
        previewStyle: { backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '4px 4px', backgroundColor: '#fff', borderLeft: '5px solid #a0aec0', color: '#4a5568' }
    },
    { 
        value: "Comic Book", 
        label: "Comic Book (HQ)", 
        example: "Papel estilo jornal, grampos na lombada, código de barras no canto, selo de aprovação de quadrinhos.",
        previewStyle: { borderLeft: '2px solid #000', backgroundColor: '#fff', color: '#000', fontFamily: 'Comic Sans MS, sans-serif' }
    },
    { 
        value: "Diário com Cadeado", 
        label: "Diário com Cadeado (Secreto)", 
        example: "Livro pequeno com uma fivela de metal e um pequeno cadeado pendurado. Capa rosa ou decorada.",
        previewStyle: { backgroundColor: '#fbb6ce', borderRight: '8px solid #cbd5e0', borderRadius: '4px', color: '#fff' }
    },
    { 
        value: "E-book Kindle", 
        label: "E-book Kindle (Digital)", 
        example: "Design otimizado para telas, alto contraste, sem efeitos 3D de lombada, foco total na arte frontal.",
        previewStyle: { border: '6px solid #1a202c', backgroundColor: '#edf2f7', color: '#2d3748', borderRadius: '8px' }
    },
    { 
        value: "Encadernação Japonesa", 
        label: "Encadernação Japonesa (Artesanal)", 
        example: "Lombada costurada visivelmente com linha grossa (costura exposta). Papel texturizado e visual zen.",
        previewStyle: { borderLeft: '8px dashed #2c5282', backgroundColor: '#fffaf0', color: '#2c5282' }
    },
    { 
        value: "Estilo Cordel", 
        label: "Estilo Cordel (Brasileiro)", 
        example: "Folheto simples de papel pardo, arte em xilogravura preto e branco, pendurado em um barbante.",
        previewStyle: { backgroundColor: '#ecc94b', color: 'black', borderTop: '2px solid black' }
    },
    { 
        value: "Estilo Grimório", 
        label: "Estilo Grimório (Mágico)", 
        example: "Livro grosso e pesado, cantos de metal, pedras preciosas incrustadas na capa, aspecto de livro de feitiços.",
        previewStyle: { backgroundColor: '#2d3748', border: '3px solid #d69e2e', color: '#d69e2e', boxShadow: 'inset 0 0 10px black' }
    },
    { 
        value: "Estilo Manga", 
        label: "Estilo Mangá (Japonês)", 
        example: "Tamanho de bolso (tankobon), sobrecapa brilhante, título em japonês e português, arte em preto e branco.",
        previewStyle: { borderRight: '4px solid #cbd5e0', backgroundColor: '#fff', color: '#000', fontSize: '0.8em' }
    },
    { 
        value: "Fita Cassete VHS", 
        label: "Fita VHS (Retrô)", 
        example: "Caixa plástica grande de fita de vídeo antiga, com a arte inserida na capa transparente. Nostalgia anos 90.",
        previewStyle: { backgroundColor: '#1a202c', border: '1px solid #4a5568', color: '#fff', borderRadius: '2px' }
    },
    { 
        value: "Jacket (Sobrecapa)", 
        label: "Jacket (Sobrecapa/Dust Jacket)", 
        example: "Livro com uma sobrecapa de papel removível e abas laterais dobradas, visual sofisticado.",
        previewStyle: { borderLeft: '6px double #2b6cb0', backgroundColor: '#ebf8ff', color: '#2b6cb0' }
    },
    { 
        value: "Jornal Dobrado", 
        label: "Jornal Dobrado (Manchete)", 
        example: "Papel jornal amarelado, texto em colunas, manchete gigante no topo, dobras visíveis.",
        previewStyle: { backgroundColor: '#fefcbf', color: '#2d3748', borderBottom: '1px solid #cbd5e0' }
    },
    { 
        value: "Livro de Banho", 
        label: "Livro de Banho (Plástico)", 
        example: "Feito de material plástico impermeável e brilhante, bordas soldadas, para ler na banheira.",
        previewStyle: { backgroundColor: '#bee3f8', border: '4px solid #63b3ed', borderRadius: '10px', color: '#2c5282' }
    },
    { 
        value: "Livro de Colorir", 
        label: "Livro de Colorir (Atividades)", 
        example: "Capa com partes 'em branco' para pintar, linhas pretas nítidas, visual de passatempo.",
        previewStyle: { backgroundColor: '#fff', border: '2px dashed #000', color: '#000' }
    },
    { 
        value: "Livro de Ouro", 
        label: "Livro de Ouro (Golden Books)", 
        example: "Lombada icônica de fita dourada brilhante, capa de papelão duro. Clássico americano.",
        previewStyle: { borderLeft: '8px solid #ecc94b', backgroundColor: '#fff', color: '#744210' }
    },
    { 
        value: "Livro de Tabuleiro", 
        label: "Livro de Tabuleiro (Board Book)", 
        example: "Páginas de papelão muito grossas (cartonado), cantos arredondados, resistente para bebês.",
        previewStyle: { border: '4px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff', color: '#4a5568' }
    },
    { 
        value: "Livro Pop-Up", 
        label: "Livro Pop-Up (3D)", 
        example: "Aberto mostrando elementos de papel complexos saltando para fora da página. Engenharia de papel.",
        previewStyle: { borderBottom: '4px solid #fc8181', backgroundColor: '#fff', color: '#e53e3e', transform: 'perspective(500px) rotateX(10deg)' }
    },
    { 
        value: "Manuscrito Enrolado", 
        label: "Manuscrito (Pergaminho)", 
        example: "Um rolo de papel antigo ou papiro, enrolado com uma fita de cera ou selo real. Antiguidade.",
        previewStyle: { backgroundColor: '#fefcbf', border: '1px solid #d69e2e', borderRadius: '20px', color: '#744210' }
    },
    { 
        value: "Moleskine", 
        label: "Moleskine (Caderneta)", 
        example: "Capa preta arredondada, elástico para fechar na vertical, fita marcadora de página. Clássico e minimalista.",
        previewStyle: { backgroundColor: '#1a202c', color: '#fff', borderRadius: '6px', borderRight: '2px solid #4a5568' }
    },
    { 
        value: "Pasta Confidencial", 
        label: "Pasta Confidencial (Arquivo)", 
        example: "Pasta de arquivo pardo, carimbo 'TOP SECRET' vermelho, clipes de papel segurando fotos.",
        previewStyle: { backgroundColor: '#d69e2e', color: '#744210', borderTop: '4px solid #975a16', borderRadius: '2px' }
    },
    { 
        value: "Polaroid", 
        label: "Polaroid (Instantânea)", 
        example: "A capa imita uma foto instantânea com borda branca larga na parte inferior para escrever o título à mão.",
        previewStyle: { paddingBottom: '20px', backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#2d3748' }
    },
    { 
        value: "Revista de Moda", 
        label: "Revista Glossy (Moda)", 
        example: "Papel de alta gramatura brilhante, foto de corpo inteiro, manchetes coloridas nas laterais. Vogue style.",
        previewStyle: { borderLeft: '1px solid #cbd5e0', backgroundColor: '#fff', color: '#d53f8c', fontStyle: 'italic' }
    },
    { 
        value: "Scrapbook Artesanal", 
        label: "Scrapbook (Colagem)", 
        example: "Capa cheia de camadas, fitas, adesivos, botões e recortes colados manualmente. Visual caótico e afetivo.",
        previewStyle: { border: '4px dashed #f687b3', backgroundColor: '#fff', color: '#d53f8c', transform: 'rotate(-1deg)' }
    },
    { 
        value: "Zine Fotocopiado", 
        label: "Zine (Indie)", 
        example: "Aparência de xerox preto e branco, grampeado no meio, estética 'faça você mesmo' e underground.",
        previewStyle: { backgroundColor: '#e2e8f0', color: '#000', borderLeft: '2px solid #4a5568', filter: 'contrast(1.2)' }
    }
];

// Generate numbers from 2 to 20
const pageOptions = Array.from({ length: 19 }, (_, i) => i + 2);

const StorybookCreator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [numPages, setNumPages] = useState(2);
  const [typography, setTypography] = useState(typographyOptions[0].value);
  const [coverStyle, setCoverStyle] = useState(coverStyleOptions[0].value);
  const [coverFormat, setCoverFormat] = useState(coverFormatOptions[0].value);
  const [storybook, setStorybook] = useState<StoryPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  
  // Save/Load states
  const [hasSavedStory, setHasSavedStory] = useState(false);
  const [savedDate, setSavedDate] = useState<string | null>(null);
  
  // Focus mode states
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);

  // Helper to get current option details
  const selectedTypoOption = typographyOptions.find(opt => opt.value === typography);
  const selectedCoverOption = coverStyleOptions.find(opt => opt.value === coverStyle);
  const selectedFormatOption = coverFormatOptions.find(opt => opt.value === coverFormat);

  useEffect(() => {
    // Check for saved story on mount
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            if (parsed && parsed.storybook && parsed.storybook.length > 0) {
                setHasSavedStory(true);
                if (parsed.timestamp) {
                    setSavedDate(new Date(parsed.timestamp).toLocaleString());
                }
            }
        }
    } catch (e) {
        console.error("Error checking local storage", e);
    }
  }, []);

  // Clear feedback message after 3 seconds
  useEffect(() => {
      if (feedbackMessage) {
          const timer = setTimeout(() => setFeedbackMessage(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [feedbackMessage]);

  const saveProgress = () => {
      if (storybook.length === 0 && !topic) {
          setError("Não há nada para salvar ainda.");
          return;
      }
      
      const dataToSave = {
          topic,
          numPages,
          typography,
          coverStyle,
          coverFormat,
          storybook,
          timestamp: Date.now()
      };

      try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
          setFeedbackMessage("Progresso salvo com sucesso!");
          setHasSavedStory(true);
          setSavedDate(new Date().toLocaleString());
          setError(null);
      } catch (e: any) {
          console.error("Save error", e);
          if (e.name === 'QuotaExceededError') {
              setError("Espaço insuficiente para salvar a história completa (muitas imagens). Tente salvar com menos páginas.");
          } else {
              setError("Falha ao salvar o progresso.");
          }
      }
  };

  const loadProgress = () => {
      try {
          const savedData = localStorage.getItem(STORAGE_KEY);
          if (savedData) {
              const parsed = JSON.parse(savedData);
              if (parsed.topic) setTopic(parsed.topic);
              if (parsed.numPages) setNumPages(parsed.numPages);
              if (parsed.typography) setTypography(parsed.typography);
              if (parsed.coverStyle) setCoverStyle(parsed.coverStyle);
              if (parsed.coverFormat) setCoverFormat(parsed.coverFormat);
              if (parsed.storybook) setStorybook(parsed.storybook);
              
              setFeedbackMessage("História carregada com sucesso!");
              setHasSavedStory(false); // Hide banner after loading
              setError(null);
          }
      } catch (e) {
          console.error("Load error", e);
          setError("Erro ao carregar o rascunho salvo.");
      }
  };

  const dismissSavedBanner = () => {
      setHasSavedStory(false);
  };

  const generateStory = async (selectedTopic: string, selectedNumPages: number, selectedTypo: string, selectedStyle: string, selectedFormat: string) => {
    if (!selectedTopic) {
      setError("Por favor, insira um tema para a história.");
      return;
    }
    setError(null);
    setLoading(true);
    setStorybook([]);
    try {
      const pages = await createStorybook(selectedTopic, selectedNumPages, selectedTypo, selectedStyle, selectedFormat);
      setStorybook(pages);
      // Auto-save initial text generation
      try {
          const dataToSave = {
            topic: selectedTopic,
            numPages: selectedNumPages,
            typography: selectedTypo,
            coverStyle: selectedStyle,
            coverFormat: selectedFormat,
            storybook: pages,
            timestamp: Date.now()
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (e) { console.warn("Auto-save failed", e); }

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Falha ao criar a história. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStory = () => {
    generateStory(topic, numPages, typography, coverStyle, coverFormat);
  };

  const handleRandomStory = () => {
    const randomTopic = randomTopics[Math.floor(Math.random() * randomTopics.length)];
    const randomNumPages = pageOptions[Math.floor(Math.random() * pageOptions.length)];
    const randomTypo = typographyOptions[Math.floor(Math.random() * typographyOptions.length)].value;
    const randomStyle = coverStyleOptions[Math.floor(Math.random() * coverStyleOptions.length)].value;
    const randomFormat = coverFormatOptions[Math.floor(Math.random() * coverFormatOptions.length)].value;

    setTopic(randomTopic);
    setNumPages(randomNumPages);
    setTypography(randomTypo);
    setCoverStyle(randomStyle);
    setCoverFormat(randomFormat);

    generateStory(randomTopic, randomNumPages, randomTypo, randomStyle, randomFormat);
  };

  const handleGenerateImage = async (pageKey: string, prompt: string) => {
    setImageLoading(prev => ({ ...prev, [pageKey]: true }));
    setError(null); // Clear previous errors
    try {
      const base64Image = await generateStoryPageImage(prompt);
      setStorybook(prev => {
        const updated = prev.map(p => {
            const key = p.page === 'Capa' ? 'Capa' : `page-${p.page}`;
            if (key === pageKey) {
                return { ...p, imageUrl: `data:image/png;base64,${base64Image}` };
            }
            return p;
        });
        
        // Auto-save image update
        // Note: This might trigger quota exceeded for many images
        try {
            const dataToSave = {
                topic,
                numPages,
                typography,
                coverStyle,
                coverFormat,
                storybook: updated,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        } catch (e) { console.warn("Auto-save image failed", e); }
        
        return updated;
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message || `Falha ao gerar a imagem para a página ${pageKey}.`);
    } finally {
        setImageLoading(prev => ({ ...prev, [pageKey]: false }));
    }
  };

  const handleNextPage = () => {
    setCurrentFocusIndex((prev) => Math.min(prev + 1, storybook.length));
  };

  const handlePrevPage = () => {
    setCurrentFocusIndex((prev) => Math.max(prev - 1, 0));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFocusMode) return;
    if (e.key === 'ArrowRight') handleNextPage();
    if (e.key === 'ArrowLeft') handlePrevPage();
    if (e.key === 'Escape') setIsFocusMode(false);
  };

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        storybook.forEach((page, index) => {
            // Determine if we need to add a new page for the Image/Front side
            if (index > 0) {
                doc.addPage();
            }

            // --- PAGE SIDE 1: IMAGE (Face Front) ---
            if (page.page === 'Capa') {
                 // COVER IMAGE
                 if (page.imageUrl) {
                    const imgDim = 120;
                    const x = (pageWidth - imgDim) / 2;
                    doc.addImage(page.imageUrl, 'PNG', x, 40, imgDim, imgDim);
                 } else {
                     doc.setFontSize(10);
                     doc.text("[Imagem da Capa]", pageWidth/2, 100, { align: 'center'});
                 }
                 // COVER TITLE
                 if (page.title) {
                     doc.setFont("helvetica", "bold");
                     doc.setFontSize(24);
                     doc.text(page.title, pageWidth/2, 180, { align: 'center', maxWidth: contentWidth });
                 }
                 doc.setFontSize(12);
                 doc.setFont("helvetica", "normal");
                 doc.text("Criado com Creative Suite AI", pageWidth/2, pageHeight - 15, { align: 'center'});

            } else {
                // STORY PAGE IMAGE LAYOUT
                if (page.imageUrl) {
                    // Maximize image
                    const imgDim = 150;
                    const x = (pageWidth - imgDim) / 2;
                    const y = (pageHeight - imgDim) / 2;
                    try {
                         doc.addImage(page.imageUrl, 'PNG', x, y, imgDim, imgDim);
                    } catch (e) { /* ignore */ }
                } else {
                    doc.text("[Imagem pendente]", pageWidth/2, pageHeight/2, { align: 'center'});
                }
                 doc.setFontSize(10);
                 doc.text(`Ilustração ${page.page}`, pageWidth/2, pageHeight - 10, { align: 'center'});
            }

            // --- PAGE SIDE 2: TEXT (Face Back) ---
            doc.addPage(); // Always separate page for text
            
            doc.setFont("times", "normal");
            doc.setFontSize(16);
            
            const text = doc.splitTextToSize(page.narrative, contentWidth);
            
            // Center text vertically
            const textHeight = text.length * 8; // approx line height
            const yText = (pageHeight - textHeight) / 2;
            
            doc.text(text, pageWidth/2, Math.max(margin, yText), { align: 'center' });
            
            // Footer
            const footerText = page.page === 'Capa' ? 'Introdução' : `Página ${page.page}`;
            doc.setFontSize(10);
            doc.text(footerText, pageWidth/2, pageHeight - 10, { align: 'center'});
        });

        doc.save(`${topic.substring(0, 30).replace(/[^a-z0-9]/gi, '_') || 'historia'}.pdf`);

    } catch (e: any) {
        console.error(e);
        setError("Erro ao gerar PDF. Tente novamente.");
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8" onKeyDown={handleKeyDown} tabIndex={0}>
       <style>{`
        @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes previewGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes gentleFloat {
            0% { transform: translateY(0px) scale(1); filter: brightness(100%); }
            50% { transform: translateY(-3px) scale(1.01); filter: brightness(110%); }
            100% { transform: translateY(0px) scale(1); filter: brightness(100%); }
        }
        
        /* 3D Book Styles */
        .book-scene {
            perspective: 2000px;
        }
        .book {
            position: relative;
            width: 350px;
            height: 500px;
            transform-style: preserve-3d;
        }
        .book-page {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            transform-origin: left center;
            transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
            transform-style: preserve-3d;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .face-front, .face-back {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            background-color: white;
            overflow: hidden;
        }
        .face-front {
            z-index: 2;
            transform: rotateY(0deg);
            border-top-right-radius: 4px;
            border-bottom-right-radius: 4px;
            background: linear-gradient(to right, #e3e3e3 0%, #ffffff 5%, #ffffff 100%);
        }
        .face-back {
            z-index: 1;
            transform: rotateY(180deg);
            border-top-left-radius: 4px;
            border-bottom-left-radius: 4px;
            background: linear-gradient(to left, #e3e3e3 0%, #fffaf0 5%, #fffaf0 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            border-left: 1px solid #ddd;
        }
        .book-page.flipped {
            transform: rotateY(-180deg);
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        
        /* Mobile adjustment */
        @media (max-width: 768px) {
            .book {
                width: 300px;
                height: 450px;
            }
        }
       `}</style>

      {/* Recover Saved Story Banner */}
      {hasSavedStory && storybook.length === 0 && (
          <div className="bg-gradient-to-r from-indigo-900 to-purple-900 border border-indigo-500 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between shadow-lg animate-fade-in-down mb-6">
              <div className="flex items-center space-x-3 mb-3 md:mb-0">
                  <span className="text-2xl">📂</span>
                  <div>
                      <h3 className="font-bold text-white">Rascunho Encontrado</h3>
                      <p className="text-sm text-indigo-200">
                          Existe uma história salva {savedDate ? `em ${savedDate}` : ''}. Deseja continuar?
                      </p>
                  </div>
              </div>
              <div className="flex space-x-3">
                  <button 
                      onClick={dismissSavedBanner}
                      className="px-4 py-2 text-sm text-gray-300 hover:text-white transition"
                  >
                      Descartar
                  </button>
                  <button 
                      onClick={loadProgress}
                      className="px-6 py-2 bg-white text-indigo-900 font-bold rounded-md hover:bg-indigo-50 transition shadow-md"
                  >
                      Continuar de onde parou
                  </button>
              </div>
          </div>
      )}

      {feedbackMessage && (
          <div className="fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50 flex items-center space-x-2 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{feedbackMessage}</span>
          </div>
      )}

      {/* Focus Mode Overlay (3D Book Flip) */}
      {isFocusMode && storybook.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
            <button 
                onClick={() => setIsFocusMode(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-gray-800/50 z-50"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            
            <div className="book-scene flex items-center justify-center w-full h-full relative">
                {/* Book Navigation Arrows */}
                 <button 
                    onClick={handlePrevPage}
                    disabled={currentFocusIndex === 0}
                    className="absolute left-4 md:left-20 z-50 p-4 rounded-full bg-gray-800/80 text-white disabled:opacity-0 hover:bg-gray-700 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="book">
                     {/* Map pages in reverse order for correct Z-indexing when stacked */}
                     {storybook.map((page, index) => {
                         const isFlipped = index < currentFocusIndex;
                         // Z-index calculation:
                         // When not flipped (right stack): higher index = lower z-index (0 is top)
                         // When flipped (left stack): higher index = higher z-index (flipped 0 is bottom)
                         const zIndex = isFlipped ? index : storybook.length - index;
                         const isAnimatedCover = page.page === 'Capa' && coverStyle === 'Capa Animada';

                         return (
                            <div 
                                key={`page-${index}`}
                                className={`book-page ${isFlipped ? 'flipped' : ''}`}
                                style={{ zIndex: zIndex }}
                            >
                                {/* Face Front: IMAGE ONLY */}
                                <div className="face-front flex flex-col items-center justify-center border-r border-gray-300 overflow-hidden">
                                     {/* For Cover, show Title overlay */}
                                     {page.page === 'Capa' && page.title && (
                                         <div className="absolute top-8 left-0 right-0 z-10 px-4 text-center">
                                             <h1 className="text-3xl font-bold text-gray-800 drop-shadow-md font-serif">{page.title}</h1>
                                         </div>
                                     )}
                                     
                                     {page.imageUrl ? (
                                         <img 
                                             src={page.imageUrl} 
                                             alt={`Ilustração ${page.page}`} 
                                             className="w-full h-full object-cover"
                                             style={isAnimatedCover ? { animation: 'gentleFloat 4s ease-in-out infinite' } : {}}
                                         />
                                     ) : (
                                         <div className="text-gray-400">Sem imagem</div>
                                     )}
                                     
                                     {/* Page Number indicator for Front */}
                                     {page.page !== 'Capa' && (
                                         <div className="absolute bottom-2 right-2 text-xs bg-white/50 px-2 rounded backdrop-blur-sm shadow-sm text-gray-700">
                                            Ilustração {page.page}
                                         </div>
                                     )}
                                     <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-black/5 to-transparent pointer-events-none"></div>
                                </div>

                                {/* Face Back: TEXT ONLY */}
                                <div className="face-back p-8 flex flex-col items-center justify-center text-center relative">
                                    <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-black/5 to-transparent pointer-events-none"></div>
                                    
                                    <div className="border-4 border-double border-gray-200 p-6 h-full w-full flex flex-col items-center justify-center bg-white/50">
                                        <p 
                                            className="text-xl text-gray-800 leading-loose"
                                            style={{ fontFamily: selectedTypoOption?.previewStyle.fontFamily }}
                                        >
                                            {page.narrative}
                                        </p>
                                    </div>
                                    
                                    <div className="absolute bottom-4 text-gray-400 text-sm font-serif">
                                        {page.page === 'Capa' ? 'Introdução' : `Página ${page.page}`}
                                    </div>
                                </div>
                            </div>
                         );
                     })}
                </div>

                <button 
                    onClick={handleNextPage}
                    disabled={currentFocusIndex === storybook.length}
                    className="absolute right-4 md:right-20 z-50 p-4 rounded-full bg-gray-800/80 text-white disabled:opacity-0 hover:bg-gray-700 transition"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
            
            <p className="text-gray-400 mt-6 text-sm font-medium">
                Use as setas para virar a página
            </p>
        </div>
      )}

      {/* Main Editor UI - Hidden when in Focus Mode */}
      <div className={`space-y-8 ${isFocusMode ? 'hidden' : 'block'}`}>
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                <h2 className="text-3xl font-bold text-white">Criador de Histórias Infantis</h2>
                <div className="flex flex-wrap gap-2">
                    {(storybook.length > 0 || topic) && (
                         <button 
                            onClick={saveProgress}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition border border-gray-600"
                            title="Salvar progresso atual"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                            </svg>
                            Salvar Progresso
                         </button>
                    )}
                    
                    {storybook.length > 0 && (
                        <>
                             <button 
                                onClick={handleDownloadPDF}
                                disabled={isDownloading}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
                             >
                                {isDownloading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                )}
                                Baixar PDF
                             </button>
                             <button 
                                onClick={() => {
                                    setCurrentFocusIndex(0);
                                    setIsFocusMode(true);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
                             >
                                <span>📖</span> Modo Leitura
                             </button>
                        </>
                    )}
                </div>
            </div>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {/* Typography Selector */}
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
                          <div className="mt-2 text-xs bg-gray-700/50 rounded border border-gray-700 overflow-hidden">
                              <div className="p-2 border-b border-gray-600 bg-gray-900/50">
                                  <span className="text-gray-500 block mb-1">Prévia Visual:</span>
                                  <div className="text-2xl text-center py-2 px-1 break-words leading-tight" style={selectedTypoOption.previewStyle}>
                                      {selectedTypoOption.label}
                                  </div>
                              </div>
                              <div className="p-2 text-gray-400">
                                  <span className="font-semibold text-indigo-300 block mb-1">Descrição:</span> 
                                  {selectedTypoOption.example}
                              </div>
                          </div>
                      )}
                    </div>

                    {/* Cover Style Selector */}
                    <div>
                      <label htmlFor="cover-style-select" className="block text-sm font-medium text-gray-300 mb-2">Estilo de Arte</label>
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
                          <div className="mt-2 text-xs bg-gray-700/50 rounded border border-gray-700 overflow-hidden">
                              <div className="p-2 border-b border-gray-600 bg-gray-900/50">
                                  <span className="text-gray-500 block mb-1">Prévia Visual:</span>
                                  <div className="h-16 w-full rounded flex items-center justify-center text-center p-1 text-sm font-bold shadow-inner" style={selectedCoverOption.previewStyle}>
                                      {selectedCoverOption.label}
                                  </div>
                              </div>
                              <div className="p-2 text-gray-400">
                                   <span className="font-semibold text-purple-300 block mb-1">Resultado:</span>
                                   {selectedCoverOption.example}
                              </div>
                          </div>
                      )}
                    </div>

                    {/* Cover Format Selector */}
                    <div>
                      <label htmlFor="cover-format-select" className="block text-sm font-medium text-gray-300 mb-2">Modelo da Capa</label>
                      <select
                        id="cover-format-select"
                        value={coverFormat}
                        onChange={(e) => setCoverFormat(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      >
                        {coverFormatOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      {selectedFormatOption && (
                          <div className="mt-2 text-xs bg-gray-700/50 rounded border border-gray-700 overflow-hidden">
                               <div className="p-2 border-b border-gray-600 bg-gray-900/50 flex justify-center">
                                  <div className="w-24 h-16 flex items-center justify-center text-center p-1 text-[10px] font-bold shadow-lg" style={selectedFormatOption.previewStyle}>
                                      {selectedFormatOption.label}
                                  </div>
                              </div>
                              <div className="p-2 text-gray-400">
                                   <span className="font-semibold text-green-300 block mb-1">Formato:</span>
                                   {selectedFormatOption.example}
                              </div>
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

        {loading && (
          <div style={{ animation: 'fadeIn 0.8s ease-out forwards' }}>
             <Loader message="Escrevendo sua história..." />
          </div>
        )}

        {storybook.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {storybook.map((page) => {
              const pageKey = page.page === 'Capa' ? 'Capa' : `page-${page.page}`;
              const isLoadingImage = imageLoading[pageKey];
              const isAnimatedCover = page.page === 'Capa' && coverStyle === 'Capa Animada';

              return (
                <div key={pageKey} className="bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col">
                  <div className="h-64 bg-gray-700 flex items-center justify-center overflow-hidden">
                    {isLoadingImage ? <Loader message="Desenhando..." /> : 
                     page.imageUrl ? (
                        <img 
                            src={page.imageUrl} 
                            alt={`Ilustração para ${page.title || `página ${page.page}`}`} 
                            className="w-full h-full object-cover" 
                            style={isAnimatedCover ? { animation: 'gentleFloat 4s ease-in-out infinite' } : {}}
                        />
                     ) :
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
    </div>
  );
};

export default StorybookCreator;

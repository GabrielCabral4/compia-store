/**
 * Catálogo inicial da COMPIA. Usado pelo seed e pelo gerador de capas.
 * Preços em centavos.
 */

export type SeedCategory = {
  name: string;
  slug: string;
  description: string;
  accent: [string, string];
};

export const CATEGORIES: SeedCategory[] = [
  {
    name: "Inteligência Artificial",
    slug: "inteligencia-artificial",
    description:
      "Fundamentos, aprendizado de máquina, redes neurais e IA generativa.",
    accent: ["#312e81", "#0ea5e9"],
  },
  {
    name: "Arquitetura de Software Inteligente",
    slug: "arquitetura-de-software-inteligente",
    description:
      "Padrões, MLOps e engenharia de sistemas que embarcam modelos de IA.",
    accent: ["#0f766e", "#84cc16"],
  },
  {
    name: "Blockchain",
    slug: "blockchain",
    description: "Redes distribuídas, contratos inteligentes e tokenização.",
    accent: ["#7c2d12", "#f59e0b"],
  },
  {
    name: "Criptografia",
    slug: "criptografia",
    description: "Teoria e prática de cifras, protocolos e provas.",
    accent: ["#1e1b4b", "#a78bfa"],
  },
  {
    name: "Cibersegurança",
    slug: "ciberseguranca",
    description: "Defesa, resposta a incidentes e segurança ofensiva.",
    accent: ["#7f1d1d", "#f43f5e"],
  },
  {
    name: "Ciência de Dados",
    slug: "ciencia-de-dados",
    description: "Estatística aplicada, engenharia de dados e visualização.",
    accent: ["#164e63", "#22d3ee"],
  },
];

export type SeedProduct = {
  sku: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  type: "FISICO" | "DIGITAL" | "KIT";
  priceCents: number;
  compareAtCents?: number;
  stock: number;
  weightGrams: number;
  taxRateBasisPoints?: number;
  author?: string;
  isbn?: string;
  pages?: number;
  edition?: string;
  year?: number;
  categorySlug: string;
  tags: string[];
  featured?: boolean;
  digitalFileName?: string;
  /** SKUs que compõem o kit. */
  kitOf?: string[];
};

export const TAGS = [
  "machine-learning",
  "deep-learning",
  "llm",
  "python",
  "redes-neurais",
  "seguranca",
  "iniciante",
  "avancado",
  "universitario",
  "corporativo",
  "lancamento",
];

export const PRODUCTS: SeedProduct[] = [
  {
    sku: "COMPIA-001",
    slug: "fundamentos-de-inteligencia-artificial",
    title: "Fundamentos de Inteligência Artificial",
    subtitle: "Da busca heurística ao aprendizado supervisionado",
    description:
      "Obra introdutória que percorre a história e os pilares da Inteligência Artificial: representação do conhecimento, algoritmos de busca, raciocínio probabilístico e os primeiros modelos de aprendizado. Cada capítulo traz exercícios resolvidos e um estudo de caso implementado em Python, o que torna o livro adequado tanto para disciplinas de graduação quanto para autodidatas que estão começando na área.",
    type: "FISICO",
    priceCents: 12990,
    compareAtCents: 15990,
    stock: 42,
    weightGrams: 780,
    author: "Ana Cristina Vilela",
    isbn: "978-85-9999-001-2",
    pages: 428,
    edition: "3ª edição",
    year: 2025,
    categorySlug: "inteligencia-artificial",
    tags: ["machine-learning", "iniciante", "universitario", "python"],
    featured: true,
  },
  {
    sku: "COMPIA-002",
    slug: "aprendizado-profundo-na-pratica",
    title: "Aprendizado Profundo na Prática",
    subtitle: "Redes neurais, treinamento e ajuste fino",
    description:
      "Um guia completo sobre redes neurais profundas: perceptrons multicamada, convoluções, recorrências e transformers. O texto equilibra a fundamentação matemática com implementações comentadas, discutindo regularização, otimizadores, inicialização de pesos e as armadilhas mais comuns do treinamento em GPU.",
    type: "FISICO",
    priceCents: 17990,
    stock: 30,
    weightGrams: 920,
    author: "Rafael Duarte Nogueira",
    isbn: "978-85-9999-002-9",
    pages: 512,
    edition: "2ª edição",
    year: 2025,
    categorySlug: "inteligencia-artificial",
    tags: ["deep-learning", "redes-neurais", "avancado", "python"],
    featured: true,
  },
  {
    sku: "COMPIA-003",
    slug: "modelos-de-linguagem-de-grande-escala",
    title: "Modelos de Linguagem de Grande Escala",
    subtitle: "Arquitetura, treinamento e avaliação de LLMs",
    description:
      "Explica em profundidade como funcionam os modelos de linguagem modernos: tokenização, atenção, pré-treinamento, alinhamento por feedback humano e técnicas de avaliação. Inclui capítulos sobre custo computacional, riscos de alucinação e estratégias de recuperação aumentada (RAG).",
    type: "FISICO",
    priceCents: 19990,
    stock: 25,
    weightGrams: 890,
    author: "Marina Sales Andrade",
    isbn: "978-85-9999-003-6",
    pages: 476,
    edition: "1ª edição",
    year: 2026,
    categorySlug: "inteligencia-artificial",
    tags: ["llm", "deep-learning", "avancado", "lancamento"],
    featured: true,
  },
  {
    sku: "COMPIA-004",
    slug: "arquitetura-de-software-para-sistemas-inteligentes",
    title: "Arquitetura de Software para Sistemas Inteligentes",
    subtitle: "Padrões para produtos que aprendem",
    description:
      "Como projetar sistemas em que o modelo de aprendizado é apenas um dos componentes. O livro cobre separação de responsabilidades, versionamento de modelos e dados, observabilidade, testes de regressão estatística e estratégias de implantação progressiva.",
    type: "FISICO",
    priceCents: 15990,
    stock: 28,
    weightGrams: 810,
    author: "Paulo Henrique Ramalho",
    isbn: "978-85-9999-004-3",
    pages: 392,
    edition: "1ª edição",
    year: 2025,
    categorySlug: "arquitetura-de-software-inteligente",
    tags: ["corporativo", "avancado", "machine-learning"],
  },
  {
    sku: "COMPIA-005",
    slug: "engenharia-de-prompt-e-agentes-autonomos",
    title: "Engenharia de Prompt e Agentes Autônomos",
    subtitle: "Do prompt único a fluxos com ferramentas",
    description:
      "E-book prático sobre construção de aplicações com modelos de linguagem: padrões de prompt, uso de ferramentas, memória, orquestração de múltiplos agentes e avaliação automatizada de respostas. Acompanha repositório de exemplos.",
    type: "DIGITAL",
    priceCents: 7990,
    stock: 0,
    weightGrams: 0,
    taxRateBasisPoints: 0,
    author: "Camila Torres Bezerra",
    isbn: "978-85-9999-005-0",
    pages: 268,
    edition: "1ª edição",
    year: 2026,
    categorySlug: "inteligencia-artificial",
    tags: ["llm", "corporativo", "lancamento"],
    featured: true,
    digitalFileName: "engenharia-de-prompt-e-agentes-autonomos.pdf",
  },
  {
    sku: "COMPIA-006",
    slug: "visao-computacional-aplicada",
    title: "Visão Computacional Aplicada",
    subtitle: "Detecção, segmentação e reconhecimento",
    description:
      "Aborda o pipeline completo de visão computacional: aquisição e anotação de imagens, aumento de dados, arquiteturas de detecção e segmentação, métricas de avaliação e implantação em dispositivos de borda.",
    type: "FISICO",
    priceCents: 14990,
    stock: 18,
    weightGrams: 850,
    author: "Igor Menezes Cavalcanti",
    isbn: "978-85-9999-006-7",
    pages: 404,
    edition: "2ª edição",
    year: 2024,
    categorySlug: "inteligencia-artificial",
    tags: ["deep-learning", "redes-neurais", "python"],
  },
  {
    sku: "COMPIA-007",
    slug: "blockchain-fundamentos-e-contratos-inteligentes",
    title: "Blockchain: Fundamentos e Contratos Inteligentes",
    subtitle: "Consenso, criptomoedas e aplicações descentralizadas",
    description:
      "Apresenta os mecanismos de consenso, a estrutura de blocos e transações e a programação de contratos inteligentes. Discute também escalabilidade, custos de execução e casos de uso corporativos além das criptomoedas.",
    type: "FISICO",
    priceCents: 13990,
    stock: 22,
    weightGrams: 760,
    author: "Letícia Barbosa Furtado",
    isbn: "978-85-9999-007-4",
    pages: 356,
    edition: "1ª edição",
    year: 2025,
    categorySlug: "blockchain",
    tags: ["seguranca", "corporativo", "universitario"],
  },
  {
    sku: "COMPIA-008",
    slug: "criptografia-aplicada",
    title: "Criptografia Aplicada",
    subtitle: "Cifras simétricas, chave pública e protocolos",
    description:
      "E-book que conecta a teoria criptográfica ao uso cotidiano: AES, RSA, curvas elípticas, funções de hash, assinatura digital e o funcionamento do TLS. Inclui análise de erros clássicos de implementação.",
    type: "DIGITAL",
    priceCents: 8990,
    stock: 0,
    weightGrams: 0,
    taxRateBasisPoints: 0,
    author: "Sérgio Andrade Lima",
    isbn: "978-85-9999-008-1",
    pages: 312,
    edition: "2ª edição",
    year: 2025,
    categorySlug: "criptografia",
    tags: ["seguranca", "avancado", "universitario"],
    digitalFileName: "criptografia-aplicada.pdf",
  },
  {
    sku: "COMPIA-009",
    slug: "ciberseguranca-ofensiva-e-defensiva",
    title: "Cibersegurança Ofensiva e Defensiva",
    subtitle: "Times vermelho e azul na prática",
    description:
      "Organiza o conhecimento de segurança em duas frentes complementares: as técnicas usadas para encontrar falhas e as práticas de detecção, resposta e recuperação. Trata de gestão de vulnerabilidades, monitoramento e resposta a incidentes.",
    type: "FISICO",
    priceCents: 16990,
    compareAtCents: 18990,
    stock: 26,
    weightGrams: 880,
    author: "Bruno Tavares Queiroz",
    isbn: "978-85-9999-009-8",
    pages: 448,
    edition: "3ª edição",
    year: 2025,
    categorySlug: "ciberseguranca",
    tags: ["seguranca", "corporativo", "avancado"],
  },
  {
    sku: "COMPIA-010",
    slug: "ciencia-de-dados-com-python",
    title: "Ciência de Dados com Python",
    subtitle: "Da coleta à comunicação de resultados",
    description:
      "Percorre o ciclo completo de um projeto de dados: obtenção, limpeza, análise exploratória, modelagem estatística e comunicação visual dos resultados. Todos os exemplos usam bibliotecas livres do ecossistema Python.",
    type: "FISICO",
    priceCents: 13490,
    stock: 35,
    weightGrams: 800,
    author: "Juliana Prado Correia",
    isbn: "978-85-9999-010-4",
    pages: 386,
    edition: "4ª edição",
    year: 2026,
    categorySlug: "ciencia-de-dados",
    tags: ["python", "iniciante", "universitario"],
  },
  {
    sku: "COMPIA-011",
    slug: "mlops-do-notebook-a-producao",
    title: "MLOps: do Notebook à Produção",
    subtitle: "Automação, monitoramento e governança de modelos",
    description:
      "E-book sobre a operação de modelos em produção: pipelines reproduzíveis, registro de experimentos, testes automatizados, detecção de desvio de dados e políticas de retreinamento.",
    type: "DIGITAL",
    priceCents: 9490,
    stock: 0,
    weightGrams: 0,
    taxRateBasisPoints: 0,
    author: "Diego Farias Mota",
    isbn: "978-85-9999-011-1",
    pages: 244,
    edition: "1ª edição",
    year: 2026,
    categorySlug: "arquitetura-de-software-inteligente",
    tags: ["corporativo", "machine-learning", "lancamento"],
    digitalFileName: "mlops-do-notebook-a-producao.pdf",
  },
  {
    sku: "COMPIA-012",
    slug: "etica-e-governanca-de-ia",
    title: "Ética e Governança de IA",
    subtitle: "Riscos, regulação e responsabilidade",
    description:
      "Discute viés algorítmico, transparência, privacidade e os marcos regulatórios em construção no Brasil e no exterior. Traz um roteiro prático de avaliação de impacto para equipes que desenvolvem sistemas automatizados.",
    type: "FISICO",
    priceCents: 10990,
    stock: 40,
    weightGrams: 640,
    author: "Fernanda Aguiar Rocha",
    isbn: "978-85-9999-012-8",
    pages: 296,
    edition: "1ª edição",
    year: 2025,
    categorySlug: "inteligencia-artificial",
    tags: ["corporativo", "iniciante"],
  },
  {
    sku: "COMPIA-013",
    slug: "revista-compia-ia-generativa",
    title: "Revista COMPIA — Edição Especial: IA Generativa",
    subtitle: "Panorama, entrevistas e estudos de caso",
    description:
      "Edição especial da revista da editora, com artigos curtos sobre difusão, geração de código, avaliação de modelos e entrevistas com pesquisadores brasileiros. Entrega imediata em PDF.",
    type: "DIGITAL",
    priceCents: 3990,
    stock: 0,
    weightGrams: 0,
    taxRateBasisPoints: 0,
    author: "Redação COMPIA",
    pages: 96,
    edition: "Edição 12",
    year: 2026,
    categorySlug: "inteligencia-artificial",
    tags: ["llm", "iniciante", "lancamento"],
    digitalFileName: "revista-compia-ia-generativa.pdf",
  },
  {
    sku: "COMPIA-KIT-01",
    slug: "kit-formacao-em-ia",
    title: "Kit Formação em IA",
    subtitle: "Três volumes: fundamentos, aprendizado profundo e LLMs",
    description:
      "Combinação dos três títulos que formam a trilha completa de Inteligência Artificial da COMPIA, com desconto em relação à compra individual. Ideal para bibliotecas universitárias e programas de treinamento corporativo.",
    type: "KIT",
    priceCents: 37990,
    compareAtCents: 50970,
    stock: 12,
    weightGrams: 2590,
    categorySlug: "inteligencia-artificial",
    tags: ["universitario", "corporativo"],
    featured: true,
    kitOf: ["COMPIA-001", "COMPIA-002", "COMPIA-003"],
  },
  {
    sku: "COMPIA-KIT-02",
    slug: "kit-seguranca-digital",
    title: "Kit Segurança Digital",
    subtitle: "Blockchain e cibersegurança em dois volumes",
    description:
      "Reúne os títulos de blockchain e cibersegurança para quem quer entender proteção de dados de ponta a ponta, do protocolo à operação.",
    type: "KIT",
    priceCents: 26990,
    compareAtCents: 30980,
    stock: 10,
    weightGrams: 1640,
    categorySlug: "ciberseguranca",
    tags: ["seguranca", "corporativo"],
    kitOf: ["COMPIA-007", "COMPIA-009"],
  },
];

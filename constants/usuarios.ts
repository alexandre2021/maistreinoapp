// constants/usuarios.ts

// 👥 DADOS COMPARTILHADOS - Aluno e PT
export const GENEROS = [
  'Masculino', 
  'Feminino', 
  'Outro', 
  'Prefiro não informar'
] as const;

// 🎯 OBJETIVOS - Lista única para onboarding e filtros
export const OBJETIVOS = [
  'Perda de peso',
  'Ganho de massa',
  'Condicionamento', 
  'Reabilitação',
  'Performance'
] as const;

// 📚 EXPERIÊNCIA - Para alunos
export const NIVEIS_EXPERIENCIA_ALUNO = [
  'Iniciante (nunca treinei)',
  'Básico (menos de 6 meses)',
  'Intermediário (6 meses - 2 anos)',
  'Avançado (mais de 2 anos)',
  'Retomando (parei por um tempo)'
] as const;

// 👨‍💼 EXPERIÊNCIA - Para PTs (em anos)
export const ANOS_EXPERIENCIA_PT = [
  'Menos de 1 ano',
  '1-2 anos', 
  '3-5 anos',
  '5-10 anos',
  'Mais de 10 anos'
] as const;

// 📅 FREQUÊNCIA DE TREINO
export const FREQUENCIAS_TREINO = [
  '1x por semana',
  '2x por semana',
  '3x por semana',
  '4x por semana',
  '5x por semana',
  '6x por semana'
] as const;

// 🏋️ ESPECIALIZAÇÕES DO PT
export const ESPECIALIZACOES_PT = [
  'Musculação e Hipertrofia',
  'Condicionamento Físico Geral',
  'Emagrecimento',
  'Funcional',
  'Crossfit',
  'Pilates',
  'Yoga',
  'Corrida',
  'Natação',
  'Artes Marciais',
  'Reabilitação',
  'Terceira Idade'
] as const;

// 🔷 TIPOS TYPESCRIPT
export type Genero = typeof GENEROS[number];
export type Objetivo = typeof OBJETIVOS[number];
export type NivelExperienciaAluno = typeof NIVEIS_EXPERIENCIA_ALUNO[number];
export type AnosExperienciaPT = typeof ANOS_EXPERIENCIA_PT[number];
export type FrequenciaTreino = typeof FREQUENCIAS_TREINO[number];
export type EspecializacaoPT = typeof ESPECIALIZACOES_PT[number];

// ✅ VALIDAÇÕES
export const isGeneroValido = (valor: string): valor is Genero => {
  return GENEROS.includes(valor as Genero);
};

export const isObjetivoValido = (valor: string): valor is Objetivo => {
  return OBJETIVOS.includes(valor as Objetivo);
};

export const isNivelExperienciaAlunoValido = (valor: string): valor is NivelExperienciaAluno => {
  return NIVEIS_EXPERIENCIA_ALUNO.includes(valor as NivelExperienciaAluno);
};

// 🎨 CORES PARA AVATARS (compartilhadas)
export const CORES_AVATAR = [
  '#3B82F6', // Azul
  '#10B981', // Verde  
  '#F59E0B', // Amarelo
  '#EF4444', // Vermelho
  '#8B5CF6', // Roxo
  '#06B6D4', // Ciano
  '#84CC16', // Lima
  '#F97316', // Laranja
] as const;

// 🔗 VALIDAÇÕES DE URL PARA REDES SOCIAIS
export const URL_PATTERNS = {
  instagram: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/,
  facebook: /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._]+\/?$/,
  linkedin: /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9._-]+\/?$/,
  website: /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/
} as const;

export const isURLValida = (url: string, tipo: keyof typeof URL_PATTERNS): boolean => {
  if (!url.trim()) return true; // URLs opcionais
  return URL_PATTERNS[tipo].test(url);
};

// 📱 FORMATAÇÃO DE TELEFONE BRASILEIRO
export const formatarTelefone = (telefone: string): string => {
  const numeros = telefone.replace(/\D/g, '').slice(0, 11);
  
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 6) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  if (numeros.length <= 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
};

// 📊 LIMITES E VALIDAÇÕES
export const VALIDACOES = {
  bioMinLength: 50,
  bioMaxLength: 500,
  nomeMinLength: 2,
  nomeMaxLength: 100,
  telefoneLength: 15
} as const;
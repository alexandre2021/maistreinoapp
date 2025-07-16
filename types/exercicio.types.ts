// types/exercicio.types.ts

// ====================================
// TIPOS EXISTENTES PARA EXECUÇÃO
// ====================================
export interface SessaoData {
  id: string;
  rotina_id: string;
  treino_id: string;
  aluno_id: string;
  status: string;
  data_execucao: string;
  rotinas: any;
  treinos: any;
  alunos: any;
}

export interface UserProfile {
  user_type: 'personal_trainer' | 'aluno';
  id: string;
  nome_completo: string;
}

export interface ExercicioData {
  id: string;
  exercicio_1: string;
  exercicio_2?: string;
  ordem: number;
  series: SerieData[];
  intervalo_apos_exercicio?: number;
}

export interface SerieData {
  id: string;
  numero_serie: number;
  repeticoes?: number;
  carga?: number;
  // Campos para séries combinadas
  repeticoes_1?: number;
  carga_1?: number;
  repeticoes_2?: number;
  carga_2?: number;
  // Campos dropset
  tem_dropset?: boolean;
  carga_dropset?: number;
  intervalo_apos_serie?: number;
  // Estados de execução
  executada?: boolean;
  repeticoes_executadas?: number;
  carga_executada?: number;
  observacoes?: string;
  dropset_executado?: boolean;
  carga_dropset_executada?: number;
  repeticoes_dropset_executadas?: number;
}

export interface ExecucaoSerieInsert {
  execucao_sessao_id: string;
  exercicio_rotina_id: string;
  serie_numero: number;
  repeticoes_executadas_1?: number | null;
  carga_executada_1?: number | null;
  repeticoes_executadas_2?: number | null;
  carga_executada_2?: number | null;
  carga_dropset?: number | null;
  observacoes?: string | null;
}

export interface CronometroSerieData {
  intervalo: number;
}

export interface CronometroExercicioData {
  intervalo: number;
  exercicioAtual: string;
  proximoExercicio: string;
}

export interface HistoricoExercicio {
  data: string;
  repeticoes: number;
  carga: number;
}

// ====================================
// NOVOS TIPOS PARA CRIAÇÃO DE ROTINA
// ====================================

// Exercício vindo do banco de dados
export interface ExercicioBanco {
  id: string;
  nome: string;
  grupo_muscular: string;
  equipamento: string;
  tipo: 'padrao' | 'personalizado';
}

// Configuração de drop set
export interface DropSetConfig {
  id: string;
  cargaReduzida: number;
  repeticoes: number;
}

// Configuração de série durante criação (estende SerieData)
export interface SerieConfig extends Omit<SerieData, 'executada' | 'repeticoes_executadas' | 'carga_executada' | 'dropset_executado' | 'carga_dropset_executada' | 'repeticoes_dropset_executadas'> {
  numero: number; // Alias para numero_serie
  isDropSet?: boolean; // Alias para tem_dropset
  intervaloAposSerie?: number; // Alias para intervalo_apos_serie
  dropsConfig?: DropSetConfig[]; // Configuração detalhada de drops
}

// Exercício combinado em séries combinadas
export interface ExercicioCombinado {
  exercicioId: string;
  nome: string;
  grupoMuscular: string;
  equipamento: string;
}

// Exercício durante criação da rotina
export interface ExercicioRotinaLocal {
  id: string;
  exercicioId: string;
  nome: string;
  grupoMuscular: string;
  equipamento: string;
  tipo: 'tradicional' | 'combinada';
  series: SerieConfig[];
  observacoes?: string;
  intervaloAposExercicio?: number;
  exerciciosCombinados?: ExercicioCombinado[];
}

// Configuração de treino
export interface TreinoConfig {
  id: string;
  nome: string;
  gruposMusculares: string[];
  exercicios: ExercicioRotinaLocal[];
}

// Configuração geral da rotina
export interface RotinaConfig {
  nomeRotina: string;
  descricao: string;
  treinosPorSemana: number;
  dificuldade: string;
  duracaoSemanas: number;
  alunoId: string;
  objetivo?: string;
}

// Tipos para filtros
export interface FiltrosExercicio {
  tipo: 'todos' | 'padrao' | 'personalizado';
  grupoMuscular: string;
  busca: string;
}

// Tipo para o estado dos exercícios organizados por treino
export interface ExerciciosPorTreino {
  [treinoId: string]: ExercicioRotinaLocal[];
}

// Tipos para validação
export interface ValidacaoExercicios {
  isValid: boolean;
  totalExercicios: number;
  treinosComExercicios: string[];
  treinosSemExercicios: string[];
  mensagens: string[];
}
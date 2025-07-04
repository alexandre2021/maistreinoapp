// types/Exercicio.ts
export interface Exercicio {
  id: string;
  nome: string;
  descricao: string;
  grupo_muscular: string;
  equipamento: string;
  dificuldade: 'Baixa' | 'Média' | 'Alta';
  tipo: 'padrao' | 'personalizado'; // Corrigido para padrao
  instrucoes: string; // Campo texto, não array
  imagem_1_url?: string;
  imagem_2_url?: string;
  video_url?: string;
  youtube_url?: string;
  video_size?: number;
  video_duration?: number;
  is_ativo: boolean;
  created_at: string;
  pt_id?: string; // Para exercícios personalizados
  exercicio_padrao_id?: string; // Para exercícios derivados
}

export interface ExercicioFilter {
  grupo_muscular: string;
  equipamento: string;
  dificuldade: string;
}

export interface ExercicioDropdown {
  grupo_muscular: boolean;
  equipamento: boolean;
  dificuldade: boolean;
}
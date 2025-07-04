// types/Aluno.ts
export interface Aluno {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string | null;
  data_nascimento: string | null;
  genero: string | null;
  objetivo_principal: string | null;
  avatar_letter: string;
  avatar_color: string;
  avatar_type: 'letter' | 'image';
  avatar_image_url: string | null;
  created_at: string;
  onboarding_completo: boolean;
}
export interface OnboardingPTData {
  nomeCompleto: string;
  genero: string;
  dataNascimento: string;
  telefone: string;
  telefonePublico: boolean;
  cref: string;
  anosExperiencia: string;
  especializacoes: string[];
  bio: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  website: string;
  avatar_image_url: string | null;
  avatar_letter: string;
  avatar_color: string;
  avatar_type: 'letter' | 'image';
  onboarding_completo: boolean;
}

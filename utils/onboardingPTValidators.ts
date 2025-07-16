import { OnboardingPTData } from '../types/onboarding-pt.types';

export function validateOnboardingPT(data: OnboardingPTData): { isValid: boolean; errors: { [key: string]: string } } {
  const errors: { [key: string]: string } = {};

  if (!data.nomeCompleto) errors.nomeCompleto = 'Nome completo é obrigatório';
  if (!data.genero) errors.genero = 'Gênero é obrigatório';
  if (!data.dataNascimento) errors.dataNascimento = 'Data de nascimento é obrigatória';
  if (!data.anosExperiencia) errors.anosExperiencia = 'Anos de experiência é obrigatório';
  if (data.especializacoes.length === 0) errors.especializacoes = 'Selecione pelo menos uma especialização';
  if (!data.bio) errors.bio = 'Bio é obrigatória';
  if (data.bio && data.bio.length < 50) errors.bio = 'Bio deve ter pelo menos 50 caracteres';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

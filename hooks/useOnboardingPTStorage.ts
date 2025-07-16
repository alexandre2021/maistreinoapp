import { useState } from 'react';
import { OnboardingPTData } from '../types/onboarding-pt.types';
import { getOnboardingPTStorage, setOnboardingPTStorage } from '../utils/onboardingPTStorage';

export function useOnboardingPTStorage() {
  const [data, setDataState] = useState<OnboardingPTData>(() => {
    const stored = getOnboardingPTStorage();
    return stored || {
      nomeCompleto: '',
      genero: '',
      dataNascimento: '',
      telefone: '',
      telefonePublico: false,
      cref: '',
      anosExperiencia: '',
      especializacoes: [],
      bio: '',
      instagram: '',
      facebook: '',
      linkedin: '',
      website: '',
      avatar_image_url: null,
      avatar_letter: '',
      avatar_color: '#F59E42', // Laranja padrão para PT
      avatar_type: 'letter',
      onboarding_completo: false,
    };
  });

  const setData = (newData: OnboardingPTData) => {
    setDataState(newData);
    setOnboardingPTStorage(newData);
  };

  const updateField = (field: keyof OnboardingPTData, value: any) => {
    const updated = { ...data, [field]: value };
    setData(updated);
  };

  return { data, setData, updateField };
}

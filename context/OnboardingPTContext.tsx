import React, { createContext, useContext, useState } from 'react';
import { OnboardingPTData } from '../types/onboarding-pt.types';
import { getOnboardingPTStorage, setOnboardingPTStorage } from '../utils/onboardingPTStorage';

interface OnboardingPTContextProps {
  data: OnboardingPTData;
  setData: (data: OnboardingPTData) => void;
  updateField: (field: keyof OnboardingPTData, value: any) => void;
}

const defaultData: OnboardingPTData = {
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

const OnboardingPTContext = createContext<OnboardingPTContextProps | undefined>(undefined);

export const OnboardingPTProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setDataState] = useState<OnboardingPTData>(() => {
    const stored = getOnboardingPTStorage();
    return stored || defaultData;
  });

  const setData = (newData: OnboardingPTData) => {
    setDataState(newData);
    setOnboardingPTStorage(newData);
  };

  const updateField = (field: keyof OnboardingPTData, value: any) => {
    const updated = { ...data, [field]: value };
    setData(updated);
  };

  return (
    <OnboardingPTContext.Provider value={{ data, setData, updateField }}>
      {children}
    </OnboardingPTContext.Provider>
  );
};

export const useOnboardingPT = () => {
  const context = useContext(OnboardingPTContext);
  if (!context) {
    throw new Error('useOnboardingPT deve ser usado dentro de OnboardingPTProvider');
  }
  return context;
};

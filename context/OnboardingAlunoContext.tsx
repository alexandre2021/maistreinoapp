import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { OnboardingAlunoData } from '../types/onboarding-aluno.types';
import { clearOnboardingAluno, loadOnboardingAluno, saveOnboardingAluno } from '../utils/onboardingAlunoStorage';

interface OnboardingAlunoContextProps {
  data: OnboardingAlunoData;
  setData: (data: OnboardingAlunoData) => void;
  updateField: <K extends keyof OnboardingAlunoData>(field: K, value: OnboardingAlunoData[K]) => void;
  reset: () => void;
  loading: boolean;
}

const defaultData: OnboardingAlunoData = {
  nomeCompleto: '',
  genero: '',
  dataNascimento: '',
  telefone: '',
  peso: '',
  altura: '',
  descricaoPessoal: '',
  questionarioParQ: {},
};

const OnboardingAlunoContext = createContext<OnboardingAlunoContextProps | undefined>(undefined);

export const OnboardingAlunoProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<OnboardingAlunoData>(defaultData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadOnboardingAluno();
    if (stored) setData(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) saveOnboardingAluno(data);
  }, [data, loading]);

  const updateField = <K extends keyof OnboardingAlunoData>(field: K, value: OnboardingAlunoData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const reset = () => {
    setData(defaultData);
    clearOnboardingAluno();
  };

  return (
    <OnboardingAlunoContext.Provider value={{ data, setData, updateField, reset, loading }}>
      {children}
    </OnboardingAlunoContext.Provider>
  );
};

export const useOnboardingAluno = () => {
  const context = useContext(OnboardingAlunoContext);
  if (!context) throw new Error('useOnboardingAluno deve ser usado dentro de OnboardingAlunoProvider');
  return context;
};

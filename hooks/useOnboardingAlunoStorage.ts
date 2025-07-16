import { useCallback, useEffect, useState } from 'react';
import { OnboardingAlunoData } from '../types/onboarding-aluno.types';
import { clearOnboardingAluno, loadOnboardingAluno, saveOnboardingAluno } from '../utils/onboardingAlunoStorage';

export function useOnboardingAlunoStorage() {
  const [data, setData] = useState<OnboardingAlunoData>({
    nomeCompleto: '',
    genero: '',
    dataNascimento: '',
    telefone: '',
    peso: '',
    altura: '',
    objetivoPrincipal: '',
    nivelExperiencia: '',
    frequenciaTreinoDesejada: '',
    questionarioParQ: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadOnboardingAluno();
    if (stored) setData(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) saveOnboardingAluno(data);
  }, [data, loading]);

  const updateField = useCallback(<K extends keyof OnboardingAlunoData>(field: K, value: OnboardingAlunoData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const reset = useCallback(() => {
    setData({
      nomeCompleto: '',
      genero: '',
      dataNascimento: '',
      telefone: '',
      peso: '',
      altura: '',
      objetivoPrincipal: '',
      nivelExperiencia: '',
      frequenciaTreinoDesejada: '',
      questionarioParQ: {},
    });
    clearOnboardingAluno();
  }, []);

  return { data, setData, updateField, reset, loading };
}

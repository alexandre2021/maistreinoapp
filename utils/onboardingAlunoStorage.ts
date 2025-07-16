
import { OnboardingAlunoData } from '../types/onboarding-aluno.types';

const STORAGE_KEY = 'onboarding_aluno_data';

export function saveOnboardingAluno(data: OnboardingAlunoData) {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (e) {
    console.warn('Erro ao salvar onboarding do aluno:', e);
  }
}

export function loadOnboardingAluno(): OnboardingAlunoData | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const json = window.sessionStorage.getItem(STORAGE_KEY);
      return json ? JSON.parse(json) : null;
    }
    return null;
  } catch (e) {
    console.warn('Erro ao carregar onboarding do aluno:', e);
    return null;
  }
}

export function clearOnboardingAluno() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Erro ao limpar onboarding do aluno:', e);
  }
}

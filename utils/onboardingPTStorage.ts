import { OnboardingPTData } from '../types/onboarding-pt.types';

const STORAGE_KEY = 'onboardingPTData';

export function getOnboardingPTStorage(): OnboardingPTData | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setOnboardingPTStorage(data: OnboardingPTData) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail
  }
}

export function clearOnboardingPTStorage() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

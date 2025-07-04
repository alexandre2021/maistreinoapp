// services/emailValidationService.ts
// Serviço de validação de email para registro com classificação de risco

import { validateEmail } from '../utils/emailValidation'

export interface EmailValidationResult {
  isValid: boolean
  message?: string
  riskLevel?: 'low' | 'medium' | 'high'
  domain?: string
  isTemporary?: boolean
  isTrusted?: boolean
}

/**
 * Valida email para registro com classificação de risco
 */
export async function validateEmailForRegistration(email: string): Promise<EmailValidationResult> {
  // Usar a função de validação existente
  const result = validateEmail(email)
  
  // Mapear para o formato esperado pelo componente
  let riskLevel: 'low' | 'medium' | 'high' = 'medium'
  
  if (result.isTrusted) {
    riskLevel = 'low'
  } else if (result.isTemporary) {
    riskLevel = 'high'
  } else {
    riskLevel = 'medium'
  }
  
  return {
    isValid: result.isValid,
    message: result.message,
    riskLevel,
    domain: result.domain,
    isTemporary: result.isTemporary,
    isTrusted: result.isTrusted
  }
}

import { useCallback, useMemo } from 'react';
import { useOnboardingAluno } from '../../context/OnboardingAlunoContext';

interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

interface StepValidationRules {
  step1: ValidationResult;
  step2: ValidationResult;
}

interface UseStepValidationReturn {
  validateStep: (stepNumber: number) => ValidationResult;
  validateAllSteps: () => StepValidationRules;
  getStepErrors: (stepNumber: number) => { [key: string]: string };
  isStepValid: (stepNumber: number) => boolean;
  canProceedToNextStep: (currentStep: number) => boolean;
  getAllErrorMessages: () => string[];
}

// Perguntas PAR-Q - constante fora do hook para evitar re-renders
const PERGUNTAS_PAR_Q = [
  'Seu médico já disse que você possui algum problema cardíaco e que só deve realizar atividade física supervisionado por profissionais de saúde?',
  'Você sente dores no peito quando realiza atividade física?',
  'No último mês, você sentiu dores no peito mesmo sem praticar atividade física?',
  'Você perde o equilíbrio devido a tontura ou já perdeu a consciência alguma vez?',
  'Você possui algum problema ósseo ou articular que poderia piorar com a prática de atividade física?',
  'Seu médico já prescreveu algum medicamento para pressão arterial ou problema cardíaco?',
  'Você sabe de alguma outra razão pela qual não deveria praticar atividade física?'
] as const;

/**
 * Hook para validação de cada etapa do onboarding
 * Centraliza todas as regras de validação e fornece feedback específico
 */
export const useStepValidation = (): UseStepValidationReturn => {
  const { data } = useOnboardingAluno();

  /**
   * Valida campos da Etapa 1: Dados Básicos
   */
  const validateStep1 = useMemo((): ValidationResult => {
    const errors: { [key: string]: string } = {};

    // Nome completo (obrigatório)
    if (!data.nomeCompleto) {
      errors.nomeCompleto = 'Nome completo é obrigatório';
    } else if (data.nomeCompleto.trim().length < 2) {
      errors.nomeCompleto = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Gênero (obrigatório)
    if (!data.genero) {
      errors.genero = 'Gênero é obrigatório';
    }

    // Data de nascimento (obrigatório)
    if (!data.dataNascimento) {
      errors.dataNascimento = 'Data de nascimento é obrigatória';
    } else {
      // Validar formato dd/mm/yyyy
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(data.dataNascimento)) {
        errors.dataNascimento = 'Data deve estar no formato dd/mm/aaaa';
      } else {
        // Validar se é uma data válida e não futura
        const [day, month, year] = data.dataNascimento.split('/').map(Number);
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        
        if (birthDate > today) {
          errors.dataNascimento = 'Data de nascimento não pode ser futura';
        } else if (year < 1900) {
          errors.dataNascimento = 'Data de nascimento inválida';
        }
      }
    }

    // Telefone (opcional, mas se preenchido deve ter formato válido)
    if (data.telefone && data.telefone.length > 0) {
      const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
      if (!phoneRegex.test(data.telefone)) {
        errors.telefone = 'Telefone deve estar no formato (11) 99999-9999';
      }
    }

    // Peso (opcional, mas se preenchido deve ser válido)
    if (data.peso && data.peso.length > 0) {
      const peso = parseFloat(data.peso.replace(',', '.'));
      if (isNaN(peso) || peso <= 0 || peso > 500) {
        errors.peso = 'Peso deve ser um número válido entre 1 e 500 kg';
      }
    }

    // Altura (opcional, mas se preenchido deve ser válido)
    if (data.altura && data.altura.length > 0) {
      const altura = parseFloat(data.altura.replace(',', '.'));
      if (isNaN(altura) || altura <= 0 || altura > 3) {
        errors.altura = 'Altura deve ser um número válido entre 0,1 e 3,0 metros';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [data.nomeCompleto, data.genero, data.dataNascimento, data.telefone, data.peso, data.altura]);

  /**
   * Valida campos da Etapa 2: Descrição e Saúde
   */
  const validateStep2 = useMemo((): ValidationResult => {
    const errors: { [key: string]: string } = {};

    // Descrição pessoal (obrigatório, mínimo 10 caracteres)
    if (!data.descricaoPessoal) {
      errors.descricaoPessoal = 'Descrição pessoal é obrigatória';
    } else if (data.descricaoPessoal.trim().length < 10) {
      errors.descricaoPessoal = 'Descreva um pouco sobre você (mínimo 10 caracteres)';
    }

    // Questionário PAR-Q (todas as 7 perguntas devem ser respondidas)
    const unansweredQuestions: number[] = [];
    for (let i = 0; i < PERGUNTAS_PAR_Q.length; i++) {
      if (data.questionarioParQ[i.toString()] === undefined) {
        unansweredQuestions.push(i + 1);
      }
    }

    if (unansweredQuestions.length > 0) {
      if (unansweredQuestions.length === 1) {
        errors.questionarioParQ = `Responda a pergunta ${unansweredQuestions[0]} do questionário PAR-Q`;
      } else if (unansweredQuestions.length <= 3) {
        errors.questionarioParQ = `Responda as perguntas ${unansweredQuestions.join(', ')} do questionário PAR-Q`;
      } else {
        errors.questionarioParQ = 'Responda todas as perguntas do questionário PAR-Q';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [data.descricaoPessoal, data.questionarioParQ]);

  /**
   * Valida uma etapa específica
   */
  const validateStep = useCallback((stepNumber: number): ValidationResult => {
    switch (stepNumber) {
      case 1:
        return validateStep1;
      case 2:
        return validateStep2;
      default:
        return { isValid: false, errors: { general: 'Etapa inválida' } };
    }
  }, [validateStep1, validateStep2]);

  /**
   * Valida todas as etapas de uma vez
   */
  const validateAllSteps = useCallback((): StepValidationRules => {
    return {
      step1: validateStep1,
      step2: validateStep2
    };
  }, [validateStep1, validateStep2]);

  /**
   * Retorna apenas os erros de uma etapa específica
   */
  const getStepErrors = useCallback((stepNumber: number): { [key: string]: string } => {
    const validation = validateStep(stepNumber);
    return validation.errors;
  }, [validateStep]);

  /**
   * Verifica se uma etapa específica é válida
   */
  const isStepValid = useCallback((stepNumber: number): boolean => {
    const validation = validateStep(stepNumber);
    return validation.isValid;
  }, [validateStep]);

  /**
   * Verifica se pode avançar para a próxima etapa
   */
  const canProceedToNextStep = useCallback((currentStep: number): boolean => {
    return isStepValid(currentStep);
  }, [isStepValid]);

  /**
   * Retorna todas as mensagens de erro em um array
   */
  const getAllErrorMessages = useCallback((): string[] => {
    const allValidation = validateAllSteps();
    const messages: string[] = [];

    // Adicionar erros da etapa 1
    Object.values(allValidation.step1.errors).forEach(error => {
      messages.push(error);
    });

    // Adicionar erros da etapa 2
    Object.values(allValidation.step2.errors).forEach(error => {
      messages.push(error);
    });

    return messages;
  }, [validateAllSteps]);

  return {
    validateStep,
    validateAllSteps,
    getStepErrors,
    isStepValid,
    canProceedToNextStep,
    getAllErrorMessages
  };
};
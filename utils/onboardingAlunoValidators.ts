import { OnboardingAlunoData } from '../types/onboarding-aluno.types';

export interface OnboardingAlunoValidation {
  isValid: boolean;
  errors: Partial<Record<keyof OnboardingAlunoData, string>>;
}

/**
 * Valida todos os dados do onboarding do aluno
 * Atualizado para nova estrutura de 2 etapas
 */
export function validateOnboardingAluno(data: OnboardingAlunoData): OnboardingAlunoValidation {
  const errors: Partial<Record<keyof OnboardingAlunoData, string>> = {};

  // ✅ ETAPA 1: Dados Básicos
  
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

  // ✅ ETAPA 2: Descrição e Saúde

  // Descrição pessoal (obrigatório, mínimo 10 caracteres)
  if (!data.descricaoPessoal) {
    errors.descricaoPessoal = 'Descrição pessoal é obrigatória';
  } else if (data.descricaoPessoal.trim().length < 10) {
    errors.descricaoPessoal = 'Descreva um pouco sobre você (mínimo 10 caracteres)';
  }

  // Questionário PAR-Q (todas as 7 perguntas devem ser respondidas)
  if (!data.questionarioParQ || Object.keys(data.questionarioParQ).length < 7) {
    errors.questionarioParQ = 'Responda todas as perguntas do questionário PAR-Q';
  } else {
    // Verificar se todas as 7 perguntas têm resposta (true ou false)
    const perguntasRespondidas = Object.keys(data.questionarioParQ).filter(key => {
      const value = data.questionarioParQ[key];
      return value === true || value === false;
    });
    
    if (perguntasRespondidas.length < 7) {
      errors.questionarioParQ = 'Responda todas as perguntas do questionário PAR-Q';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida apenas os campos obrigatórios essenciais (validação rápida)
 */
export function validateOnboardingAlunoEssentials(data: OnboardingAlunoData): boolean {
  return !!(
    data.nomeCompleto &&
    data.genero &&
    data.dataNascimento &&
    data.descricaoPessoal && data.descricaoPessoal.trim().length >= 10 &&
    data.questionarioParQ && Object.keys(data.questionarioParQ).length >= 7
  );
}

/**
 * Valida apenas uma etapa específica
 */
export function validateOnboardingAlunoStep(data: OnboardingAlunoData, step: 1 | 2): OnboardingAlunoValidation {
  const errors: Partial<Record<keyof OnboardingAlunoData, string>> = {};

  if (step === 1) {
    // Validar apenas campos da etapa 1
    if (!data.nomeCompleto) {
      errors.nomeCompleto = 'Nome completo é obrigatório';
    } else if (data.nomeCompleto.trim().length < 2) {
      errors.nomeCompleto = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!data.genero) {
      errors.genero = 'Gênero é obrigatório';
    }

    if (!data.dataNascimento) {
      errors.dataNascimento = 'Data de nascimento é obrigatória';
    }
  } else if (step === 2) {
    // Validar apenas campos da etapa 2
    if (!data.descricaoPessoal) {
      errors.descricaoPessoal = 'Descrição pessoal é obrigatória';
    } else if (data.descricaoPessoal.trim().length < 10) {
      errors.descricaoPessoal = 'Descreva um pouco sobre você (mínimo 10 caracteres)';
    }

    if (!data.questionarioParQ || Object.keys(data.questionarioParQ).length < 7) {
      errors.questionarioParQ = 'Responda todas as perguntas do questionário PAR-Q';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
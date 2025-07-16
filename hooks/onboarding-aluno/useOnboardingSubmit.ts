import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useOnboardingAluno } from '../../context/OnboardingAlunoContext';
import { supabase } from '../../lib/supabase';
import { useAvatarGenerator } from './useAvatarGenerator';

interface UseOnboardingSubmitReturn {
  loading: boolean;
  submitOnboarding: (userId: string, userEmail: string) => Promise<void>;
  canComplete: boolean;
}

interface UpdateData {
  nome_completo: string;
  genero: string;
  data_nascimento: string;
  telefone: string;
  peso: number | null;
  altura: number | null;
  descricao_pessoal: string;
  par_q_respostas: { [key: string]: boolean };
  avatar_letter: string;
  avatar_color: string;
  avatar_type: string;
  avatar_image_url: null;
  onboarding_completo: boolean;
  status: string;
}

/**
 * Hook para finalização e envio do onboarding
 * Gerencia todo o processo de validação final e salvamento no banco
 */
export const useOnboardingSubmit = (): UseOnboardingSubmitReturn => {
  const [loading, setLoading] = useState(false);
  const { data, reset } = useOnboardingAluno();
  const { getAvatarData } = useAvatarGenerator();

  // Perguntas PAR-Q para validação
  const perguntasParQ = [
    'Seu médico já disse que você possui algum problema cardíaco e que só deve realizar atividade física supervisionado por profissionais de saúde?',
    'Você sente dores no peito quando realiza atividade física?',
    'No último mês, você sentiu dores no peito mesmo sem praticar atividade física?',
    'Você perde o equilíbrio devido a tontura ou já perdeu a consciência alguma vez?',
    'Você possui algum problema ósseo ou articular que poderia piorar com a prática de atividade física?',
    'Seu médico já prescreveu algum medicamento para pressão arterial ou problema cardíaco?',
    'Você sabe de alguma outra razão pela qual não deveria praticar atividade física?'
  ];

  /**
   * Converte data brasileira (dd/mm/aaaa) para formato ISO (yyyy-mm-dd)
   */
  const dateBRtoISO = (dateBR: string): string => {
    if (!dateBR || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateBR)) return dateBR;
    const [day, month, year] = dateBR.split('/');
    return `${year}-${month}-${day}`;
  };

  /**
   * Converte valores decimais com vírgula para ponto (formato PostgreSQL)
   */
  const formatDecimalForDatabase = (value: string): number | null => {
    if (!value || value.trim() === '') return null;
    
    const normalizedValue = value.replace(',', '.');
    const parsed = parseFloat(normalizedValue);
    
    return isNaN(parsed) ? null : parsed;
  };

  /**
   * Valida se todos os campos obrigatórios estão preenchidos
   */
  const validateRequiredFields = (): boolean => {
    // Campos básicos obrigatórios
    const basicFieldsValid = !!(
      data.nomeCompleto &&
      data.genero &&
      data.dataNascimento &&
      data.descricaoPessoal && data.descricaoPessoal.trim().length >= 10
    );

    // Verificar se todas as 7 perguntas do PAR-Q foram respondidas
    const parQComplete = perguntasParQ.every((_, index) => 
      data.questionarioParQ[index.toString()] !== undefined
    );

    return basicFieldsValid && parQComplete;
  };

  /**
   * Propriedade computada para verificar se pode finalizar
   */
  const canComplete = validateRequiredFields();

  /**
   * Função principal para submeter o onboarding
   */
  const submitOnboarding = async (userId: string, userEmail: string): Promise<void> => {
    if (!userId || !userEmail) {
      Alert.alert('Erro', 'Usuário não encontrado. Faça login novamente.');
      router.replace('/');
      return;
    }

    // Validação final antes de submeter
    if (!canComplete) {
      Alert.alert(
        'Campos obrigatórios', 
        'Preencha todos os campos obrigatórios:\n\n• Nome completo\n• Gênero\n• Data de nascimento\n• Descrição pessoal (mínimo 10 caracteres)\n• Questionário PAR-Q (todas as 7 perguntas)'
      );
      return;
    }

    setLoading(true);
    
    try {
      // Gerar dados do avatar
      const avatarData = getAvatarData(data.nomeCompleto, userEmail);
      
      console.log('🎯 [Onboarding] Iniciando submissão para:', data.nomeCompleto);
      console.log('📸 [Onboarding] Avatar gerado:', avatarData.letter);

      // Preparar dados para o banco
      const updateData: UpdateData = {
        nome_completo: data.nomeCompleto,
        genero: data.genero,
        data_nascimento: dateBRtoISO(data.dataNascimento),
        telefone: data.telefone,
        peso: formatDecimalForDatabase(data.peso),
        altura: formatDecimalForDatabase(data.altura),
        descricao_pessoal: data.descricaoPessoal,
        par_q_respostas: data.questionarioParQ,
        
        // Dados do avatar
        avatar_letter: avatarData.letter,
        avatar_color: avatarData.color,
        avatar_type: avatarData.type,
        avatar_image_url: avatarData.imageUrl,
        
        // Status final
        onboarding_completo: true,
        status: 'ativo' // Muda de "pendente" para "ativo"
      };

      console.log('💾 [Onboarding] Salvando dados no Supabase...');

      // Salvar no banco de dados
      const { error, data: result } = await supabase
        .from('alunos')
        .update(updateData)
        .eq('id', userId)
        .select();

      if (error) {
        console.error('❌ [Onboarding] Erro na atualização:', error);
        throw error;
      }

      if (!result || result.length === 0) {
        console.error('❌ [Onboarding] Nenhum registro atualizado');
        throw new Error('Nenhum registro foi atualizado');
      }

      console.log('✅ [Onboarding] Dados salvos com sucesso!');
      console.log('📊 [Onboarding] Resultado:', result[0]);

      // Limpar dados do contexto
      reset();

      // Redirecionar para dashboard do aluno
      console.log('🔄 [Onboarding] Redirecionando para dashboard...');
      router.replace('/(tabs)/index-aluno' as never);

    } catch (error) {
      console.error('💥 [Onboarding] Erro no processo:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      Alert.alert(
        'Erro', 
        `Não foi possível finalizar a configuração:\n${errorMessage}\n\nTente novamente.`
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    submitOnboarding,
    canComplete
  };
};
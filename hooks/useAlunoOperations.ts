// hooks/useAlunoOperations.ts - VERSÃO COMPLETA CORRIGIDA
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Aluno } from '../types/Aluno';

export const useAlunoOperations = () => {
  const [loading, setLoading] = useState(false);

  const navigateToDetails = (alunoId: string) => {
    router.push(`/detalhes-aluno/${alunoId}` as any);
  };

  const navigateToParQ = (alunoId: string) => {
    router.push(`/par-q/${alunoId}` as any);
  };

  const navigateToAvaliacoes = (alunoId: string) => {
    router.push(`/avaliacoes/${alunoId}` as any);
  };

  const navigateToRotinas = (alunoId: string) => {
    router.push(`/rotinas/${alunoId}` as any);
  };

  const deleteAluno = async (aluno: Aluno, onSuccess: () => void) => {
    if (!aluno) return false;

    try {
      setLoading(true);
      console.log('🗑️ [AlunoOperations] Excluindo aluno:', aluno.id);
      
      // 1. Obter usuário logado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ [AlunoOperations] Erro de autenticação:', authError);
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        return false;
      }

      // 2. Verificar se é personal trainer
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, user_type')
        .eq('id', user.id)
        .eq('user_type', 'personal_trainer')
        .single();

      if (profileError || !userProfile) {
        console.error('❌ [AlunoOperations] User profile não é personal_trainer:', profileError);
        Alert.alert('Erro', 'Acesso negado. Apenas personal trainers podem excluir alunos.');
        return false;
      }

      // 3. Buscar dados do personal trainer
      const { data: personalTrainer, error: ptError } = await supabase
        .from('personal_trainers')
        .select('id, nome_completo')
        .eq('id', user.id)
        .single();

      if (ptError || !personalTrainer) {
        console.error('❌ [AlunoOperations] Personal trainer não encontrado:', ptError);
        Alert.alert('Erro', 'Dados do personal trainer não encontrados.');
        return false;
      }

      // 4. Verificar se o aluno pertence a este PT
      const { data: alunoVerificacao, error: verificacaoError } = await supabase
        .from('alunos')
        .select('id, personal_trainer_id, nome_completo')
        .eq('id', aluno.id)
        .eq('personal_trainer_id', personalTrainer.id)
        .single();

      if (verificacaoError || !alunoVerificacao) {
        console.error('❌ [AlunoOperations] Aluno não pertence a este PT:', verificacaoError);
        Alert.alert('Erro', 'Você não tem permissão para excluir este aluno.');
        return false;
      }

      // ✅ 5. PRIMEIRO: Deletar das tabelas do banco (COM CASCADE)
      console.log('🗑️ Deletando dados das tabelas...');
      const { error: deleteTablesError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', aluno.id);

      if (deleteTablesError) {
        console.error('❌ [AlunoOperations] Erro ao excluir das tabelas:', deleteTablesError);
        Alert.alert('Erro', `Não foi possível excluir o aluno das tabelas: ${deleteTablesError.message}`);
        return false;
      }

      console.log('✅ Dados das tabelas excluídos com sucesso');

      // ✅ 6. SEGUNDO: Tentar deletar do Auth usando RPC
      console.log('🗑️ Tentando deletar do Auth via RPC...');
      const { error: rpcError } = await supabase.rpc('delete_user_auth', {
        user_id: aluno.id
      });

      if (rpcError) {
        console.error('❌ [AlunoOperations] RPC falhou:', rpcError);
        console.warn('⚠️ Aluno excluído das tabelas, mas não foi possível excluir do Auth.');
        // Notifica o usuário, mas considera sucesso parcial
        Alert.alert(
          'Parcialmente Excluído', 
          `${aluno.nome_completo} foi excluído do sistema, mas o usuário ainda existe no auth. Entre em contato com o administrador se necessário.`,
          [{ text: 'OK' }]
        );
      } else {
        console.log('✅ Usuário excluído do Auth com sucesso');
        // Nenhum Alert de sucesso, apenas feedback visual na lista
      }

      onSuccess();
      return true;
      
    } catch (error) {
      console.error('💥 [AlunoOperations] Erro inesperado ao excluir:', error);
      Alert.alert('Erro', 'Erro inesperado ao excluir aluno. Tente novamente.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    navigateToDetails,
    navigateToParQ,
    navigateToAvaliacoes,
    navigateToRotinas,
    deleteAluno
  };
};
// hooks/useExercicioOperations.ts
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Exercicio } from '../types/Exercicio';

interface PlanStatus {
  pode_adicionar: boolean;
  total_exercicios: number;
  limite_exercicios: number;
  plano_atual: string;
}

interface UseExercicioOperationsProps {
  activeTab: 'padrao' | 'personalizados';
}

export const useExercicioOperations = ({ activeTab }: UseExercicioOperationsProps) => {
  const [loading, setLoading] = useState(false);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [planStatus, setPlanStatus] = useState<PlanStatus>({
    pode_adicionar: true,
    total_exercicios: 0,
    limite_exercicios: 3,
    plano_atual: 'gratuito'
  });

  // ===============================
  // NAVEGAÇÃO (já existentes)
  // ===============================
  const navigateToDetails = (exercicioId: string) => {
    router.push(`/detalhes-exercicio/${exercicioId}` as any);
  };

  const navigateToCreatePersonalized = (exercicioId: string) => {
    router.push(`/criar-exercicio-personalizado/${exercicioId}` as any);
  };

  const navigateToEdit = (exercicioId: string) => {
    router.push(`/editar-exercicio/${exercicioId}` as any);
  };

  const navigateToCreate = () => {
    router.push(`/criar-exercicio` as any);
  };

  // ===============================
  // BUSCAR EXERCÍCIOS (NOVO)
  // ===============================
  const fetchExercicios = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      console.log('🔍 [ExercicioOperations] Buscando exercícios, aba:', activeTab);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ [ExercicioOperations] Erro de autenticação:', authError);
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        return;
      }

      let query = supabase
        .from('exercicios')
        .select(`
          id,
          nome,
          descricao,
          grupo_muscular,
          equipamento,
          dificuldade,
          tipo,
          instrucoes,
          imagem_1_url,
          imagem_2_url,
          video_url,
          youtube_url,
          is_ativo,
          created_at,
          pt_id,
          exercicio_padrao_id
        `)
        .eq('is_ativo', true)
        .order('created_at', { ascending: false });

      // Filtrar por tipo
      if (activeTab === 'padrao') {
        query = query.eq('tipo', 'padrao');
      } else {
        query = query.eq('tipo', 'personalizado').eq('pt_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [ExercicioOperations] Erro ao buscar exercícios:', error);
        Alert.alert('Erro', 'Não foi possível carregar os exercícios.');
        return;
      }

      console.log(`✅ [ExercicioOperations] ${data?.length || 0} exercícios carregados para aba: ${activeTab}`);
      setExercicios(data || []);
      
      // Se está na aba personalizados, buscar status do plano
      if (activeTab === 'personalizados') {
        await fetchPlanStatus(user.id, data?.length || 0);
      }
      
    } catch (error) {
      console.error('💥 [ExercicioOperations] Erro inesperado:', error);
      Alert.alert('Erro', 'Erro inesperado ao carregar exercícios.');
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // BUSCAR STATUS DO PLANO (NOVO)
  // ===============================
  const fetchPlanStatus = async (ptId: string, currentExerciseCount: number) => {
    try {
      console.log('📊 [ExercicioOperations] Buscando status do plano para PT:', ptId);
      
      // Buscar dados do PT na tabela personal_trainer
      const { data: personalTrainer, error: ptError } = await supabase
        .from('personal_trainers')
        .select(`
          id,
          plano,
          limite_alunos,
          limite_exercicios
        `)
        .eq('id', ptId)
        .single();

      if (ptError || !personalTrainer) {
        console.error('❌ [ExercicioOperations] Erro ao buscar dados do PT:', ptError);
        // Usar valores padrão se não encontrar
        setPlanStatus({
          pode_adicionar: currentExerciseCount < 3,
          total_exercicios: currentExerciseCount,
          limite_exercicios: 3,
          plano_atual: 'gratuito'
        });
        return;
      }

      const limiteExercicios = personalTrainer.limite_exercicios || 3;
      const planoAtual = personalTrainer.plano || 'gratuito';
      const podeAdicionar = limiteExercicios === -1 || currentExerciseCount < limiteExercicios;

      setPlanStatus({
        pode_adicionar: podeAdicionar,
        total_exercicios: currentExerciseCount,
        limite_exercicios: limiteExercicios,
        plano_atual: planoAtual
      });

      console.log(`✅ [ExercicioOperations] Status do plano: ${planoAtual}, ${currentExerciseCount}/${limiteExercicios === -1 ? 'ilimitado' : limiteExercicios}`);
      
    } catch (error) {
      console.error('💥 [ExercicioOperations] Erro ao buscar status do plano:', error);
      // Usar valores padrão em caso de erro
      setPlanStatus({
        pode_adicionar: currentExerciseCount < 3,
        total_exercicios: currentExerciseCount,
        limite_exercicios: 3,
        plano_atual: 'gratuito'
      });
    }
  };

  // ===============================
  // REFRESH DOS DADOS (NOVO)
  // ===============================
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExercicios(false);
    setRefreshing(false);
  };

  // ===============================
  // GERENCIAR LISTA LOCAL (NOVO)
  // ===============================
  const addExercicioToList = (novoExercicio: Exercicio) => {
    console.log('➕ [ExercicioOperations] Adicionando exercício à lista local:', novoExercicio.id);
    setExercicios(prev => [novoExercicio, ...prev]);
    
    // Atualizar status do plano se for personalizado
    if (activeTab === 'personalizados') {
      setPlanStatus(prev => ({
        ...prev,
        total_exercicios: prev.total_exercicios + 1,
        pode_adicionar: prev.limite_exercicios === -1 || (prev.total_exercicios + 1) < prev.limite_exercicios
      }));
    }
  };

  const removeExercicioFromList = (exercicioId: string) => {
    console.log('🗑️ [ExercicioOperations] Removendo exercício da lista local:', exercicioId);
    setExercicios(prev => prev.filter(ex => ex.id !== exercicioId));
    
    // Atualizar status do plano se for personalizado
    if (activeTab === 'personalizados') {
      setPlanStatus(prev => ({
        ...prev,
        total_exercicios: Math.max(0, prev.total_exercicios - 1),
        pode_adicionar: prev.limite_exercicios === -1 || (prev.total_exercicios - 1) < prev.limite_exercicios
      }));
    }
  };

  const updateExercicioInList = (exercicioAtualizado: Exercicio) => {
    console.log('✏️ [ExercicioOperations] Atualizando exercício na lista local:', exercicioAtualizado.id);
    setExercicios(prev => 
      prev.map(ex => ex.id === exercicioAtualizado.id ? exercicioAtualizado : ex)
    );
  };

  // ===============================
  // UTILITÁRIOS (NOVO)
  // ===============================
  const canAddMoreExercises = () => {
    return planStatus.pode_adicionar;
  };

  const getLimitText = () => {
    if (planStatus.limite_exercicios === -1) {
      return 'Exercícios ilimitados';
    }
    return `${planStatus.total_exercicios}/${planStatus.limite_exercicios} exercícios`;
  };

  // ===============================
  // CRIAR CÓPIA PERSONALIZADA (já existente)
  // ===============================
  const createPersonalizedCopy = async (exercicioOriginal: Exercicio, onSuccess: (novoExercicio: Exercicio) => void) => {
    if (!exercicioOriginal) return false;

    try {
      setLoading(true);
      console.log('📋 [ExercicioOperations] Criando cópia personalizada:', exercicioOriginal.id);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ [ExercicioOperations] Erro de autenticação:', authError);
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        return false;
      }

      // Verificar se é personal trainer
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, user_type')
        .eq('id', user.id)
        .eq('user_type', 'personal_trainer')
        .single();

      if (profileError || !userProfile) {
        console.error('❌ [ExercicioOperations] User profile não é personal_trainer:', profileError);
        Alert.alert('Erro', 'Acesso negado. Apenas personal trainers podem criar exercícios.');
        return false;
      }

      // Verificar limite antes de criar
      if (!canAddMoreExercises()) {
        Alert.alert(
          'Limite atingido', 
          `Você atingiu o limite de ${planStatus.limite_exercicios} exercícios personalizados do plano ${planStatus.plano_atual}.`
        );
        return false;
      }

      // Criar cópia personalizada
      const exercicioPersonalizado = {
        nome: `${exercicioOriginal.nome} (Personalizado)`,
        descricao: exercicioOriginal.descricao,
        grupo_muscular: exercicioOriginal.grupo_muscular,
        equipamento: exercicioOriginal.equipamento,
        dificuldade: exercicioOriginal.dificuldade,
        tipo: 'personalizado',
        instrucoes: exercicioOriginal.instrucoes,
        imagem_1_url: exercicioOriginal.imagem_1_url,
        imagem_2_url: exercicioOriginal.imagem_2_url,
        video_url: exercicioOriginal.video_url,
        youtube_url: exercicioOriginal.youtube_url,
        exercicio_padrao_id: exercicioOriginal.id,
        pt_id: user.id,
        is_ativo: true
      };

      const { data: novoExercicio, error } = await supabase
        .from('exercicios')
        .insert([exercicioPersonalizado])
        .select(`
          id,
          nome,
          descricao,
          grupo_muscular,
          equipamento,
          dificuldade,
          tipo,
          instrucoes,
          imagem_1_url,
          imagem_2_url,
          video_url,
          youtube_url,
          is_ativo,
          created_at,
          pt_id,
          exercicio_padrao_id
        `)
        .single();

      if (error) {
        console.error('❌ [ExercicioOperations] Erro ao criar cópia:', error);
        Alert.alert('Erro', 'Não foi possível criar a cópia personalizada.');
        return false;
      }

      console.log('✅ [ExercicioOperations] Cópia criada com sucesso:', novoExercicio.id);
      Alert.alert('Sucesso', 'Cópia personalizada criada com sucesso!');
      onSuccess(novoExercicio);
      return true;
      
    } catch (error) {
      console.error('💥 [ExercicioOperations] Erro inesperado ao criar cópia:', error);
      Alert.alert('Erro', 'Erro inesperado ao criar cópia. Tente novamente.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // DELETAR EXERCÍCIO (já existente)
  // ===============================
  const deleteExercicio = async (exercicio: Exercicio, onSuccess: () => void) => {
    if (!exercicio || exercicio.tipo !== 'personalizado') {
      Alert.alert('Erro', 'Apenas exercícios personalizados podem ser excluídos.');
      return false;
    }

    try {
      setLoading(true);
      console.log('🗑️ [ExercicioOperations] Excluindo exercício:', exercicio.id);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ [ExercicioOperations] Erro de autenticação:', authError);
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        return false;
      }

      // Verificar se o exercício pertence a este PT
      const { data: exercicioVerificacao, error: verificacaoError } = await supabase
        .from('exercicios')
        .select('id, pt_id, nome')
        .eq('id', exercicio.id)
        .eq('pt_id', user.id)
        .single();

      if (verificacaoError || !exercicioVerificacao) {
        console.error('❌ [ExercicioOperations] Exercício não pertence a este PT:', verificacaoError);
        Alert.alert('Erro', 'Você não tem permissão para excluir este exercício.');
        return false;
      }

      // Excluir exercício
      const { error: deleteError } = await supabase
        .from('exercicios')
        .delete()
        .eq('id', exercicio.id);

      if (deleteError) {
        console.error('❌ [ExercicioOperations] Erro ao excluir exercício:', deleteError);
        Alert.alert('Erro', 'Não foi possível excluir o exercício.');
        return false;
      }

      console.log('✅ [ExercicioOperations] Exercício excluído com sucesso');
      Alert.alert('Sucesso', `${exercicio.nome} foi excluído com sucesso!`);
      onSuccess();
      return true;
      
    } catch (error) {
      console.error('💥 [ExercicioOperations] Erro inesperado ao excluir:', error);
      Alert.alert('Erro', 'Erro inesperado ao excluir exercício. Tente novamente.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // EFFECT PARA BUSCAR DADOS (NOVO)
  // ===============================
  useEffect(() => {
    fetchExercicios();
  }, [activeTab]);

  // ===============================
  // RETORNO DO HOOK (expandido)
  // ===============================
  return {
    // Estados
    loading,
    exercicios,
    refreshing,
    planStatus,
    
    // Navegação
    navigateToDetails,
    navigateToCreatePersonalized,
    navigateToEdit,
    navigateToCreate,
    
    // Operações CRUD
    createPersonalizedCopy,
    deleteExercicio,
    
    // Busca e refresh (NOVO)
    fetchExercicios,
    handleRefresh,
    
    // Gerenciar lista local (NOVO)
    addExercicioToList,
    removeExercicioFromList,
    updateExercicioInList,
    
    // Utilitários (NOVO)
    canAddMoreExercises,
    getLimitText
  };
};
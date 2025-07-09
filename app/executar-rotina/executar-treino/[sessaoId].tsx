// app/execucao/executar-treino/[sessaoId].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import ExecutorModoAluno from '../../../components/executar-rotina/ExecutorModoAluno';
import ExecutorModoPT from '../../../components/executar-rotina/ExecutorModoPT';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';

// ✅ INTERFACES CORRIGIDAS (temporariamente com any para evitar erros de tipo)
interface SessaoData {
  id: string;
  rotina_id: string;
  treino_id: string;
  aluno_id: string;
  status: string;
  data_execucao: string;
  rotinas: any; // Temporário - evita erro de tipagem do Supabase
  treinos: any; // Temporário - evita erro de tipagem do Supabase
  alunos: any;  // Temporário - evita erro de tipagem do Supabase
}

interface UserProfile {
  user_type: 'personal_trainer' | 'aluno';
  id: string;
  nome_completo: string;
}

export default function ExecutarTreinoScreen() {
  // ✅ AUTENTICAÇÃO E NAVEGAÇÃO
  useAuth();
  const router = useRouter();
  const { sessaoId } = useLocalSearchParams<{ sessaoId: string }>();

  // ✅ ESTADOS
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessaoData, setSessaoData] = useState<SessaoData | null>(null);
  const [modoExecucao, setModoExecucao] = useState<'pt' | 'aluno' | null>(null);

  // Função utilitária para comparar campos relevantes de sessão
  function shallowCompareSessao(a: any, b: any): boolean {
    if (!a || !b) return false;
    return (
      a.id === b.id &&
      a.rotina_id === b.rotina_id &&
      a.treino_id === b.treino_id &&
      a.aluno_id === b.aluno_id &&
      a.status === b.status &&
      a.data_execucao === b.data_execucao &&
      a.rotinas?.nome === b.rotinas?.nome &&
      a.rotinas?.permite_execucao_aluno === b.rotinas?.permite_execucao_aluno &&
      a.treinos?.nome === b.treinos?.nome &&
      a.alunos?.nome_completo === b.alunos?.nome_completo
    );
  }

  // ✅ Memoizar sessaoData para evitar looping no ExecutorModoPT
  const sessaoDataMemo = useMemo(() => {
    if (!sessaoData) return null;
    // Cria um novo objeto apenas com campos primitivos
    return {
      id: sessaoData.id,
      rotina_id: sessaoData.rotina_id,
      treino_id: sessaoData.treino_id,
      aluno_id: sessaoData.aluno_id,
      status: sessaoData.status,
      data_execucao: sessaoData.data_execucao,
      // Passe apenas nomes dos objetos aninhados para evitar referência instável
      rotinas: sessaoData.rotinas ? { nome: sessaoData.rotinas.nome, permite_execucao_aluno: sessaoData.rotinas.permite_execucao_aluno } : undefined,
      treinos: sessaoData.treinos ? { nome: sessaoData.treinos.nome } : undefined,
      alunos: sessaoData.alunos ? { nome_completo: sessaoData.alunos.nome_completo } : undefined,
    };
  }, [sessaoData]);

  // ✅ FUNÇÃO PARA DETERMINAR MODO (MOVIDA PARA FORA DO useEffect)
  const determinarModoExecucao = useCallback(async (userId: string, sessao: SessaoData): Promise<'pt' | 'aluno'> => {
    try {
      // Verificar se é Personal Trainer
      const { data: ptData, error: ptError } = await supabase
        .from('personal_trainers')
        .select('id, nome_completo')
        .eq('id', userId)
        .single();

      if (!ptError && ptData) {
        // É Personal Trainer
        setUserProfile({
          user_type: 'personal_trainer',
          id: ptData.id,
          nome_completo: ptData.nome_completo
        });
        return 'pt';
      }

      // Verificar se é Aluno
      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select('id, nome_completo')
        .eq('id', userId)
        .single();

      if (!alunoError && alunoData) {
        // É Aluno - verificar se pode executar
        if (!sessao.rotinas.permite_execucao_aluno) {
          Alert.alert(
            'Acesso Negado', 
            'Esta rotina não permite execução independente pelo aluno. Procure seu Personal Trainer.'
          );
          router.back();
          return 'aluno'; // Não chegará aqui, mas para TypeScript
        }

        // Verificar se é o aluno correto
        if (alunoData.id !== sessao.aluno_id) {
          Alert.alert('Erro', 'Você não tem permissão para executar esta sessão');
          router.back();
          return 'aluno';
        }

        setUserProfile({
          user_type: 'aluno',
          id: alunoData.id,
          nome_completo: alunoData.nome_completo
        });
        return 'aluno';
      }

      // Não é nem PT nem Aluno
      Alert.alert('Erro', 'Tipo de usuário não identificado');
      router.back();
      return 'aluno';

    } catch (error) {
      console.error('Erro ao determinar modo de execução:', error);
      Alert.alert('Erro', 'Erro ao verificar permissões');
      router.back();
      return 'aluno';
    }
  }, [router]);

  // ✅ FUNÇÃO PARA CARREGAR DADOS (CORRIGIDA - SEM JOIN COM ALUNOS)
  const loadSessionData = useCallback(async () => {
    if (!sessaoId) return;
    
    try {
      setLoading(true);

      // Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.replace('/');
        return;
      }

      // ✅ BUSCAR DADOS DA SESSÃO SEM JOIN COM ALUNOS
      const { data: sessao, error: sessaoError } = await supabase
        .from('execucoes_sessao')
        .select(`
          id,
          rotina_id,
          treino_id,
          aluno_id,
          status,
          data_execucao,
          rotinas!inner (
            nome,
            permite_execucao_aluno
          ),
          treinos!inner (
            nome
          )
        `)
        .eq('id', sessaoId)
        .single();

      if (sessaoError || !sessao) {
        console.error('Erro ao buscar sessão:', sessaoError);
        Alert.alert('Erro', 'Sessão não encontrada');
        router.back();
        return;
      }

      // ✅ BUSCAR DADOS DO ALUNO SEPARADAMENTE
      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select('nome_completo')
        .eq('id', sessao.aluno_id)
        .single();

      if (alunoError || !alunoData) {
        console.error('Erro ao buscar aluno:', alunoError);
        Alert.alert('Erro', 'Dados do aluno não encontrados');
        router.back();
        return;
      }

      // ✅ COMBINAR OS DADOS
      const sessaoCompleta = {
        ...sessao,
        alunos: {
          nome_completo: alunoData.nome_completo
        }
      };

      // Só atualiza o estado se realmente mudou (comparação rasa dos campos relevantes)
      setSessaoData(prev => shallowCompareSessao(prev, sessaoCompleta) ? prev : sessaoCompleta);

      // Determinar tipo de usuário e modo de execução
      const modo = await determinarModoExecucao(user.id, sessaoCompleta);
      setModoExecucao(modo);

    } catch (error) {
      console.error('Erro ao carregar dados da sessão:', error);
      Alert.alert('Erro', 'Erro ao carregar dados da sessão');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [sessaoId, router, determinarModoExecucao]);

  // ✅ CARREGAR DADOS - useEffect CORRIGIDO
  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  // ✅ VERIFICAR SE SESSÃO ESTÁ VÁLIDA
  const verificarStatusSessao = useCallback(() => {
    if (!sessaoData) return false;

    if (sessaoData.status === 'concluida') {
      Alert.alert(
        'Sessão Finalizada',
        'Esta sessão já foi concluída e não pode ser executada novamente.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return false;
    }

    if (sessaoData.status === 'cancelada') {
      Alert.alert(
        'Sessão Cancelada',
        'Esta sessão foi cancelada e não pode ser executada.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return false;
    }

    return true;
  }, [sessaoData, router]);

  // ✅ LOADING
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando sessão...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ VERIFICAÇÕES DE ERRO
  if (!sessaoData || !userProfile || !modoExecucao) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Dados da sessão não encontrados</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ VERIFICAR STATUS DA SESSÃO
  if (!verificarStatusSessao()) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Sessão não disponível</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ RENDERIZAR COMPONENTE APROPRIADO
  return (
    <SafeAreaView style={styles.container}>
      {modoExecucao === 'pt' ? (
        <ExecutorModoPT
          sessaoId={sessaoId!}
          sessaoData={sessaoDataMemo as SessaoData}
          userProfile={userProfile!}
          onSessaoFinalizada={() => {
            // Navegar de volta após finalização
            router.push(`/rotinas/${sessaoData?.aluno_id}` as never);
          }}
        />
      ) : (
        <ExecutorModoAluno
          sessaoId={sessaoId!}
          sessaoData={sessaoDataMemo as SessaoData}
          userProfile={userProfile!}
          onSessaoFinalizada={() => {
            // Navegar de volta após finalização
            router.push('/(tabs)/index-aluno' as never);
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ✅ STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Loading/Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
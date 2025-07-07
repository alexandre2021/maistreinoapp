// app/execucao/selecionar-treino/[rotinaId].tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';

// ✅ INTERFACES
interface Rotina {
  id: string;
  nome: string;
  descricao?: string;
  aluno_id: string;
  status: string;
}

interface Treino {
  id: string;
  nome: string;
  grupos_musculares: string;
  ordem: number;
}

interface UltimaSessao {
  treino_nome: string;
  data_execucao: string;
  dias_desde_execucao: number;
}

interface AlunoData {
  nome_completo: string;
  email: string;
}

export default function SelecionarTreinoScreen() {
  // ✅ AUTENTICAÇÃO E NAVEGAÇÃO
  useAuth();
  const router = useRouter();
  const { rotinaId } = useLocalSearchParams<{ rotinaId: string }>();

  // ✅ ESTADOS
  const [loading, setLoading] = useState(true);
  const [rotina, setRotina] = useState<Rotina | null>(null);
  const [aluno, setAluno] = useState<AlunoData | null>(null);
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [ultimaSessao, setUltimaSessao] = useState<UltimaSessao | null>(null);
  const [treinoSugerido, setTreinoSugerido] = useState<string>('');

  // ✅ BUSCAR ÚLTIMA SESSÃO
  const buscarUltimaSessao = useCallback(async (alunoId: string) => {
    try {
      const { data: ultimaExecucao, error } = await supabase
        .from('execucoes_sessao')
        .select(`
          data_execucao,
          treinos!inner (
            nome
          )
        `)
        .eq('aluno_id', alunoId)
        .eq('status', 'concluida')
        .order('data_execucao', { ascending: false })
        .limit(1)
        .single();

      if (error || !ultimaExecucao) {
        console.log('Nenhuma sessão anterior encontrada');
        setUltimaSessao(null);
        return null;
      }

      // Calcular dias desde a última execução
      const dataExecucao = new Date(ultimaExecucao.data_execucao);
      const hoje = new Date();
      const diffTime = Math.abs(hoje.getTime() - dataExecucao.getTime());
      const diasDesdeExecucao = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const ultimaSessaoData: UltimaSessao = {
        treino_nome: (ultimaExecucao.treinos as any)?.nome || 'Treino desconhecido',
        data_execucao: ultimaExecucao.data_execucao,
        dias_desde_execucao: diasDesdeExecucao
      };

      setUltimaSessao(ultimaSessaoData);
      return ultimaSessaoData.treino_nome;

    } catch (error) {
      console.error('Erro ao buscar última sessão:', error);
      setUltimaSessao(null);
      return null;
    }
  }, []);

  // ✅ CALCULAR TREINO SUGERIDO
  const calcularTreinoSugerido = useCallback((ultimoTreino: string | null, treinosLista: Treino[]) => {
    if (!treinosLista.length) return '';

    if (!ultimoTreino) {
      // Se nunca executou, sugerir o primeiro treino (ordem 1)
      const primeiroTreino = treinosLista.find(t => t.ordem === 1);
      return primeiroTreino?.nome || treinosLista[0]?.nome || '';
    }

    // Encontrar o treino atual e sugerir o próximo
    const treinoAtualIndex = treinosLista.findIndex(t => t.nome === ultimoTreino);
    
    if (treinoAtualIndex === -1) {
      // Se não encontrou o treino anterior, sugerir o primeiro
      return treinosLista[0]?.nome || '';
    }

    // Sugerir o próximo treino na sequência (circular)
    const proximoIndex = (treinoAtualIndex + 1) % treinosLista.length;
    return treinosLista[proximoIndex]?.nome || '';
  }, []);

  // ✅ CARREGAR DADOS
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.replace('/');
        return;
      }

      // Buscar rotina
      const { data: rotinaData, error: rotinaError } = await supabase
        .from('rotinas')
        .select('id, nome, descricao, aluno_id, status')
        .eq('id', rotinaId)
        .eq('personal_trainer_id', user.id)
        .single();

      if (rotinaError || !rotinaData) {
        Alert.alert('Erro', 'Rotina não encontrada');
        router.back();
        return;
      }

      setRotina(rotinaData);

      // Buscar dados do aluno separadamente
      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select('nome_completo, email')
        .eq('id', rotinaData.aluno_id)
        .single();

      if (alunoError || !alunoData) {
        Alert.alert('Erro', 'Dados do aluno não encontrados');
        router.back();
        return;
      }

      setAluno(alunoData);

      // Buscar treinos da rotina
      const { data: treinosData, error: treinosError } = await supabase
        .from('treinos')
        .select('id, nome, grupos_musculares, ordem')
        .eq('rotina_id', rotinaId)
        .order('ordem');

      if (treinosError) {
        console.error('Erro ao buscar treinos:', treinosError);
        setTreinos([]);
        return;
      }

      const treinosList = treinosData || [];
      setTreinos(treinosList);

      // Buscar última sessão executada
      const ultimoTreino = await buscarUltimaSessao(rotinaData.aluno_id);
      
      // Calcular treino sugerido
      const sugerido = calcularTreinoSugerido(ultimoTreino, treinosList);
      setTreinoSugerido(sugerido);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Erro ao carregar dados da rotina');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [rotinaId, buscarUltimaSessao, calcularTreinoSugerido, router]);

  // ✅ EFFECT
  useEffect(() => {
    if (!rotinaId) return;
    loadData();
  }, [loadData, rotinaId]);

  // ✅ FORMATAÇÃO DE DATA
  const formatarDataUltimaSessao = (dataISO: string, dias: number) => {
    const data = new Date(dataISO);
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const diaSemana = diasSemana[data.getDay()];
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = meses[data.getMonth()];
    
    return `${diaSemana}, ${dia}/${mes} (${dias} ${dias === 1 ? 'dia' : 'dias'})`;
  };

  // ✅ SELECIONAR TREINO E INICIAR EXECUÇÃO - CORRIGIDO
  const iniciarTreino = async (treino: Treino) => {
    try {
      if (!rotina || !aluno) return;

      // ✅ CALCULAR PRÓXIMO NÚMERO DA SESSÃO
      const { data: ultimaSessao, error: ultimaSessaoError } = await supabase
        .from('execucoes_sessao')
        .select('sessao_numero')
        .eq('aluno_id', rotina.aluno_id)
        .order('sessao_numero', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ultimaSessaoError) {
        console.error('Erro ao buscar última sessão:', ultimaSessaoError);
        Alert.alert('Erro', 'Não foi possível verificar sessões anteriores');
        return;
      }

      const proximoNumero = ultimaSessao ? (ultimaSessao.sessao_numero + 1) : 1;
      console.log('Próximo número da sessão:', proximoNumero);

      // ✅ CRIAR NOVA SESSÃO DE EXECUÇÃO COM sessao_numero
      const { data: novaSessao, error: sessaoError } = await supabase
        .from('execucoes_sessao')
        .insert([{
          rotina_id: rotinaId,
          treino_id: treino.id,
          aluno_id: rotina.aluno_id,
          sessao_numero: proximoNumero, // ✅ CAMPO OBRIGATÓRIO ADICIONADO
          status: 'em_andamento',
          data_execucao: new Date().toISOString(),
          tempo_total_minutos: null,
          observacoes: null
        }])
        .select('id')
        .single();

      if (sessaoError || !novaSessao) {
        console.error('Erro ao criar sessão:', sessaoError);
        Alert.alert('Erro', 'Não foi possível iniciar a sessão de treino');
        return;
      }

      console.log('Sessão criada com sucesso:', novaSessao.id);

      // Navegar para tela de execução
      router.push(`/execucao/executar-treino/${novaSessao.id}` as never);

    } catch (error) {
      console.error('Erro ao iniciar treino:', error);
      Alert.alert('Erro', 'Erro inesperado ao iniciar treino');
    }
  };

  // ✅ LOADING
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!rotina || !aluno) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Dados não encontrados</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Execução de Treino</Text>
          <Text style={styles.headerSubtitle}>{aluno.nome_completo}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* SEÇÃO DE CONTEXTO */}
        <View style={styles.contextSection}>
          {ultimaSessao ? (
            <>
              <Text style={styles.contextTitle}>ÚLTIMA SESSÃO</Text>
              <Text style={styles.contextValue}>
                {ultimaSessao.treino_nome} - {formatarDataUltimaSessao(ultimaSessao.data_execucao, ultimaSessao.dias_desde_execucao)}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.contextTitle}>PRIMEIRA SESSÃO</Text>
              <Text style={styles.contextValue}>Nenhuma sessão executada ainda</Text>
            </>
          )}

          <Text style={styles.contextTitle}>
            {ultimaSessao ? 'PRÓXIMA SESSÃO (SUGERIDO)' : 'TREINO SUGERIDO'}
          </Text>
          <Text style={styles.contextValueSuggested}>{treinoSugerido}</Text>
        </View>

        {/* DIVISOR */}
        <View style={styles.divider} />

        {/* SELEÇÃO DE TREINO */}
        <View style={styles.selectionSection}>
          <Text style={styles.selectionTitle}>SELECIONAR TREINO</Text>
          
          {treinos.map((treino) => {
            const isSugerido = treino.nome === treinoSugerido;
            const grupos = treino.grupos_musculares ? treino.grupos_musculares.split(', ') : [];
            
            return (
              <TouchableOpacity
                key={treino.id}
                style={[
                  styles.treinoCard,
                  isSugerido && styles.treinoCardSugerido
                ]}
                onPress={() => iniciarTreino(treino)}
              >
                <View style={styles.treinoInfo}>
                  <View style={styles.treinoHeader}>
                    <Text style={[
                      styles.treinoNome,
                      isSugerido && styles.treinoNomeSugerido
                    ]}>
                      {treino.nome}
                    </Text>
                    {isSugerido && (
                      <View style={styles.sugeridoBadge}>
                        <Text style={styles.sugeridoText}>SUGERIDO</Text>
                      </View>
                    )}
                  </View>
                  
                  {grupos.length > 0 && (
                    <View style={styles.gruposContainer}>
                      {grupos.map((grupo, index) => (
                        <View key={index} style={styles.grupoTag}>
                          <Text style={styles.grupoText}>{grupo}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.treinoAction}>
                  <Ionicons name="play" size={24} color="#007AFF" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ✅ STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBackButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },

  // Content
  content: {
    flex: 1,
  },

  // Context Section
  contextSection: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  contextTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  contextValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  contextValueSuggested: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    marginVertical: 20,
  },

  // Selection Section
  selectionSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  selectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 16,
  },

  // Treino Cards
  treinoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  treinoCardSugerido: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#F0F9FF',
  },
  treinoInfo: {
    flex: 1,
  },
  treinoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  treinoNome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12,
  },
  treinoNomeSugerido: {
    color: '#007AFF',
  },
  sugeridoBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sugeridoText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  gruposContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  grupoTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  grupoText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  treinoAction: {
    padding: 8,
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
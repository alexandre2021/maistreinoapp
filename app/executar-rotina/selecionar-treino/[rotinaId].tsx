// app/execucao/selecionar-treino/[rotinaId].tsx - VERSÃO MELHORADA
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { ConfirmActionModal } from '../../../components/rotina/ConfirmActionModal';
import { MENSAGENS, SESSAO_STATUS } from '../../../constants/exercicio.constants';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';

// ✅ INTERFACES EXPANDIDAS
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
  sessoes_disponiveis: number;
  sessoes_concluidas: number;
  tem_em_andamento: boolean;
  sessao_em_andamento_id?: string;
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

interface SessaoEmAndamento {
  id: string;
  treino_id: string;
  treino_nome: string;
  data_execucao: string;
  sessao_numero: number;
}

export default function SelecionarTreinoScreen() {
  // ✅ AUTENTICAÇÃO E NAVEGAÇÃO
  useAuth();
  const router = useRouter();
  const { rotinaId } = useLocalSearchParams<{ rotinaId: string }>();

  // ✅ ESTADOS EXISTENTES
  const [loading, setLoading] = useState(true);
  const [rotina, setRotina] = useState<Rotina | null>(null);
  const [aluno, setAluno] = useState<AlunoData | null>(null);
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [ultimaSessao, setUltimaSessao] = useState<UltimaSessao | null>(null);
  const [treinoSugerido, setTreinoSugerido] = useState<string>('');

  // ✅ NOVOS ESTADOS PARA MODAL
  const [modalVisible, setModalVisible] = useState(false);
  const [sessoesEmAndamento, setSessoesEmAndamento] = useState<SessaoEmAndamento[]>([]);
  const [treinoSelecionado, setTreinoSelecionado] = useState<Treino | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [tipoModal, setTipoModal] = useState<'continuar_ou_nova' | 'escolher_sessao'>('continuar_ou_nova');

  // ✅ ESTADOS PARA TOAST
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Função auxiliar para calcular dias desde uma data
  function calcularDiasDesde(dataStr: string) {
    const data = new Date(dataStr);
    const hoje = new Date();
    return Math.floor((hoje.getTime() - data.getTime()) / (1000 * 60 * 60 * 24));
  }

  // ✅ BUSCAR SESSÕES EM ANDAMENTO PARA UM TREINO ESPECÍFICO (MÚLTIPLAS)
  const buscarSessoesEmAndamento = useCallback(async (treinoId: string) => {
    try {
      const { data: sessoes, error } = await supabase
        .from('execucoes_sessao')
        .select(`
          id,
          treino_id,
          data_execucao,
          sessao_numero,
          treinos!inner(nome)
        `)
        .eq('rotina_id', rotinaId)
        .eq('treino_id', treinoId)
        .eq('status', SESSAO_STATUS.EM_ANDAMENTO)
        .order('sessao_numero', { ascending: true });

      if (error || !sessoes) {
        return [];
      }

      return sessoes.map(sessao => ({
        id: sessao.id,
        treino_id: sessao.treino_id,
        treino_nome: (sessao.treinos as any)?.nome || `Treino ${sessao.treino_id}`,
        data_execucao: sessao.data_execucao,
        sessao_numero: sessao.sessao_numero
      })) as SessaoEmAndamento[];
    } catch (error) {
      console.error('Erro ao buscar sessões em andamento:', error);
      return [];
    }
  }, [rotinaId]);

  // ✅ BUSCAR PRÓXIMA SESSÃO DISPONÍVEL PARA UM TREINO
  const buscarProximaSessaoDisponivel = useCallback(async (treinoId: string) => {
    try {
      const { data: sessao, error } = await supabase
        .from('execucoes_sessao')
        .select('id, sessao_numero')
        .eq('rotina_id', rotinaId)
        .eq('treino_id', treinoId)
        .eq('status', SESSAO_STATUS.NAO_INICIADA)
        .order('sessao_numero', { ascending: true })
        .limit(1)
        .single();

      if (error || !sessao) {
        return null;
      }

      return sessao;
    } catch (error) {
      console.error('Erro ao buscar sessão disponível:', error);
      return null;
    }
  }, [rotinaId]);

  // ✅ CONTAR SESSÕES POR TREINO
  const contarSessoesPorTreino = useCallback(async (treinoId: string) => {
    try {
      const { data: sessoes, error } = await supabase
        .from('execucoes_sessao')
        .select('status')
        .eq('rotina_id', rotinaId)
        .eq('treino_id', treinoId);

      if (error || !sessoes) {
        return { disponiveis: 0, concluidas: 0, emAndamento: false };
      }

      const concluidas = sessoes.filter(s => s.status === SESSAO_STATUS.CONCLUIDA).length;
      const naoIniciadas = sessoes.filter(s => s.status === SESSAO_STATUS.NAO_INICIADA).length;
      const emAndamento = sessoes.some(s => s.status === SESSAO_STATUS.EM_ANDAMENTO);

      return {
        disponiveis: naoIniciadas,
        concluidas: concluidas,
        emAndamento: emAndamento
      };
    } catch (error) {
      console.error('Erro ao contar sessões:', error);
      return { disponiveis: 0, concluidas: 0, emAndamento: false };
    }
  }, [rotinaId]);

  // ✅ BUSCAR ÚLTIMA SESSÃO - MANTIDA
  const buscarUltimaSessao = useCallback(async (alunoId: string) => {
    try {
      const { data: ultimaExecucao, error } = await supabase
        .from('execucoes_sessao')
        .select('data_execucao, treino_id')
        .eq('aluno_id', alunoId)
        .eq('status', SESSAO_STATUS.CONCLUIDA)
        .order('data_execucao', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !ultimaExecucao) {
        setUltimaSessao(null);
        return null;
      }

      const { data: treino } = await supabase
        .from('treinos')
        .select('nome')
        .eq('id', ultimaExecucao.treino_id)
        .single();

      const ultimaSessaoData: UltimaSessao = {
        treino_nome: treino?.nome || `Treino ${ultimaExecucao.treino_id}`,
        data_execucao: ultimaExecucao.data_execucao,
        dias_desde_execucao: calcularDiasDesde(ultimaExecucao.data_execucao)
      };
      setUltimaSessao(ultimaSessaoData);
      return ultimaSessaoData.treino_nome;
    } catch (error) {
      console.error('Erro ao buscar sessão:', error);
      setUltimaSessao(null);
      return null;
    }
  }, []);

  // ✅ CALCULAR TREINO SUGERIDO - MANTIDA
  const calcularTreinoSugerido = useCallback((ultimoTreino: string | null, treinosLista: Treino[]) => {
    if (!treinosLista.length) return '';

    // Filtrar apenas treinos que têm sessões disponíveis
    const treinosDisponiveis = treinosLista.filter(t => t.sessoes_disponiveis > 0);
    
    if (!treinosDisponiveis.length) return '';

    if (!ultimoTreino) {
      const primeiroTreino = treinosDisponiveis.find(t => t.ordem === 1);
      return primeiroTreino?.nome || treinosDisponiveis[0]?.nome || '';
    }

    const treinoAtualIndex = treinosDisponiveis.findIndex(t => t.nome === ultimoTreino);
    
    if (treinoAtualIndex === -1) {
      return treinosDisponiveis[0]?.nome || '';
    }

    const proximoIndex = (treinoAtualIndex + 1) % treinosDisponiveis.length;
    return treinosDisponiveis[proximoIndex]?.nome || '';
  }, []);

  // ✅ FUNÇÃO TOAST
  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  };

  // ✅ CARREGAR DADOS COM LÓGICA EXPANDIDA
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

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

      // Buscar dados do aluno
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

      // ✅ ENRIQUECER TREINOS COM CONTAGEM DE SESSÕES
      const treinosEnriquecidos = await Promise.all(
        (treinosData || []).map(async (treino) => {
          const contagem = await contarSessoesPorTreino(treino.id);
          const sessoesEmAndamento = await buscarSessoesEmAndamento(treino.id);

          return {
            ...treino,
            sessoes_disponiveis: contagem.disponiveis,
            sessoes_concluidas: contagem.concluidas,
            tem_em_andamento: contagem.emAndamento,
            sessao_em_andamento_id: sessoesEmAndamento[0]?.id // Primeira para compatibilidade
          };
        })
      );

      setTreinos(treinosEnriquecidos);

      // Buscar última sessão e calcular sugerido
      const ultimoTreino = await buscarUltimaSessao(rotinaData.aluno_id);
      const sugerido = calcularTreinoSugerido(ultimoTreino, treinosEnriquecidos);
      setTreinoSugerido(sugerido);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Erro ao carregar dados da rotina');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [rotinaId, contarSessoesPorTreino, buscarSessoesEmAndamento, buscarUltimaSessao, calcularTreinoSugerido, router]);

  // ✅ INICIAR TREINO COM LÓGICA INTELIGENTE EXPANDIDA
  const iniciarTreino = async (treino: Treino) => {
    try {
      // 1. Verificar se treino está completo
      if (treino.sessoes_disponiveis === 0 && !treino.tem_em_andamento) {
        showToast(`Todas as sessões do ${treino.nome} foram concluídas`, 'error');
        return;
      }

      // 2. Buscar todas as sessões em andamento
      const sessoesAndamento = await buscarSessoesEmAndamento(treino.id);
      
      if (sessoesAndamento.length > 0) {
        // 3a. Se tem sessões em andamento + tem disponíveis → Modal continuar/nova
        if (treino.sessoes_disponiveis > 0) {
          setTreinoSelecionado(treino);
          setSessoesEmAndamento(sessoesAndamento);
          setTipoModal('continuar_ou_nova');
          setModalVisible(true);
          return;
        }
        
        // 3b. Se só tem uma sessão em andamento e zero disponíveis → Ir direto
        if (sessoesAndamento.length === 1) {
          router.push(`/executar-rotina/executar-treino/${sessoesAndamento[0].id}` as never);
          return;
        }
        
        // 3c. Se tem múltiplas sessões em andamento e zero disponíveis → Modal escolher
        setTreinoSelecionado(treino);
        setSessoesEmAndamento(sessoesAndamento);
        setTipoModal('escolher_sessao');
        setModalVisible(true);
        return;
      }

      // 4. Não tem sessões em andamento → Iniciar nova sessão
      await iniciarNovaSessao(treino);

    } catch (error) {
      console.error('Erro ao iniciar treino:', error);
      showToast('Erro inesperado ao iniciar treino', 'error');
    }
  };

  // ✅ INICIAR NOVA SESSÃO
  const iniciarNovaSessao = async (treino: Treino) => {
    try {
      if (!rotina) return;

      const sessaoDisponivel = await buscarProximaSessaoDisponivel(treino.id);
      
      if (!sessaoDisponivel) {
        showToast('Nenhuma sessão disponível para este treino', 'error');
        return;
      }

      // Atualizar sessão existente ao invés de criar nova
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data: sessaoAtualizada, error: updateError } = await supabase
        .from('execucoes_sessao')
        .update({
          status: SESSAO_STATUS.EM_ANDAMENTO,
          data_execucao: hoje
        })
        .eq('id', sessaoDisponivel.id)
        .select('id')
        .single();

      if (updateError || !sessaoAtualizada) {
        console.error('Erro ao atualizar sessão:', updateError);
        showToast('Não foi possível iniciar a sessão de treino', 'error');
        return;
      }

      console.log('Sessão iniciada com sucesso:', sessaoAtualizada.id);
      router.push(`/executar-rotina/executar-treino/${sessaoAtualizada.id}` as never);

    } catch (error) {
      console.error('Erro ao iniciar nova sessão:', error);
      showToast('Erro inesperado ao iniciar nova sessão', 'error');
    }
  };

  // ✅ CONTINUAR SESSÃO EXISTENTE
  const continuarSessao = () => {
    if (sessoesEmAndamento.length === 0) return;
    
    // Se tem apenas uma sessão, vai direto. Se tem múltiplas, pega a primeira
    const sessaoParaContinuar = sessoesEmAndamento[0];
    setModalVisible(false);
    router.push(`/executar-rotina/executar-treino/${sessaoParaContinuar.id}` as never);
  };

  // ✅ CONTINUAR SESSÃO ESPECÍFICA (PARA MÚLTIPLAS SESSÕES)
  const continuarSessaoEspecifica = (sessaoId: string) => {
    setModalVisible(false);
    router.push(`/executar-rotina/executar-treino/${sessaoId}` as never);
  };

  // ✅ NOVA SESSÃO (IGNORAR EM ANDAMENTO)
  const criarNovaSessao = async () => {
    if (!treinoSelecionado) return;

    setModalLoading(true);
    setModalVisible(false);
    await iniciarNovaSessao(treinoSelecionado);
    setModalLoading(false);
  };

  // ✅ EFFECT
  useEffect(() => {
    if (!rotinaId) return;
    loadData();
  }, [loadData, rotinaId]);

  // ✅ FORMATAÇÃO DE DATA - MANTIDA
  const formatarDataUltimaSessao = (dataISO: string, dias: number) => {
    const data = new Date(dataISO);
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const diaSemana = diasSemana[data.getDay()];
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = meses[data.getMonth()];
    
    return `${diaSemana}, ${dia}/${mes} (${dias} ${dias === 1 ? 'dia' : 'dias'})`;
  };

  // ✅ LOADING - MANTIDO
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
      {/* HEADER - MANTIDO */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#A11E0A" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Execução de Treino</Text>
          <Text style={styles.headerSubtitle}>{aluno.nome_completo}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* SEÇÃO DE CONTEXTO - MANTIDA */}
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

        <View style={styles.divider} />

        {/* ✅ SELEÇÃO DE TREINO MELHORADA */}
        <View style={styles.selectionSection}>
          <Text style={styles.selectionTitle}>SELECIONAR TREINO</Text>
          
          {treinos.map((treino) => {
            const isSugerido = treino.nome === treinoSugerido;
            const isCompleto = treino.sessoes_disponiveis === 0 && !treino.tem_em_andamento;
            const emAndamentoBadge = treino.tem_em_andamento;
            const grupos = treino.grupos_musculares ? treino.grupos_musculares.split(', ') : [];
            
            return (
              <TouchableOpacity
                key={treino.id}
                style={[
                  styles.treinoCard,
                  isSugerido && styles.treinoCardSugerido,
                  isCompleto && styles.treinoCardCompleto
                ]}
                onPress={() => iniciarTreino(treino)}
                disabled={isCompleto}
              >
                <View style={styles.treinoInfo}>
                  <View style={styles.treinoHeader}>
                    <Text style={[
                      styles.treinoNome,
                      isSugerido && styles.treinoNomeSugerido,
                      isCompleto && styles.treinoNomeCompleto
                    ]}>
                      {treino.nome}
                    </Text>
                    
                    {/* ✅ BADGES DE STATUS */}
                    <View style={styles.badgesContainer}>
                      {isSugerido && !isCompleto && (
                        <View style={styles.sugeridoBadge}>
                          <Text style={styles.sugeridoText}>SUGERIDO</Text>
                        </View>
                      )}
                      
                      {emAndamentoBadge && (
                        <View style={styles.emAndamentoBadge}>
                          <Text style={styles.emAndamentoText}>EM ANDAMENTO</Text>
                        </View>
                      )}
                      
                      {isCompleto && (
                        <View style={styles.completoBadge}>
                          <Text style={styles.completoText}>COMPLETO</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {/* ✅ PROGRESSO DAS SESSÕES */}
                  <View style={styles.progressoContainer}>
                    <Text style={styles.progressoTexto}>
                      {treino.sessoes_concluidas} concluídas • {treino.sessoes_disponiveis} disponíveis
                    </Text>
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
                  <Ionicons 
                    name={isCompleto ? "checkmark-circle" : "play"} 
                    size={24} 
                    color={isCompleto ? "#10B981" : "#A11E0A"} 
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ✅ MODAL ADAPTADA PARA MÚLTIPLOS CENÁRIOS */}
      {tipoModal === 'continuar_ou_nova' ? (
        <ConfirmActionModal
          visible={modalVisible}
          title="Sessão em Andamento"
          message={
            sessoesEmAndamento.length > 0
              ? `${MENSAGENS.CONTINUAR_SESSAO}\n\n${sessoesEmAndamento[0].treino_nome} - Sessão ${sessoesEmAndamento[0].sessao_numero}\nIniciada em ${new Date(sessoesEmAndamento[0].data_execucao).toLocaleDateString('pt-BR')}`
              : MENSAGENS.CONTINUAR_SESSAO
          }
          confirmText="Continuar"
          cancelText="Nova Sessão"
          loading={modalLoading}
          onConfirm={continuarSessao}
          onCancel={criarNovaSessao}
          actionType="warning"
        />
      ) : (
        // ✅ NOVA MODAL PARA MÚLTIPLAS SESSÕES
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Ionicons name="list" size={24} color="#F59E0B" />
                <Text style={styles.modalTitle}>Escolher Sessão</Text>
              </View>
              
              <Text style={styles.modalMessage}>
                Você tem múltiplas sessões em andamento. Escolha qual continuar:
              </Text>
              
              <View style={styles.sessoesList}>
                {sessoesEmAndamento.map((sessao, index) => (
                  <TouchableOpacity
                    key={sessao.id}
                    style={styles.sessaoItem}
                    onPress={() => continuarSessaoEspecifica(sessao.id)}
                  >
                    <View style={styles.sessaoInfo}>
                      <Text style={styles.sessaoTitulo}>
                        Sessão {sessao.sessao_numero}
                      </Text>
                      <Text style={styles.sessaoData}>
                        Iniciada em {new Date(sessao.data_execucao).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ✅ TOAST DE NOTIFICAÇÃO */}
      {toastVisible && (
        <View style={[
          styles.toast, 
          toastType === 'success' ? styles.toastSuccess : styles.toastError
        ]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ✅ STYLES EXPANDIDOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header - Mantido
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

  // Content - Mantido
  content: {
    flex: 1,
  },

  // Context Section - Mantido
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
    color: '#A11E0A',
    fontWeight: '600',
  },

  // Divider - Mantido
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    marginVertical: 20,
  },

  // Selection Section - Mantido
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

  // ✅ Treino Cards - Expandidos
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
    borderColor: '#A11E0A',
    borderWidth: 2,
    backgroundColor: '#F0F9FF',
  },
  treinoCardCompleto: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
    opacity: 0.7,
  },
  treinoInfo: {
    flex: 1,
  },
  treinoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  treinoNome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  treinoNomeSugerido: {
    color: '#A11E0A',
  },
  treinoNomeCompleto: {
    color: '#9CA3AF',
  },

  // ✅ Badges Container
  badgesContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  sugeridoBadge: {
    backgroundColor: '#A11E0A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sugeridoText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emAndamentoBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emAndamentoText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  completoBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completoText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ✅ Progresso das Sessões
  progressoContainer: {
    marginBottom: 8,
  },
  progressoTexto: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Grupos - Mantido
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

  // ✅ Modal Styles para Múltiplas Sessões
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalMessage: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 20,
  },
  sessoesList: {
    marginBottom: 20,
    gap: 8,
  },
  sessaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sessaoInfo: {
    flex: 1,
  },
  sessaoTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sessaoData: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalButtonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },

  // ✅ Toast Styles
  toast: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999,
  },
  toastSuccess: {
    backgroundColor: 'rgba(0, 122, 255, 1.00)',
  },
  toastError: {
    backgroundColor: '#DC2626',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Loading/Error - Mantido
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
    backgroundColor: '#A11E0A',
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
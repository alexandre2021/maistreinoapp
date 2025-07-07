// app/rotinas/[id].tsx - VERSÃO FINAL COM useEffect CORRIGIDO
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import AlunoHeaderCard from '../../components/AlunoHeaderCard';
import { ErrorModal } from '../../components/ErrorModal';
import { InfoModal } from '../../components/InfoModal';
import { AtivarRotinaModal } from '../../components/rotina/AtivarRotinaModal';
import { ConfirmActionModal } from '../../components/rotina/ConfirmActionModal';
import { RotinaAtivaModal } from '../../components/rotina/RotinaAtivaModal';
import { RotinaOptionsModal } from '../../components/rotina/RotinaOptionsModal';
import { useAuth } from '../../hooks/useAuth';
import { useModalManager } from '../../hooks/useModalManager';
import { supabase } from '../../lib/supabase';

// ✅ TYPES ATUALIZADOS
interface Aluno {
  id: string;
  nome_completo: string;
  email: string;
}

interface Rotina {
  id: string;
  nome: string;
  descricao?: string;
  treinos_por_semana: number;
  dificuldade: string;
  duracao_semanas: number;
  valor_total: number;
  data_inicio: string;
  status: string; // Agora armazena o texto legível: 'Aguardando pagamento' | 'Ativa' | 'Pausada' | 'Concluída'
  created_at: string;
  permite_execucao_aluno: boolean;
}

export default function RotinasAlunoScreen() {
  // ✅ AUTENTICAÇÃO - PROTEGE A PÁGINA
  useAuth();
  
  const router = useRouter();
  const { id: alunoId } = useLocalSearchParams<{ id: string }>();

  // ✅ ESTADOS
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [rotinas, setRotinas] = useState<Rotina[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'atual' | 'concluidas'>('atual');
  const [authReady, setAuthReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  // ✅ CONTROLE DE EXECUÇÃO PARA EVITAR LOOPS
  const isLoadingData = useRef(false);
  
  // ✅ ESTADO PARA ROTINA CONFLITANTE
  const [rotinaConflitante, setRotinaConflitante] = useState<{
    id: string;
    nome: string;
    status: string;
  } | null>(null);

  // ✅ MODAL MANAGER
  const { modals, openModal, closeModal } = useModalManager({
    rotinaAtiva: false,
    ativarRotina: false,
    excluirRotina: false,
    pausarRotina: false,
    reativarRotina: false,
    error: false,
    rotinaOptions: false,
    info: false
  });

  // ✅ ESTADOS PARA MODAIS
  const [modalData, setModalData] = useState({
    error: { title: '', message: '' },
    info: { title: '', message: '' },
    rotinaParaAtivar: null as Rotina | null,
    rotinaParaExcluir: null as Rotina | null,
    rotinaParaPausar: null as Rotina | null,
    rotinaParaReativar: null as Rotina | null,
    rotinaParaOpcoes: null as Rotina | null,
    loading: false
  });

  // ✅ VERIFICAR AUTENTICAÇÃO E PARÂMETROS PRIMEIRO
  useEffect(() => {
    const checkAuthAndParams = async () => {
      console.log('� [ROTINAS] Verificando autenticação e parâmetros...');
      
      if (!alunoId) {
        console.log('❌ [ROTINAS] ID do aluno não fornecido na URL');
        setInitError('ID do aluno não fornecido');
        setLoading(false);
        return;
      }
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('❌ [ROTINAS] Erro de autenticação:', authError);
          setInitError('Erro de autenticação');
          setLoading(false);
          return;
        }
        
        if (!user) {
          console.log('❌ [ROTINAS] Usuário não autenticado');
          setInitError('Usuário não autenticado');
          setLoading(false);
          return;
        }
        
        console.log('✅ [ROTINAS] Autenticação OK, usuário:', user.email);
        console.log('✅ [ROTINAS] Parâmetros OK, alunoId:', alunoId);
        setAuthReady(true);
        
      } catch (error) {
        console.error('❌ [ROTINAS] Erro ao verificar autenticação:', error);
        setInitError('Erro interno de autenticação');
        setLoading(false);
      }
    };
    
    checkAuthAndParams();
  }, [alunoId]);

  // ✅ CARREGAR DADOS - APENAS QUANDO AUTENTICAÇÃO ESTIVER PRONTA
  useEffect(() => {
    if (!authReady || !alunoId) {
      console.log('⏳ [ROTINAS] Aguardando autenticação...', { authReady, alunoId });
      return;
    }
    
    // ✅ PREVENIR EXECUÇÕES CONCORRENTES
    if (isLoadingData.current) {
      console.log('⚠️ [ROTINAS] Já carregando dados, ignorando nova execução');
      return;
    }
    
    console.log('🔄 [ROTINAS] Iniciando carregamento de dados para aluno:', alunoId);
    isLoadingData.current = true;

    const loadData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('❌ [ROTINAS] Erro de autenticação no carregamento:', authError);
          setInitError('Sessão expirada');
          setLoading(false);
          return;
        }

        console.log('✅ [ROTINAS] Usuário autenticado, carregando dados...');
        
        // ✅ BUSCAR ALUNO
        console.log('👤 [ROTINAS] Buscando dados do aluno...');
        const { data: alunoData, error: alunoError } = await supabase
          .from('alunos')
          .select('id, nome_completo, email')
          .eq('id', alunoId)
          .eq('personal_trainer_id', user.id)
          .single();

        if (alunoError) {
          console.error('❌ [ROTINAS] Erro ao buscar aluno:', alunoError);
          // ✅ INLINE ERROR HANDLING - sem dependências externas
          setInitError('Aluno não encontrado');
          setLoading(false);
          return;
        }

        if (!alunoData) {
          console.log('❌ [ROTINAS] Aluno não encontrado');
          // ✅ INLINE ERROR HANDLING - sem dependências externas
          setInitError('Aluno não encontrado');
          setLoading(false);
          return;
        }

        console.log('✅ [ROTINAS] Aluno encontrado:', alunoData.nome_completo);
        setAluno(alunoData);

        // ✅ BUSCAR ROTINAS
        console.log('📋 [ROTINAS] Buscando rotinas...');
        const { data: rotinasData, error: rotinasError } = await supabase
          .from('rotinas')
          .select(`
            id,
            nome,
            descricao,
            treinos_por_semana,
            dificuldade,
            duracao_semanas,
            valor_total,
            data_inicio,
            status,
            permite_execucao_aluno,
            created_at
          `)
          .eq('aluno_id', alunoId)
          .eq('personal_trainer_id', user.id)
          .order('created_at', { ascending: false });

        if (rotinasError) {
          console.error('❌ [ROTINAS] Erro ao buscar rotinas:', rotinasError);
          // ✅ INLINE ERROR HANDLING - sem dependências externas
          setInitError('Erro ao carregar rotinas');
          setLoading(false);
          return;
        }

        console.log('✅ [ROTINAS] Rotinas carregadas:', rotinasData?.length || 0);
        setRotinas(rotinasData || []);

      } catch (error) {
        console.error('❌ [ROTINAS] Erro geral ao carregar dados:', error);
        // ✅ INLINE ERROR HANDLING - sem dependências externas
        setInitError('Erro ao carregar dados');
        setLoading(false);
      } finally {
        console.log('🏁 [ROTINAS] Finalizando carregamento');
        setLoading(false);
        isLoadingData.current = false; // ✅ Libera para próxima execução
      }
    };
    
    loadData();
  }, [authReady, alunoId]); // ✅ APENAS DEPENDÊNCIAS ESTÁVEIS - igual às avaliações

  // ✅ REFRESH OTIMIZADO - REUTILIZA A LÓGICA DO USEEFFECT
  const handleRefresh = async () => {
    if (!alunoId) return;
    
    setRefreshing(true);
    console.log('🔄 [ROTINAS] Refresh iniciado');
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setRefreshing(false);
        return;
      }

      // ✅ BUSCAR ALUNO E ROTINAS EM PARALELO
      const [alunoResponse, rotinasResponse] = await Promise.all([
        supabase
          .from('alunos')
          .select('id, nome_completo, email')
          .eq('id', alunoId)
          .eq('personal_trainer_id', user.id)
          .single(),
        supabase
          .from('rotinas')
          .select(`
            id,
            nome,
            descricao,
            treinos_por_semana,
            dificuldade,
            duracao_semanas,
            valor_total,
            data_inicio,
            status,
            permite_execucao_aluno,
            created_at
          `)
          .eq('aluno_id', alunoId)
          .eq('personal_trainer_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (alunoResponse.error || !alunoResponse.data) {
        console.error('❌ [ROTINAS] Erro ao buscar aluno no refresh:', alunoResponse.error);
        setModalData(prev => ({ 
          ...prev, 
          error: { title: 'Erro', message: 'Aluno não encontrado' }
        }));
        openModal('error');
        router.back();
        return;
      }

      if (rotinasResponse.error) {
        console.error('❌ [ROTINAS] Erro ao buscar rotinas no refresh:', rotinasResponse.error);
        setModalData(prev => ({ 
          ...prev, 
          error: { title: 'Erro', message: 'Erro ao carregar rotinas' }
        }));
        openModal('error');
        return;
      }

      setAluno(alunoResponse.data);
      setRotinas(rotinasResponse.data || []);
      console.log('✅ [ROTINAS] Refresh concluído com sucesso');
      
    } catch (error) {
      console.error('❌ [ROTINAS] Erro geral no refresh:', error);
      setModalData(prev => ({ 
        ...prev, 
        error: { title: 'Erro', message: 'Erro ao atualizar dados' }
      }));
      openModal('error');
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ FUNÇÃO OTIMIZADA PARA RECARREGAR APENAS ROTINAS
  const refetchRotinas = async () => {
    if (!alunoId) return;
    
    console.log('🔄 [ROTINAS] Recarregando rotinas...');
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      const { data: rotinasData, error: rotinasError } = await supabase
        .from('rotinas')
        .select(`
          id,
          nome,
          descricao,
          treinos_por_semana,
          dificuldade,
          duracao_semanas,
          valor_total,
          data_inicio,
          status,
          permite_execucao_aluno,
          created_at
        `)
        .eq('aluno_id', alunoId)
        .eq('personal_trainer_id', user.id)
        .order('created_at', { ascending: false });

      if (rotinasError) {
        console.error('❌ [ROTINAS] Erro ao recarregar rotinas:', rotinasError);
        return;
      }

      setRotinas(rotinasData || []);
      console.log('✅ [ROTINAS] Rotinas recarregadas:', rotinasData?.length || 0);
    } catch (error) {
      console.error('❌ [ROTINAS] Erro geral ao recarregar rotinas:', error);
    }
  };

  // ✅ FUNÇÃO HELPER PARA MOSTRAR MODAL DE INFO
  const showInfoModal = (title: string, message: string) => {
    setModalData(prev => ({ 
      ...prev, 
      info: { title, message }
    }));
    openModal('info');
  };

  // ✅ VALIDAR ANTES DE CRIAR NOVA ROTINA - COM MODAL
  const handleNovaRotina = async () => {
    if (!alunoId) return;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      // ✅ VERIFICAR SE JÁ TEM ROTINA ATIVA/PAUSADA/AGUARDANDO PAGAMENTO
      const { data: rotinaAtiva, error: checkError } = await supabase
        .from('rotinas')
        .select('id, nome, status')
        .eq('aluno_id', alunoId)
        .eq('personal_trainer_id', user.id)
        .in('status', ['Aguardando pagamento', 'Ativa', 'Pausada'])
        .limit(1);

      if (checkError) {
        console.error('Erro ao verificar rotinas:', checkError);
        setModalData(prev => ({ 
          ...prev, 
          error: { 
            title: 'Erro', 
            message: 'Não foi possível verificar rotinas existentes' 
          }
        }));
        openModal('error');
        return;
      }

      if (rotinaAtiva && rotinaAtiva.length > 0) {
        // ✅ USAR MODAL AO INVÉS DE ALERT
        const rotina = rotinaAtiva[0];
        setRotinaConflitante(rotina);
        openModal('rotinaAtiva');
        return;
      }

      // ✅ SE NÃO TEM ROTINA ATIVA, PODE CRIAR
      router.push(`/criar-rotina?alunoId=${alunoId}`);
    } catch (error) {
      console.error('Erro ao validar nova rotina:', error);
      setModalData(prev => ({ 
        ...prev, 
        error: { 
          title: 'Erro', 
          message: 'Não foi possível verificar rotinas existentes' 
        }
      }));
      openModal('error');
    }
  };

  // ✅ FECHAR MODAL
  const handleCloseRotinaAtivaModal = () => {
    closeModal('rotinaAtiva');
    setRotinaConflitante(null);
  };

  // ✅ AÇÕES DA ROTINA
  const handlePausarRotina = async (rotina: Rotina) => {
    setModalData(prev => ({ ...prev, rotinaParaPausar: rotina }));
    openModal('pausarRotina');
  };

  const confirmarPausarRotina = async () => {
    if (!modalData.rotinaParaPausar) return;

    try {
      setModalData(prev => ({ ...prev, loading: true }));

      const { error } = await supabase
        .from('rotinas')
        .update({ status: 'Pausada' })
        .eq('id', modalData.rotinaParaPausar.id);

      if (error) throw error;

      closeModal('pausarRotina');
      setModalData(prev => ({ 
        ...prev, 
        loading: false,
        rotinaParaPausar: null
      }));
      
      await refetchRotinas();
    } catch (error) {
      console.error('❌ Erro ao pausar rotina:', error);
      setModalData(prev => ({ 
        ...prev, 
        loading: false,
        error: { 
          title: 'Erro', 
          message: 'Não foi possível pausar a rotina. Tente novamente.' 
        }
      }));
      closeModal('pausarRotina');
      openModal('error');
    }
  };

  const handleReativarRotina = async (rotina: Rotina) => {
    setModalData(prev => ({ ...prev, rotinaParaReativar: rotina }));
    openModal('reativarRotina');
  };

  const confirmarReativarRotina = async () => {
    if (!modalData.rotinaParaReativar) return;

    try {
      setModalData(prev => ({ ...prev, loading: true }));

      const { error } = await supabase
        .from('rotinas')
        .update({ status: 'Ativa' })
        .eq('id', modalData.rotinaParaReativar.id);

      if (error) throw error;

      closeModal('reativarRotina');
      setModalData(prev => ({ 
        ...prev, 
        loading: false,
        rotinaParaReativar: null
      }));
      
      await refetchRotinas();
    } catch (error) {
      console.error('❌ Erro ao reativar rotina:', error);
      setModalData(prev => ({ 
        ...prev, 
        loading: false,
        error: { 
          title: 'Erro', 
          message: 'Não foi possível reativar a rotina. Tente novamente.' 
        }
      }));
      closeModal('reativarRotina');
      openModal('error');
    }
  };

  const handleRotinaPress = (rotina: Rotina) => {
    console.log('Ver rotina:', rotina.id);
    // TODO: Navegar para detalhes quando tela estiver pronta
  };

  // ✅ HANDLER PARA ATIVAR ROTINA - COM MODAL
  const handleAtivarRotina = async (rotina: Rotina) => {
    setModalData(prev => ({ ...prev, rotinaParaAtivar: rotina }));
    openModal('ativarRotina');
  };

  const confirmarAtivarRotina = async (config: { permiteExecucao: boolean; enviarEmail: boolean }) => {
    if (!modalData.rotinaParaAtivar) return;

    try {
      setModalData(prev => ({ ...prev, loading: true }));

      const { error } = await supabase
        .from('rotinas')
        .update({ 
          status: 'Ativa',
          permite_execucao_aluno: config.permiteExecucao
        })
        .eq('id', modalData.rotinaParaAtivar.id);

      if (error) throw error;

      closeModal('ativarRotina');
      setModalData(prev => ({ 
        ...prev, 
        loading: false,
        rotinaParaAtivar: null
      }));
      
      await refetchRotinas();
    } catch (error) {
      console.error('❌ Erro ao ativar rotina:', error);
      setModalData(prev => ({ 
        ...prev, 
        loading: false,
        error: { 
          title: 'Erro', 
          message: 'Não foi possível ativar a rotina. Tente novamente.' 
        }
      }));
      closeModal('ativarRotina');
      openModal('error');
    }
  };

  // ✅ HANDLER PARA EXCLUIR ROTINA - COM MODAL
  const handleExcluirRotina = async (rotina: Rotina) => {
    setModalData(prev => ({ ...prev, rotinaParaExcluir: rotina }));
    openModal('excluirRotina');
  };

  const confirmarExcluirRotina = async () => {
    if (!modalData.rotinaParaExcluir) return;

    try {
      setModalData(prev => ({ ...prev, loading: true }));
      console.log('🗑️ Iniciando exclusão da rotina:', modalData.rotinaParaExcluir.id);
      
      const { error } = await supabase
        .from('rotinas')
        .delete()
        .eq('id', modalData.rotinaParaExcluir.id);

      if (error) {
        console.error('❌ Erro ao excluir rotina:', error);
        throw error;
      }

      console.log('✅ Rotina excluída com sucesso');
      closeModal('excluirRotina');
      setModalData(prev => ({ 
        ...prev, 
        loading: false,
        rotinaParaExcluir: null
      }));
      
      await refetchRotinas();
    } catch (error) {
      console.error('❌ Erro ao excluir rotina:', error);
      setModalData(prev => ({ 
        ...prev, 
        loading: false,
        error: { 
          title: 'Erro', 
          message: 'Não foi possível excluir a rotina. Tente novamente.' 
        }
      }));
      closeModal('excluirRotina');
      openModal('error');
    }
  };

  // ✅ HANDLER PARA MOSTRAR OPÇÕES
  const handleMostrarOpcoes = (rotina: Rotina) => {
    console.log('Abrindo opções para rotina:', rotina.nome);
    setModalData(prev => ({ ...prev, rotinaParaOpcoes: rotina }));
    openModal('rotinaOptions');
  };

  // ✅ HANDLERS PARA OPÇÕES DO MODAL
  const handleIrParaExecucao = () => {
    const rotina = modalData.rotinaParaOpcoes;
    if (!rotina) return;

    console.log('Ir para execução:', rotina.nome);
    closeModal('rotinaOptions');
    setModalData(prev => ({ ...prev, rotinaParaOpcoes: null }));
    
    // ✅ NAVEGAR PARA SELEÇÃO DE TREINO
    router.push(`/execucao/selecionar-treino/${rotina.id}` as never);
  };

  const handleVerEvolucao = () => {
    const rotina = modalData.rotinaParaOpcoes;
    if (!rotina) return;

    console.log('Ver evolução:', rotina.nome);
    closeModal('rotinaOptions');
    setModalData(prev => ({ ...prev, rotinaParaOpcoes: null }));
    
    // TODO: Implementar navegação para tela de evolução
    // router.push(`/evolucao/${rotina.id}`);
    
    // Mostrar modal de desenvolvimento
    showInfoModal('Funcionalidade em Desenvolvimento', 'A tela de evolução de treinos está sendo desenvolvida e estará disponível em breve.');
  };

  // ✅ FILTRAR ROTINAS POR ABA
  const rotinasFiltradas = rotinas.filter(rotina => {
    if (abaAtiva === 'atual') {
      return ['Aguardando pagamento', 'Ativa', 'Pausada'].includes(rotina.status);
    } else {
      return rotina.status === 'Concluída';
    }
  });

  // ✅ HELPER FUNCTIONS
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aguardando pagamento': return '#8B5CF6';
      case 'Ativa': return '#10B981';
      case 'Pausada': return '#F59E0B';
      case 'Concluída': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  const getStatusLabel = (status: string) => {
    return status; // Agora o status já é o texto legível
  };

  // ✅ RENDERIZAR ROTINA
  const renderRotina = ({ item }: { item: Rotina }) => {
    const totalSessoes = item.treinos_por_semana * item.duracao_semanas;
    
    return (
      <TouchableOpacity
        style={styles.rotinaCard}
        onPress={() => handleRotinaPress(item)}
      >
        <View style={styles.rotinaContent}>
          <View style={styles.rotinaMain}>
            {/* Linha 1: Badge do status */}
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
              </View>
            </View>

            {/* Linha 2: Nome da rotina */}
            <Text style={styles.rotinaNome}>{item.nome}</Text>

            {/* Linha 3: Frequência, duração e quantidade de sessões */}
            <Text style={styles.rotinaInfo}>
              {item.treinos_por_semana}x por semana • {item.duracao_semanas} semanas • {totalSessoes} sessões
            </Text>

            {/* Descrição se houver */}
            {item.descricao && (
              <Text style={styles.descricao} numberOfLines={2}>
                {item.descricao}
              </Text>
            )}

            {/* Botões de ação para status específicos */}
            {item.status === 'Aguardando pagamento' && (
              <View style={styles.botoesAcao}>
                <TouchableOpacity
                  style={styles.ativarButton}
                  onPress={() => handleAtivarRotina(item)}
                >
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                  <Text style={styles.ativarButtonText}>Ativar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.excluirButton}
                  onPress={() => handleExcluirRotina(item)}
                >
                  <Ionicons name="trash" size={16} color="white" />
                  <Text style={styles.excluirButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            )}

            {item.status === 'Pausada' && (
              <View style={styles.botoesAcao}>
                <TouchableOpacity
                  style={styles.ativarButton}
                  onPress={() => handleReativarRotina(item)}
                >
                  <Ionicons name="play" size={16} color="white" />
                  <Text style={styles.ativarButtonText}>Ativar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.excluirButton}
                  onPress={() => handleExcluirRotina(item)}
                >
                  <Ionicons name="trash" size={16} color="white" />
                  <Text style={styles.excluirButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            )}

            {item.status === 'Ativa' && (
              <View style={styles.botoesAcao}>
                <TouchableOpacity
                  style={styles.pausarButton}
                  onPress={() => handlePausarRotina(item)}
                >
                  <Ionicons name="pause" size={16} color="white" />
                  <Text style={styles.pausarButtonText}>Pausar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.excluirButton}
                  onPress={() => handleExcluirRotina(item)}
                >
                  <Ionicons name="trash" size={16} color="white" />
                  <Text style={styles.excluirButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Botão de opções sempre alinhado à direita e ao centro verticalmente */}
          {(item.status === 'Ativa' || item.status === 'Pausada' || item.status === 'Concluída') && (
            <View style={styles.rotinaOptions}>
              <TouchableOpacity
                style={styles.optionsButton}
                onPress={() => handleMostrarOpcoes(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ✅ EMPTY STATE
  const renderEmptyState = () => {
    const isAbaAtual = abaAtiva === 'atual';
    
    return (
      <View style={styles.emptyState}>
        <Ionicons name="barbell-outline" size={80} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>
          {isAbaAtual ? 'Nenhuma rotina ativa' : 'Nenhuma rotina concluída'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isAbaAtual 
            ? 'Crie a primeira rotina personalizada para este aluno'
            : 'As rotinas concluídas aparecerão aqui quando finalizadas'
          }
        </Text>
        {isAbaAtual && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleNovaRotina}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Criar Primeira Rotina</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ✅ LOADING - Incluindo inicialização
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {!authReady ? 'Verificando autenticação...' : 'Carregando rotinas...'}
        </Text>
      </View>
    );
  }

  // ✅ ERROR STATE - Incluindo erros de inicialização
  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{initError}</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push('/(tabs)/alunos')}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ ERROR STATE - Aluno não encontrado
  if (!aluno) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Aluno não encontrado</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push('/(tabs)/alunos')}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => router.push('/(tabs)/alunos')}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Rotinas</Text>

        <TouchableOpacity style={styles.addButton} onPress={handleNovaRotina}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Rotina</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ CONTEÚDO */}
      <View style={styles.content}>
        <AlunoHeaderCard 
          alunoData={{
            nomeCompleto: aluno.nome_completo,
            email: aluno.email
          }}
          theme="rotinas"
        />

        {/* MENU DE ABAS PADRÃO */}
        <View style={styles.tabsContainerNovo}>
          <TouchableOpacity
            style={[styles.tabNovo, abaAtiva === 'atual' && styles.activeTabNovo]}
            onPress={() => setAbaAtiva('atual')}
          >
            <Text style={[styles.tabTextNovo, abaAtiva === 'atual' && styles.activeTabTextNovo]}>
              Atual
            </Text>
            {abaAtiva === 'atual' && <View style={styles.tabUnderlineNovo} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabNovo, abaAtiva === 'concluidas' && styles.activeTabNovo]}
            onPress={() => setAbaAtiva('concluidas')}
          >
            <Text style={[styles.tabTextNovo, abaAtiva === 'concluidas' && styles.activeTabTextNovo]}>
              Concluídas
            </Text>
            {abaAtiva === 'concluidas' && <View style={styles.tabUnderlineNovo} />}
          </TouchableOpacity>
        </View>

        {/* Contador apenas para aba de concluídas */}
        {abaAtiva === 'concluidas' && rotinasFiltradas.length > 0 && (
          <Text style={styles.contador}>
            {rotinasFiltradas.length} {rotinasFiltradas.length === 1 ? 'rotina' : 'rotinas'}
          </Text>
        )}

        {rotinasFiltradas.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={rotinasFiltradas}
            renderItem={renderRotina}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* ✅ MODAL DE ROTINA ATIVA */}
      {rotinaConflitante && (
        <RotinaAtivaModal
          visible={modals.rotinaAtiva}
          rotinaNome={rotinaConflitante.nome}
          rotinaStatus={rotinaConflitante.status}
          onCancel={handleCloseRotinaAtivaModal}
        />
      )}

      {/* ✅ MODAL PARA ATIVAR ROTINA */}
      {modalData.rotinaParaAtivar && (
        <AtivarRotinaModal
          visible={modals.ativarRotina}
          rotinaNome={modalData.rotinaParaAtivar.nome}
          onConfirm={confirmarAtivarRotina}
          onCancel={() => {
            closeModal('ativarRotina');
            setModalData(prev => ({ ...prev, rotinaParaAtivar: null }));
          }}
          loading={modalData.loading}
        />
      )}

      {/* ✅ MODAL PARA EXCLUIR ROTINA */}
      {modalData.rotinaParaExcluir && (
        <ConfirmActionModal
          visible={modals.excluirRotina}
          title="Excluir Rotina"
          message="ATENÇÃO: Esta ação irá deletar permanentemente a rotina e todos os dados relacionados. Esta ação não pode ser desfeita."
          itemName={modalData.rotinaParaExcluir.nome}
          actionType="delete"
          confirmText="Excluir"
          onConfirm={confirmarExcluirRotina}
          onCancel={() => {
            closeModal('excluirRotina');
            setModalData(prev => ({ ...prev, rotinaParaExcluir: null }));
          }}
          loading={modalData.loading}
        />
      )}

      {/* ✅ MODAL PARA PAUSAR ROTINA */}
      {modalData.rotinaParaPausar && (
        <ConfirmActionModal
          visible={modals.pausarRotina}
          title="Pausar Rotina"
          message="A rotina será pausada e não ficará disponível para execução até que seja reativada."
          itemName={modalData.rotinaParaPausar.nome}
          actionType="warning"
          confirmText="Pausar"
          onConfirm={confirmarPausarRotina}
          onCancel={() => {
            closeModal('pausarRotina');
            setModalData(prev => ({ ...prev, rotinaParaPausar: null }));
          }}
          loading={modalData.loading}
        />
      )}

      {/* ✅ MODAL PARA ATIVAR ROTINA */}
      {modalData.rotinaParaReativar && (
        <ConfirmActionModal
          visible={modals.reativarRotina}
          title="Ativar Rotina"
          message="A rotina será ativada e ficará disponível para execução novamente."
          itemName={modalData.rotinaParaReativar.nome}
          actionType="success"
          confirmText="Ativar"
          onConfirm={confirmarReativarRotina}
          onCancel={() => {
            closeModal('reativarRotina');
            setModalData(prev => ({ ...prev, rotinaParaReativar: null }));
          }}
          loading={modalData.loading}
        />
      )}

      {/* ✅ MODAL DE OPÇÕES DA ROTINA */}
      {modalData.rotinaParaOpcoes && (
        <RotinaOptionsModal
          visible={modals.rotinaOptions}
          rotina={modalData.rotinaParaOpcoes}
          onClose={() => {
            closeModal('rotinaOptions');
            setModalData(prev => ({ ...prev, rotinaParaOpcoes: null }));
          }}
          onIrParaExecucao={handleIrParaExecucao}
          onVerEvolucao={handleVerEvolucao}
        />
      )}

      {/* ✅ MODAL DE ERRO */}
      <ErrorModal
        visible={modals.error}
        title={modalData.error.title}
        message={modalData.error.message}
        onClose={() => closeModal('error')}
      />

      {/* ✅ MODAL DE INFO */}
      <InfoModal
        visible={modals.info}
        title={modalData.info.title}
        message={modalData.info.message}
        onClose={() => closeModal('info')}
      />
    </View>
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
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Conteúdo
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contador: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },

  // Lista
  listContainer: {
    paddingBottom: 20,
  },

  // Card da rotina
  rotinaCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  rotinaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rotinaMain: {
    flex: 1,
  },
  rotinaOptions: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // Status e badges
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Detalhes da rotina
  rotinaNome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  rotinaInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  descricao: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dificuldadeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dificuldadeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  valorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },

  // Ações
  botoesAcao: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  ativarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  ativarButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  excluirButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  excluirButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  pausarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  pausarButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  optionsButton: {
    padding: 4,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Abas
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },

  // NOVOS ESTILOS PARA ABAS PADRONIZADAS
  tabsContainerNovo: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
    marginTop: 0,
  },
  tabNovo: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  activeTabNovo: {},
  tabTextNovo: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabTextNovo: {
    color: '#2563EB',
    fontWeight: '700',
  },
  tabUnderlineNovo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 2,
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
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
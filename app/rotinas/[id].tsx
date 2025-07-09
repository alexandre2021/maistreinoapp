// app/rotinas/[id].tsx - VERSÃO FINAL COM useEffect CORRIGIDO
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { InfoModal } from '../../components/InfoModal';
import { AtivarRotinaModal } from '../../components/rotina/AtivarRotinaModal';
import { ConfirmActionModal } from '../../components/rotina/ConfirmActionModal';
import { RotinaOptionsModal } from '../../components/rotina/RotinaOptionsModal';
import { useAuth } from '../../hooks/useAuth';
import { useModalManager } from '../../hooks/useModalManager';
import { supabase } from '../../lib/supabase';

// ✅ TYPES ATUALIZADOS
interface Rotina {
  id: string;
  nome: string;
  objetivo?: string;
  descricao?: string;
  treinos_por_semana: number;
  dificuldade: string;
  duracao_semanas: number;
  valor_total: number;
  data_inicio: string;
  status: string; // 'Aguardando pagamento' | 'Ativa' | 'Pausada' | 'Concluída'
  created_at: string;
  permite_execucao_aluno: boolean;
}

export default function RotinasAlunoScreen() {
  // ✅ AUTENTICAÇÃO - PROTEGE A PÁGINA
  useAuth();
  
  const router = useRouter();
  const { id: alunoId } = useLocalSearchParams<{ id: string }>();

  // ✅ ESTADOS
  const [authReady, setAuthReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Added
  const [rotinas, setRotinas] = useState<Rotina[]>([]); // Added
  // 👇 NOVO ESTADO PARA ABA ATIVA
  const [abaAtiva, setAbaAtiva] = useState<'atual' | 'concluidas'>('atual');

  // ✅ CONTROLE DE EXECUÇÃO PARA EVITAR LOOPS
  const isLoadingData = useRef(false);
  
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
        
        // ✅ BUSCAR ROTINAS
        console.log('📋 [ROTINAS] Buscando rotinas...');
        const { data: rotinasData, error: rotinasError } = await supabase
          .from('rotinas')
          .select(`
            id,
            nome,
            objetivo,
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

  // ✅ FUNÇÕES DE CONFIRMAÇÃO PARA MODAIS
  const confirmarPausarRotina = async () => {
    if (!modalData.rotinaParaPausar) return;
    setModalData(prev => ({ ...prev, loading: true }));
    try {
      await supabase
        .from('rotinas')
        .update({ status: 'Pausada' })
        .eq('id', modalData.rotinaParaPausar.id);
      setModalData(prev => ({ ...prev, rotinaParaPausar: null, loading: false }));
      closeModal('pausarRotina');
      // Recarregar rotinas
      await fetchRotinas();
    } catch {
      setModalData(prev => ({ ...prev, loading: false }));
      setInitError('Erro ao pausar rotina');
    }
  };

  const confirmarReativarRotina = async () => {
    if (!modalData.rotinaParaReativar) return;
    setModalData(prev => ({ ...prev, loading: true }));
    try {
      await supabase
        .from('rotinas')
        .update({ status: 'Ativa' })
        .eq('id', modalData.rotinaParaReativar.id);
      setModalData(prev => ({ ...prev, rotinaParaReativar: null, loading: false }));
      closeModal('reativarRotina');
      await fetchRotinas();
    } catch {
      setModalData(prev => ({ ...prev, loading: false }));
      setInitError('Erro ao reativar rotina');
    }
  };

  const confirmarAtivarRotina = async () => {
    if (!modalData.rotinaParaAtivar) return;
    setModalData(prev => ({ ...prev, loading: true }));
    try {
      await supabase
        .from('rotinas')
        .update({ status: 'Ativa' })
        .eq('id', modalData.rotinaParaAtivar.id);
      setModalData(prev => ({ ...prev, rotinaParaAtivar: null, loading: false }));
      closeModal('ativarRotina');
      await fetchRotinas();
    } catch {
      setModalData(prev => ({ ...prev, loading: false }));
      setInitError('Erro ao ativar rotina');
    }
  };

  const confirmarExcluirRotina = async () => {
    if (!modalData.rotinaParaExcluir) return;
    setModalData(prev => ({ ...prev, loading: true }));
    try {
      await supabase
        .from('rotinas')
        .delete()
        .eq('id', modalData.rotinaParaExcluir.id);
      setModalData(prev => ({ ...prev, rotinaParaExcluir: null, loading: false }));
      closeModal('excluirRotina');
      await fetchRotinas();
    } catch {
      setModalData(prev => ({ ...prev, loading: false }));
      setInitError('Erro ao excluir rotina');
    }
  };

  // ✅ FUNÇÃO PARA RECARREGAR ROTINAS (usada pelas funções acima)
  const fetchRotinas = async () => {
    if (!alunoId) return;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;
      const { data: rotinasData, error: rotinasError } = await supabase
        .from('rotinas')
        .select(`
          id,
          nome,
          objetivo,
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
      if (!rotinasError) setRotinas(rotinasData || []);
    } catch {
      // erro ignorado
    }
  };

  // ✅ HANDLER PARA MOSTRAR OPÇÕES
  const handleMostrarOpcoes = (rotina: Rotina) => {
    console.log('Abrindo opções para rotina:', rotina.nome);
    setModalData(prev => ({ ...prev, rotinaParaOpcoes: rotina }));
    openModal('rotinaOptions');
  };

  // Handler para adicionar rotina com verificação de bloqueio (refatorado)
  const handleAdicionarRotina = async () => {
    if (!alunoId) return;
    setLoading(true);
    try {
      // 1. Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Sessão expirada');

      // 2. Buscar rotinas bloqueadoras (DEBUG: adicionando logs)
      console.log('🔍 Buscando rotinas bloqueadoras para aluno:', alunoId);
      const { data: rotinasBloqueadoras, error: rotinasError } = await supabase
        .from('rotinas')
        .select('id, nome, status')
        .eq('aluno_id', alunoId)
        .eq('personal_trainer_id', user.id)
        .in('status', ['Aguardando pagamento', 'Ativa', 'Pausada']);

      console.log('📊 Resultado da consulta:', {
        dados: rotinasBloqueadoras,
        erro: rotinasError
      });

      if (rotinasError) throw new Error('Erro ao consultar rotinas');

      // 3. Verificar se existem rotinas bloqueadoras
      if (rotinasBloqueadoras && rotinasBloqueadoras.length > 0) {
        const rotinaBloqueadora = rotinasBloqueadoras[0];
        console.log('🚫 Rotina bloqueadora encontrada:', rotinaBloqueadora);
        let mensagem = '';
        switch (rotinaBloqueadora.status) {
          case 'Aguardando pagamento':
            mensagem = `Você já tem a rotina "${rotinaBloqueadora.nome}" aguardando pagamento.`;
            break;
          case 'Ativa':
            mensagem = `Você já tem a rotina "${rotinaBloqueadora.nome}" ativa.`;
            break;
          case 'Pausada':
            mensagem = `Você já tem a rotina "${rotinaBloqueadora.nome}" pausada.`;
            break;
          default:
            mensagem = 'Você já tem uma rotina em andamento.';
        }
        mensagem += '\n\nFinalize ou exclua a rotina atual antes de criar uma nova.';
        setModalData({
          ...modalData,
          info: { title: 'Rotina já existente', message: mensagem }
        });
        openModal('info');
        return;
      }

      // 4. Se não houver rotinas bloqueadoras, navegar para criação
      console.log('✅ Nenhuma rotina bloqueadora, redirecionando...');
      router.push(`/criar-rotina?alunoId=${alunoId}`);
    } catch (error: any) {
      console.error('❌ Erro ao verificar rotinas:', error);
      setModalData({
        ...modalData,
        info: {
          title: 'Erro',
          message: error.message || 'Erro ao verificar rotinas existentes'
        }
      });
      openModal('info');
    } finally {
      setLoading(false);
    }
  };

  // FUNÇÕES AUXILIARES
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aguardando pagamento': return '#F59E0B';
      case 'Ativa': return '#10B981';
      case 'Pausada': return '#6B7280';
      case 'Concluída': return '#3B82F6';
      default: return '#9CA3AF';
    }
  };

  const getStatusLabel = (status: string) => status;

  // 2. Novo card de rotina
  const renderRotina = ({ item }: { item: Rotina }) => {
    const totalSessoes = item.treinos_por_semana * item.duracao_semanas;
    const statusColor = getStatusColor(item.status);
    return (
      <View key={item.id} style={styles.card}>
        {/* Linha 1: Status */}
        <View style={[styles.badge, { backgroundColor: statusColor }]}> 
          <Text style={styles.badgeText}>{getStatusLabel(item.status)}</Text>
        </View>
        {/* Linha 2: Nome da Rotina */}
        <Text style={styles.nomeRotina}>{item.nome}</Text>
        {/* Linha 3: Objetivo da Rotina (destaque) */}
        {item.objetivo && (
          <Text style={styles.objetivoDestaque} numberOfLines={2}>{item.objetivo}</Text>
        )}
        {/* Linha 4: Descrição (se existir) */}
        {item.descricao && (
          <Text style={styles.objetivo} numberOfLines={2}>{item.descricao}</Text>
        )}
        {/* Linha 5: Metadados */}
        <Text style={styles.metadados}>
          {item.treinos_por_semana}x/sem • {item.duracao_semanas} semanas • {totalSessoes} sessões
        </Text>
        {/* Botão de Opções (3 pontinhos) - Alinhado verticalmente ao centro */}
        <TouchableOpacity 
          style={styles.optionsButtonCentered} 
          onPress={() => handleMostrarOpcoes(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton} 
          onPress={router.back}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Rotinas</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAdicionarRotina}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Rotina</Text>
        </TouchableOpacity>
      </View>

      {/* Abas para filtrar rotinas */}
      <View style={styles.tabsContainerNovo}>
        <TouchableOpacity
          style={[styles.tabNovo, abaAtiva === 'atual' && styles.activeTabNovo]}
          onPress={() => setAbaAtiva('atual')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabTextNovo, abaAtiva === 'atual' && styles.activeTabTextNovo]}>Atual</Text>
          {abaAtiva === 'atual' && <View style={styles.tabUnderlineNovo} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabNovo, abaAtiva === 'concluidas' && styles.activeTabNovo]}
          onPress={() => setAbaAtiva('concluidas')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabTextNovo, abaAtiva === 'concluidas' && styles.activeTabTextNovo]}>Concluídas</Text>
          {abaAtiva === 'concluidas' && <View style={styles.tabUnderlineNovo} />}
        </TouchableOpacity>
      </View>

      {/* Conteúdo Principal */}
      <View style={styles.content}>
        {/* Contador de Rotinas (apenas na aba Atual e com base no filtro) */}
        {abaAtiva === 'atual' && (() => {
          const rotinasAtuais = rotinas.filter(r => r.status !== 'Concluída');
          if (rotinasAtuais.length > 0) {
            return (
              <Text style={styles.contador}>
                {rotinasAtuais.length} {rotinasAtuais.length === 1 ? 'rotina' : 'rotinas'} encontradas
              </Text>
            );
          }
          return null;
        })()}

        {/* Lista de Rotinas - FlatList otimizada para desempenho */}
        <View style={styles.listContainer}>
          {/* Filtragem das rotinas conforme aba ativa */}
          {(() => {
            const rotinasFiltradas =
              abaAtiva === 'atual'
                ? rotinas.filter(r => r.status !== 'Concluída')
                : rotinas.filter(r => r.status === 'Concluída');
            if (rotinasFiltradas.length === 0) {
              return (
                <View style={styles.emptyState}>
                  <Ionicons name="list" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>Nenhuma rotina {abaAtiva === 'atual' ? 'atual' : 'concluída'} encontrada</Text>
                  {abaAtiva === 'atual' && (
                    <>
                      <Text style={styles.emptySubtitle}>
                        Parece que você ainda não tem rotinas. Toque no botão acima para criar uma nova rotina.
                      </Text>
                      <TouchableOpacity 
                        style={styles.primaryButton} 
                        onPress={() => router.push(`/criar-rotina?alunoId=${alunoId}` as never)}
                      >
                        <Ionicons name="add" size={20} color="white" />
                        <Text style={styles.primaryButtonText}>Rotina</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              );
            }
            return rotinasFiltradas.map(item => renderRotina({ item }));
          })()}
        </View>

        {/* Loading e Error States - agora dentro do retorno principal */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando rotinas...</Text>
          </View>
        )}
        {initError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{initError}</Text>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setInitError(null)}
            >
              <Text style={styles.backButtonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modais - agora dentro do retorno principal */}
      {modals.pausarRotina && modalData.rotinaParaPausar && (
        <ConfirmActionModal
          visible={modals.pausarRotina}
          title="Pausar Rotina"
          message="Tem certeza que deseja pausar esta rotina?"
          confirmText="Pausar"
          cancelText="Cancelar"
          loading={modalData.loading}
          onConfirm={confirmarPausarRotina}
          onCancel={() => closeModal('pausarRotina')}
          actionType="warning"
        />
      )}
      {modals.reativarRotina && modalData.rotinaParaReativar && (
        <ConfirmActionModal
          visible={modals.reativarRotina}
          title="Reativar Rotina"
          message="Tem certeza que deseja reativar esta rotina?"
          confirmText="Reativar"
          cancelText="Cancelar"
          loading={modalData.loading}
          onConfirm={confirmarReativarRotina}
          onCancel={() => closeModal('reativarRotina')}
          actionType="success"
        />
      )}
      {modals.ativarRotina && modalData.rotinaParaAtivar && (
        <AtivarRotinaModal
          visible={modals.ativarRotina}
          rotinaNome={modalData.rotinaParaAtivar.nome}
          loading={modalData.loading}
          onConfirm={confirmarAtivarRotina}
          onCancel={() => closeModal('ativarRotina')}
        />
      )}
      {modals.excluirRotina && modalData.rotinaParaExcluir && (
        <ConfirmActionModal
          visible={modals.excluirRotina}
          title="Excluir Rotina"
          message="Tem certeza que deseja excluir esta rotina? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          cancelText="Cancelar"
          loading={modalData.loading}
          onConfirm={confirmarExcluirRotina}
          onCancel={() => closeModal('excluirRotina')}
          actionType="delete"
        />
      )}
      {modals.rotinaOptions && modalData.rotinaParaOpcoes && (
        <RotinaOptionsModal
          visible={modals.rotinaOptions}
          rotina={modalData.rotinaParaOpcoes}
          onClose={() => {
            closeModal('rotinaOptions');
            setModalData(prev => ({ ...prev, rotinaParaOpcoes: null }));
          }}
          onTreinar={() => {
            closeModal('rotinaOptions');
            router.push({
              pathname: '/executar-rotina/selecionar-treino/[rotinaId]',
              params: { rotinaId: modalData.rotinaParaOpcoes!.id }
            });
          }}
          onAtivar={() => {
            closeModal('rotinaOptions');
            setModalData(prev => ({ ...prev, rotinaParaAtivar: modalData.rotinaParaOpcoes, rotinaParaOpcoes: null }));
            openModal('ativarRotina');
          }}
          onPausar={() => {
            closeModal('rotinaOptions');
            setModalData(prev => ({ ...prev, rotinaParaPausar: modalData.rotinaParaOpcoes, rotinaParaOpcoes: null }));
            openModal('pausarRotina');
          }}
          onExcluir={() => {
            closeModal('rotinaOptions');
            setModalData(prev => ({ ...prev, rotinaParaExcluir: modalData.rotinaParaOpcoes, rotinaParaOpcoes: null }));
            openModal('excluirRotina');
          }}
        />
      )}
      {modals.info && (
        <InfoModal
          visible={modals.info}
          title={modalData.info.title}
          message={modalData.info.message}
          onClose={() => closeModal('info')}
        />
      )}
    </View>
  );
}

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
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
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
  optionsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  optionsButtonCentered: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }], // metade do tamanho do ícone
    padding: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
    color: '#111827',
    marginBottom: 4,
  },
  nomeRotina: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  rotinaInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  objetivo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  objetivoDestaque: {
    fontSize: 17,
    color: '#374151',
    marginBottom: 6,
    marginTop: 2,
  },
  metadados: {
    fontSize: 14,
    color: '#6B7280',
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
  opcaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  opcaoIcone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  opcaoLabel: {
    fontSize: 16,
    fontWeight: '600',
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
}); // End of StyleSheet.create
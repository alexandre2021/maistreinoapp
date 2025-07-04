// app/rotinas/[id].tsx - VERSÃO FINAL COM useEffect CORRIGIDO
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { RotinaAtivaModal } from '../../components/rotina/RotinaAtivaModal';
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
  status: 'pendente' | 'ativa' | 'pausada' | 'concluida';
  created_at: string;
  permite_execucao_aluno: boolean;
}

export default function RotinasAlunoScreen() {
  const router = useRouter();
  const { id: alunoId } = useLocalSearchParams<{ id: string }>();

  // ✅ ESTADOS
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [rotinas, setRotinas] = useState<Rotina[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // ✅ ESTADO PARA ROTINA CONFLITANTE
  const [rotinaConflitante, setRotinaConflitante] = useState<{
    id: string;
    nome: string;
    status: string;
  } | null>(null);

  // ✅ MODAL MANAGER
  const { modals, openModal, closeModal } = useModalManager({
    rotinaAtiva: false
  });

  // ✅ CARREGAR DADOS - VERSÃO CORRIGIDA SEM WARNINGS
  useEffect(() => {
    // ✅ BUSCAR ALUNO - MOVIDA PARA DENTRO DO useEffect
    const fetchAluno = async () => {
      if (!alunoId) return;

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return;

        const { data: alunoData, error: alunoError } = await supabase
          .from('alunos')
          .select('id, nome_completo, email')
          .eq('id', alunoId)
          .eq('personal_trainer_id', user.id)
          .single();

        if (alunoError || !alunoData) {
          Alert.alert('Erro', 'Aluno não encontrado');
          router.back();
          return;
        }

        setAluno(alunoData);
      } catch (error) {
        console.error('Erro ao buscar aluno:', error);
      }
    };

    // ✅ BUSCAR ROTINAS - MOVIDA PARA DENTRO DO useEffect  
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
          console.error('Erro ao buscar rotinas:', rotinasError);
          return;
        }

        setRotinas(rotinasData || []);
      } catch (error) {
        console.error('Erro ao buscar rotinas:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadData = async () => {
      await Promise.all([fetchAluno(), fetchRotinas()]);
    };
    
    loadData();
  }, [alunoId, router]); // ✅ Apenas dependências estáveis

  // ✅ REFRESH - MANTÉM FUNÇÕES SEPARADAS PARA REUSO
  const handleRefresh = async () => {
    setRefreshing(true);
    
    // ✅ BUSCAR ALUNO - PARA REFRESH
    const fetchAluno = async () => {
      if (!alunoId) return;

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return;

        const { data: alunoData, error: alunoError } = await supabase
          .from('alunos')
          .select('id, nome_completo, email')
          .eq('id', alunoId)
          .eq('personal_trainer_id', user.id)
          .single();

        if (alunoError || !alunoData) {
          Alert.alert('Erro', 'Aluno não encontrado');
          router.back();
          return;
        }

        setAluno(alunoData);
      } catch (error) {
        console.error('Erro ao buscar aluno:', error);
      }
    };

    // ✅ BUSCAR ROTINAS - PARA REFRESH
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
          console.error('Erro ao buscar rotinas:', rotinasError);
          return;
        }

        setRotinas(rotinasData || []);
      } catch (error) {
        console.error('Erro ao buscar rotinas:', error);
      }
    };

    await Promise.all([fetchAluno(), fetchRotinas()]);
    setRefreshing(false);
  };

  // ✅ FUNÇÃO HELPER PARA ATUALIZAR APENAS ROTINAS
  const refetchRotinas = async () => {
    if (!alunoId) return;

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
        console.error('Erro ao buscar rotinas:', rotinasError);
        return;
      }

      setRotinas(rotinasData || []);
    } catch (error) {
      console.error('Erro ao buscar rotinas:', error);
    }
  };

  // ✅ VALIDAR ANTES DE CRIAR NOVA ROTINA - COM MODAL
  const handleNovaRotina = async () => {
    if (!alunoId) return;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      // ✅ VERIFICAR SE JÁ TEM ROTINA ATIVA/PAUSADA/PENDENTE
      const { data: rotinaAtiva, error: checkError } = await supabase
        .from('rotinas')
        .select('id, nome, status')
        .eq('aluno_id', alunoId)
        .eq('personal_trainer_id', user.id)
        .in('status', ['pendente', 'ativa', 'pausada'])
        .limit(1);

      if (checkError) {
        console.error('Erro ao verificar rotinas:', checkError);
        Alert.alert('Erro', 'Não foi possível verificar rotinas existentes');
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
      Alert.alert('Erro', 'Não foi possível verificar rotinas existentes');
    }
  };

  // ✅ AÇÃO PARA VER ROTINA ATIVA
  const handleViewRotinaAtiva = () => {
    closeModal('rotinaAtiva');
    if (rotinaConflitante) {
      // TODO: Navegar para detalhes da rotina quando tela estiver pronta
      console.log('Navegar para rotina:', rotinaConflitante.id);
      // router.push(`/rotina-detalhes/${rotinaConflitante.id}`);
    }
  };

  // ✅ FECHAR MODAL
  const handleCloseRotinaAtivaModal = () => {
    closeModal('rotinaAtiva');
    setRotinaConflitante(null);
  };

  // ✅ AÇÕES DA ROTINA
  const handlePausarRotina = async (rotina: Rotina) => {
    Alert.alert(
      'Pausar Rotina',
      `Tem certeza que deseja pausar a rotina "${rotina.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pausar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('rotinas')
                .update({ status: 'pausada' })
                .eq('id', rotina.id);

              if (error) throw error;

              Alert.alert('Sucesso', 'Rotina pausada com sucesso');
              await refetchRotinas(); // ✅ Usar função helper
            } catch (error) {
              console.error('Erro ao pausar rotina:', error);
              Alert.alert('Erro', 'Não foi possível pausar a rotina');
            }
          }
        }
      ]
    );
  };

  const handleReativarRotina = async (rotina: Rotina) => {
    Alert.alert(
      'Reativar Rotina',
      `Tem certeza que deseja reativar a rotina "${rotina.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reativar',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('rotinas')
                .update({ status: 'ativa' })
                .eq('id', rotina.id);

              if (error) throw error;

              Alert.alert('Sucesso', 'Rotina reativada com sucesso');
              await refetchRotinas(); // ✅ Usar função helper
            } catch (error) {
              console.error('Erro ao reativar rotina:', error);
              Alert.alert('Erro', 'Não foi possível reativar a rotina');
            }
          }
        }
      ]
    );
  };

  const handleCancelarRotina = async (rotina: Rotina) => {
    Alert.alert(
      'Cancelar Rotina',
      `ATENÇÃO: Esta ação irá deletar permanentemente a rotina "${rotina.nome}" e todos os dados relacionados. Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              // ✅ DELETE CASCADE VAI DELETAR TUDO AUTOMATICAMENTE
              const { error } = await supabase
                .from('rotinas')
                .delete()
                .eq('id', rotina.id);

              if (error) throw error;

              Alert.alert('Sucesso', 'Rotina cancelada e removida com sucesso');
              await refetchRotinas(); // ✅ Usar função helper
            } catch (error) {
              console.error('Erro ao cancelar rotina:', error);
              Alert.alert('Erro', 'Não foi possível cancelar a rotina');
            }
          }
        }
      ]
    );
  };

  const handleConcluirRotina = async (rotina: Rotina) => {
    Alert.alert(
      'Concluir Rotina',
      `Marcar a rotina "${rotina.nome}" como concluída?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Concluir',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('rotinas')
                .update({ status: 'concluida' })
                .eq('id', rotina.id);

              if (error) throw error;

              Alert.alert('Sucesso', 'Rotina marcada como concluída');
              await refetchRotinas(); // ✅ Usar função helper
            } catch (error) {
              console.error('Erro ao concluir rotina:', error);
              Alert.alert('Erro', 'Não foi possível concluir a rotina');
            }
          }
        }
      ]
    );
  };

  const handleRotinaPress = (rotina: Rotina) => {
    console.log('Ver rotina:', rotina.id);
    // TODO: Navegar para detalhes quando tela estiver pronta
  };

  // ✅ HELPER FUNCTIONS
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return '#F59E0B';
      case 'ativa': return '#10B981';
      case 'pausada': return '#6B7280';
      case 'concluida': return '#3B82F6';
      default: return '#9CA3AF';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'ativa': return 'Ativa';
      case 'pausada': return 'Pausada';
      case 'concluida': return 'Concluída';
      default: return status;
    }
  };

  const getDificuldadeColor = (dificuldade: string) => {
    switch (dificuldade) {
      case 'Baixa': return '#10B981';
      case 'Média': return '#F59E0B';
      case 'Alta': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // ✅ RENDERIZAR BOTÕES DE AÇÃO
  const renderAcoesRotina = (rotina: Rotina) => {
    return (
      <View style={styles.acoesContainer}>
        {rotina.status === 'ativa' && (
          <>
            <TouchableOpacity
              style={[styles.acaoButton, styles.pausarButton]}
              onPress={() => handlePausarRotina(rotina)}
            >
              <Ionicons name="pause" size={16} color="white" />
              <Text style={styles.acaoButtonText}>Pausar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acaoButton, styles.concluirButton]}
              onPress={() => handleConcluirRotina(rotina)}
            >
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={styles.acaoButtonText}>Concluir</Text>
            </TouchableOpacity>
          </>
        )}

        {rotina.status === 'pausada' && (
          <TouchableOpacity
            style={[styles.acaoButton, styles.reativarButton]}
            onPress={() => handleReativarRotina(rotina)}
          >
            <Ionicons name="play" size={16} color="white" />
            <Text style={styles.acaoButtonText}>Reativar</Text>
          </TouchableOpacity>
        )}

        {(rotina.status === 'pendente' || rotina.status === 'ativa' || rotina.status === 'pausada') && (
          <TouchableOpacity
            style={[styles.acaoButton, styles.cancelarButton]}
            onPress={() => handleCancelarRotina(rotina)}
          >
            <Ionicons name="trash" size={16} color="white" />
            <Text style={styles.acaoButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ✅ RENDERIZAR ROTINA
  const renderRotina = ({ item }: { item: Rotina }) => (
    <TouchableOpacity
      style={styles.rotinaCard}
      onPress={() => handleRotinaPress(item)}
    >
      <View style={styles.rotinaHeader}>
        <Text style={styles.rotinaNome}>{item.nome}</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.rotinaDetalhes}>
        <Text style={styles.rotinaInfo}>
          {item.treinos_por_semana}x por semana • {item.duracao_semanas} semanas
        </Text>
        
        <View style={styles.metadataRow}>
          <View style={[styles.dificuldadeBadge, { backgroundColor: getDificuldadeColor(item.dificuldade) }]}>
            <Text style={styles.dificuldadeText}>{item.dificuldade}</Text>
          </View>
          <Text style={styles.valorText}>R$ {item.valor_total.toFixed(2)}</Text>
        </View>

        <Text style={styles.dataInicio}>
          Início: {item.data_inicio ? new Date(item.data_inicio).toLocaleDateString('pt-BR') : 'Não definido'}
        </Text>

        {renderAcoesRotina(item)}
      </View>
    </TouchableOpacity>
  );

  // ✅ EMPTY STATE
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="barbell-outline" size={80} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Nenhuma rotina criada</Text>
      <Text style={styles.emptySubtitle}>
        Crie a primeira rotina personalizada para este aluno
      </Text>
      <TouchableOpacity style={styles.primaryButton} onPress={handleNovaRotina}>
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.primaryButtonText}>Criar Primeira Rotina</Text>
      </TouchableOpacity>
    </View>
  );

  // ✅ LOADING
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando rotinas...</Text>
      </View>
    );
  }

  // ✅ ERROR STATE
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
          <Text style={styles.addButtonText}>Nova</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ INFO DO ALUNO */}
      <View style={styles.alunoInfo}>
        <Text style={styles.alunoNome}>{aluno.nome_completo}</Text>
        <Text style={styles.alunoEmail}>{aluno.email}</Text>
      </View>

      {/* ✅ CONTEÚDO */}
      <View style={styles.content}>
        {rotinas.length > 0 && (
          <Text style={styles.contador}>
            {rotinas.length} {rotinas.length === 1 ? 'rotina' : 'rotinas'}
          </Text>
        )}

        {rotinas.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={rotinas}
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
          onViewRotina={handleViewRotinaAtiva}
          onCancel={handleCloseRotinaAtivaModal}
        />
      )}
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

  // Info do aluno
  alunoInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  alunoNome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alunoEmail: {
    fontSize: 14,
    color: '#6B7280',
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
  rotinaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rotinaNome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Detalhes da rotina
  rotinaDetalhes: {
    gap: 8,
  },
  rotinaInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  dataInicio: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Ações da rotina
  acoesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  acaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  acaoButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  pausarButton: {
    backgroundColor: '#F59E0B',
  },
  reativarButton: {
    backgroundColor: '#10B981',
  },
  concluirButton: {
    backgroundColor: '#3B82F6',
  },
  cancelarButton: {
    backgroundColor: '#EF4444',
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
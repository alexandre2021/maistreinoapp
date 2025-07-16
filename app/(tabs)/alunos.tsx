// app/(tabs)/alunos.tsx - VERSÃO ATUALIZADA COM HEADER CUSTOMIZADO
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import LoadingScreen from '../../components/LoadingScreen';
// Hooks customizados
import { useAlunoOperations } from '../../hooks/useAlunoOperations';
import { useAuth } from '../../hooks/useAuth';
// ✅ Hook genérico atualizado
import { useModalManager } from '../../hooks/useModalManager';

// Componentes das modals
import { AlunoOptionsModal } from '../../components/AlunoOptionsModal';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { StatusInfoModal } from '../../components/StatusInfoModal';
import { UpgradeModal } from '../../components/UpgradeModal';

// ✅ Componente de filtros reutilizável
import { FiltersSection } from '../../components/FiltersSection';
import { PlanosModal } from '../../components/PlanosModal';

// Tipos
import { Aluno } from '../../types/Aluno';

// Supabase
import { supabase } from '../../lib/supabase';

// ✅ Cache global para melhorar performance
import { alunosCache } from '../../lib/cache';

export default function AlunosScreen() {
  useAuth();
  
  // Estados principais
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // ✅ ESTADO SIMPLIFICADO DO PLANO (só o que precisa para alunos)
  const [planData, setPlanData] = useState({
    plano: 'gratuito',
    limite_alunos: 3
  });

  // ✅ Estados para filtros (usando mesma estrutura do exercícios)
  const [activeFilters, setActiveFilters] = useState({
    situacao: 'Todos',
    genero: 'Todos'
  });

  const [dropdownStates, setDropdownStates] = useState({
    situacao: false,
    genero: false
  });

  // ✅ Opções dos filtros para alunos (removido objetivo)
  const filterOptions = {
    situacao: ['Todos', 'Ativo', 'Pendente'],
    genero: ['Todos', 'Masculino', 'Feminino', 'Não informado']
  };

  const filterLabels = {
    situacao: 'Situação',
    genero: 'Gênero'
  };
  
  const {
    selectedItem: selectedAluno,
    modals,
    openModal,
    closeModal
  } = useModalManager<Aluno>({
    statusInfo: false,
    upgrade: false,
    planos: false,
    alunoOptions: false,
    confirmDelete: false
  });
  
  const {
    loading: alunoOpsLoading,
    navigateToDetails,
    navigateToParQ,
    navigateToAvaliacoes,
    navigateToRotinas,
    deleteAluno
  } = useAlunoOperations();

  // ✅ FUNÇÕES DOS FILTROS OTIMIZADAS COM useCallback
  const toggleDropdown = useCallback((filterType: string) => {
    setDropdownStates(prev => ({
      ...prev,
      [filterType]: !prev[filterType as keyof typeof prev]
    }));
  }, []);

  const updateFilter = useCallback((filterType: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({
      situacao: 'Todos',
      genero: 'Todos'
    });
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    return Object.values(activeFilters).filter(value => value !== 'Todos').length;
  }, [activeFilters]);

  // ✅ FILTRAR ALUNOS OTIMIZADO COM useMemo
  const filteredAlunos = useMemo(() => {
    return alunos.filter(aluno => {
      // Filtro por busca
      const matchesSearch = aluno.nome_completo.toLowerCase().includes(searchText.toLowerCase()) ||
                           aluno.email.toLowerCase().includes(searchText.toLowerCase());

      // Filtros por categoria
      const matchesSituacao = activeFilters.situacao === 'Todos' || 
                             (activeFilters.situacao === 'Ativo' && aluno.onboarding_completo) ||
                             (activeFilters.situacao === 'Pendente' && !aluno.onboarding_completo);
      
      const matchesGenero = activeFilters.genero === 'Todos' || 
                           aluno.genero === activeFilters.genero ||
                           (activeFilters.genero === 'Não informado' && !aluno.genero);

      return matchesSearch && matchesSituacao && matchesGenero;
    });
  }, [alunos, searchText, activeFilters]);

  // ✅ FUNÇÕES SIMPLIFICADAS DE VERIFICAÇÃO
  const canAddMoreStudents = () => {
    if (planData.limite_alunos === -1) return true; // Ilimitado
    return alunos.length < planData.limite_alunos;
  };

  const getStudentLimitText = () => {
    return planData.limite_alunos === -1 ? 'ilimitado' : planData.limite_alunos.toString();
  };

  // ✅ REFRESH OTIMIZADO - FORCE RELOAD
  const fetchAlunos = async (forceRefresh = false) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ [AlunosScreen] Erro de autenticação:', authError);
        return;
      }

      // ✅ Se não for force refresh, tentar usar cache
      if (!forceRefresh) {
        const cachedData = alunosCache.get(user.id);
        if (cachedData) {
          console.log('🚀 [AlunosScreen] Usando cache no refresh...');
          setAlunos(cachedData.alunos);
          setPlanData(cachedData.planData);
          return;
        }
      }
      
      console.log('🔄 [AlunosScreen] Atualizando dados...');
      
      // ✅ Buscar dados em paralelo
      const [userProfileResult, ptDataResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, user_type')
          .eq('id', user.id)
          .eq('user_type', 'personal_trainer')
          .single(),
        supabase
          .from('personal_trainers')
          .select('id, nome_completo, plano, limite_alunos')
          .eq('id', user.id)
          .single()
      ]);

      if (userProfileResult.error || !userProfileResult.data) {
        console.error('❌ [AlunosScreen] User profile não é personal_trainer:', userProfileResult.error);
        return;
      }

      if (ptDataResult.error || !ptDataResult.data) {
        console.error('❌ [AlunosScreen] Personal trainer não encontrado:', ptDataResult.error);
        return;
      }

      // ✅ Atualizar dados do plano
      const newPlanData = {
        plano: ptDataResult.data.plano || 'gratuito',
        limite_alunos: ptDataResult.data.limite_alunos || 3
      };
      setPlanData(newPlanData);

      const { data: alunosData, error } = await supabase
        .from('alunos')
        .select(`
          id,
          nome_completo,
          email,
          telefone,
          data_nascimento,
          genero,
          avatar_letter,
          avatar_color,
          avatar_type,
          avatar_image_url,
          created_at,
          onboarding_completo
        `)
        .eq('personal_trainer_id', ptDataResult.data.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [AlunosScreen] Erro ao buscar alunos:', error);
        return;
      }

      const finalAlunos = alunosData || [];
      console.log('✅ [AlunosScreen] Dados atualizados:', finalAlunos.length, 'alunos');
      setAlunos(finalAlunos);
      
      // ✅ Atualizar cache global
      alunosCache.set(user.id, {
        alunos: finalAlunos,
        planData: newPlanData,
        ptId: ptDataResult.data.id
      });
      
    } catch (error) {
      console.error('💥 [AlunosScreen] Erro inesperado:', error);
    }
  };

  // ✅ REFRESH SIMPLIFICADO
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlunos(true); // Force refresh
    setRefreshing(false);
  };

  // ✅ VERIFICAÇÃO SIMPLIFICADA ANTES DE CRIAR ALUNO
  const handleNovoAluno = () => {
    if (!canAddMoreStudents()) {
      const limiteTexto = planData.limite_alunos === -1 ? 'ilimitados' : planData.limite_alunos;
      Alert.alert(
        'Limite Atingido',
        `Você atingiu o limite de ${limiteTexto} alunos do plano ${planData.plano}.\n\nFaça upgrade para convidar mais alunos!`,
        [
          { text: 'Ver Planos', onPress: () => openModal('planos') }, // ✅ CORRIGIDO: Abre PlanosModal direto
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
      return;
    }
    
    router.push('/convite-aluno' as any);
  };

  // ✅ CORRIGIDO: Agora abre PlanosModal direto (igual aos exercícios)
  const handleShowPlanos = () => {
    openModal('planos');
  };

  // Handlers das modals de aluno
  const handleAlunoOptionsPress = (aluno: Aluno) => {
    openModal('alunoOptions', aluno);
  };

  const handleDetalhesAluno = () => {
    if (selectedAluno) {
      closeModal('alunoOptions');
      navigateToDetails(selectedAluno.id);
    }
  };

  const handleParQAluno = () => {
    if (selectedAluno) {
      closeModal('alunoOptions');
      navigateToParQ(selectedAluno.id);
    }
  };

  const handleAvaliacoesAluno = () => {
    if (selectedAluno) {
      closeModal('alunoOptions');
      navigateToAvaliacoes(selectedAluno.id);
    }
  };

  const handleRotinasAluno = () => {
    if (selectedAluno) {
      closeModal('alunoOptions');
      navigateToRotinas(selectedAluno.id);
    }
  };

  const handleExcluirAluno = () => {
    if (selectedAluno) {
      openModal('confirmDelete');  
    }
  };

  // ✅ RECARREGAR DADOS APÓS EXCLUSÃO (mais simples)
  const handleConfirmarExclusao = async () => {
    if (!selectedAluno) return;

    const success = await deleteAluno(selectedAluno, () => {
      setAlunos(prev => prev.filter(aluno => aluno.id !== selectedAluno!.id));
    });

    if (success) {
      closeModal('confirmDelete');
      // Não precisa recarregar dados do PT, só atualizar o state local
    }
  };

  // ✅ CORRIGIDO: PlanosModal → UpgradeModal (igual aos exercícios)
  const handleSelectPlan = (planId: string) => {
    console.log('Plano selecionado:', planId);
    // ✅ Fechar PlanosModal e abrir UpgradeModal
    closeModal('planos');
    setTimeout(() => {
      openModal('upgrade');
    }, 300);
  };

  // ✅ CARREGAR DADOS COM CACHE GLOBAL OTIMIZADO
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('❌ [AlunosScreen] Erro de autenticação:', authError);
          setLoading(false);
          return;
        }

        // ✅ Verificar cache global primeiro
        const cachedData = alunosCache.get(user.id);
        if (cachedData) {
          console.log('🚀 [AlunosScreen] Cache global encontrado!');
          setAlunos(cachedData.alunos);
          setPlanData(cachedData.planData);
          setLoading(false);
          return;
        }
        
        console.log('🔍 [AlunosScreen] Cache expirado, buscando dados frescos...');
        
        // ✅ Buscar dados em paralelo
        const [userProfileResult, ptDataResult] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('id, user_type')
            .eq('id', user.id)
            .eq('user_type', 'personal_trainer')
            .single(),
          supabase
            .from('personal_trainers')
            .select('id, nome_completo, plano, limite_alunos')
            .eq('id', user.id)
            .single()
        ]);

        if (userProfileResult.error || !userProfileResult.data) {
          console.error('❌ [AlunosScreen] User profile não é personal_trainer:', userProfileResult.error);
          setLoading(false);
          return;
        }

        if (ptDataResult.error || !ptDataResult.data) {
          console.error('❌ [AlunosScreen] Personal trainer não encontrado:', ptDataResult.error);
          setLoading(false);
          return;
        }

        // ✅ Atualizar dados do plano
        const newPlanData = {
          plano: ptDataResult.data.plano || 'gratuito',
          limite_alunos: ptDataResult.data.limite_alunos || 3
        };
        setPlanData(newPlanData);

        // ✅ Buscar alunos
        const { data: alunosData, error: alunosError } = await supabase
          .from('alunos')
          .select(`
            id,
            nome_completo,
            email,
            telefone,
            data_nascimento,
            genero,
            avatar_letter,
            avatar_color,
            avatar_type,
            avatar_image_url,
            created_at,
            onboarding_completo
          `)
          .eq('personal_trainer_id', ptDataResult.data.id)
          .order('created_at', { ascending: false });

        if (alunosError) {
          console.error('❌ [AlunosScreen] Erro ao buscar alunos:', alunosError);
          setLoading(false);
          return;
        }

        const finalAlunos = alunosData || [];
        console.log('✅ [AlunosScreen] Dados carregados:', finalAlunos.length, 'alunos');
        setAlunos(finalAlunos);
        
        // ✅ Salvar no cache global
        alunosCache.set(user.id, {
          alunos: finalAlunos,
          planData: newPlanData,
          ptId: ptDataResult.data.id
        });
        
      } catch (error) {
        console.error('❌ [AlunosScreen] Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, []); // ✅ Sem dependências externas

  // Funções de renderização
  const getStatusInfo = (aluno: Aluno) => {
    if (aluno.onboarding_completo) {
      return { color: '#10B981', text: 'Ativo', subtitle: null };
    } else {
      return { 
        color: '#F59E0B', 
        text: 'Pendente',
        subtitle: null
      };
    }
  };

  const renderAvatar = (aluno: Aluno) => {
    if (aluno.avatar_type === 'image' && aluno.avatar_image_url) {
      return (
        <Image 
          source={{ uri: aluno.avatar_image_url }}
          style={styles.avatarImage}
        />
      );
    }

    const getTextColor = (bgColor: string) => {
      const lightColors = ['#86EFAC', '#FDE047', '#F3E8FF', '#E5E7EB', '#FED7AA', '#7DD3FC', '#B3F5FC', '#BEF264'];
      return lightColors.includes(bgColor) ? '#1F2937' : 'white';
    };

    return (
      <View style={[styles.avatar, { backgroundColor: aluno.avatar_color }]}>
        <Text style={[styles.avatarText, { color: getTextColor(aluno.avatar_color) }]}>
          {aluno.avatar_letter}
        </Text>
      </View>
    );
  };

  const renderAluno = ({ item }: { item: Aluno }) => {
    const statusInfo = getStatusInfo(item);
    
    return (
      <View style={styles.alunoCard}>
        <View style={styles.alunoInfo}>
          <View style={styles.avatarContainer}>
            {renderAvatar(item)}
          </View>
          <View style={styles.alunoDetails}>
            {/* Badge de status acima do nome */}
            <View style={{ marginBottom: 4 }}>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color, alignSelf: 'flex-start', marginBottom: 2 }]}> 
                <Text style={styles.statusText}>{statusInfo.text}</Text>
              </View>
              {statusInfo.subtitle && (
                <Text style={{ fontSize: 10, color: '#F59E0B', marginBottom: 2 }}>{statusInfo.subtitle}</Text>
              )}
            </View>
            <Text style={styles.alunoNome}>{item.nome_completo}</Text>
            <Text style={styles.alunoEmail}>{item.email}</Text>
          </View>
        </View>
        <View style={styles.alunoStatus}>
          <TouchableOpacity
            onPress={() => handleAlunoOptionsPress(item)}
            style={styles.optionsButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={80} color="#D1D5DB" />
      {/* TEXTO ATUALIZADO */}
      <Text style={styles.emptyTitle}>
        Sua lista de alunos está vazia
      </Text>
      <Text style={styles.emptySubtitle}>
        Clique no botão abaixo para enviar um convite e começar a montar seu time.
      </Text>
      {/* BOTÃO ATUALIZADO */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleNovoAluno}
        activeOpacity={0.8}
      >
        <Ionicons name="person-add-outline" size={20} color="white" />
        <Text style={styles.primaryButtonText}>Convidar Novo Aluno</Text>
      </TouchableOpacity>
      <Text style={styles.emptyHint}>
        Lembre-se: o aluno convidado só aparecerá aqui após completar o cadastro.
      </Text>
    </View>
  );

  // ✅ RENDERIZAÇÃO PRINCIPAL ATUALIZADA
  const renderContent = () => {
    if (loading) {
      return <LoadingScreen message="Carregando alunos..." />;
    }

    // Conteúdo principal sem o customHeader
    return (
      <View style={styles.wrapper}>
        {alunos.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.container}>
            {/* ✅ Barra de busca e filtros */}
            <View style={styles.searchContainer}>
              <View style={styles.searchWrapper}>
                <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar alunos..."
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholderTextColor="#9CA3AF"
                  textAlignVertical="center"
                />
                {searchText.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchText('')}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
              {/* ✅ Botão de filtro */}
              <TouchableOpacity
                style={[
                  styles.filterToggle,
                  showFilters && styles.filterToggleActive,
                  getActiveFiltersCount() > 0 && styles.filterToggleWithActive
                ]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Ionicons 
                  name="filter" 
                  size={20} 
                  color={getActiveFiltersCount() > 0 ? "#FFFFFF" : "#6B7280"} 
                />
                {getActiveFiltersCount() > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* ✅ Seção de filtros reutilizada - CONDICIONAL */}
            {showFilters && (
              <FiltersSection 
                activeFilters={activeFilters}
                dropdownStates={dropdownStates}
                filterOptions={filterOptions}
                filterLabels={filterLabels}
                toggleDropdown={toggleDropdown}
                updateFilter={updateFilter}
                clearAllFilters={clearAllFilters}
                getActiveFiltersCount={getActiveFiltersCount}
              />
            )}

            {/* Conteúdo principal */}
            {filteredAlunos.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>
                  {filteredAlunos.length === 0 ? 'Nenhum aluno cadastrado' : 'Nenhum resultado encontrado'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {filteredAlunos.length === 0 
                    ? 'Convide seus primeiros alunos para começar' 
                    : getActiveFiltersCount() > 0 
                      ? 'Tente ajustar os filtros para encontrar seus alunos'
                      : 'Nenhum aluno corresponde à sua busca'
                  }
                </Text>
                {getActiveFiltersCount() > 0 && (
                  <TouchableOpacity 
                    style={styles.clearFiltersButtonEmpty}
                    onPress={clearAllFilters}
                  >
                    <Text style={styles.clearFiltersButtonEmptyText}>Limpar filtros</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                <View style={styles.headerRow}>
                  <View style={styles.countContainer}>
                    <Text style={styles.alunosCount}>
                      {filteredAlunos.length} {filteredAlunos.length === 1 ? 'aluno' : 'alunos'}
                    </Text>
                    {/* ✅ MUDANÇA 1: Contador simplificado sem "gratuito" */}
                    <Text style={[styles.alunosCount, styles.limiteText]}>
                      ({alunos.length}/{getStudentLimitText()})
                    </Text>
                    {/* ✅ MUDANÇA 2: Ícone de info REMOVIDO daqui */}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      !canAddMoreStudents() && styles.addButtonDisabled
                    ]}
                    onPress={canAddMoreStudents() ? handleNovoAluno : handleShowPlanos}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={canAddMoreStudents() ? "add" : "lock-closed"} 
                      size={20} 
                      color="white" 
                    />
                    <Text style={styles.addButtonText}>
                      {canAddMoreStudents() ? 'Aluno' : 'Limite'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={filteredAlunos}
                  renderItem={renderAluno}
                  keyExtractor={(item) => item.id}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                  }
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContainer}
                />
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  // ✅ RETURN PRINCIPAL ATUALIZADO
  return (
    <>
      {renderContent()}
      
      {/* Modals */}
      <StatusInfoModal 
        visible={modals.statusInfo}
        onClose={() => closeModal('statusInfo')}
      />

      <AlunoOptionsModal
        visible={modals.alunoOptions}
        aluno={selectedAluno}
        onClose={() => closeModal('alunoOptions')}
        onViewDetails={handleDetalhesAluno}
        onViewParQ={handleParQAluno}
        onViewAvaliacoes={handleAvaliacoesAluno}
        onViewRotinas={handleRotinasAluno}
        onDelete={handleExcluirAluno}
      />

      <ConfirmDeleteModal
        visible={modals.confirmDelete}
        aluno={selectedAluno}
        loading={alunoOpsLoading}
        onCancel={() => closeModal('confirmDelete')}
        onConfirm={handleConfirmarExclusao}
      />

      <UpgradeModal
        visible={modals.upgrade}
        onClose={() => closeModal('upgrade')}
        onUpgrade={() => {
          console.log('Iniciando processo de pagamento...');
          closeModal('upgrade');
        }}
      />

      <PlanosModal
        visible={modals.planos}
        onClose={() => closeModal('planos')}
        onSelectPlan={handleSelectPlan}
        planoAtual={planData.plano}
      />
    </>
  );
}

// ✅ ESTILOS ATUALIZADOS
const styles = StyleSheet.create({
  // ✅ NOVO: Header customizado
  customHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerInfoIcon: {
    padding: 4,
  },

  filterToggleActive: {
    backgroundColor: '#EFF6FF',
  },
  filterToggleWithActive: {
    backgroundColor: '#3B82F6',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center', // já existe, reforçado
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48, // Altura igual ao botão de filtro
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterToggle: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  clearButton: {
    padding: 4,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alunosCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  // ✅ ATUALIZADO: Contador simplificado e bold
  limiteText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600', // ✅ Mais bold para consistência
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A11E0A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 16,
  },
  alunoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  alunoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  alunoDetails: {
    flex: 1,
  },
  alunoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alunoEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  alunoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 80,
    justifyContent: 'flex-end',
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
  optionsButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A11E0A',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  clearFiltersButtonEmpty: {
    backgroundColor: '#A11E0A',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
  },
  clearFiltersButtonEmptyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  }
});
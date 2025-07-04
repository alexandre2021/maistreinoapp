// app/(tabs)/exercicios.tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Componente de filtros reutilizável
import { FiltersSection } from '../../components/FiltersSection';
import LoadingScreen from '../../components/LoadingScreen';
// ✅ Importar a modal de opções
import { ExercicioOptionsModal } from '../../components/ExercicioOptionsModal';
// ✅ Importar hook genérico
import { useModalManager } from '../../hooks/useModalManager';
// ✅ Importar constants para badges e filtros
import {
  CORES_DIFICULDADE,
  DIFICULDADES,
  EQUIPAMENTOS,
  GRUPOS_MUSCULARES
} from '../../constants/exercicios';
// ✅ Importar Supabase
import { supabase, supabaseUrl } from '../../lib/supabase';
// ✅ Importar tipos
import { Exercicio } from '../../types/Exercicio';
// ✅ Importar componentes das modals
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { PlanosModal } from '../../components/PlanosModal';
import { UpgradeModal } from '../../components/UpgradeModal';

export default function ExerciciosScreen() {
  const params = useLocalSearchParams();
  // Estados principais
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  // Estado inicial da aba baseado em params.tab (apenas na montagem)
  const [activeTab, setActiveTab] = useState<'padrao' | 'personalizados'>(() => {
    if (params && typeof params.tab !== 'undefined') {
      if (params.tab === 'personalizados') return 'personalizados';
      if (params.tab === 'padrao') return 'padrao';
    }
    return 'padrao';
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    selectedItem: selectedExercicio,
    modals,
    openModal,
    closeModal
  } = useModalManager<Exercicio>({
    exercicioOptions: false,
    upgrade: false,
    planos: false,
    confirmDelete: false
  });
  
  // ✅ Estados para filtros (usando mesma estrutura dos alunos)
  const [activeFilters, setActiveFilters] = useState({
    grupoMuscular: 'Todos',
    equipamento: 'Todos',
    dificuldade: 'Todos'
  });

  const [dropdownStates, setDropdownStates] = useState({
    grupoMuscular: false,
    equipamento: false,
    dificuldade: false
  });

  // ✅ Opções dos filtros usando constants
  const filterOptions = {
    grupoMuscular: ['Todos', ...GRUPOS_MUSCULARES],
    equipamento: ['Todos', ...EQUIPAMENTOS],
    dificuldade: ['Todos', ...DIFICULDADES]
  };

  const filterLabels = {
    grupoMuscular: 'Grupo Muscular',
    equipamento: 'Equipamento', 
    dificuldade: 'Dificuldade'
  };
  
  // Estado do plano
  const [planStatus, setPlanStatus] = useState({
    pode_adicionar: true,
    total_exercicios: 0,
    limite_exercicios: 10,
    plano_atual: 'gratuito'
  });

  // ✅ Funções para controlar os filtros (mesma estrutura dos alunos)
  const toggleDropdown = (filterType: string) => {
    setDropdownStates(prev => ({
      ...prev,
      [filterType]: !prev[filterType as keyof typeof prev]
    }));
  };

  const updateFilter = (filterType: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      grupoMuscular: 'Todos',
      equipamento: 'Todos', 
      dificuldade: 'Todos'
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(activeFilters).filter(value => value !== 'Todos').length;
  };
  
  // Filtrar exercícios por aba
  const exerciciosFiltrados = exercicios.filter(ex => 
    activeTab === 'padrao' ? ex.tipo === 'padrao' : ex.tipo === 'personalizado'
  );
  
  // ✅ Filtrar exercícios com busca + filtros
  const filteredExerciciosWithSearch = exerciciosFiltrados.filter(exercicio => {
    // Filtro por busca
    const matchesSearch = exercicio.nome.toLowerCase().includes(searchText.toLowerCase()) ||
                         exercicio.descricao.toLowerCase().includes(searchText.toLowerCase()) ||
                         exercicio.grupo_muscular.toLowerCase().includes(searchText.toLowerCase()) ||
                         exercicio.equipamento.toLowerCase().includes(searchText.toLowerCase());

    // Filtros por categoria
    const matchesGrupo = activeFilters.grupoMuscular === 'Todos' || 
                        exercicio.grupo_muscular.toLowerCase() === activeFilters.grupoMuscular.toLowerCase();
    
    const matchesEquipamento = activeFilters.equipamento === 'Todos' || 
                              exercicio.equipamento.toLowerCase() === activeFilters.equipamento.toLowerCase();
    
    const matchesDificuldade = activeFilters.dificuldade === 'Todos' || 
                              exercicio.dificuldade === activeFilters.dificuldade;

    return matchesSearch && matchesGrupo && matchesEquipamento && matchesDificuldade;
  });

  // ✅ Buscar exercícios personalizados para contar corretamente
  const fetchExerciciosPersonalizados = async (ptId: string) => {
    try {
      const { data, error } = await supabase
        .from('exercicios')
        .select('id')
        .eq('tipo', 'personalizado')
        .eq('pt_id', ptId)
        .eq('is_ativo', true);

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('❌ Erro ao contar exercícios personalizados:', error);
      return 0;
    }
  };

  // ✅ Buscar exercícios do Supabase
  const fetchExercicios = useCallback(async () => {
    try {
      console.log('🔍 Buscando exercícios do Supabase...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Erro de autenticação:', authError);
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
        console.error('❌ Erro ao buscar exercícios:', error);
        Alert.alert('Erro', 'Não foi possível carregar os exercícios.');
        return;
      }

      console.log(`✅ ${data?.length || 0} exercícios carregados para aba: ${activeTab}`);
      setExercicios(data || []);
      
      // ✅ SEMPRE buscar status do plano (independente da aba)
      const totalExerciciosPersonalizados = await fetchExerciciosPersonalizados(user.id);
      await fetchPlanStatus(user.id, totalExerciciosPersonalizados);
      
    } catch (error) {
      console.error('💥 Erro inesperado:', error);
      Alert.alert('Erro', 'Erro inesperado ao carregar exercícios.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]); // Depende de activeTab

  // ✅ useEffect para carregar dados iniciais e quando aba mudar
  useEffect(() => {
    console.log('🔄 useEffect disparado - carregando exercícios para aba:', activeTab);
    fetchExercicios();
  }, [activeTab, fetchExercicios]); // Recarrega quando a aba mudar

  // ✅ Buscar status do plano - SIMPLES MAS CORRETO
  const fetchPlanStatus = async (ptId: string, currentExerciseCount: number) => {
    try {
      console.log('📊 Buscando status do plano para PT:', ptId);
      
      const { data: personalTrainer, error } = await supabase
        .from('personal_trainers') // ✅ Tabela correta
        .select('plano, limite_exercicios')
        .eq('id', ptId)
        .single();

      if (error) throw error;
      if (!personalTrainer) throw new Error('Personal trainer não encontrado');

      const limiteExercicios = personalTrainer.limite_exercicios || 3;
      const planoAtual = personalTrainer.plano || 'gratuito';
      const podeAdicionar = limiteExercicios === -1 || currentExerciseCount < limiteExercicios;

      setPlanStatus({
        pode_adicionar: podeAdicionar,
        total_exercicios: currentExerciseCount,
        limite_exercicios: limiteExercicios,
        plano_atual: planoAtual
      });

      console.log(`✅ Plano: ${planoAtual}, ${currentExerciseCount}/${limiteExercicios === -1 ? 'ilimitado' : limiteExercicios}`);
      
    } catch (error) {
      console.error('❌ Erro ao buscar plano:', error);
      Alert.alert('Erro', 'Não foi possível verificar seu plano. Tente novamente.');
      // NÃO define planStatus - deixa o estado anterior ou inicial
    }
  };

  // ✅ Função para validar limite do plano (reutilizável)
  const validarLimitePlano = () => {
    if (!planStatus.pode_adicionar) {
      openModal('planos'); // ✅ CORRETO: Abre PlanosModal direto
      return false;
    }
    return true;
  };

  // Recarregar dados
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExercicios();
    setRefreshing(false);
  };

  // ✅ CENÁRIO 2: Criar novo exercício personalizado (do zero)
  const handleNovoExercicio = () => {
    if (!validarLimitePlano()) return;
    
    console.log('➕ Criar novo exercício');
    router.push('/criar-exercicio-personalizado');
  };

  // ✅ Handler para opções do exercício - USANDO HOOK
  const handleExercicioOptions = (exercicio: Exercicio) => {
    console.log('🔍 Abrindo opções para exercício:', exercicio.id, exercicio.tipo);
    openModal('exercicioOptions', exercicio);
  };

  // ✅ Handlers da modal - USANDO HOOK
  const handleCloseModal = () => {
    closeModal('exercicioOptions');
  };

  const handleViewDetails = () => {
    if (selectedExercicio) {
      console.log('👁️ Navegando para detalhes do exercício:', selectedExercicio.id, 'tipo:', selectedExercicio.tipo);
      
      // ✅ Redirecionar para página específica baseada no tipo do exercício
      if (selectedExercicio.tipo === 'personalizado') {
        console.log('🔄 Redirecionando para página de exercício personalizado...');
        router.push(`/editar-exercicio-personalizado/${selectedExercicio.id}` as any);
      } else {
        console.log('🔄 Redirecionando para página de exercício padrão...');
        router.push(`/detalhes-exercicio/${selectedExercicio.id}`);
      }
      
      handleCloseModal();
    } else {
      console.error('❌ selectedExercicio é null ou undefined');
    }
  };

  // ✅ CENÁRIO 1: Criar cópia personalizada (a partir de exercício padrão)
  const handleCreateCopy = () => {
    if (selectedExercicio) {
      // ✅ Validar limite do plano antes de navegar
      if (!validarLimitePlano()) {
        handleCloseModal();
        return;
      }
      
      console.log('📋 Navegando para criar cópia do exercício:', selectedExercicio.id);
      
      // ✅ NAVEGAR para a tela de criar cópia
      router.push(`/criar-copia-exercicio/${selectedExercicio.id}`);
      
      // Fechar a modal
      handleCloseModal();
    }
  };

  const handleEditExercicio = () => {
    if (selectedExercicio) {
      console.log('✏️ Editando exercício:', selectedExercicio.id);
      
      // ✅ Redirecionar diretamente para a página de edição
      router.push(`/detalhes-exercicio-personalizado/${selectedExercicio.id}` as any);
      
      handleCloseModal();
    }
  };

  const handleDeleteExercicio = () => {
    if (selectedExercicio) {
      // Não limpar o selectedExercicio ao fechar a modal de opções
      closeModal('exercicioOptions');
      setTimeout(() => {
        openModal('confirmDelete', selectedExercicio); // Passa explicitamente o exercício
      }, 200);
    }
  };

  // Função auxiliar para deletar mídia no Cloudflare via Edge Function
  const deleteMediaFromCloudflare = async (fileUrl: string | undefined, bucketType = 'exercicios') => {
    if (!fileUrl) return;
    try {
      // Removido filtro de domínio: toda mídia personalizada deve ser deletada
      const edgeUrl = `${supabaseUrl}/functions/v1/delete-image`;
      // Extrai apenas o nome do arquivo (ex: abc123.jpg), ignorando subpastas
      let filename = fileUrl.split('?')[0]; // remove query params se houver
      filename = filename.substring(filename.lastIndexOf('/') + 1);
      if (!filename) return;
      // Pega o token do usuário autenticado
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const body = {
        filename, // apenas o nome do arquivo
        bucket_type: bucketType
      };
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      console.log('Chamando edge function:', edgeUrl, body);
      const response = await fetch(edgeUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      const responseText = await response.text();
      if (!response.ok) {
        console.warn('Erro ao deletar mídia:', responseText);
      } else {
        console.log('Resposta da função edge (delete-image):', responseText);
      }
    } catch (err) {
      console.warn('Erro ao chamar edge function de deleção:', err);
    }
  };

  // ✅ CONFIRMAR EXCLUSÃO de exercício personalizado
  const handleConfirmarExclusaoExercicio = async () => {
    if (!selectedExercicio) return;
    try {
      console.log('🗑️ Excluindo exercício:', selectedExercicio.id);
      
      // 1. Deletar mídias do Cloudflare (se existirem)
      await Promise.all([
        deleteMediaFromCloudflare(selectedExercicio.imagem_1_url),
        deleteMediaFromCloudflare(selectedExercicio.imagem_2_url),
        deleteMediaFromCloudflare(selectedExercicio.video_url)
      ]);
      
      // 2. Excluir do Supabase
      const { error } = await supabase
        .from('exercicios')
        .delete()
        .eq('id', selectedExercicio.id);
      if (error) throw error;
      
      // 3. Remover da lista local
      setExercicios(prev => prev.filter(ex => ex.id !== selectedExercicio.id));
      
      // ✅ 4. ATUALIZAR O CONTADOR DO PLANO
      setPlanStatus(prev => {
        const novoTotal = prev.total_exercicios - 1;
        const podeAdicionar = prev.limite_exercicios === -1 || novoTotal < prev.limite_exercicios;
        
        console.log(`🔄 Contador atualizado: ${novoTotal}/${prev.limite_exercicios === -1 ? 'ilimitado' : prev.limite_exercicios}`);
        
        return {
          ...prev,
          total_exercicios: novoTotal,
          pode_adicionar: podeAdicionar
        };
      });
      
      closeModal('confirmDelete');
      console.log('✅ Exercício excluído com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao excluir exercício:', error);
      Alert.alert('Erro', 'Não foi possível excluir o exercício. Tente novamente.');
    }
  };

  const handleSelectPlan = (planId: string) => {
    console.log('Plano selecionado:', planId);
    // ✅ Fechar PlanosModal e abrir UpgradeModal
    closeModal('planos');
    setTimeout(() => {
      openModal('upgrade');
    }, 300);
  };

  // Função para verificar se pode adicionar mais exercícios
  const canAddMoreExercises = () => {
    return planStatus.pode_adicionar;
  };

  // Renderização com badges coloridos
  const renderExercicio = ({ item }: { item: Exercicio }) => (
    <TouchableOpacity
      style={styles.exercicioCard}
      onPress={() => {
        if (activeTab === 'personalizados' && item.tipo === 'personalizado') {
          // Ir direto para editar exercício personalizado
          router.push(`/editar-exercicio-personalizado/${item.id}`);
        } else {
          // Detalhes do exercício padrão
          router.push(`/detalhes-exercicio/${item.id}`);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.exercicioContent}>
        <Text style={styles.exercicioNome}>{item.nome}</Text>
        
        {/* ✅ Badges com design limpo e legível */}
        <View style={styles.exercicioBadges}>
          <View style={styles.badgeNeutral}>
            <Text style={styles.badgeNeutralText}>{item.grupo_muscular}</Text>
          </View>
          <View style={styles.badgeNeutral}>
            <Text style={styles.badgeNeutralText}>{item.equipamento}</Text>
          </View>
          <View style={[styles.badgeDifficulty, { backgroundColor: CORES_DIFICULDADE[item.dificuldade] || '#6B7280' }]}>
            <Text style={styles.badgeDifficultyText}>{item.dificuldade}</Text>
          </View>
        </View>
      </View>
      
      {/* ✅ Botão de opções */}
      <TouchableOpacity
        style={styles.exercicioOptionsButton}
        onPress={(e) => {
          e.stopPropagation(); // Evitar que o clique no card seja acionado
          handleExercicioOptions(item);
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.exercicioOptionsText}>⋮</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="barbell-outline" size={80} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>
        {activeTab === 'padrao' 
          ? 'Nenhum exercício encontrado' 
          : 'Comece criando seus exercícios!'
        }
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'padrao'
          ? 'Ajuste os filtros para encontrar exercícios'
          : ''
        }
      </Text>
      {activeTab === 'personalizados' && canAddMoreExercises() && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleNovoExercicio}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.primaryButtonText}>Criar Primeiro Exercício</Text>
        </TouchableOpacity>
      )}
      {activeTab === 'personalizados' && !canAddMoreExercises() && (
        <View style={styles.limitReachedContainer}>
          <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
          <Text style={styles.limitReachedText}>
            Limite de exercícios atingido
          </Text>
          <Text style={styles.limitReachedSubtext}>
            Faça upgrade do seu plano para criar mais exercícios
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return <LoadingScreen message="Carregando exercícios..." />;
  }

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exercícios</Text>
        <Text style={styles.headerSubtitle}>
          {activeTab === 'padrao' ? 'Padrão' : 'Personalizados'} ({filteredExerciciosWithSearch.length})
        </Text>
        {activeTab === 'personalizados' && (
          <Text style={styles.headerLimit}>
            {planStatus.limite_exercicios === -1 
              ? 'Exercícios ilimitados' 
              : `${planStatus.total_exercicios}/${planStatus.limite_exercicios} exercícios`
            }
          </Text>
        )}
      </View>

      {/* Abas simples */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'padrao' && styles.tabActive]}
          onPress={() => setActiveTab('padrao')}
        >
          <Text style={[styles.tabText, activeTab === 'padrao' && styles.tabTextActive]}>
            Padrão
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'personalizados' && styles.tabActive]}
          onPress={() => setActiveTab('personalizados')}
        >
          <Text style={[styles.tabText, activeTab === 'personalizados' && styles.tabTextActive]}>
            Personalizados
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* ✅ Barra de busca e filtros */}
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar exercícios..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#9CA3AF"
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

        {/* ✅ Seção de filtros reutilizada */}
        {showFilters && (
          <FiltersSection
            key="filters-section"
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

        {/* Header com contadores e botão */}
        {filteredExerciciosWithSearch.length > 0 && (
          <View style={styles.headerRow}>
            <View style={styles.countContainer}>
              <Text style={styles.exerciciosCount}>
                {filteredExerciciosWithSearch.length} {filteredExerciciosWithSearch.length === 1 ? 'exercício' : 'exercícios'}
              </Text>
            </View>
            
            {activeTab === 'personalizados' && (
              <TouchableOpacity
                style={[
                  styles.addButton,
                  !canAddMoreExercises() && styles.addButtonDisabled
                ]}
                onPress={canAddMoreExercises() ? handleNovoExercicio : () => openModal('planos')}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={canAddMoreExercises() ? "add" : "lock-closed"} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.addButtonText}>
                  {canAddMoreExercises() ? 'Exercício' : 'Limite'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Lista de exercícios */}
        {filteredExerciciosWithSearch.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredExerciciosWithSearch}
            renderItem={renderExercicio}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
      
      {/* ✅ Modal de opções do exercício */}
      <ExercicioOptionsModal
        visible={modals.exercicioOptions}
        exercicio={selectedExercicio}
        onClose={handleCloseModal}
        onViewDetails={handleViewDetails}
        onCreateCopy={selectedExercicio?.tipo === 'padrao' ? handleCreateCopy : undefined}
        onEdit={selectedExercicio?.tipo === 'personalizado' ? handleEditExercicio : undefined}
        onDelete={selectedExercicio?.tipo === 'personalizado' ? handleDeleteExercicio : undefined}
      />

      {/* ✅ Modal de confirmação de exclusão */}
      <ConfirmDeleteModal
        item={selectedExercicio}
        itemType="exercicio"
        visible={modals.confirmDelete}
        loading={false} // TODO: Adicionar loading state
        onCancel={() => closeModal('confirmDelete')}
        onConfirm={handleConfirmarExclusaoExercicio}
      />

      {/* ✅ Modals de planos */}
      <UpgradeModal
        visible={modals.upgrade}
        onClose={() => closeModal('upgrade')}
        onUpgrade={() => {
          // ✅ Implementar lógica de pagamento depois
          console.log('Iniciando processo de pagamento...');
          closeModal('upgrade');
        }}
      />

      <PlanosModal
        visible={modals.planos}
        onClose={() => closeModal('planos')}
        onSelectPlan={handleSelectPlan}
        planoAtual={planStatus.plano_atual}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  headerLimit: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#007AFF',
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
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  filterToggle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
  exerciciosCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
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
  exercicioCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  exercicioContent: {
    flex: 1,
    marginRight: 12,
  },
  exercicioNome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  exercicioBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  // ✅ Badge neutro para grupo muscular e equipamento
  badgeNeutral: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeNeutralText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  // ✅ Badge colorido apenas para dificuldade
  badgeDifficulty: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDifficultyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  exercicioOptionsButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  exercicioOptionsText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
    lineHeight: 20,
  },
  listContainer: {
    paddingBottom: 16,
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
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  limitReachedContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  limitReachedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  limitReachedSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});
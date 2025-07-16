// components/rotina/exercicios/ExercicioModal.tsx - VERSÃO COM DEBUG COMPLETO
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useExerciciosContext } from '../../../context/ExerciciosContext';
import { ExercicioBanco } from '../../../types/exercicio.types';

export const ExercicioModal: React.FC = () => {
  const {
    // Estado do modal
    isModalOpen,
    treinoSelecionado,
    gruposFiltro,
    loading,
    
    // Exercícios e filtros
    exerciciosFiltrados,
    filtros,
    atualizarFiltro,
    
    // Seleção
    tipoSerie,
    setTipoSerie,
    exerciciosSelecionados,
    toggleExercicioSelecionado,
    
    // Ações
    fecharModal,
    criarExercicioSimples,
    criarExercicioCombinado,
    adicionarExercicio,
    podeSelecionarExercicio,
    isSelecaoValida
  } = useExerciciosContext();

  const [showFiltroModal, setShowFiltroModal] = useState(false);

  // ====================================
  // DEBUG - LOGS DO ESTADO
  // ====================================
  useEffect(() => {
    if (isModalOpen) {
      console.log('🎯 [ExercicioModal] Modal aberto');
      console.log('🎯 [ExercicioModal] Treino selecionado:', treinoSelecionado);
      console.log('🎯 [ExercicioModal] Grupos filtro:', gruposFiltro);
      console.log('🎯 [ExercicioModal] Tipo série:', tipoSerie);
      console.log('🎯 [ExercicioModal] Exercícios disponíveis:', exerciciosFiltrados.length);
    }
  }, [isModalOpen, treinoSelecionado, gruposFiltro, tipoSerie, exerciciosFiltrados.length]);

  useEffect(() => {
    console.log('🎯 [ExercicioModal] Exercícios selecionados MUDOU:', {
      total: exerciciosSelecionados.length,
      nomes: exerciciosSelecionados.map(e => e.nome),
      ids: exerciciosSelecionados.map(e => e.id)
    });
  }, [exerciciosSelecionados]);

  // ====================================
  // HANDLERS
  // ====================================
  const handleAdicionarExercicios = () => {
    console.log('🔧 [ExercicioModal] Tentando adicionar exercícios:', {
      tipoSerie,
      totalSelecionados: exerciciosSelecionados.length,
      isSelecaoValida: isSelecaoValida()
    });

    try {
      if (tipoSerie === 'simples') {
        if (exerciciosSelecionados.length === 1) {
          const exercicio = criarExercicioSimples(exerciciosSelecionados[0]);
          console.log('✅ [ExercicioModal] Exercício simples criado:', exercicio);
          adicionarExercicio(treinoSelecionado, exercicio);
          console.log('✅ [ExercicioModal] Exercício simples adicionado ao treino');
        } else {
          console.log('❌ [ExercicioModal] Erro: deve selecionar 1 exercício para série simples');
          Alert.alert('Erro', 'Selecione um exercício para a série simples');
        }
      } else {
        if (exerciciosSelecionados.length === 2) {
          const exercicio = criarExercicioCombinado(exerciciosSelecionados);
          console.log('✅ [ExercicioModal] Exercício combinado criado:', exercicio);
          adicionarExercicio(treinoSelecionado, exercicio);
          console.log('✅ [ExercicioModal] Exercício combinado adicionado ao treino');
        } else {
          console.log('❌ [ExercicioModal] Erro: deve selecionar 2 exercícios para série combinada');
          Alert.alert('Erro', 'Selecione exatamente 2 exercícios para a série combinada');
        }
      }
    } catch (error) {
      console.error('❌ [ExercicioModal] Erro ao adicionar exercício:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o exercício');
    }
  };

  const handleChangeTipoSerie = (tipo: 'simples' | 'combinada') => {
    console.log('🔄 [ExercicioModal] Mudando tipo de série:', {
      de: tipoSerie,
      para: tipo,
      exerciciosSelecionadosAntes: exerciciosSelecionados.length
    });
    setTipoSerie(tipo);
  };

  // ====================================
  // RENDER HELPERS
  // ====================================
  const renderSelecaoInfo = () => {
    if (tipoSerie === 'combinada' && exerciciosSelecionados.length > 0) {
      return (
        <View style={styles.selecaoInfoCompacta}>
          <Text style={styles.selecaoTextoCompacto}>
            🔗 Combinada ({exerciciosSelecionados.length}/2)
          </Text>
          {exerciciosSelecionados.length > 0 && (
            <View style={styles.exerciciosSelecionadosCompacto}>
              {exerciciosSelecionados.map((ex, index) => (
                <Text key={ex.id} style={styles.exercicioSelecionadoCompacto}>
                  {index + 1}. {ex.nome}
                </Text>
              ))}
            </View>
          )}
        </View>
      );
    }
    return null;
  };

  const renderFiltros = () => (
    <View style={styles.filtrosSection}>
      {/* Grupos em linha própria */}
      <View style={styles.gruposFiltroCompacto}>
        <Text style={styles.filtroLabelCompacto}>Grupos:</Text>
        <View style={styles.gruposTagsContainer}>
          {gruposFiltro.map(grupo => (
            <View key={grupo} style={styles.grupoFiltroTagCompacto}>
              <Text style={styles.grupoFiltroTextCompacto}>{grupo}</Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Fonte em linha própria */}
      <View style={styles.fonteFiltroCompacto}>
        <Text style={styles.filtroLabelCompacto}>Fonte:</Text>
        <TouchableOpacity 
          style={styles.dropdownButtonCompacto}
          onPress={() => setShowFiltroModal(true)}
        >
          <Text style={styles.dropdownTextCompacto}>
            {filtros.tipo === 'todos' ? 'Todos' : 
             filtros.tipo === 'padrao' ? 'Padrão' : 
             'Meus'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Filtro por Grupo Muscular - só aparece com múltiplos grupos */}
      {gruposFiltro.length > 1 && (
        <View style={styles.grupoMuscularesFiltroCompacto}>
          <Text style={styles.filtroLabelCompacto}>Filtro:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.gruposFiltroScrollCompacto}
            contentContainerStyle={styles.gruposFiltroScrollContentCompacto}
          >
            <TouchableOpacity
              style={[
                styles.grupoFiltroButtonCompacto,
                filtros.grupoMuscular === 'todos' && styles.grupoFiltroButtonCompactoActive
              ]}
              onPress={() => atualizarFiltro('grupoMuscular', 'todos')}
            >
              <Text style={[
                styles.grupoFiltroButtonTextCompacto,
                filtros.grupoMuscular === 'todos' && styles.grupoFiltroButtonTextCompactoActive
              ]}>
                Todos ({exerciciosFiltrados.length})
              </Text>
            </TouchableOpacity>
            
            {gruposFiltro.map(grupo => {
              const countGrupo = exerciciosFiltrados.filter(ex => ex.grupo_muscular === grupo).length;
              return (
                <TouchableOpacity
                  key={grupo}
                  style={[
                    styles.grupoFiltroButtonCompacto,
                    filtros.grupoMuscular === grupo && styles.grupoFiltroButtonCompactoActive
                  ]}
                  onPress={() => atualizarFiltro('grupoMuscular', grupo)}
                >
                  <Text style={[
                    styles.grupoFiltroButtonTextCompacto,
                    filtros.grupoMuscular === grupo && styles.grupoFiltroButtonTextCompactoActive
                  ]}>
                    {grupo} ({countGrupo})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderExercicioItem = (exercicio: ExercicioBanco) => {
    const isSelected = exerciciosSelecionados.find(ex => ex.id === exercicio.id);
    const canSelect = podeSelecionarExercicio(exercicio);
    
    // DEBUG LOGS PARA CADA ITEM
    const debugInfo = {
      exercicio: exercicio.nome,
      id: exercicio.id,
      isSelected: !!isSelected,
      canSelect,
      exerciciosSelecionadosIds: exerciciosSelecionados.map(e => e.id),
      tipoSerie,
      totalSelecionados: exerciciosSelecionados.length
    };
    
    return (
      <TouchableOpacity
        key={exercicio.id}
        style={[
          styles.exercicioItem,
          isSelected && styles.exercicioItemSelected,
          !canSelect && styles.exercicioItemDisabled
        ]}
        onPress={() => {
          console.log('🖱️ [ExercicioModal] CLIQUE no exercício:', debugInfo);
          
          if (canSelect) {
            console.log('✅ [ExercicioModal] Pode selecionar - chamando toggleExercicioSelecionado');
            toggleExercicioSelecionado(exercicio);
          } else {
            console.log('❌ [ExercicioModal] NÃO pode selecionar exercício');
          }
        }}
        disabled={!canSelect}
      >
        <View style={styles.exercicioItemInfo}>
          <Text style={[
            styles.exercicioItemNome,
            !canSelect && styles.exercicioItemNomeDisabled
          ]}>
            {exercicio.nome}
            {/* DEBUG VISUAL */}
            {isSelected && <Text style={{color: 'green'}}> ✓</Text>}
          </Text>
          <Text style={[
            styles.exercicioItemMeta,
            !canSelect && styles.exercicioItemMetaDisabled
          ]}>
            {exercicio.grupo_muscular} • {exercicio.equipamento}
          </Text>
          <Text style={styles.exercicioTipo}>
            {exercicio.tipo === 'padrao' ? '📚 Padrão' : '⭐ Personalizado'}
          </Text>
        </View>
        <View style={[
          styles.selectionIndicator,
          isSelected && styles.selectionIndicatorSelected
        ]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderConteudoExercicios = () => {
    console.log('🎯 [ExercicioModal] Renderizando conteúdo:', {
      loading,
      totalFiltrados: exerciciosFiltrados.length,
      primeiros3: exerciciosFiltrados.slice(0, 3).map(e => e.nome)
    });

    if (loading) {
      return (
        <View style={styles.loadingExercicios}>
          <Text style={styles.loadingText}>Carregando exercícios...</Text>
        </View>
      );
    }

    if (exerciciosFiltrados.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>Nenhum exercício encontrado</Text>
          <Text style={styles.emptyStateText}>
            Tente ajustar os filtros ou buscar por outro termo
          </Text>
        </View>
      );
    }

    return exerciciosFiltrados.map(renderExercicioItem);
  };

  // ====================================
  // DEBUG - LOG DO BOTÃO ADICIONAR
  // ====================================
  const debugBotaoAdicionar = {
    exerciciosSelecionados: exerciciosSelecionados.length,
    isSelecaoValida: isSelecaoValida(),
    tipoSerie,
    shouldShowButton: exerciciosSelecionados.length > 0
  };

  console.log('🎯 [ExercicioModal] Estado do botão adicionar:', debugBotaoAdicionar);

  // ====================================
  // RENDER PRINCIPAL
  // ====================================
  return (
    <>
      <Modal
        visible={isModalOpen}
        transparent
        animationType="slide"
        onRequestClose={fecharModal}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Exercício</Text>
              <TouchableOpacity onPress={fecharModal}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* DEBUG INFO */}
            {/* <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                🔍 Debug: {exerciciosSelecionados.length} selecionados | 
                Tipo: {tipoSerie} | 
                Válido: {isSelecaoValida() ? 'SIM' : 'NÃO'}
              </Text>
            </View> */}

            {/* TIPO DE SÉRIE */}
            <View style={styles.tipoFiltros}>
              <Text style={styles.filtroLabel}>Tipo de Série:</Text>
              <View style={styles.filtroButtons}>
                <TouchableOpacity 
                  style={[styles.tipoButton, tipoSerie === 'simples' && styles.tipoButtonActive]}
                  onPress={() => handleChangeTipoSerie('simples')}
                >
                  <Text style={[styles.tipoButtonText, tipoSerie === 'simples' && styles.tipoButtonTextActive]}>
                    🎯 Simples (1)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tipoButton, tipoSerie === 'combinada' && styles.tipoButtonActive]}
                  onPress={() => handleChangeTipoSerie('combinada')}
                >
                  <Text style={[styles.tipoButtonText, tipoSerie === 'combinada' && styles.tipoButtonTextActive]}>
                    🔗 Combinada (2)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* INFO DE SELEÇÃO */}
            {renderSelecaoInfo()}

            {/* FILTROS */}
            {renderFiltros()}

            {/* BUSCA */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar exercício..."
                value={filtros.busca}
                onChangeText={(text) => atualizarFiltro('busca', text)}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* LISTA DE EXERCÍCIOS */}
            <ScrollView style={styles.exerciciosList}>
              {renderConteudoExercicios()}
            </ScrollView>
            
            {/* BOTÃO ADICIONAR - COM LOGS EXTRAS */}
            {exerciciosSelecionados.length > 0 && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[
                    styles.adicionarButton,
                    isSelecaoValida() ? styles.adicionarButtonEnabled : styles.adicionarButtonDisabled
                  ]}
                  onPress={() => {
                    console.log('🔧 [ExercicioModal] Botão ADICIONAR pressionado');
                    handleAdicionarExercicios();
                  }}
                  disabled={!isSelecaoValida()}
                >
                  <Text style={[
                    styles.adicionarButtonText,
                    isSelecaoValida() ? styles.adicionarButtonTextEnabled : styles.adicionarButtonTextDisabled
                  ]}>
                    + Exercício
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DE FILTRO DE FONTE */}
      <Modal
        visible={showFiltroModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFiltroModal(false)}
      >
        <TouchableOpacity 
          style={styles.filtroModalOverlay}
          activeOpacity={1}
          onPress={() => setShowFiltroModal(false)}
        >
          <View style={styles.filtroModalContainer}>
            <TouchableOpacity
              style={styles.filtroModalItem}
              onPress={() => {
                atualizarFiltro('tipo', 'todos');
                setShowFiltroModal(false);
              }}
            >
              <Text style={styles.filtroModalText}>Todos</Text>
              {filtros.tipo === 'todos' && <Ionicons name="checkmark" size={20} color="#A11E0A" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.filtroModalItem}
              onPress={() => {
                atualizarFiltro('tipo', 'padrao');
                setShowFiltroModal(false);
              }}
            >
              <Text style={styles.filtroModalText}>📚 Exercícios Padrão</Text>
              {filtros.tipo === 'padrao' && <Ionicons name="checkmark" size={20} color="#A11E0A" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.filtroModalItem}
              onPress={() => {
                atualizarFiltro('tipo', 'personalizado');
                setShowFiltroModal(false);
              }}
            >
              <Text style={styles.filtroModalText}>⭐ Meus Exercícios</Text>
              {filtros.tipo === 'personalizado' && <Ionicons name="checkmark" size={20} color="#A11E0A" />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// ====================================
// ESTILOS (COM DEBUG)
// ====================================
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 34
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937'
  },
  // NOVO - DEBUG INFO
  debugInfo: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B'
  },
  debugText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500'
  },
  tipoFiltros: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  filtroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  filtroButtons: {
    flexDirection: 'row',
    gap: 8
  },
  tipoButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center'
  },
  tipoButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#A11E0A'
  },
  tipoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280'
  },
  tipoButtonTextActive: {
    color: '#A11E0A'
  },
  selecaoInfoCompacta: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 8
  },
  selecaoTextoCompacto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    textAlign: 'center'
  },
  exerciciosSelecionadosCompacto: {
    marginTop: 8
  },
  exercicioSelecionadoCompacto: {
    fontSize: 11,
    color: '#3B82F6',
    textAlign: 'center',
    marginVertical: 1
  },
  filtrosSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12
  },
  gruposFiltroCompacto: {
    paddingHorizontal: 20,
    paddingVertical: 6
  },
  fonteFiltroCompacto: {
    paddingHorizontal: 20,
    paddingVertical: 6
  },
  filtroLabelCompacto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6
  },
  gruposTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  grupoFiltroTagCompacto: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  grupoFiltroTextCompacto: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '500'
  },
  dropdownButtonCompacto: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 120
  },
  dropdownTextCompacto: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500'
  },
  grupoMuscularesFiltroCompacto: {
    paddingHorizontal: 20,
    paddingVertical: 8
  },
  gruposFiltroScrollCompacto: {
    marginTop: 4
  },
  gruposFiltroScrollContentCompacto: {
    gap: 8
  },
  grupoFiltroButtonCompacto: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  grupoFiltroButtonCompactoActive: {
    backgroundColor: '#A11E0A',
    borderColor: '#A11E0A'
  },
  grupoFiltroButtonTextCompacto: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500'
  },
  grupoFiltroButtonTextCompactoActive: {
    color: 'white'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937'
  },
  exerciciosList: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 8
  },
  loadingExercicios: {
    padding: 20,
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20
  },
  exercicioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingLeft: 8 // <-- Adicione este espaçamento
  },
  exercicioItemSelected: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#A11E0A',
    // paddingLeft: 8 // (opcional, se quiser só quando selecionado)
  },
  exercicioItemDisabled: {
    opacity: 0.5
  },
  exercicioItemInfo: {
    flex: 1
  },
  exercicioItemNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2
  },
  exercicioItemNomeDisabled: {
    color: '#9CA3AF'
  },
  exercicioItemMeta: {
    fontSize: 13,
    color: '#6B7280'
  },
  exercicioItemMetaDisabled: {
    color: '#D1D5DB'
  },
  exercicioTipo: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '500',
    marginTop: 2
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectionIndicatorSelected: {
    backgroundColor: '#A11E0A',
    borderColor: '#A11E0A'
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  adicionarButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4
  },
  adicionarButtonEnabled: {
    backgroundColor: '#A11E0A'
  },
  adicionarButtonDisabled: {
    backgroundColor: '#E5E7EB'
  },
  adicionarButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  adicionarButtonTextEnabled: {
    color: 'white'
  },
  adicionarButtonTextDisabled: {
    color: '#9CA3AF'
  },
  filtroModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  filtroModalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    minWidth: 250,
    maxWidth: 300,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8
  },
  filtroModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  filtroModalText: {
    fontSize: 16,
    color: '#374151',
    flex: 1
  }
});
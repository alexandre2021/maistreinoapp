// app/criar-rotina/exercicios.tsx - VERSÃO REFATORADA CORRIGIDA
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Context e Hooks
import { ExerciciosProvider, useExerciciosContext } from '../../context/ExerciciosContext';

// Componentes
import { RotinaProgressHeader } from '../../components/rotina/RotinaProgressHeader';
import { EmptyState } from '../../components/rotina/exercicios/EmptyState';
import { ExercicioModal } from '../../components/rotina/exercicios/ExercicioModal';
import { RequisitoCard } from '../../components/rotina/exercicios/RequisitoCard';
import { SerieCombinada } from '../../components/rotina/exercicios/SerieCombinada';
import { SerieSimples } from '../../components/rotina/exercicios/SerieSimples';

// ====================================
// COMPONENTE PRINCIPAL (SEM PROVIDER)
// ====================================
function ExerciciosContent() {
  const router = useRouter();
  const {
    // Dados
    config,
    dadosCompletos,
    totalExercicios,
    isFormValido,
    isLoaded,
    
    // Ações de exercícios
    removerExercicio,
    adicionarSerie,
    removerSerie,
    atualizarIntervaloExercicio,
    
    // Modal
    abrirModal
  } = useExerciciosContext();

  // ====================================
  // NAVEGAÇÃO
  // ====================================
  const handlePrevious = () => {
    console.log('🔙 Voltando para treinos...');
    const alunoId = config.alunoId;
    if (alunoId) {
      router.push(`/criar-rotina/treinos?alunoId=${alunoId}`);
    } else {
      router.push('/criar-rotina/treinos');
    }
  };

  const handleNext = async () => {
    if (!isFormValido) {
      Alert.alert('Exercícios necessários', 'Adicione pelo menos 1 exercício em cada treino para continuar.');
      return;
    }

    console.log('🚀 Avançando para revisão...');
    const alunoId = config.alunoId;
    if (alunoId) {
      router.push(`/criar-rotina/revisao?alunoId=${alunoId}`);
    } else {
      router.push('/criar-rotina/revisao');
    }
  };

  // ====================================
  // RENDER EXERCÍCIO
  // ====================================
  const renderExercicio = (exercicio: any, treinoId: string) => {
    const treino = dadosCompletos.treinos.find(t => t.id === treinoId);
    const exercicios = treino?.exercicios || [];
    const exercicioIndex = exercicios.findIndex(ex => ex.id === exercicio.id);
    const isUltimoExercicio = exercicioIndex === exercicios.length - 1;

    return (
      <View key={exercicio.id} style={styles.exercicioCard}>
        {/* HEADER DO EXERCÍCIO */}
        <View style={styles.exercicioHeader}>
          <View style={styles.exercicioInfo}>
            <Text style={styles.exercicioNome}>{exercicio.nome}</Text>
            <View style={styles.exercicioMeta}>
              {exercicio.tipo === 'combinada' && (
                <View style={styles.exercicioCombinadoTags}>
                  <Text style={styles.serieCombinadaTag}>Série Combinada</Text>
                </View>
              )}
              <Text style={styles.exercicioMetaText}>
                {exercicio.grupoMuscular} • {exercicio.equipamento}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removerExercicio(treinoId, exercicio.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* SÉRIES DO EXERCÍCIO */}
        <View style={styles.seriesContainer}>
          <Text style={styles.seriesLabel}>Séries:</Text>
          {exercicio.series.map((serie: any, index: number) => {
            const isUltimaSerie = index === exercicio.series.length - 1;
            const onRemoverSerie = exercicio.series.length > 1 
              ? () => removerSerie(treinoId, exercicio.id, serie.id)
              : undefined;

            if (exercicio.tipo === 'combinada') {
              return (
                <SerieCombinada
                  key={serie.id}
                  serie={serie}
                  exercicio={exercicio}
                  treinoId={treinoId}
                  isUltimaSerie={isUltimaSerie}
                  isUltimoExercicio={isUltimoExercicio}
                  onRemoverSerie={onRemoverSerie}
                />
              );
            }

            return (
              <SerieSimples
                key={serie.id}
                serie={serie}
                exercicio={exercicio}
                treinoId={treinoId}
                isUltimaSerie={isUltimaSerie}
                isUltimoExercicio={isUltimoExercicio}
                onRemoverSerie={onRemoverSerie}
              />
            );
          })}

          {/* BOTÃO ADICIONAR SÉRIE */}
          <TouchableOpacity
            style={styles.addSerieButton}
            onPress={() => adicionarSerie(treinoId, exercicio.id)}
          >
            <Ionicons name="add" size={16} color="#A11E0A" />
            <Text style={styles.addSerieText}>Série</Text>
          </TouchableOpacity>

          {/* INTERVALO ENTRE EXERCÍCIOS */}
          {/* Só exibe se não for o último exercício do treino */}
          {!isUltimoExercicio && (
            <View style={[styles.intervaloExercicioContainer]}> 
              <Ionicons name="time-outline" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
              <Text style={styles.intervaloExercicioLabel}>Intervalo entre exercícios:</Text>
              <TextInput
                style={styles.intervaloExercicioInput}
                value={exercicio.intervaloAposExercicio !== undefined ? exercicio.intervaloAposExercicio.toString() : '90'}
                onChangeText={valor => atualizarIntervaloExercicio(treinoId, exercicio.id, valor === '' ? 0 : parseInt(valor) || 0)}
                keyboardType="numeric"
                maxLength={3}
                placeholder="90"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.intervaloExercicioUnidade}>s</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ====================================
  // RENDER TREINO
  // ====================================
  const renderTreino = (treino: any) => {
    const temExercicios = treino.exercicios && treino.exercicios.length > 0;
    
    return (
      <View key={treino.id} style={styles.treinoCard}>
        <View style={styles.treinoHeader}>
          <View style={styles.treinoTitleContainer}>
            <Text style={styles.treinoNome}>{treino.nome}</Text>
            <Text style={styles.treinoGrupos}>
              {treino.gruposMusculares?.length > 0 ? treino.gruposMusculares.join(', ') : 'Sem grupos'}
            </Text>
          </View>
          {/* Removido o botão do topo */}
        </View>

        {!temExercicios ? (
          <EmptyState
            treinoNome={treino.nome}
            onAddExercicio={() => abrirModal(treino.id, treino.gruposMusculares || [])}
          />
        ) : (
          <>
            {/* Lista de exercícios */}
            {treino.exercicios.map((exercicio: any) => 
              renderExercicio(exercicio, treino.id)
            )}
            
            {/* Botão adicionar no final quando tem exercícios */}
            <TouchableOpacity
              style={styles.addExercicioButtonBottom}
              onPress={() => abrirModal(treino.id, treino.gruposMusculares || [])}
            >
              <Ionicons name="add" size={18} color="#A11E0A" />
              <Text style={styles.addExercicioButtonBottomText}>Exercício</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  // ====================================
  // LOADING STATE
  // ====================================
  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando exercícios...</Text>
      </View>
    );
  }

  // ====================================
  // RENDER PRINCIPAL
  // ====================================
  return (
    <View style={styles.container}>
      <RotinaProgressHeader
        title="Configuração de Exercícios e Séries"
        subtitle={`${totalExercicios} exercícios adicionados`}
        alunoId={config.alunoId}
        showExitButton={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* INFO DA ROTINA */}
        <View style={styles.rotinaInfo}>
          <Ionicons name="information-circle" size={20} color="#A11E0A" />
          <View style={styles.rotinaInfoText}>
            <Text style={styles.rotinaInfoTitle}>{dadosCompletos.nomeRotina}</Text>
            <Text style={styles.rotinaInfoSubtitle}>
              Configurando exercícios para {dadosCompletos.treinos.length} treinos
            </Text>
          </View>
        </View>

        {/* CARD DE REQUISITOS */}
        <RequisitoCard />

        {/* LISTA DE TREINOS */}
        {dadosCompletos.treinos.map(treino => renderTreino(treino))}
        
        {/* BOTÕES DE NAVEGAÇÃO */}
        <View style={styles.bottomActionsInScroll}>
          <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
            <Text style={styles.previousButtonText}>Voltar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.nextButton, !isFormValido && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!isFormValido}
          >
            <Text style={[styles.nextButtonText, !isFormValido && styles.nextButtonTextDisabled]}>
              Revisar Rotina
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* MODAL DE EXERCÍCIOS */}
      <ExercicioModal />
    </View>
  );
}

// ====================================
// COMPONENTE EXPORTADO (COM PROVIDER)
// ====================================
export default function ExerciciosRotinaScreen() {
  return (
    <ExerciciosProvider>
      <ExerciciosContent />
    </ExerciciosProvider>
  );
}

// ====================================
// ESTILOS
// ====================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  content: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB'
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280'
  },
  rotinaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#A11E0A',
    gap: 12
  },
  rotinaInfoText: {
    flex: 1
  },
  rotinaInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF'
  },
  rotinaInfoSubtitle: {
    fontSize: 14,
    color: '#3B82F6',
    marginTop: 2
  },
  treinoCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  treinoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  treinoTitleContainer: {
    flex: 1
  },
  treinoNome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4
  },
  treinoGrupos: {
    fontSize: 14,
    color: '#6B7280'
  },
  addExercicioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A11E0A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4
  },
  addExercicioButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600'
  },
  addExercicioButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8
  },
  addExercicioButtonBottomText: {
    color: '#A11E0A',
    fontSize: 15,
    fontWeight: '600'
  },
  exercicioCard: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    marginTop: 16
  },
  exercicioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  exercicioInfo: {
    flex: 1
  },
  exercicioNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4
  },
  exercicioMeta: {
    gap: 4
  },
  exercicioCombinadoTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  serieCombinadaTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  exercicioMetaText: {
    fontSize: 13,
    color: '#6B7280'
  },
  removeButton: {
    padding: 4
  },
  seriesContainer: {
    marginTop: 8
  },
  seriesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  addSerieButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 6,
    paddingVertical: 8,
    marginTop: 8,
    gap: 4
  },
  addSerieText: {
    fontSize: 14,
    color: '#A11E0A',
    fontWeight: '500'
  },
  bottomActionsInScroll: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginTop: 20,
  },
  bottomSpacing: {
    height: 20,
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8
  },
  previousButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280'
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#A11E0A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB'
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  nextButtonTextDisabled: {
    color: '#9CA3AF'
  },
  intervaloExercicioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0FF', // Roxo clarinho
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
    minHeight: 48,
  },
  intervaloExercicioLabel: {
    fontSize: 12,
    color: '#7C3AED', // Roxo escuro para contraste
    flex: 1,
    fontWeight: '600',
  },
  intervaloExercicioInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 6,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'white',
    width: 50,
    color: '#1F2937',
    fontWeight: '500',
    marginRight: 0,
  },
  intervaloExercicioUnidade: {
    fontSize: 12,
    color: '#6B7280',
  }
});
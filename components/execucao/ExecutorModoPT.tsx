// components/execucao/ExecutorModoPT.tsx - VERSÃO DEBUG
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useModalManager } from '../../hooks/useModalManager';
import { supabase } from '../../lib/supabase';
import { ConfirmActionModal } from '../rotina/ConfirmActionModal';

// ✅ INTERFACES (temporárias com any)
interface SessaoData {
  id: string;
  rotina_id: string;
  treino_id: string;
  aluno_id: string;
  status: string;
  data_execucao: string;
  rotinas: any;
  treinos: any;
  alunos: any;
}

interface UserProfile {
  user_type: 'personal_trainer' | 'aluno';
  id: string;
  nome_completo: string;
}

interface ExercicioData {
  id: string;
  exercicio_1: string;
  exercicio_2?: string;
  ordem: number;
  series: SerieData[];
}

interface SerieData {
  id: string;
  numero_serie: number;
  repeticoes: number;
  carga: number;
  executada?: boolean;
  carga_executada?: number;
  repeticoes_executadas?: number;
  observacoes?: string;
}

interface Props {
  sessaoId: string;
  sessaoData: SessaoData;
  userProfile: UserProfile;
  onSessaoFinalizada: () => void;
}

export default function ExecutorModoPT({ sessaoId, sessaoData, userProfile, onSessaoFinalizada }: Props) {
  console.log('🔥 RENDER ExecutorModoPT - INÍCIO');
  console.log('📊 Props recebidas:', { sessaoId, sessaoData: sessaoData?.id, userProfile: userProfile?.id });

  // ✅ MODAL MANAGER
  const { modals, openModal, closeModal } = useModalManager({
    finalizarSessao: false,
    intervaloConcluido: false
  });
  console.log('🎯 Modals inicializadas:', Object.keys(modals));

  // ✅ ESTADOS
  const [loading, setLoading] = useState(true);
  const [exercicios, setExercicios] = useState<ExercicioData[]>([]);
  const [exercicioAtual, setExercicioAtual] = useState(0);
  const [tempoSessao, setTempoSessao] = useState(0);
  const [cronometroSerie, setCronometroSerie] = useState(0);
  const [cronometroAtivo, setCronometroAtivo] = useState(false);
  const [observacoesSessao, setObservacoesSessao] = useState('');
  const [finalizando, setFinalizando] = useState(false);

  console.log('📊 Estados atuais:', {
    loading,
    exerciciosLength: exercicios.length,
    exercicioAtual,
    tempoSessao,
    cronometroSerie,
    cronometroAtivo,
    finalizando
  });

  // ✅ CRONÔMETRO DA SESSÃO
  useEffect(() => {
    console.log('🕐 useEffect CRONÔMETRO SESSÃO - INICIADO');
    const intervalo = setInterval(() => {
      console.log('🕐 Tick cronômetro sessão');
      setTempoSessao(prev => prev + 1);
    }, 1000);
    
    return () => {
      console.log('🕐 useEffect CRONÔMETRO SESSÃO - CLEANUP');
      clearInterval(intervalo);
    };
  }, []); // Array vazio - executar apenas uma vez

  // ✅ CRONÔMETRO DE SÉRIE - CORRIGIDO (sem openModal nas dependências)
  useEffect(() => {
    console.log('⏱️ useEffect CRONÔMETRO SÉRIE - INICIADO', {
      cronometroAtivo,
      cronometroSerie
    });

    let intervalo: ReturnType<typeof setInterval>;
    if (cronometroAtivo && cronometroSerie > 0) {
      console.log('⏱️ Iniciando intervalo cronômetro série');
      intervalo = setInterval(() => {
        console.log('⏱️ Tick cronômetro série');
        setCronometroSerie(prev => {
          if (prev <= 1) {
            console.log('⏱️ Cronômetro série finalizado!');
            setCronometroAtivo(false);
            // ✅ USAR MODAL SEM COLOCAR openModal NAS DEPENDÊNCIAS
            setTimeout(() => {
              openModal('intervaloConcluido');
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      console.log('⏱️ useEffect CRONÔMETRO SÉRIE - CLEANUP');
      if (intervalo) clearInterval(intervalo);
    };
  }, [cronometroAtivo, cronometroSerie]); // ✅ REMOVIDO openModal das dependências

  // ✅ CARREGAR EXERCÍCIOS DO TREINO
  const carregarExercicios = useCallback(async () => {
    console.log('📚 carregarExercicios - INICIADO', { treino_id: sessaoData.treino_id });
    
    try {
      setLoading(true);
      
      const { data: exerciciosData, error } = await supabase
        .from('exercicios_rotina')
        .select(`
          id,
          exercicio_1,
          exercicio_2,
          ordem,
          series (
            id,
            numero_serie,
            repeticoes,
            carga
          )
        `)
        .eq('treino_id', sessaoData.treino_id)
        .order('ordem');

      console.log('📚 Resposta do Supabase:', { exerciciosData, error });

      if (error) {
        console.error('❌ Erro ao carregar exercícios:', error);
        return;
      }

      if (!exerciciosData || exerciciosData.length === 0) {
        console.warn('⚠️ Nenhum exercício encontrado');
        return;
      }

      // Organizar dados com séries ordenadas
      const exerciciosFormatados = exerciciosData.map(ex => ({
        ...ex,
        series: (ex.series || []).sort((a: any, b: any) => a.numero_serie - b.numero_serie)
      }));

      console.log('📚 Exercícios formatados:', exerciciosFormatados);
      setExercicios(exerciciosFormatados);
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar exercícios:', error);
    } finally {
      console.log('📚 carregarExercicios - FINALIZANDO');
      setLoading(false);
    }
  }, [sessaoData.treino_id]);

  useEffect(() => {
    console.log('📚 useEffect CARREGAR EXERCÍCIOS - INICIADO');
    carregarExercicios();
    
    return () => {
      console.log('📚 useEffect CARREGAR EXERCÍCIOS - CLEANUP');
    };
  }, [carregarExercicios]);

  // ✅ FUNÇÕES DE CONTROLE
  const formatarTempo = useCallback((segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const iniciarCronometroSerie = useCallback((tempo: number = 90) => {
    console.log('⏱️ iniciarCronometroSerie chamado:', tempo);
    setCronometroSerie(tempo);
    setCronometroAtivo(true);
  }, []);

  const pararCronometro = useCallback(() => {
    console.log('⏱️ pararCronometro chamado');
    setCronometroAtivo(false);
  }, []);

  const atualizarSerieExecutada = useCallback((exercicioIndex: number, serieIndex: number, dadosSerie: Partial<SerieData>) => {
    console.log('📝 atualizarSerieExecutada:', { exercicioIndex, serieIndex, dadosSerie });
    
    setExercicios(prev => prev.map((ex, exIndex) => {
      if (exIndex === exercicioIndex) {
        return {
          ...ex,
          series: ex.series.map((serie, sIndex) => {
            if (sIndex === serieIndex) {
              return { ...serie, ...dadosSerie };
            }
            return serie;
          })
        };
      }
      return ex;
    }));
  }, []);

  const proximoExercicio = useCallback(() => {
    console.log('▶️ proximoExercicio chamado');
    if (exercicioAtual < exercicios.length - 1) {
      setExercicioAtual(prev => prev + 1);
    }
  }, [exercicioAtual, exercicios.length]);

  const exercicioAnterior = useCallback(() => {
    console.log('◀️ exercicioAnterior chamado');
    if (exercicioAtual > 0) {
      setExercicioAtual(prev => prev - 1);
    }
  }, [exercicioAtual]);

  const finalizarSessao = useCallback(() => {
    console.log('🏁 finalizarSessao chamado');
    console.log('Função confirmarFinalizacao disponível:', typeof confirmarFinalizacao);
    openModal('finalizarSessao');
  }, [openModal]);

  const confirmarFinalizacao = useCallback(async () => {
    console.log('🏁 confirmarFinalizacao - INICIADO');
    try {
      setFinalizando(true);

      // Atualizar sessão como concluída
      const { error: updateError } = await supabase
        .from('execucoes_sessao')
        .update({
          status: 'concluida',
          tempo_total_minutos: Math.floor(tempoSessao / 60),
          observacoes: observacoesSessao
        })
        .eq('id', sessaoId);

      console.log('🏁 Resultado update sessão:', { updateError });

      if (updateError) {
        console.error('❌ Erro ao finalizar sessão:', updateError);
        return;
      }

      // TODO: Salvar dados das séries executadas (implementar tabela series_executadas)
      
      // ✅ FECHAR MODAL E CHAMAR CALLBACK
      console.log('🏁 Fechando modal e chamando callback');
      closeModal('finalizarSessao');
      onSessaoFinalizada();

    } catch (error) {
      console.error('❌ Erro ao finalizar sessão:', error);
    } finally {
      console.log('🏁 confirmarFinalizacao - FINALIZANDO');
      setFinalizando(false);
    }
  }, [sessaoId, tempoSessao, observacoesSessao, closeModal, onSessaoFinalizada]);

  // ✅ LOADING
  if (loading) {
    console.log('⏳ Renderizando loading...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Carregando exercícios...</Text>
      </View>
    );
  }

  if (exercicios.length === 0) {
    console.log('❌ Renderizando erro - nenhum exercício');
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Nenhum exercício encontrado</Text>
      </View>
    );
  }

  const exercicioCorrente = exercicios[exercicioAtual];
  console.log('📋 Exercício corrente:', exercicioCorrente?.exercicio_1);

  console.log('🎨 Renderizando interface principal...');

  return (
    <View style={styles.container}>
      {/* ✅ HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{sessaoData.treinos.nome}</Text>
          <Text style={styles.headerSubtitle}>{sessaoData.alunos.nome_completo}</Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Tempo</Text>
            <Text style={styles.statValue}>{formatarTempo(tempoSessao)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Exercício</Text>
            <Text style={styles.statValue}>{exercicioAtual + 1} de {exercicios.length}</Text>
          </View>
        </View>
      </View>

      {/* ✅ CRONÔMETRO DE SÉRIE */}
      <View style={styles.cronometroContainer}>
        <Text style={styles.cronometroLabel}>Intervalo entre séries</Text>
        <Text style={styles.cronometroTempo}>{formatarTempo(cronometroSerie)}</Text>
        <View style={styles.cronometroBotoes}>
          <TouchableOpacity 
            style={styles.cronometroBotao} 
            onPress={() => iniciarCronometroSerie(90)}
          >
            <Text style={styles.cronometroBotaoText}>1:30</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cronometroBotao} 
            onPress={() => iniciarCronometroSerie(120)}
          >
            <Text style={styles.cronometroBotaoText}>2:00</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cronometroBotao} 
            onPress={() => iniciarCronometroSerie(180)}
          >
            <Text style={styles.cronometroBotaoText}>3:00</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.cronometroBotao, styles.cronometroBotaoStop]} 
            onPress={pararCronometro}
          >
            <Text style={styles.cronometroBotaoText}>Parar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ EXERCÍCIO ATUAL */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.exercicioCard}>
          <Text style={styles.exercicioNome}>
            {exercicioCorrente.exercicio_1}
            {exercicioCorrente.exercicio_2 && ` + ${exercicioCorrente.exercicio_2}`}
          </Text>
          
          {/* ✅ SÉRIES */}
          <View style={styles.seriesContainer}>
            {exercicioCorrente.series.map((serie, index) => (
              <View 
                key={serie.id} 
                style={[
                  styles.serieCard,
                  serie.executada && styles.serieExecutada
                ]}
              >
                <View style={styles.serieHeader}>
                  <Text style={styles.serieNumero}>Série {serie.numero_serie}</Text>
                  <Text style={styles.seriePlanejada}>
                    {serie.repeticoes} x {serie.carga}kg
                  </Text>
                </View>
                
                <View style={styles.serieInputs}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Carga (kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={serie.carga_executada?.toString() || serie.carga.toString()}
                      onChangeText={(value) => atualizarSerieExecutada(exercicioAtual, index, {
                        carga_executada: parseFloat(value) || 0
                      })}
                      keyboardType="numeric"
                      placeholder={serie.carga.toString()}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Repetições</Text>
                    <TextInput
                      style={styles.input}
                      value={serie.repeticoes_executadas?.toString() || serie.repeticoes.toString()}
                      onChangeText={(value) => atualizarSerieExecutada(exercicioAtual, index, {
                        repeticoes_executadas: parseInt(value) || 0
                      })}
                      keyboardType="numeric"
                      placeholder={serie.repeticoes.toString()}
                    />
                  </View>
                </View>
                
                <TextInput
                  style={styles.observacoesInput}
                  value={serie.observacoes || ''}
                  onChangeText={(value) => atualizarSerieExecutada(exercicioAtual, index, {
                    observacoes: value
                  })}
                  placeholder="Observações da série..."
                  multiline
                />
                
                <TouchableOpacity
                  style={[
                    styles.marcarSerieButton,
                    serie.executada && styles.marcarSerieButtonCompleto
                  ]}
                  onPress={() => {
                    console.log('✅ Marcando série como completa:', { exercicioAtual, index, executada: !serie.executada });
                    atualizarSerieExecutada(exercicioAtual, index, {
                      executada: !serie.executada
                    });
                    if (!serie.executada) {
                      iniciarCronometroSerie(90);
                    }
                  }}
                >
                  <Text style={styles.marcarSerieButtonText}>
                    {serie.executada ? '✓ Série Completa' : 'Marcar como Completa'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* ✅ OBSERVAÇÕES DA SESSÃO */}
        <View style={styles.observacoesContainer}>
          <Text style={styles.observacoesLabel}>Observações da Sessão</Text>
          <TextInput
            style={styles.observacoesTextarea}
            value={observacoesSessao}
            onChangeText={(value) => {
              console.log('📝 Atualizando observações da sessão');
              setObservacoesSessao(value);
            }}
            placeholder="Observações gerais sobre o treino, evolução do aluno, ajustes realizados..."
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>

      {/* ✅ BOTÕES DE NAVEGAÇÃO */}
      <View style={styles.navigation}>
        <TouchableOpacity 
          style={[styles.navButton, exercicioAtual === 0 && styles.navButtonDisabled]}
          onPress={exercicioAnterior}
          disabled={exercicioAtual === 0}
        >
          <Text style={styles.navButtonText}>← Anterior</Text>
        </TouchableOpacity>

        {exercicioAtual < exercicios.length - 1 ? (
          <TouchableOpacity style={styles.navButton} onPress={proximoExercicio}>
            <Text style={styles.navButtonText}>Próximo →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.finalizarButton, finalizando && styles.finalizarButtonDisabled]}
            onPress={finalizarSessao}
            disabled={finalizando}
          >
            {finalizando ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.finalizarButtonText}>Finalizar Sessão</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ✅ MODAL DE CONFIRMAÇÃO PARA FINALIZAR SESSÃO */}
      <ConfirmActionModal
        visible={modals.finalizarSessao}
        title="Finalizar Sessão"
        message="Tem certeza que deseja finalizar esta sessão de treino? Os dados serão salvos automaticamente."
        itemName={`${sessaoData.treinos.nome} - ${formatarTempo(tempoSessao)}`}
        actionType="success"
        confirmText="Finalizar"
        onConfirm={confirmarFinalizacao}
        onCancel={() => {
          console.log('❌ Cancelando finalização');
          closeModal('finalizarSessao');
        }}
        loading={finalizando}
      />

      {/* ✅ MODAL SIMPLES PARA INTERVALO CONCLUÍDO */}
      {modals.intervaloConcluido && (
        <TouchableOpacity 
          style={styles.intervalModal}
          onPress={() => {
            console.log('⏰ Fechando modal de intervalo concluído');
            closeModal('intervaloConcluido');
          }}
          activeOpacity={1}
        >
          <View style={styles.intervalModalContent}>
            <Text style={styles.intervalModalTitle}>⏰ Intervalo Finalizado</Text>
            <Text style={styles.intervalModalText}>Hora de começar a próxima série!</Text>
            <TouchableOpacity 
              style={styles.intervalModalButton}
              onPress={() => {
                console.log('⏰ Botão OK modal intervalo');
                closeModal('intervaloConcluido');
              }}
            >
              <Text style={styles.intervalModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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

  // Loading/Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
  },

  // Header
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  // Cronômetro
  cronometroContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  cronometroLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  cronometroTempo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 16,
  },
  cronometroBotoes: {
    flexDirection: 'row',
    gap: 12,
  },
  cronometroBotao: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cronometroBotaoStop: {
    backgroundColor: '#EF4444',
  },
  cronometroBotaoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Scroll e Exercício
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exercicioCard: {
    backgroundColor: 'white',
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exercicioNome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },

  // Séries
  seriesContainer: {
    gap: 16,
  },
  serieCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  serieExecutada: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  serieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serieNumero: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  seriePlanejada: {
    fontSize: 14,
    color: '#6B7280',
  },
  serieInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  observacoesInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 12,
    minHeight: 40,
  },
  marcarSerieButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  marcarSerieButtonCompleto: {
    backgroundColor: '#10B981',
  },
  marcarSerieButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Observações da sessão
  observacoesContainer: {
    backgroundColor: 'white',
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  observacoesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  observacoesTextarea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },

  // Navegação
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  navButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  finalizarButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  finalizarButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  finalizarButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal de intervalo
  intervalModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  intervalModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 32,
  },
  intervalModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  intervalModalText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  intervalModalButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  intervalModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
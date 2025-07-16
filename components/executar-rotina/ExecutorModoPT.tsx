// components/executar-rotina/ExecutorModoPT.tsx - COM MODAL DE HISTÓRICO
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// ✅ IMPORTS DOS NOVOS ARQUIVOS
import { EXERCICIO_CONSTANTS, HISTORICO_FORMAT, MENSAGENS } from '../../constants/exercicio.constants';
import { useExercicioExecucao } from '../../hooks/useExercicioExecucao';
import {
  CronometroExercicioData,
  CronometroSerieData,
  SessaoData,
  UserProfile
} from '../../types/exercicio.types';
import { exercicioUtils } from '../../utils/exercicio.utils';

// ✅ COMPONENTES
import { Ionicons } from '@expo/vector-icons';
import CronometroExercicio from './shared/CronometroExercicio';
import CronometroSerie from './shared/CronometroSerie';
import ExercicioDetalhesModal from './shared/ExercicioDetalhesModal';
import ExercicioHistoricoModal from './shared/ExercicioHistoricoModal';
import RegistroSerieCombinada from './shared/RegistroSerieCombinada';
import RegistroSerieSimples from './shared/RegistroSerieSimples';

interface Props {
  sessaoId: string;
  sessaoData: SessaoData;
  userProfile: UserProfile;
  onSessaoFinalizada: () => void;
}

export default function ExecutorModoPT({ 
  sessaoId, 
  sessaoData, 
  userProfile, 
  onSessaoFinalizada 
}: Props) {
  // ✅ HOOK CUSTOMIZADO COM TODA A LÓGICA PRINCIPAL
  const {
    exercicios,
    loading,
    tempoSessao,
    atualizarSerieExecutada,
    salvarExecucaoCompleta,
  } = useExercicioExecucao(sessaoData);

  // ✅ ESTADOS PARA MODAIS E CRONÔMETROS
  const [modalIntervaloSerie, setModalIntervaloSerie] = useState(false);
  const [modalIntervaloExercicio, setModalIntervaloExercicio] = useState(false);
  
  // ✅ ESTADOS PARA MODAIS DE EXERCÍCIO
  const [modalDetalhesVisible, setModalDetalhesVisible] = useState(false);
  const [modalHistoricoVisible, setModalHistoricoVisible] = useState(false);
  const [exercicioSelecionado, setExercicioSelecionado] = useState('');

  // ✅ ESTADOS PARA DADOS DOS CRONÔMETROS
  const [dadosCronometroSerie, setDadosCronometroSerie] = useState<CronometroSerieData | null>(null);
  const [dadosCronometroExercicio, setDadosCronometroExercicio] = useState<CronometroExercicioData | null>(null);

  // ✅ ESTADO PARA FINALIZAÇÃO
  const [finalizando, setFinalizando] = useState(false);

  // ✅ FUNÇÃO PARA VERIFICAR SE TEM HISTÓRICO (simulada por enquanto)
  const temHistorico = useCallback((exercicioNome: string): boolean => {
    // TODO: Implementar verificação real se já executou este exercício neste treino
    // Por enquanto, retorna true para teste (em produção, fazer query no banco)
    return true; // Substituir por lógica real
  }, []);

  // ✅ FUNÇÃO COMPLETAR SÉRIE - SIMPLIFICADA COM UTILS
  const completarSerie = useCallback((exercicioIndex: number, serieIndex: number) => {
    console.log('🔄 Completando série:', { exercicioIndex, serieIndex });
    
    atualizarSerieExecutada(exercicioIndex, serieIndex, { executada: true });
    
    const exercicio = exercicios[exercicioIndex];
    const serie = exercicio.series[serieIndex];
    
    // ✅ USAR FUNÇÕES UTILITÁRIAS
    const ehUltimaSerie = exercicioUtils.ehUltimaSerie(serie, exercicio.series);
    const ehUltimoExercicio = exercicioUtils.ehUltimoExercicio(exercicioIndex, exercicios.length);
    
    if (!ehUltimaSerie) {
      // Cronômetro entre séries
      const intervaloSerie = serie.intervalo_apos_serie || EXERCICIO_CONSTANTS.INTERVALO_PADRAO_SERIE;
      setDadosCronometroSerie({ intervalo: intervaloSerie });
      setModalIntervaloSerie(true);
    } else if (!ehUltimoExercicio) {
      // Cronômetro entre exercícios
      const intervaloExercicio = exercicio.intervalo_apos_exercicio || EXERCICIO_CONSTANTS.INTERVALO_PADRAO_EXERCICIO;
      const proximoExercicio = exercicios[exercicioIndex + 1];
      
      setDadosCronometroExercicio({
        intervalo: intervaloExercicio,
        exercicioAtual: exercicio.exercicio_1,
        proximoExercicio: proximoExercicio.exercicio_1
      });
      setModalIntervaloExercicio(true);
    } else {
      console.log('🏁 Última série do último exercício');
    }
  }, [exercicios, atualizarSerieExecutada]);

  // ✅ CALLBACKS DOS CRONÔMETROS
  const handleCronometroSerieComplete = useCallback(() => {
    setModalIntervaloSerie(false);
    setDadosCronometroSerie(null);
  }, []);

  const handleCronometroExercicioComplete = useCallback(() => {
    setModalIntervaloExercicio(false);
    setDadosCronometroExercicio(null);
  }, []);

  // ✅ FINALIZAR SESSÃO - SIMPLIFICADA
  const finalizarSessao = useCallback(async () => {
    console.log('🚀 Iniciando finalização da sessão...');
    
    setFinalizando(true);
    const sucesso = await salvarExecucaoCompleta();
    
    if (sucesso) {
      console.log('🎉 Sessão finalizada com sucesso!');
      onSessaoFinalizada();
    } else {
      console.error('❌ Erro ao finalizar sessão');
    }
    
    setFinalizando(false);
  }, [salvarExecucaoCompleta, onSessaoFinalizada]);

  // ✅ LOADING
  if (loading) {
    return (
      <View style={styles.carregandoContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.carregandoTexto}>{MENSAGENS.CARREGANDO}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ HEADER */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.tituloSessao}>
            {sessaoData?.treinos?.nome || sessaoData?.rotinas?.nome || 'Treino'}
          </Text>
          {sessaoData?.alunos?.nome_completo && (
            <Text style={styles.subtituloSessao}>
              {sessaoData.alunos.nome_completo}
            </Text>
          )}
        </View>
        <Text style={styles.tempoSessao}>
          {exercicioUtils.formatarTempo(tempoSessao)}
        </Text>
      </View>

      {/* ✅ SCROLL VIEW DOS EXERCÍCIOS */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {exercicios.map((exercicio, exIndex) => (
          <View key={`exercicio-${exIndex}`} style={styles.exercicioContainer}>
            
            {/* ✅ HEADER DO EXERCÍCIO COM ÍCONES */}
            <View style={styles.exercicioHeader}>
              <Text style={styles.exercicioTitulo}>{exercicio.exercicio_1}</Text>
              
              {/* Container dos ícones */}
              <View style={styles.iconesContainer}>
                {/* ✅ ÍCONE DE HISTÓRICO - só aparece se tiver histórico */}
                {temHistorico(exercicio.exercicio_1) && (
                  <TouchableOpacity 
                    style={styles.historicoButton}
                    onPress={() => {
                      setExercicioSelecionado(exercicio.exercicio_1);
                      setModalHistoricoVisible(true);
                    }}
                  >
                    <Ionicons name={HISTORICO_FORMAT.ICONE_HISTORICO} size={22} color="#3B82F6" />
                  </TouchableOpacity>
                )}
                
                {/* ✅ ÍCONE DE DETALHES - sempre aparece */}
                <TouchableOpacity 
                  style={styles.infoButton}
                  onPress={() => {
                    setExercicioSelecionado(exercicio.exercicio_1);
                    setModalDetalhesVisible(true);
                  }}
                >
                  <Ionicons name={HISTORICO_FORMAT.ICONE_DETALHES} size={24} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>
            
            {exercicio.series.map((serie, sIndex) => {
              // ✅ USAR FUNÇÃO UTILITÁRIA PARA DETECTAR SÉRIE COMBINADA
              if (exercicioUtils.ehSerieCombinada(serie)) {
                return (
                  <RegistroSerieCombinada
                    key={`serie-combinada-${sIndex}`}
                    numero={serie.numero_serie}
                    exercicio1Nome={exercicio.exercicio_1}
                    exercicio2Nome={exercicio.exercicio_2 || ''}
                    repeticoes1={serie.repeticoes_1}
                    carga1={serie.carga_1}
                    repeticoes2={serie.repeticoes_2}
                    carga2={serie.carga_2}
                    initialReps1={serie.repeticoes_executadas || 0}
                    initialCarga1={serie.carga_executada || 0}
                    initialReps2={serie.repeticoes_executadas || 0}
                    initialCarga2={serie.carga_executada || 0}
                    initialObs={serie.observacoes || ''}
                    executada={serie.executada}
                    onSave={(reps1, carga1, reps2, carga2, obs) => {
                      atualizarSerieExecutada(exIndex, sIndex, {
                        repeticoes_executadas: reps1,
                        carga_executada: carga1,
                        repeticoes_2: reps2,
                        carga_2: carga2,
                        observacoes: obs,
                        executada: true
                      });
                      completarSerie(exIndex, sIndex);
                    }}
                  />
                );
              }

              // Série simples
              return (
                <RegistroSerieSimples
                  key={`serie-${sIndex}`}
                  numero={serie.numero_serie}
                  repeticoes={serie.repeticoes}
                  carga={serie.carga}
                  temDropset={serie.tem_dropset}
                  cargaDropset={serie.carga_dropset}
                  initialReps={serie.repeticoes_executadas || 0}
                  initialCarga={serie.carga_executada || 0}
                  initialDropsetReps={serie.repeticoes_dropset_executadas || 0}
                  initialDropsetCarga={serie.carga_dropset_executada || 0}
                  initialObs={serie.observacoes || ''}
                  executada={serie.executada}
                  onSave={(reps, carga, dropsetReps, dropsetCarga, obs) => {
                    atualizarSerieExecutada(exIndex, sIndex, {
                      repeticoes_executadas: reps,
                      carga_executada: carga,
                      repeticoes_dropset_executadas: dropsetReps,
                      carga_dropset_executada: dropsetCarga,
                      observacoes: obs,
                      executada: true
                    });
                    completarSerie(exIndex, sIndex);
                  }}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* ✅ CRONÔMETROS */}
      <CronometroSerie
        visible={modalIntervaloSerie}
        onClose={() => setModalIntervaloSerie(false)}
        onComplete={handleCronometroSerieComplete}
        intervaloSerie={dadosCronometroSerie?.intervalo || null}
      />

      <CronometroExercicio
        visible={modalIntervaloExercicio}
        onClose={() => setModalIntervaloExercicio(false)}
        onComplete={handleCronometroExercicioComplete}
        intervaloExercicio={dadosCronometroExercicio?.intervalo || null}
        exercicioAtual={dadosCronometroExercicio?.exercicioAtual || ''}
        proximoExercicio={dadosCronometroExercicio?.proximoExercicio || ''}
      />

      {/* ✅ MODAL DE DETALHES DO EXERCÍCIO */}
      <ExercicioDetalhesModal
        visible={modalDetalhesVisible}
        exercicioNome={exercicioSelecionado}
        onClose={() => setModalDetalhesVisible(false)}
      />

      {/* ✅ MODAL DE HISTÓRICO DO EXERCÍCIO */}
      <ExercicioHistoricoModal
        visible={modalHistoricoVisible}
        exercicioNome={exercicioSelecionado}
        treinoId={sessaoData.treino_id}
        alunoId={sessaoData.aluno_id}
        onClose={() => setModalHistoricoVisible(false)}
      />

      {/* ✅ BOTÃO FINALIZAR SESSÃO */}
      <TouchableOpacity
        style={styles.finalizarButton}
        onPress={finalizarSessao}
        disabled={finalizando || loading}
      >
        <Text style={styles.finalizarButtonText}>
          {finalizando || loading ? 'Finalizando...' : 'Finalizar Sessão'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ✅ STYLES COM NOVOS ESTILOS PARA ÍCONES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 40,
    paddingHorizontal: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  headerInfo: {
    flex: 1
  },
  tituloSessao: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151'
  },
  subtituloSessao: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2
  },
  tempoSessao: {
    fontSize: 18,
    color: '#6B7280'
  },
  scrollContainer: {
    paddingBottom: 80
  },
  exercicioContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  exercicioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exercicioTitulo: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3B82F6',
    flex: 1,
  },
  // ✅ NOVOS ESTILOS PARA ÍCONES
  iconesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historicoButton: {
    padding: 4,
  },
  infoButton: {
    padding: 4,
  },
  carregandoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB'
  },
  carregandoTexto: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280'
  },
  finalizarButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  finalizarButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600'
  },
});
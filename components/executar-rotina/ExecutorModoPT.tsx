// components/executar-rotina/ExecutorModoPT.tsx - VERSÃO FINAL COM CRONÔMETROS
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';
import CronometroExercicio from './shared/CronometroExercicio';
import CronometroSerie from './shared/CronometroSerie';

// ✅ INTERFACES
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
  intervalo_apos_exercicio?: number;
}

interface SerieData {
  id: string;
  numero_serie: number;
  repeticoes?: number;
  carga?: number;
  // Campos para séries combinadas
  repeticoes_1?: number;
  carga_1?: number;
  repeticoes_2?: number;
  carga_2?: number;
  // ✅ CAMPOS DROPSET
  tem_dropset?: boolean;
  carga_dropset?: number;
  intervalo_apos_serie?: number;
  // Estados de execução - CORRIGIDOS
  executada?: boolean;
  repeticoes_executadas?: number;
  carga_executada?: number;
  observacoes?: string;
  dropset_executado?: boolean;
  carga_dropset_executada?: number;
  repeticoes_dropset_executadas?: number;
}

interface ExecucaoSerieInsert {
  execucao_sessao_id: string;
  exercicio_rotina_id: string;
  serie_numero: number;
  repeticoes_executadas_1?: number | null;
  carga_executada_1?: number | null;
  repeticoes_executadas_2?: number | null;
  carga_executada_2?: number | null;
  carga_dropset?: number | null;
  observacoes?: string | null;
}

interface Props {
  sessaoId: string;
  sessaoData: SessaoData;
  userProfile: UserProfile;
  onSessaoFinalizada: () => void;
}
export default function ExecutorModoPT({ sessaoId, sessaoData, userProfile, onSessaoFinalizada }: Props) {
  // ✅ ESTADOS PARA MODAIS (substituindo useModalManager temporariamente)
  const [modalIntervaloSerie, setModalIntervaloSerie] = useState(false);
  const [modalIntervaloExercicio, setModalIntervaloExercicio] = useState(false);

  // ✅ ESTADOS
  const [loading, setLoading] = useState(true);
  const [exercicios, setExercicios] = useState<ExercicioData[]>([]);
  const [exercicioAtual, setExercicioAtual] = useState(0);
  const [tempoSessao, setTempoSessao] = useState(0);
  const [finalizando] = useState(false);
  const [modalHistoricoVisible, setModalHistoricoVisible] = useState(false);
  const [historicoExercicio] = useState<{
    data: string;
    repeticoes: number;
    carga: number;
  } | null>(null);

  // ✅ ESTADOS PARA CRONÔMETROS
  const [dadosCronometroSerie, setDadosCronometroSerie] = useState<{
    intervalo: number;
  } | null>(null);

  const [dadosCronometroExercicio, setDadosCronometroExercicio] = useState<{
    intervalo: number;
    exercicioAtual: string;
    proximoExercicio: string;
  } | null>(null);

  // Estados temporários para inputs de série simples
  const [inputsSimples, setInputsSimples] = useState<Record<string, { repeticoes: string; carga: string; dropsetReps: string; dropsetCarga: string }>>({});
  // Estados temporários para inputs de série combinada
  const [inputsCombinada, setInputsCombinada] = useState<Record<string, { rep1: string; carga1: string; rep2: string; carga2: string }>>({});

  // Custom hook para debounce de callbacks
  function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number) {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cbRef = useRef(callback);
    cbRef.current = callback;

    const debounced = useCallback((...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        cbRef.current(...args);
      }, delay);
    }, [delay]);

    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
    return debounced;
  }

  // Funções debounce para atualizar valores de série simples
  const debouncedUpdateSimples = useDebouncedCallback((exIndex: number, sIndex: number, field: keyof SerieData, value: number) => {
    atualizarSerieExecutada(exIndex, sIndex, { [field]: value });
  }, 500);

  // Funções debounce para atualizar valores de série combinada
  const debouncedUpdateCombinada = useDebouncedCallback((exIndex: number, sIndex: number, field: string, value: number) => {
    atualizarSerieExecutada(exIndex, sIndex, { [field]: value });
  }, 500);

  // ✅ CRONÔMETRO DA SESSÃO
  useEffect(() => {
    const intervalo = setInterval(() => {
      setTempoSessao(prev => prev + 1);
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  // ✅ CARREGAR EXERCÍCIOS
  useEffect(() => {
    const carregarExercicios = async () => {
      if (!sessaoData?.treino_id) return;
      
      try {
        setLoading(true);
        
        const { data: exerciciosData, error } = await supabase
          .from('exercicios_rotina')
          .select(`
            id,
            exercicio_1,
            exercicio_2,
            ordem,
            intervalo_apos_exercicio,
            series (
              id,
              numero_serie,
              repeticoes,
              carga,
              repeticoes_1,
              carga_1,
              repeticoes_2,
              carga_2,
              tem_dropset,
              carga_dropset,
              intervalo_apos_serie
            )
          `)
          .eq('treino_id', sessaoData.treino_id)
          .order('ordem');

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

        setExercicios(exerciciosFormatados);
      } catch (error) {
        console.error('❌ Erro ao carregar exercícios:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarExercicios();
  }, [sessaoData?.treino_id]);

  // Função utilitária global para limpar IDs
  const limparId = (id: string) => id.replace(/[^a-zA-Z0-9\-]/g, '');

  // Função para verificar conexão com Supabase
  const verificarConexao = async () => {
    try {
      const { error } = await supabase.from('execucoes_series').select('id').limit(1);
      if (error) {
        console.error('Erro de conexão com o Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Erro de conexão:', err);
      return false;
    }
  };

  // ✅ FUNÇÃO verificarHistorico
  const verificarHistorico = useCallback(async (exercicioNome: string) => {
    try {
      if (!exercicioNome) return;
      const conexaoOk = await verificarConexao();
      if (!conexaoOk) return;

      const { data: exercicioData, error: exercError } = await supabase
        .from('exercicios_rotina')
        .select('id')
        .eq('exercicio_1', exercicioNome)
        .single();

      if (exercError || !exercicioData) {
        return;
      }

      const { data: sessoesData } = await supabase
        .from('execucoes_sessao')
        .select('id')
        .eq('aluno_id', limparId(sessaoData.aluno_id))
        .order('created_at', { ascending: false })
        .limit(1);
      const ultimaSessaoId = sessoesData?.[0]?.id || '';
      if (!ultimaSessaoId) {
        return;
      }

      const { data } = await supabase
        .from('execucoes_series')
        .select('*')
        .eq('exercicio_rotina_id', exercicioData.id)
        .eq('execucao_sessao_id', ultimaSessaoId);

      if (data && data.length > 0) {
        console.log('Dados do histórico:', {
          rep1: data[0]?.repeticoes_executadas_1,
          rep2: data[0]?.repeticoes_executadas_2,
          carga1: data[0]?.carga_executada_1,
          carga2: data[0]?.carga_executada_2,
          sessaoId: ultimaSessaoId
        });
      }
    } catch (error) {
      console.error('Erro ao verificar histórico:', error);
    }
  }, [sessaoData.aluno_id]);

  // Debounce no useEffect de histórico
  useEffect(() => {
    if (exercicios.length > 0 && exercicioAtual >= 0) {
      const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
        verificarHistorico(exercicios[exercicioAtual].exercicio_1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [exercicioAtual, exercicios, verificarHistorico]);

  // ✅ FUNÇÕES UTILITÁRIAS
  const formatarTempo = useCallback((segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const atualizarSerieExecutada = useCallback((exercicioIndex: number, serieIndex: number, dadosSerie: Partial<SerieData>) => {
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

  // ✅ FUNÇÃO COMPLETAR SÉRIE CORRIGIDA
  const completarSerie = useCallback((exercicioIndex: number, serieIndex: number) => {
    console.log('🔄 Completando série:', { exercicioIndex, serieIndex });
    console.log('📋 Total de exercícios:', exercicios.length);
    console.log('📋 Exercício atual:', exercicios[exercicioIndex]);
    console.log('📋 Total de séries neste exercício:', exercicios[exercicioIndex]?.series?.length);
    
    atualizarSerieExecutada(exercicioIndex, serieIndex, { executada: true });
    
    const exercicio = exercicios[exercicioIndex];
    const serie = exercicio.series[serieIndex];
    
    // ✅ Usar numero_serie ao invés de serieIndex para detectar última série
    const numerosSeries = exercicio.series.map(s => s.numero_serie).sort((a, b) => a - b);
    const maiorNumeroSerie = Math.max(...numerosSeries);
    const ehUltimaSerie = serie.numero_serie === maiorNumeroSerie;
    const ehUltimoExercicio = exercicioIndex === exercicios.length - 1;
    
    console.log('📊 Análise da série:', {
      exercicioNome: exercicio.exercicio_1,
      serieNumero: serie.numero_serie,
      serieIndex,
      totalSeries: exercicio.series.length,
      ehUltimaSerie,
      exercicioIndex, 
      totalExercicios: exercicios.length,
      ehUltimoExercicio,
      intervaloSerie: serie.intervalo_apos_serie,
      intervaloExercicio: exercicio.intervalo_apos_exercicio
    });
    
    if (!ehUltimaSerie) {
      // Não é a última série - mostrar cronômetro entre séries
      const intervaloSerie = serie.intervalo_apos_serie || 60; // Fallback de 60 segundos
      console.log('⏱️ Abrindo cronômetro entre séries:', intervaloSerie);
      setDadosCronometroSerie({
        intervalo: intervaloSerie
      });
      console.log('🔧 Abrindo modal intervaloSerie');
      setModalIntervaloSerie(true);
    } else if (!ehUltimoExercicio) {
      // É a última série mas não é o último exercício - mostrar cronômetro entre exercícios
      const intervaloExercicio = exercicio.intervalo_apos_exercicio || 120; // Fallback de 2 minutos
      const proximoExercicio = exercicios[exercicioIndex + 1];
      console.log('⏱️ Abrindo cronômetro entre exercícios:', {
        intervalo: intervaloExercicio,
        atual: exercicio.exercicio_1,
        proximo: proximoExercicio.exercicio_1
      });
      setDadosCronometroExercicio({
        intervalo: intervaloExercicio,
        exercicioAtual: exercicio.exercicio_1,
        proximoExercicio: proximoExercicio.exercicio_1
      });
      console.log('🔧 Abrindo modal intervaloExercicio');
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
    // Avançar para o próximo exercício
    setExercicioAtual(prev => prev + 1);
  }, []);

  // ✅ FUNÇÃO PARA SALVAR EXECUÇÃO DA SESSÃO
  const salvarExecucaoSessao = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('📊 Iniciando salvamento da sessão...');
      
      // 1. Criar registro na execucoes_sessao
      const dadosSessao = {
        rotina_id: sessaoData.rotina_id,
        treino_id: sessaoData.treino_id,
        aluno_id: sessaoData.aluno_id,
        sessao_numero: 1,
        data_execucao: new Date().toISOString().split('T')[0],
        status: 'concluida',
        tempo_total_minutos: Math.floor(tempoSessao / 60),
        observacoes: null
      };
      
      console.log('💾 Dados da sessão:', dadosSessao);
      
      const { data: sessaoExecucao, error: sessaoError } = await supabase
        .from('execucoes_sessao')
        .insert(dadosSessao)
        .select()
        .single();

      if (sessaoError) {
        console.error('❌ Erro ao salvar execução da sessão:', sessaoError);
        alert('Erro ao salvar sessão: ' + sessaoError.message);
        return false;
      }

      console.log('✅ Sessão salva:', sessaoExecucao.id);

      // 2. Preparar dados das séries executadas
      const execucoesSeries: any[] = [];
      
      exercicios.forEach((exercicio, exercicioIndex) => {
        exercicio.series.forEach((serie, serieIndex) => {
          if (serie.executada) {
            // ✅ Mapear corretamente os campos baseado na interface SerieData
            const dadosSerie = {
              execucao_sessao_id: sessaoExecucao.id,
              exercicio_rotina_id: exercicio.id,
              serie_numero: serie.numero_serie,
              // Série simples - usar os campos que existem na SerieData
              repeticoes_executadas_1: serie.repeticoes_executadas || null,
              carga_executada_1: serie.carga_executada || null,
              // Série combinada - verificar se são séries combinadas
              repeticoes_executadas_2: (serie.repeticoes_2 !== null && serie.repeticoes_2 !== undefined) ? serie.repeticoes_executadas : null,
              carga_executada_2: (serie.carga_2 !== null && serie.carga_2 !== undefined) ? serie.carga_executada : null,
              // Dropset
              carga_dropset: serie.carga_dropset_executada || null
            };
            
            console.log(`📝 Série ${serie.numero_serie} do exercício ${exercicio.exercicio_1}:`, dadosSerie);
            execucoesSeries.push(dadosSerie);
          }
        });
      });

      console.log('📊 Total de séries para salvar:', execucoesSeries.length);

      // 3. Salvar séries (se houver)
      if (execucoesSeries.length > 0) {
        const { error: seriesError } = await supabase
          .from('execucoes_series')
          .insert(execucoesSeries);

        if (seriesError) {
          console.error('❌ Erro ao salvar execução das séries:', seriesError);
          console.error('❌ Dados que causaram erro:', execucoesSeries);
          alert('Erro ao salvar séries: ' + seriesError.message);
          return false;
        }

        console.log('✅ Séries salvas com sucesso!');
      } else {
        console.warn('⚠️ Nenhuma série executada para salvar');
      }

      return true;
    } catch (error) {
      console.error('❌ Erro geral ao salvar execução:', error);
      alert('Erro inesperado ao salvar: ' + String(error));
      return false;
    } finally {
      setLoading(false);
    }
  }, [exercicios, sessaoData, tempoSessao]);

  const finalizarSessao = useCallback(async () => {
    console.log('🚀 Iniciando finalização da sessão...');
    console.log('📊 Estado atual dos exercícios:', exercicios);
    
    // Verificar quais séries estão marcadas como executadas
    let totalSeriesExecutadas = 0;
    exercicios.forEach((exercicio, exIndex) => {
      exercicio.series.forEach((serie, sIndex) => {
        if (serie.executada) {
          totalSeriesExecutadas++;
          console.log(`✅ Série executada encontrada: Ex${exIndex+1} Serie${serie.numero_serie}`, {
            repeticoes_executadas: serie.repeticoes_executadas,
            carga_executada: serie.carga_executada,
            dropset: serie.carga_dropset_executada
          });
        }
      });
    });
    
    console.log(`📈 Total de séries executadas: ${totalSeriesExecutadas}`);
    
    if (totalSeriesExecutadas === 0) {
      alert('Nenhuma série foi executada! Execute pelo menos uma série antes de finalizar.');
      return;
    }
    
    const sucesso = await salvarExecucaoSessao();
    if (sucesso) {
      console.log('🎉 Sessão finalizada com sucesso!');
      onSessaoFinalizada();
    } else {
      console.error('❌ Erro ao finalizar sessão');
    }
  }, [salvarExecucaoSessao, onSessaoFinalizada, exercicios]);

  // ✅ FUNÇÕES DE RENDERIZAÇÃO
  const renderSerieSimples = useCallback((serie: SerieData, index: number, exercicioIndex: number) => {
    const key = `${exercicioIndex}-${index}`;
    const temp = inputsSimples[key] || { repeticoes: '', carga: '', dropsetReps: '', dropsetCarga: '' };
    return (
      <View 
        key={`serie-${index}`} 
        style={[
          styles.serieCard,
          serie.executada && styles.serieExecutada,
          serie.tem_dropset && styles.serieComDropset
        ]}
      >
        <View style={styles.serieHeader}>
          <Text style={styles.serieNumero}>Série {serie.numero_serie}</Text>
          <View style={styles.serieInfo}>
            <Text style={styles.seriePlanejada}>
              {serie.repeticoes} x {serie.carga}kg
            </Text>
            {serie.tem_dropset && (
              <Text style={styles.dropsetBadgeText}>• DROPSET</Text>
            )}
          </View>
        </View>

        <View style={styles.serieInputs}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Repetições executadas</Text>
            <TextInput
              style={styles.input}
              value={temp.repeticoes}
              onChangeText={(text) => {
                setInputsSimples((prev) => ({ ...prev, [key]: { ...temp, repeticoes: text } }));
                debouncedUpdateSimples(exercicioIndex, index, 'repeticoes_executadas', parseInt(text) || 0);
              }}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Carga executada (kg)</Text>
            <TextInput
              style={styles.input}
              value={temp.carga}
              onChangeText={(text) => {
                setInputsSimples((prev) => ({ ...prev, [key]: { ...temp, carga: text } }));
                debouncedUpdateSimples(exercicioIndex, index, 'carga_executada', parseInt(text) || 0);
              }}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        </View>

        {serie.tem_dropset && (
          <View style={styles.dropsetSection}>
            <View style={styles.dropsetHeader}>
              <Text style={styles.dropsetLabel}>Dropset</Text>
              <Text style={styles.dropsetInfo}>
                {serie.repeticoes} x {serie.carga_dropset}kg
              </Text>
            </View>
            
            <View style={styles.serieInputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Repetições dropset</Text>
                <TextInput
                  style={[styles.input, styles.inputDropset]}
                  value={temp.dropsetReps}
                  onChangeText={(text) => {
                    setInputsSimples((prev) => ({ ...prev, [key]: { ...temp, dropsetReps: text } }));
                    debouncedUpdateSimples(exercicioIndex, index, 'repeticoes_dropset_executadas', parseInt(text) || 0);
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Carga dropset (kg)</Text>
                <TextInput
                  style={[styles.input, styles.inputDropset]}
                  value={temp.dropsetCarga}
                  onChangeText={(text) => {
                    setInputsSimples((prev) => ({ ...prev, [key]: { ...temp, dropsetCarga: text } }));
                    debouncedUpdateSimples(exercicioIndex, index, 'carga_dropset_executada', parseInt(text) || 0);
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.marcarSerieButton, serie.executada && styles.marcarSerieButtonCompleto]}
          onPress={() => completarSerie(exercicioIndex, index)}
        >
          <Text style={styles.marcarSerieButtonText}>
            {serie.executada ? 'Série Finalizada' : 'Finalizar Série'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [inputsSimples, debouncedUpdateSimples, setInputsSimples, completarSerie]);

  const renderSerieCombinada = useCallback((serie: SerieData, index: number, exercicioIndex: number) => {
    const key = `${exercicioIndex}-${index}`;
    const temp = inputsCombinada[key] || { rep1: '', carga1: '', rep2: '', carga2: '' };
    return (
      <View 
        key={`serie-combinada-${index}`}
        style={styles.serieCombinadaContainer}
      >
        <View style={styles.exercicioCombinadoItem}>
          <Text style={styles.exercicioCombinadoNome}>{exercicios[exercicioIndex]?.exercicio_1}</Text>
          <View style={styles.serieInputs}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Repetições</Text>
              <TextInput
                style={styles.input}
                value={temp.rep1}
                onChangeText={(text) => {
                  setInputsCombinada((prev) => ({ ...prev, [key]: { ...temp, rep1: text } }));
                  debouncedUpdateCombinada(exercicioIndex, index, 'repeticoes_executadas', parseInt(text) || 0);
                }}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Carga (kg)</Text>
              <TextInput
                style={styles.input}
                value={temp.carga1}
                onChangeText={(text) => {
                  setInputsCombinada((prev) => ({ ...prev, [key]: { ...temp, carga1: text } }));
                  debouncedUpdateCombinada(exercicioIndex, index, 'carga_executada', parseInt(text) || 0);
                }}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
        </View>

        <View style={styles.exercicioCombinadoItem}>
          <Text style={styles.exercicioCombinadoNome}>{exercicios[exercicioIndex]?.exercicio_2}</Text>
          <View style={styles.serieInputs}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Repetições</Text>
              <TextInput
                style={styles.input}
                value={temp.rep2}
                onChangeText={(text) => {
                  setInputsCombinada((prev) => ({ ...prev, [key]: { ...temp, rep2: text } }));
                  debouncedUpdateCombinada(exercicioIndex, index, 'repeticoes_2', parseInt(text) || 0);
                }}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Carga (kg)</Text>
              <TextInput
                style={styles.input}
                value={temp.carga2}
                onChangeText={(text) => {
                  setInputsCombinada((prev) => ({ ...prev, [key]: { ...temp, carga2: text } }));
                  debouncedUpdateCombinada(exercicioIndex, index, 'carga_2', parseInt(text) || 0);
                }}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.marcarSerieButton, serie.executada && styles.marcarSerieButtonCompleto]}
          onPress={() => completarSerie(exercicioIndex, index)}
        >
          <Text style={styles.marcarSerieButtonText}>
            {serie.executada ? 'Série Finalizada' : 'Finalizar Série'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [inputsCombinada, debouncedUpdateCombinada, setInputsCombinada, completarSerie, exercicios]);

  // ✅ LOADING
  if (loading) {
    return (
      <View style={styles.carregandoContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.carregandoTexto}>Carregando exercícios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ HEADER CORRIGIDO */}
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
        <Text style={styles.tempoSessao}>{formatarTempo(tempoSessao)}</Text>
      </View>

      {/* SCROLL VIEW DOS EXERCÍCIOS */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {exercicios.map((exercicio, exIndex) => (
          <View key={`exercicio-${exIndex}`} style={styles.exercicioContainer}>
            <Text style={styles.exercicioTitulo}>{exercicio.exercicio_1}</Text>
            {exercicio.series.map((serie, sIndex) => {
              if (serie.repeticoes_2 !== null && serie.repeticoes_2 !== undefined) {
                return renderSerieCombinada(serie, sIndex, exIndex);
              }
              return renderSerieSimples(serie, sIndex, exIndex);
            })}
          </View>
        ))}
      </ScrollView>

      {/* ✅ CRONÔMETROS COM ESTADOS SIMPLES */}
      <CronometroSerie
        visible={modalIntervaloSerie}
        onClose={() => {
          console.log('🔧 Fechando cronômetro série');
          setModalIntervaloSerie(false);
        }}
        onComplete={handleCronometroSerieComplete}
        intervaloSerie={dadosCronometroSerie?.intervalo || null}
      />

      <CronometroExercicio
        visible={modalIntervaloExercicio}
        onClose={() => {
          console.log('🔧 Fechando cronômetro exercício');
          setModalIntervaloExercicio(false);
        }}
        onComplete={handleCronometroExercicioComplete}
        intervaloExercicio={dadosCronometroExercicio?.intervalo || null}
        exercicioAtual={dadosCronometroExercicio?.exercicioAtual || ''}
        proximoExercicio={dadosCronometroExercicio?.proximoExercicio || ''}
      />

      {/* MODAL DE HISTÓRICO */}
      <Modal
        visible={modalHistoricoVisible}
        animationType="slide"
        transparent
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalConteudo}>
            <Text style={styles.modalTitulo}>Histórico de Execução</Text>
            {historicoExercicio ? (
              <View style={styles.historicoContainer}>
                <Text style={styles.historicoData}>{historicoExercicio.data}</Text>
                <Text style={styles.historicoRepeticoes}>
                  Repetições: {historicoExercicio.repeticoes}
                </Text>
                <Text style={styles.historicoCarga}>
                  Carga: {historicoExercicio.carga} kg
                </Text>
              </View>
            ) : (
              <Text style={styles.semHistoricoTexto}>
                Nenhum histórico encontrado para este exercício.
              </Text>
            )}
            <TouchableOpacity
              style={styles.fecharModalButton}
              onPress={() => setModalHistoricoVisible(false)}
            >
              <Text style={styles.fecharModalButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BOTÃO FINALIZAR SESSÃO */}
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

// ✅ STYLES LIMPOS COM PALETA AZUL/CINZA
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
  exercicioTitulo: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 12
  },
  serieCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  serieExecutada: {
    backgroundColor: '#F3F4F6',
    borderColor: '#3B82F6',
    borderWidth: 2
  },
  serieComDropset: {
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderStyle: 'dashed'
  },
  serieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  serieNumero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151'
  },
  serieInfo: {
    alignItems: 'flex-end'
  },
  seriePlanejada: {
    fontSize: 14,
    color: '#6B7280'
  },
  dropsetBadge: {
    marginTop: 4
  },
  dropsetBadgeText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: 'bold'
  },
  serieInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  inputGroup: {
    flex: 1,
    marginRight: 8
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    fontWeight: '500'
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 16,
    color: '#374151'
  },
  dropsetSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  dropsetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  dropsetLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151'
  },
  dropsetInfo: {
    fontSize: 14,
    color: '#3B82F6'
  },
  marcarSerieButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16
  },
  marcarSerieButtonCompleto: {
    backgroundColor: '#6B7280'
  },
  marcarSerieButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalConteudo: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16
  },
  historicoContainer: {
    marginBottom: 16
  },
  historicoData: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8
  },
  historicoRepeticoes: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151'
  },
  historicoCarga: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151'
  },
  semHistoricoTexto: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16
  },
  fecharModalButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center'
  },
  fecharModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
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
  inputDropset: {
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  serieCombinadaContainer: {
    marginVertical: 12,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exercicioCombinadoItem: {
    marginBottom: 12,
  },
  exercicioCombinadoNome: {
    fontWeight: '600',
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
});
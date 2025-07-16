// components/execucao/shared/ExercicioHistoricoModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  EXERCICIO_CONSTANTS,
  HISTORICO_FORMAT,
  MENSAGENS
} from '../../../constants/exercicio.constants';
import { supabase } from '../../../lib/supabase';
import { exercicioUtils } from '../../../utils/exercicio.utils';

interface HistoricoSessao {
  data: string;
  series: HistoricoSerie[];
}

interface HistoricoSerie {
  numero_serie: number;
  repeticoes_executadas_1: number;
  carga_executada_1: number;
  repeticoes_executadas_2?: number;
  carga_executada_2?: number;
  carga_dropset?: number;
  tem_dropset?: boolean;
}

interface Props {
  visible: boolean;
  exercicioNome: string;
  treinoId: string;
  alunoId: string;
  onClose: () => void;
}

export default function ExercicioHistoricoModal({
  visible,
  exercicioNome,
  treinoId,
  alunoId,
  onClose
}: Props) {
  const [historico, setHistorico] = useState<HistoricoSessao[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Carregar histórico do exercício específico do treino
  const carregarHistorico = useCallback(async () => {
    if (!exercicioNome || !treinoId || !alunoId) return;

    try {
      setLoading(true);
      console.log('🔍 Carregando histórico:', { exercicioNome, treinoId, alunoId });

      // Query para buscar execuções do exercício específico no treino específico
      // 
      // ⚠️ IMPORTANTE: Usamos OR para cobrir dois cenários:
      // 1. Série Simples: exercicio só está em exercicio_1
      //    Exemplo: exercicio_1="Supino", exercicio_2=null
      // 
      // 2. Série Combinada: exercicio pode estar em exercicio_1 OU exercicio_2  
      //    Exemplo: exercicio_1="Supino", exercicio_2="Flexão"
      //    - Se buscar "Supino" → encontra em exercicio_1
      //    - Se buscar "Flexão" → encontra em exercicio_2
      const { data: execucoes, error } = await supabase
        .from('execucoes_series')
        .select(`
          serie_numero,
          repeticoes_executadas_1,
          carga_executada_1,
          repeticoes_executadas_2,
          carga_executada_2,
          carga_dropset,
          execucoes_sessao!inner(
            data_execucao,
            treino_id,
            aluno_id
          ),
          exercicios_rotina!inner(
            exercicio_1,
            exercicio_2
          )
        `)
        .eq('execucoes_sessao.treino_id', treinoId)
        .eq('execucoes_sessao.aluno_id', exercicioUtils.limparId(alunoId))
        .or(`exercicio_1.eq.${exercicioNome},exercicio_2.eq.${exercicioNome}`, { foreignTable: 'exercicios_rotina' })
        .order('execucoes_sessao(data_execucao)', { ascending: false })
        .limit(EXERCICIO_CONSTANTS.LIMITE_SESSOES_HISTORICO * 10); // Buffer para múltiplas séries

      if (error) {
        console.error('❌ Erro ao carregar histórico:', error);
        return;
      }

      if (!execucoes || execucoes.length === 0) {
        console.log('⚠️ Nenhum histórico encontrado');
        setHistorico([]);
        return;
      }

      // Agrupar por data de execução
      const historicoAgrupado = execucoes.reduce((acc: any, execucao: any) => {
        const data = execucao.execucoes_sessao.data_execucao;
        const dataFormatada = new Date(data).toLocaleDateString('pt-BR');
        
        if (!acc[dataFormatada]) {
          acc[dataFormatada] = {
            data: dataFormatada,
            series: []
          };
        }

        // Verificar se tem dropset
        const temDropset = execucao.carga_dropset !== null;

        acc[dataFormatada].series.push({
          numero_serie: execucao.serie_numero,
          repeticoes_executadas_1: execucao.repeticoes_executadas_1,
          carga_executada_1: execucao.carga_executada_1,
          repeticoes_executadas_2: execucao.repeticoes_executadas_2,
          carga_executada_2: execucao.carga_executada_2,
          carga_dropset: execucao.carga_dropset,
          tem_dropset: temDropset
        });

        return acc;
      }, {});

      // Converter para array e ordenar séries
      const historicoArray = Object.values(historicoAgrupado).map((sessao: any) => ({
        ...sessao,
        series: sessao.series.sort((a: any, b: any) => a.numero_serie - b.numero_serie)
      }));

      // Limitar às últimas sessões
      const historicoLimitado = historicoArray.slice(0, EXERCICIO_CONSTANTS.LIMITE_SESSOES_HISTORICO);
      
      setHistorico(historicoLimitado);
      console.log('✅ Histórico carregado:', historicoLimitado.length, 'sessões');
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  }, [exercicioNome, treinoId, alunoId]);

  // Carregar quando modal abrir
  useEffect(() => {
    if (visible && exercicioNome && treinoId && alunoId) {
      carregarHistorico();
    }
  }, [visible, exercicioNome, treinoId, alunoId, carregarHistorico]);

  // ✅ Formatar série individual
  const formatarSerie = (serie: HistoricoSerie): string => {
    const ehCombinada = serie.repeticoes_executadas_2 !== null && serie.repeticoes_executadas_2 !== undefined;
    
    if (ehCombinada) {
      // Série combinada
      const peso2 = serie.carga_executada_2 === 0 ? HISTORICO_FORMAT.PESO_CORPORAL : `${serie.carga_executada_2}kg`;
      return `${HISTORICO_FORMAT.ICONE_COMBINADA} ${serie.repeticoes_executadas_1}×${serie.carga_executada_1}kg ${HISTORICO_FORMAT.SEPARADOR_COMBINADA} ${serie.repeticoes_executadas_2}×${peso2}`;
    } else if (serie.tem_dropset && serie.carga_dropset) {
      // Série com dropset
      return `${serie.repeticoes_executadas_1}×${serie.carga_executada_1}kg ${HISTORICO_FORMAT.SETA_DROPSET} ${HISTORICO_FORMAT.ICONE_DROPSET} ${serie.carga_dropset}kg (${MENSAGENS.ATE_FALHA})`;
    } else {
      // Série simples
      if (serie.carga_executada_1 === 0) {
        return `${serie.repeticoes_executadas_1}×${HISTORICO_FORMAT.PESO_CORPORAL}`;
      }
      return `${serie.repeticoes_executadas_1}×${serie.carga_executada_1}kg`;
    }
  };

  // ✅ Calcular progresso entre sessões
  const calcularProgresso = (sessaoAtual: HistoricoSessao, sessaoAnterior?: HistoricoSessao) => {
    if (!sessaoAnterior) return null;

    // Comparar a carga média das séries principais (ignorando dropsets)
    const cargaMediaAtual = sessaoAtual.series.reduce((acc, serie) => acc + (serie.carga_executada_1 || 0), 0) / sessaoAtual.series.length;
    const cargaMediaAnterior = sessaoAnterior.series.reduce((acc, serie) => acc + (serie.carga_executada_1 || 0), 0) / sessaoAnterior.series.length;
    
    const diferenca = cargaMediaAtual - cargaMediaAnterior;
    
    if (diferenca > 0) {
      return { tipo: 'positivo', valor: diferenca };
    } else if (diferenca < 0) {
      return { tipo: 'negativo', valor: Math.abs(diferenca) };
    }
    return { tipo: 'neutro', valor: 0 };
  };

  // ✅ Ícone de progresso
  const getIconeProgresso = (tipo: string) => {
    switch (tipo) {
      case 'positivo': return HISTORICO_FORMAT.ICONE_PROGRESSO_POSITIVO;
      case 'negativo': return HISTORICO_FORMAT.ICONE_PROGRESSO_NEGATIVO;
      case 'neutro': return HISTORICO_FORMAT.ICONE_PROGRESSO_NEUTRO;
      default: return HISTORICO_FORMAT.ICONE_SESSAO_BASE;
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {exercicioNome} - {MENSAGENS.TITULO_HISTORICO}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Conteúdo */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>{MENSAGENS.CARREGANDO_HISTORICO}</Text>
            </View>
          ) : historico.length > 0 ? (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {historico.map((sessao, index) => {
                const progresso = calcularProgresso(sessao, historico[index + 1]);
                
                return (
                  <View key={sessao.data} style={styles.sessaoContainer}>
                    {/* Header da sessão */}
                    <View style={styles.sessaoHeader}>
                      <View style={styles.dataContainer}>
                        <Text style={styles.iconeProgresso}>
                          {getIconeProgresso(progresso?.tipo || 'base')}
                        </Text>
                        <Text style={styles.dataTexto}>{sessao.data}</Text>
                      </View>
                      
                      {progresso && progresso.valor > 0 && (
                        <View style={[
                          styles.progressoBadge,
                          { backgroundColor: progresso.tipo === 'positivo' ? '#10B981' : '#EF4444' }
                        ]}>
                          <Text style={styles.progressoTexto}>
                            {progresso.tipo === 'positivo' ? '+' : '-'}{progresso.valor.toFixed(1)}kg {progresso.tipo === 'positivo' ? '↗' : '↘'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Séries da sessão */}
                    <View style={styles.seriesContainer}>
                      {sessao.series.map((serie, serieIndex) => (
                        <Text key={serieIndex} style={styles.serieTexto}>
                          {formatarSerie(serie)}
                        </Text>
                      ))}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name={HISTORICO_FORMAT.ICONE_HISTORICO} size={60} color="#9CA3AF" />
              <Text style={styles.emptyText}>{MENSAGENS.SEM_HISTORICO_TREINO}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  sessaoContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sessaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconeProgresso: {
    fontSize: 16,
    marginRight: 8,
  },
  dataTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  progressoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressoTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  seriesContainer: {
    gap: 4,
  },
  serieTexto: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
});
// hooks/useExercicioExecucao.ts
import { useCallback, useEffect, useState } from 'react';
import { MENSAGENS } from '../constants/exercicio.constants';
import { supabase } from '../lib/supabase';
import { ExercicioData, SerieData, SessaoData } from '../types/exercicio.types';
import { exercicioUtils } from '../utils/exercicio.utils';

export const useExercicioExecucao = (sessaoData: SessaoData) => {
  const [exercicios, setExercicios] = useState<ExercicioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempoSessao, setTempoSessao] = useState(0);

  // Cronômetro da sessão
  useEffect(() => {
    const intervalo = setInterval(() => {
      setTempoSessao(prev => prev + 1);
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  // Carregar exercícios
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
          throw new Error(`Erro ao carregar exercícios: ${error.message}`);
        }

        if (!exerciciosData || exerciciosData.length === 0) {
          setExercicios([]);
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
        alert(MENSAGENS.ERRO_CARREGAR_EXERCICIOS);
      } finally {
        setLoading(false);
      }
    };

    carregarExercicios();
  }, [sessaoData?.treino_id]);

  const atualizarSerieExecutada = useCallback((
    exercicioIndex: number, 
    serieIndex: number, 
    dadosSerie: Partial<SerieData>
  ) => {
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

  const salvarExecucaoCompleta = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Verificar se há séries executadas
      const totalSeriesExecutadas = exercicioUtils.contarSeriesExecutadas(exercicios);
      if (totalSeriesExecutadas === 0) {
        alert(MENSAGENS.NENHUMA_SERIE_EXECUTADA);
        return false;
      }

      // Preparar dados da sessão
      const dadosSessao = exercicioUtils.prepararDadosSessao(sessaoData, tempoSessao);
      
      // Salvar sessão
      const { data: sessaoExecucao, error: sessaoError } = await supabase
        .from('execucoes_sessao')
        .insert(dadosSessao)
        .select()
        .single();

      if (sessaoError) {
        throw new Error(`Erro ao salvar execução da sessão: ${sessaoError.message}`);
      }

      // Preparar e salvar séries
      const execucoesSeries = exercicioUtils.prepararDadosExecucaoSeries(exercicios, sessaoExecucao.id);
      
      if (execucoesSeries.length > 0) {
        const { error: seriesError } = await supabase
          .from('execucoes_series')
          .insert(execucoesSeries);

        if (seriesError) {
          throw new Error(`Erro ao salvar execução das séries: ${seriesError.message}`);
        }
      }

      console.log('✅ Sessão salva com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar execução:', error);
      alert(`Erro ao salvar: ${error}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [exercicios, sessaoData, tempoSessao]);

  return {
    exercicios,
    loading,
    tempoSessao,
    atualizarSerieExecutada,
    salvarExecucaoCompleta,
  };
};
// hooks/exercicios/useSeriesManager.ts
import { useCallback } from 'react';
import {
    DropSetConfig,
    ExercicioRotinaLocal,
    ExerciciosPorTreino,
    SerieConfig
} from '../../types/exercicio.types';

interface UseSeriesManagerProps {
  exerciciosAdicionados: ExerciciosPorTreino;
  setExerciciosAdicionados: (exercicios: ExerciciosPorTreino | ((prev: ExerciciosPorTreino) => ExerciciosPorTreino)) => void;
}

export const useSeriesManager = ({ 
  exerciciosAdicionados, 
  setExerciciosAdicionados 
}: UseSeriesManagerProps) => {

  // ====================================
  // HELPER: ENCONTRAR E ATUALIZAR EXERCÍCIO
  // ====================================
  const atualizarExercicioNoTreino = useCallback((
    treinoId: string, 
    exercicioId: string, 
    atualizador: (exercicio: ExercicioRotinaLocal) => ExercicioRotinaLocal
  ) => {
    setExerciciosAdicionados(prev => {
      const exerciciosDoTreino = prev[treinoId] || [];
      
      const exerciciosAtualizados = exerciciosDoTreino.map(exercicio => 
        exercicio.id === exercicioId ? atualizador(exercicio) : exercicio
      );

      return {
        ...prev,
        [treinoId]: exerciciosAtualizados
      };
    });
  }, [setExerciciosAdicionados]);

  // ====================================
  // GERENCIAMENTO DE SÉRIES
  // ====================================
  const adicionarSerie = useCallback((treinoId: string, exercicioId: string) => {
    console.log('➕ Adicionando série ao exercício:', exercicioId);
    
    atualizarExercicioNoTreino(treinoId, exercicioId, (exercicio) => {
      const novaSerie: SerieConfig = {
        id: `serie-${exercicio.series.length + 1}-${Date.now()}`,
        numero: exercicio.series.length + 1,
        numero_serie: exercicio.series.length + 1,
        repeticoes: 12,
        carga: 0,
        intervaloAposSerie: 90, // Corrigido para 90 segundos
        // Para séries combinadas - valores padrão
        ...(exercicio.tipo === 'combinada' && {
          repeticoes_1: 12,
          carga_1: 0,
          repeticoes_2: 12,
          carga_2: 0
        })
      };

      console.log('✅ Nova série criada:', novaSerie);
      
      return {
        ...exercicio,
        series: [...exercicio.series, novaSerie]
      };
    });
  }, [atualizarExercicioNoTreino]);

  const removerSerie = useCallback((treinoId: string, exercicioId: string, serieId: string) => {
    console.log('➖ Removendo série:', serieId);
    
    atualizarExercicioNoTreino(treinoId, exercicioId, (exercicio) => {
      if (exercicio.series.length <= 1) {
        console.log('⚠️ Não é possível remover a única série');
        return exercicio;
      }

      const seriesAtualizadas = exercicio.series
        .filter(s => s.id !== serieId)
        .map((serie, index) => ({ 
          ...serie, 
          numero: index + 1,
          numero_serie: index + 1 
        }));

      return {
        ...exercicio,
        series: seriesAtualizadas
      };
    });
  }, [atualizarExercicioNoTreino]);

  // ====================================
  // ATUALIZAÇÃO DE SÉRIES SIMPLES
  // ====================================
  const atualizarSerie = useCallback((
    treinoId: string, 
    exercicioId: string, 
    serieId: string, 
    campo: keyof SerieConfig, 
    valor: any
  ) => {
    console.log('🔄 Atualizando série simples:', serieId, campo, '=', valor);
    
    atualizarExercicioNoTreino(treinoId, exercicioId, (exercicio) => {
      const seriesAtualizadas = exercicio.series.map(serie =>
        serie.id === serieId ? { ...serie, [campo]: valor } : serie
      );

      return {
        ...exercicio,
        series: seriesAtualizadas
      };
    });
  }, [atualizarExercicioNoTreino]);

  // ====================================
  // 🔥 CORREÇÃO DO BUG: SÉRIES COMBINADAS
  // ====================================
  const atualizarSerieCombinada = useCallback((
    treinoId: string,
    exercicioId: string,
    serieId: string,
    exercicioIndex: 0 | 1, // 0 para primeiro exercício, 1 para segundo
    campo: 'repeticoes' | 'carga',
    valor: number
  ) => {
    console.log('🔗 Atualizando série combinada:', serieId, `exercicio_${exercicioIndex + 1}`, campo, '=', valor);
    
    atualizarExercicioNoTreino(treinoId, exercicioId, (exercicio) => {
      const seriesAtualizadas = exercicio.series.map(serie => {
        if (serie.id === serieId) {
          // Definir qual campo atualizar baseado no exercício
          const campoAtualizar = exercicioIndex === 0 
            ? `${campo}_1` as keyof SerieConfig
            : `${campo}_2` as keyof SerieConfig;

          return {
            ...serie,
            [campoAtualizar]: valor
          };
        }
        return serie;
      });

      return {
        ...exercicio,
        series: seriesAtualizadas
      };
    });
  }, [atualizarExercicioNoTreino]);

  // ====================================
  // GERENCIAMENTO DE DROP SETS
  // ====================================
  const toggleDropSet = useCallback((treinoId: string, exercicioId: string, serieId: string) => {
    console.log('🔥 Toggle Drop Set para série:', serieId);
    
    atualizarExercicioNoTreino(treinoId, exercicioId, (exercicio) => {
      const seriesAtualizadas = exercicio.series.map(serie => {
        if (serie.id === serieId) {
          const novoDropSet = !serie.isDropSet;
          
          return {
            ...serie,
            isDropSet: novoDropSet,
            tem_dropset: novoDropSet,
            dropsConfig: novoDropSet ? [
              {
                id: `drop-1-${Date.now()}`,
                cargaReduzida: Math.max(0, (serie.carga || 0) * 0.8),
                repeticoes: 8
              }
            ] : [],
            // Para compatibilidade com o banco
            carga_dropset: novoDropSet ? Math.max(0, (serie.carga || 0) * 0.8) : undefined
          };
        }
        return serie;
      });

      return {
        ...exercicio,
        series: seriesAtualizadas
      };
    });
  }, [atualizarExercicioNoTreino]);

  const atualizarDropSet = useCallback((
    treinoId: string, 
    exercicioId: string, 
    serieId: string, 
    campo: 'repeticoes' | 'cargaReduzida', 
    valor: number
  ) => {
    console.log('🔥 Atualizando Drop Set:', serieId, campo, '=', valor);
    
    atualizarExercicioNoTreino(treinoId, exercicioId, (exercicio) => {
      const seriesAtualizadas = exercicio.series.map(serie => {
        if (serie.id === serieId && serie.dropsConfig?.[0]) {
          const dropAtualizado: DropSetConfig = {
            ...serie.dropsConfig[0],
            [campo]: valor
          };

          return {
            ...serie,
            dropsConfig: [dropAtualizado],
            // Sincronizar com campo do banco
            ...(campo === 'cargaReduzida' && { carga_dropset: valor })
          };
        }
        return serie;
      });

      return {
        ...exercicio,
        series: seriesAtualizadas
      };
    });
  }, [atualizarExercicioNoTreino]);

  // ====================================
  // INTERVALOS
  // ====================================
  const atualizarIntervaloExercicio = useCallback((
    treinoId: string, 
    exercicioId: string, 
    intervalo: number
  ) => {
    console.log('⏱️ Atualizando intervalo do exercício:', exercicioId, '=', intervalo);
    
    atualizarExercicioNoTreino(treinoId, exercicioId, (exercicio) => ({
      ...exercicio,
      intervaloAposExercicio: intervalo
    }));
  }, [atualizarExercicioNoTreino]);

  // ====================================
  // HELPERS DE VALIDAÇÃO
  // ====================================
  const validarSerie = useCallback((serie: SerieConfig): string[] => {
    const erros: string[] = [];
    
    if (!serie.repeticoes || serie.repeticoes < 1) {
      erros.push('Repetições deve ser maior que 0');
    }
    
    if (serie.carga !== undefined && serie.carga < 0) {
      erros.push('Carga não pode ser negativa');
    }

    if (serie.isDropSet && serie.dropsConfig?.[0]) {
      const drop = serie.dropsConfig[0];
      if (drop.cargaReduzida < 0) {
        erros.push('Carga do dropset não pode ser negativa');
      }
      if (drop.cargaReduzida >= (serie.carga || 0)) {
        erros.push('Carga do dropset deve ser menor que a carga principal');
      }
    }

    return erros;
  }, []);

  const obterEstatisticasSeries = useCallback((treinoId: string, exercicioId: string) => {
    const exercicios = exerciciosAdicionados[treinoId] || [];
    const exercicio = exercicios.find(ex => ex.id === exercicioId);
    
    if (!exercicio) return null;

    const totalSeries = exercicio.series.length;
    const seriesComDropset = exercicio.series.filter(s => s.isDropSet).length;
    const cargaMedia = exercicio.series.reduce((acc, s) => acc + (s.carga || 0), 0) / totalSeries;

    return {
      totalSeries,
      seriesComDropset,
      cargaMedia: isNaN(cargaMedia) ? 0 : cargaMedia,
      tipo: exercicio.tipo
    };
  }, [exerciciosAdicionados]);

  return {
    // Séries básicas
    adicionarSerie,
    removerSerie,
    atualizarSerie,
    
    // Séries combinadas (FIX do bug)
    atualizarSerieCombinada,
    
    // Drop sets
    toggleDropSet,
    atualizarDropSet,
    
    // Intervalos
    atualizarIntervaloExercicio,
    
    // Helpers
    validarSerie,
    obterEstatisticasSeries
  };
};
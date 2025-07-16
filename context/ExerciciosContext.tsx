// context/ExerciciosContext.tsx - VERSÃO COM DEBUG E USEMEMO
import React, { createContext, useContext, useMemo } from 'react';
import { useExerciciosModal } from '../hooks/exercicios/useExerciciosModal';
import { useExerciciosStorage } from '../hooks/exercicios/useExerciciosStorage';
import { useSeriesManager } from '../hooks/exercicios/useSeriesManager';
import { FiltrosExercicio, SerieConfig } from '../types/exercicio.types';

// ====================================
// TIPOS SIMPLES
// ====================================
interface ExerciciosContextValue {
  // Storage e dados
  exerciciosAdicionados: any;
  treinos: any[];
  config: any;
  isLoaded: boolean;
  dadosCompletos: any;
  totalExercicios: number;
  treinosComExercicios: any[];
  treinosSemExercicios: any[];
  isFormValido: boolean;

  // Ações de exercícios
  adicionarExercicio: (treinoId: string, exercicio: any) => void;
  removerExercicio: (treinoId: string, exercicioId: string) => void;
  atualizarExercicio: (treinoId: string, exercicioId: string, exercicio: any) => void;
  limparExercicios: () => void;

  // Gerenciamento de séries
  adicionarSerie: (treinoId: string, exercicioId: string) => void;
  removerSerie: (treinoId: string, exercicioId: string, serieId: string) => void;
  atualizarSerie: (treinoId: string, exercicioId: string, serieId: string, campo: keyof SerieConfig, valor: any) => void;
  atualizarSerieCombinada: (treinoId: string, exercicioId: string, serieId: string, exercicioIndex: 0 | 1, campo: 'repeticoes' | 'carga', valor: number) => void;
  toggleDropSet: (treinoId: string, exercicioId: string, serieId: string) => void;
  atualizarDropSet: (treinoId: string, exercicioId: string, serieId: string, campo: 'repeticoes' | 'cargaReduzida', valor: number) => void;
  atualizarIntervaloExercicio: (treinoId: string, exercicioId: string, intervalo: number) => void;

  // Modal de exercícios
  isModalOpen: boolean;
  treinoSelecionado: string;
  gruposFiltro: string[];
  loading: boolean;
  exerciciosDisponiveis: any[];
  exerciciosFiltrados: any[];
  filtros: any;
  atualizarFiltro: <T extends keyof FiltrosExercicio>(campo: T, valor: FiltrosExercicio[T]) => void;
  tipoSerie: 'simples' | 'combinada';
  setTipoSerie: (tipo: 'simples' | 'combinada') => void;
  exerciciosSelecionados: any[];
  toggleExercicioSelecionado: (exercicio: any) => void;
  limparSelecao: () => void;
  abrirModal: (treinoId: string, grupos: string[]) => void;
  fecharModal: () => void;
  criarExercicioSimples: (exercicio: any) => any;
  criarExercicioCombinado: (exercicios: any[]) => any;
  podeSelecionarExercicio: (exercicio: any) => boolean;
  isSelecaoValida: () => boolean;

  // Helpers
  validarSerie: (serie: any) => string[];
  obterEstatisticasSeries: (treinoId: string, exercicioId: string) => any;
}

// ====================================
// CRIAÇÃO DO CONTEXT
// ====================================
const ExerciciosContext = createContext<ExerciciosContextValue | null>(null);

// ====================================
// HOOK PARA USAR O CONTEXT
// ====================================
export const useExerciciosContext = (): ExerciciosContextValue => {
  const context = useContext(ExerciciosContext);
  if (!context) {
    throw new Error('useExerciciosContext deve ser usado dentro de ExerciciosProvider');
  }
  return context;
};

// ====================================
// PROVIDER COMPONENT
// ====================================
interface ExerciciosProviderProps {
  children: React.ReactNode;
}

export const ExerciciosProvider: React.FC<ExerciciosProviderProps> = ({ children }) => {
  // Inicializar todos os hooks
  const storageHook = useExerciciosStorage();
  const modalHook = useExerciciosModal();
  const seriesHook = useSeriesManager({
    exerciciosAdicionados: storageHook.exerciciosAdicionados,
    setExerciciosAdicionados: storageHook.setExerciciosAdicionados
  });

  // ====================================
  // AÇÕES INTEGRADAS (MEMOIZADAS)
  // ====================================
  const adicionarExercicioCompleto = useMemo(() =>
    (treinoId: string, exercicio: any) => {
      console.log('➕ [CONTEXT] Adicionando exercício completo:', exercicio.nome, 'ao treino:', treinoId);
      storageHook.adicionarExercicio(treinoId, exercicio);
      modalHook.fecharModal();
    },
    [storageHook, modalHook]
  );

  // ====================================
  // VALOR DO CONTEXT (MEMOIZADO) 🔧
  // ====================================
  const contextValue: ExerciciosContextValue = useMemo(() => {
    console.log('🔥 [CONTEXT] Recriando ContextValue com useMemo:', {
      exerciciosSelecionados: modalHook.exerciciosSelecionados.length,
      isModalOpen: modalHook.isModalOpen,
      tipoSerie: modalHook.tipoSerie
    });

    return {
      // Storage e dados
      exerciciosAdicionados: storageHook.exerciciosAdicionados,
      treinos: storageHook.treinos,
      config: storageHook.config,
      isLoaded: storageHook.isLoaded,
      dadosCompletos: storageHook.dadosCompletos,
      totalExercicios: storageHook.totalExercicios,
      treinosComExercicios: storageHook.treinosComExercicios,
      treinosSemExercicios: storageHook.treinosSemExercicios,
      isFormValido: storageHook.isFormValido,

      // Ações de exercícios - usando versão integrada
      adicionarExercicio: adicionarExercicioCompleto,
      removerExercicio: storageHook.removerExercicio,
      atualizarExercicio: storageHook.atualizarExercicio,
      limparExercicios: storageHook.limparExercicios,

      // Gerenciamento de séries
      adicionarSerie: seriesHook.adicionarSerie,
      removerSerie: seriesHook.removerSerie,
      atualizarSerie: seriesHook.atualizarSerie,
      atualizarSerieCombinada: seriesHook.atualizarSerieCombinada,
      toggleDropSet: seriesHook.toggleDropSet,
      atualizarDropSet: seriesHook.atualizarDropSet,
      atualizarIntervaloExercicio: seriesHook.atualizarIntervaloExercicio,

      // Modal de exercícios
      isModalOpen: modalHook.isModalOpen,
      treinoSelecionado: modalHook.treinoSelecionado,
      gruposFiltro: modalHook.gruposFiltro,
      loading: modalHook.loading,
      exerciciosDisponiveis: modalHook.exerciciosDisponiveis,
      exerciciosFiltrados: modalHook.exerciciosFiltrados,
      filtros: modalHook.filtros,
      atualizarFiltro: modalHook.atualizarFiltro,
      tipoSerie: modalHook.tipoSerie,
      setTipoSerie: modalHook.setTipoSerie,
      exerciciosSelecionados: modalHook.exerciciosSelecionados,
      toggleExercicioSelecionado: modalHook.toggleExercicioSelecionado, // <-- SÓ ESSA!
      limparSelecao: modalHook.limparSelecao,
      abrirModal: modalHook.abrirModal,
      fecharModal: modalHook.fecharModal,
      criarExercicioSimples: modalHook.criarExercicioSimples,
      criarExercicioCombinado: modalHook.criarExercicioCombinado,
      podeSelecionarExercicio: modalHook.podeSelecionarExercicio,
      isSelecaoValida: modalHook.isSelecaoValida,

      // Helpers
      validarSerie: seriesHook.validarSerie,
      obterEstatisticasSeries: seriesHook.obterEstatisticasSeries
    };
  }, [
    // ⚠️ Só as referências dos hooks!
    storageHook,
    modalHook,
    seriesHook,
    adicionarExercicioCompleto,
  ]);

  return (
    <ExerciciosContext.Provider value={contextValue}>
      {children}
    </ExerciciosContext.Provider>
  );
};

// Definir displayName para melhor debugging
ExerciciosProvider.displayName = 'ExerciciosProvider';

// ====================================
// HOC PARA FACILITAR O USO
// ====================================
export const withExerciciosContext = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props: P) => (
    <ExerciciosProvider>
      <Component {...props} />
    </ExerciciosProvider>
  );
  WrappedComponent.displayName = `withExerciciosContext(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
};
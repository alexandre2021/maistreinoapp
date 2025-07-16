// hooks/exercicios/useExerciciosStorage.ts
import { useCallback, useEffect, useState } from 'react';
import {
    ExercicioRotinaLocal,
    ExerciciosPorTreino,
    RotinaConfig,
    TreinoConfig
} from '../../types/exercicio.types';

// Storage keys
const STORAGE_KEYS = {
  CONFIG: 'rotina_configuracao',
  TREINOS: 'rotina_treinos', 
  EXERCICIOS: 'rotina_exercicios'
} as const;

export const useExerciciosStorage = () => {
  const [exerciciosAdicionados, setExerciciosAdicionados] = useState<ExerciciosPorTreino>({});
  const [treinos, setTreinos] = useState<TreinoConfig[]>([]);
  const [config, setConfig] = useState<Partial<RotinaConfig>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // ====================================
  // FUNÇÕES DE LEITURA DO STORAGE
  // ====================================
  const lerConfig = useCallback((): Partial<RotinaConfig> => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.CONFIG);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('❌ Erro ao ler configuração:', error);
      return {};
    }
  }, []);

  const lerTreinos = useCallback((): TreinoConfig[] => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.TREINOS);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('❌ Erro ao ler treinos:', error);
      return [];
    }
  }, []);

  const lerExercicios = useCallback((): ExerciciosPorTreino => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.EXERCICIOS);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('❌ Erro ao ler exercícios:', error);
      return {};
    }
  }, []);

  // ====================================
  // FUNÇÕES DE ESCRITA NO STORAGE
  // ====================================
  const salvarExercicios = useCallback((exercicios: ExerciciosPorTreino) => {
    try {
      console.log('💾 Salvando exercícios:', Object.keys(exercicios).length, 'treinos');
      sessionStorage.setItem(STORAGE_KEYS.EXERCICIOS, JSON.stringify(exercicios));
      console.log('✅ Exercícios salvos com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar exercícios:', error);
    }
  }, []);

  // ====================================
  // INICIALIZAÇÃO DOS DADOS
  // ====================================
  const inicializarDados = useCallback(() => {
    console.log('🚀 Inicializando dados do storage...');
    
    const configSalva = lerConfig();
    const treinosSalvos = lerTreinos();
    const exerciciosSalvos = lerExercicios();

    console.log('📊 Dados carregados:', {
      config: !!configSalva.nomeRotina,
      treinos: treinosSalvos.length,
      exercicios: Object.keys(exerciciosSalvos).length
    });

    setConfig(configSalva);
    setTreinos(treinosSalvos);
    setExerciciosAdicionados(exerciciosSalvos);
    setIsLoaded(true);
  }, [lerConfig, lerTreinos, lerExercicios]);

  // ====================================
  // SINCRONIZAÇÃO AUTOMÁTICA
  // ====================================
  // Auto-salvar exercícios quando mudarem
  useEffect(() => {
    if (isLoaded && Object.keys(exerciciosAdicionados).length > 0) {
      salvarExercicios(exerciciosAdicionados);
    }
  }, [exerciciosAdicionados, isLoaded, salvarExercicios]);

  // Carregar dados na inicialização
  useEffect(() => {
    if (!isLoaded) {
      inicializarDados();
    }
  }, [isLoaded, inicializarDados]);

  // ====================================
  // FUNÇÕES DE MANIPULAÇÃO
  // ====================================
  const adicionarExercicio = useCallback((treinoId: string, exercicio: ExercicioRotinaLocal) => {
    console.log('➕ Adicionando exercício:', exercicio.nome, 'ao treino:', treinoId);
    
    setExerciciosAdicionados(prev => ({
      ...prev,
      [treinoId]: [...(prev[treinoId] || []), exercicio]
    }));
  }, []);

  const removerExercicio = useCallback((treinoId: string, exercicioId: string) => {
    console.log('➖ Removendo exercício:', exercicioId, 'do treino:', treinoId);
    
    setExerciciosAdicionados(prev => ({
      ...prev,
      [treinoId]: (prev[treinoId] || []).filter(ex => ex.id !== exercicioId)
    }));
  }, []);

  const atualizarExercicio = useCallback((treinoId: string, exercicioId: string, exercicioAtualizado: ExercicioRotinaLocal) => {
    console.log('🔄 Atualizando exercício:', exercicioId);
    
    setExerciciosAdicionados(prev => ({
      ...prev,
      [treinoId]: (prev[treinoId] || []).map(ex => 
        ex.id === exercicioId ? exercicioAtualizado : ex
      )
    }));
  }, []);

  const limparExercicios = useCallback(() => {
    console.log('🗑️ Limpando todos os exercícios');
    setExerciciosAdicionados({});
    sessionStorage.removeItem(STORAGE_KEYS.EXERCICIOS);
  }, []);

  // ====================================
  // DADOS COMPUTADOS
  // ====================================
  const dadosCompletos = {
    nomeRotina: config.nomeRotina || 'Rotina sem nome',
    treinos: treinos.map(treino => ({
      ...treino,
      exercicios: exerciciosAdicionados[treino.id] || []
    }))
  };

  const totalExercicios = Object.values(exerciciosAdicionados)
    .reduce((total, exercicios) => total + exercicios.length, 0);

  const treinosComExercicios = treinos.filter(treino => 
    (exerciciosAdicionados[treino.id]?.length || 0) > 0
  );

  const treinosSemExercicios = treinos.filter(treino => 
    (exerciciosAdicionados[treino.id]?.length || 0) === 0
  );

  const isFormValido = treinos.length > 0 && treinosSemExercicios.length === 0;

  return {
    // Estado
    exerciciosAdicionados,
    treinos,
    config,
    isLoaded,
    
    // Dados computados
    dadosCompletos,
    totalExercicios,
    treinosComExercicios,
    treinosSemExercicios,
    isFormValido,
    
    // Ações
    adicionarExercicio,
    removerExercicio,
    atualizarExercicio,
    limparExercicios,
    
    // Storage manual
    salvarExercicios,
    lerConfig,
    lerTreinos,
    lerExercicios,
    
    // Controle
    setExerciciosAdicionados
  };
};
// hooks/exercicios/useExerciciosModal.ts
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import {
  ExercicioBanco,
  ExercicioCombinado,
  ExercicioRotinaLocal,
  FiltrosExercicio
} from '../../types/exercicio.types';

export const useExerciciosModal = () => {
  // ====================================
  // ESTADO DO MODAL
  // ====================================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [treinoSelecionado, setTreinoSelecionado] = useState<string>('');
  const [gruposFiltro, setGruposFiltro] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // ====================================
  // EXERCÍCIOS E FILTROS
  // ====================================
  const [exerciciosDisponiveis, setExerciciosDisponiveis] = useState<ExercicioBanco[]>([]);
  const [filtros, setFiltros] = useState<FiltrosExercicio>({
    tipo: 'todos',
    grupoMuscular: 'todos',
    busca: ''
  });

  // ====================================
  // SELEÇÃO DE EXERCÍCIOS
  // ====================================
  const [tipoSerie, setTipoSerie] = useState<'simples' | 'combinada'>('simples');
  const [exerciciosSelecionados, setExerciciosSelecionados] = useState<ExercicioBanco[]>([]);

  // ====================================
  // FILTROS APLICADOS
  // ====================================
  const exerciciosFiltrados = exerciciosDisponiveis.filter(exercicio => {
    // Filtro por busca
    const matchBusca = exercicio.nome.toLowerCase().includes(filtros.busca.toLowerCase());
    
    // Filtro por grupo muscular
    const matchGrupo = filtros.grupoMuscular === 'todos' || 
                      exercicio.grupo_muscular === filtros.grupoMuscular;
    
    return matchBusca && matchGrupo;
  });

  // ====================================
  // BUSCAR EXERCÍCIOS NO SUPABASE
  // ====================================
  const buscarExercicios = useCallback(async (gruposMusculares: string[]) => {
    try {
      setLoading(true);
      console.log('🔍 Buscando exercícios:', { 
        grupos: gruposMusculares, 
        filtroTipo: filtros.tipo,
        filtroGrupo: filtros.grupoMuscular 
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('exercicios')
        .select('id, nome, grupo_muscular, equipamento, tipo')
        .eq('is_ativo', true);

      // Filtro por grupo muscular específico
      if (filtros.grupoMuscular !== 'todos' && gruposMusculares.includes(filtros.grupoMuscular)) {
        query = query.eq('grupo_muscular', filtros.grupoMuscular);
        console.log('🎯 Filtrando por grupo específico:', filtros.grupoMuscular);
      } else if (gruposMusculares.length > 0) {
        query = query.in('grupo_muscular', gruposMusculares);
        console.log('🔀 Filtrando por todos os grupos do treino:', gruposMusculares);
      }

      // Filtro por tipo de exercício
      if (filtros.tipo === 'padrao') {
        query = query.eq('tipo', 'padrao');
        console.log('📚 Filtrando apenas exercícios padrão');
      } else if (filtros.tipo === 'personalizado') {
        if (user) {
          query = query.eq('tipo', 'personalizado').eq('pt_id', user.id);
          console.log('⭐ Filtrando apenas exercícios personalizados do PT:', user.id);
        } else {
          console.log('❌ Sem usuário logado para exercícios personalizados');
          setExerciciosDisponiveis([]);
          return;
        }
      }

      const { data, error } = await query
        .order('tipo', { ascending: true })
        .order('nome', { ascending: true })
        .limit(100);

      if (error) {
        console.error('❌ Erro na query:', error);
        throw error;
      }

      console.log('✅ Exercícios encontrados:', {
        total: data?.length || 0,
        tipos: data ? [...new Set(data.map(ex => ex.tipo))] : [],
        primeiros3: data?.slice(0, 3).map(ex => ({ nome: ex.nome, tipo: ex.tipo })) || []
      });
      
      setExerciciosDisponiveis(data || []);
    } catch (error) {
      console.error('❌ Erro ao buscar exercícios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os exercícios');
    } finally {
      setLoading(false);
    }
  }, [filtros.tipo, filtros.grupoMuscular]);

  // ====================================
  // CONTROLE DO MODAL
  // ====================================
  const abrirModal = useCallback((treinoId: string, gruposMusculares: string[]) => {
    console.log('🔧 Abrindo modal para treino:', treinoId);
    setTreinoSelecionado(treinoId);
    setGruposFiltro(gruposMusculares);
    setTipoSerie('simples');
    setExerciciosSelecionados([]);
    setFiltros(prev => ({
      ...prev,
      grupoMuscular: 'todos',
      busca: ''
    }));
    setIsModalOpen(true);
  }, []);

  const fecharModal = useCallback(() => {
    console.log('🔒 Fechando modal de exercícios');
    setIsModalOpen(false);
    setTreinoSelecionado('');
    setGruposFiltro([]);
    setExerciciosSelecionados([]);
    setExerciciosDisponiveis([]);
  }, []);

  // ====================================
  // SELEÇÃO DE EXERCÍCIOS
  // ====================================
  const toggleExercicioSelecionado = useCallback((exercicio: ExercicioBanco) => {
    setExerciciosSelecionados(prev => {
      const jaExiste = prev.find(ex => ex.id === exercicio.id);
      
      if (jaExiste) {
        // Remove se já existe
        return prev.filter(ex => ex.id !== exercicio.id);
      } else {
        // Adiciona baseado no tipo de série
        if (tipoSerie === 'simples') {
          return [exercicio]; // Só um exercício para série simples
        } else {
          // Série combinada - máximo 2 exercícios
          if (prev.length < 2) {
            return [...prev, exercicio];
          }
          return prev; // Não adiciona se já tem 2
        }
      }
    });
  }, [tipoSerie]);

  const limparSelecao = useCallback(() => {
    setExerciciosSelecionados([]);
  }, []);

  // ====================================
  // CRIAÇÃO DE EXERCÍCIOS
  // ====================================
  const criarExercicioSimples = useCallback((exercicioBanco: ExercicioBanco): ExercicioRotinaLocal => {
    return {
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exercicioId: exercicioBanco.id,
      nome: exercicioBanco.nome,
      grupoMuscular: exercicioBanco.grupo_muscular,
      equipamento: exercicioBanco.equipamento,
      tipo: 'tradicional',
      series: [{
        id: `serie-1-${Date.now()}`,
        numero: 1,
        numero_serie: 1,
        repeticoes: 12,
        carga: 0,
        intervaloAposSerie: 90
      }],
      intervaloAposExercicio: 120
    };
  }, []);

  const criarExercicioCombinado = useCallback((exercicios: ExercicioBanco[]): ExercicioRotinaLocal => {
    if (exercicios.length !== 2) {
      throw new Error('Série combinada precisa de exatamente 2 exercícios');
    }

    const nomesCombinados = exercicios.map(ex => ex.nome).join(' + ');
    const gruposUnicos = [...new Set(exercicios.map(ex => ex.grupo_muscular))];
    
    // Determinar se é Bi-set ou Super-set
    const isBiSet = gruposUnicos.length === 1;
    const gruposCombinados = isBiSet 
      ? `${gruposUnicos[0]} (Bi-set)`
      : `${gruposUnicos.join(', ')} (Super-set)`;

    console.log('🔗 Criando exercício combinado:', {
      exercicios: exercicios.map(ex => ex.nome),
      grupos: gruposUnicos,
      isBiSet,
      resultado: gruposCombinados
    });

    const exerciciosCombinados: ExercicioCombinado[] = exercicios.map(ex => ({
      exercicioId: ex.id,
      nome: ex.nome,
      grupoMuscular: ex.grupo_muscular,
      equipamento: ex.equipamento
    }));

    return {
      id: `ex-combinado-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exercicioId: exercicios[0].id,
      nome: nomesCombinados,
      grupoMuscular: gruposCombinados,
      equipamento: 'Combinado',
      tipo: 'combinada',
      exerciciosCombinados,
      series: [{
        id: `serie-1-${Date.now()}`,
        numero: 1,
        numero_serie: 1,
        repeticoes: 12,
        carga: 0,
        // Valores específicos para série combinada
        repeticoes_1: 12,
        carga_1: 0,
        repeticoes_2: 12,
        carga_2: 0,
        intervaloAposSerie: 90
      }],
      intervaloAposExercicio: 120
    };
  }, []);

  // ====================================
  // VALIDAÇÕES
  // ====================================
  const podeSelecionarExercicio = useCallback((exercicio: ExercicioBanco): boolean => {
    const jaExiste = exerciciosSelecionados.find(ex => ex.id === exercicio.id);
    
    if (jaExiste) return true; // Sempre pode desselecionar
    
    if (tipoSerie === 'simples') return true;
    
    // Para série combinada, só pode selecionar se tiver menos de 2
    return exerciciosSelecionados.length < 2;
  }, [exerciciosSelecionados, tipoSerie]);

  const isSelecaoValida = useCallback((): boolean => {
    if (tipoSerie === 'simples') {
      return exerciciosSelecionados.length === 1;
    } else {
      return exerciciosSelecionados.length === 2;
    }
  }, [exerciciosSelecionados, tipoSerie]);

  // ====================================
  // ATUALIZAÇÃO DE FILTROS
  // ====================================
  const atualizarFiltro = useCallback(<T extends keyof FiltrosExercicio>(
    campo: T, 
    valor: FiltrosExercicio[T]
  ) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  // ====================================
  // EFEITOS
  // ====================================
  // Buscar exercícios quando filtros mudarem
  useEffect(() => {
    if (isModalOpen && gruposFiltro.length > 0) {
      buscarExercicios(gruposFiltro);
    }
  }, [isModalOpen, gruposFiltro, filtros.tipo, filtros.grupoMuscular, buscarExercicios]);

  // Limpar seleção quando mudar tipo de série
  useEffect(() => {
    setExerciciosSelecionados([]);
  }, [tipoSerie]);

  return {
    // Estado do modal
    isModalOpen,
    treinoSelecionado,
    gruposFiltro,
    loading,

    // Exercícios
    exerciciosDisponiveis,
    exerciciosFiltrados,
    
    // Filtros
    filtros,
    atualizarFiltro,
    
    // Seleção
    tipoSerie,
    setTipoSerie,
    exerciciosSelecionados,
    toggleExercicioSelecionado,
    limparSelecao,
    
    // Controle do modal
    abrirModal,
    fecharModal,
    
    // Criação de exercícios
    criarExercicioSimples,
    criarExercicioCombinado,
    
    // Validações
    podeSelecionarExercicio,
    isSelecaoValida,
    
    // Ações de busca
    buscarExercicios
  };
};
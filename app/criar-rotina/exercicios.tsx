// app/criar-rotina/exercicios.tsx - VERSÃO REFATORADA COM ROTINASTORAGE
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { RotinaProgressHeader } from '../../components/rotina/RotinaProgressHeader';
import { useModalManager } from '../../hooks/useModalManager';
import { supabase } from '../../lib/supabase';
import RotinaStorage from '../../utils/rotinaStorage';

// ✅ TIPOS LOCAIS (sem Context)
interface ExercicioBanco {
  id: string;
  nome: string;
  grupo_muscular: string;
  equipamento: string;
  tipo: 'padrao' | 'personalizado';
}

export interface SerieConfig {
  id: string;
  numero: number;
  repeticoes: number;
  carga?: number;
  intervaloAposSerie?: number;
  isDropSet?: boolean;
  dropsConfig?: {
    id: string;
    cargaReduzida: number;
    repeticoes: number;
  }[];
}

interface ExercicioRotinaLocal {
  id: string;
  exercicioId: string;
  nome: string;
  grupoMuscular: string;
  equipamento: string;
  tipo: 'tradicional' | 'combinada';
  series: SerieConfig[];
  observacoes?: string;
  intervaloAposExercicio?: number;
  exerciciosCombinados?: {
    exercicioId: string;
    nome: string;
    grupoMuscular: string;
    equipamento: string;
  }[];
}

interface TreinoConfig {
  id: string;
  nome: string;
  gruposMusculares: string[];
  exercicios: ExercicioRotinaLocal[];
}

interface RotinaConfig {
  nomeRotina: string;
  descricao: string;
  treinosPorSemana: number;
  dificuldade: string;
  duracaoSemanas: number;
  alunoId: string;
}

// ✅ STORAGE MANAGER CENTRALIZADO
class ExerciciosStorage {
  private static readonly STORAGE_KEYS = {
    CONFIG: 'rotina_configuracao',
    TREINOS: 'rotina_treinos',
    EXERCICIOS: 'rotina_exercicios'
  };

  static salvarExercicios(exercicios: { [key: string]: ExercicioRotinaLocal[] }) {
    try {
      console.log('💾 Salvando exercícios completos:', exercicios);
      sessionStorage.setItem(this.STORAGE_KEYS.EXERCICIOS, JSON.stringify(exercicios));
      console.log('✅ Exercícios salvos:', Object.keys(exercicios).length, 'treinos');
    } catch (error) {
      console.error('❌ Erro ao salvar exercícios:', error);
    }
  }

  static lerExercicios(): { [key: string]: ExercicioRotinaLocal[] } {
    try {
      const saved = sessionStorage.getItem(this.STORAGE_KEYS.EXERCICIOS);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('❌ Erro ao ler exercícios:', error);
      return {};
    }
  }

  static lerTreinos(): TreinoConfig[] {
    try {
      const saved = sessionStorage.getItem(this.STORAGE_KEYS.TREINOS);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('❌ Erro ao ler treinos:', error);
      return [];
    }
  }

  static lerConfig(): Partial<RotinaConfig> {
    try {
      const saved = sessionStorage.getItem(this.STORAGE_KEYS.CONFIG);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('❌ Erro ao ler configuração:', error);
      return {};
    }
  }
}

function ExerciciosRotinaContent() {
  const router = useRouter();
  
  // ✅ LER DADOS SALVOS COM STORAGE MANAGER
  const configSalva = ExerciciosStorage.lerConfig();
  const treinosSalvos = ExerciciosStorage.lerTreinos();
  const exerciciosSalvos = ExerciciosStorage.lerExercicios();

  // MODAL MANAGER
  const { modals, openModal, closeModal } = useModalManager({
    exercicioModal: false
  });
  
  // ✅ ESTADOS LOCAIS - USANDO SESSIONSTORAGE
  const [treinos, setTreinos] = useState<TreinoConfig[]>([]);
  const [exerciciosAdicionados, setExerciciosAdicionados] = useState<{ [key: string]: ExercicioRotinaLocal[] }>({});
  const [treinoSelecionado, setTreinoSelecionado] = useState<string>('');
  const [gruposFiltro, setGruposFiltro] = useState<string[]>([]);
  const [exerciciosDisponiveis, setExerciciosDisponiveis] = useState<ExercicioBanco[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // ESTADOS DO MODAL
  const [tipoSerie, setTipoSerie] = useState<'simples' | 'combinada'>('simples');
  const [exerciciosSelecionados, setExerciciosSelecionados] = useState<ExercicioBanco[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'padrao' | 'personalizado'>('todos');
  
  // Estados do modal de filtro
  const [showFiltroModal, setShowFiltroModal] = useState(false);
  const [filtroGrupoMuscular, setFiltroGrupoMuscular] = useState<string>('todos');
  const [gruposDoTreino, setGruposDoTreino] = useState<string[]>([]);

  // DEBUG: SEMPRE MOSTRAR ESTADO ATUAL
  console.log('🔥 EXERCICIOS SCREEN - Estado atual:', {
    treinosSalvos: treinosSalvos.length,
    exerciciosSalvos: Object.keys(exerciciosSalvos).length,
    configSalva: !!configSalva.nomeRotina
  });

  // DADOS A EXIBIR - COMBINANDO TREINOS + EXERCÍCIOS
  const dadosExibicao = {
    nomeRotina: configSalva.nomeRotina || 'Rotina sem nome',
    treinos: treinos.map(treino => ({
      ...treino,
      exercicios: exerciciosAdicionados[treino.id] || []
    }))
  };

  // ✅ INICIALIZAÇÃO SIMPLIFICADA COM SESSIONSTORAGE
  useEffect(() => {
    if (initialized) return;

    console.log('🚀 INICIALIZANDO EXERCÍCIOS COM SESSIONSTORAGE');
    
    // Carregar treinos salvos
    if (treinosSalvos.length > 0) {
      console.log('✅ Carregando treinos salvos:', treinosSalvos.length);
      setTreinos(treinosSalvos);
    }

    // Carregar exercícios salvos
    const exerciciosKeys = Object.keys(exerciciosSalvos);
    if (exerciciosKeys.length > 0) {
      console.log('✅ Carregando exercícios salvos:', exerciciosKeys.length);
      setExerciciosAdicionados(exerciciosSalvos);
    }

    setInitialized(true);
  }, [initialized, treinosSalvos, exerciciosSalvos]);

  // ✅ SALVAR EXERCÍCIOS SEMPRE QUE MUDAR
  useEffect(() => {
    if (initialized && Object.keys(exerciciosAdicionados).length > 0) {
      ExerciciosStorage.salvarExercicios(exerciciosAdicionados);
    }
  }, [exerciciosAdicionados, initialized]);

  // BUSCAR EXERCÍCIOS
  const buscarExercicios = useCallback(async (gruposMusculares: string[]) => {
    try {
      setLoading(true);
      console.log('🔍 Buscando exercícios:', { gruposMusculares, filtroTipo, filtroGrupoMuscular });
      
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('exercicios')
        .select('id, nome, grupo_muscular, equipamento, tipo')
        .eq('is_ativo', true);

      // ✅ APLICAR FILTRO POR GRUPO MUSCULAR ESPECÍFICO
      if (filtroGrupoMuscular !== 'todos' && gruposMusculares.includes(filtroGrupoMuscular)) {
        // Se um grupo específico está selecionado, filtrar apenas por ele
        query = query.eq('grupo_muscular', filtroGrupoMuscular);
        console.log('🎯 Filtrando por grupo específico:', filtroGrupoMuscular);
      } else if (gruposMusculares.length > 0) {
        // Se nenhum grupo específico, usar todos os grupos do treino
        query = query.in('grupo_muscular', gruposMusculares);
        console.log('🔀 Filtrando por todos os grupos do treino:', gruposMusculares);
      }

      // Aplicar filtro de tipo
      if (filtroTipo === 'padrao') {
        query = query.eq('tipo', 'padrao');
        console.log('📚 Filtrando apenas exercícios padrão');
      } else if (filtroTipo === 'personalizado') {
        if (user) {
          query = query.eq('tipo', 'personalizado').eq('pt_id', user.id);
          console.log('⭐ Filtrando apenas exercícios personalizados do PT:', user.id);
        } else {
          console.log('❌ Sem usuário logado para exercícios personalizados');
          setExerciciosDisponiveis([]);
          return;
        }
      } else {
        // Todos - sem filtro adicional de tipo
        console.log('🔥 Buscando todos os exercícios (padrão + personalizados)');
      }

      console.log('🗄️ Query final configurada');

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
  }, [filtroTipo, filtroGrupoMuscular]);

  // ABRIR MODAL
  const abrirModalExercicio = (treinoId: string, gruposMusculares: string[]) => {
    console.log('🔧 Abrindo modal para treino:', treinoId);
    setTreinoSelecionado(treinoId);
    setGruposFiltro(gruposMusculares);
    setGruposDoTreino(gruposMusculares); // ✅ Capturar grupos do treino atual
    setSearchText('');
    setTipoSerie('simples');
    setExerciciosSelecionados([]);
    setFiltroTipo('todos');
    setFiltroGrupoMuscular('todos'); // ✅ Reset do filtro de grupo
    openModal('exercicioModal');
  };

  // Recarregar exercícios quando filtro de tipo OU grupo muscular mudar
  useEffect(() => {
    if (modals.exercicioModal && gruposFiltro.length > 0) {
      buscarExercicios(gruposFiltro);
    }
  }, [filtroTipo, filtroGrupoMuscular, modals.exercicioModal, gruposFiltro, buscarExercicios]);

  // ADICIONAR/REMOVER EXERCÍCIO SELECIONADO
  const toggleExercicioSelecionado = (exercicio: ExercicioBanco) => {
    setExerciciosSelecionados(prev => {
      const jaExiste = prev.find(ex => ex.id === exercicio.id);
      if (jaExiste) {
        return prev.filter(ex => ex.id !== exercicio.id);
      } else {
        if (tipoSerie === 'simples') {
          return [exercicio]; // Só um exercício para série simples
        } else {
          if (prev.length < 2) {
            return [...prev, exercicio];
          }
        }
      }
      return prev;
    });
  };

  // ADICIONAR EXERCÍCIOS SELECIONADOS
  const adicionarExerciciosSelecionados = () => {
    if (tipoSerie === 'simples') {
      if (exerciciosSelecionados.length === 1) {
        adicionarExercicioSimples(exerciciosSelecionados[0]);
      } else {
        Alert.alert('Erro', 'Selecione um exercício para a série simples');
      }
    } else {
      if (exerciciosSelecionados.length === 2) {
        adicionarExercicioCombinado();
      } else {
        Alert.alert('Erro', 'Selecione exatamente 2 exercícios para a série combinada');
      }
    }
  };

  // ADICIONAR EXERCÍCIO COMBINADO
  const adicionarExercicioCombinado = useCallback(() => {
    const nomesCombinados = exerciciosSelecionados.map(ex => ex.nome).filter(nome => nome).join(' + ');
    const gruposUnicos = [...new Set(exerciciosSelecionados.map(ex => ex.grupo_muscular).filter(grupo => grupo))];
    
    // Determinar se é Bi-set ou Super-set
    const isBiSet = gruposUnicos.length === 1;
    const gruposCombinados = isBiSet 
      ? `${gruposUnicos[0]} (Bi-set)`
      : `${gruposUnicos.length > 0 ? gruposUnicos.join(', ') : 'Grupos mistos'} (Super-set)`;

    console.log('🔗 Criando exercício combinado:', {
      exercicios: exerciciosSelecionados.map(ex => ex.nome),
      grupos: gruposUnicos,
      isBiSet,
      resultado: gruposCombinados
    });

    const novoExercicio: ExercicioRotinaLocal = {
      id: `ex-combinado-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exercicioId: exerciciosSelecionados[0].id,
      nome: nomesCombinados,
      grupoMuscular: gruposCombinados,
      equipamento: 'Combinado',
      tipo: 'combinada',
      exerciciosCombinados: exerciciosSelecionados.map(ex => ({
        exercicioId: ex.id,
        nome: ex.nome,
        grupoMuscular: ex.grupo_muscular,
        equipamento: ex.equipamento
      })),
      series: [{
        id: `serie-1-${Date.now()}`,
        numero: 1,
        repeticoes: 12,
        carga: 0,
        intervaloAposSerie: 120
      }],
      intervaloAposExercicio: 0
    };

    setExerciciosAdicionados(prev => ({
      ...prev,
      [treinoSelecionado]: [...(prev[treinoSelecionado] || []), novoExercicio]
    }));

    console.log('✅ Exercício combinado adicionado:', nomesCombinados);
    
    closeModal('exercicioModal');
  }, [
    exerciciosSelecionados, 
    treinoSelecionado, 
    closeModal
  ]);

  // ADICIONAR EXERCÍCIO SIMPLES - VERSÃO LOCAL (SEM CONTEXT)
  const adicionarExercicioSimples = useCallback((exercicioBanco: ExercicioBanco) => {
    console.log('🎯 ADICIONANDO EXERCÍCIO LOCAL:', {
      exercicio: exercicioBanco.nome,
      treino: treinoSelecionado
    });

    if (!treinoSelecionado) {
      Alert.alert('Erro', 'Nenhum treino selecionado');
      return;
    }

    const novoExercicio: ExercicioRotinaLocal = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exercicioId: exercicioBanco.id,
      nome: exercicioBanco.nome,
      grupoMuscular: exercicioBanco.grupo_muscular,
      equipamento: exercicioBanco.equipamento,
      tipo: 'tradicional',
      series: [{
        id: `serie-1-${Date.now()}`,
        numero: 1,
        repeticoes: 12,
        carga: 0,
        intervaloAposSerie: 120
      }],
      intervaloAposExercicio: 180
    };

    setExerciciosAdicionados(prev => ({
      ...prev,
      [treinoSelecionado]: [...(prev[treinoSelecionado] || []), novoExercicio]
    }));

    console.log('✅ Exercício adicionado localmente!');
    
    closeModal('exercicioModal');
  }, [treinoSelecionado, closeModal]);

  // REMOVER EXERCÍCIO - VERSÃO LOCAL
  const removerExercicioLocal = (treinoId: string, exercicioId: string) => {
    setExerciciosAdicionados(prev => ({
      ...prev,
      [treinoId]: (prev[treinoId] || []).filter(ex => ex.id !== exercicioId)
    }));
  };

  // ADICIONAR SÉRIE - VERSÃO LOCAL
  const adicionarSerie = (treinoId: string, exercicioId: string) => {
    console.log('➕ Adicionando série ao exercício:', exercicioId, 'do treino:', treinoId);
    
    setExerciciosAdicionados(prev => {
      const exerciciosDoTreino = prev[treinoId] || [];
      
      const exerciciosAtualizados = exerciciosDoTreino.map(exercicio => {
        if (exercicio.id === exercicioId) {
          const novaSerie: SerieConfig = {
            id: `serie-${exercicio.series.length + 1}-${Date.now()}`,
            numero: exercicio.series.length + 1,
            repeticoes: 12,
            carga: 0,
            intervaloAposSerie: 120
          };

          console.log('✅ Nova série criada:', novaSerie);
          
          return {
            ...exercicio,
            series: [...exercicio.series, novaSerie]
          };
        }
        return exercicio;
      });

      return {
        ...prev,
        [treinoId]: exerciciosAtualizados
      };
    });
  };

  // REMOVER SÉRIE - VERSÃO LOCAL
  const removerSerie = (treinoId: string, exercicioId: string, serieId: string) => {
    console.log('➖ Removendo série:', serieId);
    
    setExerciciosAdicionados(prev => {
      const exerciciosDoTreino = prev[treinoId] || [];
      
      const exerciciosAtualizados = exerciciosDoTreino.map(exercicio => {
        if (exercicio.id === exercicioId && exercicio.series.length > 1) {
          const seriesAtualizadas = exercicio.series
            .filter(s => s.id !== serieId)
            .map((serie, index) => ({ ...serie, numero: index + 1 }));

          return {
            ...exercicio,
            series: seriesAtualizadas
          };
        }
        return exercicio;
      });

      return {
        ...prev,
        [treinoId]: exerciciosAtualizados
      };
    });
  };

  // ATUALIZAR SÉRIE - VERSÃO LOCAL
  const atualizarSerie = (treinoId: string, exercicioId: string, serieId: string, campo: keyof SerieConfig, valor: any) => {
    console.log('🔄 Atualizando série:', serieId, campo, '=', valor);
    
    setExerciciosAdicionados(prev => {
      const exerciciosDoTreino = prev[treinoId] || [];
      
      const exerciciosAtualizados = exerciciosDoTreino.map(exercicio => {
        if (exercicio.id === exercicioId) {
          const seriesAtualizadas = exercicio.series.map(serie =>
            serie.id === serieId ? { ...serie, [campo]: valor } : serie
          );

          return {
            ...exercicio,
            series: seriesAtualizadas
          };
        }
        return exercicio;
      });

      return {
        ...prev,
        [treinoId]: exerciciosAtualizados
      };
    });
  };

  // ATUALIZAR DROP SET - VERSÃO LOCAL
  const atualizarDropSet = (treinoId: string, exercicioId: string, serieId: string, campo: 'repeticoes' | 'cargaReduzida', valor: number) => {
    console.log('🔥 Atualizando Drop Set:', serieId, campo, '=', valor);
    
    setExerciciosAdicionados(prev => {
      const exerciciosDoTreino = prev[treinoId] || [];
      
      const exerciciosAtualizados = exerciciosDoTreino.map(exercicio => {
        if (exercicio.id === exercicioId) {
          const seriesAtualizadas = exercicio.series.map(serie => {
            if (serie.id === serieId && serie.dropsConfig?.[0]) {
              const dropAtualizado = {
                ...serie.dropsConfig[0],
                [campo]: valor
              };

              return {
                ...serie,
                dropsConfig: [dropAtualizado]
              };
            }
            return serie;
          });

          return {
            ...exercicio,
            series: seriesAtualizadas
          };
        }
        return exercicio;
      });

      return {
        ...prev,
        [treinoId]: exerciciosAtualizados
      };
    });
  };

  // ATUALIZAR INTERVALO ENTRE EXERCÍCIOS
  const atualizarIntervaloExercicio = (treinoId: string, exercicioId: string, intervalo: number) => {
    console.log('⏱️ Atualizando intervalo do exercício:', exercicioId, '=', intervalo);
    
    setExerciciosAdicionados(prev => {
      const exerciciosDoTreino = prev[treinoId] || [];
      
      const exerciciosAtualizados = exerciciosDoTreino.map(exercicio => {
        if (exercicio.id === exercicioId) {
          return {
            ...exercicio,
            intervaloAposExercicio: intervalo
          };
        }
        return exercicio;
      });

      return {
        ...prev,
        [treinoId]: exerciciosAtualizados
      };
    });
  };

  // TOGGLE DROP SET - VERSÃO LOCAL
  const toggleDropSet = (treinoId: string, exercicioId: string, serieId: string) => {
    console.log('🔥 Toggle Drop Set para série:', serieId);
    
    setExerciciosAdicionados(prev => {
      const exerciciosDoTreino = prev[treinoId] || [];
      
      const exerciciosAtualizados = exerciciosDoTreino.map(exercicio => {
        if (exercicio.id === exercicioId) {
          const seriesAtualizadas = exercicio.series.map(serie => {
            if (serie.id === serieId) {
              const novoDropSet = !serie.isDropSet;
              
              return {
                ...serie,
                isDropSet: novoDropSet,
                dropsConfig: novoDropSet ? [
                  {
                    id: `drop-1-${Date.now()}`,
                    cargaReduzida: Math.max(0, (serie.carga || 0) * 0.8),
                    repeticoes: 8
                  }
                ] : []
              };
            }
            return serie;
          });

          return {
            ...exercicio,
            series: seriesAtualizadas
          };
        }
        return exercicio;
      });

      return {
        ...prev,
        [treinoId]: exerciciosAtualizados
      };
    });
  };

  // VALIDAÇÕES
  const getTotalExercicios = () => {
    return dadosExibicao.treinos.reduce((total, treino) => total + (treino.exercicios?.length || 0), 0);
  };

  const getTreinosComExercicios = () => {
    return dadosExibicao.treinos.filter(treino => (treino.exercicios?.length || 0) > 0);
  };

  const getTreinosSemExercicios = () => {
    return dadosExibicao.treinos.filter(treino => (treino.exercicios?.length || 0) === 0);
  };

  const isFormValid = () => {
    // Todos os treinos devem ter pelo menos 1 exercício
    return dadosExibicao.treinos.every(treino => (treino.exercicios?.length || 0) > 0);
  };

  // INFO DE REQUISITOS - NOVA FUNÇÃO
  const renderRequisitos = () => (
    <View style={styles.requisitosCard}>
      <View style={styles.requisitosHeader}>
        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        <Text style={styles.requisitosTitle}>Requisitos</Text>
      </View>
      
      <View style={styles.requisitosContent}>
        <Text style={styles.requisitoItem}>
          • Adicione pelo menos 1 exercício em cada treino
        </Text>
        
        {getTreinosComExercicios().length > 0 && (
          <Text style={[styles.requisitoItem, styles.requisitoSucesso]}>
            ✓ {getTreinosComExercicios().length} de {dadosExibicao.treinos.length} treino(s) configurado(s)
          </Text>
        )}

        {getTotalExercicios() > 0 && (
          <Text style={[styles.requisitoItem, styles.requisitoInfo]}>
            🏋️ {getTotalExercicios()} exercício(s) total
          </Text>
        )}

        {getTreinosSemExercicios().length > 0 && (
          <Text style={[styles.requisitoItem, styles.requisitoAlerta]}>
            ⚠️ {getTreinosSemExercicios().length} treino(s) ainda sem exercícios
          </Text>
        )}
      </View>
    </View>
  );

  // ✅ NAVEGAÇÃO SIMPLIFICADA COM SESSIONSTORAGE
  const handlePrevious = () => {
    console.log('🔙 Voltando para treinos...');
    
    // ✅ DADOS JÁ ESTÃO SALVOS NO SESSIONSTORAGE
    // Navegar de volta com alunoId
    const configSalva = RotinaStorage.getConfig();
    const alunoId = configSalva?.alunoId;
    if (alunoId) {
      router.push(`/criar-rotina/treinos?alunoId=${alunoId}`);
    } else {
      router.push('/criar-rotina/treinos');
    }
  };

  const handleNext = async () => {
    if (!isFormValid()) {
      Alert.alert('Exercícios necessários', 'Adicione pelo menos 1 exercício para continuar.');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Avançando para revisão...');
      
      // ✅ DADOS JÁ ESTÃO SALVOS NO SESSIONSTORAGE
      // Navegar para frente com alunoId
      const configSalva = RotinaStorage.getConfig();
      const alunoId = configSalva?.alunoId;
      if (alunoId) {
        router.push(`/criar-rotina/revisao?alunoId=${alunoId}`);
      } else {
        router.push('/criar-rotina/revisao');
      }
    } catch (error) {
      console.error('Erro ao avançar:', error);
      Alert.alert('Erro', 'Não foi possível avançar');
    } finally {
      setLoading(false);
    }
  };

  // RENDER EXERCÍCIO
  const renderExercicio = (exercicio: ExercicioRotinaLocal, treinoId: string) => {
    if (exercicio.tipo === 'combinada') {
      return renderExercicioCombinado(exercicio, treinoId);
    }
    return renderExercicioSimples(exercicio, treinoId);
  };

  // RENDER EXERCÍCIO SIMPLES
  const renderExercicioSimples = (exercicio: ExercicioRotinaLocal, treinoId: string) => (
    <View key={exercicio.id} style={styles.exercicioCard}>
      <View style={styles.exercicioHeader}>
        <View style={styles.exercicioInfo}>
          <Text style={styles.exercicioNome}>{exercicio.nome}</Text>
          <Text style={styles.exercicioMeta}>
            {exercicio.grupoMuscular} • {exercicio.equipamento}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removerExercicioLocal(treinoId, exercicio.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.seriesContainer}>
        <Text style={styles.seriesLabel}>Séries:</Text>
        {Array.isArray(exercicio.series) && exercicio.series.map((serie) => (
          <View key={serie.id}>
            <View style={styles.serieRow}>
              <Text style={styles.serieNumero}>{serie.numero}</Text>
              <View style={styles.serieInputs}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Rep</Text>
                  <TextInput
                    style={styles.serieInput}
                    value={serie.repeticoes.toString()}
                    onChangeText={(text) => {
                      // Se o texto está vazio, manter o valor atual
                      // Se não conseguir fazer parse, usar 12 como padrão
                      const valor = text === '' ? 12 : (parseInt(text) || 12);
                      console.log('🔍 Atualizando repetições:', text, '->', valor);
                      atualizarSerie(treinoId, exercicio.id, serie.id, 'repeticoes', valor);
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                    placeholder="12"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Carga (kg)</Text>
                  <TextInput
                    style={styles.serieInput}
                    value={(serie.carga || 0).toString()}
                    onChangeText={(text) => atualizarSerie(treinoId, exercicio.id, serie.id, 'carga', parseFloat(text) || 0)}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Drop</Text>
                  <TouchableOpacity
                    style={[
                      styles.dropButton,
                      serie.isDropSet && styles.dropButtonActive
                    ]}
                    onPress={() => toggleDropSet(treinoId, exercicio.id, serie.id)}
                  >
                    {serie.isDropSet ? (
                      <Text style={styles.dropButtonIcon}>🔥</Text>
                    ) : (
                      <Ionicons name="add" size={16} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              {exercicio.series.length > 1 && (
                <TouchableOpacity
                  style={styles.removeSerieButton}
                  onPress={() => removerSerie(treinoId, exercicio.id, serie.id)}
                >
                  <Ionicons name="close" size={16} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
            
            {serie.isDropSet && (
              <View style={styles.dropSetContainer}>
                <Text style={styles.dropSetHeader}>Drop 1</Text>
                <View style={styles.dropSetInputs}>
                  <View style={styles.dropInputGroup}>
                    <Text style={styles.dropInputLabel}>Reps</Text>
                    <View style={styles.dropInputContainer}>
                      <Text style={styles.dropInputPlaceholder}>Até a falha</Text>
                    </View>
                  </View>
                  <View style={styles.dropInputGroup}>
                    <Text style={styles.dropInputLabel}>Carga (kg)</Text>
                    <TextInput
                      style={styles.dropInput}
                      value={(serie.dropsConfig?.[0]?.cargaReduzida || 0).toString()}
                      onChangeText={(text) => atualizarDropSet(treinoId, exercicio.id, serie.id, 'cargaReduzida', parseFloat(text) || 0)}
                      keyboardType="numeric"
                      maxLength={6}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.removeDropButton}
                    onPress={() => toggleDropSet(treinoId, exercicio.id, serie.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* INTERVALO ENTRE SÉRIES - só mostra se tem mais de uma série */}
            {exercicio.series.length > 1 && serie.numero < exercicio.series.length && (
              <View style={styles.intervaloContainer}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.intervaloLabel}>Intervalo entre séries:</Text>
                <TextInput
                  style={styles.intervaloInput}
                  value={(serie.intervaloAposSerie || 120).toString()}
                  onChangeText={(text) => atualizarSerie(treinoId, exercicio.id, serie.id, 'intervaloAposSerie', parseInt(text) || 120)}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.intervaloUnidade}>s</Text>
              </View>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={styles.addSerieButton}
          onPress={() => adicionarSerie(treinoId, exercicio.id)}
        >
          <Ionicons name="add" size={16} color="#007AFF" />
          <Text style={styles.addSerieText}>Adicionar Série</Text>
        </TouchableOpacity>
        
        {/* INTERVALO APÓS EXERCÍCIO - só mostra se tem mais de um exercício no treino */}
        {(() => {
          const treino = dadosExibicao.treinos.find(t => t.id === treinoId);
          const exercicios = treino?.exercicios || [];
          const exercicioIndex = exercicios.findIndex(ex => ex.id === exercicio.id);
          const isNotLastExercicio = exercicioIndex < exercicios.length - 1;
          
          return exercicios.length > 1 && isNotLastExercicio && (
            <View style={styles.intervaloExercicioContainer}>
              <Ionicons name="pause-outline" size={16} color="#8B5CF6" />
              <Text style={styles.intervaloExercicioLabel}>Intervalo após este exercício:</Text>
              <TextInput
                style={styles.intervaloExercicioInput}
                value={(exercicio.intervaloAposExercicio || 180).toString()}
                onChangeText={(text) => atualizarIntervaloExercicio(treinoId, exercicio.id, parseInt(text) || 180)}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.intervaloUnidade}>s</Text>
            </View>
          );
        })()}
      </View>
    </View>
  );

  // RENDER EXERCÍCIO COMBINADO
  const renderExercicioCombinado = (exercicio: ExercicioRotinaLocal, treinoId: string) => (
    <View key={exercicio.id} style={styles.exercicioCard}>
      <View style={styles.exercicioHeader}>
        <View style={styles.exercicioInfo}>
          <Text style={styles.exercicioNome}>{exercicio.nome}</Text>
          <View style={styles.exercicioCombinadoTags}>
            <Text style={styles.serieCombinadaTag}>Série Combinada</Text>
            <Text style={styles.exercicioMeta}>{exercicio.grupoMuscular}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removerExercicioLocal(treinoId, exercicio.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.seriesContainer}>
        <Text style={styles.seriesLabel}>Séries:</Text>
        {Array.isArray(exercicio.series) && exercicio.series.map((serie) => (
          <View key={serie.id}>
            <View style={styles.serieCombinadaContainer}>
              <Text style={styles.serieNumero}>{serie.numero}</Text>
              
              {/* Exercícios da série combinada */}
              <View style={styles.exerciciosCombinadosContainer}>
                {Array.isArray(exercicio.exerciciosCombinados) && exercicio.exerciciosCombinados.map((exCombinado, index) => (
                  <View key={index} style={styles.exercicioCombinadoItem}>
                    <Text style={styles.exercicioCombinadoNome}>
                      {index + 1}. {exCombinado.nome}
                    </Text>
                    <View style={styles.exercicioCombinadoInputs}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Rep</Text>
                        <TextInput
                          style={styles.serieInput}
                          value="12"
                          onChangeText={() => {}} // TODO: implementar controle individual
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Kg</Text>
                        <TextInput
                          style={styles.serieInput}
                          value="0"
                          onChangeText={() => {}} // TODO: implementar controle individual
                          keyboardType="numeric"
                          maxLength={6}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {exercicio.series.length > 1 && (
                <TouchableOpacity
                  style={styles.removeSerieButton}
                  onPress={() => removerSerie(treinoId, exercicio.id, serie.id)}
                >
                  <Ionicons name="close" size={16} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* INTERVALO ENTRE SÉRIES - só mostra se tem mais de uma série */}
            {exercicio.series.length > 1 && serie.numero < exercicio.series.length && (
              <View style={styles.intervaloContainer}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.intervaloLabel}>Intervalo entre séries:</Text>
                <TextInput
                  style={styles.intervaloInput}
                  value={(serie.intervaloAposSerie || 120).toString()}
                  onChangeText={(text) => atualizarSerie(treinoId, exercicio.id, serie.id, 'intervaloAposSerie', parseInt(text) || 120)}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.intervaloUnidade}>s</Text>
              </View>
            )}
          </View>
        ))}
        
        <TouchableOpacity
          style={styles.addSerieButton}
          onPress={() => adicionarSerie(treinoId, exercicio.id)}
        >
          <Ionicons name="add" size={16} color="#007AFF" />
          <Text style={styles.addSerieText}>Adicionar Série</Text>
        </TouchableOpacity>
        
        {/* INTERVALO APÓS EXERCÍCIO - só mostra se tem mais de um exercício no treino */}
        {(() => {
          const treino = dadosExibicao.treinos.find(t => t.id === treinoId);
          const exercicios = treino?.exercicios || [];
          const exercicioIndex = exercicios.findIndex(ex => ex.id === exercicio.id);
          const isNotLastExercicio = exercicioIndex < exercicios.length - 1;
          
          return exercicios.length > 1 && isNotLastExercicio && (
            <View style={styles.intervaloExercicioContainer}>
              <Ionicons name="pause-outline" size={16} color="#8B5CF6" />
              <Text style={styles.intervaloExercicioLabel}>Intervalo após este exercício:</Text>
              <TextInput
                style={styles.intervaloExercicioInput}
                value={(exercicio.intervaloAposExercicio || 180).toString()}
                onChangeText={(text) => atualizarIntervaloExercicio(treinoId, exercicio.id, parseInt(text) || 180)}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.intervaloUnidade}>s</Text>
            </View>
          );
        })()}
      </View>
    </View>
  );

  // RENDER TREINO
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
          
          {/* ✅ BOTÃO SÓ NO TOPO QUANDO NÃO TEM EXERCÍCIOS */}
          {!temExercicios && (
            <TouchableOpacity
              style={styles.addExercicioButton}
              onPress={() => abrirModalExercicio(treino.id, treino.gruposMusculares || [])}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addExercicioButtonText}>Exercício</Text>
            </TouchableOpacity>
          )}
        </View>

        {!temExercicios ? (
          <View style={styles.emptyExercicios}>
            <Ionicons name="barbell-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyExerciciosText}>Nenhum exercício adicionado</Text>
            <Text style={styles.emptyExerciciosSubtext}>Toque no botão acima para começar</Text>
          </View>
        ) : (
          <>
            {/* Lista de exercícios */}
            {Array.isArray(treino.exercicios) && treino.exercicios.map((exercicio: ExercicioRotinaLocal) => 
              renderExercicio(exercicio, treino.id)
            )}
            
            {/* ✅ BOTÃO NO FINAL QUANDO TEM EXERCÍCIOS */}
            <TouchableOpacity
              style={styles.addExercicioButtonBottom}
              onPress={() => abrirModalExercicio(treino.id, treino.gruposMusculares || [])}
            >
              <Ionicons name="add" size={18} color="#007AFF" />
              <Text style={styles.addExercicioButtonBottomText}>Adicionar Outro Exercício</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <RotinaProgressHeader
        title="Configuração de Exercícios e Séries"
        subtitle={`${getTotalExercicios()} exercícios adicionados`}
        alunoId={configSalva.alunoId}
        showExitButton={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.rotinaInfo}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <View style={styles.rotinaInfoText}>
            <Text style={styles.rotinaInfoTitle}>{dadosExibicao.nomeRotina}</Text>
            <Text style={styles.rotinaInfoSubtitle}>
              Configurando exercícios para {dadosExibicao.treinos.length} treinos
            </Text>
          </View>
        </View>

        {/* ✅ NOVO: Card de requisitos */}
        {renderRequisitos()}

        {dadosExibicao.treinos.map(treino => renderTreino(treino))}
        
        {/* ✅ BOTÕES MOVIDOS PARA DENTRO DO SCROLL - NO FINAL */}
        <View style={styles.bottomActionsInScroll}>
          <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
            <Text style={styles.previousButtonText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.nextButton, !isFormValid() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!isFormValid() || loading}
          >
            <Text style={[styles.nextButtonText, !isFormValid() && styles.nextButtonTextDisabled]}>
              {loading ? 'Avançando...' : 'Revisar Rotina'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal
        visible={modals.exercicioModal}
        transparent
        animationType="slide"
        onRequestClose={() => closeModal('exercicioModal')}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalOverlay}>
          <View 
            style={styles.modalContainer}
            accessibilityLabel="Adicionar exercício ao treino"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Exercício</Text>
              <TouchableOpacity onPress={() => closeModal('exercicioModal')}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.tipoFiltros}>
              <Text style={styles.filtroLabel}>Tipo de Série:</Text>
              <View style={styles.filtroButtons}>
                <TouchableOpacity 
                  style={[styles.tipoButton, tipoSerie === 'simples' && styles.tipoButtonActive]}
                  onPress={() => {
                    setTipoSerie('simples');
                    setExerciciosSelecionados([]);
                  }}
                >
                  <Text style={[styles.tipoButtonText, tipoSerie === 'simples' && styles.tipoButtonTextActive]}>
                    🎯 Simples (1)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tipoButton, tipoSerie === 'combinada' && styles.tipoButtonActive]}
                  onPress={() => {
                    setTipoSerie('combinada');
                    setExerciciosSelecionados([]);
                  }}
                >
                  <Text style={[styles.tipoButtonText, tipoSerie === 'combinada' && styles.tipoButtonTextActive]}>
                    🔗 Combinada (2)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {tipoSerie === 'combinada' && (
              <View style={styles.selecaoInfoCompacta}>
                <Text style={styles.selecaoTextoCompacto}>
                  🔗 Combinada ({exerciciosSelecionados.length}/2)
                </Text>
                {exerciciosSelecionados.length > 0 && (
                  <View style={styles.exerciciosSelecionadosCompacto}>
                    {exerciciosSelecionados.map((ex, index) => (
                      <Text key={ex.id} style={styles.exercicioSelecionadoCompacto}>
                        {index + 1}. {ex.nome}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ✅ SEÇÃO DE FILTROS REORGANIZADA - GRUPOS E FONTE SEPARADOS */}
            <View style={styles.filtrosSection}>
              {/* Grupos em linha própria */}
              <View style={styles.gruposFiltroCompacto}>
                <Text style={styles.filtroLabelCompacto}>Grupos:</Text>
                <View style={styles.gruposTagsContainer}>
                  {gruposFiltro.map(grupo => (
                    <View key={grupo} style={styles.grupoFiltroTagCompacto}>
                      <Text style={styles.grupoFiltroTextCompacto}>{grupo}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              {/* Fonte em linha própria */}
              <View style={styles.fonteFiltroCompacto}>
                <Text style={styles.filtroLabelCompacto}>Fonte:</Text>
                <TouchableOpacity 
                  style={styles.dropdownButtonCompacto}
                  onPress={() => setShowFiltroModal(true)}
                >
                  <Text style={styles.dropdownTextCompacto}>
                    {filtroTipo === 'todos' ? 'Todos' : 
                     filtroTipo === 'padrao' ? 'Padrão' : 
                     'Meus'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Filtro por Grupo Muscular - só aparece com múltiplos grupos */}
              {gruposDoTreino.length > 1 && (
                <View style={styles.grupoMuscularesFiltroCompacto}>
                  <Text style={styles.filtroLabelCompacto}>Filtro:</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.gruposFiltroScrollCompacto}
                    contentContainerStyle={styles.gruposFiltroScrollContentCompacto}
                  >
                    <TouchableOpacity
                      style={[
                        styles.grupoFiltroButtonCompacto,
                        filtroGrupoMuscular === 'todos' && styles.grupoFiltroButtonCompactoActive
                      ]}
                      onPress={() => setFiltroGrupoMuscular('todos')}
                    >
                      <Text style={[
                        styles.grupoFiltroButtonTextCompacto,
                        filtroGrupoMuscular === 'todos' && styles.grupoFiltroButtonTextCompactoActive
                      ]}>
                        Todos ({exerciciosDisponiveis.length})
                      </Text>
                    </TouchableOpacity>
                    
                    {gruposDoTreino.map(grupo => {
                      const countGrupo = exerciciosDisponiveis.filter(ex => ex.grupo_muscular === grupo).length;
                      return (
                        <TouchableOpacity
                          key={grupo}
                          style={[
                            styles.grupoFiltroButtonCompacto,
                            filtroGrupoMuscular === grupo && styles.grupoFiltroButtonCompactoActive
                          ]}
                          onPress={() => setFiltroGrupoMuscular(grupo)}
                        >
                          <Text style={[
                            styles.grupoFiltroButtonTextCompacto,
                            filtroGrupoMuscular === grupo && styles.grupoFiltroButtonTextCompactoActive
                          ]}>
                            {grupo} ({countGrupo})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar exercício..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <ScrollView style={styles.exerciciosList}>
              {loading ? (
                <View style={styles.loadingExercicios}>
                  <Text style={styles.loadingText}>Carregando exercícios...</Text>
                </View>
              ) : (
                (() => {
                  const exerciciosFiltrados = exerciciosDisponiveis.filter(ex => 
                    ex.nome.toLowerCase().includes(searchText.toLowerCase())
                  );
                  
                  if (exerciciosFiltrados.length === 0) {
                    return (
                      <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyStateTitle}>Nenhum exercício encontrado</Text>
                        <Text style={styles.emptyStateText}>
                          Tente ajustar os filtros ou buscar por outro termo
                        </Text>
                      </View>
                    );
                  }
                  
                  return exerciciosFiltrados.map(exercicio => {
                    const isSelected = exerciciosSelecionados.find(ex => ex.id === exercicio.id);
                    const canSelect = tipoSerie === 'simples' || exerciciosSelecionados.length < 2 || isSelected;
                    
                    return (
                      <TouchableOpacity
                        key={exercicio.id}
                        style={[
                          styles.exercicioItem,
                          isSelected && styles.exercicioItemSelected,
                          !canSelect && styles.exercicioItemDisabled
                        ]}
                        onPress={() => canSelect && toggleExercicioSelecionado(exercicio)}
                        disabled={!canSelect}
                      >
                        <View style={styles.exercicioItemInfo}>
                          <Text style={[
                            styles.exercicioItemNome,
                            !canSelect && styles.exercicioItemNomeDisabled
                          ]}>
                            {exercicio.nome}
                          </Text>
                          <Text style={[
                            styles.exercicioItemMeta,
                            !canSelect && styles.exercicioItemMetaDisabled
                          ]}>
                            {exercicio.grupo_muscular} • {exercicio.equipamento}
                          </Text>
                          <Text style={styles.exercicioTipo}>
                            {exercicio.tipo === 'padrao' ? '📚 Padrão' : '⭐ Personalizado'}
                          </Text>
                        </View>
                        <View style={[
                          styles.selectionIndicator,
                          isSelected && styles.selectionIndicatorSelected
                        ]}>
                          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                        </View>
                      </TouchableOpacity>
                    );
                  });
                })()
              )}
            </ScrollView>
            
            {/* BOTÃO ADICIONAR - sempre visível quando tem seleção */}
            {exerciciosSelecionados.length > 0 && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[
                    styles.adicionarButton,
                    (tipoSerie === 'simples' && exerciciosSelecionados.length === 1) ||
                    (tipoSerie === 'combinada' && exerciciosSelecionados.length === 2)
                      ? styles.adicionarButtonEnabled 
                      : styles.adicionarButtonDisabled
                  ]}
                  onPress={adicionarExerciciosSelecionados}
                  disabled={
                    (tipoSerie === 'simples' && exerciciosSelecionados.length !== 1) ||
                    (tipoSerie === 'combinada' && exerciciosSelecionados.length !== 2)
                  }
                >
                  <Text style={[
                    styles.adicionarButtonText,
                    (tipoSerie === 'simples' && exerciciosSelecionados.length === 1) ||
                    (tipoSerie === 'combinada' && exerciciosSelecionados.length === 2)
                      ? styles.adicionarButtonTextEnabled 
                      : styles.adicionarButtonTextDisabled
                  ]}>
                    + Adicionar {tipoSerie === 'simples' ? 'Exercício' : 'Série Combinada'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DE FILTRO DE FONTE */}
      <Modal
        visible={showFiltroModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFiltroModal(false)}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <TouchableOpacity 
          style={styles.filtroModalOverlay}
          activeOpacity={1}
          onPress={() => setShowFiltroModal(false)}
        >
          <View 
            style={styles.filtroModalContainer}
            accessibilityLabel="Filtrar exercícios por fonte"
          >
            <TouchableOpacity
              style={styles.filtroModalItem}
              onPress={() => {
                setFiltroTipo('todos');
                setShowFiltroModal(false);
              }}
            >
              <Text style={styles.filtroModalText}>Todos</Text>
              {filtroTipo === 'todos' && <Ionicons name="checkmark" size={20} color="#007AFF" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.filtroModalItem}
              onPress={() => {
                setFiltroTipo('padrao');
                setShowFiltroModal(false);
              }}
            >
              <Text style={styles.filtroModalText}>📚 Exercícios Padrão</Text>
              {filtroTipo === 'padrao' && <Ionicons name="checkmark" size={20} color="#007AFF" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.filtroModalItem}
              onPress={() => {
                setFiltroTipo('personalizado');
                setShowFiltroModal(false);
              }}
            >
              <Text style={styles.filtroModalText}>⭐ Meus Exercícios</Text>
              {filtroTipo === 'personalizado' && <Ionicons name="checkmark" size={20} color="#007AFF" />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function ExerciciosRotinaScreen() {
  return <ExerciciosRotinaContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  content: {
    flex: 1
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
    borderLeftColor: '#007AFF',
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
  statsCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12
  },
  conceitosContainer: {
    gap: 12
  },
  conceitoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  conceitoIcon: {
    fontSize: 20
  },
  conceitoTexto: {
    flex: 1
  },
  conceitoTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2
  },
  conceitoDescricao: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16
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
    backgroundColor: '#007AFF',
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
  emptyExercicios: {
    alignItems: 'center',
    paddingVertical: 32
  },
  emptyExerciciosText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12
  },
  emptyExerciciosSubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
    fontStyle: 'italic'
  },
  
  // ✅ BOTÃO INFERIOR PARA ADICIONAR EXERCÍCIOS
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
    color: '#007AFF',
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
    marginBottom: 2
  },
  exercicioMeta: {
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
  serieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8
  },
  serieNumero: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 20
  },
  serieInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8
  },
  serieInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'white',
    color: '#1F2937'
  },
  inputGroup: {
    flex: 1
  },
  inputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    marginTop: 16
  },
  dropButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B'
  },
  dropButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40
  },
  dropButtonIcon: {
    fontSize: 12,
    color: '#6B7280'
  },
  dropSetContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B'
  },
  dropSetHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12
  },
  dropSetInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  dropInputGroup: {
    flex: 1
  },
  dropInputLabel: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
    fontWeight: '500'
  },
  dropInput: {
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'white',
    color: '#92400E'
  },
  dropInputContainer: {
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40
  },
  dropInputPlaceholder: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    fontStyle: 'italic'
  },
  removeDropButton: {
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignSelf: 'flex-start',
    marginTop: 20
  },
  intervaloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
    gap: 8
  },
  intervaloLabel: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1
  },
  intervaloInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 6,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'white',
    width: 50
  },
  intervaloUnidade: {
    fontSize: 12,
    color: '#6B7280'
  },
  intervaloExercicioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8
  },
  intervaloExercicioLabel: {
    fontSize: 12,
    color: '#8B5CF6',
    flex: 1,
    fontWeight: '500'
  },
  intervaloExercicioInput: {
    borderWidth: 1,
    borderColor: '#C4B5FD',
    borderRadius: 6,
    padding: 6,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'white',
    width: 50
  },
  removeSerieButton: {
    padding: 4,
    alignSelf: 'flex-start',
    marginTop: 28
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
    marginTop: 4,
    gap: 4
  },
  addSerieText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%', // ✅ AUMENTADO PARA 90% - MÁXIMO ESPAÇO
    paddingBottom: 34
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937'
  },
  tipoFiltros: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  filtroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  filtroButtons: {
    flexDirection: 'row',
    gap: 8
  },
  filtroButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  filtroButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center'
  },
  tipoButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center'
  },
  tipoButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#007AFF'
  },
  tipoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280'
  },
  tipoButtonTextActive: {
    color: '#007AFF'
  },
  selecaoInfo: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 12
  },
  selecaoTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    textAlign: 'center'
  },
  exerciciosSelecionadosContainer: {
    marginTop: 12,
    gap: 8
  },
  exercicioSelecionado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF'
  },
  exercicioSelecionadoTexto: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1
  },
  exercicioItemSelected: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF'
  },
  exercicioItemDisabled: {
    opacity: 0.5
  },
  exercicioItemNomeDisabled: {
    color: '#9CA3AF'
  },
  exercicioItemMetaDisabled: {
    color: '#D1D5DB'
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectionIndicatorSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  adicionarCombinadoButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  adicionarCombinadoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  fonteFiltros: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  fonteFiltroContainer: {
    flexDirection: 'row',
    gap: 8
  },
  fonteFiltroButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center'
  },
  fonteFiltroButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  fonteFiltroText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center'
  },
  fonteFiltroTextActive: {
    color: 'white'
  },
  exercicioTipo: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '500',
    marginTop: 2
  },
  adicionarButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4
  },
  adicionarButtonEnabled: {
    backgroundColor: '#007AFF'
  },
  adicionarButtonDisabled: {
    backgroundColor: '#E5E7EB'
  },
  adicionarButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  adicionarButtonTextEnabled: {
    color: 'white'
  },
  adicionarButtonTextDisabled: {
    color: '#9CA3AF'
  },
  dropdownContainer: {
    flex: 1
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  dropdownText: {
    fontSize: 14,
    color: '#374151',
    flex: 1
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20
  },
  selecaoInfoCompacta: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 8
  },
  selecaoTextoCompacto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    textAlign: 'center'
  },
  exerciciosSelecionadosCompacto: {
    marginTop: 8
  },
  exercicioSelecionadoCompacto: {
    fontSize: 11,
    color: '#3B82F6',
    textAlign: 'center',
    marginVertical: 1
  },
  exercicioCombinadoTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4
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
  serieCombinadaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12
  },
  exerciciosCombinadosContainer: {
    flex: 1,
    gap: 8
  },
  exercicioCombinadoItem: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6'
  },
  exercicioCombinadoNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  exercicioCombinadoInputs: {
    flexDirection: 'row',
    gap: 12
  },
  filtroModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  filtroModalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    minWidth: 250,
    maxWidth: 300,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8
  },
  filtroModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  filtroModalText: {
    fontSize: 16,
    color: '#374151',
    flex: 1
  },
  gruposFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8
  },
  gruposFiltroLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151'
  },
  grupoFiltroTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  grupoFiltroText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500'
  },
  
  // ✅ ESTILOS PARA LAYOUT OTIMIZADO - LINHAS SEPARADAS
  filtrosSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12
  },
  gruposFiltroCompacto: {
    paddingHorizontal: 20,
    paddingVertical: 6
  },
  fonteFiltroCompacto: {
    paddingHorizontal: 20,
    paddingVertical: 6
  },
  filtroLabelCompacto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6
  },
  gruposTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  grupoFiltroTagCompacto: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  grupoFiltroTextCompacto: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '500'
  },
  dropdownButtonCompacto: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 120
  },
  dropdownTextCompacto: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500'
  },
  grupoMuscularesFiltroCompacto: {
    paddingHorizontal: 20,
    paddingVertical: 8
  },
  gruposFiltroScrollCompacto: {
    marginTop: 4
  },
  gruposFiltroScrollContentCompacto: {
    gap: 8
  },
  grupoFiltroButtonCompacto: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  grupoFiltroButtonCompactoActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  grupoFiltroButtonTextCompacto: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500'
  },
  grupoFiltroButtonTextCompactoActive: {
    color: 'white'
  },
  
  // ✅ ESTILOS PARA FILTRO POR GRUPO MUSCULAR
  grupoMuscularesFiltro: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  gruposFiltroScroll: {
    marginTop: 8
  },
  gruposFiltroScrollContent: {
    paddingRight: 20,
    gap: 8
  },
  grupoFiltroButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    marginRight: 8
  },
  grupoFiltroButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  grupoFiltroButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280'
  },
  grupoFiltroButtonTextActive: {
    color: 'white'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937'
  },
  exerciciosList: {
    flex: 1, // ✅ Garante que use todo o espaço restante
    paddingHorizontal: 20,
    marginTop: 8 // ✅ Reduzido para aproveitar melhor o espaço
  },
  loadingExercicios: {
    padding: 20,
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280'
  },
  tipoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 8
  },
  tipoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  },
  tipoCount: {
    fontSize: 14,
    color: '#6B7280'
  },
  exercicioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  exercicioItemInfo: {
    flex: 1
  },
  exercicioItemNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2
  },
  exercicioItemMeta: {
    fontSize: 13,
    color: '#6B7280'
  },
  bottomActions: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12
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
    backgroundColor: '#007AFF',
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
  // Requisitos (novos estilos)
  requisitosCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  requisitosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  requisitosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  requisitosContent: {
    gap: 6,
  },
  requisitoItem: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  requisitoSucesso: {
    color: '#059669',
    fontWeight: '500',
  },
  requisitoInfo: {
    color: '#1D4ED8',
    fontWeight: '500',
  },
  requisitoAlerta: {
    color: '#DC2626',
    fontWeight: '500',
  }
});
// app/criar-rotina/revisao.tsx - VERSÃO CORRIGIDA COM SWITCH FIXES
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Components
import LoadingIcon from '../../components/LoadingIcon';
import { RotinaProgressHeader } from '../../components/rotina/RotinaProgressHeader';

// Supabase
import { supabase } from '../../lib/supabase';

function RevisaoRotinaContent() {
  const router = useRouter();
  const { alunoId } = useLocalSearchParams<{ alunoId?: string }>();

  // Estados locais
  const [enviarResumoEmail, setEnviarResumoEmail] = useState(true);
  const [creating, setCreating] = useState(false);
  const [statusRotina, setStatusRotina] = useState<'pendente' | 'ativa'>('pendente');
  const [permitirExecucaoAluno, setPermitirExecucaoAluno] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    configuracao: true,
    treinos: false
  });

  // 🔥 ESTADO DO TOAST
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // 🔥 FUNÇÃO PARA MOSTRAR TOAST
  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  };

  // Estado para dados da rotina carregados do sessionStorage
  const [rotinaData, setRotinaData] = useState<{
    nomeRotina: string;
    descricao: string;
    alunoId: string;
    treinosPorSemana: number;
    dificuldade: string;
    duracaoSemanas: number;
    dataInicio: string;
    valorTotal: number;
    formaPagamento: string;
    treinos: any[];
    exercicios: any[];
  }>({
    nomeRotina: '',
    descricao: '',
    alunoId: '',
    treinosPorSemana: 3,
    dificuldade: 'Média',
    duracaoSemanas: 4,
    dataInicio: '',
    valorTotal: 0,
    formaPagamento: 'pix',
    treinos: [],
    exercicios: []
  });

  // ✅ CARREGAR DADOS DO SESSIONSTORAGE - CORRIGIDO
  useEffect(() => {
    const loadRotinaData = () => {
      try {
        const configuracao = JSON.parse(sessionStorage.getItem('rotina_configuracao') || '{}');
        const treinos = JSON.parse(sessionStorage.getItem('rotina_treinos') || '[]');
        const exercicios = JSON.parse(sessionStorage.getItem('rotina_exercicios') || '{}');

        console.log('🔍 [Revisao] Dados carregados do sessionStorage:');
        console.log('📋 Configuração:', configuracao);
        console.log('🏋️ Treinos:', treinos);
        console.log('💪 Exercícios:', exercicios);

        // ✅ LIMPAR E VALIDAR DADOS
        const treinosLimpos = Array.isArray(treinos) ? treinos.filter(t => t && typeof t === 'object') : [];
        
        // ✅ MESCLAR EXERCÍCIOS COM TREINOS - COM VALIDAÇÃO
        const treinosComExercicios = treinosLimpos.map((treino: any) => {
          const exerciciosDoTreino = exercicios[treino.id] || [];
          return {
            ...treino,
            exercicios: Array.isArray(exerciciosDoTreino) ? exerciciosDoTreino : [],
            gruposMusculares: Array.isArray(treino.gruposMusculares) 
              ? treino.gruposMusculares
                  .filter((g: any) => g && typeof g === 'string' && g.trim() && g.trim() !== '.')
                  .map((g: string) => g.trim())
              : []
          };
        });

        console.log('🔀 Treinos com exercícios mesclados:', treinosComExercicios);

        setRotinaData({
          nomeRotina: (configuracao.nomeRotina || '').toString().trim(),
          descricao: (configuracao.descricao || '').toString().trim(),
          alunoId: configuracao.alunoId || alunoId || '',
          treinosPorSemana: Number(configuracao.treinosPorSemana) || 3,
          dificuldade: (configuracao.dificuldade || 'Média').toString().trim(),
          duracaoSemanas: Number(configuracao.duracaoSemanas) || 4,
          dataInicio: configuracao.dataInicio || '',
          valorTotal: configuracao.valorTotal || 0,
          formaPagamento: configuracao.formaPagamento || 'pix',
          treinos: treinosComExercicios,
          exercicios: exercicios
        });
      } catch (error) {
        console.error('Erro ao carregar dados da rotina:', error);
        showToast('Erro ao carregar dados da rotina', 'error');
      }
    };

    loadRotinaData();
  }, [alunoId]);

  // ✅ RESETAR EXECUÇÃO PELO ALUNO QUANDO STATUS MUDAR PARA PENDENTE
  useEffect(() => {
    if (statusRotina === 'pendente') {
      setPermitirExecucaoAluno(false);
    }
  }, [statusRotina]);

  // ✅ FUNÇÃO PARA GERAR EXECUÇÕES AUTOMÁTICAS
  const gerarExecucoesAutomaticas = async (rotinaId: string, treinosCreated: { id: string }[], configuracao: any) => {
    try {
      console.log('🎯 [EXECUÇÕES] Gerando execuções automáticas...');
      
      const totalSessoes = configuracao.treinosPorSemana * configuracao.duracaoSemanas;
      const sessoes: {
        rotina_id: string;
        treino_id: string;
        aluno_id: string;
        sessao_numero: number;
        status: string;
        data_execucao: null;
        tempo_total_minutos: null;
        observacoes: null;
      }[] = [];

      // ✅ CRIAR SESSÕES (execucoes_sessao)
      for (let i = 1; i <= totalSessoes; i++) {
        const treinoIndex = (i - 1) % treinosCreated.length;
        const treino = treinosCreated[treinoIndex];
        
        sessoes.push({
          rotina_id: rotinaId,
          treino_id: treino.id,
          aluno_id: configuracao.alunoId as string,
          sessao_numero: i,
          status: 'nao_iniciada',
          data_execucao: null,
          tempo_total_minutos: null,
          observacoes: null
        });
      }

      console.log(`📅 Criando ${totalSessoes} sessões de execução...`);
      const { data: sessoesCreated, error: sessoesError } = await supabase
        .from('execucoes_sessao')
        .insert(sessoes)
        .select('id, treino_id');

      if (sessoesError) throw sessoesError;
      console.log('✅ Sessões criadas:', sessoesCreated?.length);

      // ✅ CRIAR EXECUÇÕES DE SÉRIES (execucoes_series)
      // ⚠️ ATENÇÃO: Séries serão criadas quando o aluno executar o treino
      // As políticas RLS só permitem que o próprio aluno crie suas execuções de séries
      console.log('ℹ️ Execuções de séries serão criadas durante a execução pelo aluno');

      console.log('🎉 Execuções automáticas criadas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao gerar execuções automáticas:', error);
      throw error;
    }
  };

  // ✅ FUNÇÃO COMPLETA PARA CRIAR ROTINA - CORRIGIDA COM VALIDAÇÕES DE SÉRIE
  const criarRotinaCompleta = async () => {
    setCreating(true);

    try {
      console.log('🏋️ [CRIAR ROTINA] Iniciando criação completa...');

      // ✅ 1. OBTER USUÁRIO AUTENTICADO
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // ✅ 2. LER DADOS DO SESSIONSTORAGE
      const configuracao = JSON.parse(sessionStorage.getItem('rotina_configuracao') || '{}');
      const treinos = JSON.parse(sessionStorage.getItem('rotina_treinos') || '[]');
      const exerciciosPorTreino = JSON.parse(sessionStorage.getItem('rotina_exercicios') || '{}');

      console.log('📋 Dados carregados:', {
        configuracao: !!configuracao.nomeRotina,
        treinos: treinos.length,
        exercicios: Object.keys(exerciciosPorTreino).length
      });

      // ✅ VALIDAÇÕES BÁSICAS
      if (!configuracao.nomeRotina) {
        throw new Error('Configuração da rotina não encontrada');
      }
      if (treinos.length === 0) {
        throw new Error('Nenhum treino configurado');
      }

      // ✅ 3. CRIAR ROTINA PRINCIPAL
      console.log('🔧 Criando rotina principal...');
      
      const rotinaData = {
        nome: configuracao.nomeRotina,
        descricao: configuracao.descricao || null,
        aluno_id: configuracao.alunoId,
        personal_trainer_id: user.id,
        treinos_por_semana: configuracao.treinosPorSemana,
        dificuldade: configuracao.dificuldade,
        duracao_semanas: configuracao.duracaoSemanas,
        data_inicio: new Date().toISOString().split('T')[0],
        valor_total: 0,
        forma_pagamento: 'pix',
        status: statusRotina,
        permite_execucao_aluno: statusRotina === 'ativa' && permitirExecucaoAluno,
        observacoes_pagamento: null
      };

      const { data: rotinaCreated, error: rotinaError } = await supabase
        .from('rotinas')
        .insert([rotinaData])
        .select('id')
        .single();

      if (rotinaError) throw rotinaError;
      if (!rotinaCreated) throw new Error('Falha ao criar rotina');

      console.log('✅ Rotina criada:', rotinaCreated.id);

      // ✅ 4. CRIAR TREINOS
      console.log('🏋️ Criando treinos...');
      const treinosCreated: { id: string }[] = [];
      
      for (const [treinoIndex, treino] of treinos.entries()) {
        const exerciciosDoTreino = exerciciosPorTreino[treino.id] || [];
        
        const treinoData = {
          rotina_id: rotinaCreated.id,
          nome: treino.nome,
          grupos_musculares: treino.gruposMusculares?.length > 0 ? treino.gruposMusculares.join(', ') : '',
          ordem: treinoIndex + 1,
          tempo_estimado_minutos: 60 + (exerciciosDoTreino.length * 15),
          observacoes: null
        };

        const { data: treinoCreated, error: treinoError } = await supabase
          .from('treinos')
          .insert([treinoData])
          .select('id')
          .single();

        if (treinoError) throw treinoError;
        treinosCreated.push(treinoCreated);
        console.log(`✅ Treino criado: ${treino.nome} (${exerciciosDoTreino.length} exercícios)`);

        // ✅ 5. CRIAR EXERCÍCIOS DO TREINO
        if (exerciciosDoTreino.length > 0) {
          console.log(`💪 Criando exercícios do ${treino.nome}...`);
          
          for (const [exercicioIndex, exercicio] of exerciciosDoTreino.entries()) {
            
            // ✅ DETERMINAR SE É ÚLTIMO EXERCÍCIO (para intervalo)
            const isUltimoExercicio = exercicioIndex === exerciciosDoTreino.length - 1;
            
            let exercicioData;
            
            // ✅ EXERCÍCIO SIMPLES
            if (exercicio.tipo === 'tradicional') {
              exercicioData = {
                treino_id: treinoCreated.id,
                exercicio_1: exercicio.nome,
                exercicio_2: null,
                intervalo_apos_exercicio: isUltimoExercicio ? null : (exercicio.intervaloAposExercicio || 180),
                ordem: exercicioIndex + 1
              };
            }
            // ✅ EXERCÍCIO COMBINADO (Bi-set/Super-set)
            else if (exercicio.tipo === 'combinada' && exercicio.exerciciosCombinados) {
              exercicioData = {
                treino_id: treinoCreated.id,
                exercicio_1: exercicio.exerciciosCombinados[0]?.nome || 'Exercício 1',
                exercicio_2: exercicio.exerciciosCombinados[1]?.nome || 'Exercício 2',
                intervalo_apos_exercicio: isUltimoExercicio ? null : (exercicio.intervaloAposExercicio || 180),
                ordem: exercicioIndex + 1
              };
            } else {
              console.warn('⚠️ Tipo de exercício não reconhecido:', exercicio.tipo);
              continue;
            }

            const { data: exercicioCreated, error: exercicioError } = await supabase
              .from('exercicios_rotina')
              .insert([exercicioData])
              .select('id')
              .single();

            if (exercicioError) throw exercicioError;
            console.log(`✅ Exercício criado: ${exercicio.nome}`);

            // ✅ 6. CRIAR SÉRIES - ESTRUTURA CORRIGIDA COM VALIDAÇÕES
            if (exercicio.series.length > 0) {
              console.log(`⚡ Criando ${exercicio.series.length} séries...`);
              
              for (const [serieIndex, serie] of exercicio.series.entries()) {
                
                // ✅ VALIDAR ESTRUTURA DA SÉRIE
                if (!serie) {
                  console.warn('⚠️ Série inválida encontrada, pulando...');
                  continue;
                }
                
                console.log('🔍 Processando série:', {
                  serieIndex,
                  serie,
                  repeticoes: serie.repeticoes,
                  tipo: typeof serie.repeticoes,
                  valor: serie.repeticoes || 12
                });
                
                // ✅ DETERMINAR SE É ÚLTIMA SÉRIE (para intervalo)
                const isUltimaSerie = serieIndex === exercicio.series.length - 1;
                
                let serieData;
                
                // ✅ SÉRIE SIMPLES
                if (exercicio.tipo === 'tradicional') {
                  console.log('🔍 DEBUG - Criando série simples:', {
                    serie: serie,
                    numero: serie.numero,
                    repeticoes: serie.repeticoes,
                    carga: serie.carga,
                    repeticoesComPadrao: serie.repeticoes || 12,
                    cargaComPadrao: serie.carga || 0
                  });
                  
                  // Garantir valores válidos
                  const repeticoes = Number(serie.repeticoes) || 12;
                  const carga = Number(serie.carga) || 0;
                  const numero = Number(serie.numero) || 1;
                  
                  serieData = {
                    exercicio_id: exercicioCreated.id,
                    numero_serie: numero,
                    repeticoes: repeticoes, // ✅ CORRIGIDO: nome correto da coluna
                    carga: carga, // ✅ CORRIGIDO: nome correto da coluna
                    tem_dropset: serie.isDropSet || false,
                    carga_dropset: serie.isDropSet ? (Number(serie.dropsConfig?.[0]?.cargaReduzida) || 0) : null,
                    intervalo_apos_serie: isUltimaSerie ? null : (Number(serie.intervaloAposSerie) || 120)
                  };
                  
                  console.log('🎯 DEBUG - SerieData criada:', serieData);
                }
                // ✅ SÉRIE COMBINADA
                else if (exercicio.tipo === 'combinada') {
                  console.log('🔍 DEBUG - Criando série combinada:', {
                    serie: serie,
                    numero: serie.numero,
                    repeticoes: serie.repeticoes,
                    carga: serie.carga,
                    repeticoesComPadrao: serie.repeticoes || 12,
                    cargaComPadrao: serie.carga || 0
                  });
                  
                  // Garantir valores válidos
                  const repeticoes = Number(serie.repeticoes) || 12;
                  const carga = Number(serie.carga) || 0;
                  const numero = Number(serie.numero) || 1;
                  
                  serieData = {
                    exercicio_id: exercicioCreated.id,
                    numero_serie: numero,
                    repeticoes: repeticoes, // ✅ CORRIGIDO: nome correto da coluna
                    carga: carga, // ✅ CORRIGIDO: nome correto da coluna
                    tem_dropset: false, // Combinadas não têm dropset
                    carga_dropset: null,
                    intervalo_apos_serie: isUltimaSerie ? null : (Number(serie.intervaloAposSerie) || 120)
                  };
                  
                  console.log('🎯 DEBUG - SerieData combinada criada:', serieData);
                }

                const { error: serieError } = await supabase
                  .from('series')
                  .insert([serieData]);

                if (serieError) {
                  console.error('❌ Erro ao criar série:', serieError);
                  throw serieError;
                }
                
                // Log especial para drop sets
                if (serie.isDropSet) {
                  console.log(`🔥 Série ${serie.numero} com drop set: ${serie.dropsConfig?.[0]?.cargaReduzida}kg`);
                }
              }
            }
          }
        }
      }

      // ✅ 7. GERAR EXECUÇÕES AUTOMÁTICAS
      console.log('🎯 Gerando execuções automáticas...');
      await gerarExecucoesAutomaticas(rotinaCreated.id, treinosCreated, configuracao);

      console.log('🎉 Rotina completa criada com sucesso!');

      // ✅ 8. LIMPAR SESSIONSTORAGE
      sessionStorage.removeItem('rotina_configuracao');
      sessionStorage.removeItem('rotina_treinos');
      sessionStorage.removeItem('rotina_exercicios');
      console.log('🧹 SessionStorage limpo');

      // ✅ 9. TOAST DE SUCESSO
      showToast(
        `Rotina "${configuracao.nomeRotina}" criada com sucesso!`,
        'success'
      );

      // ✅ 10. NAVEGAR APÓS DELAY
      setTimeout(() => {
        router.replace(`/rotinas/${configuracao.alunoId}`);
      }, 2000);

    } catch (error: any) {
      console.error('❌ Erro ao criar rotina:', error);
      showToast(
        `Erro: ${error.message || 'Falha ao criar rotina'}`,
        'error'
      );
    } finally {
      setCreating(false);
    }
  };

  // ✅ TOGGLE EXPANSÃO DE SEÇÕES
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // ✅ CÁLCULOS E ESTATÍSTICAS - CORRIGIDO COM VERIFICAÇÕES
  const getEstatisticas = () => {
    const totalTreinos = rotinaData.treinos?.length || 0;
    const totalExercicios = rotinaData.treinos?.reduce((total, treino) => {
      return total + (treino.exercicios?.length || 0);
    }, 0) || 0;
    const totalSeries = rotinaData.treinos?.reduce((total, treino) => {
      return total + (treino.exercicios?.reduce((subTotal, ex) => {
        return subTotal + (ex.series?.length || 0);
      }, 0) || 0);
    }, 0) || 0;
    const sessõesTotais = (rotinaData.treinosPorSemana || 0) * (rotinaData.duracaoSemanas || 0);

    return {
      totalTreinos,
      totalExercicios,
      totalSeries,
      sessõesTotais
    };
  };

  const estatisticas = getEstatisticas();

  // ✅ OBTER COR DA DIFICULDADE
  const getCorDificuldade = (dificuldade: string) => {
    switch (dificuldade) {
      case 'Baixa': return '#10B981';
      case 'Média': return '#F59E0B';
      case 'Alta': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // ✅ NAVEGAÇÃO
  const handlePrevious = () => {
    router.push('/criar-rotina/exercicios');
  };

  const handleFinalizarRotina = async () => {
    if (!rotinaData.alunoId) {
      showToast('ID do aluno não encontrado', 'error');
      return;
    }

    await criarRotinaCompleta();
  };

  // ✅ RENDERIZAR SEÇÃO EXPANSÍVEL
  const renderSection = (
    title: string,
    icon: string,
    sectionKey: keyof typeof expandedSections,
    children: React.ReactNode
  ) => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection(sectionKey)}
      >
        <View style={styles.sectionTitleContainer}>
          <Ionicons name={icon as any} size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Ionicons 
          name={expandedSections[sectionKey] ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6B7280" 
        />
      </TouchableOpacity>
      
      {expandedSections[sectionKey] && (
        <View style={styles.sectionContent}>
          {children}
        </View>
      )}
    </View>
  );

  // ✅ CUSTOM SWITCH COMPONENT (substitui Switch nativo)
  const CustomSwitch = ({ value, onValueChange, style }: { value: boolean; onValueChange: (value: boolean) => void; style?: any }) => (
    <TouchableOpacity
      style={[
        styles.customSwitch,
        value && styles.customSwitchActive,
        style
      ]}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.8}
    >
      <View style={[
        styles.customSwitchThumb,
        value && styles.customSwitchThumbActive
      ]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ✅ HEADER SEM ALUNO ID */}
      <RotinaProgressHeader
        title="Revisão Final"
        subtitle="Confirme todos os dados antes de criar"
      />

      {/* ✅ CONTEÚDO PRINCIPAL */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Estatísticas resumidas */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Resumo da Rotina</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{estatisticas.totalTreinos}</Text>
              <Text style={styles.statLabel}>Treinos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{estatisticas.totalExercicios}</Text>
              <Text style={styles.statLabel}>Exercícios</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{estatisticas.totalSeries}</Text>
              <Text style={styles.statLabel}>Séries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{estatisticas.sessõesTotais}</Text>
              <Text style={styles.statLabel}>Sessões Total</Text>
            </View>
          </View>
        </View>

        {/* Seção: Status da Rotina */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flag-outline" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Status da Rotina</Text>
            </View>
          </View>
          <View style={styles.statusOptionsContainer}>
            <TouchableOpacity 
              style={[
                styles.statusOption,
                statusRotina === 'pendente' && styles.statusOptionActive
              ]}
              onPress={() => setStatusRotina('pendente')}
            >
              <View style={styles.statusOptionContent}>
                <Ionicons 
                  name={statusRotina === 'pendente' ? 'radio-button-on' : 'radio-button-off'} 
                  size={20} 
                  color={statusRotina === 'pendente' ? '#007AFF' : '#9CA3AF'} 
                />
                <View style={styles.statusOptionText}>
                  <Text style={[
                    styles.statusOptionTitle,
                    statusRotina === 'pendente' && styles.statusOptionTitleActive
                  ]}>
                    Pendente
                  </Text>
                  <Text style={styles.statusOptionSubtitle}>
                    Aguardando confirmação de pagamento
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.statusOption,
                statusRotina === 'ativa' && styles.statusOptionActive
              ]}
              onPress={() => setStatusRotina('ativa')}
            >
              <View style={styles.statusOptionContent}>
                <Ionicons 
                  name={statusRotina === 'ativa' ? 'radio-button-on' : 'radio-button-off'} 
                  size={20} 
                  color={statusRotina === 'ativa' ? '#007AFF' : '#9CA3AF'} 
                />
                <View style={styles.statusOptionText}>
                  <Text style={[
                    styles.statusOptionTitle,
                    statusRotina === 'ativa' && styles.statusOptionTitleActive
                  ]}>
                    Ativo
                  </Text>
                  <Text style={styles.statusOptionSubtitle}>
                    Pagamento confirmado, rotina pronta para uso
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Opção de execução pelo aluno - ✅ CUSTOM SWITCH */}
            {statusRotina === 'ativa' && (
              <View style={styles.subOptionContainer}>
                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.switchLabel}>Habilitar execução pelo aluno</Text>
                    <Text style={styles.switchSubtitle}>
                      O aluno poderá executar os treinos em seu celular
                    </Text>
                  </View>
                  <CustomSwitch
                    value={permitirExecucaoAluno}
                    onValueChange={setPermitirExecucaoAluno}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Seção: Configuração Básica */}
        {renderSection('Configuração Básica', 'settings-outline', 'configuracao', (
          <View style={styles.configContainer}>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Nome:</Text>
              <Text style={styles.configValue}>{rotinaData.nomeRotina || 'Nome não definido'}</Text>
            </View>
            
            {rotinaData.descricao && rotinaData.descricao.trim() && rotinaData.descricao.trim() !== '.' && (
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Descrição:</Text>
                <Text style={styles.configValue}>{rotinaData.descricao.trim()}</Text>
              </View>
            )}
            
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Frequência:</Text>
              <Text style={styles.configValue}>{`${rotinaData.treinosPorSemana || 3}x por semana`}</Text>
            </View>
            
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Dificuldade:</Text>
              <View style={[styles.dificuldadeBadge, { backgroundColor: getCorDificuldade(rotinaData.dificuldade) }]}>
                <Text style={styles.dificuldadeText}>{rotinaData.dificuldade || 'Média'}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Seção: Treinos e Exercícios (Condensada) - ✅ CORRIGIDA */}
        {renderSection('Treinos e Exercícios', 'fitness-outline', 'treinos', (
          <View style={styles.treinosContainer}>
            {Array.isArray(rotinaData.treinos) && rotinaData.treinos.length > 0 ? rotinaData.treinos
              .filter((treino) => treino && treino.nome) // ✅ Filtrar treinos válidos
              .map((treino, index) => {
              
              return (
                <View key={treino.id || `treino-${index}`} style={styles.treinoResumo}>
                  <View style={styles.treinoHeaderCondensado}>
                    <Text style={styles.treinoNome}>{treino.nome || 'Treino sem nome'}</Text>
                    <Text style={styles.exerciciosCount}>
                      {`${treino.exercicios?.length || 0} exercício(s)`}
                    </Text>
                  </View>
                  
                  <View style={styles.gruposContainer}>
                    {Array.isArray(treino.gruposMusculares) && treino.gruposMusculares.length > 0 && treino.gruposMusculares
                      .filter((grupo: string) => grupo && typeof grupo === 'string' && grupo.trim() && grupo.trim() !== '.' && grupo.trim() !== '')
                      .map((grupo: string, grupoIndex: number) => (
                        <View key={`${String(grupo).trim()}-${grupoIndex}`} style={styles.grupoTag}>
                          <Text style={styles.grupoTagText}>{String(grupo).trim()}</Text>
                        </View>
                      ))}
                  </View>

                  {/* Lista de exercícios condensada - ✅ CORRIGIDA */}
                  {Array.isArray(treino.exercicios) && treino.exercicios.length > 0 && (
                    <View style={styles.exerciciosListContainer}>
                      {treino.exercicios
                        .filter((exercicio: any) => exercicio && exercicio.nome) // ✅ Filtrar exercícios válidos
                        .map((exercicio: any, exIndex: number) => {
                          return (
                            <View key={exercicio.id || `ex-${exIndex}`} style={styles.exercicioResumoCondensado}>                            <Text style={styles.exercicioNomeCondensado}>
                              {`${exIndex + 1}. ${exercicio.nome || 'Exercício sem nome'}`}
                            </Text>
                            <Text style={styles.exercicioMetaCondensado}>
                              {`${exercicio.series?.length || 0} série(s)`}
                            </Text>
                            </View>
                          );
                        })}
                    </View>
                  )}
                </View>
              );
            }) : (
              <Text style={styles.exerciciosCount}>Nenhum treino configurado</Text>
            )}
          </View>
        ))}

        {/* Configurações finais - ✅ CUSTOM SWITCH */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="settings-outline" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Configurações Finais</Text>
            </View>
          </View>
          <View style={styles.finalConfigContainer}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Enviar resumo por email</Text>
                <Text style={styles.switchSubtitle}>
                  O aluno receberá um email com todos os detalhes da rotina
                </Text>
              </View>
              <CustomSwitch
                value={enviarResumoEmail}
                onValueChange={setEnviarResumoEmail}
              />
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* ✅ BOTÕES PRÓPRIOS */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
          <Ionicons name="arrow-back" size={20} color="#6B7280" />
          <Text style={styles.previousButtonText}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.nextButton, creating && styles.nextButtonDisabled]}
          onPress={handleFinalizarRotina}
          disabled={creating}
        >
          {creating ? (
            <LoadingIcon color="white" size={20} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.nextButtonText}>
                {statusRotina === 'pendente' ? 'Criar como Pendente' : 'Criar como Ativo'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 🔥 TOAST DE NOTIFICAÇÃO */}
      {toastVisible && (
        <View style={[
          styles.toast, 
          toastType === 'success' ? styles.toastSuccess : styles.toastError
        ]}>
          <Ionicons 
            name={toastType === 'success' ? 'checkmark-circle' : 'alert-circle'} 
            size={20} 
            color="white" 
          />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

export default function RevisaoRotinaScreen() {
  return <RevisaoRotinaContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionContent: {
    padding: 16,
  },
  configContainer: {
    gap: 12,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  configLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  configValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  dificuldadeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dificuldadeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  treinosContainer: {
    gap: 12,
  },
  treinoResumo: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  treinoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  gruposContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  grupoTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  grupoTagText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  exerciciosCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  finalConfigContainer: {
    padding: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  // ✅ CUSTOM SWITCH STYLES
  customSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  customSwitchActive: {
    backgroundColor: '#93C5FD',
  },
  customSwitchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9CA3AF',
    alignSelf: 'flex-start',
  },
  customSwitchThumbActive: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  bottomSpacing: {
    height: 20,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    gap: 8,
    flex: 1,
  },
  previousButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    gap: 8,
    flex: 2,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  statusOptionsContainer: {
    padding: 16,
  },
  statusOption: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    overflow: 'hidden',
  },
  statusOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  statusOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  statusOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  statusOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  statusOptionTitleActive: {
    color: '#007AFF',
  },
  statusOptionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  subOptionContainer: {
    backgroundColor: '#F8FAFC',
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    paddingLeft: 12,
  },
  treinoHeaderCondensado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciciosListContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  exercicioResumoCondensado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  exercicioNomeCondensado: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    marginRight: 8,
  },
  exercicioMetaCondensado: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    gap: 12,
  },
  toastSuccess: {
    backgroundColor: '#10B981',
  },
  toastError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
});

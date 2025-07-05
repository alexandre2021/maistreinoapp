// app/criar-rotina/revisao.tsx - VERSÃO REFATORADA E SIMPLIFICADA
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

// Constants
import { DifficultyColors } from '../../constants/Colors';

// Components
import LoadingIcon from '../../components/LoadingIcon';
import { RotinaProgressHeader } from '../../components/rotina/RotinaProgressHeader';
import { CustomSwitch } from '../../components/ui/CustomSwitch';

// Supabase
import { supabase } from '../../lib/supabase';

// ✅ STORAGE MANAGER CENTRALIZADO
class RevisaoStorage {
  private static readonly STORAGE_KEYS = {
    CONFIG: 'rotina_configuracao',
    TREINOS: 'rotina_treinos',
    EXERCICIOS: 'rotina_exercicios'
  };

  static lerDadosCompletos() {
    try {
      const configuracao = JSON.parse(sessionStorage.getItem(this.STORAGE_KEYS.CONFIG) || '{}');
      const treinos = JSON.parse(sessionStorage.getItem(this.STORAGE_KEYS.TREINOS) || '[]');
      const exercicios = JSON.parse(sessionStorage.getItem(this.STORAGE_KEYS.EXERCICIOS) || '{}');

      console.log('🔍 [Revisao] Dados carregados do sessionStorage:');
      console.log('📋 Configuração:', configuracao);
      console.log('🏋️ Treinos:', treinos);
      console.log('💪 Exercícios:', exercicios);

      return { configuracao, treinos, exercicios };
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      return { configuracao: {}, treinos: [], exercicios: {} };
    }
  }

  static limparDados() {
    try {
      sessionStorage.removeItem(this.STORAGE_KEYS.CONFIG);
      sessionStorage.removeItem(this.STORAGE_KEYS.TREINOS);
      sessionStorage.removeItem(this.STORAGE_KEYS.EXERCICIOS);
      console.log('🧹 Dados da rotina limpos');
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
    }
  }
}

// ✅ INTERFACES SIMPLIFICADAS
interface RotinaCompleta {
  nomeRotina: string;
  descricao: string;
  alunoId: string;
  treinosPorSemana: number;
  dificuldade: string;
  duracaoSemanas: number;
  treinos: TreinoCompleto[];
}

interface TreinoCompleto {
  id: string;
  nome: string;
  gruposMusculares: string[];
  exercicios: ExercicioCompleto[];
}

interface ExercicioCompleto {
  id: string;
  nome: string;
  tipo: 'tradicional' | 'combinada';
  series: SerieCompleta[];
  exerciciosCombinados?: { nome: string }[];
  intervaloAposExercicio?: number;
}

interface SerieCompleta {
  numero: number;
  repeticoes: number;
  carga?: number;
  isDropSet?: boolean;
  dropsConfig?: { cargaReduzida: number }[];
  intervaloAposSerie?: number;
}

interface SessaoExecucao {
  rotina_id: string;
  treino_id: string;
  aluno_id: string;
  sessao_numero: number;
  status: string;
  data_execucao: string | null;
  tempo_total_minutos: number | null;
  observacoes: string | null;
}

interface ConfiguracaoRotina {
  nomeRotina: string;
  descricao?: string;
  alunoId: string;
  treinosPorSemana: number;
  dificuldade: string;
  duracaoSemanas: number;
}

function RevisaoRotinaContent() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const alunoId = params.alunoId as string;

  // ✅ ESTADOS SIMPLIFICADOS
  const [enviarResumoEmail, setEnviarResumoEmail] = useState(true);
  const [creating, setCreating] = useState(false);
  const [statusRotina, setStatusRotina] = useState<'Aguardando pagamento' | 'Ativa'>('Aguardando pagamento');
  const [permitirExecucaoAluno, setPermitirExecucaoAluno] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    configuracao: true,
    treinos: false,
    status: true // Status sempre expandido (não pode ser colapsado)
  });

  // ✅ TOAST SIMPLIFICADO
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // ✅ DADOS DA ROTINA
  const [rotinaData, setRotinaData] = useState<RotinaCompleta>({
    nomeRotina: '',
    descricao: '',
    alunoId: '',
    treinosPorSemana: 3,
    dificuldade: 'Média',
    duracaoSemanas: 4,
    treinos: []
  });

  // ✅ FUNÇÃO PARA MOSTRAR TOAST
  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  };

  // ✅ CARREGAR DADOS DO STORAGE
  useEffect(() => {
    const loadData = () => {
      try {
        const { configuracao, treinos, exercicios } = RevisaoStorage.lerDadosCompletos();

        const treinosLimpos = Array.isArray(treinos) 
          ? treinos.filter(t => t && typeof t === 'object' && t.nome) 
          : [];
        
        const treinosComExercicios = treinosLimpos.map((treino: any) => ({
          ...treino,
          exercicios: Array.isArray(exercicios[treino.id]) ? exercicios[treino.id] : [],
          gruposMusculares: Array.isArray(treino.gruposMusculares) 
            ? treino.gruposMusculares
                .filter((g: any) => g && typeof g === 'string' && g.trim())
                .map((g: string) => g.trim())
            : []
        }));

        setRotinaData({
          nomeRotina: (configuracao.nomeRotina || '').toString().trim(),
          descricao: (configuracao.descricao || '').toString().trim(),
          alunoId: configuracao.alunoId || alunoId || '',
          treinosPorSemana: Number(configuracao.treinosPorSemana) || 3,
          dificuldade: (configuracao.dificuldade || 'Média').toString().trim(),
          duracaoSemanas: Number(configuracao.duracaoSemanas) || 4,
          treinos: treinosComExercicios
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showToast('Erro ao carregar dados da rotina', 'error');
      }
    };

    loadData();
  }, [alunoId]);

  // ✅ FUNÇÃO PARA CRIAR ROTINA COMPLETA
  const criarRotinaCompleta = async () => {
    setCreating(true);
    try {
      // 1. Validar usuário
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Usuário não autenticado');

      // ✅ VALIDAR SE O ID DO USUÁRIO É UM UUID VÁLIDO
      console.log('👤 Usuário autenticado:', user.id);
      if (!user.id || typeof user.id !== 'string') {
        throw new Error('ID do usuário inválido');
      }

      // 2. Ler dados
      const { configuracao, treinos, exercicios } = RevisaoStorage.lerDadosCompletos();

      if (!configuracao.nomeRotina) throw new Error('Nome da rotina não encontrado');
      if (!treinos.length) throw new Error('Nenhum treino configurado');

      // ✅ VALIDAR SE ALUNO_ID É VÁLIDO
      console.log('👨‍🎓 Aluno ID:', configuracao.alunoId);
      if (!configuracao.alunoId || typeof configuracao.alunoId !== 'string') {
        throw new Error('ID do aluno inválido');
      }

      // 3. Criar rotina
      const { data: rotinaCreated, error: rotinaError } = await supabase
        .from('rotinas')
        .insert([{
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
          permite_execucao_aluno: statusRotina === 'Ativa' && permitirExecucaoAluno,
          observacoes_pagamento: null
        }])
        .select('id')
        .single();

      if (rotinaError) throw rotinaError;
      console.log('✅ Rotina criada:', rotinaCreated.id);

      // 4. Criar treinos e exercícios
      const treinosCreated: { id: string }[] = [];
      for (const [index, treino] of treinos.entries()) {
        const exerciciosDoTreino = exercicios[treino.id] || [];
        
        const { data: treinoCreated, error: treinoError } = await supabase
          .from('treinos')
          .insert([{
            rotina_id: rotinaCreated.id,
            nome: treino.nome,
            grupos_musculares: treino.gruposMusculares?.join(', ') || '',
            ordem: index + 1,
            observacoes: null
          }])
          .select('id')
          .single();

        if (treinoError) throw treinoError;
        treinosCreated.push(treinoCreated);

        // Criar exercícios
        for (const [exIndex, exercicio] of exerciciosDoTreino.entries()) {
          console.log('🏗️ Salvando exercício:', {
            nome: exercicio.nome,
            tipo: exercicio.tipo,
            isCombinado: exercicio.tipo === 'combinada',
            exerciciosCombinados: exercicio.exerciciosCombinados?.map(ex => ex.nome) || null,
            exercicio_1: exercicio.tipo === 'combinada' ? exercicio.exerciciosCombinados?.[0]?.nome || exercicio.nome : exercicio.nome,
            exercicio_2: exercicio.tipo === 'combinada' ? exercicio.exerciciosCombinados?.[1]?.nome : null,
          });

          const { data: exercicioCreated, error: exercicioError } = await supabase
            .from('exercicios_rotina')
            .insert([{
              treino_id: treinoCreated.id,
              exercicio_1: exercicio.tipo === 'combinada' ? exercicio.exerciciosCombinados?.[0]?.nome || exercicio.nome : exercicio.nome,
              exercicio_2: exercicio.tipo === 'combinada' ? exercicio.exerciciosCombinados?.[1]?.nome : null,
              intervalo_apos_exercicio: exIndex === exerciciosDoTreino.length - 1 ? null : (exercicio.intervaloAposExercicio || 180),
              ordem: exIndex + 1
            }])
            .select('id')
            .single();

          if (exercicioError) throw exercicioError;

          // Criar séries
          for (const [serieIndex, serie] of (exercicio.series || []).entries()) {
            if (!serie) continue;

            const { error: serieError } = await supabase
              .from('series')
              .insert([{
                exercicio_id: exercicioCreated.id,
                numero_serie: serie.numero || 1,
                repeticoes: Number(serie.repeticoes) || 12,
                carga: Number(serie.carga) || 0,
                tem_dropset: serie.isDropSet || false,
                carga_dropset: serie.isDropSet ? Number(serie.dropsConfig?.[0]?.cargaReduzida) || 0 : null,
                intervalo_apos_serie: serieIndex === exercicio.series.length - 1 ? null : (Number(serie.intervaloAposSerie) || 120)
              }]);

            if (serieError) throw serieError;
          }
        }
      }

      // 5. Gerar execuções automáticas se ativo
      if (statusRotina === 'Ativa') {
        const configCompleta: ConfiguracaoRotina = {
          nomeRotina: configuracao.nomeRotina,
          descricao: configuracao.descricao,
          alunoId: configuracao.alunoId,
          treinosPorSemana: configuracao.treinosPorSemana,
          dificuldade: configuracao.dificuldade,
          duracaoSemanas: configuracao.duracaoSemanas
        };
        await gerarExecucoesAutomaticas(rotinaCreated.id, treinosCreated, configCompleta);
      }

      // 6. Limpar dados e redirecionar
      RevisaoStorage.limparDados();
      showToast('Rotina criada com sucesso!', 'success');
      
      setTimeout(() => {
        router.push(`/rotinas/${configuracao.alunoId}`);
      }, 1000);

    } catch (error) {
      console.error('❌ Erro ao criar rotina:', error);
      showToast(error instanceof Error ? error.message : 'Erro ao criar rotina', 'error');
    } finally {
      setCreating(false);
    }
  };

  // ✅ FUNÇÃO PARA GERAR EXECUÇÕES AUTOMÁTICAS
  const gerarExecucoesAutomaticas = async (rotinaId: string, treinosCreated: { id: string }[], configuracao: ConfiguracaoRotina) => {
    const totalSessoes = configuracao.treinosPorSemana * configuracao.duracaoSemanas;
    const sessoes: SessaoExecucao[] = [];

    for (let i = 1; i <= totalSessoes; i++) {
      const treinoIndex = (i - 1) % treinosCreated.length;
      sessoes.push({
        rotina_id: rotinaId,
        treino_id: treinosCreated[treinoIndex].id,
        aluno_id: configuracao.alunoId,
        sessao_numero: i,
        status: 'nao_iniciada',
        data_execucao: null,
        tempo_total_minutos: null,
        observacoes: null
      });
    }

    const { error: sessoesError } = await supabase
      .from('execucoes_sessao')
      .insert(sessoes);

    if (sessoesError) throw sessoesError;
    console.log(`✅ ${totalSessoes} sessões de execução criadas`);
  };

  // ✅ FUNÇÕES DE NAVEGAÇÃO
  const handlePrevious = () => {
    const { configuracao } = RevisaoStorage.lerDadosCompletos();
    const alunoId = configuracao?.alunoId;
    if (alunoId) {
      router.push(`/criar-rotina/exercicios?alunoId=${alunoId}` as any);
    } else {
      router.push('/criar-rotina/exercicios' as any);
    }
  };

  const handleFinalizarRotina = async () => {
    await criarRotinaCompleta();
  };

  // ✅ FUNÇÃO PARA EXPANDIR SEÇÕES
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  // ✅ FUNÇÃO PARA COR DA DIFICULDADE (CONSISTENTE COM CONFIGURAÇÃO)
  const getCorDificuldade = (dificuldade: string) => {
    return DifficultyColors[dificuldade as keyof typeof DifficultyColors] || DifficultyColors.default;
  };

  // ✅ FUNÇÃO PARA RENDERIZAR SEÇÕES
  const renderSection = (title: string, icon: any, sectionKey: string, content: React.ReactNode, alwaysExpanded = false) => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={alwaysExpanded ? undefined : () => toggleSection(sectionKey)}
        disabled={alwaysExpanded}
      >
        <View style={styles.sectionTitleContainer}>
          <Ionicons name={icon} size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {!alwaysExpanded && (
          <Ionicons 
            name={expandedSections[sectionKey as keyof typeof expandedSections] ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#6B7280" 
          />
        )}
      </TouchableOpacity>
      {(alwaysExpanded || expandedSections[sectionKey as keyof typeof expandedSections]) && (
        <View style={styles.sectionContent}>
          {content}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <RotinaProgressHeader 
        title="Revisão da Rotina"
        subtitle="Confirme os detalhes antes de criar"
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card de Estatísticas */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Resumo da Rotina</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{rotinaData.treinos.length}</Text>
              <Text style={styles.statLabel}>Treinos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {rotinaData.treinos.reduce((acc, t) => acc + (t.exercicios?.length || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Exercícios</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {rotinaData.treinosPorSemana * rotinaData.duracaoSemanas}
              </Text>
              <Text style={styles.statLabel}>Sessões</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{rotinaData.duracaoSemanas}</Text>
              <Text style={styles.statLabel}>Semanas</Text>
            </View>
          </View>
        </View>

        {/* Seção: Configuração */}
        {renderSection('Configuração da Rotina', 'settings-outline', 'configuracao', (
          <View style={styles.configContainer}>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Nome:</Text>
              <Text style={styles.configValue}>{rotinaData.nomeRotina || 'Sem nome'}</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Descrição:</Text>
              <Text style={styles.configValue}>{rotinaData.descricao || 'Sem descrição'}</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Treinos por semana:</Text>
              <Text style={styles.configValue}>{rotinaData.treinosPorSemana}</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Duração:</Text>
              <Text style={styles.configValue}>{rotinaData.duracaoSemanas} semanas</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Dificuldade:</Text>
              <View style={[styles.dificuldadeBadge, { backgroundColor: getCorDificuldade(rotinaData.dificuldade) }]}>
                <Text style={styles.dificuldadeText}>{rotinaData.dificuldade}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Seção: Treinos */}
        {renderSection('Treinos e Exercícios', 'fitness-outline', 'treinos', (
          <View style={styles.treinosContainer}>
            {rotinaData.treinos.map((treino, index) => (
              <View key={treino.id} style={styles.treinoResumo}>
                <View style={styles.treinoHeaderCondensado}>
                  <Text style={styles.treinoNome}>{treino.nome}</Text>
                  <Text style={styles.exerciciosCount}>
                    {treino.exercicios?.length || 0} exercício(s)
                  </Text>
                </View>
                
                <View style={styles.gruposContainer}>
                  {treino.gruposMusculares.map((grupo, grupoIndex) => (
                    <View key={`${grupo}-${grupoIndex}`} style={styles.grupoTag}>
                      <Text style={styles.grupoTagText}>{grupo}</Text>
                    </View>
                  ))}
                </View>

                {treino.exercicios && treino.exercicios.length > 0 && (
                  <View style={styles.exerciciosListContainer}>
                    {treino.exercicios.map((exercicio, exIndex) => (
                      <View key={exercicio.id} style={styles.exercicioResumoCondensado}>
                        <Text style={styles.exercicioNomeCondensado}>
                          {`${exIndex + 1}. ${exercicio.nome}`}
                        </Text>
                        <Text style={styles.exercicioMetaCondensado}>
                          {exercicio.series?.length || 0} série(s)
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Seção: Status da Rotina */}
        {renderSection('Status da Rotina', 'checkmark-circle-outline', 'status', (
          <View style={styles.statusContainer}>
            <View style={styles.statusButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  statusRotina === 'Aguardando pagamento' ? styles.statusButtonPendenteActive : styles.statusButtonPendenteInactive
                ]}
                onPress={() => setStatusRotina('Aguardando pagamento')}
              >
                <Text style={[
                  styles.statusButtonText,
                  statusRotina === 'Aguardando pagamento' ? styles.statusButtonTextPendenteActive : styles.statusButtonTextPendenteInactive
                ]}>
                  Aguardando Pagamento
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  statusRotina === 'Ativa' ? styles.statusButtonAtivaActive : styles.statusButtonAtivaInactive
                ]}
                onPress={() => setStatusRotina('Ativa')}
              >
                <Text style={[
                  styles.statusButtonText,
                  statusRotina === 'Ativa' ? styles.statusButtonTextAtivaActive : styles.statusButtonTextAtivaInactive
                ]}>
                  Ativa
                </Text>
              </TouchableOpacity>
            </View>
            
            {statusRotina === 'Ativa' && (
              <>
                <View style={styles.statusRow}>
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusLabel}>Permitir execução pelo aluno</Text>
                    <Text style={styles.statusSubtitle}>
                      Se habilitado, o aluno poderá executar a rotina pelo app
                    </Text>
                  </View>
                  <CustomSwitch
                    value={permitirExecucaoAluno}
                    onValueChange={setPermitirExecucaoAluno}
                  />
                </View>
                
                <View style={styles.statusRow}>
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusLabel}>Enviar resumo por email</Text>
                    <Text style={styles.statusSubtitle}>
                      O aluno receberá um email com todos os detalhes da rotina
                    </Text>
                  </View>
                  <CustomSwitch
                    value={enviarResumoEmail}
                    onValueChange={setEnviarResumoEmail}
                  />
                </View>
              </>
            )}
          </View>
        ), true)}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Botões */}
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
                Criar Rotina
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Toast */}
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
  treinoHeaderCondensado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  treinoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  exerciciosCount: {
    fontSize: 12,
    color: '#6B7280',
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
  statusContainer: {
    gap: 16,
    padding: 16,
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  // Botão "Aguardando Pagamento" - Ativo
  statusButtonPendenteActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
    flex: 3,
  },
  // Botão "Aguardando Pagamento" - Inativo
  statusButtonPendenteInactive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    flex: 3,
  },
  // Botão "Ativa" - Ativo
  statusButtonAtivaActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    flex: 1,
  },
  // Botão "Ativa" - Inativo
  statusButtonAtivaInactive: {
    backgroundColor: '#E5F3FF',
    borderColor: '#007AFF',
    flex: 1,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  // Texto "Aguardando Pagamento" - Ativo
  statusButtonTextPendenteActive: {
    color: 'white',
    fontWeight: '600',
  },
  // Texto "Aguardando Pagamento" - Inativo
  statusButtonTextPendenteInactive: {
    color: '#92400E',
    fontWeight: '600',
  },
  // Texto "Ativa" - Ativo
  statusButtonTextAtivaActive: {
    color: 'white',
    fontWeight: '600',
  },
  // Texto "Ativa" - Inativo
  statusButtonTextAtivaInactive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

// constants/exercicio.constants.ts
export const EXERCICIO_CONSTANTS = {
  INTERVALO_PADRAO_SERIE: 90, // segundos
  INTERVALO_PADRAO_EXERCICIO: 120, // segundos
  DEBOUNCE_HISTORICO: 1000, // ms
  LIMITE_HISTORICO: 1,
  
  // ✅ Constantes de histórico
  LIMITE_SESSOES_HISTORICO: 3, // Quantas sessões mostrar no histórico
  MINIMO_EXECUCOES_PARA_HISTORICO: 1, // Mínimo de execuções para mostrar ícone histórico
} as const;

export const MENSAGENS = {
  CARREGANDO: 'Carregando exercícios...',
  NENHUMA_SERIE_EXECUTADA: 'Nenhuma série foi executada! Execute pelo menos uma série antes de finalizar.',
  ERRO_CARREGAR_EXERCICIOS: 'Erro ao carregar exercícios',
  ERRO_SALVAR_SESSAO: 'Erro ao salvar sessão',
  ERRO_SALVAR_SERIES: 'Erro ao salvar séries',
  SUCESSO_SESSAO: 'Sessão finalizada com sucesso!',
  SEM_HISTORICO: 'Nenhum histórico encontrado para este exercício.',
  
  // ✅ Mensagens de histórico
  TITULO_HISTORICO: 'Histórico',
  ATE_FALHA: 'até falha',
  SUGESTAO_HOJE: 'Sugestão para hoje:',
  SEM_HISTORICO_TREINO: 'Primeira vez executando este exercício neste treino.',
  CARREGANDO_HISTORICO: 'Carregando histórico...',
  
  // ✅ Mensagens de sessão
  CONFIRMAR_SAIDA: 'Tem certeza que deseja sair? O progresso atual será salvo.',
  SESSAO_EM_ANDAMENTO: 'Você tem uma sessão em andamento para este treino.',
  CONTINUAR_SESSAO: 'Deseja continuar a sessão anterior ou iniciar uma nova?',
  TREINO_COMPLETO: 'Todas as sessões deste treino foram concluídas',
  ESCOLHER_SESSAO: 'Você tem múltiplas sessões em andamento. Escolha qual continuar:',
  NENHUMA_SESSAO_DISPONIVEL: 'Nenhuma sessão disponível para este treino',
  ERRO_INICIAR_SESSAO: 'Não foi possível iniciar a sessão de treino',
  ERRO_INICIAR_TREINO: 'Erro inesperado ao iniciar treino',
  ERRO_NOVA_SESSAO: 'Erro inesperado ao iniciar nova sessão',
} as const;

// ✅ Constantes de formatação do histórico
export const HISTORICO_FORMAT = {
  PESO_CORPORAL: 'Corporal',
  ICONE_DROPSET: '🔥',
  ICONE_COMBINADA: '🔗',
  ICONE_PROGRESSO_POSITIVO: '🟢',
  ICONE_PROGRESSO_NEUTRO: '🟡',
  ICONE_PROGRESSO_NEGATIVO: '🔴',
  ICONE_SESSAO_BASE: '⚪',
  ICONE_HISTORICO: 'stats-chart-outline', // Ícone do histórico (gráfico de estatísticas)
  ICONE_DETALHES: 'information-circle-outline', // Ícone dos detalhes
  COR_ICONES: '#3B82F6', // ✅ NOVO - Cor padrão dos ícones (azul)
  SETA_DROPSET: '→',
  SETA_PROGRESSO: '↗',
  SEPARADOR_COMBINADA: '+',
  SEPARADOR_SERIES: ', ',
} as const;

// ✅ Templates de formatação
export const HISTORICO_TEMPLATES = {
  SERIE_SIMPLES: '{reps}×{carga}kg',
  SERIE_CORPORAL: '{reps}×Corporal',
  SERIE_DROPSET: '{reps}×{carga}kg → 🔥 {cargaDropset}kg (até falha)',
  SERIE_COMBINADA: '🔗 {reps1}×{carga1}kg + {reps2}×{peso2}',
  PROGRESSO_POSITIVO: '+{diferenca}kg ↗',
  PROGRESSO_NEGATIVO: '-{diferenca}kg ↘',
} as const;

// ✅ Regras de exibição dos ícones
export const ICONES_RULES = {
  // Ícone de detalhes sempre aparece
  DETALHES_SEMPRE_VISIVEL: true,
  
  // Ícone de histórico só aparece se houver execuções anteriores
  HISTORICO_APENAS_COM_DADOS: true,
  
  // Histórico é específico por treino (não geral do exercício)
  HISTORICO_POR_TREINO: true,
  
  // Query deve filtrar: mesmo exercício + mesmo treino + mesmo aluno
  HISTORICO_FILTROS: ['exercicio_nome', 'treino_id', 'aluno_id'],
} as const;

// ✅ Status das sessões de execução
export const SESSAO_STATUS = {
  NAO_INICIADA: 'nao_iniciada',    // Status inicial na criação da rotina
  EM_ANDAMENTO: 'em_andamento',    // Quando o treino é iniciado na seleção
  CONCLUIDA: 'concluida'           // Quando a sessão é finalizada
} as const;

// ✅ Fluxo de status das sessões
export const SESSAO_FLUXO = {
  // 1. Criação da rotina → Todas as sessões nascem como 'nao_iniciada'
  // 2. Seleção do treino → Sessão específica vira 'em_andamento'
  // 3. Finalização → Sessão vira 'concluida'
  
  INICIAL: SESSAO_STATUS.NAO_INICIADA,      // Na criação da rotina
  EXECUCAO: SESSAO_STATUS.EM_ANDAMENTO,     // Na seleção do treino
  FINAL: SESSAO_STATUS.CONCLUIDA            // Na finalização
} as const;

// ✅ Cenários de seleção de treino
export const CENARIOS_SELECAO = {
  // Cenário 1: Nenhuma sessão em andamento + Tem sessões disponíveis
  NOVO_TREINO: {
    em_andamento: 0,
    nao_iniciada: '>0',
    acao: 'Iniciar nova sessão diretamente'
  },
  
  // Cenário 2: Uma sessão em andamento + Tem sessões disponíveis
  CONTINUAR_OU_NOVA: {
    em_andamento: 1,
    nao_iniciada: '>0',
    acao: 'Modal: Continuar sessão ou criar nova'
  },
  
  // Cenário 3: Uma sessão em andamento + Zero sessões disponíveis
  CONTINUAR_UNICA: {
    em_andamento: 1,
    nao_iniciada: 0,
    acao: 'Ir direto para sessão em andamento'
  },
  
  // Cenário 4: Múltiplas sessões em andamento + Zero sessões disponíveis
  ESCOLHER_SESSAO: {
    em_andamento: '>1',
    nao_iniciada: 0,
    acao: 'Modal: Lista de sessões para escolher'
  },
  
  // Cenário 5: Zero sessões em andamento + Zero sessões disponíveis
  TREINO_COMPLETO: {
    em_andamento: 0,
    nao_iniciada: 0,
    acao: 'Botão desabilitado + Toast informativo'
  }
} as const;

// ✅ Tipos de modal na seleção de treino
export const MODAL_TYPES = {
  CONTINUAR_OU_NOVA: 'continuar_ou_nova',     // ConfirmActionModal
  ESCOLHER_SESSAO: 'escolher_sessao'          // Modal customizada
} as const;
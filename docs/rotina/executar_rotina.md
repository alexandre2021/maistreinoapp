# 📋 Execução de Rotina - Documentação Oficial

## 📦 Estrutura de Pastas e Componentes

src/
├── components/
│   └── execucao/
│       ├── ExecutorModoPT.tsx                    # Modo de execução para PT
│       └── shared/
│           ├── CronometroSerie.tsx               # Modal de intervalo entre séries
│           ├── CronometroExercicio.tsx           # Modal de intervalo entre exercícios
│           ├── ExercicioDetalhesModal.tsx        # Modal de detalhes do exercício
│           ├── ExercicioHistoricoModal.tsx       # Histórico de execuções do exercício
│           ├── RegistroSerieCombinada.tsx        # Execução de séries combinadas
│           └── RegistroSerieSimples.tsx          # Execução de séries simples e dropset
│
├── types/
│   ├── Exercicio.ts                              # Types gerais de exercícios
│   └── exercicio.types.ts                        # Types específicos de execução
│
├── constants/
│   └── exercicio.constants.ts                    # Constantes e mensagens
│
├── utils/
│   └── exercicio.utils.ts                        # Funções utilitárias
│
├── hooks/
│   ├── useModalManager.ts                        # Hook de gerenciamento de modais
│   ├── useExercicioExecucao.ts                   # Hook principal de execução
│   └── usePDFRotinaEmail.ts                      # Hook para envio de PDF por email
│
└── lib/
    └── supabase.ts                               # Configuração do Supabase

## 🚀 Fluxo de Execução da Rotina

1. O aluno acessa a rotina ativa pelo app.
2. O sistema apresenta a lista de treinos disponíveis para execução.
3. Ao iniciar um treino, é criada uma nova entrada em `execucoes_sessao`.
4. Para cada exercício, o aluno registra as execuções das séries (simples, combinadas, dropset) em `execucoes_series`.
5. O sistema permite registrar execuções diferentes do planejado (carga, repetições, etc).
6. O aluno pode consultar o histórico de execuções anteriores pelo `ExercicioHistoricoModal.tsx`.
7. Ao finalizar o treino, o status da sessão é atualizado e o tempo total é registrado.
8. O personal pode acompanhar o progresso em tempo real.

## 📝 Funcionalidades de Execução

- Cronômetros automáticos entre séries e exercícios.
- Modal de detalhes do exercício com instruções e histórico.
- Registro de execuções flexível (valores reais vs planejados).
- Suporte a séries combinadas e dropset.
- Histórico completo de execuções por exercício.
- Feedback visual de progresso e conclusão.

## 🔗 Integração com Banco de Dados

- Cada sessão executada é registrada em `execucoes_sessao`.
- Cada série executada é registrada em `execucoes_series`.
- Todos os dados são sincronizados em tempo real com o Supabase.

## 📤 Envio de PDF da Rotina

### Durante a Ativação da Rotina
- Ao ativar a rotina, o personal pode optar por enviar a rotina completa por e-mail para o aluno.
- O PDF é gerado no frontend usando `expo-print` com layout profissional do titans.fitness.
- O PDF é enviado via Edge Function (`enviar-rotina-pdf`) através do serviço Brevo.
- O sistema atualiza o campo `pdf_email_enviado` na tabela `rotinas` como `true`.

### Conteúdo do PDF
- Capa com logo e branding do titans.fitness
- Informações gerais da rotina (aluno, personal, objetivo, frequência, duração)
- Treinos completos com exercícios organizados
- Séries detalhadas (simples, combinadas e dropset)
- Intervalos entre séries e exercícios
- Observações e instruções específicas
- Dados de contato do personal trainer

### Características Técnicas
- PDF gerado dinamicamente no momento do envio
- Não há armazenamento permanente do PDF (economia de storage)
- Layout responsivo e otimizado para impressão
- Suporte a múltiplos tipos de série (simples, combinadas, dropset)

## 🔒 Segurança

- Apenas o aluno e o personal têm acesso às execuções e histórico.
- Todas as ações são auditadas e rastreadas.
- PDFs enviados apenas para emails verificados dos alunos.

## 🏁 Finalização

- Ao concluir todas as sessões, a rotina é marcada como concluída.
- Os dados da rotina ativa são arquivados e removidos do banco principal, mantendo apenas o histórico essencial em `rotinas_arquivadas`.
- O PDF já foi enviado durante a ativação, não sendo necessário novo envio.

## ⚙️ Configuração Técnica

### Dependências Necessárias
- `expo-print` para geração de PDFs
- Edge Function `enviar-rotina-pdf` no Supabase
- API key da Brevo configurada como environment variable

### Arquivos de Configuração
- `hooks/usePDFRotinaEmail.ts` - Hook principal para geração e envio
- `components/rotina/AtivarRotinaModal.tsx` - Modal de ativação com opção de envio
- `supabase/functions/enviar-rotina-pdf/index.ts` - Edge Function para envio

### Fluxo Técnico
1. Personal ativa rotina com opção "Enviar por Email" habilitada
2. Hook `usePDFRotinaEmail` busca dados completos da rotina no Supabase
3. Sistema gera HTML estruturado com todos os dados
4. `expo-print` converte HTML em PDF
5. PDF é convertido para base64
6. Edge Function recebe PDF e envia via Brevo
7. Campo `pdf_email_enviado` é atualizado para `true`

## 🔄 Ciclo Completo de Uso

1. **Criação**: Personal cria rotina completa
2. **Ativação**: Personal ativa rotina (status: Aguardando pagamento → Ativa) e opcionalmente envia PDF por email
3. **Execução**: Aluno executa treinos registrando progressos
4. **Acompanhamento**: Personal monitora execuções em tempo real
5. **Finalização**: Rotina concluída e dados arquivados (PDF já foi enviado na ativação)
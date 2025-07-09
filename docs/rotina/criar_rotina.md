src/  
├── app/  
│   └── criar-rotina/  
│       ├── index.tsx               \# Ponto de entrada  
│       ├── configuracao.tsx       \# Tela de configuração inicial  
│       ├── treinos.tsx            \# Tela de definição de treinos  
│       ├── exercicios.tsx         \# Tela de exercícios  
│       └── revisao.tsx            \# Tela de revisão final  
│  
├── components/  
│   └── rotina/  
│       ├── RotinaProgressHeader.tsx  \# Cabeçalho com progresso  
│       ├── AtivarRotinaModal.tsx     \# Modal de ativação  
│       ├── ConfirmActionModal.tsx    \# Modal genérico  
│       ├── ExitRotinaModal.tsx       \# Modal de saída  
│       ├── RotinaAtivaModal.tsx      \# Alerta de rotina existente  
│       ├── RotinaOptionsModal.tsx    \# Opções pós-criação  
│       └── (outros componentes auxiliares)  
│  
├── constants/  
│   ├── exercicios.ts               \# Grupos musculares/exercícios  
│   └── usuarios.ts                 \# Objetivos e dificuldades  
│  
├── hooks/  
│   ├── useRotinaStorage.ts         \# Gerencia storage  
│   └── useModalManager.ts          \# Controla modais  
│  
├── lib/  
│   └── supabase.ts                 \# Conexão com banco  
│  
├── types/  
│   └── rotina-types.ts             \# Tipos globais  
│  
└── utils/  
    ├── rotinaStorage.ts            \# Funções de storage  
    └── rotinaValidators.ts         \# Validações

**Storage**

### Hierarquia de Acesso: Componente (Tela)

  ↓ Chama ações  
useRotinaStorage (Hook)  
  ↓ Gerencia estado \+ efeitos  
rotinaStorage.ts (Utilitário)  
  ↓ Manipula diretamente  
sessionStorage (API do navegador)

Vantagens Dessa Estrutura:

1. Separação de preocupações:  
   * Componentes não acessam storage diretamente  
   * Lógica complexa fica nos hooks  
   * Operações básicas isoladas em utilitários  
2. Testabilidade:  
   * Utilitários são funções puras (fáceis de testar)  
   * Hooks podem ser mockados em testes de componentes

###  Resumo da Interação

1. Componentes chamam hooks (ex: `useRotinaStorage()`)  
2. Hooks orquestram estados e chamam utilitários (ex: `rotinaStorage.ts`)  
3. Utilitários manipulam sessionStorage diretamente  
4. Dados fluem de volta para atualizar a UI

Essa arquitetura garante que:

* O código fique organizado  
* Evite duplicação  
* Facilite manutenção  
* Simplifique testes

**Validação**

1\. Validação de Configuração (`validateConfig`)

Regras:

1. Nome da rotina deve ter ≥3 caracteres  
2. Objetivo deve ser selecionado  
3. Duração entre 1-52 semanas

### 2\. Validação de Treinos (`validateTreinos`)

Regras:

1. Pelo menos 1 treino definido  
2. Cada treino deve ter ≥1 grupo muscular  
3. Máximo 6 treinos por semana

### 3\. Validação de Exercícios (`validateExercicios`)

Regras:

1. Cada exercício deve ter ≥1 série  
2. Cargas não podem ser negativas  
3. Dropsets devem ter ≤3 drops

### 📌 Principais Vantagens

1. Separação clara de regras de negócio  
2. Reuso em múltiplos componentes  
3. Mensagens específicas para cada erro  
4. Consistência entre telas

   


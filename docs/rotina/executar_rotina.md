src/
├── app/
│   └── execucao/
│       ├── selecionar-treino/[rotinaId].tsx      # Tela de seleção de treino
│       └── executar-treino/[sessaoId].tsx        # Tela principal de execução
│
├── components/
│   └── execucao/
│       ├── ExecutorModoPT.tsx                    # Componente do modo PT (já existente)
│       ├── ExecutorModoAluno.tsx                 # Componente do modo Aluno (já existente)
│       └── shared/
│           ├── CronometroSerie.tsx               # Modal de intervalo entre séries (existente)
│           └── CronometroExercicio.tsx           # Modal de intervalo entre exercícios (existente)
│
├── hooks/
│   ├── useAuth.ts                                # Hook de autenticação (referenciado)
│   └── useModalManager.ts                        # Gerenciador de modais (usado no ExecutorModoPT)
│
├── lib/
     └── supabase.ts                               # Configuração do Supabase (referenciada)
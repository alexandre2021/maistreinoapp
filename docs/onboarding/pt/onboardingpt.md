# 📁 Estrutura de Pastas — Onboarding Personal Trainer (PT)

```
src/
├── app/
│   └── onboarding-pt.tsx           # Tela principal do onboarding do personal trainer
│
├── context/
│   └── OnboardingPTContext.tsx     # Contexto centralizado do onboarding do PT
│
├── hooks/
│   └── useOnboardingPTStorage.ts   # Hook customizado para storage e lógica do onboarding do PT
│
├── utils/
│   ├── onboardingPTStorage.ts      # Funções utilitárias para persistência local
│   └── onboardingPTValidators.ts   # Funções de validação dos campos do onboarding do PT
│
└── types/
    └── onboarding-pt.types.ts     # Tipos globais do onboarding do PT
```

- **app/**: Tela principal do fluxo de onboarding do personal trainer.
- **context/**: Contexto React para compartilhar estado entre componentes.
- **hooks/**: Hook customizado para gerenciar estado e sincronizar com storage.
- **utils/**: Funções utilitárias para persistência e validação.
- **types/**: Tipos TypeScript para o fluxo de onboarding do PT.

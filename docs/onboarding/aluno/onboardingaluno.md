src/
├── app/
│   └── onboarding-aluno.tsx             # ✅ Mantém onde está
│
├── components/
│   └── onboarding-aluno/                # 📁 NOVA PASTA
│       ├── OnboardingProgressHeader.tsx # Cabeçalho com progresso
│       ├── DadosBasicos.tsx            # Step 1: Informações básicas
│       ├── DescricaoESaude.tsx         # Step 2: Descrição + PAR-Q
│       └── index.ts                     # Exports centralizados
│
├── context/
│   └── OnboardingAlunoContext.tsx       # ✅ JÁ EXISTE
│
├── hooks/
│   └── onboarding-aluno/                # 📁 Hooks especializados
│       ├── useStepValidation.ts
│       ├── useAvatarGenerator.ts
│       └── useOnboardingSubmit.ts
│
├── utils/
│   ├── onboardingAlunoStorage.ts        # ✅ JÁ EXISTE
│   └── onboardingAlunoValidators.ts     # ✅ JÁ EXISTE
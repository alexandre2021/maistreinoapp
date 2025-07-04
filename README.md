# 🏋️ MaisTreino

> Aplicativo para Personal Trainers gerenciarem alunos e treinos

## 📱 Sobre o Projeto

O **MaisTreino** é uma plataforma SaaS que conecta Personal Trainers e alunos através de rotinas de treino personalizadas com execução e acompanhamento em tempo real.

### 🎯 Proposta de Valor
- **Para Personal Trainers:** Ferramenta completa para criar, gerenciar e acompanhar rotinas de treino
- **Para Alunos:** App mobile intuitivo para executar treinos com orientação em tempo real

## 🚀 Tecnologias

- **Frontend:** React Native + Expo + TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Navegação:** Expo Router
- **Ícones:** Lucide React Native
- **Autenticação:** Supabase Auth + RLS

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- Expo CLI
- Conta no Supabase

### Setup do Projeto
```bash
# Clonar repositório
git clone [url-do-repo]
cd MaisTreinoApp

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com credenciais do Supabase

# Rodar o projeto
npx expo start
```

### Setup do Banco de Dados
1. Criar projeto no [Supabase](https://supabase.com)
2. Executar scripts SQL em `/docs/database-setup.sql`
3. Configurar RLS e triggers
4. Atualizar credenciais em `lib/supabase.ts`

## 🏗️ Estrutura do Projeto

```
app/
├── index.tsx              # Login principal
├── tipo-conta.tsx         # Seleção PT/Aluno  
├── cadastro-pt.tsx        # Cadastro Personal Trainer
├── cadastro-aluno.tsx     # Cadastro Aluno
├── (tabs)/                # Dashboard principal
│   ├── index.tsx          # Estatísticas
│   ├── exercicios.tsx     # Biblioteca exercícios
│   ├── alunos.tsx         # Lista alunos
│   └── perfil.tsx         # Perfil/Logout
└── _layout.tsx            # Navegação raiz

lib/
└── supabase.ts            # Configuração Supabase

docs/                      # Documentação
├── ROADMAP.md            # Status + próximos passos
├── DATABASE.md           # Schema do banco
└── ARCHITECTURE.md       # Arquitetura técnica
```

## 🎯 Status do Projeto

### ✅ Implementado (75% MVP)
- Sistema completo de autenticação
- Cadastro diferenciado PT/Aluno
- Dashboard com estatísticas reais
- Biblioteca de exercícios
- Gestão de alunos
- Sistema de códigos únicos para PTs

### 🚧 Em Desenvolvimento
- Onboarding PT (3 etapas)
- Onboarding Aluno
- Sistema de convites
- Criação de treinos

### 📋 Próximos Passos
Ver [ROADMAP.md](docs/ROADMAP.md) para detalhes completos.

## 🔐 Autenticação

O sistema possui **login único** com diferentes fluxos:

1. **Personal Trainer:** Gerencia alunos e cria treinos
2. **Aluno:** Executa treinos e visualiza progresso
3. **Admin:** Gerencia exercícios e planos (futuro)

## 📊 Banco de Dados

### Tabelas Principais
- `users` + `personal_trainers` + `alunos`
- `exercicios` (biblioteca)
- `treinos` + `treino_exercicios`
- `user_profiles` (tipos de usuário)

Ver [DATABASE.md](docs/DATABASE.md) para schema completo.

## 🧪 Dados de Teste

### Personal Trainer
- **Email:** `teste@teste.com`
- **Senha:** `123456`

### Alunos Pré-cadastrados
- João Silva, Maria Santos, Pedro Costa

### Exercícios
6 exercícios básicos (Supino, Agachamento, etc.)

## 🤝 Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Ver `LICENSE` para mais detalhes.

## 📞 Contato

- **Projeto:** MaisTreino
- **Versão:** 0.1.0 (MVP em desenvolvimento)
- **Status:** Em desenvolvimento ativo

---

**🎯 Objetivo:** Criar a melhor plataforma para Personal Trainers gerenciarem seus alunos!
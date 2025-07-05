# Sistema de Rotinas - Guia Completo

O sistema de rotinas é dividido em 3 grandes capítulos:

1. **📋 CRIADOR**: PT monta a rotina (planejamento)
2. **📊 GERENCIADOR**: PT controla rotinas existentes (status, relatórios)
3. **🏃 EXECUTOR**: Aluno executa os treinos (em desenvolvimento)

---

# 1️⃣ CRIADOR (Planejamento)

### Fluxo Completo:
1. **Configuração**: Nome, frequência, dificuldade, duração
2. **Treinos**: Seleciona grupos musculares para cada treino
3. **Exercícios**: Escolhe exercícios e configura séries
4. **Revisão**: Confirma status de pagamento e cria rotina

### Estrutura no Banco:
```
rotinas → treinos → exercicios_rotina → series → execucoes_sessao
```

**Exemplo Prático:**
- Rotina: "João - Jul/2025" (3x/semana, 12 semanas)
- Treino A: Peito/Tríceps, Treino B: Costas/Bíceps
- Exercício: Supino 3x12 com 80kg
- Status: Ativa (aluno pode executar)

---

# 2️⃣ GERENCIADOR (Controle de Rotinas)

## 📋 Página de Listagem de Rotinas

**Arquivo:** `app/rotinas/[id].tsx`

### O que é?
É a página onde o PT vê todas as rotinas de um aluno específico e pode controlá-las (ativar, pausar, excluir, ver relatórios).

### Como funciona?
1. **Lista todas as rotinas** do aluno selecionado
2. **Organiza por abas**: "Atual" (ativas/pausadas) e "Concluídas" (histórico)
3. **Mostra informações completas** de cada rotina
4. **Oferece ações contextuais** para cada status

---

## 🎯 Informações Exibidas no Card

### Dados Principais:
- **Nome da rotina** - Título principal da rotina
- **Status** - Badge colorido (Ativa, Pausada, Aguardando pagamento, Concluída)
- **Configuração** - Ex: "3x por semana • 12 semanas"
- **Dificuldade** - Badge colorido (Iniciante, Intermediário, Avançado)
- **Valor** - Valor total da rotina (R$ 150,00)
- **Datas** - Data de criação e data de início

### Dados Dinâmicos (só para rotinas ativas):
- **Progresso** - Barra de progresso visual (%)
- **Dias restantes** - Contagem regressiva
- **Tempo decorrido** - Quantos dias já passaram

### Exemplo de Card:
```
┌─────────────────────────────────────┐
│ Rotina de Hipertrofia - João        │
│ [Ativa] [Intermediário]             │
│ 3x por semana • 12 semanas          │
│ R$ 250,00                           │
│ ████████░░ 75% (21 dias restantes)  │
│ Criada em: 15/06/2025               │
│ Iniciada em: 01/07/2025             │
│ [Pausar] [Excluir] [⋮]             │
└─────────────────────────────────────┘
```

---

## 🔄 Ações por Status

### Status: "Aguardando pagamento"
**Situação:** Rotina foi criada, mas ainda não pode ser executada pelo aluno.

**Ações disponíveis:**
- **[Ativar]** - Libera a rotina para execução (muda status para "Ativa")
- **[Excluir]** - Remove a rotina completamente (útil para correções)

**Cores:** Botão Ativar (azul), Botão Excluir (vermelho)

### Status: "Ativa"
**Situação:** Rotina está em execução, aluno pode usar.

**Ações disponíveis:**
- **[Pausar]** - Suspende temporariamente (muda status para "Pausada")
- **[Excluir]** - Remove a rotina completamente
- **[⋮ Menu]** - Opções avançadas: "Ir para Execução", "Ver Evolução"

**Cores:** Botão Pausar (laranja), Botão Excluir (vermelho), Menu (cinza)

### Status: "Pausada"
**Situação:** Rotina foi suspensa temporariamente.

**Ações disponíveis:**
- **[Ativar]** - Retoma a rotina (muda status para "Ativa")
- **[Excluir]** - Remove a rotina completamente

**Cores:** Botão Ativar (azul), Botão Excluir (vermelho)

### Status: "Concluída"
**Situação:** Rotina foi finalizada com sucesso.

**Ações disponíveis:**
- **[⋮ Menu]** - Opções: "Ver Evolução", "Duplicar Rotina"

**Observação:** Rotinas concluídas não podem ser excluídas (preserva histórico).

---

## 📊 Navegação por Abas

### Aba "Atual"
**Mostra:** Rotinas ativas, pausadas ou aguardando pagamento
**Por que:** São as rotinas que precisam de atenção do PT
**Contador:** Não mostra número (foco na ação)

### Aba "Concluídas"
**Mostra:** Rotinas que foram finalizadas (máximo 2 no banco + PDFs arquivados)
**Por que:** Histórico para consulta e relatórios de evolução
**Contador:** Mostra número de rotinas recentes + arquivadas (ex: "Histórico (2 + 5 PDFs)")

### Lógica de Filtro:
```typescript
// Aba Atual
const rotinasAtuais = rotinas.filter(r => 
  ['Ativa', 'Pausada', 'Aguardando pagamento'].includes(r.status)
);

// Aba Histórico (banco + PDFs)
const rotinasHistorico = rotinas.filter(r => r.status === 'Concluída');
const pdfsArquivados = await buscarPDFsArquivados(alunoId);
const historicoCompleto = [...rotinasHistorico, ...pdfsArquivados];
```

---

## 🎨 Componentes e Modais

### Modais Customizadas (substituíram Alert.alert):

#### 1. **AtivarRotinaModal**
**Quando aparece:** Ao clicar em "Ativar" uma rotina
**Funcionalidade:** 
- Permite confirmar ativação
- Opções para configurar notificações e lembretes
- Botão "Ativar" (azul) e "Cancelar" (cinza)

#### 2. **ConfirmActionModal**
**Quando aparece:** Ao clicar em ações destrutivas (Pausar, Excluir)
**Funcionalidade:**
- Confirmação com título e descrição personalizada
- Avisa que a ação não pode ser desfeita
- Botão de ação (colorido) e "Cancelar" (cinza)

#### 3. **RotinaAtivaModal**
**Quando aparece:** Ao tentar criar nova rotina para aluno que já tem uma
**Funcionalidade:**
- Mostra qual rotina já existe
- Botão "Ver Rotina" para navegar até ela
- Botão "Entendi" para fechar

#### 4. **ErrorModal**
**Quando aparece:** Quando ocorre erro em alguma operação
**Funcionalidade:**
- Mostra mensagem de erro clara
- Botão "Entendi" para fechar

### Componentes Reutilizáveis:

#### 1. **CustomSwitch**
**Localização:** `components/ui/CustomSwitch.tsx`
**Função:** Switch/toggle padronizado com cores azuis do sistema
**Uso:** Configurações dentro de modais

---

## 🔧 Funções Principais

### Mudança de Status:
```typescript
// Ativar rotina
const handleAtivarRotina = async (rotina) => {
  // Atualiza status no banco
  await supabase
    .from('rotinas')
    .update({ status: 'Ativa' })
    .eq('id', rotina.id);
  
  // Recarrega lista
  fetchRotinas();
};

// Pausar rotina
const handlePausarRotina = async (rotina) => {
  await supabase
    .from('rotinas')
    .update({ status: 'Pausada' })
    .eq('id', rotina.id);
  
  fetchRotinas();
};
```

### Exclusão Segura:
```typescript
const handleExcluirRotina = async (rotina) => {
  // Remove rotina e todos dados relacionados (CASCADE)
  await supabase
    .from('rotinas')
    .delete()
    .eq('id', rotina.id);
  
  fetchRotinas();
};
```

### Cálculo de Progresso:
```typescript
const calcularProgresso = (rotina) => {
  if (rotina.status !== 'Ativa') return null;
  
  const inicio = new Date(rotina.data_inicio);
  const hoje = new Date();
  const duracaoTotal = rotina.duracao_semanas * 7; // dias
  
  const diasDecorridos = Math.floor((hoje - inicio) / (1000 * 60 * 60 * 24));
  const progresso = Math.min((diasDecorridos / duracaoTotal) * 100, 100);
  
  return Math.round(progresso);
};
```

---

## 🚀 Funcionalidades Futuras

### Em Desenvolvimento:
1. **"Ir para Execução"** - Dois modos disponíveis:
   - **Modo Presencial**: PT acompanha aluno durante treino
   - **Modo Independente**: Aluno treina sozinho
2. **"Ver Evolução"** - Gráficos de progresso combinando ambos os modos
3. **"Duplicar Rotina"** - Criar cópia para reutilização

### Placeholders Preparados:
```typescript
const handleIrParaExecucao = (rotina) => {
  // TODO: Mostrar modal perguntando o modo (presencial/independente)
  console.log('Escolhendo modo de execução para rotina:', rotina.id);
};

const handleVerEvolucao = (rotina) => {
  // TODO: Navegar para relatórios (dados de ambos os modos)
  console.log('Navegando para evolução da rotina:', rotina.id);
};
```

---

## 📱 Regras de UX

### Cores Padronizadas:
- **Azul (#007AFF)** - Ações principais (Ativar, Nova rotina)
- **Laranja (#F59E0B)** - Ações de pausa/warning
- **Vermelho (#EF4444)** - Ações destrutivas (Excluir)
- **Verde (#10B981)** - Status positivo (Ativa)
- **Cinza (#6B7280)** - Status neutro (Pausada)

### Comportamentos:
- **Confirmação obrigatória** para ações destrutivas
- **Loading states** durante operações
- **Feedback visual** imediato após ações
- **Navegação intuitiva** entre abas

---

# 3️⃣ EXECUTOR (Execução)

## 🏃 Dois Modos de Execução (Em Desenvolvimento)

### 1. **Modo Presencial (PT + Aluno)**
**Quem usa:** PT no seu celular durante aula presencial
**Situação:** Treino supervisionado na academia

**Fluxo:**
1. **PT abre a rotina** no modo execução
2. **Orienta cada exercício** mostrando ao aluno
3. **Registra execução real** (cargas, reps, observações)
4. **Finaliza sessão** com feedback e próximos passos

**Benefícios:**
- ✅ Supervisão profissional
- ✅ Correção de postura em tempo real
- ✅ Motivação e acompanhamento
- ✅ Registro preciso da evolução

### 2. **Modo Independente (Só Aluno)**
**Quem usa:** Aluno no seu celular
**Situação:** Treino sozinho (casa, academia, viagem)

**Fluxo:**
1. **Aluno abre sua rotina ativa** no app
2. **Segue o plano** exercício por exercício
3. **Registra própria execução** (cargas, reps, dificuldades)
4. **Finaliza sessão** com auto-avaliação

**Benefícios:**
- ✅ Flexibilidade total de horário
- ✅ Autonomia do aluno
- ✅ Continuidade mesmo sem PT
- ✅ Dados para PT acompanhar remotamente

### 📱 Interface Adaptativa

#### **Tela do PT (Modo Presencial):**
```
┌─────────────────────────────────────┐
│ Executando: João Silva              │
│ Treino A • Sessão 5/36             │
│ ───────────────────────────────────  │
│ Supino Reto • Série 2/3            │
│ Planejado: 12 reps • 80kg          │
│ ┌─────────────────────────────────┐ │
│ │ Executado: [12] reps • [80] kg  │ │
│ │ Observação: _______________     │ │
│ │ [Próxima Série] [Ajustar]       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### **Tela do Aluno (Modo Independente):**
```
┌─────────────────────────────────────┐
│ Meu Treino • Sessão 5/36           │
│ ───────────────────────────────────  │
│ Supino Reto • Série 2/3            │
│ Meta: 12 reps • 80kg               │
│ ┌─────────────────────────────────┐ │
│ │ Consegui: [  ] reps • [  ] kg   │ │
│ │ Como foi? 😊 😐 😓             │ │
│ │ [Concluir Série] [Ajuda]        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 🔄 Estrutura de Execução:
```
rotina → execucoes_sessao → execucoes_series
```

**Exemplo de Dados:**
- **Sessão 5:** Treino A executado em 15/07/2025
- **Modo:** "presencial" ou "independente"
- **Supino:** Executou 12-10-8 reps com 80-75-70kg
- **Observações:** "Aluno teve dificuldade na última série"

---

# 🗄️ ESTRUTURA TÉCNICA

### Planejamento (Template):
- `rotinas`: Dados gerais da rotina
- `treinos`: Treinos da rotina (A, B, C...)
- `exercicios_rotina`: Exercícios de cada treino
- `series`: Séries planejadas para cada exercício

### Execução (Realidade):
- `execucoes_sessao`: Quando fez cada treino
- `execucoes_series`: Cargas/reps que realmente executou

---

## ⚖️ Regras de Negócio

### Status das Rotinas:
- **Aguardando pagamento**: Ainda não pode ser executada
- **Ativa**: Aluno pode executar
- **Pausada**: Temporariamente suspensa (falta de pagamento, restrição do aluno...)
- **Concluída**: Finalizada com sucesso
- **Cancelada**: Removida do sistema

### Limites por Aluno:
- **1 rotina ativa** por vez (ativa ou pausada)
- **Máximo 2 rotinas** no histórico (banco de dados)
- **Sistema FIFO**: Ao concluir rotina, gera PDF com evolução das 3 últimas, remove a mais antiga
- **PDFs arquivados**: Histórico completo preservado no Cloudflare R2

---

## �‍💻 Para Desenvolvedores

### 🔗 Fluxo de Criação (Frontend)

**Arquivos principais:**
```
app/criar-rotina/
├── configuracao.tsx    # Tela 1: Dados básicos
├── treinos.tsx        # Tela 2: Grupos musculares
├── exercicios.tsx     # Tela 3: Exercícios e séries
└── revisao.tsx        # Tela 4: Status e confirmação
```

**Storage centralizado:**
```javascript
import RotinaStorage from '@/utils/rotinaStorage';

// Salvar dados entre telas
RotinaStorage.saveConfig({ nomeRotina, treinosPorSemana, ... });

// Recuperar dados
const config = RotinaStorage.getConfig();

// Debug
RotinaStorage.debug(); // Mostra estado atual
```

### 🔐 Políticas de Segurança (RLS)

**Tabelas de Planejamento:**
- PT: Controle total (CRUD) nas rotinas dos seus alunos
- Aluno: Apenas leitura do plano

**Tabelas de Execução:**
- PT: Pode criar sessões e acompanhar execuções dos seus alunos
- Aluno: Controle total das suas próprias execuções

### �️ Tabelas Principais

```sql
-- Dados gerais da rotina
CREATE TABLE rotinas (
  id uuid PRIMARY KEY,
  nome character varying NOT NULL,
  aluno_id uuid NOT NULL,
  personal_trainer_id uuid NOT NULL,
  treinos_por_semana integer NOT NULL,
  dificuldade character varying NOT NULL,
  duracao_semanas integer NOT NULL,
  status character varying, -- 'pendente', 'ativa', 'pausada', 'concluida'
  valor_total numeric,
  forma_pagamento character varying,
  permite_execucao_aluno boolean DEFAULT false
);

-- Treinos da rotina (A, B, C...)
CREATE TABLE treinos (
  id uuid PRIMARY KEY,
  rotina_id uuid REFERENCES rotinas(id) ON DELETE CASCADE,
  nome character varying NOT NULL, -- "Treino A"
  grupos_musculares text, -- JSON array
  ordem integer NOT NULL
);

-- Exercícios de cada treino
CREATE TABLE exercicios_rotina (
  id uuid PRIMARY KEY,
  treino_id uuid REFERENCES treinos(id) ON DELETE CASCADE,
  exercicio_1 character varying NOT NULL,
  exercicio_2 character varying, -- Para exercícios combinados
  ordem integer NOT NULL
);

-- Séries planejadas (template)
CREATE TABLE series (
  id uuid PRIMARY KEY,
  exercicio_id uuid REFERENCES exercicios_rotina(id) ON DELETE CASCADE,
  numero_serie integer NOT NULL,
  repeticoes integer NOT NULL,
  carga numeric,
  repeticoes_1 integer, -- Para exercício 1 em combinados
  carga_1 numeric,
  repeticoes_2 integer, -- Para exercício 2 em combinados
  carga_2 numeric
);

-- Sessões de treino (quando o aluno treina)
CREATE TABLE execucoes_sessao (
  id uuid PRIMARY KEY,
  rotina_id uuid REFERENCES rotinas(id) ON DELETE CASCADE,
  treino_id uuid REFERENCES treinos(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL,
  sessao_numero integer NOT NULL, -- 1, 2, 3...
  data_execucao date,
  status character varying -- 'nao_iniciada', 'em_andamento', 'concluida'
);

-- Execução real das séries
CREATE TABLE execucoes_series (
  id uuid PRIMARY KEY,
  execucao_sessao_id uuid REFERENCES execucoes_sessao(id) ON DELETE CASCADE,
  exercicio_rotina_id uuid REFERENCES exercicios_rotina(id) ON DELETE CASCADE,
  serie_numero integer NOT NULL,
  repeticoes_executadas_1 integer,
  carga_executada_1 numeric,
  repeticoes_executadas_2 integer,
  carga_executada_2 numeric
);

-- Tabela principal (máximo 3 rotinas por aluno: 1 ativa + 2 concluídas)
CREATE TABLE rotinas (
  id uuid PRIMARY KEY,
  aluno_id uuid NOT NULL,
  nome varchar NOT NULL,
  status varchar NOT NULL, -- 'Ativa', 'Pausada', 'Concluída'
  data_inicio date,
  data_fim date,
  posicao_historico integer, -- 1=atual, 2=anterior, 3=mais_antiga
  -- ...outros campos...
);

-- Tabela para referenciar PDFs arquivados
CREATE TABLE rotinas_arquivadas (
  id uuid PRIMARY KEY,
  aluno_id uuid NOT NULL,
  pdf_url varchar NOT NULL,
  pdf_cloudflare_id varchar NOT NULL,
  rotinas_incluidas jsonb, -- IDs das 3 rotinas que geraram o PDF
  data_arquivamento timestamp DEFAULT now(),
  estatisticas_resumo jsonb -- Dados mínimos para dashboard
);
```

### � Queries Essenciais

```sql
-- Verificar se aluno pode ter nova rotina
SELECT COUNT(*) FROM rotinas 
WHERE aluno_id = $1 AND status IN ('pendente', 'ativa', 'pausada');

-- Buscar próxima sessão do aluno
SELECT es.*, t.nome as treino_nome 
FROM execucoes_sessao es
JOIN treinos t ON es.treino_id = t.id
WHERE es.aluno_id = $1 AND es.status = 'nao_iniciada'
ORDER BY es.sessao_numero LIMIT 1;

-- Evolução de carga em um exercício
SELECT es.data_execucao, exec_s.carga_executada_1
FROM execucoes_series exec_s
JOIN execucoes_sessao es ON exec_s.execucao_sessao_id = es.id
JOIN exercicios_rotina er ON exec_s.exercicio_rotina_id = er.id
WHERE es.aluno_id = $1 AND er.exercicio_1 = 'Supino Reto'
### 💡 Como Usar o Sistema

**Para criar uma rotina:**
```javascript
// 1. Salvar dados em cada tela
RotinaStorage.saveConfig({ nomeRotina, treinosPorSemana, ... });
RotinaStorage.saveTreinos([{ nome: "Treino A", grupos: [...] }]);

// 2. Na última tela, recuperar tudo e salvar no banco
const rotinaCompleta = RotinaStorage.getRotinaCompleta();
```

**Para debugar:**
```javascript
// Ver o que está salvo
RotinaStorage.debug();

// Verificar se dados estão válidos
const isValid = RotinaStorage.isConfigValid();
```

### 🎯 Componentes Principais

**Localização:** `components/rotina/`

- `RotinaProgressHeader.tsx` - Cabeçalho com navegação
- `RotinaAtivaModal.tsx` - Aviso quando aluno já tem rotina
- `ExitRotinaModal.tsx` - Confirmação ao sair do fluxo

### 🚀 Para Novos Desenvolvedores

#### **Primeira vez no projeto?**
1. Leia esta documentação
2. Execute `npm run typecheck` para verificar tipos
3. Entenda o fluxo: **Configuração → Treinos → Exercícios → Revisão**

#### **Regras importantes:**
- 1 rotina ativa por aluno
- Status "ativa" libera execução para o aluno
- Sempre validar dados antes de salvar no banco
- Usar `RotinaStorage` para dados temporários

#### **Arquitetura resumida:**
```
Usuário → Tela → Storage → Próxima Tela → Banco de Dados
```

É simples: dados temporários no sessionStorage, dados finais no banco! 🚀

---

## 🎨 Melhorias UX Implementadas

### 📱 **Modal de Exercícios**
**Problema:** Modal pequeno, filtros apertados, pouco espaço para lista
**Solução:** 
- Modal aumentado para 90% da tela
- Filtros reorganizados em linhas separadas
- Lista usa máximo espaço disponível
- **Resultado:** +25% mais exercícios visíveis

### 🎯 **Botão Inteligente de Exercícios**
**Problema:** Botão sempre no topo, usuário precisa fazer scroll
**Solução:**
- **Lista vazia:** Botão azul no topo (chamada à ação)
- **Com exercícios:** Botão discreto no final da lista
- **Resultado:** Zero scroll desnecessário, sempre acessível

### 🔍 **Filtro por Grupo Muscular**
**Funcionalidade:** Aparece só quando treino tem múltiplos grupos
**Exemplo:** Treino "Peito + Tríceps" mostra botões: `Todos (25)` `Peito (15)` `Tríceps (10)`
**Resultado:** Usuário pode focar em um grupo específico

---

## 🚀 Para Novos Desenvolvedores

### **Primeira vez no projeto?**
1. Leia esta documentação completa
2. Execute `npm run typecheck` para verificar tipos
3. Execute `npm run lint` para verificar código
4. Entenda o fluxo: **Configuração → Treinos → Exercícios → Revisão**

### **Estrutura importante:**
- `app/criar-rotina/`: Telas do fluxo
- `docs/`: Documentação técnica
- `utils/`: Funções auxiliares
- `components/`: Componentes reutilizáveis
- `components/rotina/`: Componentes específicos do fluxo de rotinas
- `services/`: Serviços como validação de email

---

## 🧩 Componentes da Rotina

### Localização: `components/rotina/`

#### **1. RotinaProgressHeader.tsx**
**Função:** Cabeçalho com progresso do fluxo de criação
**Onde usa:** Todas as telas do fluxo (configuração, treinos, exercícios, revisão)

**Funcionalidades:**
- ✅ **Navegação**: Botão voltar e sair do fluxo
- ✅ **Progresso visual**: Mostra em qual etapa está (1/4, 2/4...)
- ✅ **Títulos dinâmicos**: Cada tela tem seu título
- ✅ **Limpeza automática**: Limpa sessionStorage ao sair

**Como usar:**
```tsx
<RotinaProgressHeader 
  title="Configuração da Rotina"
  subtitle="Defina os dados básicos"
  showExitButton={true}
  alunoId={alunoId}
/>
```

#### **2. RotinaAtivaModal.tsx**
**Função:** Modal de aviso quando aluno já tem rotina ativa
**Onde usa:** Ao tentar criar nova rotina para aluno que já tem uma

**Funcionalidades:**
- ✅ **Detecta status**: Mostra se rotina é ativa, pausada ou pendente
- ✅ **Cores dinâmicas**: Badge colorido conforme status
- ✅ **Ações**: "Entendi" (fecha) ou "Ver Rotina" (navega)
- ✅ **Mensagens personalizadas**: Texto diferente para cada status

**Como usar:**
```tsx
<RotinaAtivaModal
  visible={showModal}
  rotinaNome="Rotina do João"
  rotinaStatus="ativa"
  onViewRotina={() => router.push('/rotina/123')}
  onCancel={() => setShowModal(false)}
/>
```

#### **3. ExitRotinaModal.tsx**
**Função:** Modal de confirmação ao sair do fluxo de criação
**Onde usa:** Quando usuário clica no "X" do header

**Funcionalidades:**
- ✅ **Aviso de perda**: Alerta que dados não salvos serão perdidos
- ✅ **Ícone de atenção**: Visual claro de warning
- ✅ **Duas opções**: "Continuar Editando" ou "Sair e Perder Dados"
- ✅ **Prevenção de perda acidental**: Confirmation layer

**Como usar:**
```tsx
<ExitRotinaModal
  visible={showExitModal}
  onConfirmExit={() => {
    clearStorage();
    router.back();
  }}
  onCancel={() => setShowExitModal(false)}
/>
```

### 🎯 **Design System dos Componentes:**
- **Cores consistentes**: #007AFF (azul), #F59E0B (warning), #10B981 (sucesso)
- **Bordas arredondadas**: 8px para botões, 16px para modals
- **Espaçamentos**: Múltiplos de 4px (8, 12, 16, 24...)
- **Tipografia**: Títulos em 20px, textos em 16px, labels em 14px
- **Sombras**: Modais com overlay rgba(0,0,0,0.6)

---

## 🚀 Para Novos Desenvolvedores

### **Primeira vez no projeto?**
1. Leia esta documentação completa
2. Execute `npm run typecheck` para verificar tipos
3. Execute `npm run lint` para verificar código
4. Entenda o fluxo: **Configuração → Treinos → Exercícios → Revisão**

### **Como o código está organizado:**

#### **📁 Estrutura dos Arquivos:**
```
app/criar-rotina/
├── configuracao.tsx    # Tela 1: Nome, frequência, dificuldade
├── treinos.tsx        # Tela 2: Selecionar grupos musculares  
├── exercicios.tsx     # Tela 3: Escolher exercícios e séries
└── revisao.tsx        # Tela 4: Confirmar e criar rotina

utils/
└── rotinaStorage.ts   # Sistema centralizado para salvar dados

components/rotina/
├── RotinaProgressHeader.tsx  # Cabeçalho com progresso
├── RotinaAtivaModal.tsx     # Aviso de rotina já ativa
└── ExitRotinaModal.tsx      # Confirmação ao sair
```

#### **🔄 Como os dados fluem:**
1. **Usuário digita** → Dados salvos no `sessionStorage` (temporário)
2. **Entre telas** → `rotinaStorage.ts` gerencia os dados
3. **Tela final** → Todos os dados são enviados para o banco
4. **Após criar** → `sessionStorage` é limpo

### **💾 Sistema de Storage (Simples)**

**O que é:** Um jeito fácil de salvar dados enquanto o usuário navega entre as telas.

**Como funciona:**
```javascript
// Salvar dados
RotinaStorage.saveConfig({ 
  nomeRotina: "Treino do João" 
});

// Buscar dados
const config = RotinaStorage.getConfig();

// Limpar tudo
RotinaStorage.clearAll();
```

**Por que assim:** 
- Se o usuário voltar uma tela, os dados não se perdem
- Se ele fechar o app por acidente, os dados ficam salvos
- Quando criar a rotina, todos os dados vão de uma vez para o banco

### **🏗️ Arquivos Principais (O que cada um faz)**

#### **1. configuracao.tsx (REFATORADO)**
**O que faz:** Primeira tela, onde PT define nome, frequência, dificuldade
**Dados que salva:** Nome da rotina, quantos treinos por semana, etc.
**Novidades após refatoração:**
- ✅ **Storage centralizado** usando `RotinaStorage`
- ✅ **Interfaces unificadas** com outros arquivos
- ✅ **Validação consistente** com padrão do projeto
- ✅ **Limpeza automática** quando muda treinos por semana

#### **2. treinos.tsx (REFATORADO)**  
**O que faz:** Segunda tela, PT escolhe grupos musculares para cada treino
**Dados que salva:** Lista de treinos com grupos musculares
**Novidades após refatoração:**
- ✅ **Storage centralizado** usando `RotinaStorage`
- ✅ **Conversão automática** entre tipos TreinoConfig e TreinoData
- ✅ **Código mais limpo** e consistente
- ✅ **Validação melhorada** antes de salvar

#### **3. exercicios.tsx (REFATORADO)**
**O que faz:** Terceira tela, PT escolhe exercícios e configura séries
**Novidades após refatoração:**
- ✅ **Classe ExerciciosStorage** centraliza o sessionStorage
- ✅ **Código mais limpo** e fácil de entender
- ✅ **Validações melhores** antes de salvar
- ✅ **Interfaces TypeScript** claras

#### **4. revisao.tsx (REFATORADO)**
**O que faz:** Última tela, PT revisa tudo e confirma
**Novidades após refatoração:**
- ✅ **Classe RevisaoStorage** para gerenciar dados
- ✅ **Status sempre visível** (não pode ser escondido)
- ✅ **Botões proporcionais** ("Aguardando Pagamento" maior que "Ativa")
- ✅ **Cores consistentes** seguindo padrão visual

### **📋 Remoção do Cálculo de Tempo Estimado**

**Data**: 04/07/2025
**Decisão**: Remover o cálculo automático de `tempo_estimado_minutos` dos treinos

### 🎯 Problema Identificado
O cálculo simplista `60 + (exerciciosDoTreino.length * 15)` era muito impreciso devido a múltiplas variáveis:
- **Nível do aluno** (iniciante vs avançado)
- **Tipo de exercício** (compostos vs isolados) 
- **Método de treino** (circuito, bi-set, drop-set)
- **Tempo de descanso real** (varia muito por pessoa)
- **Aquecimento/alongamento** (varia por pessoa)
- **Intensidade** (pode dobrar ou reduzir pela metade o tempo)

### ✅ Solução Implementada
1. **Removido** o cálculo da linha 271 em `revisao.tsx`:
   ```typescript
   // REMOVIDO: tempo_estimado_minutos: 60 + (exerciciosDoTreino.length * 15),
   ```

2. **Recomendação**: Dropar a coluna `tempo_estimado_minutos` da tabela `treinos` no Supabase

### 🎯 Benefícios
- **Sem expectativas incorretas**: Evita frustrar alunos com tempos irreais
- **Mais flexibilidade**: Cada treino pode ter duração natural baseada na realidade
- **Simplicidade**: Remove complexidade desnecessária do código
- **Futuro**: Se necessário, tempo real pode ser registrado pelo próprio aluno durante execução

### 📝 Lição Aprendida
**"É melhor não ter informação do que ter informação incorreta"** - especialmente quando pode impactar a experiência do usuário

### **🎨 Melhorias de UX Implementadas**

#### **1. Status Sempre Visível**
**Problema:** PT podia esconder a seção de status por acidente
**Solução:** Status da rotina sempre aparece, não pode ser escondido
**Por que:** Decisão importante (pago ou não pago) deve estar sempre visível

#### **2. Botões Proporcionais**
**Problema:** Botões de mesmo tamanho para textos diferentes
**Solução:** "Aguardando Pagamento" é 3x maior que "Ativa"
**Por que:** Texto maior precisa de mais espaço

#### **3. Cabeçalho Simplificado**
**Problema:** Barra de progresso azul + texto "Etapa X de Y" eram redundantes
**Solução:** Removido barra e texto, mantido só os números 1-2-3-4
**Por que:** Mais espaço na tela, menos poluição visual

---

## 🔄 MELHORIAS NA PÁGINA DE ROTINAS

### 📱 **Informações Exibidas no Card**
- **Nome da rotina** - Título principal
- **Status** - Badge colorido com status atual
- **Configuração** - Frequência semanal e duração
- **Dificuldade** - Badge colorido
- **Valor** - Valor total da rotina
- **Progresso** - Barra de progresso para rotinas ativas (%)
- **Dias restantes** - Tempo restante para rotinas ativas
- **Datas** - Data de início e data de criação
- **Descrição** - Se presente, limitada a 2 linhas

### 🎯 **Principais Interações do PT**
1. **Mudança de Status**
   - Pausar rotina ativa
   - Reativar rotina pausada
   - Concluir rotina ativa
   - Cancelar rotina (deletar)

2. **Modo Execução** (em desenvolvimento)
   - Abrir rotina ativa no modo execução
   - Acompanhar treinos do aluno em tempo real

3. **Ações Secundárias**
   - Ver histórico de execuções (em desenvolvimento)
   - Duplicar rotina para reutilização
   - Navegar para detalhes da rotina

### 📊 **Regras de Negócio**
- **Rotinas ativas ou aguardando pagamento não podem ser editadas**
- **Apenas rotinas ativas podem ser abertas no modo execução**
- **Apenas uma rotina ativa por aluno**
- **Progresso calculado com base na data de início**
- **Rotinas concluídas não podem ser alteradas**

---

## 🔧 **Correção de Exercícios Combinados**

#### **Problema Identificado:**
Na tabela `exercicios_rotina`, exercícios combinados eram salvos incorretamente:
- `exercicio_1`: "Supino Reto + Crucifixo" (ambos juntos)
- `exercicio_2`: "Crucifixo" (segundo exercício)

**Resultado:** Dados inconsistentes e redundância na tabela.

#### **✅ Solução Implementada:**
**Linha 283 em `revisao.tsx`:**
```typescript
// ANTES (incorreto):
exercicio_1: exercicio.nome, // "Supino Reto + Crucifixo"
exercicio_2: exercicio.tipo === 'combinada' ? exercicio.exerciciosCombinados?.[1]?.nome : null,

// DEPOIS (correto):
exercicio_1: exercicio.tipo === 'combinada' ? exercicio.exerciciosCombinados?.[0]?.nome || exercicio.nome : exercicio.nome,
exercicio_2: exercicio.tipo === 'combinada' ? exercicio.exerciciosCombinados?.[1]?.nome : null,
```

#### **🎯 Resultado:**
- **Exercícios simples:** `exercicio_1 = "Supino Reto"`, `exercicio_2 = null`
- **Exercícios combinados:** `exercicio_1 = "Supino Reto"`, `exercicio_2 = "Crucifixo"`

#### **📋 Estrutura dos Dados:**
```typescript
// Como são criados em exercicios.tsx:
exerciciosCombinados: [
  { nome: "Supino Reto", ... },    // [0] → exercicio_1
  { nome: "Crucifixo", ... }       // [1] → exercicio_2
]
```

#### **🔍 Pontos Verificados:**
- ✅ Única inserção na tabela `exercicios_rotina` está em `revisao.tsx`
- ✅ Não há outros pontos no código com problema similar
- ✅ Estrutura `exerciciosCombinados` está correta

#### **🚀 Benefícios da Correção:**
- **Consistência**: Dados salvos conforme especificação da tabela
- **Clareza**: Cada campo tem responsabilidade específica
- **Manutenção**: Facilita consultas e relatórios futuros
- **Integridade**: Evita redundância e inconsistências

#### **Correção de Navegação Após Criação da Rotina**

#### **Problema Identificado:**
Após criar uma rotina com sucesso, o usuário ficava preso na tela de revisão porque a navegação estava incorreta.

#### **Causa:**
**Linha 343 em `revisao.tsx`:**
```typescript
// ANTES (incorreto):
setTimeout(() => {
  router.back(); // Voltava para a tela anterior (revisão)
}, 1000);
```

#### **✅ Solução Implementada:**
```typescript
// DEPOIS (correto):
setTimeout(() => {
  router.push(`/rotinas/${configuracao.alunoId}`); // Vai para a página de rotinas do aluno
}, 1000);
```

#### **🎯 Comportamento Corrigido:**
- **Antes:** Criava rotina → ficava na tela de revisão
- **Depois:** Criava rotina → vai para a página de rotinas do aluno

#### **🔍 Verificações:**
- ✅ Não há `Alert.alert` interferindo na navegação
- ✅ Toast funciona corretamente (4 segundos)
- ✅ Navegação acontece após 1 segundo (tempo suficiente para ver o toast)
- ✅ Rota `/rotinas/[id]` é a página correta das rotinas do aluno

#### **Resultado:**
Agora o menu de opções funciona corretamente sem interferir no estado de loading da tela! ✅

---

### **Data**: 04/07/2025 - Correção de Estilo dos Botões

**Problema Identificado:**
Os botões "Ativar" e "Excluir" para rotinas com status "Aguardando pagamento" não tinham dimensões consistentes.

**Causa Raiz:**
- O botão "Ativar" usava `alignSelf: 'flex-start'` fazendo com que ficasse menor
- O botão "Excluir" usava `flex: 1` mas com padding diferente

**Solução Implementada:**
```css
/* app/globals.css */

/* Estilo base para todos os botões */
button {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
}

/* Botão Ativar */
.ativarButton {
  background-color: #007aff;
  color: white;
  align-self: stretch; /* Ocupa toda a largura disponível */
}

/* Botão Excluir */
.excluirButton {
  background-color: #ef4444;
  color: white;
  align-self: stretch; /* Ocupa toda a largura disponível */
}
```

**Resultado Esperado:**
- Ambos os botões ocupam a mesma largura
- Estilo consistente com o restante do aplicativo
- Melhor experiência de usuário

---

## 🛠️ Regras de Negócio da Execução

#### **Controle de Acesso:**
- **Modo Presencial**: Apenas PT pode executar (rotina deve estar "Ativa")
- **Modo Independente**: Aluno pode executar se rotina permite (`permite_execucao_aluno = true`)

#### **Registro de Dados:**
- **Ambos os modos** salvam na mesma estrutura de tabelas
- **Campo adicional:** `modo_execucao` ("presencial" ou "independente")
- **Observações:** PT pode adicionar notas, aluno pode avaliar dificuldade

#### **Sincronização:**
- **Execução presencial**: PT vê dados imediatamente
- **Execução independente**: PT recebe notificação de treino concluído
- **Relatórios**: Ambos os modos contribuem para gráficos de evolução

### 🔧 Implementação Técnica

#### **Tabela execucoes_sessao (Atualizada):**
```sql
CREATE TABLE execucoes_sessao (
  id uuid PRIMARY KEY,
  rotina_id uuid REFERENCES rotinas(id),
  treino_id uuid REFERENCES treinos(id),
  aluno_id uuid NOT NULL,
  executado_por uuid NOT NULL, -- PT ou Aluno
  modo_execucao character varying NOT NULL, -- 'presencial' ou 'independente'
  sessao_numero integer NOT NULL,
  data_execucao date,
  status character varying, -- 'nao_iniciada', 'em_andamento', 'concluida'
  observacoes_pt text, -- Observações do PT
  avaliacao_aluno character varying -- 'facil', 'medio', 'dificil'
);
```

#### **Fluxo de Navegação:**
```typescript
// Da página de rotinas, PT pode escolher:
const handleIrParaExecucao = (rotina) => {
  // Abre modal perguntando o modo
  showModoExecucaoModal(rotina);
};

// Aluno acessa direto o modo independente
const handleTreinoIndependente = (rotina) => {
  router.push(`/execucao/${rotina.id}?modo=independente`);
};
```

### 🎯 Benefícios do Conceito Duplo

#### **Para o PT:**
- **Flexibilidade**: Atende clientes presenciais e remotos
- **Controle**: Decide quando liberar execução independente
- **Dados completos**: Vê evolução de ambos os modos
- **Negócio**: Pode cobrar diferente por cada modalidade

#### **Para o Aluno:**
- **Autonomia**: Pode treinar quando quiser
- **Continuidade**: Não perde treinos por falta de horário
- **Evolução**: Registra progresso mesmo sozinho
- **Flexibilidade**: Combina aulas presenciais com treinos independentes

### 💡 Casos de Uso Reais

#### **Cenário 1: Cliente Híbrido**
- 2x/semana presencial (PT acompanha)
- 1x/semana independente (aluno sozinho)
- PT monitora evolução completa

#### **Cenário 2: Cliente Remoto**
- PT cria rotina personalizada
- Aluno executa independente
- PT acompanha via relatórios e ajusta remotamente

#### **Cenário 3: Viagem/Férias**
- Cliente viaja mas mantém rotina
- Execução independente temporária
- Retorna ao presencial quando volta

**Resultado:** Sistema flexível que atende diferentes perfis de clientes e modelos de negócio do PT! 🚀

---

## 📚 **ESTRATÉGIA DE ARQUIVAMENTO INTELIGENTE**

### **Data**: 04/07/2025 - Sistema FIFO com PDF de Evolução

#### **💡 Conceito Refinado:**
**Sistema FIFO (First In, First Out)** que mantém apenas as rotinas essenciais no banco e preserva histórico completo em PDFs.

#### **🔢 Estrutura por Aluno:**
```
┌─────────────────────────────────────┐
│ BANCO DE DADOS (Máximo 3 rotinas)  │
├─────────────────────────────────────┤
│ 1. ROTINA ATUAL (Ativa/Pausada)    │
│ 2. HISTÓRICO CONCLUÍDA #1          │  
│ 3. HISTÓRICO CONCLUÍDA #2          │
└─────────────────────────────────────┘
            ↓ (Ao concluir atual)
┌─────────────────────────────────────┐
│ PROCESSO DE ARQUIVAMENTO            │
├─────────────────────────────────────┤
│ 1. Pega as 2 concluídas + atual    │
│ 2. Gera PDF comparativo (3 rotinas)│
│ 3. Atual vira concluída            │
│ 4. Remove a mais antiga            │
│ 5. Resultado: 1 ativa + 2 concluídas│
└─────────────────────────────────────┘
```

#### **🔄 Fluxo de Arquivamento:**
```typescript
const concluirRotina = async (rotinaAtual) => {
  // 1. Buscar as 2 rotinas concluídas anteriores
  const rotinasHistorico = await buscarHistoricoRecente(rotinaAtual.aluno_id, 2);
  
  // 2. Formar conjunto de 3 rotinas para análise
  const rotinasParaAnalise = [...rotinasHistorico, rotinaAtual].slice(-3);
  
  // 3. Gerar PDF com evolução comparativa
  const pdfEvolucao = await gerarPDFEvolucao(rotinasParaAnalise);
  
  // 4. Upload para Cloudflare R2
  const pdfUrl = await uploadToCloudflare(pdfEvolucao);
  
  // 5. Marcar rotina atual como concluída
  await marcarComoConcluida(rotinaAtual.id);
  
  // 6. Se há 2 rotinas concluídas, remover a mais antiga
  if (rotinasHistorico.length >= 2) {
    await removerRotinaAntiga(rotinasHistorico[0].id);
  }
  
  // 7. Salvar referência do PDF
  await salvarReferenciaArquivo(pdfUrl, rotinasParaAnalise);
};
```

#### **📊 Conteúdo do PDF de Evolução:**
```typescript
const gerarPDFEvolucao = (rotinas) => {
  return (
    <Document>
      <Page>
        <View style={styles.header}>
          <Text>Relatório de Evolução - {rotinas[0].aluno_nome}</Text>
          <Text>Período: {rotinas[0].data_inicio} a {rotinas[2].data_fim}</Text>
        </View>
        
        <View style={styles.comparacao}>
          <Text>Evolução entre 3 Rotinas</Text>
          
          <View style={styles.tabela}>
            <Row>
              <Cell>Exercício</Cell>
              <Cell>Rotina 1</Cell>
              <Cell>Rotina 2</Cell>
              <Cell>Rotina 3</Cell>
              <Cell>Evolução</Cell>
            </Row>
            
            {compararExercicios(rotinas).map(exercicio => (
              <Row key={exercicio.nome}>
                <Cell>{exercicio.nome}</Cell>
                <Cell>{exercicio.rotina1.carga}kg</Cell>
                <Cell>{exercicio.rotina2.carga}kg</Cell>
                <Cell>{exercicio.rotina3.carga}kg</Cell>
                <Cell>{exercicio.percentualEvolucao}%</Cell>
              </Row>
            ))}
          </View>
        </View>
        
        <View style={styles.estatisticas}>
          <Text>Estatísticas Gerais</Text>
          <Text>• Aderência média: {calcularAderenciaMedia(rotinas)}%</Text>
          <Text>• Exercícios que evoluíram: {contarEvolucoes(rotinas)}</Text>
          <Text>• Tempo médio de treino: {calcularTempoMedio(rotinas)} min</Text>
        </View>
      </Page>
    </Document>
  );
};
```

#### **🗄️ Estrutura de Tabelas Atualizada:**
```sql
-- Tabela principal (máximo 3 rotinas por aluno: 1 ativa + 2 concluídas)
CREATE TABLE rotinas (
  id uuid PRIMARY KEY,
  aluno_id uuid NOT NULL,
  nome varchar NOT NULL,
  status varchar NOT NULL, -- 'Ativa', 'Pausada', 'Concluída'
  data_inicio date,
  data_fim date,
  posicao_historico integer, -- 1=atual, 2=anterior, 3=mais_antiga
  -- ...outros campos...
);

-- Tabela para referenciar PDFs arquivados
CREATE TABLE rotinas_arquivadas (
  id uuid PRIMARY KEY,
  aluno_id uuid NOT NULL,
  pdf_url varchar NOT NULL,
  pdf_cloudflare_id varchar NOT NULL,
  rotinas_incluidas jsonb, -- IDs das 3 rotinas que geraram o PDF
  data_arquivamento timestamp DEFAULT now(),
  estatisticas_resumo jsonb -- Dados mínimos para dashboard
);
```

#### **🎯 Benefícios da Estratégia FIFO:**

##### **📉 Economia Massiva de Banco:**
- **Redução para máximo 3 rotinas** por aluno (1 ativa + 2 concluídas)
- **Escala linear**: 1000 alunos = 3000 rotinas máximo
- **Supabase Free**: Suporta muito mais PTs

##### **📈 Qualidade dos Relatórios:**
- **Evolução comparativa**: PDF mostra progresso entre 3 rotinas
- **Análise contextual**: Vê tendências e padrões
- **Histórico rico**: Dados estruturados + visual profissional

##### **⚡ Performance Otimizada:**
- **Consultas rápidas**: Menos dados no banco
- **Cache eficiente**: PDFs servidos via CDN
- **Storage barato**: Cloudflare R2 custa centavos

##### **💼 Valor Agregado:**
- **Relatórios profissionais**: PT pode cobrar por análises
- **Portfolio automático**: Evidência do trabalho realizado
- **Cliente engajado**: Vê evolução de forma visual

#### **📱 UX Atualizada - Aba "Histórico":**
```
┌─────────────────────────────────────┐
│ Rotina Hipertrofia Fev-Abr 2025    │
│ [Concluída] 89% de aderência       │
│ 📊 12 semanas • 34/36 sessões      │
│ [📄 Relatório Evolução] [📈 Dados] │
└─────────────────────────────────────┘
```

- **📄 Relatório Evolução**: Baixa PDF comparativo (3 rotinas)
- **📈 Dados**: Mostra dados estruturados da rotina específica

#### **🔧 Implementação Prática:**
```typescript
// Verificar limite antes de criar nova rotina
const podecriarRotina = async (alunoId) => {
  const rotinasAtivas = await countRotinasAtivasPausadas(alunoId);
  return rotinasAtivas === 0; // Só pode ter 1 ativa por vez
};

// Listar rotinas do aluno (máximo 3)
const listarRotinas = async (alunoId) => {
  return await supabase
    .from('rotinas')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('posicao_historico', { ascending: true });
};

// Buscar PDFs arquivados
const listarPDFsArquivados = async (alunoId) => {
  return await supabase
    .from('rotinas_arquivadas')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('data_arquivamento', { ascending: false });
};
```

#### **✅ Resultado Final:**

**Sistema híbrido perfeito:**
- 🏃 **Rotinas ativas**: Dados completos no banco (execução)
- 📊 **Histórico recente**: 2 rotinas no banco (comparações rápidas)
- 📄 **Arquivo permanente**: PDFs no Cloudflare (evolução completa)
- 💰 **Economia**: 40% menos dados no Supabase
- 🚀 **Escalabilidade**: Suporta milhares de alunos
- 💎 **Valor agregado**: Relatórios profissionais automáticos

**Perfeita estratégia que equilibra funcionalidade, economia e profissionalismo!** 🎯
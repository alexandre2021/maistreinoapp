# Sistema de Rotinas - Guia Completo

O sistema tem 2 partes:
- **CRIADOR**: PT monta a rotina (planejamento)
- **EXECUTOR**: Aluno faz os treinos (execução)

---

## 📋 CRIADOR (Planejamento)

### Fluxo do PT:
1. **Configuração**: Nome, frequência, dificuldade
2. **Treinos**: Quais treinos (A, B, C...)
3. **Exercícios**: Que exercícios em cada treino
4. **Séries**: Quantas séries, repetições, cargas
5. **Criar**: Salva tudo + cria sessões automáticas

### Tabelas:
```
rotinas → treinos → exercicios_rotina → series
```

**Exemplo:**
- Rotina: "João - Jan/2025"
- Treino A: Peito/Tríceps
- Exercício: Supino
- Série: 3x12 com 80kg

---

## 🏃 EXECUTOR (Execução)

### Fluxo do Aluno:
1. **Dashboard**: Vê próxima sessão (ex: 3/8)
2. **Executar**: Abre treino, faz série por série
3. **Ajustar**: Muda cargas conforme capacidade
4. **Finalizar**: Marca como concluída

### Tabelas:
```
execucoes_sessao → execucoes_series
```

**Exemplo:**
- Sessão 3: Treino A em 15/01/2025
- Supino: Fez 12-10-8 reps com 80-75-70kg

---

## 🗄️ Estrutura das Tabelas

### Planejamento (o que fazer):
- `rotinas`: Dados gerais da rotina
- `treinos`: Treinos da rotina (A, B, C...)
- `exercicios_rotina`: Exercícios de cada treino
- `series`: Séries de cada exercício

### Execução (o que aconteceu):
- `execucoes_sessao`: Quando fez cada treino
- `execucoes_series`: Cargas/reps que realmente fez

---

## 📊 Exemplos Práticos

### Rotina 2x/semana por 4 semanas:
- **Total**: 8 sessões
- **Sequência**: A-B-A-B-A-B-A-B
- **Status**: nao_iniciada → concluida

### Exercício Simples:
- **Planejamento**: Supino 3x12 com 80kg
- **Execução**: Fez 12-10-8 reps com 80-75-70kg

### Exercício Combinado:
- **Planejamento**: Supino + Crucifixo 3x12
- **Execução**: 80kg+20kg, 75kg+15kg, 70kg+15kg

### Drop Set:
- **Planejamento**: Supino 3x12 com drop
- **Execução**: 80kg x12 + drop 60kg até falha

---

## 🔍 Diferenças Importantes

| Aspecto | Planejamento | Execução |
|---------|-------------|----------|
| **Quando** | PT cria | Aluno executa |
| **O que** | Plano ideal | Realidade |
| **Cargas** | Sugeridas | Executadas |
| **Status** | Criada | nao_iniciada → concluida |

---

## 📈 Relatórios de Evolução

### Dados do Planejamento:
- Quantos exercícios tem
- Frequência da rotina
- Dificuldade planejada

### Dados da Execução:
- Evolução das cargas: 60kg → 75kg
- Aderência: 6/8 sessões (75%)
- Performance: repetições executadas vs planejadas

---

## ⚖️ Regras Anti-Bagunça

**✅ Resumo das Regras:**
1. **Pausada = Ativa** (só muda visualmente)
2. **1 rotina ativa/pausada** por aluno no máximo
3. **Cancelada = DELETE** (apaga tudo, sem histórico)
4. **Concluída: máximo 4** (quando criar a 5ª, apaga a 1ª)

### 📊 Resultado:
- **Máximo por aluno**: 5 rotinas no banco (1 ativa + 4 histórico)
- **Banco sempre limpo** e rápido
- **Histórico útil** preservado

---

## 🗑️ Sistema de Limpeza Automática

**✅ Limpeza Configurada:**
- Apagar 1 rotina = apaga **TUDO** automaticamente
- **Planejamento**: rotinas → treinos → exercicios_rotina → series
- **Execução**: rotinas → execucoes_sessao → execucoes_series
- **Resultado**: Sem "lixo" no banco, limpeza total

### 🎯 Na Prática:
```sql
DELETE FROM rotinas WHERE id = 'rotina_id';
-- Apaga automaticamente: treinos, exercicios, series, sessões, execuções
```

---

## 💡 Dicas Rápidas

- **1 rotina** = várias sessões pré-criadas
- **Planejamento** = o que fazer
- **Execução** = o que foi feito
- **Evolução** = comparar execuções ao longo do tempo
- **Aderência** = % de sessões concluídas

---

## 👨‍💻 Para Desenvolvedores

### 🔐 Regras de Segurança (RLS)

**📋 TABELAS DE PLANEJAMENTO:**
- `rotinas`, `treinos`, `exercicios_rotina`, `series`
- **PT**: Controle total ✅ (cria, lê, edita, apaga)
- **Aluno**: Só visualiza ✅ (só lê o plano)

**🏃 TABELAS DE EXECUÇÃO:**
- `execucoes_sessao`: **PT** pode criar/gerenciar sessões dos seus alunos ✅ | **Aluno** gerencia suas próprias sessões ✅
- `execucoes_series`: **PT** só lê séries dos seus alunos ✅ | **Aluno** controle total das suas séries ✅

### 🔗 Conexão entre PT e Aluno:
```sql
-- PT tem acesso aos dados do aluno através da tabela 'alunos'
-- que conecta: aluno.personal_trainer_id = pt.id
```

### 🛡️ Políticas de Segurança Atualizadas:

```sql
-- 1. PT pode gerenciar execuções dos seus alunos
CREATE POLICY "pt_manage_execucoes_sessao" ON execucoes_sessao
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM alunos a
    WHERE a.id = aluno_id
    AND a.personal_trainer_id = auth.uid()
  )
);

-- 2. Aluno pode gerenciar suas próprias execuções
CREATE POLICY "aluno_manage_execucoes_sessao" ON execucoes_sessao
FOR ALL USING (aluno_id = auth.uid());

-- 3. PT pode acompanhar séries dos seus alunos
CREATE POLICY "pt_read_execucoes_series" ON execucoes_series
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM execucoes_sessao es
    JOIN alunos a ON a.id = es.aluno_id
    WHERE es.id = execucao_sessao_id
    AND a.personal_trainer_id = auth.uid()
  )
);

-- 4. Aluno pode gerenciar suas próprias séries
CREATE POLICY "aluno_manage_execucoes_series" ON execucoes_series
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM execucoes_sessao es
    WHERE es.id = execucao_sessao_id
    AND es.aluno_id = auth.uid()
  )
);
```

### 📋 Estrutura das Tabelas Principais

```sql
-- Tabela principal
CREATE TABLE rotinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome character varying NOT NULL,
  descricao text,
  aluno_id uuid NOT NULL,
  personal_trainer_id uuid NOT NULL,
  treinos_por_semana integer NOT NULL,
  dificuldade character varying NOT NULL,
  duracao_semanas integer NOT NULL,
  data_inicio date NOT NULL,
  valor_total numeric NOT NULL,
  forma_pagamento character varying NOT NULL,
  status character varying,
  observacoes_pagamento text,
  created_at timestamp with time zone,
  permite_execucao_aluno boolean
);

-- Tabela de treinos
CREATE TABLE treinos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rotina_id uuid REFERENCES rotinas(id) ON DELETE CASCADE,
  nome character varying NOT NULL,
  grupos_musculares text,
  ordem integer NOT NULL,
  tempo_estimado_minutos integer,
  observacoes text,
  created_at timestamp without time zone
);

-- Tabela de exercícios
CREATE TABLE exercicios_rotina (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_id uuid REFERENCES treinos(id) ON DELETE CASCADE,
  exercicio_1 character varying NOT NULL,
  exercicio_2 character varying,
  intervalo_apos_exercicio integer,
  ordem integer NOT NULL,
  created_at timestamp without time zone
);

-- Tabela de séries (TEMPLATE)
CREATE TABLE series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercicio_id uuid REFERENCES exercicios_rotina(id) ON DELETE CASCADE,
  numero_serie integer NOT NULL,
  repeticoes integer NOT NULL,
  carga numeric,
  tem_dropset boolean,
  carga_dropset numeric,
  observacoes text,
  created_at timestamp without time zone,
  intervalo_apos_serie integer,
  repeticoes_1 integer,
  carga_1 numeric,
  repeticoes_2 integer,
  carga_2 numeric
);

-- Tabela de sessões de execução
CREATE TABLE execucoes_sessao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rotina_id uuid REFERENCES rotinas(id) ON DELETE CASCADE,
  treino_id uuid REFERENCES treinos(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL,
  sessao_numero integer NOT NULL,
  data_execucao date,
  status character varying,
  tempo_total_minutos integer,
  observacoes text,
  created_at timestamp with time zone
);

-- Tabela de execução de séries (REALIDADE)
CREATE TABLE execucoes_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execucao_sessao_id uuid REFERENCES execucoes_sessao(id) ON DELETE CASCADE,
  exercicio_rotina_id uuid REFERENCES exercicios_rotina(id) ON DELETE CASCADE,
  serie_numero integer NOT NULL,
  repeticoes_executadas_1 integer,
  carga_executada_1 numeric,
  repeticoes_executadas_2 integer,
  carga_executada_2 numeric,
  carga_dropset numeric,
  observacoes text,
  created_at timestamp with time zone
);
```

### 📊 Estrutura do SessionStorage (Desenvolvimento)

**Usa o utilitário `RotinaStorage` para gerenciar os dados:**

```javascript
// Como os dados ficam estruturados:

// Configuração da rotina
RotinaStorage.getConfig() retorna:
{
  nomeRotina: "Rotina João - Jan/2025",
  descricao: "Rotina para ganho de massa",
  treinosPorSemana: 3,
  dificuldade: "Média",
  duracaoSemanas: 12,
  alunoId: "uuid-do-aluno"
}

// Lista de treinos
RotinaStorage.getTreinos() retorna:
[
  {
    id: "treino-1",
    nome: "Treino A",
    gruposMusculares: ["Peito", "Tríceps"],
    exercicios: []
  }
]

// Exercícios organizados por treino
RotinaStorage.getExercicios() retorna:
{
  "treino-1": [
    {
      id: "ex-1",
      nome: "Supino Reto",
      tipo: "tradicional",
      grupoMuscular: "Peito",
      series: [
        {
          id: "serie-1",
          numero: 1,
          repeticoes: 12,
          carga: 80,
          intervaloAposSerie: 120
        }
      ],
      intervaloAposExercicio: 180
    }
  ]
}
```

### 🔄 Como Funcionam Exercícios Combinados:

Para um **bi-set** (Supino + Crucifixo):
1. **exercicios_rotina**: Uma linha com exercicio_1="Supino", exercicio_2="Crucifixo"
2. **series**: Duas linhas por número de série:
   - Serie 1: exercicio_id=X, numero_serie=1, repeticoes_1=12, carga_1=80 (Supino)
   - Serie 1: exercicio_id=X, numero_serie=1, repeticoes_2=12, carga_2=20 (Crucifixo)
   - Serie 2: exercicio_id=X, numero_serie=2, repeticoes_1=10, carga_1=85 (Supino)
   - Serie 2: exercicio_id=X, numero_serie=2, repeticoes_2=10, carga_2=22 (Crucifixo)

**Vantagem**: Cada exercício tem suas próprias cargas e repetições, permitindo evolução independente.

### 🔍 Queries Essenciais

```sql
-- 1. Verificar se pode criar nova rotina
SELECT COUNT(*) as count FROM rotinas 
WHERE aluno_id = $1 AND status IN ('pendente', 'ativa', 'pausada');
-- Se count > 0: "Finalize a rotina atual primeiro"

-- 2. Buscar próxima sessão do aluno
SELECT es.*, t.nome as treino_nome 
FROM execucoes_sessao es
JOIN treinos t ON es.treino_id = t.id
WHERE es.aluno_id = $1 AND es.status = 'nao_iniciada'
ORDER BY es.sessao_numero LIMIT 1;

-- 3. Buscar rotina ativa do aluno
SELECT * FROM rotinas 
WHERE aluno_id = $1 AND status IN ('ativa', 'pausada')
LIMIT 1;

-- 4. Buscar evolução de carga de um exercício
SELECT 
  es.data_execucao,
  exec_series.carga_executada_1
FROM execucoes_series exec_series
JOIN execucoes_sessao es ON exec_series.execucao_sessao_id = es.id
JOIN exercicios_rotina er ON exec_series.exercicio_rotina_id = er.id
WHERE es.aluno_id = $1 
  AND er.exercicio_1 = 'Supino Reto'
ORDER BY es.data_execucao;
```

### 🛠️ Fluxo de Dados:
1. Usuário preenche telas
2. Dados salvos no sessionStorage via `RotinaStorage`
3. Na revisão: lê tudo e salva no banco
4. **PT cria:** rotinas → treinos → exercicios_rotina → series → execucoes_sessao
5. **Aluno cria:** execucoes_series (durante execução dos treinos)
6. PT e aluno podem acompanhar progresso

### ⚡ Importante sobre Execuções:
- **PT cria apenas as sessões** (`execucoes_sessao`) - templates dos treinos
- **Aluno cria as séries** (`execucoes_series`) - quando executar cada série
- **Motivo:** Políticas RLS só permitem que aluno gerencie suas próprias execuções

### 🚀 Dicas de Performance

- **Índices importantes**: aluno_id, rotina_id, status
- **Queries com LIMIT**: sempre limitar resultados
- **CASCADE**: configurado para limpeza automática
- **Status**: usar enum para validação
- **RLS**: políticas otimizadas para performance

### �️ Gerenciamento de SessionStorage

Para simplificar o gerenciamento dos dados temporários durante a criação de rotinas, foi criado um utilitário centralizado:

#### **Arquivo: `utils/rotinaStorage.ts`**

```javascript
// Como usar:
import RotinaStorage from '@/utils/rotinaStorage';

// Salvar configuração
RotinaStorage.saveConfig({
  nomeRotina: "Rotina João",
  treinosPorSemana: 3,
  dificuldade: "Média"
});

// Buscar configuração
const config = RotinaStorage.getConfig();

// Salvar treinos
RotinaStorage.saveTreinos([
  { nome: "Treino A", gruposMusculares: ["Peito"] }
]);

// Verificar se dados estão válidos
if (RotinaStorage.isConfigValid()) {
  // Prosseguir para próxima tela
}

// Limpar tudo
RotinaStorage.clearAll();
```

#### **Vantagens:**
- ✅ **Centralizado**: Todas as operações de sessionStorage em um lugar
- ✅ **Type-safe**: Interfaces TypeScript para todos os dados
- ✅ **Validação**: Métodos para verificar se dados estão corretos
- ✅ **Debug**: Método `debug()` para ver estado atual
- ✅ **Limpeza**: Métodos específicos para limpar dados

#### **Métodos Disponíveis:**
- `getConfig()`, `saveConfig()`, `clearConfig()`
- `getTreinos()`, `saveTreinos()`, `clearTreinos()` 
- `getExercicios()`, `saveExercicios()`, `clearExercicios()`
- `getRotinaCompleta()`, `saveRotinaCompleta()`
- `isConfigValid()`, `hasTreinos()`, `hasExercicios()`
- `clearAll()`, `debug()`

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

### **Regras de negócio:**
- 1 rotina ativa por aluno
- Máximo 4 rotinas no histórico
- Exercícios podem ser simples ou combinados
- Sempre validar dados antes de salvar
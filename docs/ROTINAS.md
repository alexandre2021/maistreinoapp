# 🏋️ Sistema de Rotinas - Guia Rápido

## 📍 **STATUS ATUAL (Jul/2025)**

### ✅ **FUNCIONANDO:**
- **CRIADOR**: Fluxo completo de criação de rotinas (4 telas)
- **GERENCIADOR**: Lista, ativa, pausa, exclui rotinas
- **PERFORMANCE**: Corrigido loops infinitos e problemas de lentidão
- **SELEÇÃO DE TREINO**: Interface para escolher treino com contexto inteligente
- **EXECUTOR PT**: Interface completa de execução para Personal Trainer

### 🚧 **EM DESENVOLVIMENTO:**
- **Executor Modo Aluno**: Interface simplificada para execução independente
- **Relatórios**: Evolução e progresso do aluno
- **Salvamento de Séries**: Tabela series_executadas para dados detalhados

### ⏳ **PRÓXIMOS PASSOS:**
1. Implementar ExecutorModoAluno.tsx completo
2. Criar tabela series_executadas no banco
3. Implementar relatórios de evolução
4. Adicionar modais de erro customizadas

**📋 Para documentação completa sobre execução de rotinas:**
👉 **Ver: [execucao-rotinas.md](./execucao-rotinas.md)**

---

## 🎯 **ARQUIVOS PRINCIPAIS**

### **Criação de Rotinas:**
- `app/criar-rotina/configuracao.tsx` - Dados básicos (nome, frequência, objetivo, etc.)
- `app/criar-rotina/treinos.tsx` - Seleção de grupos musculares
- `app/criar-rotina/exercicios.tsx` - Escolha de exercícios e configuração de séries
- `app/criar-rotina/revisao.tsx` - Revisão final e criação

### **Gerenciamento:**
- `app/rotinas/[id].tsx` - **PÁGINA PRINCIPAL** - Lista e gerencia rotinas do aluno
- `components/rotina/RotinaOptionsModal.tsx` - Modal com opções contextuais

### **Execução:** *(IMPLEMENTADO)*
- `app/execucao/selecionar-treino/[rotinaId].tsx` - ✅ Seleção de treino com contexto
- `app/execucao/executar-treino/[sessaoId].tsx` - ✅ Detecção de modo PT/Aluno
- `components/execucao/ExecutorModoPT.tsx` - ✅ Interface completa PT
- `components/execucao/ExecutorModoAluno.tsx` - 🚧 Interface básica (placeholder)

### **Estrutura no Banco:**
```
rotinas → treinos → exercicios_rotina → series → execucoes_sessao
                                               → series_executadas (pendente)
```

---

## 🔧 **FUNCIONALIDADES DO MODAL DE OPÇÕES**

### **Para Rotinas Ativas:**
- **🏃 Ir para Execução**: ✅ Navega para `/execucao/selecionar-treino/[rotinaId]`
- **📊 Ver Evolução**: Relatórios e histórico de treinos *(em desenvolvimento)*

### **Para Rotinas Pausadas:**
- **📊 Ver Evolução**: Relatórios e histórico de treinos *(em desenvolvimento)*

### **Para Rotinas Concluídas:**
- **📊 Ver Evolução**: Relatórios e histórico de treinos *(em desenvolvimento)*

---

## 🎨 **COMO FUNCIONA A PÁGINA DE ROTINAS**

### **Abas de Navegação:**
- **"Atual"**: Rotinas ativas, pausadas ou aguardando pagamento
- **"Concluídas"**: Rotinas finalizadas (histórico)

### **Ações por Status:**
- **Aguardando pagamento**: [Ativar] [Excluir]
- **Ativa**: [Pausar] [Excluir] [⋮ Opções] ← **OPÇÕES IMPLEMENTADAS**
- **Pausada**: [Ativar] [Excluir]
- **Concluída**: [⋮ Opções]

### **Informações do Card:**
- Nome da rotina, Status (badge colorido)
- Configuração (frequência, duração e objetivo)
- Valor total, Datas importantes
- Progresso visual (para rotinas ativas)

### **✅ NAVEGAÇÃO IMPLEMENTADA:**
```
Modal Opções → Seleção Treino → Execução PT
     ↓              ↓              ↓
RotinaOptions → [rotinaId].tsx → [sessaoId].tsx
```

---

## 🏃 **MODOS DE EXECUÇÃO DE ROTINAS**

O sistema suporta **duas formas de execução** de treinos:

### **🤝 Modo Presencial (PT + Aluno):** ✅ **IMPLEMENTADO**
- **Personal Trainer conduz** a sessão presencialmente
- **App serve como guia** com exercícios, séries e tempos
- **Interação direta** entre PT e aluno durante o treino
- **Acompanhamento em tempo real** pelo profissional
- **Interface completa** com cronômetros, observações e controles

### **📱 Modo Independente (Só Aluno):** 🚧 **EM DESENVOLVIMENTO**
- **Aluno executa sozinho** (aulas remotas ou quando PT não pode comparecer)
- **App funciona como personal virtual** com orientações detalhadas
- **Autonomia do aluno** para seguir a rotina programada
- **Relatórios automáticos** para acompanhamento posterior

### **⚙️ Controle Técnico:**
- Campo `permite_execucao_aluno` define se aluno pode executar independentemente
- **Ambos os modos** geram dados de progresso e evolução
- **Flexibilidade total** conforme necessidade do PT e disponibilidade

---

## 💻 **PARA DESENVOLVEDORES**

### **Primeiro Acesso:**
1. Leia este guia completo
2. Entenda a estrutura: `rotinas → treinos → exercicios_rotina → series`
3. Foque em `app/rotinas/[id].tsx` para funcionalidades de gerenciamento
4. **Para execução**: Leia `execucao-rotinas.md`

### **Regras de Negócio:**
- Apenas 1 rotina ativa por aluno
- Status define as ações disponíveis
- **Modais customizados** substituem `Alert.alert` (IMPORTANTE!)
- Objetivo é específico por rotina (não mais global do aluno)
- **Sistema de execução** funciona com sessões numeradas

### **Fluxo de Navegação Implementado:**
```
Lista Rotinas → Modal Opções → Seleção Treino → Execução PT
     ↓              ↓              ↓            ↓
  [id].tsx  → RotinaOptions → [rotinaId].tsx → [sessaoId].tsx
  ✅ OK      ✅ OK            ✅ OK           ✅ PT / 🚧 Aluno
```

---

## 🛠️ **COMPONENTES PRINCIPAIS**

### **Storage e Navegação:**
- `utils/rotinaStorage.ts` - Gerencia dados temporários entre telas
- `hooks/useModalManager.ts` - ✅ **Controla abertura/fechamento de modais**

### **Modais Customizados:**
- `AtivarRotinaModal.tsx` - Confirmação de ativação (cor verde)
- `ConfirmActionModal.tsx` - ✅ **Usado para finalizar sessão**
- `RotinaOptionsModal.tsx` - ✅ **Menu de opções contextuais funcionando**
- `ErrorModal.tsx` - Exibição de erros

### **⚠️ IMPORTANTE - Sistema de Modais:**
- **NUNCA use `Alert.alert`** - não funciona no app
- **SEMPRE use modais customizadas** com `useModalManager`
- **Padrão estabelecido** para confirmações e avisos

### **Cores Padronizadas:**
- **Roxo (#8B5CF6)**: Aguardando pagamento, cronômetros
- **Verde (#10B981)**: Status ativo/positivo, finalização
- **Amarelo (#F59E0B)**: Ações de pausa/warning
- **Cinza (#6B7280)**: Status concluído/inativo
- **Vermelho (#EF4444)**: Ações destrutivas

---

## 📚 **ESTRUTURA DE DADOS**

### **Tabelas Principais:**
```sql
-- Rotina principal
CREATE TABLE rotinas (
  id uuid PRIMARY KEY,
  nome varchar NOT NULL,
  objetivo varchar NOT NULL, -- NOVO: Objetivo específico da rotina
  aluno_id uuid NOT NULL,
  personal_trainer_id uuid NOT NULL,
  status varchar NOT NULL, -- 'Aguardando pagamento', 'Ativa', 'Pausada', 'Concluída'
  treinos_por_semana integer NOT NULL,
  dificuldade varchar NOT NULL,
  duracao_semanas integer NOT NULL,
  valor_total numeric,
  data_inicio date,
  permite_execucao_aluno boolean DEFAULT false
);

-- Treinos da rotina (A, B, C...)
CREATE TABLE treinos (
  id uuid PRIMARY KEY,
  rotina_id uuid REFERENCES rotinas(id) ON DELETE CASCADE,
  nome varchar NOT NULL,
  grupos_musculares text,
  ordem integer NOT NULL
);

-- Exercícios de cada treino
CREATE TABLE exercicios_rotina (
  id uuid PRIMARY KEY,
  treino_id uuid REFERENCES treinos(id) ON DELETE CASCADE,
  exercicio_1 varchar NOT NULL,
  exercicio_2 varchar, -- Para exercícios combinados
  ordem integer NOT NULL
);

-- Séries planejadas
CREATE TABLE series (
  id uuid PRIMARY KEY,
  exercicio_id uuid REFERENCES exercicios_rotina(id) ON DELETE CASCADE,
  numero_serie integer NOT NULL,
  repeticoes integer NOT NULL,
  carga numeric
);

-- ✅ IMPLEMENTADA: Execuções de sessão
CREATE TABLE execucoes_sessao (
  id uuid PRIMARY KEY,
  rotina_id uuid REFERENCES rotinas(id),
  treino_id uuid REFERENCES treinos(id),
  aluno_id uuid NOT NULL,
  sessao_numero integer NOT NULL, -- ✅ Campo obrigatório
  status varchar NOT NULL, -- 'em_andamento', 'concluida', 'cancelada'
  data_execucao timestamp,
  tempo_total_minutos integer,
  observacoes text
);

-- 🚧 PENDENTE: Séries executadas (para dados detalhados)
CREATE TABLE series_executadas (
  id uuid PRIMARY KEY,
  sessao_id uuid REFERENCES execucoes_sessao(id),
  serie_original_id uuid REFERENCES series(id),
  carga_executada numeric,
  repeticoes_executadas integer,
  tempo_execucao integer, -- segundos
  observacoes text
);
```

### **Fluxo de Criação:**
1. **Configuração**: Nome, frequência, dificuldade, duração, **objetivo**
2. **Treinos**: Seleciona grupos musculares
3. **Exercícios**: Escolhe exercícios e configura séries
4. **Revisão**: Define status, revisa **objetivo** e salva no banco

### **✅ Fluxo de Execução Implementado:**
1. **Modal Opções**: PT clica "Ir para Execução"
2. **Seleção**: Sistema sugere próximo treino, PT escolhe
3. **Criação de Sessão**: Sistema cria registro em `execucoes_sessao`
4. **Execução PT**: Interface completa com cronômetros e controles
5. **Finalização**: Atualiza status para 'concluida' e salva observações

---

## 🎓 **GLOSSÁRIO**

- **Rotina**: Conjunto completo de treinos para um aluno (com objetivo específico)
- **Treino**: Sessão individual (ex: "Treino A", "Treino B")
- **Exercício**: Movimento específico dentro de um treino
- **Série**: Conjunto de repetições de um exercício
- **Status**: Estado atual da rotina (Ativa, Pausada, etc.)
- **Execução**: Quando o aluno realiza o treino na prática
- **Sessão**: ✅ **Uma execução específica de um treino (registro no banco)**
- **Evolução**: Progresso do aluno ao longo do tempo
- **Contexto Inteligente**: ✅ **Sistema que sugere próximo treino baseado no histórico**

---

## 🚨 **PROBLEMAS RESOLVIDOS E LIÇÕES APRENDIDAS**

### **❌ Problemas Comuns:**
1. **`Alert.alert` não funciona** - usar modais customizadas
2. **Tipos do Supabase complexos** - usar `any` temporariamente
3. **Campo `sessao_numero` obrigatório** - calcular próximo número
4. **JOINs com relações inexistentes** - buscar dados separadamente
5. **useEffect com dependências faltando** - adicionar todas as dependências

### **✅ Soluções Implementadas:**
1. **Sistema de modais** com `useModalManager`
2. **Tipos temporários** com `any` para evitar erros
3. **Cálculo automático** do próximo número de sessão
4. **Queries separadas** para evitar problemas de JOIN
5. **useCallback** para funções em dependências

### **🎯 Padrões Estabelecidos:**
- **Sempre usar modais customizadas** ao invés de Alert
- **Buscar dados em etapas** ao invés de JOINs complexos
- **Tratar erros com console.log** e TODOs para modais de erro
- **Estados loading/finalizando** para feedback visual
- **Navegação com router.push()** usando `as never` quando necessário

---

## 📋 **CHECKLIST PARA NOVOS DESENVOLVEDORES**

- [ ] Ler este guia completo
- [ ] Ler `execucao-rotinas.md` para entender execução
- [ ] Entender estrutura de dados no banco
- [ ] Testar fluxo de criação de rotinas
- [ ] Explorar página de gerenciamento
- [ ] **Testar fluxo completo de execução PT**
- [ ] Verificar funcionamento dos modais
- [ ] Entender sistema de status das rotinas
- [ ] **Nunca usar Alert.alert - sempre modais customizadas**

**Pronto para começar! 🚀**

---

## 🔧 **PARA DESENVOLVEDORES - ESTADO ATUAL DO CÓDIGO**

### **✅ Arquivos Totalmente Funcionais:**
- `app/rotinas/[id].tsx` - Gerenciamento com navegação para execução
- `components/rotina/RotinaOptionsModal.tsx` - Modal de opções
- `app/execucao/selecionar-treino/[rotinaId].tsx` - Seleção com contexto
- `app/execucao/executar-treino/[sessaoId].tsx` - Detecção de modo
- `components/execucao/ExecutorModoPT.tsx` - Interface completa PT

### **🚧 Arquivos com Implementação Básica:**
- `components/execucao/ExecutorModoAluno.tsx` - Apenas placeholder

### **📝 Implementações Pendentes:**
1. **ExecutorModoAluno completo** - interface simplificada
2. **Tabela series_executadas** - dados detalhados das séries
3. **Modais de erro customizadas** - substituir console.log
4. **Relatórios de evolução** - análise de progresso

### **⚡ Funcionalidades Testadas e Funcionando:**
- Navegação Modal → Seleção → Execução ✅
- Contexto inteligente com sugestão de treino ✅
- Criação automática de sessões ✅
- Interface PT com cronômetros ✅
- Finalização de sessões ✅
- Sistema de modais customizadas ✅

---

*Documentação atualizada em 07/07/2025 - Pós implementação da execução PT*
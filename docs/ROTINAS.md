# 🏋️ Sistema de Rotinas - Guia Rápido

## 📍 **STATUS ATUAL (Jul/2025)**

### ✅ **FUNCIONANDO:**
- **CRIADOR**: Fluxo completo de criação de rotinas (4 telas)
- **GERENCIADOR**: Lista, ativa, pausa, exclui rotinas
- **PERFORMANCE**: Corrigido loops infinitos e problemas de lentidão

### 🚧 **IMPLEMENTADO RECENTEMENTE:**
- **Menu de Opções**: Modal com 3 opções principais para cada rotina
- **Botão "Três Pontinhos"**: Posicionado corretamente nos cards

### ⏳ **PRÓXIMOS PASSOS:**
1. Desenvolver telas de execução de treinos
2. Implementar relatórios de evolução

---

## 🎯 **ARQUIVOS PRINCIPAIS**

### **Criação de Rotinas:**
- `app/criar-rotina/configuracao.tsx` - Dados básicos (nome, frequência, etc.)
- `app/criar-rotina/treinos.tsx` - Seleção de grupos musculares
- `app/criar-rotina/exercicios.tsx` - Escolha de exercícios e configuração de séries
- `app/criar-rotina/revisao.tsx` - Revisão final e criação

### **Gerenciamento (FOCO ATUAL):**
- `app/rotinas/[id].tsx` - **PÁGINA PRINCIPAL** - Lista e gerencia rotinas do aluno
- `components/rotina/RotinaOptionsModal.tsx` - **NOVO** - Modal com opções contextuais

### **Estrutura no Banco:**
```
rotinas → treinos → exercicios_rotina → series → execucoes_sessao
```

---

## 🔧 **FUNCIONALIDADES DO MODAL DE OPÇÕES**

### **Para Rotinas Ativas:**
- **🏃 Ir para Execução**: Iniciar treino (presencial ou independente) *(em desenvolvimento)*
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
- **Ativa**: [Pausar] [Excluir] [⋮ Opções]
- **Pausada**: [Ativar] [Excluir]
- **Concluída**: [⋮ Opções]

### **Informações do Card:**
- Nome da rotina, Status (badge colorido)
- Configuração (frequência e duração)
- Valor total, Datas importantes
- Progresso visual (para rotinas ativas)

---

## 🏃 **MODOS DE EXECUÇÃO DE ROTINAS**

O sistema suporta **duas formas de execução** de treinos:

### **🤝 Modo Presencial (PT + Aluno):**
- **Personal Trainer conduz** a sessão presencialmente
- **App serve como guia** com exercícios, séries e tempos
- **Interação direta** entre PT e aluno durante o treino
- **Acompanhamento em tempo real** pelo profissional

### **📱 Modo Independente (Só Aluno):**
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

### **Regras de Negócio:**
- Apenas 1 rotina ativa por aluno
- Status define as ações disponíveis
- Modais customizados substituem `Alert.alert`

### **Próximas Implementações:**
1. **Telas de Execução**: Modo presencial (PT + aluno) e independente (só aluno)
2. **Relatórios**: Gráficos de evolução e análises

---

## 🛠️ **COMPONENTES PRINCIPAIS**

### **Storage e Navegação:**
- `utils/rotinaStorage.ts` - Gerencia dados temporários entre telas
- `hooks/useModalManager.ts` - Controla abertura/fechamento de modais

### **Modais Customizados:**
- `AtivarRotinaModal.tsx` - Confirmação de ativação (cor verde)
- `ConfirmActionModal.tsx` - Confirmação de ações destrutivas
- `RotinaOptionsModal.tsx` - **NOVO** - Menu de opções contextuais
- `ErrorModal.tsx` - Exibição de erros

### **Cores Padronizadas:**
- **Roxo (#8B5CF6)**: Aguardando pagamento
- **Verde (#10B981)**: Status ativo/positivo
- **Amarelo (#F59E0B)**: Ações de pausa/warning
- **Cinza (#6B7280)**: Status concluído/inativo
- **Vermelho (#EF4444)**: Ações destrutivas

---

## 🚀 **EXEMPLO DE USO**

```typescript
// Abrir modal de opções
const handleMostrarOpcoes = (rotina: Rotina) => {
  setModalData(prev => ({ ...prev, rotinaParaOpcoes: rotina }));
  openModal('rotinaOptions');
};

// Handlers para cada opção
const handleIrParaExecucao = () => {
  // TODO: Navegar para tela de execução
};

const handleVerEvolucao = () => {
  // TODO: Navegar para tela de evolução
};
```

---

## 📋 **CHECKLIST PARA NOVOS DESENVOLVEDORES**

- [ ] Ler este guia completo
- [ ] Entender estrutura de dados no banco
- [ ] Testar fluxo de criação de rotinas
- [ ] Explorar página de gerenciamento
- [ ] Verificar funcionamento dos modais
- [ ] Entender sistema de status das rotinas

**Pronto para começar! 🚀**

---

## 📚 **ESTRUTURA DE DADOS**

### **Tabelas Principais:**
```sql
-- Rotina principal
CREATE TABLE rotinas (
  id uuid PRIMARY KEY,
  nome varchar NOT NULL,
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
  grupos_musculares text, -- JSON array
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
  carga numeric,
  -- Campos para exercícios combinados
  repeticoes_1 integer,
  carga_1 numeric,
  repeticoes_2 integer,
  carga_2 numeric
);
```

### **Fluxo de Criação:**
1. **Configuração**: Nome, frequência, dificuldade, duração
2. **Treinos**: Seleciona grupos musculares
3. **Exercícios**: Escolhe exercícios e configura séries
4. **Revisão**: Define status e salva no banco

### **Fluxo de Gerenciamento:**
1. **Listagem**: Mostra todas as rotinas do aluno
2. **Ações**: Ativar, pausar, excluir conforme status
3. **Opções**: Menu contextual para ações avançadas

---

## 🎓 **GLOSSÁRIO**

- **Rotina**: Conjunto completo de treinos para um aluno
- **Treino**: Sessão individual (ex: "Treino A", "Treino B")
- **Exercício**: Movimento específico dentro de um treino
- **Série**: Conjunto de repetições de um exercício
- **Status**: Estado atual da rotina (Ativa, Pausada, etc.)
- **Execução**: Quando o aluno realiza o treino na prática
- **Evolução**: Progresso do aluno ao longo do tempo

---

*Documentação atualizada em 05/07/2025*

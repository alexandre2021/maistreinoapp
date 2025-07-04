# Sistema de Avaliações Físicas - Documentação dos Componentes

## 📋 Visão Geral

O sistema de avaliações físicas é estruturado de forma modular, com separação clara de responsabilidades entre componentes. Esta documentação descreve a função de cada componente na arquitetura.

## 🏗️ Arquitetura Geral

```
app/avaliacoes/
├── [id].tsx                           # Componente principal
├── hooks/
│   └── useAvaliacoes.ts              # Lógica de estado centralizada
└── components/
    ├── AlunoHeader.tsx               # Cabeçalho do aluno
    ├── UltimaAvaliacao.tsx           # Avaliação mais recente
    ├── HistoricoAvaliacoes.tsx       # Lista de avaliações
    ├── DetalhesModal.tsx             # Detalhes completos
    ├── NovaAvaliacaoModal.tsx        # Criação de avaliação
    ├── ImageModals.tsx               # Modais de imagem
    ├── ConfirmacaoIntervaloModal.tsx # Modal de intervalo
    └── FotoUploadComponent.tsx       # Upload de fotos
```

---

## 📄 Componentes Principais

### 🎯 **[id].tsx**
**Função:** Componente pai que orquestra todo o sistema de avaliações.
- **Responsabilidade:** Apenas UI e coordenação entre componentes
- **Características:**
  - Usa o hook `useAvaliacoes()` para gerenciar estado
  - Repassa props específicas para cada componente filho
  - Não contém lógica de negócio (apenas apresentação)

---

## 🔧 Hooks

### ⚡ **useAvaliacoes.ts**
**Função:** Hook customizado que centraliza toda a lógica de estado e operações.
- **Responsabilidade:** Gerenciamento completo do estado das avaliações
- **Características:**
  - Carregamento e sincronização de dados
  - Operações CRUD (criar, ler, atualizar, deletar)
  - Validações e regras de negócio
  - Estados de loading e erro

---

## 🧩 Componentes de Interface

### 👤 **AlunoHeader.tsx**
**Função:** Exibe informações do cabeçalho do aluno.
- **Responsabilidade:** Mostrar dados básicos do aluno
- **Características:**
  - Nome, foto de perfil
  - Informações de contato
  - Status/indicadores relevantes

### 📊 **UltimaAvaliacao.tsx**
**Função:** Card que mostra a avaliação mais recente do aluno.
- **Responsabilidade:** Resumo da última avaliação
- **Características:**
  - Data da avaliação
  - Principais métricas (peso, altura, etc.)
  - Botão para ver detalhes completos

### 📈 **HistoricoAvaliacoes.tsx**
**Função:** Lista com todas as avaliações anteriores do aluno.
- **Responsabilidade:** Histórico completo de avaliações
- **Características:**
  - Lista cronológica das avaliações
  - Filtros e ordenação
  - Navegação para detalhes

---

## 🔲 Componentes Modais

### 🔍 **DetalhesModal.tsx**
**Função:** Modal que exibe todos os detalhes de uma avaliação específica.
- **Responsabilidade:** Visualização completa dos dados
- **Características:**
  - Todas as medidas e métricas
  - Fotos da avaliação
  - Comparações com avaliações anteriores
  - Opções de edição/exclusão

### ➕ **NovaAvaliacaoModal.tsx**
**Função:** Modal para criação de uma nova avaliação.
- **Responsabilidade:** Formulário de entrada de dados
- **Características:**
  - Campos para todas as medidas
  - Upload de fotos
  - Validações em tempo real
  - Salvamento e sincronização

### 🖼️ **ImageModals.tsx**
**Função:** Conjunto de modais para gerenciamento de imagens.
- **Responsabilidade:** Seleção e preview de imagens
- **Características:**
  - Modal de seleção de fonte (câmera/galeria)
  - Preview das imagens
  - Cropping/edição básica

### ⏰ **ConfirmacaoIntervaloModal.tsx**
**Função:** Modal que controla o intervalo entre avaliações.
- **Responsabilidade:** Garantir qualidade dos dados
- **Características:**
  - Calcula dias desde última avaliação
  - Mostra intervalo recomendado restante
  - Permite prosseguir ou aguardar
  - Melhora a precisão dos resultados

---

## 🛠️ Componentes Utilitários

### 📸 **FotoUploadComponent.tsx**
**Função:** Componente reutilizável para upload e gerenciamento de fotos.
- **Responsabilidade:** Interface consistente para fotos
- **Características:**
  - Estado vazio: botão "Adicionar Foto"
  - Estado preenchido: imagem com botões de ação
  - Botão para trocar foto (câmera azul)
  - Botão para remover foto (lixeira vermelha)
  - Confirmação antes de deletar
  - Suporte a estado desabilitado

---

## 🔄 Fluxo de Dados

1. **Inicialização:**
   - `[id].tsx` carrega e usa `useAvaliacoes()`
   - Hook busca dados do aluno e avaliações
   - Estado é distribuído para componentes filhos

2. **Interação do Usuário:**
   - Componentes capturam eventos de UI
   - Chamam funções do hook via props
   - Hook processa lógica e atualiza estado
   - UI reativa automaticamente às mudanças

3. **Persistência:**
   - Hook gerencia sincronização com backend
   - Estados de loading durante operações
   - Tratamento de erros centralizado

---

## 🎯 Benefícios da Arquitetura

- **🔧 Manutenibilidade:** Responsabilidades bem definidas
- **🔄 Reutilização:** Componentes modulares e reutilizáveis
- **🐛 Debug:** Fácil identificação de problemas
- **🚀 Performance:** Otimizações pontuais possíveis
- **📱 UX:** Interface consistente e intuitiva
- **⚡ Desenvolvimento:** Trabalho paralelo em componentes
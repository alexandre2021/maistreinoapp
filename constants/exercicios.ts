// constants/exercicios.ts

// 📋 Arrays padronizados para dropdowns e validações
export const GRUPOS_MUSCULARES = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 
  'Abdômen', 'Pernas', 'Glúteos', 'Panturrilha', 'Trapézio'
] as const;

export const EQUIPAMENTOS = [
  'Barra', 'Halteres', 'Máquina', 'Peso Corporal', 'Cabo',
  'Kettlebell', 'Fitas de Suspensão', 'Elásticos', 
  'Bola Suíça', 'Bolas Medicinais'
] as const;

export const DIFICULDADES = [
  'Baixa', 'Média', 'Alta'
] as const;

// 🔷 Tipos TypeScript para garantir consistência
export type GrupoMuscular = typeof GRUPOS_MUSCULARES[number];
export type Equipamento = typeof EQUIPAMENTOS[number];
export type Dificuldade = typeof DIFICULDADES[number];

// ✅ Funções de validação para garantir dados consistentes
export const isGrupoMuscularValido = (valor: string): valor is GrupoMuscular => {
  return GRUPOS_MUSCULARES.includes(valor as GrupoMuscular);
};

export const isEquipamentoValido = (valor: string): valor is Equipamento => {
  return EQUIPAMENTOS.includes(valor as Equipamento);
};

export const isDificuldadeValida = (valor: string): valor is Dificuldade => {
  return DIFICULDADES.includes(valor as Dificuldade);
};

// 🎨 Cores para dificuldade de execução (verde, amarelo, vermelho)
export const CORES_DIFICULDADE: Record<Dificuldade, string> = {
  'Baixa': '#22C55E',        // Verde (fácil de executar)
  'Média': '#EAB308',        // Amarelo (técnica moderada)  
  'Alta': '#EF4444'          // Vermelho (técnica avançada)
};

// 📱 Configurações de estilo para badges limpos
export const BADGE_STYLES = {
  // Badge neutro padrão
  neutral: {
    backgroundColor: '#F3F4F6',
    textColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '500' as const
  },
  
  // Badge para dificuldade de execução (colorido)
  difficulty: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '600' as const,
    textColor: '#FFFFFF'
  }
} as const;
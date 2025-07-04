// utils/rotinaStorage.ts
// Utilitário para gerenciar dados da rotina no sessionStorage

export interface RotinaConfig {
  nomeRotina: string;
  descricao: string;
  treinosPorSemana: number;
  dificuldade: 'Iniciante' | 'Intermediário' | 'Avançado';
  alunoId?: string;
}

export interface TreinoData {
  nome: string;
  gruposMusculares: string[];
  id: string;
}

export interface ExercicioData {
  id: string;
  nome: string;
  series: number;
  repeticoes: string;
  peso?: string;
  observacoes?: string;
  treinoId: string;
}

export interface RotinaCompleta {
  config: RotinaConfig;
  treinos: TreinoData[];
  exercicios: { [treinoId: string]: ExercicioData[] };
}

class RotinaStorage {
  private static readonly STORAGE_KEYS = {
    CONFIG: 'rotina_configuracao',
    TREINOS: 'rotina_treinos',
    EXERCICIOS: 'rotina_exercicios'
  };

  // Métodos para configuração
  static getConfig(): RotinaConfig | null {
    try {
      const data = sessionStorage.getItem(this.STORAGE_KEYS.CONFIG);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      return null;
    }
  }

  static saveConfig(config: RotinaConfig): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  }

  // Métodos para treinos
  static getTreinos(): TreinoData[] {
    try {
      const data = sessionStorage.getItem(this.STORAGE_KEYS.TREINOS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar treinos:', error);
      return [];
    }
  }

  static saveTreinos(treinos: TreinoData[]): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEYS.TREINOS, JSON.stringify(treinos));
    } catch (error) {
      console.error('Erro ao salvar treinos:', error);
    }
  }

  // Métodos para exercícios
  static getExercicios(): { [treinoId: string]: ExercicioData[] } {
    try {
      const data = sessionStorage.getItem(this.STORAGE_KEYS.EXERCICIOS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Erro ao carregar exercícios:', error);
      return {};
    }
  }

  static saveExercicios(exercicios: { [treinoId: string]: ExercicioData[] }): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEYS.EXERCICIOS, JSON.stringify(exercicios));
    } catch (error) {
      console.error('Erro ao salvar exercícios:', error);
    }
  }

  // Métodos para manipulação completa
  static getRotinaCompleta(): RotinaCompleta | null {
    const config = this.getConfig();
    if (!config) return null;

    return {
      config,
      treinos: this.getTreinos(),
      exercicios: this.getExercicios()
    };
  }

  static saveRotinaCompleta(rotina: RotinaCompleta): void {
    this.saveConfig(rotina.config);
    this.saveTreinos(rotina.treinos);
    this.saveExercicios(rotina.exercicios);
  }

  // Métodos de limpeza
  static clearConfig(): void {
    sessionStorage.removeItem(this.STORAGE_KEYS.CONFIG);
  }

  static clearTreinos(): void {
    sessionStorage.removeItem(this.STORAGE_KEYS.TREINOS);
  }

  static clearExercicios(): void {
    sessionStorage.removeItem(this.STORAGE_KEYS.EXERCICIOS);
  }

  static clearAll(): void {
    this.clearConfig();
    this.clearTreinos();
    this.clearExercicios();
  }

  // Métodos de validação
  static isConfigValid(): boolean {
    const config = this.getConfig();
    return !!(config && config.nomeRotina && config.treinosPorSemana);
  }

  static hasTreinos(): boolean {
    const treinos = this.getTreinos();
    return treinos.length > 0;
  }

  static hasExercicios(): boolean {
    const exercicios = this.getExercicios();
    return Object.keys(exercicios).length > 0;
  }

  // Método para debug
  static debug(): void {
    console.log('🔍 [RotinaStorage] Estado atual:');
    console.log('Config:', this.getConfig());
    console.log('Treinos:', this.getTreinos());
    console.log('Exercícios:', this.getExercicios());
  }
}

export default RotinaStorage;

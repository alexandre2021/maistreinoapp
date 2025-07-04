// hooks/useExercicioFilters.ts
import { useEffect, useState } from 'react';
import {
  DIFICULDADES,
  EQUIPAMENTOS,
  GRUPOS_MUSCULARES,
  type Dificuldade,
  type Equipamento,
  type GrupoMuscular
} from '../constants/exercicios';
import { Exercicio, ExercicioDropdown, ExercicioFilter } from '../types/Exercicio';

export const useExercicioFilters = (exercicios: Exercicio[], searchText: string) => {
  const [activeFilters, setActiveFilters] = useState<ExercicioFilter>({
    grupo_muscular: '',
    equipamento: '',
    dificuldade: ''
  });

  const [dropdownStates, setDropdownStates] = useState<ExercicioDropdown>({
    grupo_muscular: false,
    equipamento: false,
    dificuldade: false
  });

  const [filteredExercicios, setFilteredExercicios] = useState<Exercicio[]>([]);

  // ✅ Opções dos filtros agora vêm das constantes padronizadas
  const filterOptions = {
    grupo_muscular: [...GRUPOS_MUSCULARES] as GrupoMuscular[],
    equipamento: [...EQUIPAMENTOS] as Equipamento[],
    dificuldade: [...DIFICULDADES] as Dificuldade[]
  };

  // Controlar dropdowns (fechar outros quando abrir um)
  const toggleDropdown = (filterType: keyof ExercicioDropdown) => {
    setDropdownStates(prev => ({
      grupo_muscular: false,
      equipamento: false,
      dificuldade: false,
      [filterType]: !prev[filterType]
    }));
  };

  // ✅ Função com tipagem mais robusta
  const updateFilter = (filterType: keyof ExercicioFilter, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? '' : value
    }));
    
    // Fechar dropdown após seleção
    setDropdownStates(prev => ({
      ...prev,
      [filterType]: false
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      grupo_muscular: '',
      equipamento: '',
      dificuldade: ''
    });
    setDropdownStates({
      grupo_muscular: false,
      equipamento: false,
      dificuldade: false
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(activeFilters).filter(value => value !== '').length;
  };

  // ✅ Função para verificar se tem filtros ativos
  const hasActiveFilters = () => {
    return getActiveFiltersCount() > 0;
  };

  // ✅ Função para obter labels dos filtros ativos
  const getActiveFiltersLabels = () => {
    const labels: string[] = [];
    
    if (activeFilters.grupo_muscular) {
      labels.push(`Grupo: ${activeFilters.grupo_muscular}`);
    }
    
    if (activeFilters.equipamento) {
      labels.push(`Equipamento: ${activeFilters.equipamento}`);
    }
    
    if (activeFilters.dificuldade) {
      labels.push(`Dificuldade: ${activeFilters.dificuldade}`);
    }
    
    return labels;
  };

  // ✅ Função para fechar todos os dropdowns
  const closeAllDropdowns = () => {
    setDropdownStates({
      grupo_muscular: false,
      equipamento: false,
      dificuldade: false
    });
  };

  // Aplicar filtros sempre que houver mudança
  useEffect(() => {
    let filtered = exercicios;

    // ✅ Aplicar busca por texto com busca mais robusta
    if (searchText.trim() !== '') {
      const searchLower = searchText.toLowerCase().trim();
      
      filtered = filtered.filter(exercicio =>
        exercicio.nome.toLowerCase().includes(searchLower) ||
        exercicio.descricao.toLowerCase().includes(searchLower) ||
        exercicio.grupo_muscular.toLowerCase().includes(searchLower) ||
        exercicio.equipamento.toLowerCase().includes(searchLower) ||
        exercicio.dificuldade.toLowerCase().includes(searchLower)
      );
    }

    // ✅ Aplicar filtros com validação das constantes
    if (activeFilters.grupo_muscular && GRUPOS_MUSCULARES.includes(activeFilters.grupo_muscular as GrupoMuscular)) {
      filtered = filtered.filter(exercicio => 
        exercicio.grupo_muscular === activeFilters.grupo_muscular
      );
    }

    if (activeFilters.equipamento && EQUIPAMENTOS.includes(activeFilters.equipamento as Equipamento)) {
      filtered = filtered.filter(exercicio => 
        exercicio.equipamento === activeFilters.equipamento
      );
    }

    if (activeFilters.dificuldade && DIFICULDADES.includes(activeFilters.dificuldade as Dificuldade)) {
      filtered = filtered.filter(exercicio => 
        exercicio.dificuldade === activeFilters.dificuldade
      );
    }

    setFilteredExercicios(filtered);
  }, [searchText, exercicios, activeFilters]);

  // ✅ Fechar dropdowns quando clicar fora (útil para componentes que usam este hook)
  useEffect(() => {
    const handleClickOutside = () => {
      closeAllDropdowns();
    };

    // Este efeito pode ser usado pelos componentes que implementam este hook
    return () => {
      // Cleanup se necessário
    };
  }, []);

  return {
    // Estados
    activeFilters,
    dropdownStates,
    filteredExercicios,
    
    // Opções padronizadas
    filterOptions,
    
    // Ações
    toggleDropdown,
    updateFilter,
    clearAllFilters,
    closeAllDropdowns,
    
    // Utilitários
    getActiveFiltersCount,
    hasActiveFilters,
    getActiveFiltersLabels,
    
    // ✅ Dados estatísticos úteis
    totalExercicios: exercicios.length,
    filteredCount: filteredExercicios.length,
    isFiltering: searchText.trim() !== '' || hasActiveFilters()
  };
};
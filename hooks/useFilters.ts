// hooks/useFilters.ts
import { useEffect, useState } from 'react';
import { Aluno } from '../types/Aluno';

interface FilterState {
  situacao: string;
  genero: string;
  objetivo: string;
}

interface DropdownState {
  situacao: boolean;
  genero: boolean;
  objetivo: boolean;
}

export const useFilters = (alunos: Aluno[], searchText: string) => {
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    situacao: '',
    genero: '',
    objetivo: ''
  });

  const [dropdownStates, setDropdownStates] = useState<DropdownState>({
    situacao: false,
    genero: false,
    objetivo: false
  });

  const [filteredAlunos, setFilteredAlunos] = useState<Aluno[]>([]);

  // Opções dos filtros
  const filterOptions = {
    situacao: ['Ativo', 'Pendente'],
    genero: ['Masculino', 'Feminino', 'Outro', 'Prefiro não informar'],
    objetivo: [
      'Perda de peso',
      'Ganho de massa muscular', 
      'Condicionamento físico',
      'Ganho de força',
      'Resistência',
      'Reabilitação',
      'Bem-estar geral'
    ]
  };

  // Controlar dropdowns (fechar outros quando abrir um)
  const toggleDropdown = (filterType: keyof DropdownState) => {
    setDropdownStates(prev => ({
      situacao: false,
      genero: false,
      objetivo: false,
      [filterType]: !prev[filterType]
    }));
  };

  const updateFilter = (filterType: keyof FilterState, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? '' : value
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      situacao: '',
      genero: '',
      objetivo: ''
    });
    setDropdownStates({
      situacao: false,
      genero: false,
      objetivo: false
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(activeFilters).filter(value => value !== '').length;
  };

  // Aplicar filtros sempre que houver mudança
  useEffect(() => {
    let filtered = alunos;

    // Aplicar busca por texto
    if (searchText.trim() !== '') {
      filtered = filtered.filter(aluno =>
        aluno.nome_completo.toLowerCase().includes(searchText.toLowerCase()) ||
        aluno.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Aplicar filtros
    if (activeFilters.situacao) {
      const isAtivo = activeFilters.situacao === 'Ativo';
      filtered = filtered.filter(aluno => aluno.onboarding_completo === isAtivo);
    }

    if (activeFilters.genero) {
      filtered = filtered.filter(aluno => aluno.genero === activeFilters.genero);
    }

    if (activeFilters.objetivo) {
      filtered = filtered.filter(aluno => aluno.objetivo_principal === activeFilters.objetivo);
    }

    setFilteredAlunos(filtered);
  }, [searchText, alunos, activeFilters]);

  return {
    activeFilters,
    dropdownStates,
    filteredAlunos,
    filterOptions,
    toggleDropdown,
    updateFilter,
    clearAllFilters,
    getActiveFiltersCount
  };
};
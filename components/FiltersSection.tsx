// components/FiltersSection.tsx
import { ChevronDown, X } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ✅ INTERFACE GENÉRICA para qualquer tipo de filtro
interface FiltersSectionProps {
  activeFilters: Record<string, string>;
  dropdownStates: Record<string, boolean>;
  filterOptions: Record<string, string[]>;
  filterLabels: Record<string, string>; // ✅ Labels personalizáveis
  toggleDropdown: (filterType: string) => void;
  updateFilter: (filterType: string, value: string) => void;
  clearAllFilters: () => void;
  getActiveFiltersCount: () => number;
}

export const FiltersSection: React.FC<FiltersSectionProps> = ({
  activeFilters,
  dropdownStates,
  filterOptions,
  filterLabels,
  toggleDropdown,
  updateFilter,
  clearAllFilters,
  getActiveFiltersCount
}) => {
  const activeCount = getActiveFiltersCount();
  const filterKeys = Object.keys(filterOptions); // ✅ Pegar chaves dinamicamente

  // ✅ Renderizar dropdown como modal
  const renderDropdownModal = (type: string, label: string) => {
    if (!dropdownStates[type]) return null;

    return (
      <Modal
        key={`modal-${type}`}
        visible={dropdownStates[type]}
        transparent
        animationType="fade"
        onRequestClose={() => toggleDropdown(type)}
        accessible={false}
        importantForAccessibility="no"
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => toggleDropdown(type)}
        >
          <View style={styles.modalDropdown}>
            <Text style={styles.modalTitle}>{label}</Text>
            {filterOptions[type].map((option, index) => (
              <TouchableOpacity
                key={`${type}-option-${index}-${option}`}
                style={[
                  styles.modalOption,
                  activeFilters[type] === option && styles.modalOptionActive
                ]}
                onPress={() => {
                  updateFilter(type, option);
                  toggleDropdown(type);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  activeFilters[type] === option && styles.modalOptionTextActive
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderFilterButton = (type: string, label: string) => (
    <View key={`filter-${type}`} style={styles.filterContainer}>
      {/* ✅ NOVO: Label acima do dropdown */}
      <Text style={styles.filterLabel}>{label}</Text>
      
      <TouchableOpacity
        style={[
          styles.filterButton,
          activeFilters[type] && activeFilters[type] !== 'Todos' && styles.filterButtonActive,
          dropdownStates[type] && styles.filterButtonOpen
        ]}
        onPress={() => toggleDropdown(type)}
      >
        <Text style={[
          styles.filterButtonText,
          activeFilters[type] && activeFilters[type] !== 'Todos' && styles.filterButtonTextActive
        ]}>
          {activeFilters[type] || 'Todos'}
        </Text>
        <ChevronDown 
          size={16} 
          color={activeFilters[type] && activeFilters[type] !== 'Todos' ? '#FFFFFF' : '#6B7280'} 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filtros</Text>
        {activeCount > 0 && (
          <TouchableOpacity 
            onPress={clearAllFilters}
            style={styles.clearButton}
          >
            <X size={16} color="#EF4444" />
            <Text style={styles.clearButtonText}>
              Limpar ({activeCount})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filtersRow}>
        {filterKeys.map(key => renderFilterButton(key, filterLabels[key]))}
      </View>

      {/* ✅ Modals dos dropdowns - dinâmicos com keys corrigidas */}
      {filterKeys.map(key => renderDropdownModal(key, filterLabels[key]))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterContainer: {
    flex: 1,
  },
  // ✅ NOVO: Estilo para as labels
  filterLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
    textAlign: 'left',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonOpen: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  
  // Estilos do modal dropdown
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '80%',
    maxWidth: 300,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  modalOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  modalOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  modalOptionTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
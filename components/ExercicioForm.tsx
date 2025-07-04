// components/ExercicioForm.tsx - ADAPTÁVEL para CÓPIA e CRIAÇÃO DO ZERO
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {
    DIFICULDADES,
    EQUIPAMENTOS,
    GRUPOS_MUSCULARES,
    type Dificuldade,
    type Equipamento,
    type GrupoMuscular
} from '../constants/exercicios';

export interface ExercicioFormData {
  nome: string;
  descricao: string;
  grupo_muscular: GrupoMuscular | '';
  equipamento: Equipamento | '';
  dificuldade: Dificuldade;
  instrucoes: string;
}

export interface ExercicioOriginal {
  id: string;
  nome: string;
  descricao: string;
  grupo_muscular: string;
  equipamento: string;
  dificuldade: 'Baixa' | 'Média' | 'Alta';
  instrucoes: string;
}

export interface ExercicioFormProps {
  formData: ExercicioFormData;
  onUpdateField: (field: keyof ExercicioFormData, value: string) => void;
  exercicioOriginal?: ExercicioOriginal; // ✅ Opcional - só na tela de cópia
  mode?: 'create' | 'copy'; // ✅ Modo da tela
  disabled?: boolean; // ✅ Para desabilitar durante salvamento
}

export const ExercicioForm: React.FC<ExercicioFormProps> = ({
  formData,
  onUpdateField,
  exercicioOriginal,
  mode = 'create',
  disabled = false
}) => {
  // Estados dos modais de dropdown
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [showEquipamentoModal, setShowEquipamentoModal] = useState(false);
  const [showDificuldadeModal, setShowDificuldadeModal] = useState(false);

  // ✅ Componente de Dropdown Modal reutilizável
  const DropdownModal = ({ 
    visible, 
    title, 
    options, 
    selectedValue, 
    onSelect, 
    onClose 
  }: {
    visible: boolean;
    title: string;
    options: readonly string[];
    selectedValue: string;
    onSelect: (value: string) => void;
    onClose: () => void;
  }) => (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalOptions}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  selectedValue === option && styles.modalOptionSelected
                ]}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  selectedValue === option && styles.modalOptionTextSelected
                ]}>
                  {option}
                </Text>
                {selectedValue === option && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ✅ Componente de campo dropdown reutilizável
  const renderDropdownField = (
    label: string,
    value: string,
    placeholder: string,
    onPress: () => void,
    required: boolean = false
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity 
        style={[
          styles.dropdownButton,
          disabled && styles.inputDisabled,
          !value && styles.dropdownEmpty
        ]} 
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[
          styles.dropdownText,
          !value && styles.dropdownPlaceholder,
          disabled && styles.textDisabled
        ]}>
          {value || placeholder}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={disabled ? "#9CA3AF" : "#6B7280"} 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ✅ Info do exercício original (só no modo cópia) */}
      {mode === 'copy' && exercicioOriginal && (
        <View style={styles.originalInfo}>
          <View style={styles.originalHeader}>
            <Ionicons name="copy-outline" size={20} color="#007AFF" />
            <Text style={styles.originalTitle}>Baseado no exercício:</Text>
          </View>
          <Text style={styles.originalName}>{exercicioOriginal.nome}</Text>
        </View>
      )}

      {/* ✅ Formulário principal */}
      <View style={[styles.form, disabled && styles.formDisabled]}>
        {/* Nome do exercício */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Nome do Exercício <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.textInput,
              disabled && styles.inputDisabled,
              !formData.nome.trim() && styles.inputError
            ]}
            value={formData.nome}
            onChangeText={(text) => onUpdateField('nome', text)}
            placeholder={mode === 'create' ? "Ex: Supino Reto" : "Ex: Supino Reto (Personalizado)"}
            placeholderTextColor="#9CA3AF"
            maxLength={100}
            editable={!disabled}
          />
        </View>

        {/* Descrição */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[
              styles.textInput,
              styles.textArea,
              disabled && styles.inputDisabled
            ]}
            value={formData.descricao}
            onChangeText={(text) => onUpdateField('descricao', text)}
            placeholder="Descrição do exercício..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={500}
            editable={!disabled}
          />
        </View>

        {/* Grupo Muscular */}
        {renderDropdownField(
          'Grupo Muscular',
          formData.grupo_muscular,
          'Selecione o grupo muscular',
          () => setShowGrupoModal(true),
          true
        )}

        {/* Equipamento */}
        {renderDropdownField(
          'Equipamento',
          formData.equipamento,
          'Selecione o equipamento',
          () => setShowEquipamentoModal(true),
          true
        )}

        {/* Dificuldade */}
        {renderDropdownField(
          'Dificuldade',
          formData.dificuldade,
          'Selecione a dificuldade',
          () => setShowDificuldadeModal(true),
          true
        )}

        {/* Instruções de Execução */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Instruções de Execução</Text>
          <TextInput
            style={[
              styles.textInput,
              styles.textAreaLarge,
              disabled && styles.inputDisabled
            ]}
            value={formData.instrucoes}
            onChangeText={(text) => onUpdateField('instrucoes', text)}
            placeholder="Como executar o exercício passo a passo..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={1000}
            editable={!disabled}
          />
        </View>
      </View>

      {/* ✅ Modais dos dropdowns */}
      <DropdownModal
        visible={showGrupoModal}
        title="Selecionar Grupo Muscular"
        options={GRUPOS_MUSCULARES}
        selectedValue={formData.grupo_muscular}
        onSelect={(value) => onUpdateField('grupo_muscular', value)}
        onClose={() => setShowGrupoModal(false)}
      />

      <DropdownModal
        visible={showEquipamentoModal}
        title="Selecionar Equipamento"
        options={EQUIPAMENTOS}
        selectedValue={formData.equipamento}
        onSelect={(value) => onUpdateField('equipamento', value)}
        onClose={() => setShowEquipamentoModal(false)}
      />

      <DropdownModal
        visible={showDificuldadeModal}
        title="Selecionar Dificuldade"
        options={DIFICULDADES}
        selectedValue={formData.dificuldade}
        onSelect={(value) => onUpdateField('dificuldade', value)}
        onClose={() => setShowDificuldadeModal(false)}
      />
    </View>
  );
};

// ✅ Display name para debug
ExercicioForm.displayName = 'ExercicioForm';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  originalInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  originalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  originalTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  originalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  originalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  userFriendlyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  userFriendlyText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
  },
  formDisabled: {
    opacity: 0.7,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
  },
  textAreaLarge: {
    height: 120,
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#9CA3AF',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  textDisabled: {
    color: '#9CA3AF',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownEmpty: {
    borderColor: '#D1D5DB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalOptions: {
    maxHeight: 300,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  modalOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  modalOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
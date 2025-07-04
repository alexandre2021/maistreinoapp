// components/CreatePersonalizedExerciseModal.tsx
import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Exercicio } from '../types/Exercicio';
// ✅ Importar constants
import {
    DIFICULDADES,
    EQUIPAMENTOS,
    GRUPOS_MUSCULARES
} from '../constants/exercicios';

interface CreatePersonalizedExerciseModalProps {
  visible: boolean;
  exercicioBase?: Exercicio | null; // Para criar cópia ou editar
  isEdit?: boolean; // true = editar, false = criar cópia
  onClose: () => void;
  onSave: (exercicio: Partial<Exercicio>) => void;
  loading?: boolean;
}

export const CreatePersonalizedExerciseModal: React.FC<CreatePersonalizedExerciseModalProps> = ({
  visible,
  exercicioBase,
  isEdit = false,
  onClose,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    grupo_muscular: '',
    equipamento: '',
    dificuldade: 'Baixa' as 'Baixa' | 'Média' | 'Alta',
    instrucoes: '', // Campo texto único
    imagem_1_url: '',
    imagem_2_url: '',
    video_url: '',
    youtube_url: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Opções dos dropdowns usando constants
  const gruposMusculares = [...GRUPOS_MUSCULARES];
  const equipamentos = [...EQUIPAMENTOS];
  const dificuldades = [...DIFICULDADES];

  // Preencher formulário quando exercicioBase mudar
  useEffect(() => {
    if (exercicioBase && visible) {
      setFormData({
        nome: isEdit ? exercicioBase.nome : `${exercicioBase.nome} (Personalizado)`,
        descricao: exercicioBase.descricao,
        grupo_muscular: exercicioBase.grupo_muscular,
        equipamento: exercicioBase.equipamento,
        dificuldade: exercicioBase.dificuldade,
        instrucoes: exercicioBase.instrucoes || '', // Campo texto único
        imagem_1_url: exercicioBase.imagem_1_url || '',
        imagem_2_url: exercicioBase.imagem_2_url || '',
        video_url: exercicioBase.video_url || '',
        youtube_url: exercicioBase.youtube_url || ''
      });
    } else if (!exercicioBase && visible) {
      // Reset para criar novo
      setFormData({
        nome: '',
        descricao: '',
        grupo_muscular: '',
        equipamento: '',
        dificuldade: 'Baixa',
        instrucoes: '',
        imagem_1_url: '',
        imagem_2_url: '',
        video_url: '',
        youtube_url: ''
      });
    }
    setErrors({});
  }, [exercicioBase, visible, isEdit]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (!formData.grupo_muscular) {
      newErrors.grupo_muscular = 'Grupo muscular é obrigatório';
    }

    if (!formData.equipamento) {
      newErrors.equipamento = 'Equipamento é obrigatório';
    }

    if (!formData.instrucoes.trim()) {
      newErrors.instrucoes = 'Instruções são obrigatórias';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      Alert.alert('Erro', 'Por favor, corrija os erros no formulário.');
      return;
    }

    const exercicioData: Partial<Exercicio> = {
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim(),
      grupo_muscular: formData.grupo_muscular,
      equipamento: formData.equipamento,
      dificuldade: formData.dificuldade,
      instrucoes: formData.instrucoes.trim(),
      imagem_1_url: formData.imagem_1_url.trim() || undefined,
      imagem_2_url: formData.imagem_2_url.trim() || undefined,
      video_url: formData.video_url.trim() || undefined,
      youtube_url: formData.youtube_url.trim() || undefined,
      tipo: 'personalizado',
      is_ativo: true
    };

    onSave(exercicioData);
  };

  const renderDropdown = (
    label: string,
    value: string,
    options: string[],
    onSelect: (value: string) => void,
    errorKey: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.optionsContainer}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              value === option && styles.optionButtonSelected
            ]}
            onPress={() => onSelect(option)}
          >
            <Text style={[
              styles.optionText,
              value === option && styles.optionTextSelected
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {errors[errorKey] && (
        <Text style={styles.errorText}>{errors[errorKey]}</Text>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessible={false}
      importantForAccessibility="no"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isEdit ? 'Editar Exercício' : 'Criar Exercício Personalizado'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Nome */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome do Exercício</Text>
              <TextInput
                style={[styles.textInput, errors.nome && styles.textInputError]}
                value={formData.nome}
                onChangeText={(text) => setFormData(prev => ({ ...prev, nome: text }))}
                placeholder="Digite o nome do exercício"
                placeholderTextColor="#9CA3AF"
              />
              {errors.nome && (
                <Text style={styles.errorText}>{errors.nome}</Text>
              )}
            </View>

            {/* Descrição */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.textAreaInput, errors.descricao && styles.textInputError]}
                value={formData.descricao}
                onChangeText={(text) => setFormData(prev => ({ ...prev, descricao: text }))}
                placeholder="Descreva o exercício"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {errors.descricao && (
                <Text style={styles.errorText}>{errors.descricao}</Text>
              )}
            </View>

            {/* Grupo Muscular */}
            {renderDropdown(
              'Grupo Muscular',
              formData.grupo_muscular,
              gruposMusculares,
              (value) => setFormData(prev => ({ ...prev, grupo_muscular: value })),
              'grupo_muscular'
            )}

            {/* Equipamento */}
            {renderDropdown(
              'Equipamento',
              formData.equipamento,
              equipamentos,
              (value) => setFormData(prev => ({ ...prev, equipamento: value })),
              'equipamento'
            )}

            {/* Dificuldade */}
            {renderDropdown(
              'Dificuldade',
              formData.dificuldade,
              dificuldades,
              (value) => setFormData(prev => ({ ...prev, dificuldade: value as any })),
              'dificuldade'
            )}

            {/* Instruções */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Instruções de Execução</Text>
              <TextInput
                style={[styles.textAreaInput, errors.instrucoes && styles.textInputError]}
                value={formData.instrucoes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, instrucoes: text }))}
                placeholder="Descreva como executar o exercício passo a passo..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {errors.instrucoes && (
                <Text style={styles.errorText}>{errors.instrucoes}</Text>
              )}
            </View>

            {/* URLs das imagens */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>URL da Primeira Imagem (opcional)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.imagem_1_url}
                onChangeText={(text) => setFormData(prev => ({ ...prev, imagem_1_url: text }))}
                placeholder="https://exemplo.com/imagem1.jpg"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>URL da Segunda Imagem (opcional)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.imagem_2_url}
                onChangeText={(text) => setFormData(prev => ({ ...prev, imagem_2_url: text }))}
                placeholder="https://exemplo.com/imagem2.jpg"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* URLs dos vídeos */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>URL do Vídeo (opcional)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.video_url}
                onChangeText={(text) => setFormData(prev => ({ ...prev, video_url: text }))}
                placeholder="https://exemplo.com/video.mp4"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>URL do YouTube (opcional)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.youtube_url}
                onChangeText={(text) => setFormData(prev => ({ ...prev, youtube_url: text }))}
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
  },
  textInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  instrucaoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instrucaoNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
    marginTop: 6,
  },
  instrucaoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 36,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  bottomSpacing: {
    height: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
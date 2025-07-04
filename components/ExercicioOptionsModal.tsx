// components/ExercicioOptionsModal.tsx - SIMPLIFICADA PARA PERSONALIZADOS
import {
    Copy,
    Dumbbell,
    Trash2,
    X
} from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Exercicio } from '../types/Exercicio';

interface ExercicioOptionsModalProps {
  visible: boolean;
  exercicio: Exercicio | null;
  onClose: () => void;
  onViewDetails: () => void;
  onCreateCopy?: () => void; // Só para exercícios padrão
  onEdit?: () => void; // Só para exercícios personalizados
  onDelete?: () => void; // Só para exercícios personalizados
}

export const ExercicioOptionsModal: React.FC<ExercicioOptionsModalProps> = ({
  visible,
  exercicio,
  onClose,
  onViewDetails,
  onCreateCopy,
  onEdit,
  onDelete
}) => {
  if (!exercicio) return null;

  // ✅ CORRIGIDO: Usar os handlers passados como props
  const handleOptionPress = (optionHandler: () => void) => {
    console.log('🔄 Executando ação da modal...');
    optionHandler();
  };

  // ✅ CORRIGIDO: Usar o handler de ViewDetails passado como prop
  const handleViewDetails = () => {
    console.log('👁️ Ver detalhes clicado na modal');
    handleOptionPress(onViewDetails);
  };

  // ✅ CORRIGIDO: Usar o handler de CreateCopy passado como prop
  const handleCreateCopy = () => {
    console.log('📋 Criar cópia clicado na modal');
    if (onCreateCopy) {
      handleOptionPress(onCreateCopy);
    }
  };

  // ✅ CORRIGIDO: Usar o handler de Delete passado como prop
  const handleDelete = () => {
    console.log('🗑️ Excluir clicado na modal');
    if (onDelete) {
      handleOptionPress(onDelete);
    }
  };

  // Opções para exercícios padrão
  const padraoOptions = [
    {
      icon: Dumbbell, // ✅ Ícone de halteres
      label: 'Ver Detalhes',
      description: 'Visualizar informações completas do exercício',
      onPress: handleViewDetails,
      color: '#3B82F6' // ✅ Azul padronizado
    }
  ];

  if (onCreateCopy) {
    padraoOptions.push({
      icon: Copy,
      label: 'Criar Cópia Personalizada',
      description: 'Criar uma versão editável deste exercício',
      onPress: handleCreateCopy,
      color: '#10B981'
    });
  }

  // ✅ SIMPLIFICADO: Opções para exercícios personalizados
  const personalizadosOptions = [
    {
      icon: Dumbbell, // ✅ Ícone de halteres padronizado
      label: 'Editar Exercício Personalizado',
      description: 'Visualizar e modificar informações do exercício',
      onPress: handleViewDetails, // ✅ CORRIGIDO: Usar handleViewDetails
      color: '#3B82F6' // ✅ Azul igual aos alunos
    }
  ];

  const options = exercicio.tipo === 'padrao' ? padraoOptions : personalizadosOptions;

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
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{exercicio.nome}</Text>
              <Text style={styles.subtitle}>
                {exercicio.grupo_muscular} • {exercicio.equipamento}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionItem}
                onPress={option.onPress}
              >
                <View style={[styles.optionIcon, { backgroundColor: `${option.color}15` }]}>
                  <option.icon size={24} color={option.color} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* ✅ Mostrar opção de excluir apenas para exercícios personalizados */}
            {exercicio.tipo === 'personalizado' && onDelete && (
              <>
                <View style={styles.separator} />
                <TouchableOpacity
                  style={[styles.optionItem, styles.deleteOption]}
                  onPress={handleDelete}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#FEF2F2' }]}>
                    <Trash2 size={24} color="#EF4444" />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionLabel, styles.deleteLabel]}>
                      Excluir Exercício
                    </Text>
                    <Text style={styles.optionDescription}>
                      Remove permanentemente este exercício personalizado
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
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
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  deleteOption: {
    marginTop: 8,
  },
  deleteLabel: {
    color: '#EF4444',
  },
});
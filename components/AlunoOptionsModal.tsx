// components/AlunoOptionsModal.tsx - VERSÃO COMPLETA CORRIGIDA
import {
    BarChart3,
    Dumbbell,
    FileText,
    Trash2,
    User,
    X
} from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Aluno } from '../types/Aluno';

interface AlunoOptionsModalProps {
  visible: boolean;
  aluno: Aluno | null;
  onClose: () => void;
  onViewDetails: () => void;
  onViewParQ: () => void;
  onViewAvaliacoes: () => void;
  onViewRotinas: () => void;
  onDelete: () => void;
}

export const AlunoOptionsModal: React.FC<AlunoOptionsModalProps> = ({
  visible,
  aluno,
  onClose,
  onViewDetails,
  onViewParQ,
  onViewAvaliacoes,
  onViewRotinas,
  onDelete
}) => {
  if (!aluno) return null;

  // ✅ CORREÇÃO: Função para lidar com exclusão
  const handleDelete = () => {
    // Não fecha a modal imediatamente - deixa o parent controlar
    onDelete();
  };

  // ✅ CORREÇÃO: Função para lidar com outras opções
  const handleOptionPress = (optionHandler: () => void) => {
    optionHandler();
    // Só fecha para opções que não são delete - o parent já controla isso
  };

  const options = [
    {
      icon: User,
      label: 'Ver Detalhes',
      description: 'Informações pessoais e dados do aluno',
      onPress: () => handleOptionPress(onViewDetails),
      color: '#3B82F6'
    },
    {
      icon: FileText,
      label: 'PAR-Q',
      description: 'Questionário de prontidão para atividade física',
      onPress: () => handleOptionPress(onViewParQ),
      color: '#10B981'
    },
    {
      icon: BarChart3,
      label: 'Avaliações',
      description: 'Medidas corporais e evolução física',
      onPress: () => handleOptionPress(onViewAvaliacoes),
      color: '#8B5CF6'
    },
    {
      icon: Dumbbell,
      label: 'Rotinas',
      description: 'Rotinas de treino personalizadas',
      onPress: () => handleOptionPress(onViewRotinas),
      color: '#F59E0B'
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{aluno.nome_completo}</Text>
              <Text style={styles.subtitle}>{aluno.email}</Text>
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
                  Excluir Aluno
                </Text>
                <Text style={styles.optionDescription}>
                  Remove permanentemente todos os dados do aluno
                </Text>
              </View>
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
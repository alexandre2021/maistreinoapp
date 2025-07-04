// components/ConfirmDeleteModal.tsx - VERSÃO GENÉRICA
import { AlertTriangle } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LoadingIcon from './LoadingIcon';

interface ConfirmDeleteModalProps<T = any> {
  visible: boolean;
  item: T | null;
  itemType?: 'aluno' | 'exercicio'; // ✅ Opcional para manter compatibilidade
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// ✅ Interface específica para manter compatibilidade com alunos
interface ConfirmDeleteModalAlunoProps {
  visible: boolean;
  aluno: any | null; // ✅ Mantém prop 'aluno' original
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps | ConfirmDeleteModalAlunoProps> = (props) => {
  // ✅ COMPATIBILIDADE: Detectar se é chamada antiga (alunos) ou nova (genérica)
  const isLegacyAlunoCall = 'aluno' in props;
  
  const item = isLegacyAlunoCall ? props.aluno : props.item;
  const itemType = isLegacyAlunoCall ? 'aluno' : (props as ConfirmDeleteModalProps).itemType || 'aluno';
  const { visible, loading, onConfirm, onCancel } = props;

  if (!item) return null;

  // ✅ CONFIGURAÇÕES POR TIPO
  const configs = {
    aluno: {
      title: 'Confirmar Exclusão',
      itemName: item.nome_completo,
      warningText: 'Tem certeza que deseja excluir',
      dataItems: [
        '• Informações pessoais',
        '• Respostas do PAR-Q', 
        '• Avaliações físicas',
        '• Rotinas de treino',
        '• Histórico de progresso'
      ]
    },
    exercicio: {
      title: 'Excluir Exercício',
      itemName: item.nome,
      warningText: 'Tem certeza que deseja excluir o exercício',
      dataItems: [
        '• Informações do exercício',
        '• Imagens e vídeos',
        '• Instruções personalizadas',
        '• Configurações específicas'
      ]
    }
  };

  const config = configs[itemType];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessible={false}
      importantForAccessibility="no"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <AlertTriangle size={48} color="#EF4444" />
          </View>

          <Text style={styles.title}>{config.title}</Text>
          
          <Text style={styles.message}>
            {config.warningText}{' '}
            <Text style={styles.itemName}>{config.itemName}</Text>?
          </Text>

          <Text style={styles.warning}>
            ⚠️ Esta ação não pode ser desfeita. Todos os dados serão removidos permanentemente.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <LoadingIcon color="#FFFFFF" size={16} />
              ) : (
                <Text style={styles.confirmButtonText}>Excluir</Text>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  itemName: {
    fontWeight: '600',
    color: '#1F2937',
  },
  warning: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dataList: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  dataItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    paddingLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
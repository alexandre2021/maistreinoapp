// components/rotina/ConfirmActionModal.tsx
import { AlertTriangle, CheckCircle, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmActionModalProps {
  visible: boolean;
  title: string;
  message: string;
  itemName?: string;
  actionType: 'delete' | 'destructive' | 'warning' | 'success';
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  visible,
  title,
  message,
  itemName,
  actionType,
  confirmText,
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false
}) => {
  const getIcon = () => {
    switch (actionType) {
      case 'delete':
        return <Trash2 size={48} color="#EF4444" />;
      case 'destructive':
        return <AlertTriangle size={48} color="#F59E0B" />;
      case 'warning':
        return <AlertTriangle size={48} color="#F59E0B" />;
      case 'success':
        return <CheckCircle size={48} color="#10B981" />;
      default:
        return <AlertTriangle size={48} color="#F59E0B" />;
    }
  };

  const getConfirmButtonStyle = () => {
    switch (actionType) {
      case 'delete':
        return styles.deleteButton;
      case 'destructive':
        return styles.destructiveButton;
      case 'warning':
        return styles.warningButton;
      case 'success':
        return styles.successButton;
      default:
        return styles.warningButton;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>

          <Text style={styles.title}>{title}</Text>
          
          {itemName && (
            <Text style={styles.itemName}>&quot;{itemName}&quot;</Text>
          )}

          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, getConfirmButtonStyle(), loading && styles.disabledButton]}
              onPress={onConfirm}
              disabled={loading}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? 'Processando...' : confirmText}
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
    marginBottom: 8,
    textAlign: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A11E0A',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
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
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  destructiveButton: {
    backgroundColor: '#F59E0B',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
});

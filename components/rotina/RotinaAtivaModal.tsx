// components/rotina/RotinaAtivaModal.tsx
import { AlertCircle } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeText } from '../SafeText';

interface RotinaAtivaModalProps {
  visible: boolean;
  rotinaNome: string;
  rotinaStatus: string;
  onViewRotina: () => void;
  onCancel: () => void;
}

export const RotinaAtivaModal: React.FC<RotinaAtivaModalProps> = ({
  visible,
  rotinaNome,
  rotinaStatus,
  onViewRotina,
  onCancel
}) => {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'ativa': return 'Ativa';
      case 'pausada': return 'Pausada';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return '#F59E0B';
      case 'ativa': return '#10B981';
      case 'pausada': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  const getMessage = (status: string) => {
    switch (status) {
      case 'ativa': 
        return 'Este aluno já possui uma rotina ativa. Finalize ou cancele a rotina atual antes de criar uma nova.';
      case 'pendente':
        return 'Este aluno já possui uma rotina pendente. Finalize ou cancele a rotina atual antes de criar uma nova.';
      case 'pausada':
        return 'Este aluno já possui uma rotina pausada. Reative ou cancele a rotina atual antes de criar uma nova.';
      default:
        return 'Este aluno já possui uma rotina em andamento. Finalize ou cancele a rotina atual antes de criar uma nova.';
    }
  };

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
            <AlertCircle size={48} color="#F59E0B" />
          </View>

          <Text style={styles.title}>Rotina já existe</Text>
          
          <SafeText style={styles.rotinaNome}>&quot;{rotinaNome}&quot;</SafeText>

          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(rotinaStatus) }]}>
              <SafeText style={styles.statusText}>{getStatusLabel(rotinaStatus)}</SafeText>
            </View>
          </View>

          <SafeText style={styles.message}>
            {getMessage(rotinaStatus)}
          </SafeText>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Entendi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onViewRotina}
            >
              <Text style={styles.confirmButtonText}>Ver Rotina</Text>
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
  rotinaNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
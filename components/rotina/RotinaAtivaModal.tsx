// components/rotina/RotinaAtivaModal.tsx
import { AlertCircle, X } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RotinaAtivaModalProps {
  visible: boolean;
  rotinaNome: string;
  rotinaStatus: string;
  onCancel: () => void;
}

export const RotinaAtivaModal: React.FC<RotinaAtivaModalProps> = ({
  visible,
  rotinaNome,
  rotinaStatus,
  onCancel
}) => {
  const getStatusLabel = (status: string) => {
    return status; // Agora o status já é o texto legível
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aguardando pagamento': return '#F59E0B';
      case 'Ativa': return '#10B981';
      case 'Pausada': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  const getMessage = (status: string) => {
    switch (status) {
      case 'Ativa': 
        return 'Este aluno já possui uma rotina ativa. Conclua ou exclua a rotina atual antes de criar uma nova.';
      case 'Aguardando pagamento':
        return 'Este aluno já possui uma rotina aguardando pagamento. Conclua ou exclua a rotina atual antes de criar uma nova.';
      case 'Pausada':
        return 'Este aluno já possui uma rotina pausada. Reative ou exclua a rotina atual antes de criar uma nova.';
      default:
        return 'Este aluno já possui uma rotina em andamento. Conclua ou exclua a rotina atual antes de criar uma nova.';
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
          {/* Botão X no canto superior direito */}
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <AlertCircle size={48} color="#F59E0B" />
          </View>

          <Text style={styles.title}>Rotina já existe</Text>
          
          <Text style={styles.rotinaNome}>&quot;{rotinaNome}&quot;</Text>

          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(rotinaStatus) }]}>
              <Text style={styles.statusText}>{getStatusLabel(rotinaStatus)}</Text>
            </View>
          </View>

          <Text style={styles.message}>
            {getMessage(rotinaStatus)}
          </Text>
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
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
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
    color: '#A11E0A',
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
});

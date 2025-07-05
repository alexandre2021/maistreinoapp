// components/rotina/AtivarRotinaModal.tsx
import { CheckCircle2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CustomSwitch } from '../ui/CustomSwitch';

interface AtivarRotinaModalProps {
  visible: boolean;
  rotinaNome: string;
  onConfirm: (config: { permiteExecucao: boolean; enviarEmail: boolean }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const AtivarRotinaModal: React.FC<AtivarRotinaModalProps> = ({
  visible,
  rotinaNome,
  onConfirm,
  onCancel,
  loading = false
}) => {
  const [permiteExecucao, setPermiteExecucao] = useState(true);
  const [enviarEmail, setEnviarEmail] = useState(false);

  const handleConfirm = () => {
    onConfirm({ permiteExecucao, enviarEmail });
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
            <CheckCircle2 size={48} color="#10B981" />
          </View>

          <Text style={styles.title}>Ativar Rotina</Text>
          
          <Text style={styles.rotinaNome}>&quot;{rotinaNome}&quot;</Text>

          <Text style={styles.subtitle}>
            Configure as opções de ativação:
          </Text>

          <View style={styles.configContainer}>
            <View style={styles.configRow}>
              <View style={styles.configInfo}>
                <Text style={styles.configTitle}>Execução no App</Text>
                <Text style={styles.configDescription}>
                  Permite que o aluno execute os treinos pelo aplicativo
                </Text>
              </View>
              <CustomSwitch
                value={permiteExecucao}
                onValueChange={setPermiteExecucao}
              />
            </View>

            <View style={styles.configRow}>
              <View style={styles.configInfo}>
                <Text style={styles.configTitle}>Enviar por Email</Text>
                <Text style={styles.configDescription}>
                  Envia a rotina completa para o email do aluno
                </Text>
              </View>
              <CustomSwitch
                value={enviarEmail}
                onValueChange={setEnviarEmail}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton, loading && styles.disabledButton]}
              onPress={handleConfirm}
              disabled={loading}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? 'Ativando...' : 'Ativar'}
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
  rotinaNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  configContainer: {
    width: '100%',
    marginBottom: 24,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  configInfo: {
    flex: 1,
    marginRight: 16,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  configDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
});

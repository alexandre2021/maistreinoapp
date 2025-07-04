// app/avaliacoes/components/ConfirmacaoIntervaloModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmacaoIntervaloModalProps {
  visible: boolean;
  diasUltima: number;
  diasRestantes: number;
  ultimaData: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function ConfirmacaoIntervaloModal({
  visible,
  diasUltima,
  diasRestantes,
  ultimaData,
  onConfirmar,
  onCancelar
}: ConfirmacaoIntervaloModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" accessible={false} importantForAccessibility="no">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header com ícone */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="time-outline" size={32} color="#F59E0B" />
            </View>
            <Text style={styles.title}>Intervalo Recomendado</Text>
          </View>

          {/* Conteúdo */}
          <View style={styles.content}>
            <Text style={styles.text}>
              Última avaliação realizada há{' '}
              <Text style={styles.highlight}>{diasUltima} {diasUltima === 1 ? 'dia' : 'dias'}</Text>{' '}
              ({ultimaData}).
            </Text>
            
            <Text style={styles.text}>
              Para resultados mais precisos, recomendamos aguardar mais{' '}
              <Text style={styles.highlight}>{diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}</Text>.
            </Text>
            
            <Text style={styles.question}>
              Deseja continuar mesmo assim?
            </Text>
          </View>

          {/* Botões */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancelar}
            >
              <Text style={styles.cancelButtonText}>Aguardar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirmar}
            >
              <Text style={styles.confirmButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  text: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  highlight: {
    fontWeight: '600',
    color: '#F59E0B',
  },
  question: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});
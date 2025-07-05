// components/StatusInfoModal.tsx
import { CheckCircle, Clock, X } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StatusInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export const StatusInfoModal: React.FC<StatusInfoModalProps> = ({
  visible,
  onClose
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Status dos Alunos</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.statusItem}>
              <View style={styles.statusIcon}>
                <CheckCircle size={20} color="#10B981" />
              </View>
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>Ativo</Text>
                <Text style={styles.statusDescription}>
                  Aluno completou o onboarding inicial e tem acesso completo ao app.
                  Pode visualizar treinos, fazer avaliações e acompanhar progresso.
                </Text>
              </View>
            </View>

            <View style={styles.statusItem}>
              <View style={styles.statusIcon}>
                <Clock size={20} color="#F59E0B" />
              </View>
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>Pendente</Text>
                <Text style={styles.statusDescription}>
                  Aluno foi cadastrado mas ainda não completou o onboarding.
                  Precisa preencher informações básicas como objetivos, 
                  medidas e preferências de treino.
                </Text>
              </View>
            </View>

            <View style={styles.note}>
              <Text style={styles.noteText}>
                💡 <Text style={styles.noteTextBold}>Dica:</Text> Alunos pendentes 
                recebem notificações para completar o cadastro. Você pode 
                acompanhar o progresso na tela de detalhes do aluno.
              </Text>
            </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  statusItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statusIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  note: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginTop: 10,
  },
  noteText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  noteTextBold: {
    fontWeight: '600',
  },
});
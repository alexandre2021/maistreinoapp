// components/UpgradeModal.tsx - PLACEHOLDER PARA DESENVOLVIMENTO FUTURO
import { Check, Crown, X } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  visible,
  onClose,
  onUpgrade
}) => {
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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.crownContainer}>
              <Crown size={48} color="#F59E0B" />
            </View>
            <Text style={styles.title}>Processamento de Upgrade</Text>
            <Text style={styles.subtitle}>
              Modal temporária - Em desenvolvimento
            </Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.sectionTitle}>📋 Para o desenvolvedor:</Text>
            
            <View style={styles.todoItem}>
              <Check size={20} color="#F59E0B" />
              <Text style={styles.todoText}>Criar upgrade para plano escolhido</Text>
            </View>
            
            <View style={styles.todoItem}>
              <Check size={20} color="#F59E0B" />
              <Text style={styles.todoText}>Integrar com sistema de pagamento</Text>
            </View>
            
            <View style={styles.todoItem}>
              <Check size={20} color="#F59E0B" />
              <Text style={styles.todoText}>Receber dados do plano selecionado</Text>
            </View>
            
            <View style={styles.todoItem}>
              <Check size={20} color="#F59E0B" />
              <Text style={styles.todoText}>Atualizar plano na tabela personal_trainers</Text>
            </View>
            
            <View style={styles.todoItem}>
              <Check size={20} color="#F59E0B" />
              <Text style={styles.todoText}>Mostrar confirmação de sucesso</Text>
            </View>

            <View style={styles.noteContainer}>
              <Text style={styles.noteTitle}>💡 Nota técnica:</Text>
              <Text style={styles.noteText}>
                Esta modal será chamada após o usuário escolher um plano na PlanosModal. 
                Aqui deve ser implementada a lógica de processamento do upgrade e integração 
                com o sistema de pagamento.
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={onUpgrade}
            >
              <Text style={styles.upgradeButtonText}>
                🚧 Simular Upgrade (Temporário)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={onClose}
            >
              <Text style={styles.laterButtonText}>Fechar</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  crownContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  todoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  noteContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  buttonContainer: {
    padding: 24,
    paddingTop: 0,
  },
  upgradeButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
import { Edit2, Eye, EyeOff, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../lib/supabase';

interface PasswordChangeSectionProps {
  onPasswordChange?: (success: boolean, message: string) => void;
  loading?: boolean;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
}

const PasswordChangeSection: React.FC<PasswordChangeSectionProps> = ({
  onPasswordChange,
  loading = false
}) => {
  // Estados do modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estados dos campos de senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados de visibilidade das senhas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estados do toast local
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });
  const [toastAnimation] = useState(new Animated.Value(0));

  // Função para mostrar toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    
    Animated.sequence([
      Animated.timing(toastAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(toastAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast({ visible: false, message: '', type: 'success' });
    });
  };

  // Abrir modal
  const openModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowModal(true);
  };

  // Fechar modal
  const closeModal = () => {
    setShowModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Validar e salvar nova senha
  const savePassword = async () => {
    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Preencha todos os campos de senha', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Nova senha e confirmação não coincidem', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Nova senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }

    setSaving(true);

    try {
      console.log('🔐 [PasswordChange] Verificando senha atual...');
      
      // Verificar senha atual
      const { data: isValid, error: verifyError } = await supabase.rpc('verify_user_password', {
        password: currentPassword
      });

      if (verifyError) {
        console.error('❌ [PasswordChange] Erro ao verificar senha:', verifyError);
        showToast('Erro ao verificar senha atual', 'error');
        onPasswordChange?.(false, 'Erro ao verificar senha atual');
        return;
      }

      if (!isValid) {
        console.log('❌ [PasswordChange] Senha atual incorreta');
        showToast('Senha atual incorreta', 'error');
        onPasswordChange?.(false, 'Senha atual incorreta');
        return;
      }

      console.log('✅ [PasswordChange] Senha atual válida, atualizando...');

      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('❌ [PasswordChange] Erro ao atualizar senha:', updateError);
        showToast('Erro ao alterar senha: ' + updateError.message, 'error');
        onPasswordChange?.(false, 'Erro ao alterar senha: ' + updateError.message);
        return;
      }

      console.log('✅ [PasswordChange] Senha alterada com sucesso!');
      showToast('Senha alterada com sucesso!', 'success');
      onPasswordChange?.(true, 'Senha alterada com sucesso!');
      closeModal();
      
    } catch (error) {
      console.error('💥 [PasswordChange] Erro inesperado:', error);
      showToast('Erro inesperado ao alterar senha', 'error');
      onPasswordChange?.(false, 'Erro inesperado ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Toast Local */}
      {toast.visible && (
        <Animated.View 
          style={[
            styles.toastContainer,
            toast.type === 'success' ? styles.toastSuccess : styles.toastError,
            {
              opacity: toastAnimation,
              transform: [{
                translateY: toastAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0]
                })
              }]
            }
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* Seção de Segurança */}
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alterar Senha</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={openModal}
            disabled={loading}
          >
            <Edit2 size={16} color="#007AFF" />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.passwordSection}>
          <View style={styles.passwordRow}>
            <View style={styles.passwordField}>
              <Text style={styles.infoLabel}>Senha Atual</Text>
              <View style={styles.passwordDisplay}>
                <Text style={styles.passwordDots}>••••••••</Text>
              </View>
            </View>
          </View>

          <View style={styles.passwordRow}>
            <View style={styles.passwordField}>
              <Text style={styles.infoLabel}>Nova Senha</Text>
              <View style={styles.passwordDisplay}>
                <Text style={styles.passwordDots}>••••••••</Text>
              </View>
            </View>
          </View>

          <View style={styles.passwordRow}>
            <View style={styles.passwordField}>
              <Text style={styles.infoLabel}>Confirmar Nova Senha</Text>
              <View style={styles.passwordDisplay}>
                <Text style={styles.passwordDots}>••••••••</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Modal de Edição de Senha */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header do Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alterar Senha</Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Conteúdo do Modal */}
            <ScrollView style={styles.modalContent}>
              {/* Senha Atual */}
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Senha Atual</Text>
                <View style={styles.passwordEditContainer}>
                  <TextInput
                    style={styles.passwordEditInput}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Digite sua senha atual"
                    secureTextEntry={!showCurrentPassword}
                    editable={!saving}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggleButton}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={saving}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={20} color="#64748B" />
                    ) : (
                      <Eye size={20} color="#64748B" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Nova Senha */}
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Nova Senha</Text>
                <View style={styles.passwordEditContainer}>
                  <TextInput
                    style={styles.passwordEditInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Digite a nova senha (mín. 6 caracteres)"
                    secureTextEntry={!showNewPassword}
                    editable={!saving}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggleButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    disabled={saving}
                  >
                    {showNewPassword ? (
                      <EyeOff size={20} color="#64748B" />
                    ) : (
                      <Eye size={20} color="#64748B" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirmar Nova Senha */}
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Confirmar Nova Senha</Text>
                <View style={styles.passwordEditContainer}>
                  <TextInput
                    style={styles.passwordEditInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Digite novamente a nova senha"
                    secureTextEntry={!showConfirmPassword}
                    editable={!saving}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggleButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={saving}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#64748B" />
                    ) : (
                      <Eye size={20} color="#64748B" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Botões do Modal */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={savePassword}
                disabled={saving}
              >
                <Text style={styles.saveText}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Seção Principal
  tabContent: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  passwordSection: {
    gap: 16,
  },
  passwordRow: {
    flexDirection: 'row',
    gap: 16,
  },
  passwordField: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  passwordDisplay: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  passwordDots: {
    fontSize: 16,
    color: '#64748B',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    padding: 20,
  },
  editField: {
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  passwordEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  passwordEditInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  passwordToggleButton: {
    padding: 12,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
  },
  toastSuccess: {
    backgroundColor: '#10B981',
  },
  toastError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default PasswordChangeSection;
// VERSÃO COM TOAST SYSTEM E SAFE AREA
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LoadingIcon from '../components/LoadingIcon';

export default function ConviteAlunoScreen() {
  const [nomeAluno] = useState('');
  const [emailAluno] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // 🔥 ESTADO DO TOAST
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const insets = useSafeAreaInsets();

  // 🔥 FUNÇÃO PARA MOSTRAR TOAST
  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEnviarConvite = async () => {
    // Validações
    if (!nomeAluno.trim()) {
      showToast('Por favor, informe o nome do aluno.', 'error');
      return;
    }
    if (!emailAluno.trim()) {
      showToast('Por favor, informe o email do aluno.', 'error');
      return;
    }
    if (!validateEmail(emailAluno)) {
      showToast('Por favor, informe um email válido.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      // ... lógica de envio ...
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = nomeAluno.trim() && emailAluno.trim() && validateEmail(emailAluno);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* ...outros campos e conteúdo... */}
      </ScrollView>
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: '#fff', padding: 16, paddingBottom: 8 }}>
        <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}> 
          <TouchableOpacity
            style={[
              styles.createButton,
              (!isFormValid || isLoading) && styles.createButtonDisabled
            ]}
            onPress={handleEnviarConvite}
            disabled={!isFormValid || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <LoadingIcon color="white" size={20} />
            ) : (
              <>
                <Ionicons name="mail" size={20} color="white" />
                <Text style={styles.createButtonText}>Enviar Convite</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      {/* 🔥 TOAST DE NOTIFICAÇÃO */}
      {toastVisible && (
        <View style={[
          styles.toast,
          toastType === 'success' ? styles.toastSuccess : styles.toastError
        ]}>
          <Ionicons
            name={toastType === 'success' ? 'checkmark-circle' : 'alert-circle'}
            size={20}
            color="white"
          />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A11E0A',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 40,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  toastSuccess: {
    backgroundColor: '#10B981',
  },
  toastError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
  },
});

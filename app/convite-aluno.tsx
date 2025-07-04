// VERSÃO COM TOAST SYSTEM
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import LoadingIcon from '../components/LoadingIcon';
import { supabase } from '../lib/supabase';

export default function ConviteAlunoScreen() {
  const [nomeAluno, setNomeAluno] = useState('');
  const [emailAluno, setEmailAluno] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 🔥 ESTADO DO TOAST
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

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
      // 1. Buscar dados do PT logado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não está logado');
      }

      // 2. Buscar dados do Personal Trainer
      const { data: ptData, error: ptError } = await supabase
        .from('personal_trainers')
        .select('codigo_pt, nome_completo')
        .eq('id', user.id)
        .single();

      if (ptError || !ptData) {
        throw new Error('Dados do Personal Trainer não encontrados');
      }

      console.log('📧 Enviando convite via Database Function...');
      console.log('👤 Aluno:', nomeAluno);
      console.log('📮 Email:', emailAluno);
      console.log('👨‍💼 PT:', ptData.nome_completo);
      console.log('🔑 Código:', ptData.codigo_pt);

      // 3. Enviar convite via Database Function (RPC)
      console.log('🚀 Chamando Database Function...');
      
      const { data, error } = await supabase.functions.invoke('enviar-convite', {
        body: {
          nome_aluno: nomeAluno.trim(),
          email_aluno: emailAluno.toLowerCase().trim(),
          codigo_pt: ptData.codigo_pt,
          nome_personal: ptData.nome_completo
        }
      });
      
      console.log('📊 Resposta da Database Function:');
      console.log('✅ Data:', JSON.stringify(data, null, 2));
      console.log('❌ Error:', JSON.stringify(error, null, 2));

      if (error) {
        console.error('❌ Erro Database Function detalhado:', error);
        throw new Error(`Erro ao enviar convite: ${error.message || JSON.stringify(error)}`);
      }

      if (!data || !data.success) {
        console.error('❌ Resposta sem sucesso:', data);
        throw new Error(data?.error || 'Falha no envio do convite');
      }

      console.log('✅ Convite enviado - MessageID:', data.messageId);

      // 🔥 TOAST DE SUCESSO
      showToast(
        `✅ Convite enviado para ${nomeAluno}! Código: ${ptData.codigo_pt}`, 
        'success'
      );

      // Limpar formulário após sucesso
      setTimeout(() => {
        setNomeAluno('');
        setEmailAluno('');
      }, 1000);

    } catch (error: any) {
      console.error('💥 Erro:', error);
      
      // 🔥 TOAST DE ERRO
      showToast(
        error.message || 'Erro ao processar convite.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoltar = () => {
    router.push('/alunos');
  };

  const isFormValid = nomeAluno.trim() && emailAluno.trim() && validateEmail(emailAluno);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleVoltar}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Convidar Aluno</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={32} color="#007AFF" />
          </View>
          <Text style={styles.welcomeTitle}>Convidar Novo Aluno</Text>
          <Text style={styles.welcomeSubtitle}>
            Envie um convite por email com seu código PT. Simples e direto!
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nome do Aluno</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Ex: João Silva"
                value={nomeAluno}
                onChangeText={setNomeAluno}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email do Aluno</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Ex: joao@email.com"
                value={emailAluno}
                onChangeText={setEmailAluno}
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {emailAluno.length > 0 && !validateEmail(emailAluno) && (
              <Text style={styles.errorText}>Email inválido</Text>
            )}
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="mail" size={24} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Convite por Email</Text>
              <Text style={styles.infoText}>
                • Enviaremos um email com seu código{'\n'}
                • Aluno baixa o app MaisTreino{'\n'}
                • No cadastro, ele usa o código para se vincular{'\n'}
                • Simples e direto!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  formSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#374151',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },
  infoSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#075985',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
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
  // 🔥 ESTILOS DO TOAST
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    gap: 12,
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
    flex: 1,
    lineHeight: 20,
  },
});
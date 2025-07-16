import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConviteAluno() {
  const [nomeAluno, setNomeAluno] = useState('');
  const [emailAluno, setEmailAluno] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  useEffect(() => {
    if (nomeAluno.trim().length > 2 && validateEmail(emailAluno)) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [nomeAluno, emailAluno]);

  const handleEnviarConvite = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    setTimeout(() => {
      console.log('Enviando convite para:', { nome: nomeAluno, email: emailAluno });
      setIsLoading(false);
      
      Alert.alert(
        "Convite Enviado!",
        `Um convite foi enviado para ${nomeAluno}. Ele aparecerá na sua lista de alunos assim que completar o próprio cadastro.`,
        [
          { 
            text: "OK", 
            onPress: () => {
              if (router.canGoBack()) router.back();
            } 
          }
        ]
      );

    }, 2000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView edges={["top"]} style={{ backgroundColor: '#fff' }}/>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Convidar Aluno</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.welcomeSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-unread-outline" size={40} color="#0369A1" />
          </View>
          <Text style={styles.welcomeTitle}>Convidar Novo Aluno</Text>
          <Text style={styles.welcomeSubtitle}>
            Você enviará um convite por email. O aluno precisará aceitar e completar o próprio cadastro para se vincular a você.
          </Text>
        </View>

        <View style={styles.formSection}>
          {/* Inputs de nome e email... */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nome do Aluno</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput style={styles.textInput} placeholder="Ex: João Silva" value={nomeAluno} onChangeText={setNomeAluno} placeholderTextColor="#9CA3AF" autoCapitalize="words" autoCorrect={false}/>
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email do Aluno</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput style={styles.textInput} placeholder="Ex: joao@email.com" value={emailAluno} onChangeText={setEmailAluno} placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" autoCorrect={false}/>
            </View>
            {emailAluno.length > 0 && !validateEmail(emailAluno) && (<Text style={styles.errorText}>Email inválido</Text>)}
          </View>
        </View>

        <View style={styles.infoSection}>
          {/* ✅ ESTRUTURA DO CARD ATUALIZADA */}
          <View style={styles.infoCard}>
            {/* 1. Header do card com Título e Ícone */}
            <View style={styles.infoCardHeader}>
              <Ionicons name="alert-circle-outline" size={20} color="#A11E0A" />
              <Text style={styles.infoTitle}>Como funciona?</Text>
            </View>
            {/* 2. Corpo do card com texto em largura total */}
            <Text style={styles.infoText}>
              • Um convite será enviado para o email informado.{'\n'}
              • O aluno deverá baixar o app e se cadastrar.{'\n'}
              • Após o cadastro, ele aparecerá na sua lista.
            </Text>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: '#fff' }}>
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.createButton, (!isFormValid || isLoading) && styles.createButtonDisabled]} onPress={handleEnviarConvite} disabled={!isFormValid || isLoading} activeOpacity={0.8}>
            {isLoading ? (<ActivityIndicator color="white" size="small" />) : (<><Ionicons name="paper-plane-outline" size={20} color="white" /><Text style={styles.createButtonText}>Enviar Convite</Text></>)}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 28,
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#fff',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(3, 105, 161, 0.1)',
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
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
  },
  // ✅ ESTILOS DO CARD ATUALIZADOS
  infoCard: {
    backgroundColor: 'rgba(161, 30, 10, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(161, 30, 10, 0.2)',
    borderRadius: 12,
    padding: 16,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // Espaçamento entre o título e o texto
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A11E0A',
    marginLeft: 8, // Espaçamento entre o ícone e o título
  },
  infoText: {
    fontSize: 14,
    color: '#A11E0A',
    lineHeight: 22,
  },
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
});
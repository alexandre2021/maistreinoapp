import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react-native'
import React, { useState } from 'react'
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../lib/supabase'

export default function ConfirmacaoEmail() {
  const params = useLocalSearchParams()
  const email = params.email as string
  const nomeCompleto = params.nomeCompleto as string

  const [loading, setLoading] = useState(false)

  const reenviarEmail = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        Alert.alert('Erro', 'Não foi possível reenviar o email')
      } else {
        Alert.alert('Sucesso', 'Email de confirmação reenviado!')
      }
    } catch {
      Alert.alert('Erro', 'Falha ao reenviar email')
    } finally {
      setLoading(false)
    }
  }

  const voltarParaLogin = () => {
    router.replace('/')
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Ícone de Email */}
          <View style={styles.iconContainer}>
            <Mail size={80} color="rgba(0, 122, 255, 1.00)" />
          </View>

          {/* Título */}
          <Text style={styles.title}>Confirme seu Email</Text>
          
          {/* Mensagem Principal */}
          <Text style={styles.message}>
            Enviamos um link de confirmação para:
          </Text>
          
          <Text style={styles.email}>{email}</Text>

          {/* Saudação personalizada */}
          <Text style={styles.greeting}>
            Olá, {nomeCompleto}! 👋
          </Text>

          {/* Instruções Simplificadas */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Para ativar sua conta:</Text>
            <Text style={styles.instructionsText}>
              1. Abra seu email
            </Text>
            <Text style={styles.instructionsText}>
              2. Clique no link de confirmação
            </Text>
            <Text style={styles.instructionsText}>
              3. Volte e faça login
            </Text>
          </View>

          {/* Observação Simples */}
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Confirme seu email para fazer login
            </Text>
          </View>

          {/* Botões */}
          <TouchableOpacity 
            style={[styles.resendButton, loading && styles.buttonDisabled]}
            onPress={reenviarEmail}
            disabled={loading}
          >
            <RefreshCw size={20} color="white" />
            <Text style={styles.resendButtonText}>
              {loading ? 'Reenviando...' : 'Reenviar Email'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={voltarParaLogin}
          >
            <ArrowLeft size={20} color="rgba(0, 122, 255, 1.00)" />
            <Text style={styles.loginButtonText}>
              Voltar para Login
            </Text>
          </TouchableOpacity>

          {/* Ajuda Compacta */}
          <Text style={styles.helpText}>
            Não recebeu? Verifique o spam ou tente reenviar.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 1.00)',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: 'rgba(0, 122, 255, 1.00)',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(0, 122, 255, 1.00)',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 24,
  },
  instructionsContainer: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(0, 122, 255, 1.00)',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
    lineHeight: 20,
  },
  warningContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
    width: '100%',
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 4,
  },
  warningSubText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
  resendButton: {
    backgroundColor: 'rgba(0, 122, 255, 1.00)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  resendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loginButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 1.00)',
    width: '100%',
  },
  loginButtonText: {
    color: 'rgba(0, 122, 255, 1.00)',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
})
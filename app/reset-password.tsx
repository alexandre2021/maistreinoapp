// app/reset-password.tsx
// Tela para redefinir senha após clicar no link do email

import { router } from 'expo-router'
import { CheckCircle, Eye, EyeOff } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { LogoHeader } from '../components/TitansFitnessLogo'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: ''
  })

  // Verificar se existe uma sessão válida para reset
  useEffect(() => {
    checkResetSession()
  }, [])

  const checkResetSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setIsValidSession(true)
      } else {
        // Não tem sessão válida - redirecionar para login
        Alert.alert(
          'Link inválido ou expirado',
          'O link de redefinição de senha expirou ou é inválido. Solicite um novo.',
          [
            {
              text: 'Ir para Login',
              onPress: () => router.replace('/')
            }
          ]
        )
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
      Alert.alert('Erro', 'Ocorreu um erro. Tente novamente.')
      router.replace('/')
    } finally {
      setCheckingSession(false)
    }
  }

  const validateForm = () => {
    const newErrors = {
      password: '',
      confirmPassword: ''
    }

    let isValid = true

    // Validar senha
    if (!password) {
      newErrors.password = 'Nova senha é obrigatória'
      isValid = false
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres'
      isValid = false
    }

    // Validar confirmação
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória'
      isValid = false
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const resetPassword = async () => {
    if (!validateForm()) return

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      // Sucesso - mostrar mensagem e redirecionar
      Alert.alert(
        'Senha alterada com sucesso!',
        'Sua senha foi redefinida. Agora você pode fazer login com a nova senha.',
        [
          {
            text: 'Ir para Login',
            onPress: () => {
              // Fazer logout para limpar sessão
              supabase.auth.signOut()
              router.replace('/')
            }
          }
        ]
      )

    } catch (error: any) {
      let errorMessage = 'Erro ao redefinir senha'
      
      if (error.message?.includes('Same password')) {
        errorMessage = 'A nova senha deve ser diferente da atual'
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      Alert.alert('Erro', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, text: '', color: '#ccc' }
    
    let strength = 0
    let text = ''
    let color = '#DC2626' // Vermelho

    // Critérios de força
    if (password.length >= 6) strength++
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    if (strength <= 2) {
      text = 'Fraca'
      color = '#DC2626'
    } else if (strength <= 4) {
      text = 'Média'
      color = '#F59E0B'
    } else {
      text = 'Forte'
      color = '#10B981'
    }

    return { strength, text, color }
  }

  if (checkingSession) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LogoHeader />
        <Text style={styles.loadingText}>Verificando link...</Text>
      </View>
    )
  }

  if (!isValidSession) {
    return null // Será redirecionado pelo Alert
  }

  const passwordStrength = getPasswordStrength()

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <LogoHeader />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Redefinir Senha</Text>
        <Text style={styles.subtitle}>
          Digite sua nova senha abaixo. Escolha uma senha forte para manter sua conta segura.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nova Senha *</Text>
          <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={(value) => {
                setPassword(value)
                if (errors.password) {
                  setErrors({ ...errors, password: '' })
                }
              }}
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              editable={!loading}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff size={20} color="#666" />
              ) : (
                <Eye size={20} color="#666" />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Indicador de força da senha */}
          {password && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                <View 
                  style={[
                    styles.strengthFill, 
                    { 
                      width: `${(passwordStrength.strength / 6) * 100}%`,
                      backgroundColor: passwordStrength.color
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                Força: {passwordStrength.text}
              </Text>
            </View>
          )}
          
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}

          <Text style={styles.label}>Confirmar Nova Senha *</Text>
          <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value)
                if (errors.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: '' })
                }
              }}
              secureTextEntry={!showConfirmPassword}
              returnKeyType="done"
              onSubmitEditing={resetPassword}
              editable={!loading}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color="#666" />
              ) : (
                <Eye size={20} color="#666" />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Indicador de senhas coincidentes */}
          {confirmPassword && password === confirmPassword && (
            <View style={styles.matchIndicator}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={styles.matchText}>Senhas coincidem</Text>
            </View>
          )}
          
          {errors.confirmPassword ? (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          ) : null}

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={resetPassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => {
              Alert.alert(
                'Cancelar redefinição?',
                'Você será redirecionado para a tela de login.',
                [
                  { text: 'Continuar aqui', style: 'cancel' },
                  { 
                    text: 'Cancelar', 
                    onPress: () => {
                      supabase.auth.signOut()
                      router.replace('/')
                    }
                  }
                ]
              )
            }}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        {/* Dicas de segurança */}
        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Dicas para uma senha forte:</Text>
          <Text style={styles.tipItem}>• Pelo menos 8 caracteres</Text>
          <Text style={styles.tipItem}>• Combine letras maiúsculas e minúsculas</Text>
          <Text style={styles.tipItem}>• Inclua números e símbolos</Text>
          <Text style={styles.tipItem}>• Evite informações pessoais</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  centerContent: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 22,
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 6,
    marginTop: 16,
  },
  passwordContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: '#F8FAFC',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  eyeButton: {
    padding: 16,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginBottom: 16,
    marginTop: 4,
  },
  strengthContainer: {
    marginBottom: 16,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    gap: 6,
  },
  matchText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#A11E0A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center' as const,
    padding: 12,
  },
  cancelText: {
    color: '#64748B',
    fontSize: 14,
  },
  tips: {
    marginTop: 24,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
})
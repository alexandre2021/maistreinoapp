import { router } from 'expo-router'
import { Eye, EyeOff } from 'lucide-react-native'
import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { supabase } from '../lib/supabase'

export default function CadastroPT() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nomeCompleto: '',
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nomeCompleto: '',
    termos: ''
  })
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const showToast = (message: string, type: 'success' | 'error') => {
    console.log('🍞 SHOW TOAST CHAMADO:', message, type)
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 4000)
  }

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    
    // Limpar erro quando usuário digita
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  // 🎯 VALIDAÇÃO DE EMAIL SIMPLIFICADA
  const validateEmail = async (email: string): Promise<{ isValid: boolean; message?: string }> => {
    const trimmedEmail = email.trim().toLowerCase()
    
    // 1. Validação básica de formato
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(trimmedEmail)) {
      return { isValid: false, message: 'Formato de email inválido' }
    }

    const domain = trimmedEmail.split('@')[1]

    // 2. ✅ APROVAR AUTOMATICAMENTE: Domínios confiáveis
    const trustedDomains = [
      'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 
      'icloud.com', 'live.com', 'uol.com.br', 'terra.com.br',
      'globo.com', 'ig.com.br'
    ]
    
    if (trustedDomains.includes(domain) || domain.endsWith('.edu.br') || domain.endsWith('.gov.br')) {
      return { isValid: true }
    }

    // 3. ❌ BLOQUEAR AUTOMATICAMENTE: Domínios temporários conhecidos
    const tempDomains = [
      '10minutemail.com', 'temp-mail.org', 'guerrillamail.com',
      'mailinator.com', 'yopmail.com', 'throwaway.email',
      'hosliy.com', 'forcrack.com', 'ghostly.com'
    ]
    
    if (tempDomains.includes(domain)) {
      return { isValid: false, message: 'Emails temporários não são permitidos' }
    }

    // 4. ❌ BLOQUEAR: Padrões suspeitos
    if (/^[a-z]+\d{5,}@/.test(trimmedEmail) || /^(test|temp|fake|spam)/i.test(trimmedEmail)) {
      return { isValid: false, message: 'Email com padrão suspeito detectado' }
    }

    // 5. 🔍 VERIFICAR VIA CHECK-MAIL: Domínios desconhecidos
    try {
      console.log('🔍 Verificando email via Check-Mail:', trimmedEmail)
      
      const { data: apiResponse, error } = await supabase.rpc('validate_email_with_checkmail', {
        email_to_validate: trimmedEmail
      })
      
      console.log('📡 Resposta da API:', apiResponse)
      console.log('❌ Erro da API:', error)
      
      if (error) {
        console.warn('Erro na API Check-Mail:', error)
        // Fallback: aprovar com aviso
        return { isValid: true }
      }
      
      if (apiResponse?.success && apiResponse?.data) {
        const apiData = apiResponse.data
        
        console.log('📊 Dados da API:', apiData)
        console.log('🚫 Block:', apiData.block, '| Disposable:', apiData.disposable)
        
        if (apiData.block || apiData.disposable) {
          console.log('❌ EMAIL REJEITADO pela API!')
          return { 
            isValid: false, 
            message: apiData.message || 'Email temporário detectado'
          }
        }
        
        console.log('✅ EMAIL APROVADO pela API!')
        return { isValid: true }
      }
      
      // Fallback se API não funcionou
      console.log('⚠️ API não retornou dados válidos, usando fallback')
      return { isValid: true }
      
    } catch (error) {
      console.warn('Erro na validação Check-Mail:', error)
      // Fallback: aprovar
      return { isValid: true }
    }
  }

  const validarFormulario = async () => {
    const newErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      nomeCompleto: '',
      termos: ''
    }

    let isValid = true

    // Validar nome
    if (!formData.nomeCompleto.trim()) {
      newErrors.nomeCompleto = 'Nome completo é obrigatório'
      isValid = false
    } else if (formData.nomeCompleto.trim().length < 2) {
      newErrors.nomeCompleto = 'Nome deve ter pelo menos 2 caracteres'
      isValid = false
    }

    // 📧 VALIDAR EMAIL
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
      isValid = false
    } else {
      try {
        const emailValidation = await validateEmail(formData.email.trim())
        if (!emailValidation.isValid) {
          newErrors.email = emailValidation.message || 'Email inválido'
          isValid = false
        }
      } catch (error) {
        console.error('Erro na validação de email:', error)
        // Em caso de erro, usar validação básica
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
          newErrors.email = 'Digite um email válido'
          isValid = false
        }
      }
    }

    // Validar senha
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória'
      isValid = false
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres'
      isValid = false
    }

    // Validar confirmação
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória'
      isValid = false
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem'
      isValid = false
    }

    // Validar aceite dos termos
    if (!aceitouTermos) {
      newErrors.termos = 'Você deve aceitar os termos e política de privacidade'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const cadastrarPT = async () => {
    console.log('🚀 INICIANDO CADASTRO PT')
    
    if (!(await validarFormulario())) {
      console.log('❌ VALIDAÇÃO FALHOU')
      return
    }

    setLoading(true)
    console.log('⏳ LOADING ATIVADO')

    try {
      console.log('📧 TENTANDO CRIAR USUÁRIO COM EMAIL:', formData.email.trim().toLowerCase())
      
      // PASSO 1: Criar usuário no auth.users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      })

      console.log('📊 RESPOSTA SUPABASE AUTH:')
      console.log('✅ Data:', authData)
      console.log('❌ Error:', authError)

      if (authError) {
        console.log('🚨 ERRO DETECTADO NO SUPABASE AUTH:', authError)
        console.log('🚨 ERRO MESSAGE:', authError.message)
        console.log('🚨 ERRO CODE:', authError.status)
        throw new Error(authError.message)
      }

      if (!authData.user) {
        console.log('🚨 USER NULL!')
        throw new Error('Falha ao criar usuário')
      }

      // 🎯 VERIFICAÇÃO CORRETA PARA EMAIL DUPLICADO (NOVO COMPORTAMENTO SUPABASE 2024)
      console.log('🔍 VERIFICANDO IDENTITIES:', authData.user.identities)
      console.log('📊 IDENTITIES LENGTH:', authData.user.identities?.length)
      
      if (authData.user.identities && authData.user.identities.length === 0) {
        console.log('❌ EMAIL JÁ CONFIRMADO E CADASTRADO!')
        throw new Error('Este email já possui uma conta cadastrada. Use outro email ou faça login.')
      }
      
      if (authData.user.identities && authData.user.identities.length > 0) {
        console.log('✅ USUÁRIO NOVO - IDENTITIES ARRAY TEM DADOS')
      }

      const userId = authData.user.id
      console.log('✅ USUÁRIO CRIADO COM ID:', userId)

      // PASSO 2: Inserir na tabela user_profiles
      console.log('📝 CRIANDO USER_PROFILE...')
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          user_type: 'personal_trainer'
        })

      if (profileError) {
        console.warn('⚠️ AVISO USER_PROFILE:', profileError)
      } else {
        console.log('✅ USER_PROFILE CRIADO')
      }

      // ✅ NOVO PASSO 2.5: Buscar dados do plano gratuito na tabela planos
      console.log('📋 BUSCANDO DADOS DO PLANO GRATUITO...')
      const { data: planoData, error: planoError } = await supabase
        .from('planos')
        .select('limite_alunos, limite_exercicios')
        .eq('name', 'gratuito')
        .single()

      if (planoError || !planoData) {
        console.error('❌ Erro ao buscar plano gratuito:', planoError)
        throw new Error('Erro ao configurar plano inicial')
      }

      console.log('📊 DADOS DO PLANO GRATUITO:', planoData)

      // PASSO 3: Inserir na tabela personal_trainers com dados do plano
      console.log('👨‍💼 CRIANDO PERSONAL_TRAINER COM LIMITES DO PLANO...')
      const { data: ptData, error: ptError } = await supabase
        .from('personal_trainers')
        .insert({
          id: userId,
          nome_completo: formData.nomeCompleto.trim(),
          plano: 'gratuito',
          limite_alunos: planoData.limite_alunos,        // ← DA TABELA PLANOS
          limite_exercicios: planoData.limite_exercicios, // ← DA TABELA PLANOS
          data_plano: new Date().toISOString()
        })
        .select('codigo_pt')
        .single()

      console.log('📊 RESPOSTA PERSONAL_TRAINER:')
      console.log('✅ Data:', ptData)
      console.log('❌ Error:', ptError)

      if (ptError) {
        console.log('🚨 ERRO AO CRIAR PT:', ptError)
        throw new Error(`Erro ao criar perfil PT: ${ptError.message}`)
      }
      
      const codigoPT = ptData?.codigo_pt || 'N/A'
      console.log('🏷️ CÓDIGO PT GERADO:', codigoPT)

      // PASSO 4: Fazer logout
      console.log('🚪 FAZENDO LOGOUT...')
      await supabase.auth.signOut()

      // PASSO 5: Navegar para tela de confirmação de email
      console.log('🧭 NAVEGANDO PARA CONFIRMAÇÃO...')
      router.push({
        pathname: '/confirmacao-email',
        params: {
          email: formData.email,
          nomeCompleto: formData.nomeCompleto,
          codigoPT: codigoPT,
          userId: userId
        }
      })

      // Limpar formulário
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        nomeCompleto: '',
      })

      console.log('✅ CADASTRO FINALIZADO COM SUCESSO!')

    } catch (error: any) {
      console.log('🚨 ERRO CAPTURADO NO CATCH:', error)
      console.log('🚨 TIPO DO ERRO:', typeof error)
      console.log('🚨 ERRO MESSAGE:', error.message)
      console.log('🚨 ERRO COMPLETO:', JSON.stringify(error, null, 2))
      
      let errorMessage = 'Erro desconhecido'
      
      if (error.message?.includes('already registered') || 
          error.message?.includes('already been registered') ||
          error.message?.includes('User already registered')) {
        errorMessage = 'Este email já possui uma conta cadastrada. Use outro email ou faça login.'
        console.log('📧 ERRO DE EMAIL DUPLICADO DETECTADO!')
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Email inválido. Verifique o formato do email.'
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres.'
      } else if (error.message?.includes('duplicate key')) {
        errorMessage = 'Este email já está sendo usado. Escolha outro email.'
      } else if (error.message?.includes('permission denied')) {
        errorMessage = 'Erro de permissão. Entre em contato com o suporte.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      console.log('📱 EXIBINDO TOAST COM MENSAGEM:', errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      console.log('🏁 FINALIZANDO - DESATIVANDO LOADING')
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/tipo-conta')}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Cadastro Personal Trainer</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput
              style={[styles.input, errors.nomeCompleto && styles.inputError]}
              placeholder="Digite seu nome completo"
              value={formData.nomeCompleto}
              onChangeText={(value) => updateField('nomeCompleto', value)}
              autoCapitalize="words"
              returnKeyType="next"
              editable={!loading}
            />
            {errors.nomeCompleto ? (
              <Text style={styles.errorText}>{errors.nomeCompleto}</Text>
            ) : null}

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Digite seu email"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              autoComplete="email"
              editable={!loading}
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}

            <Text style={styles.label}>Senha *</Text>
            <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry={!showPassword}
                returnKeyType="next"
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
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}

            <Text style={styles.label}>Confirmar Senha *</Text>
            <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Digite a senha novamente"
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                returnKeyType="done"
                onSubmitEditing={cadastrarPT}
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
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}

            {/* Termos e Condições */}
            <View style={styles.termosContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => {
                  setAceitouTermos(!aceitouTermos)
                  if (errors.termos) {
                    setErrors({ ...errors, termos: '' })
                  }
                }}
              >
                <View style={[styles.checkbox, aceitouTermos && styles.checkboxChecked]}>
                  {aceitouTermos && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.termosTextContainer}>
                  <Text style={styles.termosText}>
                    Eu aceito os{' '}
                    <Text 
                      style={styles.linkText}
                      onPress={() => router.push('/termos-uso')}
                    >
                      Termos de Uso
                    </Text>
                    {' '}e a{' '}
                    <Text 
                      style={styles.linkText}
                      onPress={() => router.push('/politica-privacidade')}
                    >
                      Política de Privacidade
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>
              {errors.termos ? (
                <Text style={styles.errorText}>{errors.termos}</Text>
              ) : null}
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={cadastrarPT}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Criando conta...' : 'Cadastrar Personal Trainer'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => router.push('/')}
              disabled={loading}
            >
              <Text style={styles.loginText}>
                Já tem conta? Fazer login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Toast de Notificação */}
          {toastVisible && (
            <View style={[styles.toast, toastType === 'success' ? styles.toastSuccess : styles.toastError]}>
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 32,
    color: '#1a1a1a',
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 4,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#64748B',
  },
  button: {
    backgroundColor: '#A11E0A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  loginButton: {
    alignItems: 'center',
    padding: 12,
  },
  loginText: {
    color: '#64748B',
    fontSize: 14,
  },
  toast: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999,
  },
  toastSuccess: {
    backgroundColor: 'rgba(0, 122, 255, 1.00)',
  },
  toastError: {
    backgroundColor: '#DC2626',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  termosContainer: {
    marginTop: 20,
    marginBottom: 24,
    width: '100%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: 'rgba(0, 122, 255, 1.00)',
    borderColor: 'rgba(0, 122, 255, 1.00)',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termosTextContainer: {
    flex: 1,
  },
  termosText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  linkText: {
    color: 'rgba(0, 122, 255, 1.00)',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
})
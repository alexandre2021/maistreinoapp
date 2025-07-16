import { router } from 'expo-router'
import { Eye, EyeOff, X } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Animated, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { LogoSplash } from '../components/TitansFitnessLogo'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isCheckingSession, setIsCheckingSession] = useState(true) // ✅ NOVO: Loading inicial
  
  // Estados para o toast
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' })
  const [toastAnimation] = useState(new Animated.Value(0))

  // ✅ NOVO: Proteção reversa - se já logado, redireciona
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log('🔍 [LOGIN] Verificando sessão existente...');
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('✅ [LOGIN] Usuário já logado - redirecionando...');
          
          // Verificar tipo de usuário e redirecionar
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single()

          if (profile?.user_type === 'personal_trainer') {
            router.replace('/(tabs)/index-pt' as any); // ✅ CORREÇÃO: Casting explícito
          } else if (profile?.user_type === 'aluno') {
            router.replace('/(tabs)/index-aluno' as any); // ✅ CORREÇÃO: Casting explícito
          } else {
            // Sem tipo definido, vai para seleção
            router.replace('/tipo-conta' as any); // ✅ CORREÇÃO: Casting explícito
          }
        } else {
          console.log('🚫 [LOGIN] Nenhuma sessão encontrada - mostrando login');
        }
      } catch (error) {
        console.error('❌ [LOGIN] Erro ao verificar sessão:', error);
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkExistingSession()
  }, [])

  // ✅ NOVO: Escutar mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 [LOGIN] Mudança de auth:', event, session ? 'LOGADO' : 'DESLOGADO');
      
      if (event === 'SIGNED_IN' && session) {
        // Login realizado com sucesso - será redirecionado pela função signIn
      } else if (event === 'SIGNED_OUT') {
        // Logout - já está na página correta
        console.log('✅ [LOGIN] Logout detectado - permanecendo na página de login');
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Função para mostrar toast
  const showToast = (message: string, type = 'error') => {
    setToast({ visible: true, message, type })
    
    Animated.sequence([
      Animated.timing(toastAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(4000),
      Animated.timing(toastAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast({ visible: false, message: '', type: 'error' })
    })
  }

  // Função para fechar toast manualmente
  const hideToast = () => {
    Animated.timing(toastAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setToast({ visible: false, message: '', type: 'error' })
    })
  }

  const validateEmail = (value: string) => {
    setEmail(value)
    if (!value.trim()) {
      setEmailError('Email é obrigatório')
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      setEmailError('Email inválido')
    } else {
      setEmailError('')
    }
  }

  const validatePassword = (value: string) => {
    setPassword(value)
    if (!value.trim()) {
      setPasswordError('Senha é obrigatória')
    } else {
      setPasswordError('')
    }
  }

  // Função para traduzir erros do Supabase para mensagens amigáveis
  const getErrorMessage = (error: any) => {
    if (!error?.message) return 'Erro desconhecido'
    
    const message = error.message.toLowerCase()
    
    if (message.includes('invalid login credentials') || 
        message.includes('invalid credentials') ||
        message.includes('email not confirmed')) {
      return 'Email ou senha incorretos. Verifique seus dados e tente novamente.'
    }
    
    if (message.includes('email not found') || 
        message.includes('user not found')) {
      return 'Email não cadastrado. Verifique o email ou cadastre-se primeiro.'
    }
    
    if (message.includes('too many requests')) {
      return 'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.'
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Problema de conexão. Verifique sua internet e tente novamente.'
    }
    
    if (message.includes('rate limit')) {
      return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
    }
    
    // Retorna a mensagem original se não encontrar um padrão conhecido
    return `Erro no login: ${error.message}`
  }

  const signIn = async () => {
    // Validar campos antes de enviar
    let hasError = false

    if (!email.trim()) {
      setEmailError('Email é obrigatório')
      hasError = true
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email inválido')
      hasError = true
    }

    if (!password.trim()) {
      setPasswordError('Senha é obrigatória')
      hasError = true
    }

    if (hasError) {
      return
    }

    setLoading(true)
    
    try {
      console.log('🔐 [LOGIN] Tentando fazer login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        console.error('❌ [LOGIN] Erro de login:', error)
        showToast(getErrorMessage(error), 'error')
        setLoading(false)
        return
      }

      // Verificar tipo de usuário
      if (data.user) {
        console.log('✅ [LOGIN] Login realizado com sucesso - verificando tipo de usuário...');
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_type')
          .eq('id', data.user.id)
          .single()

        if (profileError || !profile) {
          // Primeiro login - ir para seleção de tipo
          console.log('🆕 [LOGIN] Primeiro login - indo para seleção de tipo');
          router.replace('/tipo-conta' as any); // ✅ CORREÇÃO: Casting explícito
        } else {
          // Usuário já tem tipo definido - verificar onboarding e ir para dashboard específico
          if (profile.user_type === 'personal_trainer') {
            // Verificar se o personal trainer completou o onboarding
            const { data: ptData, error: ptError } = await supabase
              .from('personal_trainers')
              .select('onboarding_completo')
              .eq('id', data.user.id)
              .single()

            if (ptError) {
              console.error('❌ [LOGIN] Erro ao buscar dados do personal trainer:', ptError)
              showToast('Erro ao carregar dados do usuário. Tente novamente.', 'error')
              setLoading(false)
              return
            }

            if (!ptData || !ptData.onboarding_completo) {
              // Onboarding não completo - direcionar para onboarding
              console.log('📝 [LOGIN] PT sem onboarding - indo para onboarding');
              router.replace('/onboarding-pt' as any); // ✅ CORREÇÃO: Casting explícito
            } else {
              // ✅ PT completo - vai para dashboard
              console.log('🏠 [LOGIN] PT completo - indo para dashboard');
              router.replace('/(tabs)/index-pt' as any); // ✅ CORREÇÃO: Casting explícito
            }
          } else if (profile.user_type === 'aluno') {
            // Verificar se o aluno completou o onboarding
            const { data: alunoData, error: alunoError } = await supabase
              .from('alunos')
              .select('onboarding_completo')
              .eq('id', data.user.id)
              .single()

            if (alunoError) {
              console.error('❌ [LOGIN] Erro ao buscar dados do aluno:', alunoError)
              showToast('Erro ao carregar dados do usuário. Tente novamente.', 'error')
              setLoading(false)
              return
            }

            if (!alunoData || !alunoData.onboarding_completo) {
              // Onboarding não completo - direcionar para onboarding do aluno
              console.log('📝 [LOGIN] Aluno sem onboarding - indo para onboarding');
              router.replace('/onboarding-aluno' as any); // ✅ CORREÇÃO: Casting explícito
            } else {
              // ✅ Aluno completo - vai para dashboard
              console.log('🏠 [LOGIN] Aluno completo - indo para dashboard');
              router.replace('/(tabs)/index-aluno' as any); // ✅ CORREÇÃO: Casting explícito
            }
          } else if (profile.user_type === 'admin') {
            // ✅ Admin vai para área padrão
            console.log('👑 [LOGIN] Admin - indo para área administrativa');
            router.replace('/(tabs)/' as any); // ✅ CORREÇÃO: Casting explícito
          }
        }
      }
    } catch (error) {
      console.error('💥 [LOGIN] Erro inesperado no login:', error)
      showToast('Ocorreu um erro inesperado. Verifique sua conexão e tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    if (!email.trim()) {
      setEmailError('Digite seu email primeiro')
      return
    }

    if (emailError) {
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
      
      if (error) {
        console.error('❌ [LOGIN] Erro ao resetar senha:', error)
        
        if (error.message.includes('Too many requests') || 
            error.message.includes('rate limit')) {
          showToast('Aguarde alguns minutos antes de tentar enviar outro email de recuperação.', 'error')
        } else if (error.message.includes('User not found')) {
          showToast('Este email não está cadastrado em nossa plataforma. Verifique o email ou cadastre-se primeiro.', 'error')
        } else {
          showToast(getErrorMessage(error), 'error')
        }
      } else {
        showToast(`Um link de recuperação foi enviado para ${email}. Verifique sua caixa de entrada e spam.`, 'success')
      }
    } catch (error) {
      console.error('💥 [LOGIN] Erro inesperado ao resetar senha:', error)
      showToast('Erro ao enviar email de recuperação. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ✅ NOVO: Mostrar loading enquanto verifica sessão
  if (isCheckingSession) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, styles.centered]}>
          <LogoSplash />
          <Text style={styles.loadingText}>Verificando login...</Text>
        </View>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <LogoSplash />
          </View>
          <Text style={styles.subtitle}>Faça login para continuar</Text>
          
          <View style={styles.form}>
            <TextInput
              style={[
                styles.input,
                emailError ? styles.inputError : null
              ]}
              placeholder="Email"
              value={email}
              onChangeText={validateEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
              autoCorrect={false}
            />
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
            
            <View style={[
              styles.passwordContainer,
              passwordError ? styles.inputError : null
            ]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Senha"
                value={password}
                onChangeText={validatePassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                autoCorrect={false}
                autoCapitalize="none"
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
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={signIn}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.forgotButton}
              onPress={resetPassword}
              disabled={loading}
            >
              <Text style={styles.forgotText}>
                {loading ? 'Enviando...' : 'Esqueci minha senha'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity 
              style={styles.signupButton}
              onPress={() => router.push('/tipo-conta' as any)} // ✅ CORREÇÃO: Casting explícito
              disabled={loading}
            >
              <Text style={styles.signupText}>Não tem conta? Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Toast Component */}
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
            <TouchableOpacity onPress={hideToast} style={styles.toastCloseButton}>
              <X size={18} color="white" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    marginBottom: 16,
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
  button: {
    backgroundColor: '#A11E0A', // ✅ ATUALIZADO: Mesma cor do gradiente do ícone
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  forgotButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  forgotText: {
    color: '#FF8C42', // ✅ NOVO: Cor laranja clara do logo
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#64748B',
    fontSize: 14,
  },
  signupButton: {
    alignItems: 'center',
    padding: 12,
  },
  signupText: {
    color: '#64748B',
    fontSize: 14,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
  },
  
  // Toast Styles
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
  },
  toastError: {
    backgroundColor: '#EF4444',
  },
  toastSuccess: {
    backgroundColor: '#10B981',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  toastCloseButton: {
    padding: 4,
  },
})
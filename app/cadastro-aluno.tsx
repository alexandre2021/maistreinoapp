import { router } from 'expo-router'
import { Eye, EyeOff } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { supabase } from '../lib/supabase'

// ✅ FUNÇÃO PARA GERAR AVATAR LETTER
const generateAvatarLetter = (nomeCompleto: string, email: string): string => {
  const nome = nomeCompleto?.trim();
  
  if (!nome) {
    return email?.charAt(0)?.toUpperCase() || 'A';
  }
  
  const palavras = nome.split(' ').filter(p => p.length > 0);
  const primeiraLetra = palavras[0].charAt(0).toUpperCase();
  
  if (palavras.length >= 2) {
    const ultimaLetra = palavras[palavras.length - 1].charAt(0).toUpperCase();
    return primeiraLetra + ultimaLetra;  // João Silva = "JS"
  } else {
    const nomeUnico = palavras[0];
    const segundaLetra = nomeUnico.length > 1 
      ? nomeUnico.charAt(1).toUpperCase() 
      : 'L';
    return primeiraLetra + segundaLetra;  // João = "JO"
  }
};

export default function CadastroAluno() {
  const [formData, setFormData] = useState({
    codigoPT: '',
    nomeCompleto: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [loadingPT, setLoadingPT] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [ptInfo, setPtInfo] = useState<{ nome: string; id: string } | null>(null)
  const [errors, setErrors] = useState({
    codigoPT: '',
    nomeCompleto: '',
    email: '',
    password: '',
    confirmPassword: '',
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
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Buscar Personal Trainer quando código for digitado
  useEffect(() => {
    const buscarPT = async () => {
      if (formData.codigoPT.length >= 5) {
        setLoadingPT(true)
        try {
          const { data, error } = await supabase
            .from('personal_trainers')
            .select('id, nome_completo')
            .eq('codigo_pt', formData.codigoPT.toUpperCase())
            .single()

          if (error || !data) {
            setPtInfo(null)
            setErrors(prev => ({ ...prev, codigoPT: 'Código PT não encontrado' }))
          } else {
            setPtInfo({ nome: data.nome_completo, id: data.id })
            setErrors(prev => ({ ...prev, codigoPT: '' }))
          }
        } catch (error) {
          console.error('Erro ao buscar PT:', error)
          setPtInfo(null)
          setErrors(prev => ({ ...prev, codigoPT: 'Erro ao buscar Personal Trainer' }))
        } finally {
          setLoadingPT(false)
        }
      } else {
        setPtInfo(null)
      }
    }

    const timer = setTimeout(buscarPT, 500)
    return () => clearTimeout(timer)
  }, [formData.codigoPT])

  const validarFormulario = () => {
    const newErrors = {
      codigoPT: '',
      nomeCompleto: '',
      email: '',
      password: '',
      confirmPassword: '',
    }

    let isValid = true

    // Validar código PT
    if (!formData.codigoPT.trim()) {
      newErrors.codigoPT = 'Código do Personal Trainer é obrigatório'
      isValid = false
    } else if (!ptInfo) {
      newErrors.codigoPT = 'Código PT inválido ou não encontrado'
      isValid = false
    }

    // Validar nome
    if (!formData.nomeCompleto.trim()) {
      newErrors.nomeCompleto = 'Nome completo é obrigatório'
      isValid = false
    } else if (formData.nomeCompleto.trim().length < 2) {
      newErrors.nomeCompleto = 'Nome deve ter pelo menos 2 caracteres'
      isValid = false
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
      isValid = false
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Digite um email válido'
        isValid = false
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

    setErrors(newErrors)
    return isValid
  }

  const cadastrarAluno = async () => {
    console.log('🚀 INICIANDO CADASTRO ALUNO')
    
    if (!validarFormulario()) {
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

      console.log('📝 CRIANDO USER_PROFILE...')
      // PASSO 2: Criar perfil de usuário
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          user_type: 'aluno'
        })

      if (profileError) {
        console.warn('⚠️ AVISO USER_PROFILE:', profileError)
      } else {
        console.log('✅ USER_PROFILE CRIADO')
      }

      console.log('👨‍🎓 CRIANDO ALUNO COM AVATAR...')

      // ✅ GERAR AVATAR LETTER BASEADO NO NOME DO CADASTRO
      const avatarLetter = generateAvatarLetter(formData.nomeCompleto.trim(), formData.email.trim())
      console.log('🎨 Avatar letter gerado no cadastro:', avatarLetter, 'para:', formData.nomeCompleto.trim())

      // PASSO 3: Criar perfil de aluno COM AVATAR
      const { error: alunoError } = await supabase
        .from('alunos')
        .insert({
          id: userId,
          nome_completo: formData.nomeCompleto.trim(),
          email: formData.email.trim().toLowerCase(),
          personal_trainer_id: ptInfo!.id,
          onboarding_completo: false,
          // ✅ NOVOS CAMPOS DE AVATAR (baseado no nome do cadastro)
          avatar_letter: avatarLetter,
          avatar_color: '#3B82F6', // Azul padrão para alunos
          avatar_type: 'letter',
          avatar_image_url: null,
        })

      console.log('📊 RESPOSTA ALUNO:')
      console.log('❌ Error:', alunoError)

      if (alunoError) {
        console.log('🚨 ERRO AO CRIAR ALUNO:', alunoError)
        throw new Error(`Erro ao criar perfil de aluno: ${alunoError.message}`)
      }

      console.log('✅ ALUNO CRIADO COM AVATAR:', avatarLetter)

      console.log('🚪 FAZENDO LOGOUT...')
      // PASSO 4: Fazer logout para forçar confirmação de email
      await supabase.auth.signOut()

      console.log('🧭 NAVEGANDO PARA CONFIRMAÇÃO...')
      // PASSO 5: Navegar para tela de confirmação
      router.push({
        pathname: '/confirmacao-email',
        params: {
          email: formData.email.trim().toLowerCase(),
          nomeCompleto: formData.nomeCompleto.trim(),
        }
      })

      // Limpar formulário
      setFormData({
        codigoPT: '',
        nomeCompleto: '',
        email: '',
        password: '',
        confirmPassword: '',
      })
      setPtInfo(null)

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
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Cadastro de Aluno</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Código do Personal Trainer *</Text>
          <TextInput
            style={[
              styles.input, 
              errors.codigoPT && styles.inputError
            ]}
            placeholder="Digite o código do seu PT"
            value={formData.codigoPT}
            onChangeText={(value) => updateField('codigoPT', value.toUpperCase())}
            autoCapitalize="characters"
            returnKeyType="next"
            editable={!loading}
          />
          {loadingPT && (
            <Text style={styles.loadingText}>Buscando Personal Trainer...</Text>
          )}
          {ptInfo && (
            <View style={styles.ptInfo}>
              <Text style={styles.ptInfoText}>✓ Personal Trainer: {ptInfo.nome}</Text>
            </View>
          )}
          {errors.codigoPT ? (
            <Text style={styles.errorText}>{errors.codigoPT}</Text>
          ) : null}

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
              onSubmitEditing={cadastrarAluno}
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

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={cadastrarAluno}
            disabled={loading || !ptInfo}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Criando conta...' : 'Cadastrar Aluno'}
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
    marginBottom: 16,
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
  loadingText: {
    color: '#007AFF',
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  ptInfo: {
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  ptInfoText: {
    color: '#15803D',
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: '#007AFF',
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
})
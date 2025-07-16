import { router } from 'expo-router'
import { Eye, EyeOff } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { supabase } from '../lib/supabase'

/*
  ═══════════════════════════════════════════════════════════════════════════════════════
  📋 PROCESSO DE CADASTRO DE ALUNO COM EDGE FUNCTION (SEM EMAIL)
  ═══════════════════════════════════════════════════════════════════════════════════════
  
  🎯 OBJETIVO:
  - Personal Trainers precisam verificar email manualmente (maior segurança)
  - Alunos criados SEM ENVIO DE EMAIL via Edge Function (melhor UX)
  
  📊 FLUXO SIMPLIFICADO:
  1. Aluno informa código PT (obrigatório - todo aluno deve ter um PT)
  2. Validação do código PT em tempo real
  3. 🔑 CHAMADA DA EDGE FUNCTION handle-auth (modo create_aluno)
  4. Edge Function cria usuário JÁ CONFIRMADO via Admin API
  5. Edge Function cria user_profile + aluno + avatar
  6. Toast de sucesso + Redirecionamento para login
  
  🛡️ VANTAGENS DA EDGE FUNCTION:
  - ✅ Zero emails enviados para alunos
  - ✅ Usuário criado já confirmado (Admin API)
  - ✅ Processo completo em uma única chamada
  - ✅ Rollback automático em caso de erro
  - ✅ Controle total do processo
  
  🔧 EDGE FUNCTION handle-auth (modo create_aluno):
  - Recebe: email, password, nomeCompleto, personalTrainerId
  - Cria usuário via Admin API (já confirmado)
  - Cria user_profile, aluno e avatar
  - Retorna: sucesso + dados do usuário criado
  
  ═══════════════════════════════════════════════════════════════════════════════════════
*/

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
    console.log('🚀 INICIANDO CADASTRO ALUNO COM EDGE FUNCTION (SEM EMAIL)')
    
    if (!validarFormulario()) {
      console.log('❌ VALIDAÇÃO FALHOU')
      return
    }

    setLoading(true)
    console.log('⏳ LOADING ATIVADO')

    try {
      console.log('🔑 CHAMANDO EDGE FUNCTION handle-auth (modo create_aluno)')
      console.log('📧 Email:', formData.email.trim().toLowerCase())
      console.log('👤 Nome:', formData.nomeCompleto.trim())
      console.log('🏋️ PT ID:', ptInfo!.id)
      
      // ═══════════════════════════════════════════════════════════════════════════
      // PASSO ÚNICO: CHAMAR EDGE FUNCTION PARA CRIAR ALUNO (SEM EMAIL)
      // ═══════════════════════════════════════════════════════════════════════════
      /*
        🔑 A Edge Function handle-auth (modo create_aluno) fará TUDO:
        
        1. ✅ Criar usuário via Admin API (JÁ CONFIRMADO)
        2. ✅ Criar user_profile (user_type = aluno)
        3. ✅ Criar registro do aluno com avatar
        4. ✅ Rollback automático se algo falhar
        5. ✅ ZERO emails enviados!
        
        Por que Edge Function é melhor que trigger?
        - Controle total do processo
        - Rollback robusto
        - Zero emails enviados
        - Processo atômico em uma chamada
      */
      
      const { data: result, error: functionError } = await supabase.functions.invoke('handle-auth', {
        body: {
          mode: 'create_aluno',                           // 🆕 Novo modo
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          nomeCompleto: formData.nomeCompleto.trim(),
          personalTrainerId: ptInfo!.id
        }
      });

      console.log('📊 RESPOSTA EDGE FUNCTION:')
      console.log('✅ Data:', result)
      console.log('❌ Error:', functionError)

      // Verificar se Edge Function falhou na chamada
      if (functionError) {
        console.error('🚨 ERRO NA CHAMADA DA EDGE FUNCTION:', functionError)
        throw new Error(`Erro na criação da conta: ${functionError.message}`)
      }

      // Verificar se Edge Function retornou erro
      if (!result?.success) {
        console.error('🚨 EDGE FUNCTION RETORNOU ERRO:', result)
        const errorMsg = result?.error || 'Falha na criação da conta'
        throw new Error(errorMsg)
      }

      console.log('✅ USUÁRIO CRIADO COM SUCESSO VIA EDGE FUNCTION!')
      console.log('🆔 User ID:', result.userId)
      console.log('🎨 Avatar:', result.avatarLetter)
      console.log('📧 Email confirmado automaticamente:', result.email)
      console.log('🎉 ZERO EMAILS ENVIADOS!')

      // ═══════════════════════════════════════════════════════════════════════════
      // PASSO FINAL: SUCESSO E REDIRECIONAMENTO
      // ═══════════════════════════════════════════════════════════════════════════
      /*
        🎯 PROCESSO COMPLETO EM UMA CHAMADA!
        
        A Edge Function já fez tudo:
        1. ✅ Usuário criado e confirmado
        2. ✅ Perfis criados (user_profile + aluno)
        3. ✅ Avatar gerado automaticamente
        4. ✅ Aluno pode fazer login imediatamente
        5. ✅ NENHUM EMAIL FOI ENVIADO!
      */

      console.log('🎉 CADASTRO FINALIZADO COM EDGE FUNCTION - MOSTRANDO TOAST...')
      showToast('✅ Conta criada com sucesso! Faça login para acessar.', 'success')

      // Limpar formulário
      setFormData({
        codigoPT: '',
        nomeCompleto: '',
        email: '',
        password: '',
        confirmPassword: '',
      })
      setPtInfo(null)

      // Aguardar 2 segundos para mostrar o toast e redirecionar
      setTimeout(() => {
        console.log('🧭 REDIRECIONANDO PARA LOGIN...')
        router.replace('/')
      }, 3000)

      console.log('✅ PROCESSO COMPLETO COM EDGE FUNCTION - AGUARDANDO REDIRECIONAMENTO...')

    } catch (error: any) {
      console.log('🚨 ERRO CAPTURADO NO CATCH:', error)
      console.log('🚨 ERRO MESSAGE:', error.message)
      
      /*
        📋 TRATAMENTO DE ERROS COM EDGE FUNCTION:
        
        Se chegamos aqui, algo deu errado na Edge Function.
        Possíveis cenários:
        1. Erro na chamada da Edge Function (rede, timeout)
        2. Erro retornado pela Edge Function (email duplicado, etc.)
        3. Edge Function fez rollback automático
        
        A vantagem é que a Edge Function já cuidou do rollback,
        então não temos usuários "órfãos" no banco.
      */
      
      let errorMessage = 'Erro desconhecido'
      
      if (error.message?.includes('já possui uma conta cadastrada') ||
          error.message?.includes('already registered') || 
          error.message?.includes('already exists')) {
        errorMessage = 'Este email já possui uma conta cadastrada. Use outro email ou faça login.'
        console.log('📧 ERRO DE EMAIL DUPLICADO DETECTADO!')
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Email inválido. Verifique o formato do email.'
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres.'
      } else if (error.message?.includes('permission denied')) {
        errorMessage = 'Erro de permissão. Entre em contato com o suporte.'
      } else if (error.message?.includes('Dados obrigatórios')) {
        errorMessage = 'Erro nos dados enviados. Tente novamente.'
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')}> 
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Cadastro de Aluno</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Código do Personal Trainer *</Text>
            <TextInput
              style={[styles.input, errors.codigoPT && styles.inputError]}
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
    color: '#A11E0A',
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
})
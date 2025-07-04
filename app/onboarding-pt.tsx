import { router } from 'expo-router'
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import {
    ANOS_EXPERIENCIA_PT,
    ESPECIALIZACOES_PT,
    formatarTelefone,
    GENEROS,
    VALIDACOES
} from '../constants/usuarios'
import { supabase } from '../lib/supabase'

/**
 * VALIDAÇÃO SIMPLIFICADA - SEM TRIGGER!
 * 
 * Agora fazemos toda a validação direto no código:
 * - Validação dos campos obrigatórios aqui mesmo
 * - Definimos manualmente onboarding_completo = true
 * - Muito mais claro e previsível!
 * 
 * Campos obrigatórios para finalizar:
 * - nome_completo
 * - genero
 * - data_nascimento
 * - anos_experiencia
 * - bio (mínimo 50 caracteres)
 */

interface OnboardingData {
  nomeCompleto: string
  genero: string
  dataNascimento: string
  telefone: string
  telefonePublico: boolean
  cref: string
  anosExperiencia: string
  especializacoes: string[]
  bio: string
  instagram: string
  facebook: string
  linkedin: string
  website: string
}

export default function OnboardingPT() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showGeneroOptions, setShowGeneroOptions] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showExperienciaOptions, setShowExperienciaOptions] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const [selectedDay, setSelectedDay] = useState(1)
  const [selectedMonth, setSelectedMonth] = useState(0)
  const [selectedYear, setSelectedYear] = useState(() => {
    const currentDate = new Date()
    return currentDate.getFullYear() - 25
  })
  const [data, setData] = useState<OnboardingData>({
    nomeCompleto: '',
    genero: '',
    dataNascimento: '',
    telefone: '',
    telefonePublico: false,
    cref: '',
    anosExperiencia: '',
    especializacoes: [],
    bio: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    website: ''
  })

  const totalSteps = 3

  // Função para gerar avatar letter
  const generateAvatarLetter = (nomeCompleto: string, email: string): string => {
    const nome = nomeCompleto?.trim();
    
    if (!nome) {
      // Se não tem nome, usar primeira letra do email
      return email?.charAt(0)?.toUpperCase() || 'PT';
    }
    
    const palavras = nome.split(' ').filter(p => p.length > 0);
    const primeiraLetra = palavras[0].charAt(0).toUpperCase();
    
    if (palavras.length >= 2) {
      // Nome completo: primeira do primeiro + primeira do último
      // "Carlos Eduardo Silva" → "CS"
      const ultimaLetra = palavras[palavras.length - 1].charAt(0).toUpperCase();
      return primeiraLetra + ultimaLetra;
    } else {
      // Só um nome: primeira + segunda letra do mesmo nome
      // "Carlos" → "CA", "Ana" → "AN"
      const nomeUnico = palavras[0];
      const segundaLetra = nomeUnico.length > 1 
        ? nomeUnico.charAt(1).toUpperCase() 
        : 'A'; // Fallback elegante
      return primeiraLetra + segundaLetra;
    }
  };

  // NOVA FUNÇÃO: Validar se onboarding pode ser finalizado
  const canCompleteOnboarding = (): boolean => {
    return !!(
      data.nomeCompleto &&
      data.genero &&
      data.dataNascimento &&
      data.anosExperiencia &&
      data.bio &&
      data.bio.length >= VALIDACOES.bioMinLength
    )
  }

  // Obter usuário logado
  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setUserEmail(user.email || '')
        return { id: user.id, email: user.email }
      } else {
        router.replace('/')
        return null
      }
    } catch (error) {
      console.error('Erro ao obter usuário:', error)
      router.replace('/')
      return null
    }
  }

  const loadExistingData = async (currentUserId: string) => {
    try {
      const { data: ptData, error } = await supabase
        .from('personal_trainers')
        .select('*')
        .eq('id', currentUserId)
        .single()

      if (ptData && !error) {
        setData({
          nomeCompleto: ptData.nome_completo || '',
          genero: ptData.genero || '',
          dataNascimento: ptData.data_nascimento || '',
          telefone: ptData.telefone || '',
          telefonePublico: ptData.telefone_publico || false,
          cref: ptData.cref || '',
          anosExperiencia: ptData.anos_experiencia || '',
          especializacoes: ptData.especializacoes || [],
          bio: ptData.bio || '',
          instagram: ptData.instagram || '',
          facebook: ptData.facebook || '',
          linkedin: ptData.linkedin || '',
          website: ptData.website || ''
        })

        if (ptData.onboarding_completo) {
          router.replace('/(tabs)/index-pt' as never)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  useEffect(() => {
    const initializeUser = async () => {
      const user = await getCurrentUser()
      if (user) {
        await loadExistingData(user.id)
      }
    }
    
    initializeUser()
  }, [])

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData({ ...data, [field]: value })
  }

  const formatDate = (day: number, month: number, year: number) => {
    return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`
  }

  const getCurrentDate = () => {
    const now = new Date()
    return {
      day: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear()
    }
  }

  const toggleEspecializacao = (spec: string) => {
    const newSpecs = data.especializacoes.includes(spec)
      ? data.especializacoes.filter(s => s !== spec)
      : [...data.especializacoes, spec]
    updateData('especializacoes', newSpecs)
  }

  const validateStep = (step: number): {isValid: boolean, errors: {[key: string]: string}} => {
    const errors: {[key: string]: string} = {}
    
    switch (step) {
      case 1:
        if (!data.nomeCompleto) errors.nomeCompleto = 'Nome completo é obrigatório'
        if (!data.genero) errors.genero = 'Gênero é obrigatório'
        if (!data.dataNascimento) errors.dataNascimento = 'Data de nascimento é obrigatória'
        break
      case 2:
        if (!data.anosExperiencia) errors.anosExperiencia = 'Anos de experiência é obrigatório'
        if (data.especializacoes.length === 0) errors.especializacoes = 'Selecione pelo menos uma especialização'
        if (!data.bio) errors.bio = 'Bio é obrigatória'
        if (data.bio && data.bio.length < VALIDACOES.bioMinLength) errors.bio = `Bio deve ter pelo menos ${VALIDACOES.bioMinLength} caracteres`
        break
      case 3:
        // Redes sociais são opcionais
        break
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  const nextStep = () => {
    const validation = validateStep(currentStep)
    
    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      return
    }
    
    setFieldErrors({})
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      finalizarOnboarding()
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const finalizarOnboarding = async () => {
    if (!userId || !userEmail) {
      Alert.alert('Erro', 'Usuário não encontrado. Faça login novamente.')
      router.replace('/')
      return
    }

    // Verificar se pode finalizar o onboarding
    if (!canCompleteOnboarding()) {
      Alert.alert(
        'Campos obrigatórios', 
        `Preencha todos os campos obrigatórios antes de finalizar:\n\n• Nome completo\n• Gênero\n• Data de nascimento\n• Anos de experiência\n• Bio (mínimo ${VALIDACOES.bioMinLength} caracteres)`
      )
      return
    }

    setLoading(true)
    try {
      // Gerar avatar letter baseado no nome completo e email
      const avatarLetter = generateAvatarLetter(data.nomeCompleto, userEmail)
      
      console.log('Avatar letter gerado:', avatarLetter, 'para:', data.nomeCompleto)

      // VALIDAÇÃO SIMPLES - definimos onboarding_completo diretamente!
      const updateData = {
        nome_completo: data.nomeCompleto,
        genero: data.genero,
        data_nascimento: data.dataNascimento,
        telefone: data.telefone,
        telefone_publico: data.telefonePublico,
        cref: data.cref,
        anos_experiencia: data.anosExperiencia,
        especializacoes: data.especializacoes,
        bio: data.bio,
        instagram: data.instagram,
        facebook: data.facebook,
        linkedin: data.linkedin,
        website: data.website,
        // Campos de avatar
        avatar_letter: avatarLetter,
        avatar_color: '#3B82F6', // Cor padrão azul
        avatar_type: 'letter',
        avatar_image_url: null, // Inicialmente sem imagem
        // DEFINIMOS DIRETAMENTE - sem trigger!
        onboarding_completo: true
      }

      // Atualização simples e direta
      const { error, data: result } = await supabase
        .from('personal_trainers')
        .update(updateData)
        .eq('id', userId)
        .select()

      if (error) {
        console.error('Erro na atualização:', error)
        throw error
      }

      if (!result || result.length === 0) {
        throw new Error('Nenhum registro foi atualizado')
      }

      console.log('Dados salvos com sucesso:', result[0])
      console.log('Onboarding finalizado! Avatar:', avatarLetter)

      // Redirecionar diretamente - sem verificações complexas
      router.replace('/(tabs)/index-pt' as never)

    } catch (error) {
      console.error('Erro ao finalizar onboarding:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      Alert.alert(
        'Erro', 
        `Não foi possível finalizar a configuração: ${errorMessage}. Tente novamente.`
      )
    } finally {
      setLoading(false)
    }
  }

  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Informações Básicas</Text>
      
      <Text style={styles.label}>Nome Completo *</Text>
      <TextInput
        style={[
          styles.input,
          fieldErrors.nomeCompleto && styles.inputError
        ]}
        value={data.nomeCompleto}
        onChangeText={(value) => updateData('nomeCompleto', value)}
        placeholder="Digite seu nome completo"
        autoCapitalize="words"
      />
      {fieldErrors.nomeCompleto && (
        <Text style={styles.errorText}>{fieldErrors.nomeCompleto}</Text>
      )}

      <Text style={styles.label}>Gênero *</Text>
      <TouchableOpacity 
        style={[
          styles.selectButton,
          fieldErrors.genero && styles.inputError
        ]}
        onPress={() => setShowGeneroOptions(!showGeneroOptions)}
      >
        <Text style={[styles.selectText, !data.genero && styles.placeholderText]}>
          {data.genero || 'Selecione seu gênero'}
        </Text>
        <ChevronDown size={20} color="#64748B" />
      </TouchableOpacity>
      {fieldErrors.genero && (
        <Text style={styles.errorText}>{fieldErrors.genero}</Text>
      )}
      
      {showGeneroOptions && (
        <View style={styles.optionsDropdown}>
          {GENEROS.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.dropdownItem}
              onPress={() => {
                updateData('genero', option)
                setShowGeneroOptions(false)
              }}
            >
              <Text style={styles.dropdownItemText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Data de Nascimento *</Text>
      <TouchableOpacity 
        style={[
          styles.dateInput,
          fieldErrors.dataNascimento && styles.inputError
        ]}
        onPress={() => setShowDatePicker(true)}
      >
        <Calendar size={20} color="#64748B" />
        <Text style={[styles.dateInputText, !data.dataNascimento && styles.placeholderText]}>
          {data.dataNascimento || 'DD/MM/AAAA'}
        </Text>
      </TouchableOpacity>
      {fieldErrors.dataNascimento && (
        <Text style={styles.errorText}>{fieldErrors.dataNascimento}</Text>
      )}

      <Text style={styles.label}>Telefone de Contato</Text>
      <TextInput
        style={styles.input}
        value={data.telefone}
        onChangeText={(value) => updateData('telefone', formatarTelefone(value))}
        placeholder="(11) 99999-9999"
        keyboardType="phone-pad"
        maxLength={VALIDACOES.telefoneLength}
      />

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => updateData('telefonePublico', !data.telefonePublico)}
      >
        <View style={[styles.checkbox, data.telefonePublico && styles.checkboxChecked]}>
          {data.telefonePublico && <Check size={16} color="white" />}
        </View>
        <Text style={styles.checkboxText}>Tornar telefone público no perfil</Text>
      </TouchableOpacity>

      <Text style={styles.label}>CREF (Opcional)</Text>
      <TextInput
        style={styles.input}
        value={data.cref}
        onChangeText={(value) => updateData('cref', value)}
        placeholder="123456"
        keyboardType="numeric"
      />
    </View>
  )

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Experiência Profissional</Text>
      
      <Text style={styles.label}>Anos de Experiência *</Text>
      <TouchableOpacity 
        style={[
          styles.selectButton,
          fieldErrors.anosExperiencia && styles.inputError
        ]}
        onPress={() => setShowExperienciaOptions(!showExperienciaOptions)}
      >
        <Text style={[styles.selectText, !data.anosExperiencia && styles.placeholderText]}>
          {data.anosExperiencia || 'Selecione sua experiência'}
        </Text>
        <ChevronDown size={20} color="#64748B" />
      </TouchableOpacity>
      {fieldErrors.anosExperiencia && (
        <Text style={styles.errorText}>{fieldErrors.anosExperiencia}</Text>
      )}
      
      {showExperienciaOptions && (
        <View style={styles.optionsDropdown}>
          {ANOS_EXPERIENCIA_PT.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.dropdownItem}
              onPress={() => {
                updateData('anosExperiencia', option)
                setShowExperienciaOptions(false)
              }}
            >
              <Text style={styles.dropdownItemText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Suas Especializações *</Text>
      <Text style={styles.sublabel}>Selecione todas que se aplicam</Text>
      <View style={styles.especializacoesGrid}>
        {ESPECIALIZACOES_PT.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.especializacaoChip,
              data.especializacoes.includes(option) && styles.especializacaoChipSelected
            ]}
            onPress={() => toggleEspecializacao(option)}
          >
            <Text style={[
              styles.especializacaoChipText,
              data.especializacoes.includes(option) && styles.especializacaoChipTextSelected
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {fieldErrors.especializacoes && (
        <Text style={styles.errorText}>{fieldErrors.especializacoes}</Text>
      )}
      {data.especializacoes.length > 0 && (
        <Text style={styles.selectedCount}>
          {data.especializacoes.length} especialização{data.especializacoes.length > 1 ? 'ões' : ''} selecionada{data.especializacoes.length > 1 ? 's' : ''}
        </Text>
      )}

      <Text style={styles.label}>Sua Bio * (mínimo {VALIDACOES.bioMinLength} caracteres)</Text>
      <TextInput
        style={[
          styles.bioInput,
          fieldErrors.bio && styles.inputError
        ]}
        value={data.bio}
        onChangeText={(value) => updateData('bio', value)}
        placeholder="Conte um pouco sobre sua experiência como personal trainer..."
        multiline
        numberOfLines={4}
      />
      {fieldErrors.bio && (
        <Text style={styles.errorText}>{fieldErrors.bio}</Text>
      )}
      <Text style={[
        styles.charCount,
        data.bio.length < VALIDACOES.bioMinLength && styles.charCountWarning,
        data.bio.length >= VALIDACOES.bioMinLength && styles.charCountSuccess
      ]}>
        {data.bio.length}/{VALIDACOES.bioMaxLength} caracteres (mínimo {VALIDACOES.bioMinLength})
      </Text>
    </View>
  )

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Redes Sociais</Text>
      <Text style={styles.stepSubtitle}>Todas as redes sociais são opcionais</Text>
      
      <Text style={styles.label}>Instagram (Opcional)</Text>
      <TextInput
        style={styles.input}
        value={data.instagram}
        onChangeText={(value) => updateData('instagram', value)}
        placeholder="https://instagram.com/seu.perfil"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Facebook (Opcional)</Text>
      <TextInput
        style={styles.input}
        value={data.facebook}
        onChangeText={(value) => updateData('facebook', value)}
        placeholder="https://facebook.com/seu.perfil"
        autoCapitalize="none"
      />

      <Text style={styles.label}>LinkedIn (Opcional)</Text>
      <TextInput
        style={styles.input}
        value={data.linkedin}
        onChangeText={(value) => updateData('linkedin', value)}
        placeholder="https://linkedin.com/in/seu.perfil"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Website/Blog Pessoal (Opcional)</Text>
      <TextInput
        style={styles.input}
        value={data.website}
        onChangeText={(value) => updateData('website', value)}
        placeholder="https://seusite.com.br"
        autoCapitalize="none"
      />
    </View>
  )

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index < currentStep && styles.progressDotCompleted,
              index === currentStep - 1 && styles.progressDotCurrent
            ]}
          />
        ))}
      </View>
    </View>
  )

  const renderDatePicker = () => {
    const currentDate = getCurrentDate()
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    const getDaysInMonth = (month: number, year: number) => {
      return new Date(year, month + 1, 0).getDate()
    }

    const years = Array.from({ length: 100 }, (_, i) => currentDate.year - i)

    const confirmDate = () => {
      const formattedDate = formatDate(selectedDay, selectedMonth, selectedYear)
      updateData('dataNascimento', formattedDate)
      setShowDatePicker(false)
    }

    return (
      <Modal visible={showDatePicker} transparent={true} animationType="slide" accessible={false} importantForAccessibility="no">
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerTitle}>Selecione sua data de nascimento</Text>
            
            <View style={styles.datePickerRow}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Dia</Text>
                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1).map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.pickerItem, selectedDay === day && styles.pickerItemSelected]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[styles.pickerText, selectedDay === day && styles.pickerTextSelected]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Mês</Text>
                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.pickerItem, selectedMonth === index && styles.pickerItemSelected]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text style={[styles.pickerText, selectedMonth === index && styles.pickerTextSelected]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Ano</Text>
                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[styles.pickerItem, selectedYear === year && styles.pickerItemSelected]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[styles.pickerText, selectedYear === year && styles.pickerTextSelected]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.datePickerButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={confirmDate}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderDatePicker()}
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Configuração do Perfil - Personal Trainer</Text>
          {renderProgressBar()}
        </View>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <ChevronLeft size={20} color="rgba(0, 122, 255, 1.00)" />
              <Text style={styles.backButtonText}>Voltar</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[
              styles.nextButton,
              !validateStep(currentStep).isValid && styles.nextButtonDisabled
            ]}
            onPress={nextStep}
            disabled={loading || !validateStep(currentStep).isValid}
          >
            <Text style={styles.nextButtonText}>
              {loading ? 'Salvando...' : currentStep === totalSteps ? 'Finalizar' : 'Próximo'}
            </Text>
            {currentStep < totalSteps && (
              <ChevronRight size={20} color="white" />
            )}
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  progressDotCompleted: {
    backgroundColor: 'rgba(0, 122, 255, 1.00)',
    width: 24,
  },
  progressDotCurrent: {
    backgroundColor: 'rgba(0, 122, 255, 1.00)',
    width: 16,
  },
  stepContent: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(0, 122, 255, 1.00)',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    gap: 12,
  },
  dateInputText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: 'rgba(0, 122, 255, 1.00)',
    borderColor: 'rgba(0, 122, 255, 1.00)',
  },
  checkboxText: {
    fontSize: 14,
    color: '#64748B',
  },
  bioInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: 'white',
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 4,
  },
  charCountWarning: {
    color: '#F59E0B',
  },
  charCountSuccess: {
    color: '#10B981',
  },
  
  // Validation Styles
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  sublabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    marginTop: -4,
  },
  selectedCount: {
    fontSize: 12,
    color: '#10B981',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  
  // Especializações - Layout em grid com chips
  especializacoesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  especializacaoChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: 'white',
  },
  especializacaoChipSelected: {
    backgroundColor: 'rgba(0, 122, 255, 1.00)',
    borderColor: 'rgba(0, 122, 255, 1.00)',
  },
  especializacaoChipText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  especializacaoChipTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    gap: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 1.00)',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: 'rgba(0, 122, 255, 1.00)',
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 1.00)',
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  nextButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  
  // Date Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  picker: {
    height: 200,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
  },
  pickerItem: {
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  pickerText: {
    fontSize: 16,
    color: '#64748B',
  },
  pickerTextSelected: {
    color: 'rgba(0, 122, 255, 1.00)',
    fontWeight: '600',
  },
  datePickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 1.00)',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  
  // Select/Dropdown Styles
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  selectText: {
    fontSize: 16,
    color: '#1F2937',
  },
  optionsDropdown: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: 'white',
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
})
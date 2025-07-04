import { router } from 'expo-router'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native'
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
    FREQUENCIAS_TREINO,
    GENEROS,
    NIVEIS_EXPERIENCIA_ALUNO,
    OBJETIVOS,
    formatarTelefone
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
 * - objetivo_principal
 * - nivel_experiencia
 * - frequencia_treino_desejada
 * - questionario_par_q (todas as 7 perguntas respondidas)
 */

interface OnboardingData {
  nomeCompleto: string
  genero: string
  dataNascimento: string
  telefone: string
  peso: string
  altura: string
  objetivoPrincipal: string
  nivelExperiencia: string
  frequenciaTreinoDesejada: string
  questionarioParQ: {[key: string]: boolean}
}

export default function OnboardingAluno() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showGeneroOptions, setShowGeneroOptions] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showObjetivoOptions, setShowObjetivoOptions] = useState(false)
  const [showExperienciaOptions, setShowExperienciaOptions] = useState(false)
  const [showFrequenciaOptions, setShowFrequenciaOptions] = useState(false)
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
    peso: '',
    altura: '',
    objetivoPrincipal: '',
    nivelExperiencia: '',
    frequenciaTreinoDesejada: '',
    questionarioParQ: {}
  })

  const totalSteps = 3

  const perguntasParQ = [
    'Seu médico já disse que você possui algum problema cardíaco e que só deve realizar atividade física supervisionado por profissionais de saúde?',
    'Você sente dores no peito quando realiza atividade física?',
    'No último mês, você sentiu dores no peito mesmo sem praticar atividade física?',
    'Você perde o equilíbrio devido a tontura ou já perdeu a consciência alguma vez?',
    'Você possui algum problema ósseo ou articular que poderia piorar com a prática de atividade física?',
    'Seu médico já prescreveu algum medicamento para pressão arterial ou problema cardíaco?',
    'Você sabe de alguma outra razão pela qual não deveria praticar atividade física?'
  ]

  // Função para converter vírgula em ponto para o banco de dados
  const formatDecimalForDatabase = (value: string): number | null => {
    if (!value || value.trim() === '') return null
    
    // Substitui vírgula por ponto para o PostgreSQL
    const normalizedValue = value.replace(',', '.')
    const parsed = parseFloat(normalizedValue)
    
    // Verifica se é um número válido
    return isNaN(parsed) ? null : parsed
  }

  // Função para filtrar input de peso (permite números, vírgula e ponto)
  const handlePesoChange = (value: string) => {
    // Permite apenas números, vírgula e ponto
    const filtered = value.replace(/[^0-9.,]/g, '')
    updateData('peso', filtered)
  }

  // Função para filtrar input de altura (permite números, vírgula e ponto)
  const handleAlturaChange = (value: string) => {
    // Permite apenas números, vírgula e ponto  
    const filtered = value.replace(/[^0-9.,]/g, '')
    updateData('altura', filtered)
  }

  // Função para gerar avatar letter
  const generateAvatarLetter = (nomeCompleto: string, email: string): string => {
    const nome = nomeCompleto?.trim();
    
    if (!nome) {
      return email?.charAt(0)?.toUpperCase() || 'A';
    }
    
    const palavras = nome.split(' ').filter(p => p.length > 0);
    const primeiraLetra = palavras[0].charAt(0).toUpperCase();
    
    if (palavras.length >= 2) {
      const ultimaLetra = palavras[palavras.length - 1].charAt(0).toUpperCase();
      return primeiraLetra + ultimaLetra;
    } else {
      const nomeUnico = palavras[0];
      const segundaLetra = nomeUnico.length > 1 
        ? nomeUnico.charAt(1).toUpperCase() 
        : 'L';
      return primeiraLetra + segundaLetra;
    }
  };

  // NOVA FUNÇÃO: Validar se onboarding pode ser finalizado
  const canCompleteOnboarding = (): boolean => {
    // Verificar campos obrigatórios básicos
    const basicFieldsValid = !!(
      data.nomeCompleto &&
      data.genero &&
      data.dataNascimento &&
      data.objetivoPrincipal &&
      data.nivelExperiencia &&
      data.frequenciaTreinoDesejada
    )

    // Verificar se todas as 7 perguntas do PAR-Q foram respondidas
    const parQComplete = perguntasParQ.every((_, index) => 
      data.questionarioParQ[index.toString()] !== undefined
    )

    return basicFieldsValid && parQComplete
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
      const { data: alunoData, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('id', currentUserId)
        .single()

      if (alunoData && !error) {
        setData({
          nomeCompleto: alunoData.nome_completo || '',
          genero: alunoData.genero || '',
          dataNascimento: alunoData.data_nascimento || '',
          telefone: alunoData.telefone || '',
          peso: alunoData.peso ? alunoData.peso.toString().replace('.', ',') : '',
          altura: alunoData.altura ? alunoData.altura.toString().replace('.', ',') : '',
          objetivoPrincipal: alunoData.objetivo_principal || '',
          nivelExperiencia: alunoData.nivel_experiencia || '',
          frequenciaTreinoDesejada: alunoData.frequencia_desejada || '',
          questionarioParQ: alunoData.par_q_respostas || {}
        })

        if (alunoData.onboarding_completo) {
          router.replace('/(tabs)/index-aluno' as never)
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

  const updateParQResponse = (questionIndex: number, response: boolean) => {
    const newParQ = { ...data.questionarioParQ }
    newParQ[questionIndex.toString()] = response
    updateData('questionarioParQ', newParQ)
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
        if (!data.objetivoPrincipal) errors.objetivoPrincipal = 'Objetivo principal é obrigatório'
        if (!data.nivelExperiencia) errors.nivelExperiencia = 'Nível de experiência é obrigatório'
        if (!data.frequenciaTreinoDesejada) errors.frequenciaTreinoDesejada = 'Frequência de treino é obrigatória'
        break
      case 3:
        // Verificar se todas as 7 perguntas do PAR-Q foram respondidas
        for (let i = 0; i < perguntasParQ.length; i++) {
          if (data.questionarioParQ[i.toString()] === undefined) {
            errors.questionarioParQ = 'Responda todas as perguntas do questionário PAR-Q'
            break
          }
        }
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
        'Preencha todos os campos obrigatórios antes de finalizar:\n\n• Nome completo\n• Gênero\n• Data de nascimento\n• Objetivo principal\n• Nível de experiência\n• Frequência de treino\n• Questionário PAR-Q (todas as 7 perguntas)'
      )
      return
    }

    setLoading(true)
    try {
      const avatarLetter = generateAvatarLetter(data.nomeCompleto, userEmail)
      
      console.log('Avatar letter gerado:', avatarLetter, 'para:', data.nomeCompleto)

      // VALIDAÇÃO SIMPLES - definimos onboarding_completo diretamente!
      const updateData = {
        nome_completo: data.nomeCompleto,
        genero: data.genero,
        data_nascimento: data.dataNascimento,
        telefone: data.telefone,
        // CORRIGIDO: Usar função que converte vírgula para ponto
        peso: formatDecimalForDatabase(data.peso),
        altura: formatDecimalForDatabase(data.altura),
        objetivo_principal: data.objetivoPrincipal,
        nivel_experiencia: data.nivelExperiencia,
        frequencia_desejada: data.frequenciaTreinoDesejada,
        par_q_respostas: data.questionarioParQ,
        // Campos de avatar
        avatar_letter: avatarLetter,
        avatar_color: '#3B82F6', // Cor verde para alunos
        avatar_type: 'letter',
        avatar_image_url: null, // Inicialmente sem imagem
        // DEFINIMOS DIRETAMENTE - sem trigger!
        onboarding_completo: true,
        status: 'ativo' // Muda de "pendente" para "ativo" após completar onboarding
      }

      // Atualização simples e direta
      const { error, data: result } = await supabase
        .from('alunos')
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
      router.replace('/(tabs)/index-aluno' as never)

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

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, styles.inputDisabled]}
        value={userEmail || ''}
        editable={false}
        placeholder="Email do usuário"
      />

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
          {data.dataNascimento || 'Selecione uma data'}
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
        maxLength={15}
      />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            value={data.peso}
            onChangeText={handlePesoChange}
            placeholder="ex: 70 ou 70,5"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Altura (m)</Text>
          <TextInput
            style={styles.input}
            value={data.altura}
            onChangeText={handleAlturaChange}
            placeholder="ex: 1,70"
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  )

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Objetivos e Experiência</Text>
      
      <Text style={styles.label}>Objetivo Principal *</Text>
      <TouchableOpacity 
        style={[
          styles.selectButton,
          fieldErrors.objetivoPrincipal && styles.inputError
        ]}
        onPress={() => setShowObjetivoOptions(!showObjetivoOptions)}
      >
        <Text style={[styles.selectText, !data.objetivoPrincipal && styles.placeholderText]}>
          {data.objetivoPrincipal || 'Selecione seu objetivo'}
        </Text>
        <ChevronDown size={20} color="#64748B" />
      </TouchableOpacity>
      {fieldErrors.objetivoPrincipal && (
        <Text style={styles.errorText}>{fieldErrors.objetivoPrincipal}</Text>
      )}
      
      {showObjetivoOptions && (
        <View style={styles.optionsDropdown}>
          {OBJETIVOS.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.dropdownItem}
              onPress={() => {
                updateData('objetivoPrincipal', option)
                setShowObjetivoOptions(false)
              }}
            >
              <Text style={styles.dropdownItemText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Nível de Experiência *</Text>
      <TouchableOpacity 
        style={[
          styles.selectButton,
          fieldErrors.nivelExperiencia && styles.inputError
        ]}
        onPress={() => setShowExperienciaOptions(!showExperienciaOptions)}
      >
        <Text style={[styles.selectText, !data.nivelExperiencia && styles.placeholderText]}>
          {data.nivelExperiencia || 'Selecione seu nível'}
        </Text>
        <ChevronDown size={20} color="#64748B" />
      </TouchableOpacity>
      {fieldErrors.nivelExperiencia && (
        <Text style={styles.errorText}>{fieldErrors.nivelExperiencia}</Text>
      )}
      
      {showExperienciaOptions && (
        <View style={styles.optionsDropdown}>
          {NIVEIS_EXPERIENCIA_ALUNO.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.dropdownItem}
              onPress={() => {
                updateData('nivelExperiencia', option)
                setShowExperienciaOptions(false)
              }}
            >
              <Text style={styles.dropdownItemText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Frequência de Treino Desejada *</Text>
      <TouchableOpacity 
        style={[
          styles.selectButton,
          fieldErrors.frequenciaTreinoDesejada && styles.inputError
        ]}
        onPress={() => setShowFrequenciaOptions(!showFrequenciaOptions)}
      >
        <Text style={[styles.selectText, !data.frequenciaTreinoDesejada && styles.placeholderText]}>
          {data.frequenciaTreinoDesejada || 'Quantas vezes por semana?'}
        </Text>
        <ChevronDown size={20} color="#64748B" />
      </TouchableOpacity>
      {fieldErrors.frequenciaTreinoDesejada && (
        <Text style={styles.errorText}>{fieldErrors.frequenciaTreinoDesejada}</Text>
      )}
      
      {showFrequenciaOptions && (
        <View style={styles.optionsDropdown}>
          {FREQUENCIAS_TREINO.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.dropdownItem}
              onPress={() => {
                updateData('frequenciaTreinoDesejada', option)
                setShowFrequenciaOptions(false)
              }}
            >
              <Text style={styles.dropdownItemText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Questionário de Prontidão para Atividade Física (PAR-Q)</Text>
      <Text style={styles.stepSubtitle}>
        Responda às perguntas abaixo com honestidade. Estas informações são importantes para sua segurança.
      </Text>
      
      {perguntasParQ.map((pergunta, index) => (
        <View key={index} style={styles.questionContainer}>
          <Text style={styles.questionText}>
            {index + 1}. {pergunta}
          </Text>
          <View style={styles.questionOptions}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                data.questionarioParQ[index.toString()] === true && styles.optionButtonSelected
              ]}
              onPress={() => updateParQResponse(index, true)}
            >
              <View style={[
                styles.radio,
                data.questionarioParQ[index.toString()] === true && styles.radioSelected
              ]}>
                {data.questionarioParQ[index.toString()] === true && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <Text style={[
                styles.optionText,
                data.questionarioParQ[index.toString()] === true && styles.optionTextSelected
              ]}>
                Sim
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.optionButton,
                data.questionarioParQ[index.toString()] === false && styles.optionButtonSelected
              ]}
              onPress={() => updateParQResponse(index, false)}
            >
              <View style={[
                styles.radio,
                data.questionarioParQ[index.toString()] === false && styles.radioSelected
              ]}>
                {data.questionarioParQ[index.toString()] === false && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <Text style={[
                styles.optionText,
                data.questionarioParQ[index.toString()] === false && styles.optionTextSelected
              ]}>
                Não
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      
      {fieldErrors.questionarioParQ && (
        <Text style={styles.errorText}>{fieldErrors.questionarioParQ}</Text>
      )}
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
          <Text style={styles.title}>Configuração do Perfil - Aluno</Text>
          <Text style={styles.subtitle}>Vamos configurar seu perfil para personalizar seus treinos</Text>
          {renderProgressBar()}
        </View>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <ChevronLeft size={20} color="#3B82F6" />
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
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
    backgroundColor: '#3B82F6',
    width: 24,
  },
  progressDotCurrent: {
    backgroundColor: '#3B82F6',
    width: 16,
  },
  stepContent: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 20,
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
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    color: '#64748B',
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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
  
  // Question Styles
  questionContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  questionText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 16,
    lineHeight: 20,
  },
  questionOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#F0FDF4',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#3B82F6',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  optionText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
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
    borderColor: '#3B82F6',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
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
    backgroundColor: '#F0FDF4',
  },
  pickerText: {
    fontSize: 16,
    color: '#64748B',
  },
  pickerTextSelected: {
    color: '#3B82F6',
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
    backgroundColor: '#3B82F6',
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
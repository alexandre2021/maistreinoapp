// components/EmailInput.tsx
// Componente de input de email com validação visual em tempo real

import { AlertCircle, CheckCircle, Mail, Shield } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { validateEmailForRegistration } from '../services/emailValidationService'
import LoadingIcon from './LoadingIcon'

interface EmailInputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  style?: any
  disabled?: boolean
  onValidationChange?: (isValid: boolean, message?: string) => void
  showValidationIcon?: boolean
  realTimeValidation?: boolean
}

interface ValidationState {
  isValid: boolean
  isValidating: boolean
  message?: string
  riskLevel?: string
  showValidation: boolean
}

export default function EmailInput({ 
  value, 
  onChangeText, 
  placeholder = "Digite seu email",
  style,
  disabled = false,
  onValidationChange,
  showValidationIcon = true,
  realTimeValidation = true
}: EmailInputProps) {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    isValidating: false,
    showValidation: false
  })

  // Debounce para validação em tempo real
  useEffect(() => {
    if (!realTimeValidation || !value.trim()) {
      setValidationState(prev => ({ 
        ...prev, 
        showValidation: false, 
        isValidating: false 
      }))
      onValidationChange?.(false)
      return
    }

    const timer = setTimeout(async () => {
      setValidationState(prev => ({ ...prev, isValidating: true }))
      
      try {
        const result = await validateEmailForRegistration(value.trim())
        
        setValidationState({
          isValid: result.isValid,
          isValidating: false,
          message: result.message,
          riskLevel: result.riskLevel,
          showValidation: true
        })
        
        onValidationChange?.(result.isValid, result.message)
      } catch (error) {
        setValidationState({
          isValid: false,
          isValidating: false,
          message: 'Erro na validação',
          showValidation: true
        })
        onValidationChange?.(false, 'Erro na validação')
      }
    }, 800) // Aguarda 800ms após parar de digitar

    return () => clearTimeout(timer)
  }, [value, onValidationChange, realTimeValidation])

  const getInputStyle = () => {
    const baseStyle = [styles.input, style]
    
    if (!validationState.showValidation || validationState.isValidating) {
      return baseStyle
    }

    if (validationState.isValid) {
      return [...baseStyle, styles.inputValid]
    } else {
      return [...baseStyle, styles.inputError]
    }
  }

  const getValidationIcon = () => {
    if (!showValidationIcon) return null
    
    if (validationState.isValidating) {
      return <LoadingIcon size={20} color="#6B7280" />
    }

    if (!validationState.showValidation) return null

    if (validationState.isValid) {
      if (validationState.riskLevel === 'low') {
        return <Shield size={20} color="#10B981" />
      } else {
        return <CheckCircle size={20} color="#10B981" />
      }
    } else {
      return <AlertCircle size={20} color="#DC2626" />
    }
  }

  const getValidationMessage = () => {
    if (!validationState.showValidation || validationState.isValidating) {
      return null
    }

    if (validationState.isValid) {
      if (validationState.riskLevel === 'low') {
        return (
          <Text style={styles.successMessage}>
            ✓ Email de provedor confiável
          </Text>
        )
      } else if (validationState.riskLevel === 'medium') {
        return (
          <Text style={styles.warningMessage}>
            ⚠️ Email válido, mas verifique se está correto
          </Text>
        )
      } else {
        return (
          <Text style={styles.successMessage}>
            ✓ Email válido
          </Text>
        )
      }
    } else {
      return (
        <Text style={styles.errorMessage}>
          {validationState.message || 'Email inválido'}
        </Text>
      )
    }
  }

  const getValidationProgress = () => {
    if (validationState.isValidating) {
      return (
        <Text style={styles.validatingMessage}>
          🔍 Verificando email...
        </Text>
      )
    }
    return null
  }

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, getInputStyle()]}>
        <Mail size={20} color="#9CA3AF" style={styles.mailIcon} />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!disabled}
          placeholderTextColor="#9CA3AF"
          autoCorrect={false}
          spellCheck={false}
        />
        {showValidationIcon && (
          <View style={styles.validationIcon}>
            {getValidationIcon()}
          </View>
        )}
      </View>
      
      {getValidationProgress()}
      {getValidationMessage()}
    </View>
  )
}

/**
 * Componente simplificado para usar em formulários existentes
 */
export function SimpleEmailInput({ 
  value, 
  onChangeText, 
  placeholder,
  style,
  disabled 
}: Omit<EmailInputProps, 'onValidationChange' | 'showValidationIcon' | 'realTimeValidation'>) {
  return (
    <EmailInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      style={style}
      disabled={disabled}
      showValidationIcon={false}
      realTimeValidation={false}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    minHeight: 56,
  },
  inputValid: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  textInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    paddingLeft: 8, // Menos padding porque tem ícone
    color: '#1F2937',
  },
  input: {
    // Placeholder para compatibilidade com getInputStyle
  },
  mailIcon: {
    marginLeft: 16,
  },
  validationIcon: {
    paddingRight: 16,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validatingMessage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  successMessage: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  warningMessage: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  errorMessage: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
})

// Exemplo de uso:
/*
// Uso completo com validação visual
<EmailInput
  value={formData.email}
  onChangeText={(value) => updateField('email', value)}
  onValidationChange={(isValid, message) => {
    if (!isValid && message) {
      setErrors({ ...errors, email: message })
    } else {
      setErrors({ ...errors, email: '' })
    }
  }}
/>

// Uso simples (sem validação visual)
<SimpleEmailInput
  value={formData.email}
  onChangeText={(value) => updateField('email', value)}
  placeholder="Digite seu email"
/>
*/
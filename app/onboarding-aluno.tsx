import { router } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  DadosBasicos,
  DescricaoESaude,
  OnboardingProgressHeader
} from '../components/onboarding-aluno';
import { AppOrange } from '../constants/Colors';
import { OnboardingAlunoProvider, useOnboardingAluno } from '../context/OnboardingAlunoContext';
import { useOnboardingSubmit } from '../hooks/onboarding-aluno/useOnboardingSubmit';
import { useStepValidation } from '../hooks/onboarding-aluno/useStepValidation';
import { supabase } from '../lib/supabase';

/**
 * Tela de onboarding do aluno - Versão refatorada
 * 2 etapas: Dados Básicos + Descrição & Saúde
 */
function OnboardingAlunoScreen() {
  // Estados básicos
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Ref para o ScrollView
  const scrollRef = React.useRef<ScrollView>(null);

  // Hooks customizados
  const { setData } = useOnboardingAluno();
  const { validateStep, getStepErrors } = useStepValidation();
  const { loading, submitOnboarding } = useOnboardingSubmit();

  // Configuração
  const totalSteps = 2;

  // Obter erros da etapa atual
  const fieldErrors = getStepErrors(currentStep);

  /**
   * Obter usuário logado
   */
  const getCurrentUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || '');
        return { id: user.id, email: user.email };
      } else {
        router.replace('/');
        return null;
      }
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      router.replace('/');
      return null;
    }
  }, []);

  /**
   * Carregar dados existentes se aluno já começou onboarding
   */
  const loadExistingData = useCallback(async (currentUserId: string) => {
    try {
      const { data: alunoData, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('id', currentUserId)
        .single();

      if (alunoData && !error) {
        // Carregar dados existentes no contexto
        setData({
          nomeCompleto: alunoData.nome_completo || '',
          genero: alunoData.genero || '',
          dataNascimento: alunoData.data_nascimento || '',
          telefone: alunoData.telefone || '',
          peso: alunoData.peso ? alunoData.peso.toString().replace('.', ',') : '',
          altura: alunoData.altura ? alunoData.altura.toString().replace('.', ',') : '',
          descricaoPessoal: alunoData.descricao_pessoal || '',
          questionarioParQ: alunoData.par_q_respostas || {}
        });

        // Se onboarding já foi completado, redirecionar
        if (alunoData.onboarding_completo) {
          router.replace('/(tabs)/index-aluno' as never);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }, [setData]);

  /**
   * Inicializar usuário e carregar dados
   */
  useEffect(() => {
    const initializeUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        await loadExistingData(user.id);
      }
    };
    initializeUser();
  }, [getCurrentUser, loadExistingData]);

  /**
   * Avançar para próxima etapa
   */
  const nextStep = useCallback(() => {
    const validation = validateStep(currentStep);

    if (!validation.isValid) {
      return; // Erros já são mostrados via getStepErrors
    }

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => {
        // Após mudar o passo, rola para o topo
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({ y: 0, animated: true });
          }
        }, 50);
        return prev + 1;
      });
    } else {
      // Finalizar onboarding
      if (userId && userEmail) {
        submitOnboarding(userId, userEmail);
      }
    }
  }, [currentStep, totalSteps, userId, userEmail, validateStep, submitOnboarding]);

  /**
   * Voltar para etapa anterior
   */
  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  /**
   * Verificar se pode avançar
   */
  const canProceed = validateStep(currentStep).isValid;

  // Loading state
  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        >
          {/* Header com progresso */}
          <OnboardingProgressHeader 
            currentStep={currentStep} 
            totalSteps={totalSteps}
          />

          {/* Renderizar etapa atual */}
          {currentStep === 1 && (
            <DadosBasicos 
              userEmail={userEmail || ''}
              fieldErrors={fieldErrors}
            />
          )}
          
          {currentStep === 2 && (
            <DescricaoESaude 
              fieldErrors={fieldErrors}
            />
          )}

          {/* Botões de navegação */}
          <View style={styles.navigationButtonsWrapper}>
            <View style={styles.navigationButtons}>
              {currentStep > 1 && (
                <TouchableOpacity 
                  style={styles.backButton} 
                  onPress={prevStep}
                  disabled={loading}
                >
                  <ChevronLeft size={20} color={AppOrange} />
                  <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[
                  styles.nextButton,
                  (!canProceed || loading) && styles.nextButtonDisabled
                ]}
                onPress={nextStep}
                disabled={!canProceed || loading}
              >
                <Text style={styles.nextButtonText}>
                  {loading ? 'Salvando...' : currentStep === totalSteps ? 'Finalizar' : 'Próximo'}
                </Text>
                {currentStep < totalSteps && !loading && (
                  <ChevronRight size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
            
            {!canProceed && (
              <Text style={styles.requiredFieldsHint}>
                Preencha todos os campos obrigatórios
              </Text>
            )}
            
            <View style={[styles.androidBottomSpacer, { backgroundColor: 'white' }]} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
  navigationButtonsWrapper: {
    backgroundColor: '#fafafa',
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
    borderColor: AppOrange,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: AppOrange,
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: AppOrange,
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
  requiredFieldsHint: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 14,
    marginTop: -8,
    marginBottom: 8,
  },
  androidBottomSpacer: {
    height: 80,
  },
});

/**
 * Componente principal exportado com Provider
 */
export default function OnboardingAluno() {
  return (
    <OnboardingAlunoProvider>
      <OnboardingAlunoScreen />
    </OnboardingAlunoProvider>
  );
}
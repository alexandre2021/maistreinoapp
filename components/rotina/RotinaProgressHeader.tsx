// components/rotina/RotinaProgressHeader.tsx - VERSÃO COM SESSIONSTORAGE
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useModalManager } from '../../hooks/useModalManager';
import { ExitRotinaModal } from './ExitRotinaModal';

interface RotinaProgressHeaderProps {
  title: string;
  subtitle?: string;
  showExitButton?: boolean;
  onExitPress?: () => void;
  alunoId?: string;
}

// ✅ FUNÇÕES DE SESSIONSTORAGE
const STORAGE_KEYS = {
  CONFIG: 'rotina_configuracao',
  TREINOS: 'rotina_treinos',
  EXERCICIOS: 'rotina_exercicios',
  PROGRESS: 'rotina_progress'
};

// ✅ FUNÇÃO PARA LIMPAR TODOS OS DADOS DA ROTINA
const limparDadosRotina = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.CONFIG);
    sessionStorage.removeItem(STORAGE_KEYS.TREINOS);
    sessionStorage.removeItem(STORAGE_KEYS.EXERCICIOS);
    sessionStorage.removeItem(STORAGE_KEYS.PROGRESS);
    console.log('✅ Dados da rotina limpos do sessionStorage');
  } catch (error) {
    console.error('❌ Erro ao limpar dados da rotina:', error);
  }
};

export const RotinaProgressHeader: React.FC<RotinaProgressHeaderProps> = ({
  title,
  subtitle,
  showExitButton = true,
  onExitPress,
  alunoId
}) => {
  const router = useRouter();
  const pathname = usePathname(); // ✅ Hook do expo-router para detectar mudanças de rota
  
  // ✅ Hook para gerenciar modais
  const { modals, openModal, closeModal } = useModalManager({
    exitConfirm: false
  });

  // ✅ CONFIGURAÇÃO DAS ETAPAS
  const steps = [
    { number: 1, label: 'Configuração' },
    { number: 2, label: 'Treinos' },
    { number: 3, label: 'Exercícios' },
    { number: 4, label: 'Revisão' }
  ];

  // ✅ DETECTAR STEP ATUAL BASEADO NO PATHNAME DO EXPO-ROUTER
  const getCurrentStep = () => {
    console.log('🔍 [RotinaProgressHeader] Detectando step atual - Pathname:', pathname);
    
    if (pathname.includes('/configuracao')) return 1;
    if (pathname.includes('/treinos')) return 2;
    if (pathname.includes('/exercicios')) return 3;
    if (pathname.includes('/revisao')) return 4;
    return 1;
  };

  // ✅ DETECTAR STEP ATUAL E PROGRESSO MÁXIMO
  const currentStep = getCurrentStep();
  
  console.log('🎯 [RotinaProgressHeader] Step atual:', currentStep, '| Pathname:', pathname);

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  // ✅ VERIFICAR SE TEM DADOS NÃO SALVOS - REMOVIDO (não usado mais)

  // ✅ EXECUTAR SAÍDA REAL
  const executeExit = () => {
    if (alunoId) {
      router.replace(`/rotinas/${alunoId}` as const);
    } else {
      router.replace('/(tabs)/alunos');
    }
  };

  // ✅ HANDLER DE SAIR - SEMPRE PASSA PELA MODAL
  const handleExitPress = () => {
    // Se tem onExitPress customizado, executa ele
    if (onExitPress) {
      onExitPress();
      return;
    }

    // ✅ SEMPRE ABRE A MODAL (sem Alert.alert)
    openModal('exitConfirm');
  };

  // ✅ CONFIRMAR SAÍDA
  const handleConfirmExit = () => {
    closeModal('exitConfirm');
    executeExit();
  };

  // ✅ CANCELAR SAÍDA
  const handleCancelExit = () => {
    closeModal('exitConfirm');
  };

  // ✅ RENDERIZAR STEP - LÓGICA SUPER SIMPLES: SÓ MOSTRA ONDE ESTOU
  const renderStep = (step: typeof steps[0], index: number) => {
    const isActive = step.number === currentStep; // Só isso: onde estou = azul, resto = cinza
    
    return (
      <View key={step.number} style={styles.stepContainer}>
        {/* Círculo do step */}
        <View style={[
          styles.stepCircle,
          isActive && styles.stepCircleActive
        ]}>
          <Text style={[
            styles.stepNumber,
            isActive && styles.stepNumberActive
          ]}>
            {step.number}
          </Text>
        </View>
        
        {/* Label do step */}
        <Text style={[
          styles.stepLabel,
          isActive && styles.stepLabelActive
        ]}>
          {step.label}
        </Text>
        
        {/* Linha conectora */}
        {index < steps.length - 1 && (
          <View style={styles.stepConnector} />
        )}
      </View>
    );
  };

  return (
    <>
      <View style={styles.container}>
        {/* ✅ CABEÇALHO COM BOTÃO SAIR */}
        <View style={styles.header}>
          {showExitButton && (
            <TouchableOpacity 
              style={styles.exitButton}
              onPress={handleExitPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          )}
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
          </View>
          
          {/* Espaço para manter título centralizado */}
          <View style={styles.headerSpacer} />
        </View>

        {/* ✅ BARRA DE PROGRESSO LINEAR */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            Etapa {currentStep} de {steps.length}
          </Text>
        </View>

        {/* ✅ STEPS VISUAIS */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => renderStep(step, index))}
        </View>
      </View>

      {/* ✅ MODAL DE CONFIRMAÇÃO DE SAÍDA */}
      <ExitRotinaModal
        visible={modals.exitConfirm}
        onConfirmExit={handleConfirmExit}
        onCancel={handleCancelExit}
      />
    </>
  );
};

// Styles permanecem os mesmos...
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  exitButton: {
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  stepsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  stepConnector: {
    position: 'absolute',
    top: 14,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#E5E7EB',
    zIndex: -1,
  },
});

// ✅ EXPORTAR APENAS A FUNÇÃO DE LIMPEZA (para a tela inicial)
export { limparDadosRotina };


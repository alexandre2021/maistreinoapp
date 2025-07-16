import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppOrange } from '../../constants/Colors';

interface OnboardingProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  title?: string;
  subtitle?: string;
}

export const OnboardingProgressHeader: React.FC<OnboardingProgressHeaderProps> = ({
  currentStep,
  totalSteps,
  title = "Configuração do Perfil - Aluno",
  subtitle
}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      
      {/* Progress Bar */}
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
        
        {/* Step Counter */}
        <Text style={styles.stepCounter}>
          Etapa {currentStep} de {totalSteps}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 16,
    lineHeight: 20,
  },
  progressContainer: {
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  progressDotCompleted: {
    backgroundColor: AppOrange,
  },
  progressDotCurrent: {
    backgroundColor: AppOrange,
  },
  stepCounter: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { AppOrange } from '../../constants/Colors';
import { useOnboardingAluno } from '../../context/OnboardingAlunoContext';

interface DescricaoESaudeProps {
  fieldErrors: { [key: string]: string };
}

export const DescricaoESaude: React.FC<DescricaoESaudeProps> = ({
  fieldErrors
}) => {
  const { data, updateField } = useOnboardingAluno();

  // Perguntas do questionário PAR-Q
  const perguntasParQ = [
    'Seu médico já disse que você possui algum problema cardíaco e que só deve realizar atividade física supervisionado por profissionais de saúde?',
    'Você sente dores no peito quando realiza atividade física?',
    'No último mês, você sentiu dores no peito mesmo sem praticar atividade física?',
    'Você perde o equilíbrio devido a tontura ou já perdeu a consciência alguma vez?',
    'Você possui algum problema ósseo ou articular que poderia piorar com a prática de atividade física?',
    'Seu médico já prescreveu algum medicamento para pressão arterial ou problema cardíaco?',
    'Você sabe de alguma outra razão pela qual não deveria praticar atividade física?'
  ];

  // Função para atualizar resposta do PAR-Q
  const updateParQResponse = (questionIndex: number, response: boolean) => {
    const newParQ = { ...data.questionarioParQ };
    newParQ[questionIndex.toString()] = response;
    updateField('questionarioParQ', newParQ);
  };

  return (
    <View style={styles.stepContent}>
      
      {/* Seção: Descrição Pessoal */}
      <View style={styles.section}>
        <Text style={styles.stepTitle}>Conte um pouco sobre você</Text>

        
        <Text style={styles.label}>Descreva sua experiência e objetivos *</Text>
        <TextInput
          style={[
            styles.textArea,
            fieldErrors.descricaoPessoal && styles.inputError
          ]}
          value={data.descricaoPessoal}
          onChangeText={(value) => updateField('descricaoPessoal', value)}
          placeholder="Ex: Pratico musculação há 2 anos, quero ganhar massa muscular, posso treinar 3x por semana, tenho dor no joelho direito..."
          multiline={true}
          numberOfLines={6}
          textAlignVertical="top"
        />
        {fieldErrors.descricaoPessoal && (
          <Text style={styles.errorText}>{fieldErrors.descricaoPessoal}</Text>
        )}
      </View>

      {/* Seção: Questionário PAR-Q */}
      <View style={styles.section}>
        <Text style={styles.stepTitle}>Questionário de Prontidão para Atividade Física (PAR-Q)</Text>

        
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
    </View>
  );
};

const styles = StyleSheet.create({
  stepContent: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AppOrange,
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
  textArea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 120,
    textAlignVertical: 'top',
  },
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
    flex: 1,
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
    borderColor: AppOrange,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppOrange,
  },
  optionText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  optionTextSelected: {
    color: AppOrange,
    fontWeight: '600',
  },
});
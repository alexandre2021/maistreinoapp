// app/par-q/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import LoadingScreen from '../../components/LoadingScreen';
import { supabase } from '../../lib/supabase';

interface AlunoData {
  nomeCompleto: string;
  email: string;
  parQRespostas: any;
  dataPreenchimento: string;
}

interface ParQRespostas {
  "0": boolean; // doença cardíaca
  "1": boolean; // dor no peito durante atividade
  "2": boolean; // dor no peito no último mês
  "3": boolean; // desmaio/tontura
  "4": boolean; // problema ósseo/articular
  "5": boolean; // medicamento para pressão/cardíaco
  "6": boolean; // outra razão física
  observacoes?: string;
  data_preenchimento?: string;
}

const PAR_Q_QUESTIONS = [
  "Algum médico já disse que você possui algum problema de coração?",
  "Você sente dor no peito quando pratica atividade física?",
  "No último mês, você sentiu dor no peito quando não estava praticando atividade física?",
  "Você apresenta desequilíbrio devido à tontura ou já perdeu a consciência?",
  "Você possui algum problema ósseo ou articular que poderia ser prejudicado por uma mudança na sua atividade física?",
  "Algum médico já prescreveu medicamentos para sua pressão arterial ou condição cardíaca?",
  "Você tem conhecimento, através de sua própria experiência ou de um médico, de alguma outra razão física que impeça a prática de atividade física?"
];

export default function ParQScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [alunoData, setAlunoData] = useState<AlunoData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        Alert.alert('Erro', 'ID do aluno não encontrado');
        router.back();
        return;
      }

      try {
        console.log('🔍 [ParQ] Carregando dados do aluno:', id);

        // Carregar dados do aluno incluindo par_q_respostas
        const { data: aluno, error: alunoError } = await supabase
          .from('alunos')
          .select('nome_completo, email, par_q_respostas, created_at')
          .eq('id', id)
          .single();

        if (alunoError || !aluno) {
          console.error('❌ [ParQ] Erro ao carregar aluno:', alunoError);
          Alert.alert('Erro', 'Aluno não encontrado');
          router.back();
          return;
        }

        console.log('✅ [ParQ] Dados do aluno carregados:', aluno);

        setAlunoData({
          nomeCompleto: aluno.nome_completo || '',
          email: aluno.email || '',
          parQRespostas: aluno.par_q_respostas,
          dataPreenchimento: aluno.created_at || ''
        });

      } catch (error) {
        console.error('💥 [ParQ] Erro inesperado:', error);
        Alert.alert('Erro', 'Erro inesperado ao carregar dados');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const formatParQDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Data não disponível';
    }
  };

  const getParQResponse = (respostas: ParQRespostas, questionIndex: number): boolean => {
    return respostas && respostas[questionIndex.toString() as keyof ParQRespostas] === true;
  };

  const hasAnyYesAnswer = (respostas: ParQRespostas): boolean => {
    if (!respostas) return false;
    for (let i = 0; i < 7; i++) {
      if (getParQResponse(respostas, i)) {
        return true;
      }
    }
    return false;
  };

  if (loading) {
    return <LoadingScreen message="Carregando dados PAR-Q..." />;
  }

  const parqRespostas: ParQRespostas = alunoData?.parQRespostas;
  const hasParQ = parqRespostas && typeof parqRespostas === 'object';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/alunos')}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>PAR-Q</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {alunoData && (
            <View style={styles.alunoCard}>
              <Text style={styles.alunoNome}>{alunoData.nomeCompleto}</Text>
              <Text style={styles.alunoEmail}>{alunoData.email}</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>PAR-Q</Text>
          <Text style={styles.sectionDescription}>
            Questionário de Prontidão para Atividade Física preenchido durante o cadastro.
          </Text>

          {hasParQ ? (
            <>
              {/* Data do preenchimento */}
              <View style={styles.parqInfoCard}>
                <Text style={styles.parqInfoLabel}>Data do Preenchimento:</Text>
                <Text style={styles.parqInfoValue}>
                  {formatParQDate(parqRespostas.data_preenchimento || alunoData?.dataPreenchimento || '')}
                </Text>
              </View>

              {/* Status geral */}
              <View style={[
                styles.statusCard, 
                hasAnyYesAnswer(parqRespostas) ? styles.statusCardWarning : styles.statusCardSafe
              ]}>
                <View style={styles.statusHeader}>
                  <Ionicons 
                    name={hasAnyYesAnswer(parqRespostas) ? "warning" : "checkmark-circle"} 
                    size={24} 
                    color={hasAnyYesAnswer(parqRespostas) ? "#F59E0B" : "#10B981"} 
                  />
                  <Text style={[
                    styles.statusText,
                    hasAnyYesAnswer(parqRespostas) ? styles.statusTextWarning : styles.statusTextSafe
                  ]}>
                    {hasAnyYesAnswer(parqRespostas) ? 'Atenção requerida' : 'Apto para atividade física'}
                  </Text>
                </View>
                <Text style={styles.statusDescription}>
                  {hasAnyYesAnswer(parqRespostas) 
                    ? 'Aluno respondeu SIM a uma ou mais perguntas. Recomenda-se consulta médica antes de iniciar atividades físicas intensas.'
                    : 'Aluno respondeu NÃO a todas as perguntas. Pode iniciar atividades físicas de intensidade leve a moderada.'
                  }
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Respostas</Text>

              {/* Renderizar as 7 perguntas */}
              {PAR_Q_QUESTIONS.map((question, index) => {
                const answer = getParQResponse(parqRespostas, index);
                return (
                  <View key={index} style={styles.parqQuestionCard}>
                    <Text style={styles.parqQuestion}>
                      {index + 1}. {question}
                    </Text>
                    <View style={[
                      styles.parqAnswer, 
                      answer ? styles.parqAnswerYes : styles.parqAnswerNo
                    ]}>
                      <Text style={styles.parqAnswerText}>
                        {answer ? 'SIM' : 'NÃO'}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {/* Observações se existirem */}
              {parqRespostas.observacoes && (
                <>
                  <Text style={styles.sectionTitle}>Observações</Text>
                  <View style={styles.observacoesCard}>
                    <Text style={styles.observacoesText}>{parqRespostas.observacoes}</Text>
                  </View>
                </>
              )}

              {/* Informações sobre o PAR-Q */}
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>💡 Sobre o PAR-Q:</Text>
                <Text style={styles.infoText}>
                  O PAR-Q (Physical Activity Readiness Questionnaire) é um questionário padronizado 
                  usado para identificar adultos que podem precisar de avaliação médica antes de 
                  iniciar um programa de exercícios.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyParqCard}>
              <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyParqTitle}>PAR-Q não preenchido</Text>
              <Text style={styles.emptyParqSubtitle}>
                Este aluno ainda não preencheu o questionário PAR-Q durante o onboarding.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  alunoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  alunoNome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alunoEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 20,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  parqInfoCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  parqInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  parqInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  statusCardSafe: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  statusCardWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusTextSafe: {
    color: '#059669',
  },
  statusTextWarning: {
    color: '#D97706',
  },
  statusDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  parqQuestionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  parqQuestion: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  parqAnswer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  parqAnswerYes: {
    backgroundColor: '#FEE2E2',
  },
  parqAnswerNo: {
    backgroundColor: '#D1FAE5',
  },
  parqAnswerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  observacoesCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  observacoesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  emptyParqCard: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyParqTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyParqSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});
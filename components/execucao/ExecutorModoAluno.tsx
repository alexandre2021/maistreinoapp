// components/execucao/ExecutorModoAluno.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SessaoData {
  id: string;
  rotina_id: string;
  treino_id: string;
  aluno_id: string;
  status: string;
  data_execucao: string;
  rotinas: any;
  treinos: any;
  alunos: any;
}

interface UserProfile {
  user_type: 'personal_trainer' | 'aluno';
  id: string;
  nome_completo: string;
}

interface Props {
  sessaoId: string;
  sessaoData: SessaoData;
  userProfile: UserProfile;
  onSessaoFinalizada: () => void;
}

export default function ExecutorModoAluno({ sessaoData }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modo Aluno</Text>
      <Text style={styles.subtitle}>Treino: {sessaoData.treinos.nome}</Text>
      <Text style={styles.info}>🚧 Interface em desenvolvimento</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 8,
    color: '#6B7280',
  },
  info: {
    fontSize: 16,
    color: '#8B5CF6',
    marginTop: 20,
    textAlign: 'center',
  },
});
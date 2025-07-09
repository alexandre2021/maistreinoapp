// components/executar-rotina/shared/ProgressoTreino.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  atual: number;
  total: number;
}

const ProgressoTreino = ({ atual, total }: Props) => {
  const progresso = total > 0 ? (atual / total) : 0;
  return (
    <View style={styles.container}>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBar, { width: `${progresso * 100}%` }]} />
      </View>
      <Text style={styles.label}>{atual} de {total} exercícios</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default ProgressoTreino;

// components/rotina/exercicios/EmptyState.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EmptyStateProps {
  treinoNome: string;
  onAddExercicio: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  treinoNome, 
  onAddExercicio 
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name="barbell-outline" size={40} color="#D1D5DB" />
      
      <Text style={styles.title}>Nenhum exercício adicionado</Text>
      
      <Text style={styles.subtitle}>
        Adicione exercícios para o {treinoNome}
      </Text>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={onAddExercicio}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.addButtonText}>Exercício</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A11E0A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
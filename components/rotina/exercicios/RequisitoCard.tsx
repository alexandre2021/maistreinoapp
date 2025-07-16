// components/rotina/exercicios/RequisitoCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useExerciciosContext } from '../../../context/ExerciciosContext';

interface RequisitoCardProps {
  // Props opcionais para customização
  showDetails?: boolean;
}

export const RequisitoCard: React.FC<RequisitoCardProps> = ({ 
  showDetails = true 
}) => {
  const {
    totalExercicios,
    treinosComExercicios,
    treinosSemExercicios,
    treinos
  } = useExerciciosContext();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        <Text style={styles.title}>Requisitos</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.requisitoItem}>
          • Adicione pelo menos 1 exercício em cada treino
        </Text>
        
        {showDetails && (
          <>
            {treinosComExercicios.length > 0 && (
              <Text style={[styles.requisitoItem, styles.requisitoSucesso]}>
                ✓ {treinosComExercicios.length} de {treinos.length} treino(s) configurado(s)
              </Text>
            )}

            {totalExercicios > 0 && (
              <Text style={[styles.requisitoItem, styles.requisitoInfo]}>
                🏋️ {totalExercicios} exercício(s) total
              </Text>
            )}

            {treinosSemExercicios.length > 0 && (
              <Text style={[styles.requisitoItem, styles.requisitoAlerta]}>
                ⚠️ {treinosSemExercicios.length} treino(s) ainda sem exercícios
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    gap: 6,
  },
  requisitoItem: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  requisitoSucesso: {
    color: '#059669',
    fontWeight: '500',
  },
  requisitoInfo: {
    color: '#1D4ED8',
    fontWeight: '500',
  },
  requisitoAlerta: {
    color: '#DC2626',
    fontWeight: '500',
  }
});
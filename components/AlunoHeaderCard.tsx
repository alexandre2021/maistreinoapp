// components/AlunoHeaderCard.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AlunoHeaderData {
  nomeCompleto: string;
  email: string;
  objetivoPrincipal?: string;
}

interface AlunoHeaderCardProps {
  alunoData: AlunoHeaderData;
  theme?: 'avaliacoes' | 'parq' | 'rotinas';
}

export default function AlunoHeaderCard({ alunoData, theme = 'avaliacoes' }: AlunoHeaderCardProps) {
  const getThemeColors = () => {
    switch (theme) {
      case 'avaliacoes':
        return {
          borderColor: '#8B5CF6', // Roxo
          textColor: '#8B5CF6',
        };
      case 'parq':
        return {
          borderColor: '#10B981', // Verde
          textColor: '#10B981',
        };
      case 'rotinas':
        return {
          borderColor: '#F59E0B', // Laranja/Amarelo
          textColor: '#F59E0B',
        };
      default:
        return {
          borderColor: '#8B5CF6',
          textColor: '#8B5CF6',
        };
    }
  };

  const colors = getThemeColors();

  return (
    <View style={[styles.alunoCard, { borderLeftColor: colors.borderColor }]}>
      <Text style={styles.alunoNome}>{alunoData.nomeCompleto}</Text>
      <Text style={styles.alunoEmail}>{alunoData.email}</Text>
      {alunoData.objetivoPrincipal && (
        <Text style={[styles.alunoObjetivo, { color: colors.textColor }]}>
          🎯 {alunoData.objetivoPrincipal}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  alunoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
  alunoObjetivo: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

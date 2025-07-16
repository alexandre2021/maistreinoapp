// app/avaliacoes/components/AlunoHeader.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AlunoHeaderData {
  nomeCompleto: string;
  email: string;
  objetivoPrincipal: string;
}

interface AlunoHeaderProps {
  alunoData: AlunoHeaderData;
}

export default function AlunoHeader({ alunoData }: AlunoHeaderProps) {
  return (
    <View style={styles.alunoCard}>
      <Text style={styles.alunoNome}>{alunoData.nomeCompleto}</Text>
      <Text style={styles.alunoEmail}>{alunoData.email}</Text>
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
    borderLeftColor: '#8B5CF6',
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
    color: '#8B5CF6',
    marginTop: 4,
    fontWeight: '500',
  },
});
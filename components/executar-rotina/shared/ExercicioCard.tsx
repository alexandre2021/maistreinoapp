// components/executar-rotina/shared/ExercicioCard.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Serie {
  numero_serie: number;
  repeticoes?: number;
  carga?: number;
  tem_dropset?: boolean;
}

interface Props {
  nome: string;
  series: Serie[];
  nomeCombinado?: string;
}

const ExercicioCard = ({ nome, series, nomeCombinado }: Props) => {
  return (
    <View style={styles.card}>
      <Text style={styles.nome}>{nomeCombinado ? `${nome} + ${nomeCombinado}` : nome}</Text>
      <View style={styles.seriesContainer}>
        {series.map((serie, idx) => (
          <View key={idx} style={styles.serieItem}>
            <Text style={styles.serieText}>
              Série {serie.numero_serie}: {serie.repeticoes} x {serie.carga}kg {serie.tem_dropset ? '(Dropset)' : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  nome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  seriesContainer: {
    gap: 8,
  },
  serieItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
  },
  serieText: {
    fontSize: 14,
    color: '#374151',
  },
});

export default ExercicioCard;

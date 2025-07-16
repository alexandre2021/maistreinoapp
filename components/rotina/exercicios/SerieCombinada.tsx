// components/rotina/exercicios/SerieCombinada.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useExerciciosContext } from '../../../context/ExerciciosContext';
import { ExercicioRotinaLocal, SerieConfig } from '../../../types/exercicio.types';

interface SerieCombinadaProps {
  serie: SerieConfig;
  exercicio: ExercicioRotinaLocal;
  treinoId: string;
  isUltimaSerie: boolean;
  isUltimoExercicio: boolean;
  onRemoverSerie?: () => void;
}

export const SerieCombinada: React.FC<SerieCombinadaProps> = ({
  serie,
  exercicio,
  treinoId,
  isUltimaSerie,
  isUltimoExercicio,
  onRemoverSerie
}) => {
  const {
    atualizarSerieCombinada,
    atualizarSerie
  } = useExerciciosContext();

  // ====================================
  // 🔥 CORREÇÃO DO BUG: HANDLERS PARA SÉRIES COMBINADAS
  // ====================================
  const handleAtualizarExercicio1 = (campo: 'repeticoes' | 'carga', valor: string) => {
    const valorNumerico = campo === 'repeticoes' 
      ? (valor === '' ? 12 : parseInt(valor) || 12)
      : (valor === '' ? 0 : parseFloat(valor) || 0);

    console.log('🔗 Atualizando exercício 1:', campo, '=', valorNumerico);
    atualizarSerieCombinada(treinoId, exercicio.id, serie.id, 0, campo, valorNumerico);
  };

  const handleAtualizarExercicio2 = (campo: 'repeticoes' | 'carga', valor: string) => {
    const valorNumerico = campo === 'repeticoes' 
      ? (valor === '' ? 12 : parseInt(valor) || 12)
      : (valor === '' ? 0 : parseFloat(valor) || 0);

    console.log('🔗 Atualizando exercício 2:', campo, '=', valorNumerico);
    atualizarSerieCombinada(treinoId, exercicio.id, serie.id, 1, campo, valorNumerico);
  };

  // ====================================
  // VALORES SEGUROS PARA OS INPUTS
  // ====================================
  const getValorSeguro = (valor: number | undefined, padrao: number): string => {
    return (valor !== undefined ? valor : padrao).toString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.serieHeader}>
        <Text style={styles.serieNumero}>{serie.numero}</Text>
        
        <View style={styles.exerciciosContainer}>
          {/* PRIMEIRO EXERCÍCIO */}
          {exercicio.exerciciosCombinados?.[0] && (
            <View style={styles.exercicioItem}>
              <Text style={styles.exercicioNome}>
                1. {exercicio.exerciciosCombinados[0].nome}
              </Text>
              <View style={styles.exercicioInputs}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Rep</Text>
                  <TextInput
                    style={styles.input}
                    value={getValorSeguro(serie.repeticoes_1, 12)}
                    onChangeText={(text) => handleAtualizarExercicio1('repeticoes', text)}
                    keyboardType="numeric"
                    maxLength={3}
                    placeholder="12"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Kg</Text>
                  <TextInput
                    style={styles.input}
                    value={getValorSeguro(serie.carga_1, 0)}
                    onChangeText={(text) => handleAtualizarExercicio1('carga', text)}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>
          )}

          {/* SEGUNDO EXERCÍCIO */}
          {exercicio.exerciciosCombinados?.[1] && (
            <View style={styles.exercicioItem}>
              <Text style={styles.exercicioNome}>
                2. {exercicio.exerciciosCombinados[1].nome}
              </Text>
              <View style={styles.exercicioInputs}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Rep</Text>
                  <TextInput
                    style={styles.input}
                    value={getValorSeguro(serie.repeticoes_2, 12)}
                    onChangeText={(text) => handleAtualizarExercicio2('repeticoes', text)}
                    keyboardType="numeric"
                    maxLength={3}
                    placeholder="12"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Kg</Text>
                  <TextInput
                    style={styles.input}
                    value={getValorSeguro(serie.carga_2, 0)}
                    onChangeText={(text) => handleAtualizarExercicio2('carga', text)}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* BOTÃO REMOVER SÉRIE */}
        {onRemoverSerie && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemoverSerie}
          >
            <Ionicons name="close" size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* BOTÃO ADICIONAR SÉRIE */}
      {/* Removido daqui para evitar duplicidade, o botão deve ser controlado pelo componente pai (exercicios.tsx) */}

      {/* INTERVALO ENTRE SÉRIES (igual ao da série simples, entre blocos de série combinada) */}
      {!isUltimaSerie && (
        <View style={styles.intervaloContainer}>
          <Ionicons name="time-outline" size={16} color="#2563EB" />
          <Text style={styles.intervaloLabel}>Intervalo entre séries:</Text>
          <TextInput
            style={styles.intervaloInput}
            value={getValorSeguro(serie.intervaloAposSerie, 90)}
            onChangeText={valor => atualizarSerie(treinoId, exercicio.id, serie.id, 'intervaloAposSerie', valor === '' ? 0 : parseInt(valor) || 0)}
            keyboardType="numeric"
            maxLength={3}
            placeholder="90"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.intervaloUnidade}>s</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  serieHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  serieNumero: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 20,
    marginTop: 8,
  },
  exerciciosContainer: {
    flex: 1,
    gap: 8,
  },
  exercicioItem: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  exercicioNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  exercicioInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'white',
    color: '#1F2937',
  },
  removeButton: {
    padding: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  addSerieButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F7FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  addSerieText: {
    fontSize: 14,
    color: '#A11E0A',
    fontWeight: '500',
  },
  intervaloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  intervaloLabel: {
    fontSize: 12,
    color: '#2563EB', // Azul escuro para contraste
    flex: 1,
    fontWeight: '600',
  },
  intervaloInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 6,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'white',
    width: 50,
  },
  intervaloUnidade: {
    fontSize: 12,
    color: '#6B7280',
  },
  intervaloExercicioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  intervaloExercicioLabel: {
    fontSize: 12,
    color: '#8B5CF6',
    flex: 1,
    fontWeight: '500',
  },
  intervaloExercicioInput: {
    borderWidth: 1,
    borderColor: '#C4B5FD',
    borderRadius: 6,
    padding: 6,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'white',
    width: 50,
  },
});
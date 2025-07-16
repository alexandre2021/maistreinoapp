// components/rotina/exercicios/SerieSimples.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useExerciciosContext } from '../../../context/ExerciciosContext';
import { ExercicioRotinaLocal, SerieConfig } from '../../../types/exercicio.types';

interface SeriesSimplesProps {
  serie: SerieConfig;
  exercicio: ExercicioRotinaLocal;
  treinoId: string;
  isUltimaSerie: boolean;
  isUltimoExercicio: boolean;
  onRemoverSerie?: () => void;
}

export const SerieSimples: React.FC<SeriesSimplesProps> = ({
  serie,
  exercicio,
  treinoId,
  isUltimaSerie,
  isUltimoExercicio,
  onRemoverSerie
}) => {
  const {
    atualizarSerie,
    toggleDropSet,
    atualizarDropSet
  } = useExerciciosContext();

  // ====================================
  // HANDLERS
  // ====================================
  const handleAtualizarRepeticoes = (valor: string) => {
    const repeticoes = valor === '' ? 12 : (parseInt(valor) || 12);
    console.log('🔍 Atualizando repetições:', valor, '->', repeticoes);
    atualizarSerie(treinoId, exercicio.id, serie.id, 'repeticoes', repeticoes);
  };

  const handleAtualizarCarga = (valor: string) => {
    const carga = parseFloat(valor) || 0;
    atualizarSerie(treinoId, exercicio.id, serie.id, 'carga', carga);
  };

  const handleToggleDropSet = () => {
    toggleDropSet(treinoId, exercicio.id, serie.id);
  };

  const handleAtualizarDropSetCarga = (valor: string) => {
    const carga = parseFloat(valor) || 0;
    atualizarDropSet(treinoId, exercicio.id, serie.id, 'cargaReduzida', carga);
  };

  const handleAtualizarIntervalo = (valor: string) => {
    // Se o campo ficar vazio, salva como 0
    const intervalo = valor === '' ? 0 : parseInt(valor) || 0;
    atualizarSerie(treinoId, exercicio.id, serie.id, 'intervaloAposSerie', intervalo);
  };

  // ====================================
  // VALORES SEGUROS
  // ====================================
  const getValorSeguro = (valor: number | undefined, padrao: number): string => {
    // Se o valor for undefined ou null, retorna o padrão (90 para intervalo entre séries)
    if (valor === undefined || valor === null) return padrao.toString();
    return valor.toString();
  };

  return (
    <View style={styles.container}>
      {/* LINHA PRINCIPAL DA SÉRIE */}
      <View style={styles.serieRow}>
        <Text style={styles.serieNumero}>{serie.numero}</Text>
        
        <View style={styles.serieInputs}>
          {/* REPETIÇÕES */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Rep</Text>
            <TextInput
              style={styles.input}
              value={getValorSeguro(serie.repeticoes, 12)}
              onChangeText={handleAtualizarRepeticoes}
              keyboardType="numeric"
              maxLength={3}
              placeholder="12"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* CARGA */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Carga (kg)</Text>
            <TextInput
              style={styles.input}
              value={getValorSeguro(serie.carga, 0)}
              onChangeText={handleAtualizarCarga}
              keyboardType="numeric"
              maxLength={6}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          {/* BOTÃO DROP SET */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Drop</Text>
            <TouchableOpacity
              style={[
                styles.dropButton,
                serie.isDropSet && styles.dropButtonActive
              ]}
              onPress={handleToggleDropSet}
            >
              {serie.isDropSet ? (
                <Text style={styles.dropButtonIcon}>🔥</Text>
              ) : (
                <Ionicons name="add" size={16} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>
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
      
      {/* DROP SET CONFIGURAÇÃO */}
      {serie.isDropSet && (
        <View style={styles.dropSetContainer}>
          <Text style={styles.dropSetHeader}>Drop 1</Text>
          <View style={styles.dropSetInputs}>
            <View style={styles.dropInputGroup}>
              <Text style={styles.dropInputLabel}>Reps</Text>
              <View style={styles.dropInputContainer}>
                <Text style={styles.dropInputPlaceholder}>Até a falha</Text>
              </View>
            </View>
            
            <View style={styles.dropInputGroup}>
              <Text style={styles.dropInputLabel}>Carga (kg)</Text>
              <TextInput
                style={styles.dropInput}
                value={getValorSeguro(serie.dropsConfig?.[0]?.cargaReduzida, 0)}
                onChangeText={handleAtualizarDropSetCarga}
                keyboardType="numeric"
                maxLength={6}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <TouchableOpacity
              style={styles.removeDropButton}
              onPress={handleToggleDropSet}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* INTERVALO ENTRE SÉRIES */}
      {!isUltimaSerie && (
        <View style={styles.intervaloContainer}>
          <Ionicons name="time-outline" size={16} color="#2563EB" />
          <Text style={styles.intervaloLabel}>Intervalo entre séries:</Text>
          <TextInput
            style={styles.intervaloInput}
            value={getValorSeguro(serie.intervaloAposSerie, 90)}
            onChangeText={handleAtualizarIntervalo}
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
    marginBottom: 8,
  },
  serieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serieNumero: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 20,
  },
  serieInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
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
  dropButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 8,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  dropButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  dropButtonIcon: {
    fontSize: 16,
  },
  removeButton: {
    padding: 4,
    alignSelf: 'flex-start',
    marginTop: 20,
  },
  dropSetContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  dropSetHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  dropSetInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropInputGroup: {
    flex: 1,
  },
  dropInputLabel: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
    fontWeight: '500',
  },
  dropInput: {
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'white',
    color: '#92400E',
  },
  dropInputContainer: {
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  dropInputPlaceholder: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  removeDropButton: {
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignSelf: 'flex-start',
    marginTop: 20,
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
});
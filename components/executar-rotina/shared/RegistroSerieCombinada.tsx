// components/executar-rotina/shared/RegistroSerieCombinada.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Props {
  numero: number;
  exercicio1Nome: string;
  exercicio2Nome: string;
  repeticoes1?: number;
  carga1?: number;
  repeticoes2?: number;
  carga2?: number;
  initialReps1?: number;
  initialCarga1?: number;
  initialReps2?: number;
  initialCarga2?: number;
  initialObs?: string;
  executada?: boolean;
  onSave: (reps1: number, carga1: number, reps2: number, carga2: number, obs: string) => void;
}

const RegistroSerieCombinada = ({ 
  numero, 
  exercicio1Nome, 
  exercicio2Nome,
  repeticoes1 = 0, 
  carga1 = 0,
  repeticoes2 = 0,
  carga2 = 0,
  initialReps1 = 0, 
  initialCarga1 = 0,
  initialReps2 = 0,
  initialCarga2 = 0,
  initialObs = '',
  executada = false,
  onSave 
}: Props) => {
  const [reps1, setReps1] = useState(initialReps1 || repeticoes1 || 0);
  const [peso1, setPeso1] = useState(initialCarga1 || carga1 || 0);
  const [reps2, setReps2] = useState(initialReps2 || repeticoes2 || 0);
  const [peso2, setPeso2] = useState(initialCarga2 || carga2 || 0);
  const [obs, setObs] = useState(initialObs);

  const handleSave = () => {
    onSave(reps1, peso1, reps2, peso2, obs);
  };

  return (
    <View style={[styles.container, executada && styles.containerExecutada]}>
      {/* Header da Série */}
      <View style={styles.serieHeader}>
        <Text style={styles.serieNumero}>Série {numero}</Text>
        <Text style={styles.serieStatus}>
          {executada ? 'Finalizada' : 'Planejada'}
        </Text>
      </View>

      {/* Exercício 1 */}
      <View style={styles.exercicioItem}>
        <Text style={styles.exercicioNome}>{exercicio1Nome}</Text>
        <Text style={styles.exercicioPlanejado}>
          {repeticoes1} x {carga1}kg
        </Text>
        <View style={styles.inputsRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Repetições</Text>
            <TextInput
              style={styles.input}
              value={reps1.toString()}
              onChangeText={t => setReps1(parseInt(t) || 0)}
              keyboardType="numeric"
              placeholder="0"
              editable={!executada}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Carga (kg)</Text>
            <TextInput
              style={styles.input}
              value={peso1.toString()}
              onChangeText={t => setPeso1(parseInt(t) || 0)}
              keyboardType="numeric"
              placeholder="0"
              editable={!executada}
            />
          </View>
        </View>
      </View>

      {/* Separador */}
      <View style={styles.separador}>
        <Text style={styles.separadorTexto}>+</Text>
      </View>

      {/* Exercício 2 */}
      <View style={styles.exercicioItem}>
        <Text style={styles.exercicioNome}>{exercicio2Nome}</Text>
        <Text style={styles.exercicioPlanejado}>
          {repeticoes2} x {carga2}kg
        </Text>
        <View style={styles.inputsRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Repetições</Text>
            <TextInput
              style={styles.input}
              value={reps2.toString()}
              onChangeText={t => setReps2(parseInt(t) || 0)}
              keyboardType="numeric"
              placeholder="0"
              editable={!executada}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Carga (kg)</Text>
            <TextInput
              style={styles.input}
              value={peso2.toString()}
              onChangeText={t => setPeso2(parseInt(t) || 0)}
              keyboardType="numeric"
              placeholder="0"
              editable={!executada}
            />
          </View>
        </View>
      </View>

      {/* Observações */}
      <View style={styles.observacoesContainer}>
        <Text style={styles.label}>Observações</Text>
        <TextInput
          style={styles.obsInput}
          value={obs}
          onChangeText={setObs}
          placeholder="Observações sobre a série combinada..."
          multiline
          editable={!executada}
        />
      </View>

      {/* Botão Salvar */}
      {!executada && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Finalizar Série Combinada</Text>
        </TouchableOpacity>
      )}

      {/* Status quando executada */}
      {executada && (
        <View style={styles.executadaStatus}>
          <Text style={styles.executadaText}>✅ Série Combinada Finalizada</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  containerExecutada: {
    backgroundColor: '#F3F4F6',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  serieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  serieNumero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  serieStatus: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  exercicioItem: {
    marginBottom: 12,
  },
  exercicioNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  exercicioPlanejado: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 16,
    color: '#374151',
  },
  separador: {
    alignItems: 'center',
    marginVertical: 8,
  },
  separadorTexto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  observacoesContainer: {
    marginTop: 12,
  },
  obsInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  executadaStatus: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  executadaText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default RegistroSerieCombinada;
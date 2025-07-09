// components/executar-rotina/shared/RegistroSerie.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Props {
  numero: number;
  repeticoes?: number;
  carga?: number;
  onSave: (repeticoes: number, carga: number, observacoes: string) => void;
  initialReps?: number;
  initialCarga?: number;
  initialObs?: string;
}

const RegistroSerie = ({ numero, repeticoes, carga, onSave, initialReps = 0, initialCarga = 0, initialObs = '' }: Props) => {
  const [reps, setReps] = useState(initialReps || repeticoes || 0);
  const [peso, setPeso] = useState(initialCarga || carga || 0);
  const [obs, setObs] = useState(initialObs);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Série {numero}</Text>
      <View style={styles.inputsRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Repetições</Text>
          <TextInput
            style={styles.input}
            value={reps.toString()}
            onChangeText={t => setReps(parseInt(t) || 0)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Carga (kg)</Text>
          <TextInput
            style={styles.input}
            value={peso.toString()}
            onChangeText={t => setPeso(parseInt(t) || 0)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      </View>
      <Text style={styles.label}>Observações</Text>
      <TextInput
        style={styles.obsInput}
        value={obs}
        onChangeText={setObs}
        placeholder="Observações sobre a série..."
        multiline
      />
      <TouchableOpacity style={styles.saveButton} onPress={() => onSave(reps, peso, obs)}>
        <Text style={styles.saveButtonText}>Salvar Série</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    marginBottom: 4,
  },
  obsInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 48,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default RegistroSerie;

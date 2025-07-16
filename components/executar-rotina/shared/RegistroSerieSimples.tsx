// components/executar-rotina/shared/RegistroSerieSimples.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Props {
  numero: number;
  repeticoes?: number;
  carga?: number;
  temDropset?: boolean;
  cargaDropset?: number;
  initialReps?: number;
  initialCarga?: number;
  initialDropsetReps?: number;
  initialDropsetCarga?: number;
  initialObs?: string;
  executada?: boolean;
  onSave: (reps: number, carga: number, dropsetReps?: number, dropsetCarga?: number, obs?: string) => void;
}

const RegistroSerieSimples = ({ 
  numero, 
  repeticoes = 0, 
  carga = 0,
  temDropset = false,
  cargaDropset = 0,
  initialReps = 0, 
  initialCarga = 0,
  initialDropsetReps = 0,
  initialDropsetCarga = 0,
  initialObs = '',
  executada = false,
  onSave 
}: Props) => {
  // Estados temporários para inputs
  const [inputReps, setInputReps] = useState(initialReps?.toString() || repeticoes?.toString() || '');
  const [inputCarga, setInputCarga] = useState(initialCarga?.toString() || carga?.toString() || '');
  const [inputDropsetReps, setInputDropsetReps] = useState(initialDropsetReps?.toString() || '');
  const [inputDropsetCarga, setInputDropsetCarga] = useState(initialDropsetCarga?.toString() || cargaDropset?.toString() || '');
  const [obs, setObs] = useState(initialObs);

  // Custom hook para debounce
  function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number) {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cbRef = useRef(callback);
    cbRef.current = callback;

    const debounced = useCallback((...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        cbRef.current(...args);
      }, delay);
    }, [delay]);

    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
    return debounced;
  }

  // Função debounced para atualização automática
  const debouncedUpdate = useDebouncedCallback(() => {
    if (!executada) {
      const reps = parseInt(inputReps) || 0;
      const peso = parseInt(inputCarga) || 0;
      const dropsetReps = temDropset ? (parseInt(inputDropsetReps) || 0) : undefined;
      const dropsetPeso = temDropset ? (parseInt(inputDropsetCarga) || 0) : undefined;
      
      // Só dispara se houver valores válidos
      if (reps > 0 || peso > 0) {
        onSave(reps, peso, dropsetReps, dropsetPeso, obs);
      }
    }
  }, 500);

  // Disparar debounce quando inputs mudarem
  useEffect(() => {
    debouncedUpdate();
  }, [inputReps, inputCarga, inputDropsetReps, inputDropsetCarga, obs, debouncedUpdate]);

  const handleFinalizarSerie = () => {
    const reps = parseInt(inputReps) || 0;
    const peso = parseInt(inputCarga) || 0;
    const dropsetReps = temDropset ? (parseInt(inputDropsetReps) || 0) : undefined;
    const dropsetPeso = temDropset ? (parseInt(inputDropsetCarga) || 0) : undefined;
    
    onSave(reps, peso, dropsetReps, dropsetPeso, obs);
  };

  return (
    <View style={[styles.container, executada && styles.containerExecutada, temDropset && styles.containerDropset]}>
      {/* Header da Série */}
      <View style={styles.serieHeader}>
        <Text style={styles.serieNumero}>Série {numero}</Text>
        <View style={styles.serieInfo}>
          <Text style={styles.seriePlanejada}>
            {repeticoes} x {carga}kg
          </Text>
          {temDropset && (
            <Text style={styles.dropsetBadgeText}>• DROPSET</Text>
          )}
        </View>
      </View>

      {/* Inputs principais */}
      <View style={styles.serieInputs}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Repetições executadas</Text>
          <TextInput
            style={styles.input}
            value={inputReps}
            onChangeText={setInputReps}
            keyboardType="numeric"
            placeholder="0"
            editable={!executada}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Carga executada (kg)</Text>
          <TextInput
            style={styles.input}
            value={inputCarga}
            onChangeText={setInputCarga}
            keyboardType="numeric"
            placeholder="0"
            editable={!executada}
          />
        </View>
      </View>

      {/* Seção Dropset */}
      {temDropset && (
        <View style={styles.dropsetSection}>
          <View style={styles.dropsetHeader}>
            <Text style={styles.dropsetLabel}>Dropset</Text>
            <Text style={styles.dropsetInfo}>
              {repeticoes} x {cargaDropset}kg
            </Text>
          </View>
          
          <View style={styles.serieInputs}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Repetições dropset</Text>
              <TextInput
                style={[styles.input, styles.inputDropset]}
                value={inputDropsetReps}
                onChangeText={setInputDropsetReps}
                keyboardType="numeric"
                placeholder="0"
                editable={!executada}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Carga dropset (kg)</Text>
              <TextInput
                style={[styles.input, styles.inputDropset]}
                value={inputDropsetCarga}
                onChangeText={setInputDropsetCarga}
                keyboardType="numeric"
                placeholder="0"
                editable={!executada}
              />
            </View>
          </View>
        </View>
      )}

      {/* Observações */}
      <View style={styles.observacoesContainer}>
        <Text style={styles.inputLabel}>Observações</Text>
        <TextInput
          style={styles.obsInput}
          value={obs}
          onChangeText={setObs}
          placeholder="Observações sobre a série..."
          multiline
          editable={!executada}
        />
      </View>

      {/* Botão Finalizar ou Status */}
      {!executada ? (
        <TouchableOpacity style={styles.finalizarButton} onPress={handleFinalizarSerie}>
          <Text style={styles.finalizarButtonText}>Finalizar Série</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.executadaStatus}>
          <Text style={styles.executadaText}>✅ Série Finalizada</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
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
  containerDropset: {
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
  },
  serieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serieNumero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  serieInfo: {
    alignItems: 'flex-end',
  },
  seriePlanejada: {
    fontSize: 14,
    color: '#6B7280',
  },
  dropsetBadgeText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  serieInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  inputGroup: {
    flex: 1,
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
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
  dropsetSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  dropsetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dropsetLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  dropsetInfo: {
    fontSize: 14,
    color: '#3B82F6',
  },
  inputDropset: {
    borderColor: '#3B82F6',
    borderWidth: 1,
    backgroundColor: '#F8FAFC',
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
  finalizarButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  finalizarButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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

export default RegistroSerieSimples;
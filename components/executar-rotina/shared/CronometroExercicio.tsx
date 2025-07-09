import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
  intervaloExercicio: number | null; // Valor da coluna intervalo_apos_exercicio
  exercicioAtual: string;
  proximoExercicio: string;
}

const CronometroExercicio = ({
  visible,
  onClose,
  onComplete,
  intervaloExercicio,
  exercicioAtual,
  proximoExercicio
}: Props) => {
  const [tempo, setTempo] = useState<number>(0);
  const [iniciado, setIniciado] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ 1. Atualiza o tempo quando o modal abre
  useEffect(() => {
    if (visible && intervaloExercicio !== null && intervaloExercicio > 0) {
      setTempo(intervaloExercicio);
      setIniciado(true);
    } else if (!visible) {
      // Reset quando fecha
      setIniciado(false);
      setTempo(0);
    }
  }, [visible, intervaloExercicio]);

  // ✅ 2. Contagem regressiva precisa
  useEffect(() => {
    if (!visible || !iniciado || tempo <= 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setTimeout(() => {
      setTempo((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, iniciado, tempo]);

  // ✅ 3. Dispara onComplete APENAS quando chegou a 0 após iniciar
  useEffect(() => {
    if (tempo === 0 && visible && iniciado) {
      onComplete?.();
    }
  }, [tempo, visible, iniciado, onComplete]);

  // ✅ Não renderiza se não estiver visível
  if (!visible) {
    return null;
  }

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <Text style={styles.title}>Intervalo entre exercícios</Text>
        
        <View style={styles.exercicioInfo}>
          <Text style={styles.exercicioLabel}>Exercício atual:</Text>
          <Text style={styles.exercicioNome}>{exercicioAtual}</Text>
        </View>

        <Text style={styles.timer}>{formatarTempo(tempo)}</Text>

        <View style={styles.exercicioInfo}>
          <Text style={styles.exercicioLabel}>Próximo:</Text>
          <Text style={styles.exercicioNome}>{proximoExercicio}</Text>
        </View>

        <TouchableOpacity style={styles.buttonClose} onPress={onClose}>
          <Text style={styles.buttonText}>Pular intervalo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999,
    elevation: 999999,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    elevation: 1000000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#3B82F6',
    textAlign: 'center',
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
    marginVertical: 20,
  },
  exercicioInfo: {
    marginBottom: 10,
    width: '100%',
  },
  exercicioLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  exercicioNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  buttonClose: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default CronometroExercicio;
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
  intervaloSerie: number | null; // ✅ Obrigatório (vindo direto da série)
}

const CronometroSerie = ({ visible, onClose, onComplete, intervaloSerie }: Props) => {
  const [tempo, setTempo] = useState<number>(0);
  const [iniciado, setIniciado] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ 1. Atualiza o tempo quando o modal abre
  useEffect(() => {
    if (visible && intervaloSerie !== null && intervaloSerie > 0) {
      setTempo(intervaloSerie);
      setIniciado(true);
    } else if (!visible) {
      // Reset quando fecha
      setIniciado(false);
      setTempo(0);
    }
  }, [visible, intervaloSerie]);

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
        <Text style={styles.title}>Intervalo entre séries</Text>
        <Text style={styles.timer}>{formatarTempo(tempo)}</Text>
        <TouchableOpacity style={styles.buttonClose} onPress={onClose}>
          <Text style={styles.buttonText}>Pular intervalo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ✅ Estilos com Position Absolute
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
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    elevation: 1000000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#3B82F6',
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
  },
  buttonClose: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default CronometroSerie;
import {
    CheckCircle2,
    Pause,
    Play,
    Trash2,
    X
} from 'lucide-react-native';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface RotinaOptionsModalProps {
  visible: boolean;
  rotina: {
    id: string;
    nome: string;
    status: string;
  } | null;
  onClose: () => void;
  onTreinar: () => void;
  onAtivar: () => void;
  onPausar: () => void;
  onExcluir: () => void;
}

export function RotinaOptionsModal({
  visible,
  rotina,
  onClose,
  onTreinar,
  onAtivar,
  onPausar,
  onExcluir
}: RotinaOptionsModalProps) {
  if (!rotina) return null;

  const isActive = rotina.status === 'Ativa';
  const isPaused = rotina.status === 'Pausada';
  const isAguardando = rotina.status === 'Aguardando pagamento';
  // const isCompleted = rotina.status === 'Concluída';

  const options: {
    icon: any;
    label: string;
    description: string;
    onPress: () => void;
    color: string;
  }[] = [];

  if (isAguardando) {
    options.push({
      icon: CheckCircle2,
      label: 'Ativar',
      description: 'Ativar rotina para liberar treinos',
      onPress: onAtivar,
      color: '#2563EB',
    });
    options.push({
      icon: Trash2,
      label: 'Excluir',
      description: 'Remover esta rotina',
      onPress: onExcluir,
      color: '#EF4444',
    });
  } else if (isActive) {
    options.push({
      icon: Play,
      label: 'Treinar',
      description: 'Iniciar treino e acompanhar progresso',
      onPress: onTreinar,
      color: '#10B981',
    });
    options.push({
      icon: Pause,
      label: 'Pausar',
      description: 'Pausar esta rotina',
      onPress: onPausar,
      color: '#F59E0B',
    });
    options.push({
      icon: Trash2,
      label: 'Excluir',
      description: 'Remover esta rotina',
      onPress: onExcluir,
      color: '#EF4444',
    });
  } else if (isPaused) {
    options.push({
      icon: CheckCircle2,
      label: 'Ativar',
      description: 'Reativar esta rotina',
      onPress: onAtivar,
      color: '#2563EB',
    });
    options.push({
      icon: Trash2,
      label: 'Excluir',
      description: 'Remover esta rotina',
      onPress: onExcluir,
      color: '#EF4444',
    });
  }
  // Se for concluída, não mostra opções

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{rotina.nome}</Text>
              <Text style={styles.subtitle}>Status: {rotina.status}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {options.length === 0 ? (
              <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 16 }}>Nenhuma ação disponível para esta rotina.</Text>
            ) : (
              options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionItem}
                  onPress={option.onPress}
                >
                  <View style={[styles.optionIcon, { backgroundColor: `${option.color}15` }]}> 
                    <option.icon size={24} color={option.color} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
});

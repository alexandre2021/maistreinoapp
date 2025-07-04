// components/ExercicioDetailsModal.tsx
import { Play, X } from 'lucide-react-native';
import React from 'react';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Exercicio } from '../types/Exercicio';

interface ExercicioDetailsModalProps {
  visible: boolean;
  exercicio: Exercicio | null;
  onClose: () => void;
}

export const ExercicioDetailsModal: React.FC<ExercicioDetailsModalProps> = ({
  visible,
  exercicio,
  onClose
}) => {
  if (!exercicio) return null;

  const getDifficultyColor = (dificuldade: string) => {
    switch (dificuldade) {
      case 'Baixa':
        return '#10B981';
      case 'Média':
        return '#F59E0B';
      case 'Alta':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessible={false}
      importantForAccessibility="no"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{exercicio.nome}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Imagem/Vídeo */}
            {exercicio.imagem_1_url && (
              <View style={styles.mediaContainer}>
                <Image 
                  source={{ uri: exercicio.imagem_1_url }}
                  style={styles.exerciseImage}
                  resizeMode="cover"
                />
                {(exercicio.video_url || exercicio.youtube_url) && (
                  <TouchableOpacity style={styles.playButton}>
                    <Play size={32} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Segunda imagem se existir */}
            {exercicio.imagem_2_url && (
              <View style={styles.mediaContainer}>
                <Image 
                  source={{ uri: exercicio.imagem_2_url }}
                  style={styles.exerciseImage}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Informações básicas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações Gerais</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Grupo Muscular:</Text>
                <Text style={styles.infoValue}>{exercicio.grupo_muscular}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Equipamento:</Text>
                <Text style={styles.infoValue}>{exercicio.equipamento}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dificuldade:</Text>
                <View style={[
                  styles.difficultyBadge, 
                  { backgroundColor: getDifficultyColor(exercicio.dificuldade) }
                ]}>
                  <Text style={styles.difficultyText}>
                    {exercicio.dificuldade}
                  </Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tipo:</Text>
                <View style={[
                  styles.typeBadge,
                  { backgroundColor: exercicio.tipo === 'padrao' ? '#EFF6FF' : '#F0FDF4' }
                ]}>
                  <Text style={[
                    styles.typeText,
                    { color: exercicio.tipo === 'padrao' ? '#3B82F6' : '#10B981' }
                  ]}>
                    {exercicio.tipo === 'padrao' ? 'Padrão' : 'Personalizado'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Descrição */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descrição</Text>
              <Text style={styles.description}>{exercicio.descricao}</Text>
            </View>

            {/* Instruções */}
            {exercicio.instrucoes && exercicio.instrucoes.trim() !== '' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Como Executar</Text>
                <Text style={styles.instructionsText}>{exercicio.instrucoes}</Text>
              </View>
            )}

            {/* Informações de criação */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações Adicionais</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Criado em:</Text>
                <Text style={styles.infoValue}>{formatDate(exercicio.created_at)}</Text>
              </View>
              
              {exercicio.youtube_url && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>YouTube:</Text>
                  <Text style={styles.infoValue}>Disponível</Text>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={[styles.infoValue, { color: exercicio.is_ativo ? '#10B981' : '#EF4444' }]}>
                  {exercicio.is_ativo ? 'Ativo' : 'Inativo'}
                </Text>
              </View>
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

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
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  mediaContainer: {
    position: 'relative',
    margin: 20,
    marginBottom: 0,
  },
  exerciseImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  instructionsText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 20,
  },
});
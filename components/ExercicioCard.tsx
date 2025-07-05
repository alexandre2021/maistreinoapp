// components/ExercicioCard.tsx
import { Dumbbell, MoreVertical } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Exercicio } from '../types/Exercicio';

interface ExercicioCardProps {
  exercicio: Exercicio;
  onPress: () => void;
  onOptionsPress: () => void;
}

export const ExercicioCard: React.FC<ExercicioCardProps> = ({
  exercicio,
  onPress,
  onOptionsPress
}) => {
  const renderImage = () => {
    if (exercicio.imagem_1_url) {
      return (
        <Image 
          source={{ uri: exercicio.imagem_1_url }}
          style={styles.exerciseImage}
        />
      );
    }

    return (
      <View style={styles.placeholderImage}>
        <Dumbbell size={24} color="#6B7280" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {renderImage()}
          
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {exercicio.nome}
            </Text>
            
            <Text style={styles.description} numberOfLines={2}>
              {exercicio.descricao}
            </Text>
            
            <View style={styles.tagsContainer}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{exercicio.grupo_muscular}</Text>
              </View>
              
              <View style={styles.tag}>
                <Text style={styles.tagText}>{exercicio.equipamento}</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.optionsButton}
          onPress={onOptionsPress}
        >
          <MoreVertical size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  optionsButton: {
    padding: 4,
  },
});
// components/AlunoCard.tsx
import { CheckCircle, Clock, MoreVertical } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Aluno } from '../types/Aluno';

interface AlunoCardProps {
  aluno: Aluno;
  onPress: () => void;
  onOptionsPress: () => void;
}

export const AlunoCard: React.FC<AlunoCardProps> = ({
  aluno,
  onPress,
  onOptionsPress
}) => {
  const renderAvatar = () => {
    if (aluno.avatar_type === 'image' && aluno.avatar_image_url) {
      return (
        <Image 
          source={{ uri: aluno.avatar_image_url }}
          style={styles.avatarImage}
        />
      );
    }

    return (
      <View style={[styles.avatarLetter, { backgroundColor: aluno.avatar_color }]}>
        <Text style={styles.avatarLetterText}>
          {aluno.avatar_letter}
        </Text>
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {renderAvatar()}
          
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {aluno.nome_completo}
            </Text>
            
            <Text style={styles.email} numberOfLines={1}>
              {aluno.email}
            </Text>
            
            <View style={styles.statusContainer}>
              {aluno.onboarding_completo ? (
                <>
                  <CheckCircle size={14} color="#10B981" />
                  <Text style={[styles.status, styles.statusActive]}>
                    Ativo
                  </Text>
                </>
              ) : (
                <>
                  <Clock size={14} color="#F59E0B" />
                  <Text style={[styles.status, styles.statusPending]}>
                    Pendente
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.joinDate}>
            {formatDate(aluno.created_at)}
          </Text>
          
          <TouchableOpacity 
            style={styles.optionsButton}
            onPress={onOptionsPress}
          >
            <MoreVertical size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
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
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarLetter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetterText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusActive: {
    color: '#10B981',
  },
  statusPending: {
    color: '#F59E0B',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 48,
  },
  joinDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  optionsButton: {
    padding: 4,
  },
});
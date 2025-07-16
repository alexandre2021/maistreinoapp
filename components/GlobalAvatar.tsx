import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface GlobalAvatarProps {
  uri?: string;
  size?: number;
  onPress?: () => void;
  letter?: string;
  color?: string;
}

// Exemplo de uso:
// <GlobalAvatar uri={user.avatarUrl} onPress={() => navigation.navigate('Perfil')} />
export const GlobalAvatar: React.FC<GlobalAvatarProps> = ({ uri, size = 40, onPress, letter, color }) => {
  // Função para determinar cor do texto
  const getTextColor = (bgColor: string) => {
    const lightColors = ['#86EFAC', '#FDE047', '#F3E8FF', '#E5E7EB', '#FED7AA', '#7DD3FC', '#B3F5FC', '#BEF264', '#FBBF24', '#FB7185'];
    return lightColors.includes(bgColor) ? '#1F2937' : 'white';
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1} style={[styles.avatarWrapper, { width: size, height: size, borderRadius: size / 2, backgroundColor: color || '#E5E7EB' }]}> 
      {uri ? (
        <Image
          source={uri}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={400}
          placeholder={{ uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeDsiOTI5IiB5PSI4Ij4KPHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDRTOS43OSAxMiAxMiAxMnptMCA2Yy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4KPC9zdmc+' }}
          placeholderContentFit="cover"
        />
      ) : letter ? (
        <Text style={{
          color: getTextColor(color || '#E5E7EB'),
          fontSize: size * 0.48,
          fontWeight: '700',
          textAlign: 'center',
          textTransform: 'uppercase',
        }}>{letter}</Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  avatarWrapper: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

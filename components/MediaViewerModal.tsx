// components/MediaViewerModal.tsx
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface MediaViewerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  imageUrl: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const MediaViewerModal = ({ visible, onClose, title, imageUrl }: MediaViewerModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset states when modal opens
  React.useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      accessible={false}
      importantForAccessibility="no"
    >
      <StatusBar backgroundColor="transparent" barStyle="dark-content" />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          
          {/* Header simplificado */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color="#000000" />
            </TouchableOpacity>
            
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          </View>

          {/* Container da imagem */}
          <View style={styles.imageContainer}>
            {/* Loading indicator */}
            {isLoading && !hasError && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#666666" />
                <Text style={styles.loadingText}>
                  Carregando imagem...
                </Text>
              </View>
            )}

            {/* Error state */}
            {hasError && (
              <View style={styles.errorContainer}>
                <Ionicons name="image-outline" size={80} color="#9CA3AF" />
                <Text style={styles.errorText}>
                  Não foi possível carregar a imagem
                </Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => {
                    setHasError(false);
                    setIsLoading(true);
                  }}
                >
                  <Text style={styles.retryButtonText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Imagem principal */}
            {!hasError && (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                contentFit="contain"
                transition={300}
                onLoadStart={() => {
                  setIsLoading(true);
                  setHasError(false);
                }}
                onLoadEnd={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                cachePolicy="memory-disk"
                priority="high"
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  image: {
    width: screenWidth,
    height: screenHeight - 120,
    maxWidth: '100%',
    maxHeight: '100%',
  },
});
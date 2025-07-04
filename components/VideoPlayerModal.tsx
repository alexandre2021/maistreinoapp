// components/VideoPlayerModal.tsx
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VideoPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  videoUrl: string;
}

export const VideoPlayerModal = ({ visible, onClose, title, videoUrl }: VideoPlayerModalProps) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']} // Permite rotação
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={30} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </View>
          
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              style={styles.video}
              source={{ uri: videoUrl }}
              useNativeControls // Usa os controlos nativos do sistema (play, pause, volume, tela cheia)
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              onPlaybackStatusUpdate={statusUpdate => setStatus(() => statusUpdate)}
            />
             {status.isBuffering && (
                <ActivityIndicator style={StyleSheet.absoluteFill} color="#FFFFFF" size="large" />
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
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 46, // Para centralizar o título corretamente
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  video: {
    alignSelf: 'center',
    width: '100%',
    height: '100%',
  },
});

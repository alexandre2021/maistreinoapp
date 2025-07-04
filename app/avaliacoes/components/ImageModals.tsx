// app/avaliacoes/components/ImageModals.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ImageModalsProps {
  // Modal de Opções de Imagem
  showImageOptions: boolean;
  onCloseImageOptions: () => void;
  onPickFromCamera: () => void;
  onPickFromGallery: () => void;

  // Modal de Preview de Imagem
  showImagePreview: boolean;
  previewImageUri: string | null;
  onCloseImagePreview: () => void;
}

export default function ImageModals({
  showImageOptions,
  onCloseImageOptions,
  onPickFromCamera,
  onPickFromGallery,
  showImagePreview,
  previewImageUri,
  onCloseImagePreview
}: ImageModalsProps) {
  return (
    <>
      {/* Modal de Opções de Imagem */}
      <Modal visible={showImageOptions} transparent animationType="fade" accessible={false} importantForAccessibility="no">
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onCloseImageOptions}
        >
          <View style={styles.imageOptionsModal}>
            <TouchableOpacity
              style={styles.imageOption}
              onPress={() => {
                onCloseImageOptions();
                onPickFromCamera();
              }}
            >
              <Ionicons name="camera" size={24} color="#007AFF" />
              <Text style={styles.imageOptionText}>Tirar Foto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.imageOption}
              onPress={() => {
                onCloseImageOptions();
                onPickFromGallery();
              }}
            >
              <Ionicons name="images" size={24} color="#007AFF" />
              <Text style={styles.imageOptionText}>Escolher da Galeria</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.imageOption, styles.cancelOption]}
              onPress={onCloseImageOptions}
            >
              <Text style={styles.cancelOptionText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Preview de Imagem */}
      <Modal visible={showImagePreview && !!previewImageUri} transparent animationType="fade" accessible={false} importantForAccessibility="no">
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity
            style={styles.imagePreviewClose}
            onPress={onCloseImagePreview}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          {previewImageUri && (
            <Image 
              source={{ uri: previewImageUri }} 
              style={styles.imagePreviewFull}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Adicionado zIndex alto
  },
  imageOptionsModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingVertical: 8,
    zIndex: 1001, // Adicionado zIndex
  },
  imageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  imageOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  cancelOption: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    justifyContent: 'center',
  },
  cancelOptionText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000, // zIndex muito alto para garantir que fique sobre todas as outras modais
  },
  imagePreviewClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 2001, // zIndex ainda maior para o botão de fechar
    padding: 10,
  },
  imagePreviewFull: {
    width: '90%',
    height: '70%',
  },
});
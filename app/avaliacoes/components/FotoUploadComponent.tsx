// app/avaliacoes/components/FotoUploadComponent.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FotoUploadComponentProps {
  label: string;
  uri?: string | null;
  onUpload: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export default function FotoUploadComponent({
  label,
  uri,
  onUpload,
  onDelete,
  disabled = false
}: FotoUploadComponentProps) {
  
  // ✅ FUNÇÃO SIMPLIFICADA - Remove direto sem confirmação
  const handleDelete = () => {
    console.log(`🗑️ [FotoUploadComponent] Removendo foto ${label} diretamente`);
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {uri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri }} style={styles.image} />
          
          {/* ✅ MUDANÇA: Só mostra botão de deletar, SEM câmera */}
          <View style={styles.imageOverlay}>
            {/* ✅ Botão de deletar foto - ÚNICO botão quando tem foto */}
            {onDelete && (
              <TouchableOpacity
                style={[styles.overlayButton, styles.deleteButton]}
                onPress={handleDelete}
                disabled={disabled}
              >
                <Ionicons name="trash" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={onUpload}
          disabled={disabled}
        >
          <Ionicons name="camera" size={32} color="#9CA3AF" />
          <Text style={styles.uploadText}>Adicionar Foto</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  overlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  // ✅ REMOVIDO: changeButton já que não usamos mais
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  uploadButton: {
    height: 120,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});
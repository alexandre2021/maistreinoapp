import * as ImagePicker from 'expo-image-picker';
import { Camera, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface PersonalTrainerData {
  id: string;
  nome_completo: string;
  avatar_letter: string;
  avatar_color: string;
  avatar_type: 'letter' | 'image';
  avatar_image_url: string | null;
  codigo_pt?: string;
}

interface AvatarSectionProps {
  userData: PersonalTrainerData | null;
  uploading: boolean;
  onUpload: (uri: string) => Promise<void>;
  onColorChange: (color: string) => Promise<void>;
  onSwitchToLetter: () => Promise<void>;
  userType?: 'personal_trainer' | 'aluno';
  showCodigoPT?: boolean;
}

const AvatarSection: React.FC<AvatarSectionProps> = ({
  userData,
  uploading,
  onUpload,
  onColorChange,
  onSwitchToLetter,
  userType = 'personal_trainer',
  showCodigoPT = false
}) => {
  const [localUploading, setLocalUploading] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);

  // Early return se userData for null
  if (!userData) {
    return (
      <View style={styles.profileSection}>
        <Text>Carregando dados do usuário...</Text>
      </View>
    );
  }

  // Paleta de cores completa
  const avatarColors = [
    // Primárias (mostradas sempre)
    '#60A5FA', '#86EFAC', '#DDA0DD', '#F8BBD9', 
    '#FDE047', '#F3E8FF',
    
    // Secundárias (no modal)
    '#A5B4FC', '#E5E7EB', '#FED7AA', '#7DD3FC', 
    '#B3F5FC', '#BEF264', '#FB7185', '#FBBF24',
    '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B',
    '#EF4444', '#6366F1', '#EC4899', '#14B8A6',
    '#84CC16', '#F97316', '#3B82F6', '#8B5A3C',
    '#6B7280', '#1F2937', '#DC2626', '#7C3AED',
    '#059669', '#D97706', '#B91C1C', '#7C2D12'
  ];

  const primaryColors = avatarColors.slice(0, 6);
  const allColors = avatarColors;

  // Função para selecionar imagem COM LOGS
  const selectImage = async () => {
    try {
      console.log('🎯 [AvatarSection] Iniciando seleção de imagem');
      console.log('📱 [AvatarSection] Plataforma:', Platform.OS);
      
      setLocalUploading(true);

      // PARA WEB: Simplificado, sem Alert
      if (Platform.OS === 'web') {
        console.log('🌐 [AvatarSection] Executando fluxo WEB');
        
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        console.log('📊 [AvatarSection] Resultado do picker (web):', result);

        if (!result.canceled && result.assets[0]) {
          console.log('✅ [AvatarSection] Imagem selecionada, chamando onUpload...');
          await onUpload(result.assets[0].uri);
        } else {
          console.log('❌ [AvatarSection] Seleção cancelada ou sem assets');
        }
        return;
      }

      // PARA MOBILE: Fluxo original com permissões
      console.log('📱 [AvatarSection] Executando fluxo MOBILE');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('🔐 [AvatarSection] Status da permissão:', status);
      
      if (status !== 'granted') {
        console.log('❌ [AvatarSection] Permissão negada');
        return;
      }

      // Mostrar opções: Galeria ou Câmera
      Alert.alert(
        'Selecionar Foto',
        'Escolha uma opção:',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Galeria',
            onPress: async () => {
              console.log('📂 [AvatarSection] Usuário escolheu Galeria');
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                await onUpload(result.assets[0].uri);
              }
            }
          },
          {
            text: 'Câmera',
            onPress: async () => {
              console.log('📷 [AvatarSection] Usuário escolheu Câmera');
              const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
              
              if (cameraStatus !== 'granted') {
                console.log('❌ [AvatarSection] Permissão de câmera negada');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                await onUpload(result.assets[0].uri);
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('💥 [AvatarSection] Erro ao selecionar imagem:', error);
    } finally {
      setLocalUploading(false);
    }
  };

  // Determinar cor do texto baseado na cor de fundo
  const getTextColor = (bgColor: string) => {
    const lightColors = ['#86EFAC', '#FDE047', '#F3E8FF', '#E5E7EB', '#FED7AA', '#7DD3FC', '#B3F5FC', '#BEF264', '#FBBF24', '#FB7185'];
    return lightColors.includes(bgColor) ? '#1F2937' : 'white';
  };

  // Função para selecionar cor e fechar modal
  const selectColor = async (color: string) => {
    await onColorChange(color);
    setShowColorModal(false);
  };

  // Renderizar modal de cores
  const renderColorModal = () => (
    <Modal
      visible={showColorModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowColorModal(false)}
      accessible={false}
      importantForAccessibility="no"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.colorModal}>
          <View style={styles.colorModalHeader}>
            <Text style={styles.colorModalTitle}>Escolha uma cor</Text>
            <TouchableOpacity onPress={() => setShowColorModal(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.colorModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.colorGrid}>
              {allColors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorModalOption,
                    { backgroundColor: color },
                    userData.avatar_color === color && styles.colorModalSelected
                  ]}
                  onPress={() => selectColor(color)}
                >
                  {userData.avatar_color === color && (
                    <View style={styles.colorModalIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.profileSection}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View 
          style={[
            styles.avatar,
            { backgroundColor: userData.avatar_color }
          ]}
        >
          {userData.avatar_type === 'image' && userData.avatar_image_url ? (
            <Image 
              source={{ uri: userData.avatar_image_url }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={[
              styles.avatarText,
              { color: getTextColor(userData.avatar_color) }
            ]}>
              {userData.avatar_letter}
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.avatarEditButton}
          onPress={() => {
            console.log('📷 [AvatarSection] Clicou no ícone da câmera - selecionando imagem');
            selectImage();
          }}
          disabled={uploading || localUploading}
        >
          <Camera size={16} color="white" />
        </TouchableOpacity>
        
        {(uploading || localUploading) && (
          <View style={styles.uploadingIndicator}>
            <Text style={styles.uploadingText}>Enviando...</Text>
          </View>
        )}
      </View>

      {/* Nome */}
      <Text style={styles.userName}>{userData.nome_completo}</Text>
      
      {/* Código PT - Mostrar apenas para Personal Trainers */}
      {userType === 'personal_trainer' && showCodigoPT && userData.codigo_pt && (
        <Text style={styles.userCode}>Código: {userData.codigo_pt}</Text>
      )}
      
      {/* Seletor de Cores - apenas para avatar tipo letra */}
      {userData.avatar_type === 'letter' && (
        <View style={styles.colorSelectorRow}>
          <Text style={styles.colorSelectorLabel}>Cor do Avatar:</Text>
          <View style={styles.colorSelectorContainer}>
            {primaryColors.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorSelectorOption,
                  { backgroundColor: color },
                  userData.avatar_color === color && styles.colorSelectorSelected
                ]}
                onPress={() => onColorChange(color)}
              >
                {userData.avatar_color === color && (
                  <View style={styles.colorSelectorIndicator} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.moreColorsButton}
              onPress={() => setShowColorModal(true)}
            >
              <Text style={styles.moreColorsText}>+{allColors.length - primaryColors.length}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Botão "Mostrar Avatar" - apenas quando está no modo imagem */}
      {userData.avatar_type === 'image' && (
        <View style={styles.avatarSwitchRow}>
          <TouchableOpacity 
            style={styles.showAvatarButton}
            onPress={onSwitchToLetter}
          >
            <Text style={styles.showAvatarButtonText}>Mostrar Avatar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de cores */}
      {renderColorModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    backgroundColor: 'white',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: 'white',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingIndicator: {
    position: 'absolute',
    bottom: -30,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  uploadingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userCode: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  colorSelectorRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  colorSelectorLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  colorSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorSelectorOption: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSelectorSelected: {
    borderColor: '#1F2937',
  },
  colorSelectorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  moreColorsButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreColorsText: {
    fontSize: 8,
    color: '#64748B',
    fontWeight: '600',
  },
  
  // Botão Mostrar Avatar
  avatarSwitchRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  showAvatarButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  showAvatarButtonText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  // Modal de cores
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  colorModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  colorModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  colorModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  colorModalContent: {
    padding: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  colorModalOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorModalSelected: {
    borderColor: '#1F2937',
  },
  colorModalIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
});

export default AvatarSection;
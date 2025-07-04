// components/SimpleMediaSection.tsx - QUE FUNCIONA DE VERDADE
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export interface MediaData {
  imagem_1_url: string | null;
  imagem_2_url: string | null;
  video_url: string | null;
  youtube_url: string | null;
  imagem_1_thumbnail?: string | null;
  imagem_2_thumbnail?: string | null;
}

export interface SimpleMediaSectionProps {
  mediaData: MediaData;
  onUpload: (campo: keyof MediaData) => void;
  onRemove: (campo: keyof MediaData) => void;
  onView: (campo: keyof MediaData) => void;
  uploading?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  hideEmpty?: boolean; // NOVO: esconde cards vazios
}

export const SimpleMediaSection: React.FC<SimpleMediaSectionProps> = ({
  mediaData,
  onUpload,
  onRemove,
  onView,
  uploading = false,
  disabled = false,
  readOnly = false,
  hideEmpty = false
}) => {
  // Estados para formato das imagens
  const [foto1Formato, setFoto1Formato] = React.useState<'quadrada' | 'retangular' | null>(null);
  const [foto2Formato, setFoto2Formato] = React.useState<'quadrada' | 'retangular' | null>(null);

  // DEBUG: Log para ver o que está chegando
  console.log("🔍 [SimpleMediaSection] MediaData recebido:", mediaData);
  
  // DEBUG: Log específico para imagem 1
  if (mediaData?.imagem_1_url) {
    console.log("📸 [SimpleMediaSection] IMAGEM 1 DETECTADA:", {
      url_original: mediaData.imagem_1_url,
      thumbnail: mediaData.imagem_1_thumbnail,
      url_para_exibir: mediaData.imagem_1_thumbnail || mediaData.imagem_1_url
    });
  }

  // Função para extrair thumbnail do YouTube
  const getYoutubeThumbnail = (url: string): string | null => {
    if (!url) return null;
    
    try {
      // Diferentes formatos de URL do YouTube
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          // Retorna URL do thumbnail em alta qualidade
          return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
        }
      }
      
      return null;
    } catch (error) {
      console.log("❌ Erro ao extrair thumbnail do YouTube:", error);
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mídias do Exercício</Text>
      
      {/* FOTO 1 */}
      {(!hideEmpty || mediaData?.imagem_1_url) && (
      <View style={styles.mediaItem}>
        <Text style={styles.label}>Foto 1</Text>
        {mediaData?.imagem_1_url ? (
          <View>
            <Image 
              source={{ uri: mediaData.imagem_1_thumbnail || mediaData.imagem_1_url }} 
              style={[
                styles.image,
                foto1Formato === 'quadrada' && { aspectRatio: 1 },
                foto1Formato === 'retangular' && { aspectRatio: 16/9 }
              ]}
              onError={(e) => console.log("❌ Erro ao carregar Foto 1:", e.nativeEvent.error)}
              onLoad={() => {
                // Detecta formato da imagem
                Image.getSize(
                  mediaData.imagem_1_thumbnail || mediaData.imagem_1_url!,
                  (width, height) => {
                    if (width === height) setFoto1Formato('quadrada');
                    else setFoto1Formato('retangular');
                  },
                  (error) => {
                    setFoto1Formato(null);
                  }
                );
                console.log("✅ Foto 1 carregada com sucesso");
              }}
            />
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.button} onPress={() => onView('imagem_1_url')}>
                <Text style={styles.buttonText}>Ver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => onUpload('imagem_1_url')} disabled={readOnly || disabled}>
                <Text style={[styles.buttonText, (readOnly || disabled) && { color: '#9CA3AF' }]}>Trocar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeButton} onPress={() => onRemove('imagem_1_url')} disabled={readOnly || disabled}>
                <Text style={[styles.removeText, (readOnly || disabled) && { color: '#D1D5DB' }]}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          !hideEmpty && (
            <TouchableOpacity style={styles.uploadArea} onPress={() => onUpload('imagem_1_url')} disabled={readOnly || disabled}>
              <Ionicons name="camera-outline" size={40} color="#9CA3AF" />
              <Text style={styles.uploadText}>Adicionar Foto 1</Text>
            </TouchableOpacity>
          )
        )}
      </View>
      )}

      {/* FOTO 2 */}
      {(!hideEmpty || mediaData?.imagem_2_url) && (
      <View style={styles.mediaItem}>
        <Text style={styles.label}>Foto 2</Text>
        {mediaData?.imagem_2_url ? (
          <View>
            <Image 
              source={{ uri: mediaData.imagem_2_thumbnail || mediaData.imagem_2_url }} 
              style={[
                styles.image,
                foto2Formato === 'quadrada' && { aspectRatio: 1 },
                foto2Formato === 'retangular' && { aspectRatio: 16/9 }
              ]}
              onError={(e) => console.log("❌ Erro ao carregar Foto 2:", e.nativeEvent.error)}
              onLoad={() => {
                // Detecta formato da imagem
                Image.getSize(
                  mediaData.imagem_2_thumbnail || mediaData.imagem_2_url!,
                  (width, height) => {
                    if (width === height) setFoto2Formato('quadrada');
                    else setFoto2Formato('retangular');
                  },
                  (error) => {
                    setFoto2Formato(null);
                  }
                );
                console.log("✅ Foto 2 carregada com sucesso");
              }}
              onLoadStart={() => console.log("🔄 Iniciando carregamento Foto 2")}
              onLoadEnd={() => console.log("🏁 Finalizando carregamento Foto 2")}
            />
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.button} onPress={() => onView('imagem_2_url')}>
                <Text style={styles.buttonText}>Ver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => onUpload('imagem_2_url')} disabled={readOnly || disabled}>
                <Text style={[styles.buttonText, (readOnly || disabled) && { color: '#9CA3AF' }]}>Trocar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeButton} onPress={() => onRemove('imagem_2_url')} disabled={readOnly || disabled}>
                <Text style={[styles.removeText, (readOnly || disabled) && { color: '#D1D5DB' }]}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          !hideEmpty && (
            <TouchableOpacity style={styles.uploadArea} onPress={() => onUpload('imagem_2_url')} disabled={readOnly || disabled}>
              <Ionicons name="camera-outline" size={40} color="#9CA3AF" />
              <Text style={styles.uploadText}>Adicionar Foto 2</Text>
            </TouchableOpacity>
          )
        )}
      </View>
      )}

      {/* VÍDEO */}
      {(!hideEmpty || mediaData?.video_url) && (
      <View style={styles.mediaItem}>
        <Text style={styles.label}>Vídeo</Text>
        {mediaData?.video_url ? (
          <View>
            <View style={styles.videoPreview}>
              <Ionicons name="play-circle-outline" size={60} color="#007AFF" />
              <Text style={styles.videoText}>Vídeo carregado</Text>
            </View>
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.button} onPress={() => onView('video_url')}>
                <Text style={styles.buttonText}>Assistir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => onUpload('video_url')} disabled={readOnly || disabled}>
                <Text style={[styles.buttonText, (readOnly || disabled) && { color: '#9CA3AF' }]}>Trocar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeButton} onPress={() => onRemove('video_url')} disabled={readOnly || disabled}>
                <Text style={[styles.removeText, (readOnly || disabled) && { color: '#D1D5DB' }]}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          !hideEmpty && (
            <TouchableOpacity style={styles.uploadArea} onPress={() => onUpload('video_url')} disabled={readOnly || disabled}>
              <Ionicons name="videocam-outline" size={40} color="#9CA3AF" />
              <Text style={styles.uploadText}>Adicionar Vídeo</Text>
            </TouchableOpacity>
          )
        )}
      </View>
      )}

      {/* YOUTUBE */}
      {(!hideEmpty || mediaData?.youtube_url) && (
      <View style={styles.mediaItem}>
        <Text style={styles.label}>YouTube</Text>
        {mediaData?.youtube_url ? (
          <View>
            {getYoutubeThumbnail(mediaData.youtube_url) ? (
              <Image 
                source={{ uri: getYoutubeThumbnail(mediaData.youtube_url)! }} 
                style={styles.youtubeThumbnail}
                onError={(e) => {
                  console.log("❌ Erro ao carregar thumbnail do YouTube:", e.nativeEvent.error);
                }}
                onLoad={() => {
                  console.log("✅ Thumbnail do YouTube carregado com sucesso");
                }}
              />
            ) : (
              <View style={styles.youtubePreview}>
                <Ionicons name="logo-youtube" size={40} color="#FF0000" />
                <Text style={styles.youtubeText}>Link do YouTube</Text>
              </View>
            )}
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.button} onPress={() => onView('youtube_url')}>
                <Text style={styles.buttonText}>Abrir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => onUpload('youtube_url')} disabled={readOnly || disabled}>
                <Text style={[styles.buttonText, (readOnly || disabled) && { color: '#9CA3AF' }]}>Alterar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeButton} onPress={() => onRemove('youtube_url')} disabled={readOnly || disabled}>
                <Text style={[styles.removeText, (readOnly || disabled) && { color: '#D1D5DB' }]}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          !hideEmpty && (
            <TouchableOpacity style={styles.uploadArea} onPress={() => onUpload('youtube_url')} disabled={readOnly || disabled}>
              <Ionicons name="logo-youtube" size={40} color="#9CA3AF" />
              <Text style={styles.uploadText}>Adicionar YouTube</Text>
            </TouchableOpacity>
          )
        )}
      </View>
      )}

      {uploading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Enviando...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 24,
  },
  mediaItem: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  uploadArea: {
    height: 120,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  uploadText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 8,
  },
  videoPreview: {
    height: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  youtubePreview: {
    height: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  youtubeThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  youtubeText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  removeText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  loadingText: {
    color: '#007AFF',
    fontWeight: '500',
  },
});

SimpleMediaSection.displayName = 'SimpleMediaSection';
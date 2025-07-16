// components/MediaUploadSection.tsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../lib/supabase';
import LoadingIcon from './LoadingIcon';

interface MediaUploadSectionProps {
    onMediaChange: (mediaData: {
        imagem_1_url: string | null;
        imagem_2_url: string | null;
        video_url: string | null;
        youtube_url: string | null;
    }) => void;
    exercicioOriginal?: {
        imagem_1_url?: string;
        imagem_2_url?: string;
        video_url?: string;
        youtube_url?: string;
    };
}

export const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
    onMediaChange,
    exercicioOriginal
}) => {
    const [uploading, setUploading] = useState({
        imagem_1: false,
        imagem_2: false,
        video: false
    });

    const [mediaData, setMediaData] = useState({
        imagem_1_url: null as string | null,
        imagem_2_url: null as string | null,
        video_url: null as string | null,
        youtube_url: null as string | null
    });

    // ✅ Função para fazer upload usando a Edge Function
    const uploadToCloudflare = async (imageUri: string, filename: string): Promise<string | null> => {
        try {
            console.log('📤 [MediaUpload] Iniciando upload para Cloudflare R2...');

            const response = await fetch(imageUri);
            const blob = await response.blob();
            
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onloadend = async () => {
                    try {
                        const base64Data = reader.result as string;
                        const base64Image = base64Data.split(',')[1];

                        console.log('🔄 [MediaUpload] Chamando Edge Function...');
                        
                        const { data, error } = await supabase.functions.invoke('upload-imagem', {
                            body: {
                                filename,
                                image_base64: base64Image,
                                bucket_type: 'exercicios'
                            }
                        });

                        if (error) {
                            console.error('❌ [MediaUpload] Erro na Edge Function:', error);
                            throw error;
                        }

                        if (data?.success) {
                            console.log('✅ [MediaUpload] Upload concluído:', data.url);
                            resolve(data.url);
                        } else {
                            console.error('❌ [MediaUpload] Upload falhou:', data);
                            reject(new Error(data?.error || 'Upload falhou'));
                        }
                    } catch (err) {
                        console.error('❌ [MediaUpload] Erro no processamento:', err);
                        reject(err);
                    }
                };
                reader.onerror = () => reject(new Error('Erro ao ler imagem'));
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('❌ [MediaUpload] Erro no upload:', error);
            return null;
        }
    };

    // ✅ Função para selecionar mídia
    const selectMedia = async (tipo: 'imagem_1' | 'imagem_2' | 'video') => {
        try {
            console.log(`🎯 [MediaUpload] Iniciando seleção de ${tipo}`);
            setUploading(prev => ({ ...prev, [tipo]: true }));

            const isVideo = tipo === 'video';
            const mediaTypes = isVideo ? 
                ImagePicker.MediaTypeOptions.All : 
                ImagePicker.MediaTypeOptions.Images;

            if (Platform.OS === 'web') {
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes,
                    allowsEditing: !isVideo,
                    aspect: isVideo ? undefined : [4, 3],
                    quality: isVideo ? 0.7 : 0.8,
                });

                if (!result.canceled && result.assets[0]) {
                    await handleUpload(result.assets[0], tipo);
                }
                return;
            }

            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua galeria.');
                return;
            }

            Alert.alert(
                `Selecionar ${isVideo ? 'Vídeo' : 'Imagem'}`,
                'Escolha uma opção:',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Galeria',
                        onPress: async () => {
                            const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes,
                                allowsEditing: !isVideo,
                                aspect: isVideo ? undefined : [4, 3],
                                quality: isVideo ? 0.7 : 0.8,
                            });

                            if (!result.canceled && result.assets[0]) {
                                await handleUpload(result.assets[0], tipo);
                            }
                        }
                    },
                    {
                        text: 'Câmera',
                        onPress: async () => {
                            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
                            if (cameraStatus !== 'granted') {
                                Alert.alert('Permissão necessária', 'Precisamos de permissão para usar a câmera.');
                                return;
                            }

                            const result = await ImagePicker.launchCameraAsync({
                                mediaTypes,
                                allowsEditing: !isVideo,
                                aspect: isVideo ? undefined : [4, 3],
                                quality: isVideo ? 0.7 : 0.8,
                            });

                            if (!result.canceled && result.assets[0]) {
                                await handleUpload(result.assets[0], tipo);
                            }
                        }
                    }
                ]
            );
        } catch (error: any) {
            console.error(`💥 [MediaUpload] Erro ao selecionar ${tipo}:`, error);
            Alert.alert('Erro', 'Erro inesperado ao selecionar mídia. Tente novamente.');
        } finally {
            setUploading(prev => ({ ...prev, [tipo]: false }));
        }
    };

    // ✅ Função para processar upload
    const handleUpload = async (asset: any, tipo: 'imagem_1' | 'imagem_2' | 'video') => {
        try {
            const fileExtension = 'webp';
            const timestamp = Date.now();
            const filename = `exercicio_${timestamp}_${tipo}.${fileExtension}`;

            const uploadedUrl = await uploadToCloudflare(asset.uri, filename);

            if (uploadedUrl) {
                const newMediaData = {
                    ...mediaData,
                    [`${tipo}_url`]: uploadedUrl
                };
                setMediaData(newMediaData);
                onMediaChange(newMediaData);
                
                Alert.alert('Sucesso! 🎉', `${tipo === 'video' ? 'Vídeo' : 'Imagem'} enviada com sucesso!`);
            } else {
                Alert.alert('Erro', 'Não foi possível fazer upload da mídia. Tente novamente.');
            }
        } catch (error) {
            console.error(`❌ [MediaUpload] Erro no upload de ${tipo}:`, error);
            Alert.alert('Erro', 'Erro inesperado ao fazer upload. Tente novamente.');
        }
    };

    // ✅ Função para remover mídia
    const handleRemoveMedia = (tipo: 'imagem_1' | 'imagem_2' | 'video' | 'youtube') => {
        const newMediaData = {
            ...mediaData,
            [`${tipo}_url`]: null
        };
        setMediaData(newMediaData);
        onMediaChange(newMediaData);
    };

    // ✅ Renderizar campo de mídia
    const renderMediaField = (
        tipo: 'imagem_1' | 'imagem_2' | 'video',
        label: string,
        icon: string,
        currentUrl: string | null
    ) => (
        <View style={styles.mediaField}>
            <Text style={styles.label}>{label}</Text>
            
            {currentUrl ? (
                <View style={styles.mediaPreview}>
                    {tipo === 'video' ? (
                        <View style={styles.videoPreview}>
                            <Ionicons name="videocam" size={40} color="#A11E0A" />
                            <Text style={styles.videoPreviewText}>Vídeo carregado</Text>
                        </View>
                    ) : (
                        <Image source={{ uri: currentUrl }} style={styles.imagePreview} />
                    )}
                    
                    <View style={styles.mediaActions}>
                        <TouchableOpacity
                            style={styles.changeButton}
                            onPress={() => selectMedia(tipo)}
                            disabled={uploading[tipo]}
                        >
                            {uploading[tipo] ? (
                                <LoadingIcon size={16} color="#A11E0A" />
                            ) : (
                                <Ionicons name="refresh" size={16} color="#A11E0A" />
                            )}
                            <Text style={styles.changeButtonText}>
                                {uploading[tipo] ? 'Enviando...' : 'Alterar'}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => handleRemoveMedia(tipo)}
                        >
                            <Ionicons name="trash" size={16} color="#EF4444" />
                            <Text style={styles.removeButtonText}>Remover</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => selectMedia(tipo)}
                    disabled={uploading[tipo]}
                >
                    {uploading[tipo] ? (
                        <>
                            <LoadingIcon size={24} color="#A11E0A" />
                            <Text style={styles.uploadButtonText}>Enviando...</Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name={icon as any} size={24} color="#A11E0A" />
                            <Text style={styles.uploadButtonText}>
                                Adicionar {tipo === 'video' ? 'Vídeo' : 'Imagem'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            )}
            
            {exercicioOriginal?.[`${tipo}_url`] && (
                <View style={styles.originalMedia}>
                    <Text style={styles.originalMediaLabel}>Mídia do exercício original:</Text>
                    {tipo === 'video' ? (
                        <View style={styles.originalVideoPreview}>
                            <Ionicons name="videocam-outline" size={20} color="#6B7280" />
                            <Text style={styles.originalMediaText}>
                                {exercicioOriginal[`${tipo}_url`]?.includes('.webp') ? 'Animação WebP' : 'Vídeo disponível'}
                            </Text>
                        </View>
                    ) : (
                        <Image 
                            source={{ uri: exercicioOriginal[`${tipo}_url`] }} 
                            style={styles.originalImagePreview} 
                        />
                    )}
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Mídias do Exercício</Text>
            <Text style={styles.sectionSubtitle}>
                Adicione imagens e vídeos para demonstrar a execução do exercício
            </Text>

            {renderMediaField('imagem_1', 'Imagem 1', 'image-outline', mediaData.imagem_1_url)}
            {renderMediaField('imagem_2', 'Imagem 2', 'image-outline', mediaData.imagem_2_url)}
            {renderMediaField('video', 'Vídeo/Animação', 'videocam-outline', mediaData.video_url)}

            <View style={styles.mediaField}>
                <Text style={styles.label}>Vídeo do YouTube (opcional)</Text>
                <View style={styles.youtubeContainer}>
                    <TextInput
                        style={styles.youtubeInput}
                        value={mediaData.youtube_url || ''}
                        onChangeText={(text) => {
                            const newMediaData = {
                                ...mediaData,
                                youtube_url: text || null
                            };
                            setMediaData(newMediaData);
                            onMediaChange(newMediaData);
                        }}
                        placeholder="Cole aqui o link do YouTube"
                        placeholderTextColor="#9CA3AF"
                    />
                    {mediaData.youtube_url && (
                        <TouchableOpacity
                            style={styles.clearYoutubeButton}
                            onPress={() => handleRemoveMedia('youtube')}
                        >
                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>
                
                {mediaData.youtube_url && (
                    <View style={styles.youtubePreview}>
                        {(mediaData.youtube_url.includes('youtube.com') || mediaData.youtube_url.includes('youtu.be')) ? (
                            <Text style={styles.youtubeValidText}>✅ URL do YouTube válida</Text>
                        ) : (
                            <Text style={styles.youtubeInvalidText}>⚠️ URL inválida. Use links do YouTube</Text>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
        lineHeight: 20
    },
    mediaField: {
        marginBottom: 24
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12
    },
    uploadButton: {
        borderWidth: 2,
        borderColor: '#A11E0A',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#F8FAFC'
    },
    uploadButtonText: {
        fontSize: 16,
        color: '#A11E0A',
        fontWeight: '500',
        marginTop: 8
    },
    mediaPreview: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F8FAFC'
    },
    imagePreview: {
        width: '100%',
        height: 200,
        backgroundColor: '#F3F4F6'
    },
    videoPreview: {
        width: '100%',
        height: 200,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center'
    },
    videoPreviewText: {
        fontSize: 16,
        color: '#A11E0A',
        fontWeight: '500',
        marginTop: 8
    },
    mediaActions: {
        flexDirection: 'row',
        padding: 12,
        gap: 12,
        backgroundColor: 'white'
    },
    changeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        gap: 6
    },
    changeButtonText: {
        fontSize: 14,
        color: '#A11E0A',
        fontWeight: '500'
    },
    removeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        gap: 6
    },
    removeButtonText: {
        fontSize: 14,
        color: '#EF4444',
        fontWeight: '500'
    },
    youtubeContainer: {
        position: 'relative'
    },
    youtubeInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: 'white',
        paddingRight: 40
    },
    clearYoutubeButton: {
        position: 'absolute',
        right: 12,
        top: 12,
        padding: 4
    },
    youtubePreview: {
        marginTop: 8,
        paddingHorizontal: 12
    },
    youtubeValidText: {
        fontSize: 14,
        color: '#10B981'
    },
    youtubeInvalidText: {
        fontSize: 14,
        color: '#EF4444'
    },
    originalMedia: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    originalMediaLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 8
    },
    originalImagePreview: {
        width: 80,
        height: 60,
        borderRadius: 6,
        backgroundColor: '#F3F4F6'
    },
    originalVideoPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    originalMediaText: {
        fontSize: 12,
        color: '#6B7280'
    }
});
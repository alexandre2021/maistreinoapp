// app/criar-exercicio-personalizado.tsx - CRIAÇÃO DO ZERO
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// ✅ COMPONENTES REUTILIZÁVEIS EXISTENTES
import { ErrorModal } from '../components/ErrorModal';
import LoadingIcon from '../components/LoadingIcon';
import LoadingScreen from '../components/LoadingScreen';
import { MediaViewerModal } from '../components/MediaViewerModal';
import { PlanosModal } from '../components/PlanosModal';
import { VideoPlayerModal } from '../components/VideoPlayerModal';

// ✅ COMPONENTES CRIADOS
import { ExercicioForm, type ExercicioFormData } from '../components/ExercicioForm';
import { SimpleMediaSection, type MediaData } from '../components/SimpleMediaSection';
import { YoutubeUrlModal } from '../components/YoutubeUrlModal';

// ✅ HOOKS E UTILITIES
import { useImageOptimizer } from '../components/media/ImageOptimizer';
import { useModalManager } from '../hooks/useModalManager';
import { supabase } from '../lib/supabase';

const MAX_VIDEO_SIZE_MB = 20;
const MAX_VIDEO_DURATION_SEC = 30;

export default function CriarExercicioPersonalizadoScreen() {
    const router = useRouter();
    
    const { modals, selectedItem, openModal, closeModal } = useModalManager<{
        url?: string, 
        title?: string, 
        message?: string
    }>({
        mediaViewer: false,
        videoPlayer: false,
        error: false,
    });
    
    // ✅ ESTADOS PRINCIPAIS
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [ptId, setPtId] = useState<string>('');
    const [showPlanosModal, setShowPlanosModal] = useState(false);
    const [youtubeModalVisible, setYoutubeModalVisible] = useState(false);
    const [pendingYoutubeField, setPendingYoutubeField] = useState<keyof MediaData | null>(null);
    
    // Estados do Toast
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        console.log('🍞 SHOW TOAST CHAMADO:', message, type);
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 4000);
    }, []);
    
    // ✅ ESTADOS DO FORMULÁRIO E MÍDIA - VALORES INICIAIS VAZIOS
    const [formData, setFormData] = useState<ExercicioFormData>({
        nome: '',
        descricao: '',
        grupo_muscular: '',
        equipamento: '',
        dificuldade: 'Baixa', // Valor padrão
        instrucoes: ''
    });

    const [mediaData, setMediaData] = useState<MediaData>({
        imagem_1_url: null,
        imagem_2_url: null,
        video_url: null,
        youtube_url: null
    });
    
    // ✅ HOOKS DE OTIMIZAÇÃO
    const { optimizeAndConvertToBase64 } = useImageOptimizer({
        maxSizeKB: 200,
        maxWidth: 1080,
        quality: 0.8,
        format: 'webp'
    });

    // ✅ DEBUG - Monitorar mudanças no mediaData
    useEffect(() => {
        console.log(`🎯 [DEBUG] MediaData mudou:`, mediaData);
    }, [mediaData]);

    // ✅ UTILITIES
    const isSupabaseUrl = (url: string): boolean => {
        return url?.includes('supabase.co') || url?.includes('supabase.in') || false;
    };

    // ✅ FUNÇÃO DE UPLOAD OTIMIZADO
    const uploadToCloudflareOptimized = useCallback(async (uri: string, campo: keyof MediaData): Promise<string | null> => {
        try {
            console.log(`🖼️ [Upload] Iniciando upload otimizado para ${campo}`);

            let base64Data: string;
            let metadata: any = {};

            if (campo === 'video_url') {
                // Para vídeos, fazer conversão simples
                const res = await fetch(uri);
                const blob = await res.blob();
                const reader = new FileReader();
                base64Data = await new Promise((resolve) => { 
                    reader.onload = () => resolve((reader.result as string).split(',')[1]); 
                    reader.readAsDataURL(blob); 
                });
                console.log(`📊 [Upload] Vídeo processado`);
            } else {
                // Para imagens, usar otimização WebP
                try {
                    const optimized = await optimizeAndConvertToBase64(uri);
                    base64Data = optimized.base64;
                    metadata = optimized.metadata;

                    console.log(`📊 [Upload] Otimização: ${metadata.width}x${metadata.height}, ${metadata.sizeKB}KB`);
                } catch (optimizeError) {
                    console.error('❌ [Upload] Erro na otimização:', optimizeError);
                    throw optimizeError;
                }
            }

            // Gerar nome único
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            const extension = campo === 'video_url' ? 'mp4' : 'webp';
            const filename = `exercicio_${timestamp}_${random}.${extension}`;

            // Chamar Edge Function
            const uploadResponse = await supabase.functions.invoke('upload-imagem', {
                body: {
                    filename,
                    image_base64: base64Data,
                    bucket_type: 'exercicios'
                }
            });

            if (uploadResponse.error || !uploadResponse.data?.url) {
                console.error('❌ [Upload] Falha:', uploadResponse.error);
                return null;
            }

            console.log(`✅ [Upload] Sucesso: ${uploadResponse.data.url}`);
            return uploadResponse.data.url;

        } catch (error: unknown) {
            console.error(`💥 [Upload] Erro inesperado:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            showToast(`Falha no upload: ${errorMessage}`, 'error');
            return null;
        }
    }, [optimizeAndConvertToBase64, showToast]);

    // ✅ VALIDAÇÃO DE LIMITE
    const validateExerciseLimit = async (personalTrainerId: string): Promise<boolean> => {
        try {
            const { data: ptData, error: ptError } = await supabase
                .from('personal_trainers')
                .select('plano')
                .eq('id', personalTrainerId)
                .single();

            if (ptError || !ptData) return false;

            const { data: planoData, error: planoError } = await supabase
                .from('planos')
                .select('limite_exercicios')
                .eq('id', ptData.plano)
                .single();

            if (planoError || !planoData) return false;
            if (planoData.limite_exercicios === null) return true;

            const { count, error: countError } = await supabase
                .from('exercicios')
                .select('*', { count: 'exact' })
                .eq('tipo', 'personalizado')
                .eq('pt_id', personalTrainerId);

            if (countError) return false;
            return (count || 0) < planoData.limite_exercicios;
        } catch (validationError: unknown) {
            console.error('Erro na validação:', validationError);
            return false;
        }
    };

    // ✅ CARREGAR DADOS INICIAIS - APENAS VALIDAÇÃO DE USUÁRIO
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    showToast('Usuário não autenticado', 'error');
                    setTimeout(() => router.back(), 2000);
                    return;
                }

                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('user_type')
                    .eq('id', user.id)
                    .single();

                if (!profile || profile.user_type !== 'personal_trainer') {
                    showToast('Apenas personal trainers podem criar exercícios personalizados', 'error');
                    setTimeout(() => router.back(), 2000);
                    return;
                }

                setPtId(user.id);

                // Validar se pode criar mais exercícios
                const canCreate = await validateExerciseLimit(user.id);
                if (!canCreate) {
                    setShowPlanosModal(true);
                }

            } catch (loadError: unknown) {
                console.error('Erro inesperado:', loadError);
                showToast('Erro ao carregar dados', 'error');
                setTimeout(() => router.back(), 2000);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [router, showToast]);

    // ✅ HANDLERS DO FORMULÁRIO
    const handleUpdateField = useCallback((field: keyof ExercicioFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // ✅ HANDLERS DE MÍDIA
    const handleMediaUpload = async (campo: keyof MediaData) => {
        if (campo === 'youtube_url') {
            setPendingYoutubeField(campo);
            setYoutubeModalVisible(true);
            return;
        }

        try {
            setUploading(true);
            console.log(`🎯 [DEBUG] Iniciando seleção para ${campo}`);
            
            const isVideo = campo === 'video_url';
            const mediaTypes: any = isVideo ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images;
            
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes,
                allowsEditing: !isVideo,
                aspect: isVideo ? undefined : [4, 3],
                quality: 1.0,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setMediaData(prev => ({ ...prev, [campo]: asset.uri }));
                showToast(`${isVideo ? 'Vídeo' : 'Imagem'} selecionado com sucesso!`, 'success');
            }
        } catch (uploadError: unknown) {
            console.error(`❌ [DEBUG] Erro ao selecionar ${campo}:`, uploadError);
            showToast('Não foi possível carregar a mídia', 'error');
        } finally {
            setUploading(false);
        }
    };

    // Handler para remover mídia
    const handleMediaRemove = (campo: keyof MediaData) => {
        setMediaData(prev => ({ ...prev, [campo]: null }));
    };

    // Handler para visualizar mídia
    const handleMediaView = (campo: keyof MediaData) => {
        const url = mediaData[campo];
        if (!url) return;
        
        if (campo === 'youtube_url') {
            // Abre o link do YouTube no navegador
            Linking.openURL(url);
        } else if (campo === 'imagem_1_url' || campo === 'imagem_2_url') {
            // Para imagens, usa o modal interno
            const title = `Novo Exercício - ${campo === 'imagem_1_url' ? 'Foto 1' : 'Foto 2'}`;
            openModal('mediaViewer', { url, title });
        } else if (campo === 'video_url') {
            // Para vídeos, usa o modal interno
            const title = 'Novo Exercício - Vídeo';
            openModal('videoPlayer', { url, title });
        }
    };

    // Handler para salvar a URL do YouTube
    const handleSaveYoutubeUrl = (url: string) => {
        if (pendingYoutubeField) {
            setMediaData(prev => ({ ...prev, [pendingYoutubeField]: url }));
        }
        setYoutubeModalVisible(false);
        setPendingYoutubeField(null);
    };

    // ✅ SALVAR EXERCÍCIO NOVO
    const handleCriarExercicio = async () => {
        // Validar limite novamente antes de salvar
        const podeCriar = await validateExerciseLimit(ptId);
        if (!podeCriar) {
            setShowPlanosModal(true);
            return;
        }

        // Validações obrigatórias
        if (!formData.nome.trim()) {
            showToast('Nome é obrigatório', 'error');
            return;
        }

        if (!formData.grupo_muscular) {
            showToast('Grupo muscular é obrigatório', 'error');
            return;
        }

        if (!formData.equipamento) {
            showToast('Equipamento é obrigatório', 'error');
            return;
        }

        setSaving(true);

        try {
            console.log('💾 Criando novo exercício personalizado...');

            // UPLOAD das mídias locais para Cloudflare
            const finalMediaData = { ...mediaData };
            const mediaFields: (keyof MediaData)[] = ['imagem_1_url', 'imagem_2_url', 'video_url'];

            for (const campo of mediaFields) {
                const url = finalMediaData[campo];
                if (url && !url.startsWith('http')) {
                    // Se for uma URI local, faz upload
                    console.log(`⬆️ Enviando ${campo} para Cloudflare...`);
                    const cloudflareUrl = await uploadToCloudflareOptimized(url, campo);
                    if (cloudflareUrl) {
                        finalMediaData[campo] = cloudflareUrl;
                        console.log(`✅ ${campo} enviado com sucesso`);
                    } else {
                        console.log(`⚠️ Falha ao enviar ${campo}, removendo do exercício`);
                        finalMediaData[campo] = null;
                    }
                }
            }

            const novoExercicio = {
                nome: formData.nome.trim(),
                descricao: formData.descricao.trim(),
                grupo_muscular: formData.grupo_muscular,
                equipamento: formData.equipamento,
                dificuldade: formData.dificuldade,
                instrucoes: formData.instrucoes.trim(),
                tipo: 'personalizado' as const,
                pt_id: ptId,
                is_ativo: true,
                imagem_1_url: finalMediaData.imagem_1_url,
                imagem_2_url: finalMediaData.imagem_2_url,
                video_url: finalMediaData.video_url,
                youtube_url: finalMediaData.youtube_url
            };

            const { data, error } = await supabase
                .from('exercicios')
                .insert([novoExercicio])
                .select('id')
                .single();

            if (error) {
                console.error('❌ Erro ao salvar:', error);
                showToast('Não foi possível criar o exercício', 'error');
                return;
            }

            console.log('✅ Exercício criado:', data.id);

            // Mostrar toast de sucesso e redirecionar
            showToast('Exercício criado com sucesso!', 'success');
            setTimeout(() => {
                router.replace('/exercicios?tab=personalizados');
            }, 1500);

        } catch (saveError: unknown) {
            console.error('💥 Erro inesperado:', saveError);
            showToast('Erro inesperado ao criar exercício', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ✅ LOADING STATE
    if (loading) {
        return <LoadingScreen message="Preparando criação do exercício..." />;
    }

    // ✅ MAIN RENDER
    return (
        <React.Fragment>
            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* ✅ HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerBackButton} onPress={() => router.push('/exercicios')}>
                        <Ionicons name="chevron-back" size={24} color="#007AFF" />
                        <Text style={styles.backButtonText}>Voltar</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Criar Exercício Personalizado</Text>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* ✅ FORMULÁRIO DO EXERCÍCIO - SEM exercicioOriginal */}
                    <ExercicioForm
                        mode="create"
                        formData={formData}
                        onUpdateField={handleUpdateField}
                        disabled={saving}
                    />

                    {/* ✅ SEÇÃO DE MÍDIAS SIMPLES */}
                    <SimpleMediaSection
                        mediaData={mediaData}
                        onUpload={handleMediaUpload}
                        onRemove={handleMediaRemove}
                        onView={handleMediaView}
                        uploading={uploading}
                        disabled={saving}
                    />
                </ScrollView>

                {/* ✅ BOTÃO DE SALVAR */}
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                        onPress={handleCriarExercicio}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <LoadingIcon size={20} color="white" />
                                <Text style={styles.saveButtonText}>Criando...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="add" size={20} color="white" />
                                <Text style={styles.saveButtonText}>Criar Exercício</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ✅ MODAL DE PLANOS */}
                <PlanosModal
                    visible={showPlanosModal}
                    onClose={() => setShowPlanosModal(false)}
                    onSelectPlan={(planId) => {
                        console.log('📋 Plano selecionado:', planId);
                        showToast(`Plano ${planId} selecionado! (Implementar upgrade)`, 'success');
                        setShowPlanosModal(false);
                    }}
                />
            </KeyboardAvoidingView>

            {/* ✅ MODAIS DE VISUALIZAÇÃO */}
            <MediaViewerModal
                visible={modals.mediaViewer}
                onClose={() => closeModal('mediaViewer')}
                title={selectedItem?.title || ''}
                imageUrl={selectedItem?.url || ''}
            />

            <VideoPlayerModal
                visible={modals.videoPlayer}
                onClose={() => closeModal('videoPlayer')}
                title={selectedItem?.title || ''}
                videoUrl={selectedItem?.url || ''}
            />

            <ErrorModal
                visible={modals.error}
                onClose={() => closeModal('error')}
                title={selectedItem?.title || 'Erro'}
                message={selectedItem?.message || 'Ocorreu um erro inesperado.'}
            />

            <YoutubeUrlModal
                visible={youtubeModalVisible}
                initialUrl={pendingYoutubeField ? mediaData[pendingYoutubeField] || '' : ''}
                onSave={handleSaveYoutubeUrl}
                onClose={() => { setYoutubeModalVisible(false); setPendingYoutubeField(null); }}
            />

            {/* Toast de Notificação */}
            {toastVisible && (
                <View style={[styles.toast, toastType === 'success' ? styles.toastSuccess : styles.toastError]}>
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </View>
            )}
        </React.Fragment>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F9FAFB' 
    },
    header: { 
        backgroundColor: 'white', 
        paddingTop: 50, 
        paddingHorizontal: 16, 
        paddingBottom: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#E5E7EB',
        alignItems: 'center'
    },
    headerBackButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 4, 
        position: 'absolute', 
        left: 16, 
        bottom: 16 
    },
    backButtonText: { 
        fontSize: 16, 
        color: '#007AFF', 
        fontWeight: '500' 
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: '600', 
        color: '#1F2937' 
    },
    content: { 
        flex: 1 
    },
    footer: {
        backgroundColor: 'white',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    },
    saveButton: {
        backgroundColor: '#007AFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 8
    },
    saveButtonDisabled: {
        backgroundColor: '#9CA3AF'
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 32
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 16,
        textAlign: 'center',
        fontWeight: '600'
    },
    toast: {
        position: 'absolute',
        top: 80,
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 9999,
    },
    toastSuccess: {
        backgroundColor: 'rgba(0, 122, 255, 1.00)',
    },
    toastError: {
        backgroundColor: '#DC2626',
    },
    toastText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});

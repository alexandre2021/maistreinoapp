// app/criar-copia-exercicio/[id].tsx - COMPLETO COM DEBUG
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
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
import { ErrorModal } from '../../components/ErrorModal';
import LoadingIcon from '../../components/LoadingIcon';
import LoadingScreen from '../../components/LoadingScreen';
import { MediaViewerModal } from '../../components/MediaViewerModal';
import { PlanosModal } from '../../components/PlanosModal';
import { VideoPlayerModal } from '../../components/VideoPlayerModal';

// ✅ COMPONENTES CRIADOS
import { ExercicioForm, type ExercicioFormData, type ExercicioOriginal } from '../../components/ExercicioForm';
import { SimpleMediaSection, type MediaData } from '../../components/SimpleMediaSection';
import { YoutubeUrlModal } from '../../components/YoutubeUrlModal';

// ✅ HOOKS E UTILITIES
import { useImageOptimizer } from '../../components/media/ImageOptimizer';
import { useVideoOptimizer } from '../../components/media/VideoOptimizer';
import { useModalManager } from '../../hooks/useModalManager';
import { supabase } from '../../lib/supabase';

// ✅ CONSTANTS
import { type Dificuldade, type Equipamento, type GrupoMuscular } from '../../constants/exercicios';

const MAX_VIDEO_SIZE_MB = 2; // Limite de tamanho em MB (sem áudio, qualidade otimizada)
const MAX_VIDEO_DURATION_SEC = 10; // Limite de duração em segundos (foco em 2-3 repetições)

export default function CriarCopiaExercicioScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
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
    const [exercicioOriginal, setExercicioOriginal] = useState<ExercicioOriginal | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [ptId, setPtId] = useState<string>('');
    const [showPlanosModal, setShowPlanosModal] = useState(false);
    const [youtubeModalVisible, setYoutubeModalVisible] = useState(false);
    const [pendingYoutubeField, setPendingYoutubeField] = useState<keyof MediaData | null>(null);
    
    // ✅ ESTADOS DO FORMULÁRIO E MÍDIA
    const [formData, setFormData] = useState<ExercicioFormData>({
        nome: '',
        descricao: '',
        grupo_muscular: '',
        equipamento: '',
        dificuldade: 'Baixa',
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

    const { validateVideo, processVideo } = useVideoOptimizer({
        maxSizeMB: MAX_VIDEO_SIZE_MB,
        maxDurationSec: MAX_VIDEO_DURATION_SEC,
        removeAudio: true,
        quality: 'medium'
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
                // Para vídeos, usar o VideoOptimizer
                const { result, base64 } = await processVideo(uri);
                if (!result || !base64) {
                    throw new Error('Falha no processamento do vídeo');
                }
                base64Data = base64;
                metadata = {
                    sizeMB: result.sizeMB,
                    duration: result.duration,
                    audioRemoved: result.audioRemoved,
                    compressionApplied: result.compressionApplied
                };
                console.log(`📊 [Upload] Vídeo processado: ${metadata.sizeMB}MB, áudio removido: ${metadata.audioRemoved}`);
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
                    aluno_id: ptId,
                    tipo: campo,
                    bucket_type: 'exercicios'
                }
            });

            if (uploadResponse.error || !uploadResponse.data?.success) {
                console.error('❌ [Upload] Falha:', uploadResponse.error);
                return null;
            }

            console.log(`✅ [Upload] Sucesso: ${uploadResponse.data.url}`);
            return uploadResponse.data.url;

        } catch (error: unknown) {
            console.error(`💥 [Upload] Erro inesperado:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            Alert.alert('Erro', `Falha no upload: ${errorMessage}`);
            return null;
        }
    }, [optimizeAndConvertToBase64, ptId, processVideo]);

    // ✅ FUNÇÃO DE RE-UPLOAD (Supabase → Cloudflare)
    const reuploadToCloudflareOptimized = async (supabaseUrl: string, tipo: keyof MediaData): Promise<string | null> => {
        try {
            const response = await fetch(supabaseUrl);
            if (!response.ok) return null;
            
            const blob = await response.blob();
            const reader = new FileReader();
            
            const dataUrl = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            return await uploadToCloudflareOptimized(dataUrl, tipo);
        } catch (reuploadError: unknown) {
            console.error(`💥 [Re-upload] Erro:`, reuploadError);
            return null;
        }
    };

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

    // ✅ CARREGAR DADOS INICIAIS
    useEffect(() => {
        const loadData = async () => {
            if (!id) {
                Alert.alert('Erro', 'ID do exercício não encontrado');
                router.back();
                return;
            }

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    Alert.alert('Erro', 'Usuário não autenticado');
                    router.back();
                    return;
                }

                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('user_type')
                    .eq('id', user.id)
                    .single();

                if (!profile || profile.user_type !== 'personal_trainer') {
                    Alert.alert('Erro', 'Apenas personal trainers podem criar exercícios personalizados');
                    router.back();
                    return;
                }

                setPtId(user.id);

                const { data: exercicio, error } = await supabase
                    .from('exercicios')
                    .select(`
                        id, nome, descricao, grupo_muscular, equipamento, 
                        dificuldade, instrucoes, tipo,
                        imagem_1_url, imagem_2_url, video_url, youtube_url
                    `)
                    .eq('id', id)
                    .single();

                if (error) {
                    console.error('Erro ao buscar exercício:', error);
                    Alert.alert('Erro', 'Exercício não encontrado');
                    router.back();
                    return;
                }

                setExercicioOriginal(exercicio);

                // ✅ PRÉ-PREENCHER FORMULÁRIO
                setFormData({
                    nome: `${exercicio.nome} (Personalizado)`,
                    descricao: exercicio.descricao || '',
                    grupo_muscular: exercicio.grupo_muscular as GrupoMuscular || '',
                    equipamento: exercicio.equipamento as Equipamento || '',
                    dificuldade: (exercicio.dificuldade as Dificuldade) || 'Baixa',
                    instrucoes: exercicio.instrucoes || ''
                });

                // ✅ CARREGAR MÍDIAS ORIGINAIS
                setMediaData({
                    imagem_1_url: exercicio.imagem_1_url || null,
                    imagem_2_url: exercicio.imagem_2_url || null,
                    video_url: exercicio.video_url || null,
                    youtube_url: exercicio.youtube_url || null
                });

            } catch (loadError: unknown) {
                console.error('Erro inesperado:', loadError);
                Alert.alert('Erro', 'Erro ao carregar dados');
                router.back();
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, router]);

    // ✅ HANDLERS DO FORMULÁRIO
    const handleUpdateField = useCallback((field: keyof ExercicioFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // ✅ HANDLERS DE MÍDIA - AGORA SÓ PRÉ-VISUALIZA LOCALMENTE
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
            const mediaTypes: any = isVideo ? ['videos'] : ['images'];
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes,
                allowsEditing: !isVideo,
                aspect: isVideo ? undefined : [4, 3],
                quality: 1.0,
            });
            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                if (isVideo) {
                    // Usar VideoOptimizer para validação
                    const validation = await validateVideo(
                        asset.uri, 
                        asset.fileSize || undefined, 
                        asset.duration || undefined
                    );
                    
                    if (!validation.isValid) {
                        const suggestions = validation.suggestions?.join('\n') || '';
                        Alert.alert(validation.error || 'Erro na validação', suggestions);
                        setUploading(false);
                        return;
                    }

                    setMediaData(prev => ({ ...prev, [campo]: asset.uri }));
                    Alert.alert('Sucesso!', 'Vídeo selecionado! O áudio será removido automaticamente para reduzir o tamanho.');
                } else {
                    setMediaData(prev => ({ ...prev, [campo]: asset.uri }));
                    Alert.alert('Sucesso!', 'Imagem selecionada para pré-visualização!');
                }
            }
        } catch (uploadError: unknown) {
            console.error(`❌ [DEBUG] Erro ao selecionar ${campo}:`, uploadError);
            Alert.alert('Erro', 'Não foi possível carregar a mídia');
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
            const title = exercicioOriginal?.nome 
                ? `${exercicioOriginal.nome} - ${campo === 'imagem_1_url' ? 'Foto 1' : 'Foto 2'}`
                : 'Imagem do Exercício';
            openModal('mediaViewer', { url, title });
        } else if (campo === 'video_url') {
            // Para vídeos, usa o modal interno
            const title = exercicioOriginal?.nome 
                ? `${exercicioOriginal.nome} - Vídeo`
                : 'Vídeo do Exercício';
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

    // ✅ SALVAR EXERCÍCIO - AGORA FAZ O UPLOAD DAS MÍDIAS LOCAIS AQUI
    const handleSalvarCopia = async () => {
        const podeCriar = await validateExerciseLimit(ptId);
        if (!podeCriar) {
            setShowPlanosModal(true);
            return;
        }

        if (!formData.nome.trim()) {
            Alert.alert('Erro', 'Nome é obrigatório');
            return;
        }

        if (!formData.grupo_muscular) {
            Alert.alert('Erro', 'Grupo muscular é obrigatório');
            return;
        }

        if (!formData.equipamento) {
            Alert.alert('Erro', 'Equipamento é obrigatório');
            return;
        }

        setSaving(true);

        try {
            console.log('💾 Criando cópia do exercício...');

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
                        console.log(`⚠️ Falha ao enviar ${campo}, mantendo original`);
                    }
                } else if (url && isSupabaseUrl(url)) {
                    // Se for do Supabase, faz reupload
                    console.log(`🔄 Migrando ${campo} para Cloudflare...`);
                    const cloudflareUrl = await reuploadToCloudflareOptimized(url, campo);
                    if (cloudflareUrl) {
                        finalMediaData[campo] = cloudflareUrl;
                        console.log(`✅ ${campo} migrado com sucesso`);
                    } else {
                        console.log(`⚠️ Falha ao migrar ${campo}, mantendo original`);
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
                exercicio_padrao_id: exercicioOriginal?.id,
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
                Alert.alert('Erro', 'Não foi possível criar a cópia do exercício');
                return;
            }

            console.log('✅ Exercício criado:', data.id);

            // Aguarda 400ms antes de redirecionar e passa o ID para a tela de exercícios
            setLoading(true); // Mostra loading na tela
            const waitForExercise = async (exerciseId, maxWaitMs = 7000, intervalMs = 500) => {
                const start = Date.now();
                while (Date.now() - start < maxWaitMs) {
                    const { data: found, error: fetchError } = await supabase
                        .from('exercicios')
                        .select('id')
                        .eq('id', exerciseId)
                        .single();
                    if (found && !fetchError) {
                        return true;
                    }
                    await new Promise(res => setTimeout(res, intervalMs));
                }
                return false;
            };

            const found = await waitForExercise(data.id);
            setLoading(false);

            if (found) {
                router.replace(`/exercicios?tab=personalizados&waitForId=${data.id}`);
            } else {
                Alert.alert('Aviso', 'O exercício pode demorar um pouco para aparecer. Tente novamente em instantes.');
                router.replace(`/exercicios?tab=personalizados`);
            }

        } catch (saveError: unknown) {
            console.error('💥 Erro inesperado:', saveError);
            Alert.alert('Erro', 'Erro inesperado ao criar cópia');
        } finally {
            setSaving(false);
        }
    };

    // ✅ LOADING STATE
    if (loading) {
        return <LoadingScreen message="Carregando exercício original..." />;
    }

    // ✅ ERROR STATE
    if (!exercicioOriginal) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={80} color="#EF4444" />
                <Text style={styles.errorTitle}>Exercício não encontrado</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
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
                    <Text style={styles.headerTitle}>Criar Cópia Personalizada</Text>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* ✅ FORMULÁRIO DO EXERCÍCIO */}
                    <ExercicioForm
                        mode="copy"
                        formData={formData}
                        onUpdateField={handleUpdateField}
                        exercicioOriginal={exercicioOriginal}
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
                        onPress={handleSalvarCopia}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <LoadingIcon size={20} color="white" />
                                <Text style={styles.saveButtonText}>Criando...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={20} color="white" />
                                <Text style={styles.saveButtonText}>Criar Exercício Personalizado</Text>
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
                        Alert.alert('Upgrade', `Plano ${planId} selecionado! (Implementar upgrade)`);
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
    backButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 4 
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 32
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center'
    }
});
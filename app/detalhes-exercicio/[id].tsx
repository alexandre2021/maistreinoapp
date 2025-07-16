// app/detalhes-exercicio/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { ErrorModal } from '../../components/ErrorModal';
import LoadingScreen from '../../components/LoadingScreen';
import { MediaViewerModal } from '../../components/MediaViewerModal';
import type { MediaData } from '../../components/SimpleMediaSection';
import { SimpleMediaSection } from '../../components/SimpleMediaSection';
import { VideoPlayerModal } from '../../components/VideoPlayerModal';

import { BADGE_STYLES, CORES_DIFICULDADE } from '../../constants/exercicios';
import { useModalManager } from '../../hooks/useModalManager';
import { supabase } from '../../lib/supabase';

interface ExercicioDetalhado {
    id: string; nome: string; descricao: string;
    grupo_muscular: string;
    equipamento: string;
    dificuldade: 'Baixa' | 'Média' | 'Alta';
    tipo: 'padrao' | 'personalizado'; instrucoes: string; created_at: string;
    is_ativo: boolean; imagem_1_url?: string; imagem_2_url?: string;
    video_url?: string; youtube_url?: string; pt_id?: string; exercicio_padrao_id?: string;
}

export default function DetalhesExercicioScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    
    const { modals, selectedItem, openModal, closeModal } = useModalManager<{url?: string, title?: string, message?: string}>({
        mediaViewer: false,
        videoPlayer: false,
        error: false,
    });
    
    const [exercicio, setExercicio] = useState<ExercicioDetalhado | null>(null);
    const [loading, setLoading] = useState(true);

    // Funções de visualização para SimpleMediaSection (modo somente visualização)
    // Corrige tipo da função handleViewMedia para aceitar keyof MediaData
    const handleViewMedia = (campo: keyof MediaData) => {
        if (!exercicio) return;
        let url = '';
        let title = '';
        switch (campo) {
            case 'imagem_1_url':
                url = exercicio.imagem_1_url || '';
                title = exercicio.nome + ' - Foto 1';
                break;
            case 'imagem_2_url':
                url = exercicio.imagem_2_url || '';
                title = exercicio.nome + ' - Foto 2';
                break;
            case 'video_url':
                url = exercicio.video_url || '';
                title = exercicio.nome + ' - Vídeo';
                break;
            case 'youtube_url':
                url = exercicio.youtube_url || '';
                title = exercicio.nome + ' - YouTube';
                break;
            default:
                return;
        }
        if (!url) return;
        if (campo === 'imagem_1_url' || campo === 'imagem_2_url') {
            openModal('mediaViewer', { url, title });
        } else if (campo === 'video_url') {
            openModal('videoPlayer', { url, title });
        } else if (campo === 'youtube_url') {
            Linking.openURL(url);
        }
    };

    useEffect(() => {
        const fetchExercicioDetalhes = async () => {
            if (!id) {
                console.error("ID do exercício não fornecido.");
                router.back();
                return;
            }
            setLoading(true);
            try {
                console.log('🔍 Buscando exercício com ID:', id);
                
                const { data, error } = await supabase
                    .from('exercicios')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (error) {
                    throw error;
                }
                if (data) {
                    console.log('✅ Exercício carregado:', data.nome);
                    setExercicio(data);
                } else {
                    throw new Error("Exercício não encontrado");
                }
            } catch (err) {
                console.error('❌ Erro ao buscar exercício:', err);
                router.back();
            } finally {
                setLoading(false);
            }
        };

        fetchExercicioDetalhes();
    }, [id, router]);  

    const formatarData = (dataISO: string) => {
        if (!dataISO) return 'Data indisponível';
        const data = new Date(dataISO);
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    if (loading) {
        return <LoadingScreen message="Carregando exercício..." />;
    }
    
    if (!exercicio) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={80} color="#EF4444" />
                <Text style={styles.errorTitle}>Exercício não encontrado</Text>
                <TouchableOpacity style={styles.backButtonLayout} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <React.Fragment>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButtonLayout} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#A11E0A" />
                        <Text style={styles.backButtonText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.titleSection}>
                        <Text style={styles.exercicioNome}>{exercicio.nome}</Text>
                        <Text style={styles.exercicioDescricao}>{exercicio.descricao}</Text>
                    </View>
                    
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Informações Básicas</Text>
                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Grupo Muscular</Text>
                                <View style={styles.badgeNeutral}>
                                    <Text style={styles.badgeNeutralText}>{exercicio.grupo_muscular}</Text>
                                </View>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Equipamento</Text>
                                <View style={styles.badgeNeutral}>
                                    <Text style={styles.badgeNeutralText}>{exercicio.equipamento}</Text>
                                </View>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Dificuldade</Text>
                                <View style={[styles.badgeDifficulty, { backgroundColor: CORES_DIFICULDADE[exercicio.dificuldade] || '#6B7280' }]}>
                                    <Text style={styles.badgeDifficultyText}>{exercicio.dificuldade}</Text>
                                </View>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Tipo</Text>
                                <View style={[styles.badge, { backgroundColor: exercicio.tipo === 'padrao' ? '#3B82F6' : '#8B5CF6' }]}>
                                    <Text style={styles.badgeText}>
                                        {exercicio.tipo.charAt(0).toUpperCase() + exercicio.tipo.slice(1)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {exercicio.instrucoes && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Como Executar</Text>
                            <View style={styles.instrucoesContainer}>
                                {(exercicio.instrucoes || '').split('\n').map((instrucao, index) => (
                                    <Text key={index} style={styles.instrucaoText}>{instrucao}</Text>
                                ))}
                            </View>
                        </View>
                    )}
                    
                    {/* Substitui carrossel de mídia por SimpleMediaSection */}
                    <View style={styles.section}>
                        <SimpleMediaSection
                            mediaData={{
                                imagem_1_url: exercicio.imagem_1_url || null,
                                imagem_2_url: exercicio.imagem_2_url || null,
                                video_url: exercicio.video_url || null,
                                youtube_url: exercicio.youtube_url || null,
                                imagem_1_thumbnail: exercicio.imagem_1_url ? exercicio.imagem_1_url + '?width=400&height=400&resize=cover&quality=70' : null,
                                imagem_2_thumbnail: exercicio.imagem_2_url ? exercicio.imagem_2_url + '?width=400&height=400&resize=cover&quality=70' : null,
                            }}
                            onUpload={() => {}}
                            onRemove={() => {}}
                            onView={handleViewMedia}
                            uploading={false}
                            disabled={true}
                            readOnly={true}
                            hideEmpty={true}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Informações Adicionais</Text>
                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Status</Text>
                                <Text style={[styles.infoValue, { color: exercicio.is_ativo ? '#10B981' : '#EF4444' }]}>
                                    {exercicio.is_ativo ? 'Ativo' : 'Inativo'}
                                </Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Criado em</Text>
                                <Text style={styles.infoValue}>{formatarData(exercicio.created_at)}</Text>
                            </View>
                            {exercicio.exercicio_padrao_id && (
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>Baseado no Exercício</Text>
                                    <Text style={styles.infoValue}>#{exercicio.exercicio_padrao_id.substring(0, 8)}...</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </View>

            <MediaViewerModal
                visible={modals.mediaViewer}
                onClose={() => {
                    console.log('🔒 Fechando MediaViewer');
                    closeModal('mediaViewer');
                }}
                title={selectedItem?.title || ''}
                imageUrl={selectedItem?.url || ''}
            />

            <VideoPlayerModal
                visible={modals.videoPlayer}
                onClose={() => {
                    console.log('🔒 Fechando VideoPlayer');
                    closeModal('videoPlayer');
                }}
                title={selectedItem?.title || ''}
                videoUrl={selectedItem?.url || ''}
            />

            <ErrorModal
                visible={modals.error}
                onClose={() => {
                    console.log('🔒 Fechando ErrorModal');
                    closeModal('error');
                }}
                title={selectedItem?.title || 'Erro'}
                message={selectedItem?.message || 'Ocorreu um erro inesperado.'}
            />
        </React.Fragment>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { backgroundColor: 'white', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    backButtonLayout: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    backButtonText: { fontSize: 16, color: '#A11E0A', fontWeight: '500' },
    content: { flex: 1 },
    titleSection: { backgroundColor: 'white', padding: 20, marginBottom: 16 },
    exercicioNome: { fontSize: 28, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
    exercicioDescricao: { fontSize: 16, color: '#6B7280', lineHeight: 24 },
    section: { backgroundColor: 'white', marginBottom: 16, paddingVertical: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: '#1F2937', marginBottom: 16, paddingHorizontal: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
    optimizationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    optimizationText: { fontSize: 12, color: '#10B981', fontWeight: '600' },
    infoGrid: { gap: 16, paddingHorizontal: 20 },
    infoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    infoLabel: { fontSize: 16, color: '#6B7280', fontWeight: '500' },
    infoValue: { fontSize: 16, color: '#1F2937', fontWeight: '600' },
    badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    badgeText: { color: 'white', fontSize: 14, fontWeight: '600' },
    instrucoesContainer: { gap: 8, paddingHorizontal: 20 },
    instrucaoText: { fontSize: 16, color: '#374151', lineHeight: 24 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    loadingText: { fontSize: 16, color: '#6B7280', marginTop: 16 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 32 },
    errorTitle: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginTop: 16, marginBottom: 8, textAlign: 'center' },
    badgeNeutral: { backgroundColor: BADGE_STYLES.neutral.backgroundColor, paddingHorizontal: BADGE_STYLES.neutral.paddingHorizontal, paddingVertical: BADGE_STYLES.neutral.paddingVertical, borderRadius: BADGE_STYLES.neutral.borderRadius },
    badgeNeutralText: { fontSize: BADGE_STYLES.neutral.fontSize, fontWeight: BADGE_STYLES.neutral.fontWeight, color: BADGE_STYLES.neutral.textColor },
    badgeDifficulty: { paddingHorizontal: BADGE_STYLES.difficulty.paddingHorizontal, paddingVertical: BADGE_STYLES.difficulty.paddingVertical, borderRadius: BADGE_STYLES.difficulty.borderRadius },
    badgeDifficultyText: { fontSize: BADGE_STYLES.difficulty.fontSize, fontWeight: BADGE_STYLES.difficulty.fontWeight, color: BADGE_STYLES.difficulty.textColor },
});
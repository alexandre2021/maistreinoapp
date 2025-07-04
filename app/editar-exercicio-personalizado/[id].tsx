import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { ErrorModal } from '../../components/ErrorModal';
import LoadingIcon from '../../components/LoadingIcon';
import LoadingScreen from '../../components/LoadingScreen';
import { MediaViewerModal } from '../../components/MediaViewerModal';
import { PlanosModal } from '../../components/PlanosModal';
import { VideoPlayerModal } from '../../components/VideoPlayerModal';
import { YoutubeUrlModal } from '../../components/YoutubeUrlModal';

import { ExercicioForm, type ExercicioFormData } from '../../components/ExercicioForm';
import { SimpleMediaSection, type MediaData } from '../../components/SimpleMediaSection';
import { useImageOptimizer } from '../../components/media/ImageOptimizer';

import { useModalManager } from '../../hooks/useModalManager';
import { supabase, supabaseUrl } from '../../lib/supabase';

const MAX_VIDEO_SIZE_MB = 20;
const MAX_VIDEO_DURATION_SEC = 30;

export default function EditarExercicioPersonalizadoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { modals, selectedItem, closeModal } = useModalManager<{ url?: string; title?: string; message?: string }>({
    mediaViewer: false,
    videoPlayer: false,
    error: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPlanosModal, setShowPlanosModal] = useState(false);
  const [youtubeVisible, setYoutubeVisible] = useState(false);
  const [pendingField, setPendingField] = useState<keyof MediaData | null>(null);

  // Estados do Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error') => {
    console.log('🍞 SHOW TOAST CHAMADO:', message, type);
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  };

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

  const [exercicioOriginal, setExercicioOriginal] = useState<any>(null);
  const [originalMediaUrls, setOriginalMediaUrls] = useState<{
    imagem_1_url: string | null;
    imagem_2_url: string | null;
    video_url: string | null;
  }>({
    imagem_1_url: null,
    imagem_2_url: null,
    video_url: null
  });

  const { optimizeAndConvertToBase64 } = useImageOptimizer({ maxSizeKB: 200, maxWidth: 1080, quality: 0.8, format: 'webp' });

  useEffect(() => { console.log('MediaData:', mediaData); }, [mediaData]);
  const isSupabaseUrl = (url: string) => url.includes('supabase.co') || url.includes('supabase.in');

  // Função para obter URL assinada via Edge Function
  const getSignedUrl = async (url: string, bucketType: string = 'exercicios'): Promise<string> => {
    try {
      const filename = url.split('?')[0].substring(url.lastIndexOf('/') + 1);
      const { data: resp, error } = await supabase.functions.invoke('get-image-url', {
        body: { filename, bucket_type: bucketType }
      });
      if (error || !resp?.success) {
        console.warn('Erro ao obter URL assinada:', error);
        return url;
      }
      return resp.url;
    } catch (e) {
      console.warn('Erro getSignedUrl:', e);
      return url;
    }
  };

  const uploadToCloudflare = useCallback(async (uri: string, field: keyof MediaData): Promise<string | null> => {
    try {
      console.log(`📤 [UPLOAD] Iniciando upload para ${field}:`, uri.substring(0, 100) + '...');
      
      let base64: string;
      if (field === 'video_url') {
        const res = await fetch(uri);
        const blob = await res.blob();
        const reader = new FileReader();
        base64 = await new Promise((resR) => { reader.onload = () => resR((reader.result as string).split(',')[1]); reader.readAsDataURL(blob); });
      } else {
        const optimized = await optimizeAndConvertToBase64(uri);
        base64 = optimized.base64;
      }
      
      const filename = `${field}_${Date.now()}.webp`;
      console.log(`📤 [UPLOAD] Fazendo upload do arquivo:`, filename);
      
      const { data: resp, error } = await supabase.functions.invoke('upload-imagem', { 
        body: { filename, image_base64: base64, bucket_type: 'exercicios' } 
      });
      
      if (error) {
        console.error(`❌ [UPLOAD] Erro na Edge Function:`, error);
        throw error;
      }
      
      if (!resp?.url) {
        console.error(`❌ [UPLOAD] Resposta inválida:`, resp);
        throw new Error('URL não retornada');
      }
      
      console.log(`✅ [UPLOAD] Upload bem-sucedido para ${field}:`, resp.url);
      return resp.url;
    } catch (e) { 
      console.error(`❌ [UPLOAD] Falha no upload para ${field}:`, e); 
      // Note: Não mostrar toast aqui, será tratado na função que chama
      return null; 
    }
  }, [optimizeAndConvertToBase64]);

  const reupload = async (url: string, field: keyof MediaData): Promise<string | null> => {
    try {
      console.log(`🔄 [REUPLOAD] Fazendo reupload de:`, url);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`❌ [REUPLOAD] Falha ao buscar URL:`, response.status, response.statusText);
        return null;
      }
      
      const blob = await response.blob();
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      console.log(`🔄 [REUPLOAD] Data URL gerada, fazendo upload...`);
      const newUrl = await uploadToCloudflare(dataUrl, field);
      
      if (newUrl) {
        console.log(`✅ [REUPLOAD] Reupload bem-sucedido:`, newUrl);
      } else {
        console.error(`❌ [REUPLOAD] Upload falhou após fetch`);
      }
      
      return newUrl;
    } catch (error) {
      console.error(`❌ [REUPLOAD] Erro no reupload:`, error);
      return null;
    }
  };

  // Função auxiliar para deletar mídia no Cloudflare via Edge Function (COPIADA DA EXCLUSÃO QUE FUNCIONA)
  const deleteMediaFromCloudflare = async (fileUrl: string | undefined, bucketType = 'exercicios') => {
    if (!fileUrl) return;
    try {
      // Extrai apenas o nome do arquivo (ex: abc123.jpg), ignorando subpastas
      let filename = fileUrl.split('?')[0]; // remove query params se houver
      filename = filename.substring(filename.lastIndexOf('/') + 1);
      if (!filename) return;
      
      console.log('🗑️ [DELETE] Processando deleção:', {
        url_completa: fileUrl,
        filename_extraído: filename,
        bucket_type: bucketType,
        arquivo_no_bucket: `exerciciospt/${filename}`
      });
      
      // Pega o token do usuário autenticado
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const body = {
        filename, // apenas o nome do arquivo
        bucket_type: bucketType
      };
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      console.log('🗑️ Deletando mídia:', filename);
      console.log('🗑️ [DEBUG] URL completa sendo deletada:', fileUrl);
      console.log('🗑️ [DEBUG] Filename extraído:', filename);
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-image`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      
      const responseText = await response.text();
      if (!response.ok) {
        console.warn('❌ Erro ao deletar mídia:', responseText);
      } else {
        console.log('✅ Mídia deletada:', responseText);
      }
    } catch (err) {
      console.warn('❌ Erro ao chamar edge function de deleção:', err);
    }
  };

  useEffect(() => {
    (async () => {
      if (!id) return router.back();
      const { data, error } = await supabase.from('exercicios').select('*').eq('id', id).single();
      if (error || !data) {
        showToast('Exercício não encontrado', 'error');
        setTimeout(() => router.back(), 2000);
        return;
      }
      
      setFormData({ 
        nome: data.nome, 
        descricao: data.descricao || '', 
        grupo_muscular: data.grupo_muscular || '', 
        equipamento: data.equipamento || '', 
        dificuldade: data.dificuldade as any, 
        instrucoes: data.instrucoes || '' 
      });

      // Se foi criado baseado em um exercício padrão, buscar o exercício original
      if (data.exercicio_padrao_id) {
        const { data: originalData } = await supabase
          .from('exercicios')
          .select('nome, descricao')
          .eq('id', data.exercicio_padrao_id)
          .single();
        
        if (originalData) {
          setExercicioOriginal(originalData);
        }
      }

      // Salvar URLs originais para detectar mudanças
      setOriginalMediaUrls({
        imagem_1_url: data.imagem_1_url,
        imagem_2_url: data.imagem_2_url,
        video_url: data.video_url
      });

      console.log('🔍 [CARREGAMENTO] URLs ORIGINAIS do banco:', {
        imagem_1_url: data.imagem_1_url,
        imagem_2_url: data.imagem_2_url,
        video_url: data.video_url
      });

      // Obter URLs assinadas para imagens e vídeo
      const signed1 = data.imagem_1_url ? await getSignedUrl(data.imagem_1_url) : null;
      const signed2 = data.imagem_2_url ? await getSignedUrl(data.imagem_2_url) : null;
      const signedVideo = data.video_url ? await getSignedUrl(data.video_url) : null;
      setMediaData({
        // usa URLs assinadas para carregar as imagens
        imagem_1_url: signed1,
        imagem_2_url: signed2,
        video_url: signedVideo,
        youtube_url: data.youtube_url,
        imagem_1_thumbnail: signed1,
        imagem_2_thumbnail: signed2
      });
      setLoading(false);
    })();
  }, [id, router]);

  const handleField = (field: keyof ExercicioFormData, val: string) => setFormData((p) => ({ ...p, [field]: val }));
  const handleMedia = async (field: keyof MediaData) => {
    if (field === 'youtube_url') { setPendingField(field); return setYoutubeVisible(true); }
    
    console.log(`🔄 [TROCAR] Iniciando troca de ${field}, URL atual:`, mediaData[field]);
    
    setUploading(true);
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: field === 'video_url' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!res.canceled) {
      console.log(`📱 [TROCAR] Nova mídia selecionada para ${field}:`, res.assets[0].uri);
      
      // Limpa o thumbnail correspondente ao trocar a imagem
      setMediaData((p) => ({
        ...p,
        [field]: res.assets[0].uri,
        [`${field.replace('_url', '_thumbnail')}`]: null
      }));
      
      console.log(`✅ [TROCAR] ${field} atualizado. URL original preservada em originalMediaUrls:`, originalMediaUrls[field]);
    }
    setUploading(false);
  };
  const handleRemove = (field: keyof MediaData) => {
    setMediaData((p) => ({ ...p, [field]: null }));
  };
  const handleView = (field: keyof MediaData) => mediaData[field] && Linking.openURL(mediaData[field]!);
  const saveYoutube = (url: string) => { pendingField && setMediaData((p) => ({ ...p, [pendingField]: url })); setYoutubeVisible(false); };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      showToast('Nome do exercício é obrigatório', 'error');
      return;
    }
    setSaving(true);
    
    const final = { ...mediaData };
    const urlsToDelete: string[] = [];
    
    console.log('🔍 [DEBUG INICIAL] Estado antes do processamento:', {
      mediaData_atual: final,
      originalMediaUrls: originalMediaUrls
    });
    
    // Upload das novas mídias e identificar URLs antigas para deletar
    for (const f of ['imagem_1_url','imagem_2_url','video_url'] as (keyof MediaData)[]) {
      const currentUrl = final[f];
      const originalUrl = originalMediaUrls[f];
      
      // Normalizar URLs para comparação (remover assinaturas do Supabase)
      const normalizeUrl = (url: string | null | undefined) => {
        if (!url) return null;
        if (url.startsWith('data:') || url.startsWith('file:')) return url; // URIs locais mantém como estão
        return url.split('?')[0]; // Remove query params (como assinaturas)
      };
      
      const normalizedCurrent = normalizeUrl(currentUrl);
      const normalizedOriginal = normalizeUrl(originalUrl);
      const urlMudou = normalizedCurrent !== normalizedOriginal;
      
      // DEBUG: Log específico para imagem 1
      if (f === 'imagem_1_url') {
        console.log('📸 [PROCESSAMENTO IMAGEM 1]:', {
          field: f,
          currentUrl: currentUrl,
          originalUrl: originalUrl,
          normalizedCurrent: normalizedCurrent,
          normalizedOriginal: normalizedOriginal,
          urlMudou: urlMudou,
          currentUrlType: currentUrl ? (currentUrl.startsWith('http') ? 'URL_REMOTA' : 'URI_LOCAL') : 'NULA',
          originalUrlType: originalUrl ? (isSupabaseUrl(originalUrl) ? 'SUPABASE' : 'CLOUDFLARE') : 'NULA'
        });
      }
      
      // ✅ SÓ PROCESSAR SE REALMENTE MUDOU
      if (currentUrl && !currentUrl.startsWith('http') && urlMudou) {
        // Nova mídia local, fazer upload APENAS se mudou
        console.log(`📤 [${f}] Upload necessário - URL mudou de "${originalUrl}" para "${currentUrl?.substring(0, 50)}..."`);
        const newUrl = await uploadToCloudflare(currentUrl, f);
        if (newUrl) {
          final[f] = newUrl;
          // Se havia uma URL original, marcar para deletar
          if (originalUrl && !isSupabaseUrl(originalUrl)) {
            console.log(`🎯 [${f}] MARCANDO PARA DELETAR - URL original:`, originalUrl);
            urlsToDelete.push(originalUrl);
          }
        } else {
          // Se falhou o upload, não enviar dados inválidos
          console.warn(`❌ [${f}] Upload falhou, mantendo valor original`);
          final[f] = originalUrl;
        }
      } else if (currentUrl && isSupabaseUrl(currentUrl) && urlMudou) {
        // Reupload de URL do Supabase APENAS se mudou
        console.log(`🔄 [${f}] Reupload necessário - URL mudou de "${originalUrl}" para "${currentUrl}"`);
        const newUrl = await reupload(currentUrl, f);
        if (newUrl) {
          final[f] = newUrl;
          // Se havia uma URL original, marcar para deletar
          if (originalUrl && !isSupabaseUrl(originalUrl)) {
            console.log(`🎯 [${f}] MARCANDO PARA DELETAR - URL original:`, originalUrl);
            urlsToDelete.push(originalUrl);
          }
        } else {
          // Se falhou o reupload, manter valor original
          console.warn(`❌ [${f}] Reupload falhou, mantendo valor original`);
          final[f] = originalUrl;
        }
      } else if (!currentUrl && originalUrl && !isSupabaseUrl(originalUrl)) {
        // Mídia foi removida, marcar URL original para deletar
        console.log(`🗑️ [${f}] Mídia removida, marcando URL original para deletar:`, originalUrl);
        urlsToDelete.push(originalUrl);
        final[f] = null;
      } else if (!urlMudou) {
        // Não mudou, usar URL original no banco (não a assinada)
        console.log(`⏭️ [${f}] Skip - sem mudanças, usando URL original do banco:`, originalUrl);
        final[f] = originalUrl;
      } else {
        console.log(`⏭️ [${f}] Skip - condições não atendidas`);
      }
    }

    // Limpar campos de thumbnail do objeto final (não devem ir para o banco)
    const finalClean = { ...final };
    delete finalClean.imagem_1_thumbnail;
    delete finalClean.imagem_2_thumbnail;
    
    // Salvar no banco PRIMEIRO
    const upd = { 
      nome: formData.nome.trim(), 
      descricao: formData.descricao.trim(), 
      grupo_muscular: formData.grupo_muscular, 
      equipamento: formData.equipamento, 
      dificuldade: formData.dificuldade, 
      instrucoes: formData.instrucoes.trim(), 
      ...finalClean 
    };
    
    console.log('💾 [SUPABASE] Dados que serão enviados para update:', {
      id: id,
      update_data: upd,
      final_media_clean: finalClean
    });
    
    // Verificar se há dados inválidos
    for (const [key, value] of Object.entries(upd)) {
      if (typeof value === 'string' && value.length > 10000) {
        console.error(`❌ [VALIDATION] Campo ${key} muito grande (${value.length} chars):`, value.substring(0, 100) + '...');
      }
      if (typeof value === 'string' && value.startsWith('data:')) {
        console.error(`❌ [VALIDATION] Campo ${key} contém data URI:`, value.substring(0, 100) + '...');
        setSaving(false);
        showToast(`Campo ${key} contém dados inválidos (URI local)`, 'error');
        return;
      }
      if (typeof value === 'string' && value.includes('file://')) {
        console.error(`❌ [VALIDATION] Campo ${key} contém file URI:`, value.substring(0, 100) + '...');
        setSaving(false);
        showToast(`Campo ${key} contém dados inválidos (file URI)`, 'error');
        return;
      }
    }
    
    const { error } = await supabase.from('exercicios').update(upd).eq('id', id);
    
    if (error) {
      console.error('❌ [SUPABASE ERROR]:', error);
      setSaving(false);
      showToast(`Erro ao salvar: ${error.message}`, 'error');
      return;
    }
    
    // SÓ DELETAR URLs antigas DEPOIS que salvou com sucesso
    console.log('📋 [LISTA DELEÇÃO] URLs marcadas para deletar:', urlsToDelete);
    for (const urlToDelete of urlsToDelete) {
      console.log('🗑️ [EXECUTANDO] Deletando URL antiga após salvar:', urlToDelete);
      await deleteMediaFromCloudflare(urlToDelete);
    }
    
    setSaving(false);
    
    // Mostrar toast de sucesso e redirecionar após um delay
    showToast('Exercício atualizado com sucesso!', 'success');
    setTimeout(() => {
      router.replace('/exercicios?tab=personalizados');
    }, 1500); // 1.5 segundos para mostrar o toast antes de redirecionar
  };

  if (loading) return <LoadingScreen message="Carregando exercício..." />;

  return (
    <>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (router.canGoBack && router.canGoBack()) {
              router.back();
            } else {
              router.replace('/exercicios?tab=personalizados');
            }
          }}>
            <Ionicons name="chevron-back" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Editar Exercício Personalizado</Text>
          <View style={{width:24}} />
        </View>
        <ScrollView style={styles.content}>
          <ExercicioForm 
            mode="copy" 
            formData={formData} 
            onUpdateField={handleField} 
            exercicioOriginal={exercicioOriginal}
            disabled={saving} 
          />
          <SimpleMediaSection mediaData={mediaData} onUpload={handleMedia} onRemove={handleRemove} onView={handleView} uploading={uploading} disabled={saving} />
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.saveButton, saving&&styles.disabled]} onPress={handleSave} disabled={saving}>
            {saving ? <LoadingIcon color="#fff" size={20} /> : <Text style={styles.saveText}>Salvar</Text>}
          </TouchableOpacity>
        </View>
        <PlanosModal visible={showPlanosModal} onClose={()=>setShowPlanosModal(false)} onSelectPlan={()=>setShowPlanosModal(false)} />
      </KeyboardAvoidingView>
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
        title={selectedItem?.title || ''}
        message={selectedItem?.message || ''}
      />
      <YoutubeUrlModal
        visible={youtubeVisible}
        initialUrl={mediaData[pendingField!] || ''}
        onSave={saveYoutube}
        onClose={() => setYoutubeVisible(false)}
      />
      
      {/* Toast de Notificação */}
      {toastVisible && (
        <View style={[styles.toast, toastType === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#F9FAFB'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16,paddingTop:50,backgroundColor:'white'},
  title:{fontSize:18,fontWeight:'600',color:'#1F2937'},
  content:{flex:1,padding:16},
  footer:{padding:16,backgroundColor:'white',borderTopWidth:1,borderColor:'#E5E7EB'},
  saveButton:{backgroundColor:'#007AFF',padding:14,borderRadius:8,alignItems:'center'},
  disabled:{backgroundColor:'#9CA3AF'},
  saveText:{color:'#fff',fontSize:16,fontWeight:'600'},
  loadingContainer:{flex:1,justifyContent:'center',alignItems:'center'},
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

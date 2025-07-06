import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import {
    ANOS_EXPERIENCIA_PT,
    CORES_AVATAR,
    ESPECIALIZACOES_PT,
    formatarTelefone,
    GENEROS,
    isGeneroValido,
    isURLValida,
    VALIDACOES,
    type AnosExperienciaPT,
    type EspecializacaoPT,
    type Genero
} from '../../constants/usuarios';
import { supabase } from '../../lib/supabase';

export interface PersonalTrainerData {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  telefone_publico: boolean;
  data_nascimento: string;
  genero: Genero; // ✅ Tipagem forte
  cref: string;
  anos_experiencia: AnosExperienciaPT; // ✅ Tipagem forte
  especializacoes: EspecializacaoPT[]; // ✅ Tipagem forte
  bio: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  website: string;
  avatar_letter: string;
  avatar_color: string;
  avatar_type: 'letter' | 'image';
  avatar_image_url: string | null;
  codigo_pt: string;
}

export interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
}

export const usePerfil = () => {
  // ========= ESTADOS =========
  const [activeTab, setActiveTab] = useState<'pessoal' | 'profissional' | 'redes' | 'seguranca'>('pessoal');
  const [userData, setUserData] = useState<PersonalTrainerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGeneroOptions, setShowGeneroOptions] = useState(false);
  const [showExperienciaOptions, setShowExperienciaOptions] = useState(false);
  const [editingSection, setEditingSection] = useState<'pessoal' | 'profissional' | 'redes' | null>(null);
  const [editData, setEditData] = useState<Partial<PersonalTrainerData>>({});
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(2000);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });
  const [toastAnimation] = useState(new Animated.Value(0));

  // ========= CONSTANTES CENTRALIZADAS =========
  // ✅ Substituindo arrays hardcoded por imports das constantes
  const avatarColors = CORES_AVATAR;
  const generoOptions = GENEROS;
  const experienciaOptions = ANOS_EXPERIENCIA_PT;
  const especializacoesOptions = ESPECIALIZACOES_PT;

  // ========= FUNÇÕES UTILITÁRIAS =========
  // ✅ Usando função centralizada de formatação
  const formatPhoneNumber = (phone: string) => formatarTelefone(phone);

  const formatDateBrazilian = (day: number, month: number, year: number) => {
    return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
  };

  const formatDateISO = (day: number, month: number, year: number) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const parseBrazilianDate = (dateString: string) => {
    if (!dateString) return null;
    
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    
    return { day, month, year };
  };

  const parseISODate = (dateString: string) => {
    if (!dateString) return null;
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    
    return { day, month, year };
  };

  const formatISOToBrazilian = (isoDate: string) => {
    const parsed = parseISODate(isoDate);
    if (!parsed) return isoDate;
    return formatDateBrazilian(parsed.day, parsed.month, parsed.year);
  };

  const getCurrentDate = () => {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear()
    };
  };

  // ========= VALIDAÇÕES CENTRALIZADAS =========
  const validateEditData = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validar nome
    if (editData.nome_completo) {
      if (editData.nome_completo.length < VALIDACOES.nomeMinLength) {
        errors.push(`Nome deve ter pelo menos ${VALIDACOES.nomeMinLength} caracteres`);
      }
      if (editData.nome_completo.length > VALIDACOES.nomeMaxLength) {
        errors.push(`Nome deve ter no máximo ${VALIDACOES.nomeMaxLength} caracteres`);
      }
    }

    // Validar gênero
    if (editData.genero && !isGeneroValido(editData.genero)) {
      errors.push('Gênero selecionado é inválido');
    }

    // Validar bio
    if (editData.bio) {
      if (editData.bio.length < VALIDACOES.bioMinLength) {
        errors.push(`Bio deve ter pelo menos ${VALIDACOES.bioMinLength} caracteres`);
      }
      if (editData.bio.length > VALIDACOES.bioMaxLength) {
        errors.push(`Bio deve ter no máximo ${VALIDACOES.bioMaxLength} caracteres`);
      }
    }

    // Validar URLs das redes sociais
    if (editData.instagram && !isURLValida(editData.instagram, 'instagram')) {
      errors.push('URL do Instagram inválida');
    }
    if (editData.facebook && !isURLValida(editData.facebook, 'facebook')) {
      errors.push('URL do Facebook inválida');
    }
    if (editData.linkedin && !isURLValida(editData.linkedin, 'linkedin')) {
      errors.push('URL do LinkedIn inválida');
    }
    if (editData.website && !isURLValida(editData.website, 'website')) {
      errors.push('URL do website inválida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // ========= FUNÇÕES DE TOAST =========
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    
    Animated.sequence([
      Animated.timing(toastAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(toastAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast({ visible: false, message: '', type: 'success' });
    });
  };

  // ========= FUNÇÕES DE UPLOAD (CORRIGIDAS) =========
  const uploadAvatar = async (uri: string) => {
    try {
      console.log('=== 🚀 [usePerfil] INICIO UPLOAD ===');
      console.log('🖼️ [usePerfil] URI recebida:', uri);
      console.log('👤 [usePerfil] User ID:', userData?.id);
      
      setUploading(true);
      
      if (!userData) {
        console.log('❌ [usePerfil] userData não encontrado');
        showToast('Erro: dados do usuário não encontrados', 'error');
        return;
      }

      // ✅ PRIMEIRO: DELETAR AVATAR ANTERIOR (se existir)
      if (userData.avatar_image_url && userData.avatar_type === 'image') {
        try {
          console.log('🗑️ [usePerfil] Deletando avatar anterior...');
          const oldUrl = userData.avatar_image_url.split('?')[0];
          const pathMatch = oldUrl.match(/\/avatars\/(.+)$/);
          
          if (pathMatch) {
            const oldPath = pathMatch[1];
            console.log('🗑️ [usePerfil] Deletando arquivo antigo:', oldPath);
            
            const { error: deleteError } = await supabase.storage
              .from('avatars')
              .remove([oldPath]);
            
            if (deleteError) {
              console.warn('⚠️ [usePerfil] Erro ao deletar avatar anterior:', deleteError);
            } else {
              console.log('✅ [usePerfil] Avatar anterior deletado com sucesso');
            }
          }
        } catch (cleanupError) {
          console.warn('⚠️ [usePerfil] Erro no cleanup do avatar anterior:', cleanupError);
        }
      }

      // Teste de conectividade com Supabase
      console.log('🔍 [usePerfil] Testando conectividade com Supabase...');
      const { error: testError } = await supabase
        .from('personal_trainers')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ [usePerfil] Erro na conectividade:', testError);
        showToast('Erro de conectividade com o banco de dados', 'error');
        return;
      }

      // ✅ NOVO: Nome único SEM pasta (direto na raiz)
      const timestamp = Date.now();
      const fileName = `${userData.id}_avatar_${timestamp}.jpg`;
      console.log('📄 [usePerfil] Nome do arquivo (sem pasta):', fileName);

      console.log('📥 [usePerfil] Fazendo fetch da URI...');
      const response = await fetch(uri);
      console.log('📊 [usePerfil] Status do fetch:', response.status);
      
      if (!response.ok) {
        throw new Error(`Fetch falhou com status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('📦 [usePerfil] Blob criado - Tamanho:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('Blob está vazio - imagem pode estar corrompida');
      }

      console.log('☁️ [usePerfil] Iniciando upload para Supabase Storage...');
      console.log('🪣 [usePerfil] Bucket: avatars');
      console.log('📂 [usePerfil] Path (raiz):', fileName);
      
      // ✅ SEGUNDO: FAZER UPLOAD DA NOVA IMAGEM (direto na raiz)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('❌ [usePerfil] Erro no upload:', uploadError);
        showToast('Erro ao fazer upload da imagem: ' + uploadError.message, 'error');
        return;
      }

      console.log('✅ [usePerfil] Upload realizado com sucesso!');

      // Obter URL pública da imagem
      console.log('🔗 [usePerfil] Obtendo URL pública...');
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('🔗 [usePerfil] URL obtida:', urlData.publicUrl);

      if (!urlData.publicUrl) {
        console.log('❌ [usePerfil] URL pública não obtida');
        showToast('Erro ao obter URL da imagem', 'error');
        return;
      }

      // ✅ TERCEIRO: ATUALIZAR BANCO DE DADOS
      console.log('💾 [usePerfil] Atualizando banco de dados...');
      const { error: updateError } = await supabase
        .from('personal_trainers')
        .update({
          avatar_type: 'image',
          avatar_image_url: urlData.publicUrl
        })
        .eq('id', userData.id);

      if (updateError) {
        console.error('❌ [usePerfil] Erro ao atualizar BD:', updateError);
        showToast('Erro ao salvar imagem no perfil: ' + updateError.message, 'error');
        return;
      }

      console.log('✅ [usePerfil] Banco de dados atualizado!');

      // URL com cache buster para forçar reload da imagem
      const imageUrlWithCacheBuster = `${urlData.publicUrl}?t=${Date.now()}`;
      console.log('🔄 [usePerfil] URL com cache buster:', imageUrlWithCacheBuster);

      // ✅ QUARTO: ATUALIZAR ESTADO LOCAL
      setUserData({
        ...userData,
        avatar_type: 'image',
        avatar_image_url: imageUrlWithCacheBuster
      });

      console.log('🎉 [usePerfil] PROCESSO CONCLUÍDO COM SUCESSO!');
      showToast('Foto do perfil atualizada com sucesso!');
      
    } catch (error: unknown) {
      console.error('💥 [usePerfil] Erro inesperado no upload:', error);
      if (error instanceof Error) {
        showToast('Erro inesperado ao fazer upload: ' + error.message, 'error');
      } else {
        showToast('Erro inesperado ao fazer upload', 'error');
      }
    } finally {
      setUploading(false);
      console.log('🏁 [usePerfil] Upload finalizado');
    }
  };

  // Voltar para letra no avatar
  const switchToLetterAvatar = async () => {
    if (!userData) return;

    try {
      console.log('🔤 [usePerfil] Voltando para avatar com letra');
      
      // ✅ PRIMEIRO: DELETAR IMAGEM ATUAL (se existir)
      if (userData.avatar_image_url && userData.avatar_type === 'image') {
        try {
          const oldUrl = userData.avatar_image_url.split('?')[0];
          const pathMatch = oldUrl.match(/\/avatars\/(.+)$/);
          
          if (pathMatch) {
            const oldPath = pathMatch[1];
            console.log('🗑️ [usePerfil] Deletando imagem atual:', oldPath);
            
            const { error: deleteError } = await supabase.storage
              .from('avatars')
              .remove([oldPath]);
            
            if (!deleteError) {
              console.log('✅ [usePerfil] Imagem deletada com sucesso');
            }
          }
        } catch (cleanupError) {
          console.warn('⚠️ [usePerfil] Erro ao deletar imagem:', cleanupError);
        }
      }

      // ✅ SEGUNDO: ATUALIZAR BANCO PARA LETRA
      const { error } = await supabase
        .from('personal_trainers')
        .update({ 
          avatar_type: 'letter',
          avatar_image_url: null 
        })
        .eq('id', userData.id);

      if (error) {
        console.error('❌ [usePerfil] Erro ao alterar avatar:', error);
        showToast('Erro ao alterar avatar', 'error');
        return;
      }

      // ✅ TERCEIRO: ATUALIZAR ESTADO LOCAL
      setUserData({ 
        ...userData, 
        avatar_type: 'letter',
        avatar_image_url: null 
      });
      showToast('Avatar alterado para letra!');
      console.log('✅ [usePerfil] Avatar alterado para letra com sucesso');
    } catch (error) {
      console.error('💥 [usePerfil] Erro ao alterar avatar:', error);
      showToast('Erro inesperado', 'error');
    }
  };

  // ========= FUNÇÕES DE DADOS =========
  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/');
        return;
      }

      const { data, error } = await supabase
        .from('personal_trainers')
        .select('*, codigo_pt')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao carregar dados:', error);
        showToast('Erro ao carregar dados do perfil', 'error');
        return;
      }

      if (data) {
        setUserData({
          ...data,
          email: user.email || ''
        });
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      showToast('Erro inesperado ao carregar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ========= FUNÇÕES DE EDIÇÃO =========
  const openEditModal = (section: 'pessoal' | 'profissional' | 'redes') => {
    setEditingSection(section);
    
    // Converter data ISO do banco para formato brasileiro para exibição
    const editDataCopy = { ...userData };
    if (editDataCopy?.data_nascimento) {
      editDataCopy.data_nascimento = formatISOToBrazilian(editDataCopy.data_nascimento);
    }
    setEditData(editDataCopy || {});
    
    // Se estamos editando dados pessoais e há uma data de nascimento, configurar o seletor
    if (section === 'pessoal' && userData?.data_nascimento) {
      const parsedDate = parseISODate(userData.data_nascimento);
      if (parsedDate) {
        setSelectedDay(parsedDate.day);
        setSelectedMonth(parsedDate.month);
        setSelectedYear(parsedDate.year);
      } else {
        setSelectedDay(1);
        setSelectedMonth(0);
        setSelectedYear(1990);
      }
    } else {
      setSelectedDay(1);
      setSelectedMonth(0);
      setSelectedYear(1990);
    }
    
    setShowEditModal(true);
  };

  const saveChanges = async () => {
    if (!userData || !editingSection) return;

    try {
      // ✅ VALIDAR DADOS ANTES DE SALVAR
      const validation = validateEditData();
      if (!validation.isValid) {
        showToast(validation.errors[0], 'error'); // Mostrar primeiro erro
        return;
      }

      const updateData: any = {};
      
      if (editingSection === 'pessoal') {
        updateData.nome_completo = editData.nome_completo;
        updateData.telefone = editData.telefone;
        updateData.telefone_publico = editData.telefone_publico;
        if (editData.data_nascimento) {
          const parsedDate = parseBrazilianDate(editData.data_nascimento);
          if (parsedDate) {
            updateData.data_nascimento = formatDateISO(parsedDate.day, parsedDate.month, parsedDate.year);
          } else {
            updateData.data_nascimento = editData.data_nascimento;
          }
        }
        updateData.genero = editData.genero;
      } else if (editingSection === 'profissional') {
        updateData.cref = editData.cref;
        updateData.anos_experiencia = editData.anos_experiencia;
        updateData.especializacoes = editData.especializacoes;
        updateData.bio = editData.bio;
      } else if (editingSection === 'redes') {
        updateData.instagram = editData.instagram;
        updateData.facebook = editData.facebook;
        updateData.linkedin = editData.linkedin;
        updateData.website = editData.website;
      }

      const { error } = await supabase
        .from('personal_trainers')
        .update(updateData)
        .eq('id', userData.id);

      if (error) {
        showToast('Erro ao salvar alterações', 'error');
        return;
      }

      setUserData({ ...userData, ...updateData });
      setShowEditModal(false);
      setEditingSection(null);
      showToast('Alterações salvas com sucesso!');
    } catch  {
      showToast('Erro inesperado', 'error');
    }
  };

  const updateAvatarColor = async (color: string) => {
    if (!userData) return;

    try {
      const { error } = await supabase
        .from('personal_trainers')
        .update({ avatar_color: color })
        .eq('id', userData.id);

      if (error) {
        showToast('Erro ao atualizar cor do avatar', 'error');
        return;
      }

      setUserData({ ...userData, avatar_color: color });
      setShowColorPicker(false);
      showToast('Cor do avatar atualizada!');
    } catch {
      showToast('Erro inesperado', 'error');
    }
  };

  const toggleEspecializacao = (spec: EspecializacaoPT) => {
    const currentSpecs = editData.especializacoes || [];
    const newSpecs = currentSpecs.includes(spec)
      ? currentSpecs.filter(s => s !== spec)
      : [...currentSpecs, spec];
    setEditData({ ...editData, especializacoes: newSpecs });
  };

  // ========= EFFECT =========
  useEffect(() => {
    loadUserData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // Estados
    activeTab,
    setActiveTab,
    userData,
    loading,
    uploading,
    showColorPicker,
    setShowColorPicker,
    showEditModal,
    setShowEditModal,
    showDatePicker,
    setShowDatePicker,
    showGeneroOptions,
    setShowGeneroOptions,
    showExperienciaOptions,
    setShowExperienciaOptions,
    editingSection,
    editData,
    setEditData,
    selectedDay,
    setSelectedDay,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    toast,
    toastAnimation,

    // Constantes centralizadas
    avatarColors,
    generoOptions,
    experienciaOptions,
    especializacoesOptions,

    // Funções utilitárias
    formatPhoneNumber,
    formatDateBrazilian,
    formatISOToBrazilian,
    getCurrentDate,
    validateEditData, // ✅ Nova função de validação

    // Funções principais
    showToast,
    uploadAvatar,
    switchToLetterAvatar,
    loadUserData,
    openEditModal,
    saveChanges,
    updateAvatarColor,
    toggleEspecializacao,
  };
};
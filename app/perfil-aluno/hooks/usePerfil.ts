import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { supabase } from '../../../lib/supabase';

// OPÇÃO 1: Path relativo ajustado
// import { 
//   GENEROS, 
//   OBJETIVOS, 
//   NIVEIS_EXPERIENCIA_ALUNO, 
//   FREQUENCIAS_TREINO,
//   CORES_AVATAR,
//   formatarTelefone 
// } from '../../../constants/usuarios';

// OPÇÃO 2: Import direto (TESTE ESTA PRIMEIRO)
import {
  CORES_AVATAR,
  formatarTelefone,
  FREQUENCIAS_TREINO,
  GENEROS,
  NIVEIS_EXPERIENCIA_ALUNO,
  OBJETIVOS
} from '../../../constants/usuarios';

export interface AlunoData {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  genero: string;
  peso: number;
  altura: number;
  objetivo_principal: string;
  nivel_experiencia: string;
  frequencia_desejada: string;
  par_q_respostas: { [key: string]: boolean };
  avatar_letter: string;
  avatar_color: string;
  avatar_type: 'letter' | 'image';
  avatar_image_url: string | null;
  created_at: string;
}

export interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
}

export const usePerfil = () => {
  // ========= ESTADOS =========
  const [activeTab, setActiveTab] = useState<'pessoal' | 'objetivos' | 'parq' | 'seguranca'>('pessoal');
  const [userData, setUserData] = useState<AlunoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGeneroOptions, setShowGeneroOptions] = useState(false);
  const [showObjetivoOptions, setShowObjetivoOptions] = useState(false);
  const [showNivelOptions, setShowNivelOptions] = useState(false);
  const [showFrequenciaOptions, setShowFrequenciaOptions] = useState(false);
  const [editingSection, setEditingSection] = useState<'pessoal' | 'objetivos' | null>(null);
  const [editData, setEditData] = useState<Partial<AlunoData>>({});
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(2000);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });
  const [toastAnimation] = useState(new Animated.Value(0));

  // ========= CONSTANTES DO ARQUIVO COMPARTILHADO =========
  const avatarColors = [...CORES_AVATAR];
  const generoOptions = [...GENEROS];
  const objetivoOptions = [...OBJETIVOS];
  const nivelExperienciaOptions = [...NIVEIS_EXPERIENCIA_ALUNO];
  const frequenciaTreinoOptions = [...FREQUENCIAS_TREINO];

  // ========= PERGUNTAS PAR-Q =========
  const perguntasParQ = [
    'Seu médico já disse que você possui algum problema cardíaco e que só deve realizar atividade física supervisionado por profissionais de saúde?',
    'Você sente dores no peito quando realiza atividade física?',
    'No último mês, você sentiu dores no peito mesmo sem praticar atividade física?',
    'Você perde o equilíbrio devido a tontura ou já perdeu a consciência alguma vez?',
    'Você possui algum problema ósseo ou articular que poderia piorar com a prática de atividade física?',
    'Seu médico já prescreveu algum medicamento para pressão arterial ou problema cardíaco?',
    'Você sabe de alguma outra razão pela qual não deveria praticar atividade física?'
  ];

  // ========= FUNÇÕES UTILITÁRIAS =========
  const formatPhoneNumber = (phone: string) => {
    return formatarTelefone(phone);
  };

  // Função para converter vírgula em ponto para o banco de dados
  const formatDecimalForDatabase = (value: string): number | null => {
    if (!value || value.trim() === '') return null
    
    // Substitui vírgula por ponto para o PostgreSQL
    const normalizedValue = value.replace(',', '.')
    const parsed = parseFloat(normalizedValue)
    
    // Verifica se é um número válido
    return isNaN(parsed) ? null : parsed
  }

  // Função para filtrar input de peso (permite números, vírgula e ponto)
  const handlePesoChange = (value: string) => {
    // Permite apenas números, vírgula e ponto
    const filtered = value.replace(/[^0-9.,]/g, '')
    return filtered
  }

  // Função para filtrar input de altura (permite números, vírgula e ponto)
  const handleAlturaChange = (value: string) => {
    // Permite apenas números, vírgula e ponto  
    const filtered = value.replace(/[^0-9.,]/g, '')
    return filtered
  }

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

  const formatISOToDateTime = (isoDate: string) => {
    if (!isoDate) return 'Data não disponível';
    
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const getCurrentDate = () => {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear()
    };
  };

  // ========= FUNÇÕES DE TOAST =========
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
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
  }, [toastAnimation]);

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
        .from('alunos')
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
        .from('alunos')
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
  const loadUserData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/');
        return;
      }

      const { data, error } = await supabase
        .from('alunos')
        .select('*')
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
  }, [showToast]);

  // ========= FUNÇÕES DE EDIÇÃO =========
  const openEditModal = (section: 'pessoal' | 'objetivos') => {
    setEditingSection(section);
    
    // Converter data ISO do banco para formato brasileiro para exibição
    const editDataCopy = { ...userData };
    if (editDataCopy?.data_nascimento) {
      editDataCopy.data_nascimento = formatISOToBrazilian(editDataCopy.data_nascimento);
    }
    
    // Converter valores decimais do banco para formato brasileiro (vírgula)
    if (editDataCopy?.peso) {
      editDataCopy.peso = parseFloat(editDataCopy.peso.toString().replace('.', ',')) as any;
    }
    if (editDataCopy?.altura) {
      editDataCopy.altura = parseFloat(editDataCopy.altura.toString().replace('.', ',')) as any;
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
      const updateData: any = {};
      
      if (editingSection === 'pessoal') {
        updateData.nome_completo = editData.nome_completo;
        updateData.telefone = editData.telefone;
        if (editData.data_nascimento) {
          const parsedDate = parseBrazilianDate(editData.data_nascimento);
          if (parsedDate) {
            updateData.data_nascimento = formatDateISO(parsedDate.day, parsedDate.month, parsedDate.year);
          } else {
            updateData.data_nascimento = editData.data_nascimento;
          }
        }
        updateData.genero = editData.genero;
      } else if (editingSection === 'objetivos') {
        // Converter peso e altura usando a função que trata vírgula brasileira
        updateData.peso = formatDecimalForDatabase(editData.peso?.toString() || '');
        updateData.altura = formatDecimalForDatabase(editData.altura?.toString() || '');
        updateData.objetivo_principal = editData.objetivo_principal;
        updateData.nivel_experiencia = editData.nivel_experiencia;
        updateData.frequencia_desejada = editData.frequencia_desejada;
      }

      const { error } = await supabase
        .from('alunos')
        .update(updateData)
        .eq('id', userData.id);

      if (error) {
        console.error('Erro ao salvar alterações:', error);
        showToast('Erro ao salvar alterações', 'error');
        return;
      }

      setUserData({ ...userData, ...updateData });
      setShowEditModal(false);
      setEditingSection(null);
      showToast('Alterações salvas com sucesso!');
    } catch (err) {
      console.error('Erro inesperado:', err);
      showToast('Erro inesperado', 'error');
    }
  };

  const updateAvatarColor = async (color: string) => {
    if (!userData) return;

    try {
      const { error } = await supabase
        .from('alunos')
        .update({ avatar_color: color })
        .eq('id', userData.id);

      if (error) {
        console.error('Erro ao atualizar cor do avatar:', error);
        showToast('Erro ao atualizar cor do avatar', 'error');
        return;
      }

      setUserData({ ...userData, avatar_color: color });
      setShowColorPicker(false);
      showToast('Cor do avatar atualizada!');
    } catch (err) {
      console.error('Erro inesperado:', err);
      showToast('Erro inesperado', 'error');
    }
  };

  // ========= EFFECT =========
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

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
    showObjetivoOptions,
    setShowObjetivoOptions,
    showNivelOptions,
    setShowNivelOptions,
    showFrequenciaOptions,
    setShowFrequenciaOptions,
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

    // Constantes
    avatarColors,
    generoOptions,
    objetivoOptions,
    nivelExperienciaOptions,
    frequenciaTreinoOptions,
    perguntasParQ,

    // Funções utilitárias
    formatPhoneNumber,
    formatDateBrazilian,
    formatISOToBrazilian,
    formatISOToDateTime,
    getCurrentDate,
    handlePesoChange,
    handleAlturaChange,

    // Funções principais
    showToast,
    uploadAvatar,
    switchToLetterAvatar,
    loadUserData,
    openEditModal,
    saveChanges,
    updateAvatarColor,
  };
};
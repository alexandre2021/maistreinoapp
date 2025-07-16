import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { supabase } from '../../lib/supabase';

import {
  CORES_AVATAR,
  formatarTelefone,
  GENEROS,
} from '../../constants/usuarios';

export interface AlunoData {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  genero: string;
  peso: number | null;
  altura: number | null;
  descricao_pessoal: string;
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
  const [activeTab, setActiveTab] = useState<'pessoal' | 'descricao' | 'parq' | 'seguranca'>('pessoal');
  const [userData, setUserData] = useState<AlunoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGeneroOptions, setShowGeneroOptions] = useState(false);
  const [editingSection, setEditingSection] = useState<'pessoal' | 'descricao' | null>(null);
  const [editData, setEditData] = useState<Partial<AlunoData>>({});
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(2000);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });
  const [toastAnimation] = useState(new Animated.Value(0));

  // ========= CONSTANTES DO ARQUIVO COMPARTILHADO =========
  const avatarColors = [...CORES_AVATAR];
  const generoOptions = [...GENEROS];

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
  const formatPhoneNumber = (phone: string) => formatarTelefone(phone);
  const formatDecimalForDatabase = (value: string): number | null => {
    if (!value || value.trim() === '') return null;
    const normalizedValue = value.replace(',', '.');
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? null : parsed;
  };
  const handlePesoChange = (value: string) => value.replace(/[^0-9.,]/g, '');
  const handleAlturaChange = (value: string) => value.replace(/[^0-9.,]/g, '');
  const formatDateBrazilian = (day: number, month: number, year: number) => `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
  const formatDateISO = (day: number, month: number, year: number) => `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  const parseBrazilianDate = (dateString: string) => {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10), month = parseInt(parts[1], 10) - 1, year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return { day, month, year };
  };
  const parseISODate = (dateString: string) => {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10), month = parseInt(parts[1], 10) - 1, day = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return { day, month, year };
  };
  const formatISOToBrazilian = (isoDate: string) => {
    const parsed = parseISODate(isoDate);
    return parsed ? formatDateBrazilian(parsed.day, parsed.month, parsed.year) : isoDate;
  };
  const formatISOToDateTime = (isoDate: string) => {
    if (!isoDate) return 'Data não disponível';
    try {
      return new Date(isoDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return 'Data inválida'; }
  };
  const getCurrentDate = () => {
    const now = new Date();
    return { day: now.getDate(), month: now.getMonth(), year: now.getFullYear() };
  };

  // ========= FUNÇÕES DE TOAST =========
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    Animated.sequence([
      Animated.timing(toastAnimation, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(toastAnimation, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast({ visible: false, message: '', type: 'success' }));
  }, [toastAnimation]);

  // ========= FUNÇÕES DE UPLOAD COM USO DO setUploading =========
  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true); // ✅ USO CORRETO
      if (!userData) {
        showToast('Erro: dados do usuário não encontrados', 'error');
        return;
      }
      if (userData.avatar_image_url && userData.avatar_type === 'image') {
        const oldUrl = userData.avatar_image_url.split('?')[0];
        const pathMatch = oldUrl.match(/\/avatars\/(.+)$/);
        if (pathMatch) {
          await supabase.storage.from('avatars').remove([pathMatch[1]]);
        }
      }
      const fileName = `${userData.id}_avatar_${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, blob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      if (!urlData.publicUrl) throw new Error('URL pública não obtida');
      const { error: updateError } = await supabase.from('alunos').update({ avatar_type: 'image', avatar_image_url: urlData.publicUrl }).eq('id', userData.id);
      if (updateError) throw updateError;
      const imageUrlWithCacheBuster = `${urlData.publicUrl}?t=${Date.now()}`;
      setUserData({ ...userData, avatar_type: 'image', avatar_image_url: imageUrlWithCacheBuster });
      showToast('Foto do perfil atualizada com sucesso!');
    } catch (error: any) {
      showToast('Erro ao fazer upload: ' + error.message, 'error');
    } finally {
      setUploading(false); // ✅ USO CORRETO
    }
  };

  const switchToLetterAvatar = async () => {
    if (!userData) return;
    try {
      setUploading(true); // ✅ USO CORRETO
      if (userData.avatar_image_url && userData.avatar_type === 'image') {
        const oldUrl = userData.avatar_image_url.split('?')[0];
        const pathMatch = oldUrl.match(/\/avatars\/(.+)$/);
        if (pathMatch) {
          await supabase.storage.from('avatars').remove([pathMatch[1]]);
        }
      }
      const { error } = await supabase.from('alunos').update({ avatar_type: 'letter', avatar_image_url: null }).eq('id', userData.id);
      if (error) throw error;
      setUserData({ ...userData, avatar_type: 'letter', avatar_image_url: null });
      showToast('Avatar alterado para letra!');
    } catch (error: any) {
      showToast('Erro ao alterar avatar: ' + error.message, 'error');
    } finally {
      setUploading(false); // ✅ USO CORRETO
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
      const { data, error } = await supabase.from('alunos').select('*').eq('id', user.id).single();
      if (error) throw error;
      if (data) setUserData({ ...data, email: user.email || '' });
    } catch (error: any) {
      showToast('Erro ao carregar perfil: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // ========= FUNÇÕES DE EDIÇÃO =========
  const openEditModal = (section: 'pessoal' | 'descricao') => {
    setEditingSection(section);
    const editDataCopy = { ...userData };
    if (editDataCopy.data_nascimento) editDataCopy.data_nascimento = formatISOToBrazilian(editDataCopy.data_nascimento);
    if (editDataCopy.peso) editDataCopy.peso = editDataCopy.peso.toString().replace('.', ',') as any;
    if (editDataCopy.altura) editDataCopy.altura = editDataCopy.altura.toString().replace('.', ',') as any;
    setEditData(editDataCopy || {});
    if (section === 'pessoal' && userData?.data_nascimento) {
      const parsedDate = parseISODate(userData.data_nascimento);
      if (parsedDate) {
        setSelectedDay(parsedDate.day);
        setSelectedMonth(parsedDate.month);
        setSelectedYear(parsedDate.year);
      }
    }
    setShowEditModal(true);
  };

  const saveChanges = async () => {
    if (!userData || !editingSection) return;
    try {
      const updateData: Partial<AlunoData> = {};
      if (editingSection === 'pessoal') {
        updateData.nome_completo = editData.nome_completo;
        updateData.telefone = editData.telefone;
        updateData.genero = editData.genero;
        updateData.peso = formatDecimalForDatabase(editData.peso?.toString() || '');
        updateData.altura = formatDecimalForDatabase(editData.altura?.toString() || '');
        if (editData.data_nascimento) {
          const parsedDate = parseBrazilianDate(editData.data_nascimento);
          if (parsedDate) updateData.data_nascimento = formatDateISO(parsedDate.day, parsedDate.month, parsedDate.year);
        }
      } else if (editingSection === 'descricao') {
        updateData.descricao_pessoal = editData.descricao_pessoal;
      }
      const { error } = await supabase.from('alunos').update(updateData).eq('id', userData.id);
      if (error) throw error;
      setUserData({ ...userData, ...updateData } as AlunoData);
      setShowEditModal(false);
      setEditingSection(null);
      showToast('Alterações salvas com sucesso!');
    } catch (error: any) {
      showToast('Erro ao salvar alterações: ' + error.message, 'error');
    }
  };

  const updateAvatarColor = async (color: string) => {
    if (!userData) return;
    try {
      const { error } = await supabase.from('alunos').update({ avatar_color: color }).eq('id', userData.id);
      if (error) throw error;
      setUserData({ ...userData, avatar_color: color });
      setShowColorPicker(false);
      showToast('Cor do avatar atualizada!');
    } catch (error: any) {
      showToast('Erro ao atualizar cor: ' + error.message, 'error');
    }
  };

  // ========= EFFECT =========
  useEffect(() => { loadUserData(); }, [loadUserData]);

  // ========= RETURN DO HOOK =========
  return {
    activeTab, setActiveTab, userData, loading, uploading, showColorPicker,
    setShowColorPicker, showEditModal, setShowEditModal, showDatePicker,
    setShowDatePicker, showGeneroOptions, setShowGeneroOptions, editingSection,
    editData, setEditData, selectedDay, setSelectedDay, selectedMonth,
    setSelectedMonth, selectedYear, setSelectedYear, toast, toastAnimation,
    avatarColors, generoOptions, perguntasParQ, formatPhoneNumber,
    formatDateBrazilian, formatISOToBrazilian, formatISOToDateTime,
    getCurrentDate, handlePesoChange, handleAlturaChange, showToast,
    uploadAvatar, switchToLetterAvatar, loadUserData, openEditModal,
    saveChanges, updateAvatarColor,
  };
};
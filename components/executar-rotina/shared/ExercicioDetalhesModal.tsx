// components/execucao/shared/ExercicioDetalhesModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

interface ExercicioDetalhado {
  id: string;
  nome: string;
  descricao: string;
  grupo_muscular: string;
  equipamento: string;
  dificuldade: 'Baixa' | 'Média' | 'Alta';
  tipo: 'padrao' | 'personalizado';
  instrucoes: string;
  created_at: string;
  is_ativo: boolean;
  imagem_1_url?: string;
  imagem_2_url?: string;
  video_url?: string;
  youtube_url?: string;
  pt_id?: string;
  exercicio_padrao_id?: string;
}

interface Props {
  visible: boolean;
  exercicioNome: string;
  onClose: () => void;
}

const CORES_DIFICULDADE = {
  'Baixa': '#10B981',
  'Média': '#F59E0B', 
  'Alta': '#EF4444'
};

export default function ExercicioDetalhesModal({ visible, exercicioNome, onClose }: Props) {
  const [exercicio, setExercicio] = useState<ExercicioDetalhado | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagemVisible, setImagemVisible] = useState<string | null>(null);

  // ✅ CORRIGIDO: useCallback para estabilizar a função
  const carregarExercicio = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando exercício:', exercicioNome);

      const { data, error } = await supabase
        .from('exercicios')
        .select('*')
        .eq('nome', exercicioNome)
        .eq('is_ativo', true)
        .single();

      if (error || !data) {
        console.error('❌ Erro ao carregar exercício:', error);
        return;
      }

      console.log('✅ Exercício carregado:', data.nome);
      setExercicio(data);
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  }, [exercicioNome]); // ✅ Dependência adicionada

  // ✅ CORRIGIDO: Agora carregarExercicio está na lista de dependências
  useEffect(() => {
    if (visible && exercicioNome) {
      carregarExercicio();
    }
  }, [visible, exercicioNome, carregarExercicio]); // ✅ Dependência adicionada

  const formatarData = (dataISO: string) => {
    if (!dataISO) return 'Data indisponível';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const abrirYoutube = (url: string) => {
    Linking.openURL(url);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Detalhes do Exercício</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Conteúdo */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Carregando exercício...</Text>
            </View>
          ) : exercicio ? (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Título e Descrição */}
              <View style={styles.titleSection}>
                <Text style={styles.exercicioNome}>{exercicio.nome}</Text>
                <Text style={styles.exercicioDescricao}>{exercicio.descricao}</Text>
              </View>

              {/* Informações Básicas */}
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
                    <View style={[styles.badgeDificuldade, { backgroundColor: CORES_DIFICULDADE[exercicio.dificuldade] }]}>
                      <Text style={styles.badgeDificuldadeText}>{exercicio.dificuldade}</Text>
                    </View>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Tipo</Text>
                    <View style={[styles.badgeTipo, { backgroundColor: exercicio.tipo === 'padrao' ? '#3B82F6' : '#8B5CF6' }]}>
                      <Text style={styles.badgeTipoText}>
                        {exercicio.tipo === 'padrao' ? 'Padrão' : 'Personalizado'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Como Executar */}
              {exercicio.instrucoes && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Como Executar</Text>
                  <View style={styles.instrucoesContainer}>
                    {exercicio.instrucoes.split('\n').map((instrucao, index) => (
                      <Text key={index} style={styles.instrucaoText}>
                        {index + 1}. {instrucao}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              {/* Mídias do Exercício */}
              {(exercicio.imagem_1_url || exercicio.imagem_2_url || exercicio.video_url || exercicio.youtube_url) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Mídias do Exercício</Text>
                  
                  {/* Imagens */}
                  <View style={styles.midiaGrid}>
                    {exercicio.imagem_1_url && (
                      <TouchableOpacity 
                        style={styles.imagemContainer}
                        onPress={() => setImagemVisible(exercicio.imagem_1_url!)}
                      >
                        <Image source={{ uri: exercicio.imagem_1_url }} style={styles.imagem} resizeMode="contain" />
                        <Text style={styles.imagemLabel}>Foto 1</Text>
                      </TouchableOpacity>
                    )}
                    
                    {exercicio.imagem_2_url && (
                      <TouchableOpacity 
                        style={styles.imagemContainer}
                        onPress={() => setImagemVisible(exercicio.imagem_2_url!)}
                      >
                        <Image source={{ uri: exercicio.imagem_2_url }} style={styles.imagem} resizeMode="contain" />
                        <Text style={styles.imagemLabel}>Foto 2</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Vídeos */}
                  {exercicio.youtube_url && (
                    <TouchableOpacity 
                      style={styles.videoButton}
                      onPress={() => abrirYoutube(exercicio.youtube_url!)}
                    >
                      <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                      <Text style={styles.videoButtonText}>Assistir no YouTube</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Informações Adicionais */}
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
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
              <Text style={styles.errorText}>Exercício não encontrado</Text>
            </View>
          )}
        </View>

        {/* Modal para visualizar imagem em tela cheia */}
        {imagemVisible && (
          <Modal visible={true} transparent>
            <View style={styles.imagemModalOverlay}>
              <TouchableOpacity 
                style={styles.imagemModalClose}
                onPress={() => setImagemVisible(null)}
              >
                <Ionicons name="close" size={30} color="#FFFFFF" />
              </TouchableOpacity>
              <Image source={{ uri: imagemVisible }} style={styles.imagemModal} resizeMode="contain" />
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
  },
  titleSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  exercicioNome: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  exercicioDescricao: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  badgeNeutral: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeNeutralText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  badgeDificuldade: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeDificuldadeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badgeTipo: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeTipoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instrucoesContainer: {
    gap: 8,
  },
  instrucaoText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  midiaGrid: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 16,
  },
  imagemContainer: {
    width: '100%',
    alignItems: 'center',
  },
  imagem: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  imagemLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  videoButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  imagemModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagemModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  imagemModal: {
    width: '90%',
    height: '80%',
  },
});
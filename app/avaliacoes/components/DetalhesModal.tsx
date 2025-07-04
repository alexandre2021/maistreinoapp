// app/avaliacoes/components/DetalhesModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AvaliacaoDetalhes {
  id: string;
  data_avaliacao: string;
  peso: number;
  altura: number;
  imc: number;
  peito_busto: number | null;
  cintura: number | null;
  quadril: number | null;
  coxa_direita: number | null;
  braco_direito: number | null;
  observacoes: string | null;
  foto_frente_url: string | null;
  foto_lado_url: string | null;
  foto_costas_url: string | null;
}

interface ClassificacaoIMC {
  texto: string;
  cor: string;
}

interface DetalhesModalProps {
  visible: boolean;
  avaliacao: AvaliacaoDetalhes | null;
  onClose: () => void;
  formatDate: (data: string) => string;
  obterClassificacaoIMC: (imc: number) => ClassificacaoIMC;
  onPreviewImage: (uri: string) => void;
}

export default function DetalhesModal({
  visible,
  avaliacao,
  onClose,
  formatDate,
  obterClassificacaoIMC,
  onPreviewImage
}: DetalhesModalProps) {
  if (!avaliacao) return null;

  const classificacao = obterClassificacaoIMC(avaliacao.imc);

  return (
    <Modal visible={visible} transparent animationType="slide" accessible={false} importantForAccessibility="no">
      <View style={styles.modalOverlay}>
        <View style={styles.detalhesAvaliacaoModal}>
          <View style={styles.detalhesModalHeader}>
            <Text style={styles.detalhesModalTitle}>Detalhes da Avaliação</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.detalhesModalContent} showsVerticalScrollIndicator={false}>
            {/* Data da Avaliação */}
            <View style={styles.detalhesSection}>
              <Text style={styles.detalhesSectionTitle}>Data da Avaliação</Text>
              <Text style={styles.detalhesDataAvaliacao}>
                {formatDate(avaliacao.data_avaliacao)}
              </Text>
            </View>

            {/* Dados Básicos */}
            <View style={styles.detalhesSection}>
              <Text style={styles.detalhesSectionTitle}>Dados Básicos</Text>
              <View style={styles.detalhesGrid}>
                <View style={styles.detalhesGridItem}>
                  <Text style={styles.detalhesLabel}>Peso</Text>
                  <Text style={styles.detalhesValor}>{avaliacao.peso} kg</Text>
                </View>
                <View style={styles.detalhesGridItem}>
                  <Text style={styles.detalhesLabel}>Altura</Text>
                  <Text style={styles.detalhesValor}>
                    {(avaliacao.altura * 100).toFixed(0)} cm
                  </Text>
                </View>
                <View style={styles.detalhesGridItem}>
                  <Text style={styles.detalhesLabel}>IMC</Text>
                  <Text style={[styles.detalhesValor, { color: classificacao.cor }]}>
                    {avaliacao.imc}
                  </Text>
                </View>
                <View style={styles.detalhesGridItem}>
                  <Text style={styles.detalhesLabel}>Classificação</Text>
                  <Text style={[styles.detalhesValor, { color: classificacao.cor }]}>
                    {classificacao.texto}
                  </Text>
                </View>
              </View>
            </View>

            {/* ✅ MEDIDAS SEMPRE VISÍVEIS */}
            <View style={styles.detalhesSection}>
              <Text style={styles.detalhesSectionTitle}>Medidas Corporais</Text>
              <View style={styles.detalhesGrid}>
                <View style={styles.detalhesGridItem}>
                  <Text style={styles.detalhesLabel}>Peito/Busto</Text>
                  <Text style={styles.detalhesValor}>
                    {avaliacao.peito_busto ? `${avaliacao.peito_busto} cm` : 'Não informado'}
                  </Text>
                </View>
                <View style={styles.detalhesGridItem}>
                  <Text style={styles.detalhesLabel}>Cintura</Text>
                  <Text style={styles.detalhesValor}>
                    {avaliacao.cintura ? `${avaliacao.cintura} cm` : 'Não informado'}
                  </Text>
                </View>
                <View style={styles.detalhesGridItem}>
                  <Text style={styles.detalhesLabel}>Quadril</Text>
                  <Text style={styles.detalhesValor}>
                    {avaliacao.quadril ? `${avaliacao.quadril} cm` : 'Não informado'}
                  </Text>
                </View>
                <View style={styles.detalhesGridItem}>
                  <Text style={styles.detalhesLabel}>Coxa Direita</Text>
                  <Text style={styles.detalhesValor}>
                    {avaliacao.coxa_direita ? `${avaliacao.coxa_direita} cm` : 'Não informado'}
                  </Text>
                </View>
                <View style={styles.detalhesGridItem}>
                  <Text style={styles.detalhesLabel}>Braço Direito</Text>
                  <Text style={styles.detalhesValor}>
                    {avaliacao.braco_direito ? `${avaliacao.braco_direito} cm` : 'Não informado'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Fotos de Progresso */}
            {(avaliacao.foto_frente_url || avaliacao.foto_lado_url || avaliacao.foto_costas_url) && (
              <View style={styles.detalhesSection}>
                <Text style={styles.detalhesSectionTitle}>Fotos de Progresso</Text>
                <View style={styles.detalhesFotosGrid}>
                  {avaliacao.foto_frente_url && (
                    <View style={styles.detalhesFotoItem}>
                      <TouchableOpacity 
                        onPress={() => onPreviewImage(avaliacao.foto_frente_url!)}
                      >
                        <Image 
                          source={{ uri: avaliacao.foto_frente_url }} 
                          style={styles.detalhesFotoImage} 
                        />
                      </TouchableOpacity>
                      <Text style={styles.detalhesFotoLabel}>Frente</Text>
                    </View>
                  )}
                  
                  {avaliacao.foto_lado_url && (
                    <View style={styles.detalhesFotoItem}>
                      <TouchableOpacity 
                        onPress={() => onPreviewImage(avaliacao.foto_lado_url!)}
                      >
                        <Image 
                          source={{ uri: avaliacao.foto_lado_url }} 
                          style={styles.detalhesFotoImage} 
                        />
                      </TouchableOpacity>
                      <Text style={styles.detalhesFotoLabel}>Perfil</Text>
                    </View>
                  )}
                  
                  {avaliacao.foto_costas_url && (
                    <View style={styles.detalhesFotoItem}>
                      <TouchableOpacity 
                        onPress={() => onPreviewImage(avaliacao.foto_costas_url!)}
                      >
                        <Image 
                          source={{ uri: avaliacao.foto_costas_url }} 
                          style={styles.detalhesFotoImage} 
                        />
                      </TouchableOpacity>
                      <Text style={styles.detalhesFotoLabel}>Costas</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Observações */}
            {avaliacao.observacoes && (
              <View style={styles.detalhesSection}>
                <Text style={styles.detalhesSectionTitle}>Observações</Text>
                <Text style={styles.detalhesObservacoes}>
                  {avaliacao.observacoes}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detalhesAvaliacaoModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '90%',
  },
  detalhesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detalhesModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  detalhesModalContent: {
    flex: 1,
    padding: 20,
  },
  detalhesSection: {
    marginBottom: 24,
  },
  detalhesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  detalhesDataAvaliacao: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  detalhesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detalhesGridItem: {
    minWidth: '45%',
    marginBottom: 12,
  },
  detalhesLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  detalhesValor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  detalhesFotosGrid: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-around',
  },
  detalhesFotoItem: {
    alignItems: 'center',
  },
  detalhesFotoImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  detalhesFotoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  detalhesObservacoes: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
// app/avaliacoes/components/HistoricoAvaliacoes.tsx - CORRIGIDO
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ✅ INTERFACE COMPLETA - adicionadas propriedades faltantes
interface AvaliacaoHistorico {
  id: string;
  data_avaliacao: string;
  peso: number;
  altura: number; // ✅ ADICIONADO
  imc: number;
  peito_busto: number | null; // ✅ ADICIONADO
  cintura: number | null; // ✅ ADICIONADO
  quadril: number | null; // ✅ ADICIONADO
  coxa_direita: number | null; // ✅ ADICIONADO
  braco_direito: number | null; // ✅ ADICIONADO
  observacoes: string | null; // ✅ ADICIONADO
  foto_frente_url: string | null;
  foto_lado_url: string | null;
  foto_costas_url: string | null;
  created_at: string; // ✅ ADICIONADO
}

interface ClassificacaoIMC {
  texto: string;
  cor: string;
}

interface HistoricoAvaliacoesProps {
  avaliacoes: AvaliacaoHistorico[];
  formatDate: (data: string) => string;
  obterClassificacaoIMC: (imc: number) => ClassificacaoIMC;
  onAbrirDetalhes: (avaliacao: AvaliacaoHistorico) => void;
  onPreviewImage: (uri: string) => void;
}

export default function HistoricoAvaliacoes({
  avaliacoes,
  formatDate,
  obterClassificacaoIMC,
  onAbrirDetalhes,
  onPreviewImage
}: HistoricoAvaliacoesProps) {
  return (
    <>
      <Text style={styles.sectionTitle}>Histórico de Avaliações</Text>
      <Text style={styles.sectionDescription}>
        Mostrando suas últimas 4 avaliações. Para resultados mais precisos, 
        recomendamos um intervalo mínimo de 30 dias entre avaliações.
      </Text>
      
      {avaliacoes.map((avaliacao) => {
        const classificacao = obterClassificacaoIMC(avaliacao.imc);
        
        return (
          <View key={avaliacao.id} style={styles.avaliacaoCard}>
            <View style={styles.avaliacaoHeader}>
              <Text style={styles.avaliacaoData}>
                {formatDate(avaliacao.data_avaliacao)}
              </Text>
              
              <TouchableOpacity
                onPress={() => onAbrirDetalhes(avaliacao)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.eyeButton}
              >
                <Ionicons name="eye-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.avaliacaoDetalhes}>
              <View style={styles.detalheItem}>
                <Text style={styles.detalheLabel}>Peso:</Text>
                <Text style={styles.detalheValor}>{avaliacao.peso} kg</Text>
              </View>
              <View style={styles.detalheItem}>
                <Text style={styles.detalheLabel}>IMC:</Text>
                <Text style={[styles.detalheValor, { color: classificacao.cor }]}>
                  {avaliacao.imc}
                </Text>
              </View>
            </View>

            {(avaliacao.foto_frente_url || avaliacao.foto_lado_url || avaliacao.foto_costas_url) && (
              <View style={styles.fotosContainer}>
                <Text style={styles.fotosLabel}>Fotos de Progresso:</Text>
                <View style={styles.fotosGrid}>
                  {avaliacao.foto_frente_url && (
                    <TouchableOpacity 
                      style={styles.fotoThumbnail}
                      onPress={() => onPreviewImage(avaliacao.foto_frente_url!)}
                    >
                      <Image 
                        source={{ uri: avaliacao.foto_frente_url }} 
                        style={styles.fotoThumbnailImage} 
                      />
                      <Text style={styles.fotoThumbnailLabel}>Frente</Text>
                    </TouchableOpacity>
                  )}
                  
                  {avaliacao.foto_lado_url && (
                    <TouchableOpacity 
                      style={styles.fotoThumbnail}
                      onPress={() => onPreviewImage(avaliacao.foto_lado_url!)}
                    >
                      <Image 
                        source={{ uri: avaliacao.foto_lado_url }} 
                        style={styles.fotoThumbnailImage} 
                      />
                      <Text style={styles.fotoThumbnailLabel}>Perfil</Text>
                    </TouchableOpacity>
                  )}
                  
                  {avaliacao.foto_costas_url && (
                    <TouchableOpacity 
                      style={styles.fotoThumbnail}
                      onPress={() => onPreviewImage(avaliacao.foto_costas_url!)}
                    >
                      <Image 
                        source={{ uri: avaliacao.foto_costas_url }} 
                        style={styles.fotoThumbnailImage} 
                      />
                      <Text style={styles.fotoThumbnailLabel}>Costas</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  avaliacaoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avaliacaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  avaliacaoData: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  eyeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  avaliacaoDetalhes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  detalheItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detalheLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detalheValor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  fotosContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  fotosLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  fotosGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  fotoThumbnail: {
    alignItems: 'center',
  },
  fotoThumbnailImage: {
    width: 60,
    height: 80,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  fotoThumbnailLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
});
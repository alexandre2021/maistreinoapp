// app/avaliacoes/components/UltimaAvaliacao.tsx
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ✅ INTERFACE COMPLETA - todas as propriedades da avaliação
interface UltimaAvaliacaoData {
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
  created_at: string;
}

interface ClassificacaoIMC {
  texto: string;
  cor: string;
}

interface UltimaAvaliacaoProps {
  avaliacao: UltimaAvaliacaoData;
  formatDate: (data: string) => string;
  obterClassificacaoIMC: (imc: number) => ClassificacaoIMC;
  onPreviewImage?: (uri: string) => void; // ✅ NOVA PROP para preview
}

export default function UltimaAvaliacao({ 
  avaliacao, 
  formatDate, 
  obterClassificacaoIMC,
  onPreviewImage
}: UltimaAvaliacaoProps) {
  const classificacao = obterClassificacaoIMC(avaliacao.imc);

  return (
    <View style={styles.ultimaAvaliacaoCard}>
      <Text style={styles.cardTitle}>Última Avaliação</Text>
      <Text style={styles.dataAvaliacao}>
        {formatDate(avaliacao.data_avaliacao)}
      </Text>
      
      <View style={styles.resumoGrid}>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoLabel}>Peso</Text>
          <Text style={styles.resumoValor}>{avaliacao.peso} kg</Text>
        </View>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoLabel}>IMC</Text>
          <Text style={[styles.resumoValor, { color: classificacao.cor }]}>
            {avaliacao.imc}
          </Text>
        </View>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoLabel}>Altura</Text>
          <Text style={styles.resumoValor}>
            {(avaliacao.altura * 100).toFixed(0)} cm
          </Text>
        </View>
      </View>

      <Text style={styles.imcClassificacao}>
        {classificacao.texto}
      </Text>

      {/* ✅ NOVA SEÇÃO - Fotos de Progresso */}
      {(avaliacao.foto_frente_url || avaliacao.foto_lado_url || avaliacao.foto_costas_url) && (
        <View style={styles.fotosContainer}>
          <Text style={styles.fotosLabel}>Fotos de Progresso:</Text>
          <View style={styles.fotosGrid}>
            {avaliacao.foto_frente_url && (
              <TouchableOpacity 
                style={styles.fotoThumbnail}
                onPress={() => onPreviewImage?.(avaliacao.foto_frente_url!)}
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
                onPress={() => onPreviewImage?.(avaliacao.foto_lado_url!)}
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
                onPress={() => onPreviewImage?.(avaliacao.foto_costas_url!)}
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
}

const styles = StyleSheet.create({
  ultimaAvaliacaoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  dataAvaliacao: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  resumoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resumoItem: {
    alignItems: 'center',
  },
  resumoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  resumoValor: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  imcClassificacao: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // ✅ NOVOS ESTILOS - Fotos de Progresso
  fotosContainer: {
    marginTop: 16,
    paddingTop: 16,
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
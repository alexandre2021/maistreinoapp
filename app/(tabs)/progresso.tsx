import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'


interface ProgressoData {
  treinosCompletados: number
  diasAtivos: number
  pesoTotal: number
  tempoTotal: number // em minutos
  metaSemanal: number
  progressoSemanal: number
}

interface HistoricoTreino {
  data: string
  nome: string
  duracao: number
  calorias?: number
}

export default function Progresso() {
  useAuth()
  const [progresso, setProgresso] = useState<ProgressoData>({
    treinosCompletados: 0,
    diasAtivos: 0,
    pesoTotal: 0,
    tempoTotal: 0,
    metaSemanal: 5,
    progressoSemanal: 0
  })
  const [historico, setHistorico] = useState<HistoricoTreino[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgresso()
  }, [])

  const fetchProgresso = async () => {
    try {
      setLoading(true)
      
      // Obter usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('Usuário não encontrado')
        return
      }

      // TODO: Implementar queries reais quando tabelas estiverem prontas
      // Por enquanto, dados mockados
      const progressoMockado: ProgressoData = {
        treinosCompletados: 24,
        diasAtivos: 18,
        pesoTotal: 2840, // kg levantados
        tempoTotal: 720, // 12 horas
        metaSemanal: 5,
        progressoSemanal: 3
      }

      const historicoMockado: HistoricoTreino[] = [
        {
          data: '2025-06-14',
          nome: 'Treino de Peito e Tríceps',
          duracao: 45,
          calorias: 320
        },
        {
          data: '2025-06-13',
          nome: 'Treino de Costas e Bíceps',
          duracao: 50,
          calorias: 380
        },
        {
          data: '2025-06-12',
          nome: 'Treino de Pernas',
          duracao: 60,
          calorias: 450
        },
        {
          data: '2025-06-11',
          nome: 'Cardio + Core',
          duracao: 30,
          calorias: 280
        },
        {
          data: '2025-06-10',
          nome: 'Treino de Ombros',
          duracao: 40,
          calorias: 300
        }
      ]

      setProgresso(progressoMockado)
      setHistorico(historicoMockado)
    } catch (error) {
      console.error('Erro ao buscar progresso:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTempo = (minutos: number) => {
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    if (horas > 0) {
      return `${horas}h ${mins}m`
    }
    return `${mins}m`
  }

  const getProgressoSemanalPercentual = () => {
    return Math.min((progresso.progressoSemanal / progresso.metaSemanal) * 100, 100)
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Seu Progresso</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando progresso...</Text>
        </View>
      ) : (
        <>
          {/* Meta Semanal */}
          <View style={styles.metaCard}>
            <Text style={styles.metaTitle}>Meta Semanal</Text>
            <View style={styles.metaContent}>
              <Text style={styles.metaProgress}>
                {progresso.progressoSemanal} / {progresso.metaSemanal} treinos
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${getProgressoSemanalPercentual()}%` }
                  ]} 
                />
              </View>
              <Text style={styles.metaPercentual}>
                {Math.round(getProgressoSemanalPercentual())}% concluído
              </Text>
            </View>
          </View>

          {/* Estatísticas Gerais */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{progresso.treinosCompletados}</Text>
              <Text style={styles.statLabel}>Treinos Completados</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{progresso.diasAtivos}</Text>
              <Text style={styles.statLabel}>Dias Ativos</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{progresso.pesoTotal.toLocaleString()}</Text>
              <Text style={styles.statLabel}>kg Levantados</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{formatTempo(progresso.tempoTotal)}</Text>
              <Text style={styles.statLabel}>Tempo Total</Text>
            </View>
          </View>

          {/* Histórico Recente */}
          <View style={styles.historicoSection}>
            <Text style={styles.sectionTitle}>Histórico Recente</Text>
            
            {historico.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Nenhum treino concluído ainda.
                </Text>
              </View>
            ) : (
              <View style={styles.historicoContainer}>
                {historico.map((item, index) => (
                  <View key={index} style={styles.historicoItem}>
                    <View style={styles.historicoInfo}>
                      <Text style={styles.historicoNome}>{item.nome}</Text>
                      <Text style={styles.historicoData}>
                        {new Date(item.data).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                    <View style={styles.historicoStats}>
                      <Text style={styles.historicoDuracao}>
                        {formatTempo(item.duracao)}
                      </Text>
                      {item.calorias && (
                        <Text style={styles.historicoCalorias}>
                          {item.calorias} cal
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Conquistas */}
          <View style={styles.conquistasSection}>
            <Text style={styles.sectionTitle}>Conquistas</Text>
            <View style={styles.conquistasContainer}>
              <View style={styles.conquistaItem}>
                <Text style={styles.conquistaEmoji}>🔥</Text>
                <Text style={styles.conquistaTexto}>Sequência de 7 dias</Text>
              </View>
              <View style={styles.conquistaItem}>
                <Text style={styles.conquistaEmoji}>💪</Text>
                <Text style={styles.conquistaTexto}>20 treinos completados</Text>
              </View>
              <View style={styles.conquistaItem}>
                <Text style={styles.conquistaEmoji}>⏱️</Text>
                <Text style={styles.conquistaTexto}>10h de treino total</Text>
              </View>
              <View style={styles.conquistaItem}>
                <Text style={styles.conquistaEmoji}>🎯</Text>
                <Text style={styles.conquistaTexto}>Meta semanal atingida</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 24,
    color: '#1F2937',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  metaCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  metaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  metaContent: {
    gap: 12,
  },
  metaProgress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  metaPercentual: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  historicoSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1F2937',
  },
  emptyContainer: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  historicoContainer: {
    gap: 12,
  },
  historicoItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  historicoInfo: {
    flex: 1,
  },
  historicoNome: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  historicoData: {
    fontSize: 12,
    color: '#6B7280',
  },
  historicoStats: {
    alignItems: 'flex-end',
  },
  historicoDuracao: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  historicoCalorias: {
    fontSize: 12,
    color: '#6B7280',
  },
  conquistasSection: {
    marginBottom: 40,
  },
  conquistasContainer: {
    gap: 12,
  },
  conquistaItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  conquistaEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  conquistaTexto: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
})
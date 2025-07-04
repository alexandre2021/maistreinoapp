import { useFocusEffect } from '@react-navigation/native'
import React, { useCallback, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'


export default function DashboardAluno() {
  useAuth()
  const [stats, setStats] = useState({
    treinosCompletados: 0,
    proximoTreino: 'Hoje',
    diasAtivos: 0,
  })
  const [loading, setLoading] = useState(true)
  const [nomeAluno, setNomeAluno] = useState('Aluno')

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Obter usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('Usuário não encontrado')
        return
      }

      // Buscar nome do aluno
      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select('nome_completo')
        .eq('id', user.id)
        .single()

      if (alunoError) {
        console.error('Erro ao buscar dados do aluno:', alunoError)
      } else if (alunoData) {
        setNomeAluno(alunoData.nome_completo || 'Aluno')
      }

      // TODO: Implementar queries reais quando tabelas estiverem prontas
      // Por enquanto, dados mockados
      setStats({
        treinosCompletados: 12,
        proximoTreino: 'Hoje - 15:00',
        diasAtivos: 8,
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Executa sempre que a tela ganha foco (volta do perfil)
  useFocusEffect(
    useCallback(() => {
      fetchStats()
    }, [])
  )

  // ✅ Executa na primeira vez que a tela carrega
  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Bem-vindo de volta!</Text>
      <Text style={styles.subtitle}>Olá, {nomeAluno}</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {loading ? '...' : stats.treinosCompletados}
          </Text>
          <Text style={styles.statLabel}>Treinos Completados</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {loading ? '...' : stats.diasAtivos}
          </Text>
          <Text style={styles.statLabel}>Dias Ativos</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Próximo Treino</Text>
        <View style={styles.nextWorkoutCard}>
          <Text style={styles.nextWorkoutTitle}>Treino de Peito e Tríceps</Text>
          <Text style={styles.nextWorkoutTime}>{stats.proximoTreino}</Text>
          <Text style={styles.nextWorkoutDescription}>
            • Supino reto - 4x12{'\n'}
            • Supino inclinado - 3x10{'\n'}
            • Mergulho - 3x15{'\n'}
            • Tríceps francês - 4x12
          </Text>
        </View>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Atividade Recente</Text>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>• Treino de pernas completado</Text>
          <Text style={styles.activityTime}>Ontem</Text>
        </View>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>• Novo treino atribuído pelo seu PT</Text>
          <Text style={styles.activityTime}>2 dias atrás</Text>
        </View>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>• Meta de 7 dias atingida! 🎉</Text>
          <Text style={styles.activityTime}>3 dias atrás</Text>
        </View>
      </View>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 0.45,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  nextWorkoutCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nextWorkoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  nextWorkoutTime: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 12,
  },
  nextWorkoutDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  recentActivity: {
    marginTop: 20,
  },
  activityCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
})
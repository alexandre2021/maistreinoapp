import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'


interface Treino {
  id: string
  nome: string
  tipo: string
  status: 'pendente' | 'em_andamento' | 'concluido'
  data_criacao: string
  exercicios_count: number
}

export default function MeusTreinos() {
  useAuth()
  const [treinos, setTreinos] = useState<Treino[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | 'pendente' | 'concluido'>('todos')

  useEffect(() => {
    fetchTreinos()
  }, [])

  const fetchTreinos = async () => {
    try {
      setLoading(true)
      
      // Obter usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('Usuário não encontrado')
        return
      }

      // TODO: Implementar query real quando tabela de treinos estiver pronta
      // Por enquanto, dados mockados
      const treinosMockados: Treino[] = [
        {
          id: '1',
          nome: 'Treino de Peito e Tríceps',
          tipo: 'Força',
          status: 'pendente',
          data_criacao: '2025-06-14',
          exercicios_count: 6
        },
        {
          id: '2',
          nome: 'Treino de Costas e Bíceps',
          tipo: 'Força',
          status: 'concluido',
          data_criacao: '2025-06-13',
          exercicios_count: 5
        },
        {
          id: '3',
          nome: 'Treino de Pernas',
          tipo: 'Força',
          status: 'concluido',
          data_criacao: '2025-06-12',
          exercicios_count: 8
        },
        {
          id: '4',
          nome: 'Cardio + Core',
          tipo: 'Cardio',
          status: 'pendente',
          data_criacao: '2025-06-11',
          exercicios_count: 4
        }
      ]

      setTreinos(treinosMockados)
    } catch (error) {
      console.error('Erro ao buscar treinos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return '#F59E0B'
      case 'em_andamento':
        return '#3B82F6'
      case 'concluido':
        return '#10B981'
      default:
        return '#6B7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente'
      case 'em_andamento':
        return 'Em Andamento'
      case 'concluido':
        return 'Concluído'
      default:
        return 'Desconhecido'
    }
  }

  const filteredTreinos = treinos.filter(treino => {
    if (filter === 'todos') return true
    return treino.status === filter
  })

  const handleIniciarTreino = (treino: Treino) => {
    // TODO: Implementar navegação para tela de execução do treino
    console.log('Iniciar treino:', treino.nome)
  }

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'todos' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('todos')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'todos' && styles.filterButtonTextActive
          ]}>
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'pendente' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('pendente')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'pendente' && styles.filterButtonTextActive
          ]}>
            Pendentes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'concluido' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('concluido')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'concluido' && styles.filterButtonTextActive
          ]}>
            Concluídos
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Meus Treinos</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando treinos...</Text>
          </View>
        ) : filteredTreinos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Nenhum treino encontrado</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'todos' 
                ? 'Seu personal trainer ainda não criou treinos para você.'
                : `Você não tem treinos ${filter === 'pendente' ? 'pendentes' : 'concluídos'}.`
              }
            </Text>
          </View>
        ) : (
          <View style={styles.treinosContainer}>
            {filteredTreinos.map((treino) => (
              <View key={treino.id} style={styles.treinoCard}>
                <View style={styles.treinoHeader}>
                  <View style={styles.treinoInfo}>
                    <Text style={styles.treinoNome}>{treino.nome}</Text>
                    <Text style={styles.treinoTipo}>{treino.tipo}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(treino.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {getStatusText(treino.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.treinoDetails}>
                  <Text style={styles.treinoExercicios}>
                    {treino.exercicios_count} exercícios
                  </Text>
                  <Text style={styles.treinoData}>
                    Criado em {new Date(treino.data_criacao).toLocaleDateString('pt-BR')}
                  </Text>
                </View>

                {treino.status === 'pendente' && (
                  <TouchableOpacity
                    style={styles.iniciarButton}
                    onPress={() => handleIniciarTreino(treino)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.iniciarButtonText}>Iniciar Treino</Text>
                  </TouchableOpacity>
                )}

                {treino.status === 'concluido' && (
                  <TouchableOpacity
                    style={styles.verDetalhesButton}
                    onPress={() => console.log('Ver detalhes:', treino.nome)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.verDetalhesButtonText}>Ver Detalhes</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  treinosContainer: {
    gap: 16,
  },
  treinoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  treinoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  treinoInfo: {
    flex: 1,
    marginRight: 12,
  },
  treinoNome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  treinoTipo: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  treinoDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  treinoExercicios: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  treinoData: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  iniciarButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  iniciarButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  verDetalhesButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  verDetalhesButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
})
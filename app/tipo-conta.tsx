import { router } from 'expo-router'
import { Activity, UserCheck } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function TipoConta() {
  const selecionarTipo = (tipo: 'personal_trainer' | 'aluno') => {
    if (tipo === 'personal_trainer') {
      router.push('/cadastro-pt')
    } else {
      router.push('/cadastro-aluno')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Escolha o tipo de conta</Text>
        <Text style={styles.subtitle}>Selecione como você deseja usar a plataforma</Text>

        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => selecionarTipo('personal_trainer')}
        >
          <View style={styles.iconContainer}>
            <UserCheck size={28} color="#007AFF" />
          </View>
          <Text style={styles.optionTitle}>Sou Personal Trainer</Text>
          <Text style={styles.optionSubtitle}>Gerencie seus alunos e treinos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => selecionarTipo('aluno')}
        >
          <View style={styles.iconContainer}>
            <Activity size={28} color="#007AFF" />
          </View>
          <Text style={styles.optionTitle}>Sou Aluno</Text>
          <Text style={styles.optionSubtitle}>Acesse seus treinos personalizados</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 22,
  },
  optionCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 30,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    color: '#1a1a1a',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
})
/* eslint-disable react/no-unescaped-entities */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';



export default function Dashboard() {
  // Mock data para exibição
  const stats = {
    totalAlunos: 12,
    totalExercicios: 34,
    totalTreinos: 8,
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Inicial</Text>
      <Text style={styles.subtitle}>Bem-vindo, Personal Trainer!</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalAlunos}</Text>
          <Text style={styles.statLabel}>Meus Alunos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalExercicios}</Text>
          <Text style={styles.statLabel}>Exercícios</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalTreinos}</Text>
          <Text style={styles.statLabel}>Treinos</Text>
        </View>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Atividade Recente</Text>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>• João Silva completou treino de hoje</Text>
          <Text style={styles.activityTime}>Há 2 horas</Text>
        </View>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>• Maria Santos foi adicionada</Text>
          <Text style={styles.activityTime}>Ontem</Text>
        </View>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>• Novo exercício "Agachamento" criado</Text>
          <Text style={styles.activityTime}>2 dias atrás</Text>
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
    flex: 0.3,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#A11E0A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  recentActivity: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
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
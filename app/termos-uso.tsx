import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function TermosUso() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="rgba(0, 122, 255, 1.00)" />
          </TouchableOpacity>
          <Text style={styles.title}>Termos de Uso</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.lastUpdate}>Última atualização: 11 de junho de 2025</Text>

          <Text style={styles.sectionTitle}>1. Aceitação dos Termos</Text>
          <Text style={styles.paragraph}>
            Ao utilizar o aplicativo MaisTreino, você concorda em estar vinculado a estes Termos de Uso. 
            Se você não concordar com qualquer parte destes termos, não deve usar nosso serviço.
          </Text>

          <Text style={styles.sectionTitle}>2. Descrição do Serviço</Text>
          <Text style={styles.paragraph}>
            O MaisTreino é uma plataforma digital que conecta personal trainers e alunos, permitindo o 
            gerenciamento de treinos, acompanhamento de exercícios e comunicação entre as partes.
          </Text>

          <Text style={styles.sectionTitle}>3. Cadastro e Conta de Usuário</Text>
          <Text style={styles.paragraph}>
            3.1. Para utilizar nossos serviços, você deve criar uma conta fornecendo informações precisas e atualizadas.
          </Text>
          <Text style={styles.paragraph}>
            3.2. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades 
            que ocorrem em sua conta.
          </Text>
          <Text style={styles.paragraph}>
            3.3. Você deve notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta.
          </Text>

          <Text style={styles.sectionTitle}>4. Responsabilidades do Personal Trainer</Text>
          <Text style={styles.paragraph}>
            4.1. Possuir certificações válidas e estar em conformidade com as regulamentações profissionais aplicáveis.
          </Text>
          <Text style={styles.paragraph}>
            4.2. Fornecer orientações seguras e adequadas aos alunos.
          </Text>
          <Text style={styles.paragraph}>
            4.3. Manter informações precisas sobre qualificações e experiência.
          </Text>

          <Text style={styles.sectionTitle}>5. Responsabilidades do Aluno</Text>
          <Text style={styles.paragraph}>
            5.1. Fornecer informações médicas relevantes e precisas antes de iniciar qualquer programa de exercícios.
          </Text>
          <Text style={styles.paragraph}>
            5.2. Seguir as orientações do personal trainer e comunicar qualquer desconforto ou lesão.
          </Text>
          <Text style={styles.paragraph}>
            5.3. Consultar um médico antes de iniciar qualquer programa de exercícios, especialmente se tiver condições médicas pré-existentes.
          </Text>

          <Text style={styles.sectionTitle}>6. Limitação de Responsabilidade</Text>
          <Text style={styles.paragraph}>
            O MaisTreino atua apenas como intermediário entre personal trainers e alunos. Não somos responsáveis 
            por lesões, danos ou resultados decorrentes do uso dos serviços dos personal trainers.
          </Text>

          <Text style={styles.sectionTitle}>7. Propriedade Intelectual</Text>
          <Text style={styles.paragraph}>
            Todo o conteúdo do aplicativo, incluindo textos, gráficos, logos e software, é propriedade 
            do MaisTreino ou de seus licenciadores e está protegido por leis de direitos autorais.
          </Text>

          <Text style={styles.sectionTitle}>8. Modificações dos Termos</Text>
          <Text style={styles.paragraph}>
            Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão 
            em vigor imediatamente após a publicação no aplicativo.
          </Text>

          <Text style={styles.sectionTitle}>9. Rescisão</Text>
          <Text style={styles.paragraph}>
            Podemos suspender ou encerrar sua conta a qualquer momento, por qualquer motivo, 
            incluindo violação destes termos.
          </Text>

          <Text style={styles.sectionTitle}>10. Lei Aplicável</Text>
          <Text style={styles.paragraph}>
            Estes termos são regidos pelas leis da República Federativa do Brasil.
          </Text>

          <Text style={styles.sectionTitle}>11. Contato</Text>
          <Text style={styles.paragraph}>
            Para dúvidas sobre estes Termos de Uso, entre em contato conosco:
          </Text>
          <Text style={styles.contactInfo}>
            Email: contato@maistreino.com{'\n'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(0, 122, 255, 1.00)',
  },
  content: {
    padding: 20,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(0, 122, 255, 1.00)',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'justify',
  },
  contactInfo: {
    fontSize: 14,
    color: 'rgba(0, 122, 255, 1.00)',
    fontWeight: '500',
    marginTop: 8,
  },
})
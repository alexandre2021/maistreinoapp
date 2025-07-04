import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function PoliticaPrivacidade() {
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
          <Text style={styles.title}>Política de Privacidade</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.lastUpdate}>Última atualização: 11 de junho de 2025</Text>

          <Text style={styles.sectionTitle}>1. Informações que Coletamos</Text>
          <Text style={styles.paragraph}>
            Coletamos as seguintes informações quando você utiliza o MaisTreino:
          </Text>
          <Text style={styles.paragraph}>
            1.1. <Text style={styles.bold}>Informações de Cadastro:</Text> Nome completo, email, 
            telefone, data de nascimento e outras informações fornecidas durante o registro.
          </Text>
          <Text style={styles.paragraph}>
            1.2. <Text style={styles.bold}>Informações de Perfil:</Text> Dados profissionais para 
            personal trainers, objetivos e preferências para alunos.
          </Text>
          <Text style={styles.paragraph}>
            1.3. <Text style={styles.bold}>Dados de Uso:</Text> Informações sobre como você utiliza 
            o aplicativo, incluindo treinos realizados e interações.
          </Text>

          <Text style={styles.sectionTitle}>2. Como Utilizamos suas Informações</Text>
          <Text style={styles.paragraph}>
            Utilizamos suas informações para:
          </Text>
          <Text style={styles.paragraph}>
            2.1. Fornecer e melhorar nossos serviços
          </Text>
          <Text style={styles.paragraph}>
            2.2. Facilitar a conexão entre personal trainers e alunos
          </Text>
          <Text style={styles.paragraph}>
            2.3. Personalizar sua experiência no aplicativo
          </Text>
          <Text style={styles.paragraph}>
            2.4. Enviar comunicações relevantes sobre o serviço
          </Text>
          <Text style={styles.paragraph}>
            2.5. Cumprir obrigações legais e regulamentares
          </Text>

          <Text style={styles.sectionTitle}>3. Compartilhamento de Informações</Text>
          <Text style={styles.paragraph}>
            3.1. <Text style={styles.bold}>Com Personal Trainers:</Text> Compartilhamos informações 
            básicas do aluno necessárias para o atendimento.
          </Text>
          <Text style={styles.paragraph}>
            3.2. <Text style={styles.bold}>Com Alunos:</Text> Compartilhamos informações profissionais 
            do personal trainer para facilitar a escolha.
          </Text>
          <Text style={styles.paragraph}>
            3.3. <Text style={styles.bold}>Prestadores de Serviços:</Text> Podemos compartilhar dados 
            com terceiros que nos ajudam a operar o aplicativo.
          </Text>
          <Text style={styles.paragraph}>
            3.4. <Text style={styles.bold}>Exigências Legais:</Text> Quando necessário para cumprir 
            leis, regulamentos ou ordens judiciais.
          </Text>

          <Text style={styles.sectionTitle}>4. Segurança dos Dados</Text>
          <Text style={styles.paragraph}>
            Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações 
            pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
          </Text>
          <Text style={styles.paragraph}>
            Utilizamos criptografia para proteger dados sensíveis e limitamos o acesso às informações 
            apenas a funcionários autorizados.
          </Text>

          <Text style={styles.sectionTitle}>5. Retenção de Dados</Text>
          <Text style={styles.paragraph}>
            Mantemos suas informações pessoais pelo tempo necessário para cumprir os propósitos 
            descritos nesta política, exceto quando um período de retenção mais longo for exigido por lei.
          </Text>

          <Text style={styles.sectionTitle}>6. Seus Direitos</Text>
          <Text style={styles.paragraph}>
            De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
          </Text>
          <Text style={styles.paragraph}>
            6.1. <Text style={styles.bold}>Acesso:</Text> Solicitar informações sobre o tratamento de seus dados
          </Text>
          <Text style={styles.paragraph}>
            6.2. <Text style={styles.bold}>Correção:</Text> Corrigir dados incompletos, inexatos ou desatualizados
          </Text>
          <Text style={styles.paragraph}>
            6.3. <Text style={styles.bold}>Exclusão:</Text> Solicitar a eliminação de dados pessoais
          </Text>
          <Text style={styles.paragraph}>
            6.4. <Text style={styles.bold}>Portabilidade:</Text> Solicitar a portabilidade de dados a outro fornecedor
          </Text>
          <Text style={styles.paragraph}>
            6.5. <Text style={styles.bold}>Revogação:</Text> Revogar o consentimento para o tratamento de dados
          </Text>

          <Text style={styles.sectionTitle}>7. Cookies e Tecnologias Similares</Text>
          <Text style={styles.paragraph}>
            Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso 
            do aplicativo e personalizar conteúdo.
          </Text>

          <Text style={styles.sectionTitle}>8. Alterações na Política</Text>
          <Text style={styles.paragraph}>
            Esta Política de Privacidade pode ser atualizada periodicamente. Notificaremos sobre 
            mudanças significativas através do aplicativo ou por email.
          </Text>

          <Text style={styles.sectionTitle}>9. Contato</Text>
          <Text style={styles.paragraph}>
            Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
          </Text>
          <Text style={styles.contactInfo}>
            Email: contato@maistreino.com{'\n'}
          </Text>

          <Text style={styles.sectionTitle}>10. Encarregado de Proteção de Dados</Text>
          <Text style={styles.paragraph}>
            Nosso Encarregado de Proteção de Dados (DPO) pode ser contatado através do email: 
            dpo@maistreino.com
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
  bold: {
    fontWeight: '600',
    color: '#1F2937',
  },
  contactInfo: {
    fontSize: 14,
    color: 'rgba(0, 122, 255, 1.00)',
    fontWeight: '500',
    marginTop: 8,
  },
})
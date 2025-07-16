// components/rotina/AtivarRotinaModal.tsx
import { CheckCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePDFRotinaEmail } from '../../hooks/usePDFRotinaEmail';
import { CustomSwitch } from '../ui/CustomSwitch';

interface AtivarRotinaModalProps {
  visible: boolean;
  rotinaNome: string;
  rotinaId: string;  // ✅ Novo: ID da rotina
  alunoEmail: string;  // ✅ Novo: Email do aluno
  nomeAluno: string;  // ✅ Novo: Nome do aluno
  nomePersonal: string;  // ✅ Novo: Nome do personal
  onConfirm: (config: { permiteExecucao: boolean; enviarEmail: boolean }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const AtivarRotinaModal: React.FC<AtivarRotinaModalProps> = ({
  visible,
  rotinaNome,
  rotinaId,
  alunoEmail,
  nomeAluno,
  nomePersonal,
  onConfirm,
  onCancel,
  loading = false
}) => {
  const [permiteExecucao, setPermiteExecucao] = useState(false);
  const [enviarEmail, setEnviarEmail] = useState(false);
  const [step, setStep] = useState<'config' | 'processando' | 'sucesso' | 'erro'>('config');
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [erroEmail, setErroEmail] = useState<string | null>(null);

  const { enviarPDFPorEmail, isLoading: isEnviandoPDF } = usePDFRotinaEmail();

  const handleConfirm = async () => {
    setStep('processando');
    setErroEmail(null);

    try {
      // 1. Ativar a rotina primeiro
      console.log('🔄 1/2 - Ativando rotina...');
      await onConfirm({ permiteExecucao, enviarEmail });

      // 2. Se enviar por email estiver marcado, enviar PDF
      if (enviarEmail) {
        console.log('🔄 2/2 - Gerando e enviando PDF...');
        
        const resultadoPDF = await enviarPDFPorEmail({
          rotinaId,
          alunoEmail,
          nomeAluno,
          nomePersonal
        });

        if (resultadoPDF.success) {
          setEmailEnviado(true);
          console.log('✅ PDF enviado com sucesso!');
        } else {
          setErroEmail(resultadoPDF.error || 'Erro no envio do PDF');
          console.warn('⚠️ Rotina ativada, mas falhou no envio do PDF');
        }
      }

      setStep('sucesso');
    } catch (error) {
      console.error('❌ Erro ao ativar rotina:', error);
      setStep('erro');
    }
  };

  const handleFechar = () => {
    onCancel();
    // Reset estados
    setStep('config');
    setPermiteExecucao(false);
    setEnviarEmail(false);
    setEmailEnviado(false);
    setErroEmail(null);
  };

  const renderConfigStep = () => (
    <>
      <View style={styles.iconContainer}>
        <CheckCircle size={48} color="#10B981" />
      </View>

      <Text style={styles.title}>Ativar Rotina</Text>
      
      <Text style={styles.rotinaNome}>&quot;{rotinaNome}&quot;</Text>

      <Text style={styles.subtitle}>
        Configure as opções de ativação:
      </Text>

      <View style={styles.configContainer}>
        <View style={styles.configRow}>
          <View style={styles.configInfo}>
            <Text style={styles.configTitle}>Modo aluno</Text>
            <Text style={styles.configDescription}>
              Permite que o aluno execute os treinos pelo aplicativo
            </Text>
          </View>
          <CustomSwitch
            value={permiteExecucao}
            onValueChange={setPermiteExecucao}
          />
        </View>

        <View style={styles.configRow}>
          <View style={styles.configInfo}>
            <Text style={styles.configTitle}>Enviar por Email</Text>
            <Text style={styles.configDescription}>
              Envia a rotina completa para o email do aluno
            </Text>
          </View>
          <CustomSwitch
            value={enviarEmail}
            onValueChange={setEnviarEmail}
          />
        </View>

        {/* ✅ Mostrar email do aluno quando opção marcada */}
        {enviarEmail && (
          <View style={styles.emailInfo}>
            <Text style={styles.emailLabel}>📧 Será enviado para:</Text>
            <Text style={styles.emailValue}>{alunoEmail}</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleFechar}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.confirmButton, loading && styles.disabledButton]}
          onPress={handleConfirm}
          disabled={loading}
        >
          <Text style={styles.confirmButtonText}>
            {loading ? 'Ativando...' : 'Ativar'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderProcessandoStep = () => (
    <>
      <View style={styles.iconContainer}>
        <View style={styles.loadingSpinner} />
      </View>

      <Text style={styles.title}>Processando...</Text>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>✅ Ativando rotina</Text>
        {enviarEmail && (
          <Text style={[styles.progressText, isEnviandoPDF && styles.progressActive]}>
            {isEnviandoPDF ? '🔄 Gerando e enviando PDF...' : '⏳ Preparando PDF...'}
          </Text>
        )}
      </View>
    </>
  );

  const renderSucessoStep = () => (
    <>
      <View style={styles.iconContainer}>
        <CheckCircle size={48} color="#10B981" />
      </View>

      <Text style={styles.title}>Rotina Ativada!</Text>
      
      <Text style={styles.successMessage}>
        A rotina foi ativada com sucesso e {nomeAluno} já pode começar a treinar.
      </Text>

      {/* Status do Email */}
      {enviarEmail && (
        <View style={[
          styles.emailStatus,
          emailEnviado ? styles.emailSuccess : styles.emailError
        ]}>
          <Text style={styles.emailStatusText}>
            {emailEnviado 
              ? '✅ PDF enviado por email com sucesso!' 
              : `❌ Erro no envio: ${erroEmail}`
            }
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, styles.confirmButton]}
        onPress={handleFechar}
      >
        <Text style={styles.confirmButtonText}>Fechar</Text>
      </TouchableOpacity>
    </>
  );

  const renderErroStep = () => (
    <>
      <View style={styles.iconContainer}>
        <Text style={styles.errorIcon}>❌</Text>
      </View>

      <Text style={styles.title}>Erro na Ativação</Text>
      
      <Text style={styles.errorMessage}>
        Ocorreu um erro ao ativar a rotina. Tente novamente.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleFechar}
        >
          <Text style={styles.cancelButtonText}>Fechar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={() => setStep('config')}
        >
          <Text style={styles.confirmButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderContent = () => {
    switch (step) {
      case 'config':
        return renderConfigStep();
      case 'processando':
        return renderProcessandoStep();
      case 'sucesso':
        return renderSucessoStep();
      case 'erro':
        return renderErroStep();
      default:
        return renderConfigStep();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleFechar}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  rotinaNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A11E0A',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  configContainer: {
    width: '100%',
    marginBottom: 24,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  configInfo: {
    flex: 1,
    marginRight: 16,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  configDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    backgroundColor: '#A11E0A',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  // ✅ Novos estilos
  emailInfo: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  emailLabel: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  emailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  loadingSpinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#E5E7EB',
    borderTopColor: '#3B82F6',
    // Adicione animação de rotação se necessário
  },
  progressContainer: {
    width: '100%',
    padding: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  successMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  emailStatus: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  emailSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  emailError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emailStatusText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 48,
  },
  errorMessage: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
});
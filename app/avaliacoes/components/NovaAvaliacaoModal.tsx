// app/avaliacoes/components/NovaAvaliacaoModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FotoUploadComponent from './FotoUploadComponent';

interface NovaAvaliacaoData {
  peso: string;
  altura: string;
  peito: string;
  cintura: string;
  quadril: string;
  coxaDireita: string;
  bracoDireito: string;
  observacoes: string;
  foto_frente: string | null;
  foto_perfil: string | null;
  foto_costas: string | null;
}

type ImageField = 'foto_frente' | 'foto_perfil' | 'foto_costas';

interface NovaAvaliacaoModalProps {
  visible: boolean;
  onClose: () => void;
  novaAvaliacao: NovaAvaliacaoData;
  setNovaAvaliacao: React.Dispatch<React.SetStateAction<NovaAvaliacaoData>>;
  onSalvar: () => void;
  onOpenImagePicker: (field: ImageField) => void;
  onDeleteImage: (field: ImageField) => void;
  isSaving: boolean;
}

export default function NovaAvaliacaoModal({
  visible,
  onClose,
  novaAvaliacao,
  setNovaAvaliacao,
  onSalvar,
  onOpenImagePicker,
  onDeleteImage,
  isSaving
}: NovaAvaliacaoModalProps) {
  
  // ✅ SISTEMA DE TOAST igual ao cadastro de aluno
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('error')

  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    console.log('🍞 SHOW TOAST CHAMADO:', message, type)
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 4000)
  }
  
  // ✅ FUNÇÃO: Validação dos campos obrigatórios
  const handleSalvar = () => {
    // Validar peso
    if (!novaAvaliacao.peso.trim()) {
      showToast('Por favor, informe o peso.', 'error')
      return
    }
    
    // Validar altura
    if (!novaAvaliacao.altura.trim()) {
      showToast('Por favor, informe a altura.', 'error')
      return
    }
    
    // Validação adicional: peso deve ser número válido
    const peso = parseFloat(novaAvaliacao.peso.replace(',', '.'))
    if (isNaN(peso) || peso <= 0) {
      showToast('Peso deve ser um número válido maior que zero.', 'error')
      return
    }
    
    // Validação adicional: altura deve ser número válido
    const altura = parseFloat(novaAvaliacao.altura)
    if (isNaN(altura) || altura <= 0) {
      showToast('Altura deve ser um número válido maior que zero.', 'error')
      return
    }
    
    // Se passou na validação, chama a função original
    onSalvar()
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova Avaliação</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Dados Básicos */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dados Básicos <Text style={styles.required}>*</Text></Text>
              
              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Peso (kg) <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[
                      styles.input,
                      !novaAvaliacao.peso.trim() && styles.inputError // ✅ Destaque erro
                    ]}
                    value={novaAvaliacao.peso}
                    onChangeText={(text) => setNovaAvaliacao(prev => ({ ...prev, peso: text }))}
                    placeholder="Ex 70.5"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Altura (cm) <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[
                      styles.input,
                      !novaAvaliacao.altura.trim() && styles.inputError // ✅ Destaque erro
                    ]}
                    value={novaAvaliacao.altura}
                    onChangeText={(text) => setNovaAvaliacao(prev => ({ ...prev, altura: text }))}
                    placeholder="180"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            {/* Medidas Corporais */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medidas Corporais (opcional)</Text>
              
              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Peito (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={novaAvaliacao.peito}
                    onChangeText={(text) => setNovaAvaliacao(prev => ({ ...prev, peito: text }))}
                    placeholder="Ex 92"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Cintura (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={novaAvaliacao.cintura}
                    onChangeText={(text) => setNovaAvaliacao(prev => ({ ...prev, cintura: text }))}
                    placeholder="Ex 80"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quadril (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={novaAvaliacao.quadril}
                    onChangeText={(text) => setNovaAvaliacao(prev => ({ ...prev, quadril: text }))}
                    placeholder="Ex 95"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Coxa direita (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={novaAvaliacao.coxaDireita}
                    onChangeText={(text) => setNovaAvaliacao(prev => ({ ...prev, coxaDireita: text }))}
                    placeholder="Ex 58"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Braço direito (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={novaAvaliacao.bracoDireito}
                    onChangeText={(text) => setNovaAvaliacao(prev => ({ ...prev, bracoDireito: text }))}
                    placeholder="Ex 35"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.inputGroup} />
              </View>
            </View>

            {/* Fotos de Progresso */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fotos de Progresso</Text>
              <Text style={styles.sectionSubtitle}>
                Adicione fotos para acompanhar a evolução física do aluno
              </Text>

              <View style={styles.fotosContainer}>
                <View style={styles.fotoColumn}>
                  <FotoUploadComponent
                    label="Frente"
                    uri={novaAvaliacao.foto_frente}
                    onUpload={() => onOpenImagePicker('foto_frente')}
                    onDelete={novaAvaliacao.foto_frente ? () => onDeleteImage('foto_frente') : undefined}
                    disabled={isSaving}
                  />
                </View>
                
                <View style={styles.fotoColumn}>
                  <FotoUploadComponent
                    label="Perfil"
                    uri={novaAvaliacao.foto_perfil}
                    onUpload={() => onOpenImagePicker('foto_perfil')}
                    onDelete={novaAvaliacao.foto_perfil ? () => onDeleteImage('foto_perfil') : undefined}
                    disabled={isSaving}
                  />
                </View>
                
                <View style={styles.fotoColumn}>
                  <FotoUploadComponent
                    label="Costas"
                    uri={novaAvaliacao.foto_costas}
                    onUpload={() => onOpenImagePicker('foto_costas')}
                    onDelete={novaAvaliacao.foto_costas ? () => onDeleteImage('foto_costas') : undefined}
                    disabled={isSaving}
                  />
                </View>
              </View>
            </View>

            {/* Observações */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Observações</Text>
              <TextInput
                style={styles.textArea}
                value={novaAvaliacao.observacoes}
                onChangeText={(text) => setNovaAvaliacao(prev => ({ ...prev, observacoes: text }))}
                placeholder="Observações sobre a avaliação, condições físicas..."
                multiline
                numberOfLines={4}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSalvar} // ✅ Função com validação
              disabled={isSaving}
            >
              {isSaving ? (
                <Text style={styles.saveButtonText}>Salvando...</Text>
              ) : (
                <Text style={styles.saveButtonText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ✅ TOAST CUSTOMIZADO - Igual ao padrão da página de cadastro */}
      {toastVisible && (
        <View style={[styles.toast, toastType === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '90%',
    zIndex: 1001,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  // ✅ NOVO: Estilo para inputs com erro
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  required: {
    color: '#EF4444',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    height: 100,
    textAlignVertical: 'top',
  },
  fotosContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  fotoColumn: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  // ✅ ESTILOS DO TOAST - Igual ao padrão da página de cadastro
  toast: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999,
  },
  toastSuccess: {
    backgroundColor: 'rgba(0, 122, 255, 1.00)',
  },
  toastError: {
    backgroundColor: '#DC2626',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
// app/avaliacoes/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// ✅ Componentes importados
import LoadingScreen from '../../components/LoadingScreen';
import AlunoHeader from './components/AlunoHeader';
import ConfirmacaoIntervaloModal from './components/ConfirmacaoIntervaloModal';
import DetalhesModal from './components/DetalhesModal';
import HistoricoAvaliacoes from './components/HistoricoAvaliacoes';
import ImageModals from './components/ImageModals';
import NovaAvaliacaoModal from './components/NovaAvaliacaoModal';

// ✅ Hook customizado
import { useAvaliacoes } from '../../hooks/avaliacoes/useAvaliacoes';

export default function AvaliacoesScreen() {
  const { id } = useLocalSearchParams();
  
  // ✅ Usando o hook customizado para gerenciar todo o estado
  const {
    // Estados
    loading,
    alunoData,
    avaliacoes,
    isSaving,
    
    // Estados dos modais
    showNovaAvaliacao,
    showDetalhesAvaliacao,
    showImageOptions,
    showImagePreview,
    showConfirmacaoIntervalo,
    
    // Estados de seleção
    avaliacaoSelecionada,
    previewImageUri,
    novaAvaliacao,
    setNovaAvaliacao,
    dadosConfirmacao,
    
    // Funções utilitárias
    obterClassificacaoIMC,
    formatDate,
    verificarIntervaloAvaliacao,
    
    // Funções de modal
    abrirDetalhesAvaliacao,
    fecharDetalhesAvaliacao,
    abrirNovaAvaliacao,
    fecharNovaAvaliacao,
    confirmarCriacaoComAviso,
    cancelarCriacaoAvaliacao,
    
    // Funções de imagem
    openImagePicker,
    closeImageOptions,
    openImagePreview,
    closeImagePreview,
    pickImageFromCamera,
    pickImageFromGallery,
    handleDeleteImage, // ✅ NOVA FUNÇÃO PARA DELETE
    
    // Funções de ação
    handleSalvarAvaliacao
  } = useAvaliacoes(id);

  // Loading state
  if (loading) {
    return <LoadingScreen message="Carregando dados..." />;
  }

  // ✅ NOVA FUNÇÃO - Renderizar aviso de intervalo
  const renderAvisoIntervalo = () => {
    if (avaliacoes.length === 0) return null;

    const { podeCrear, diasRestantes, diasUltima } = verificarIntervaloAvaliacao();
    
    if (podeCrear) return null; // Não mostrar se já pode criar

    return (
      <View style={styles.avisoIntervaloCard}>
        <View style={styles.avisoIntervaloHeader}>
          <Ionicons name="time-outline" size={20} color="#F59E0B" />
          <Text style={styles.avisoIntervaloTitle}>Intervalo Recomendado</Text>
        </View>
        <Text style={styles.avisoIntervaloText}>
          Última avaliação há {diasUltima} dias. Recomendamos aguardar mais {diasRestantes} dias para resultados mais precisos.
        </Text>
      </View>
    );
  };

  // Estado vazio (sem avaliações)
  const renderEmptyState = () => (
    <View style={styles.emptyCard}>
      <Ionicons name="analytics-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>Nenhuma avaliação</Text>
      <Text style={styles.emptySubtitle}>
        As avaliações físicas realizadas aparecerão aqui. Recomendamos um intervalo 
        mínimo de 30 dias entre avaliações para resultados mais precisos.
      </Text>
      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={abrirNovaAvaliacao}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.primaryButtonText}>Criar primeira avaliação</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/alunos')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Avaliações</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={abrirNovaAvaliacao}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Avaliação</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* ✅ Cabeçalho do Aluno - Componente */}
          {alunoData && (
            <AlunoHeader alunoData={alunoData} />
          )}

          {/* ✅ Conteúdo Principal - Última Avaliação ou Estado Vazio */}
          {avaliacoes.length > 0 ? (
            <>
              {/* ✅ Aviso de Intervalo - NOVO */}
              {renderAvisoIntervalo()}

              {/* ✅ Última Avaliação - Componente */}
              {/* <UltimaAvaliacao 
                avaliacao={avaliacoes[0]}
                formatDate={formatDate}
                obterClassificacaoIMC={obterClassificacaoIMC}
                onPreviewImage={openImagePreview}
              /> */}

              {/* ✅ Histórico de Avaliações - Componente */}
              <HistoricoAvaliacoes
                avaliacoes={avaliacoes}
                formatDate={formatDate}
                obterClassificacaoIMC={obterClassificacaoIMC}
                onAbrirDetalhes={abrirDetalhesAvaliacao}
                onPreviewImage={openImagePreview}
              />
            </>
          ) : (
            renderEmptyState()
          )}
        </View>
      </ScrollView>

      {/* ✅ Modal de Detalhes da Avaliação - Componente */}
      <DetalhesModal
        visible={showDetalhesAvaliacao}
        avaliacao={avaliacaoSelecionada}
        onClose={fecharDetalhesAvaliacao}
        formatDate={formatDate}
        obterClassificacaoIMC={obterClassificacaoIMC}
        onPreviewImage={openImagePreview}
      />

      {/* ✅ Modal de Nova Avaliação - Componente COM FUNÇÃO DE DELETE */}
      <NovaAvaliacaoModal
        visible={showNovaAvaliacao}
        onClose={fecharNovaAvaliacao}
        novaAvaliacao={novaAvaliacao}
        setNovaAvaliacao={setNovaAvaliacao}
        onSalvar={handleSalvarAvaliacao}
        onOpenImagePicker={openImagePicker}
        onDeleteImage={handleDeleteImage} // ✅ NOVA PROP ADICIONADA
        isSaving={isSaving}
      />

      {/* ✅ Modal de Confirmação de Intervalo - NOVO */}
      {dadosConfirmacao && (
        <ConfirmacaoIntervaloModal
          visible={showConfirmacaoIntervalo}
          diasUltima={dadosConfirmacao.diasUltima}
          diasRestantes={dadosConfirmacao.diasRestantes}
          ultimaData={dadosConfirmacao.ultimaData}
          onConfirmar={confirmarCriacaoComAviso}
          onCancelar={cancelarCriacaoAvaliacao}
        />
      )}

      {/* ✅ Modais de Imagem - Componente */}
      <ImageModals
        showImageOptions={showImageOptions}
        onCloseImageOptions={closeImageOptions}
        onPickFromCamera={pickImageFromCamera}
        onPickFromGallery={pickImageFromGallery}
        showImagePreview={showImagePreview}
        previewImageUri={previewImageUri}
        onCloseImagePreview={closeImagePreview}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A11E0A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // ✅ NOVOS ESTILOS - Card de aviso de intervalo
  avisoIntervaloCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  avisoIntervaloHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  avisoIntervaloTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  avisoIntervaloText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
});
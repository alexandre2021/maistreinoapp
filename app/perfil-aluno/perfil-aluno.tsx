import { router } from 'expo-router';
import { ArrowLeft, HelpCircle, Shield, Target, User, X } from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    Animated,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import AvatarSection from '../../components/AvatarSection';
import PasswordChangeSection from '../../components/PasswordChangeSection';
import { useAuth } from '../../hooks/useAuth';
import PerfilTabs from './components/PerfilTabs';
import { usePerfil } from './hooks/usePerfil';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  
  // Toast
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
  },
  toastSuccess: {
    backgroundColor: '#10B981',
  },
  toastError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Color Picker
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 300,
  },
  colorPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#1F2937',
  },
  colorSelectedIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
});

export default function PerfilAluno() {
  useAuth();
  
  // ========= USAR O HOOK CENTRALIZADO =========
  const {
    // Estados principais
    activeTab,
    setActiveTab,
    userData,
    loading,
    uploading,
    showColorPicker,
    setShowColorPicker,
    showEditModal,
    showDatePicker,
    showGeneroOptions,
    showObjetivoOptions,
    showNivelOptions,
    showFrequenciaOptions,
    editingSection,
    editData,
    setEditData,
    selectedDay,
    setSelectedDay,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    toast,
    toastAnimation,

    // Constantes
    avatarColors,
    generoOptions,
    objetivoOptions,
    nivelExperienciaOptions,
    frequenciaTreinoOptions,
    perguntasParQ,

    // Funções utilitárias
    formatPhoneNumber,
    formatISOToBrazilian,
    formatISOToDateTime,
    getCurrentDate,
    handlePesoChange,
    handleAlturaChange,

    // Funções principais
    showToast,
    uploadAvatar,
    switchToLetterAvatar,
    openEditModal,
    saveChanges,
    updateAvatarColor,
    setShowEditModal,
    setShowDatePicker,
    setShowGeneroOptions,
    setShowObjetivoOptions,
    setShowNivelOptions,
    setShowFrequenciaOptions,
  } = usePerfil();

  // ========= FUNÇÃO DE LOGOUT =========
  const handleSignOut = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              const { supabase } = await import('../../lib/supabase');
              const { error } = await supabase.auth.signOut();
              if (error) {
                showToast('Erro ao sair', 'error');
              } else {
                router.replace('/');
              }
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
              showToast('Erro inesperado ao sair', 'error');
            }
          }
        }
      ]
    );
  };

  // ========= RENDERIZAR SELETOR DE CORES =========
  const renderColorPicker = () => (
    <Modal visible={showColorPicker} transparent animationType="fade" accessible={false} importantForAccessibility="no">
      <View style={styles.modalOverlay}>
        <View style={styles.colorPickerContainer}>
          <View style={styles.colorPickerHeader}>
            <Text style={styles.colorPickerTitle}>Cor do Avatar</Text>
            <TouchableOpacity onPress={() => setShowColorPicker(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.colorGrid}>
            {avatarColors.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  userData?.avatar_color === color && styles.colorOptionSelected
                ]}
                onPress={() => updateAvatarColor(color)}
              >
                {userData?.avatar_color === color && (
                  <View style={styles.colorSelectedIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  // ========= LOADING STATE =========
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Toast */}
      {toast.visible && (
        <Animated.View 
          style={[
            styles.toastContainer,
            toast.type === 'success' ? styles.toastSuccess : styles.toastError,
            {
              opacity: toastAnimation,
              transform: [{
                translateY: toastAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0]
                })
              }]
            }
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* Conteúdo principal - SEMPRE renderizar o ScrollView */}
      <ScrollView style={styles.scrollView}>
        {/* Header com botão de voltar */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/index-aluno')}
          >
            <ArrowLeft size={24} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Meu Perfil</Text>
            <Text style={styles.subtitle}>Gerencie suas informações pessoais e configurações</Text>
          </View>
        </View>

        {/* Avatar Section - Componente Global */}
        <AvatarSection
          userData={userData}
          uploading={uploading}
          onUpload={uploadAvatar}
          onColorChange={updateAvatarColor}
          onSwitchToLetter={switchToLetterAvatar}
          userType="aluno"
          showCodigoPT={false}
        />

        {/* Tabs Navigation */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pessoal' && styles.activeTab]}
            onPress={() => setActiveTab('pessoal')}
          >
            <User size={20} color={activeTab === 'pessoal' ? '#007AFF' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'pessoal' && styles.activeTabText]}>
              Pessoal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'objetivos' && styles.activeTab]}
            onPress={() => setActiveTab('objetivos')}
          >
            <Target size={20} color={activeTab === 'objetivos' ? '#007AFF' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'objetivos' && styles.activeTabText]}>
              Objetivos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'parq' && styles.activeTab]}
            onPress={() => setActiveTab('parq')}
          >
            <HelpCircle size={20} color={activeTab === 'parq' ? '#007AFF' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'parq' && styles.activeTabText]}>
              PAR-Q
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'seguranca' && styles.activeTab]}
            onPress={() => setActiveTab('seguranca')}
          >
            <Shield size={20} color={activeTab === 'seguranca' ? '#007AFF' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'seguranca' && styles.activeTabText]}>
              Segurança
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo das Tabs */}
        {(activeTab === 'pessoal' || activeTab === 'objetivos' || activeTab === 'parq') && (
          <PerfilTabs
            // Estados
            activeTab={activeTab}
            userData={userData}
            showEditModal={showEditModal}
            showDatePicker={showDatePicker}
            showGeneroOptions={showGeneroOptions}
            showObjetivoOptions={showObjetivoOptions}
            showNivelOptions={showNivelOptions}
            showFrequenciaOptions={showFrequenciaOptions}
            editingSection={editingSection}
            editData={editData}
            selectedDay={selectedDay}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}

            // Constantes
            generoOptions={generoOptions}
            objetivoOptions={objetivoOptions}
            nivelExperienciaOptions={nivelExperienciaOptions}
            frequenciaTreinoOptions={frequenciaTreinoOptions}
            perguntasParQ={perguntasParQ}

            // Funções
            formatPhoneNumber={formatPhoneNumber}
            formatISOToBrazilian={formatISOToBrazilian}
            formatISOToDateTime={formatISOToDateTime}
            getCurrentDate={getCurrentDate}
            handlePesoChange={handlePesoChange}
            handleAlturaChange={handleAlturaChange}
            openEditModal={openEditModal}
            saveChanges={saveChanges}
            setShowEditModal={setShowEditModal}
            setShowDatePicker={setShowDatePicker}
            setShowGeneroOptions={setShowGeneroOptions}
            setShowObjetivoOptions={setShowObjetivoOptions}
            setShowNivelOptions={setShowNivelOptions}
            setShowFrequenciaOptions={setShowFrequenciaOptions}
            setEditData={setEditData}
            setSelectedDay={setSelectedDay}
            setSelectedMonth={setSelectedMonth}
            setSelectedYear={setSelectedYear}
          />
        )}
        
        {/* Aba de Segurança - Componente Global */}
        {activeTab === 'seguranca' && (
          <>
            <PasswordChangeSection 
              onPasswordChange={(success, message) => {
                showToast(message, success ? 'success' : 'error');
              }}
            />
            
            {/* Botão de Logout */}
            <View style={{ padding: 16 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#DC2626',
                  padding: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={handleSignOut}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                  Sair da Conta
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal de Cores */}
      {showColorPicker && renderColorPicker()}
    </SafeAreaView>
  );
}
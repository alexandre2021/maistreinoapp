// app/criar-rotina/treinos.tsx - STORAGE CENTRALIZADO
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Components
import { RotinaProgressHeader } from '../../components/rotina/RotinaProgressHeader';

// Constants - grupos musculares disponíveis
import { GRUPOS_MUSCULARES } from '../../constants/exercicios';

// ✅ STORAGE CENTRALIZADO
import RotinaStorage, { TreinoData } from '../../utils/rotinaStorage';

// ✅ TIPOS LOCAIS (sem Context)
interface TreinoConfig {
  id: string;
  nome: string;
  gruposMusculares: string[];
  exercicios: any[]; // Será usado depois
}

export default function TreinosRotinaScreen() {
  const router = useRouter();

  // ✅ LER DADOS SALVOS DO STORAGE CENTRALIZADO
  const configSalva = RotinaStorage.getConfig();
  const treinosSalvos = RotinaStorage.getTreinos();

  const [treinos, setTreinos] = useState<TreinoConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // ✅ INICIALIZAÇÃO SIMPLIFICADA
  useEffect(() => {
    if (initialized) return;

    console.log('🚀 INICIALIZANDO TREINOS COM STORAGE CENTRALIZADO');
    
    const treinosPorSemana = configSalva?.treinosPorSemana || 3;
    const letras = ['A', 'B', 'C', 'D', 'E', 'F'];

    let novosTreeinos: TreinoConfig[] = [];

    // ✅ USAR TREINOS SALVOS OU CRIAR NOVOS
    if (treinosSalvos.length === treinosPorSemana) {
      console.log('🔄 CARREGANDO treinos salvos:', treinosSalvos.length);
      // Converter TreinoData para TreinoConfig
      novosTreeinos = treinosSalvos.map(treino => ({
        id: treino.id,
        nome: treino.nome,
        gruposMusculares: treino.gruposMusculares,
        exercicios: []
      }));
    } else {
      console.log('🆕 CRIANDO novos treinos para', treinosPorSemana, 'treinos/semana');
      
      // Criar novos treinos
      for (let i = 0; i < treinosPorSemana; i++) {
        novosTreeinos.push({
          id: `treino-${i + 1}`,
          nome: `Treino ${letras[i]}`,
          gruposMusculares: [],
          exercicios: []
        });
      }
    }

    console.log('✅ Treinos finais:', novosTreeinos.map(t => ({
      nome: t.nome,
      grupos: t.gruposMusculares.length
    })));
    
    setTreinos(novosTreeinos);
    setInitialized(true);
  }, [initialized, configSalva?.treinosPorSemana, treinosSalvos]);

  // ✅ SALVAR TREINOS SEMPRE QUE MUDAR
  useEffect(() => {
    if (initialized && treinos.length > 0) {
      // Converter TreinoConfig para TreinoData
      const treinosParaSalvar: TreinoData[] = treinos.map(treino => ({
        id: treino.id,
        nome: treino.nome,
        gruposMusculares: treino.gruposMusculares
      }));
      RotinaStorage.saveTreinos(treinosParaSalvar);
    }
  }, [treinos, initialized]);

  // TOGGLE GRUPO MUSCULAR EM UM TREINO
  const toggleGrupoMuscular = (treinoId: string, grupoMuscular: string) => {
    setTreinos(prev => prev.map(treino => {
      if (treino.id === treinoId) {
        const jaTemGrupo = treino.gruposMusculares.includes(grupoMuscular);
        
        const novosGrupos = jaTemGrupo 
          ? treino.gruposMusculares.filter(g => g !== grupoMuscular)
          : [...treino.gruposMusculares, grupoMuscular];

        // ✅ LIMPAR EXERCÍCIOS QUANDO GRUPOS MUSCULARES SÃO ALTERADOS
        RotinaStorage.verificarELimparExerciciosInconsistentes(treinoId, novosGrupos);
        
        return {
          ...treino,
          gruposMusculares: novosGrupos
        };
      }
      return treino;
    }));
  };

  // LIMPAR TODOS OS GRUPOS DE UM TREINO
  const limparTreino = (treinoId: string) => {
    // ✅ LIMPAR EXERCÍCIOS QUANDO TODOS OS GRUPOS SÃO REMOVIDOS
    RotinaStorage.clearExerciciosDoTreino(treinoId);
    
    setTreinos(prev => prev.map(treino => 
      treino.id === treinoId 
        ? { ...treino, gruposMusculares: [] }
        : treino
    ));
  };

  // VALIDAÇÕES
  const getTreinosValidos = () => {
    return treinos.filter(treino => treino.gruposMusculares.length > 0);
  };

  const getTotalGruposMusculares = () => {
    const grupos = new Set<string>();
    treinos.forEach(treino => {
      treino.gruposMusculares.forEach(grupo => grupos.add(grupo));
    });
    return grupos.size;
  };

  const isFormValid = () => {
    return treinos.length > 0 && treinos.every(treino => treino.gruposMusculares.length > 0);
  };

  // ✅ SALVAR E AVANÇAR PARA EXERCÍCIOS - VERSÃO STORAGE CENTRALIZADO
  const handleNext = async () => {
    if (!isFormValid()) {
      Alert.alert(
        'Configuração incompleta',
        'Todos os treinos devem ter pelo menos 1 grupo muscular selecionado.'
      );
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Salvando treinos e avançando para exercícios...');
      
      // ✅ SALVAR NO STORAGE CENTRALIZADO (já está sendo salvo automaticamente)
      const treinosParaSalvar: TreinoData[] = treinos.map(treino => ({
        id: treino.id,
        nome: treino.nome,
        gruposMusculares: treino.gruposMusculares
      }));
      RotinaStorage.saveTreinos(treinosParaSalvar);
      
      // ✅ NAVEGAÇÃO COM ALUNO ID
      const alunoId = configSalva?.alunoId;
      if (alunoId) {
        router.push(`/criar-rotina/exercicios?alunoId=${alunoId}`);
      } else {
        router.push('/criar-rotina/exercicios');
      }

    } catch (error) {
      console.error('❌ Erro ao salvar treinos:', error);
      Alert.alert('Erro', 'Não foi possível salvar a configuração dos treinos');
    } finally {
      setLoading(false);
    }
  };

  // ✅ VOLTAR PARA CONFIGURAÇÃO COM ALUNO ID
  const handlePrevious = () => {
    console.log('🔙 Voltando para configuração...');
    
    // ✅ TREINOS JÁ ESTÃO SALVOS NO SESSIONSTORAGE
    // Navegar de volta com alunoId
    const alunoId = configSalva?.alunoId;
    if (alunoId) {
      router.push(`/criar-rotina/configuracao?alunoId=${alunoId}`);
    } else {
      router.push('/criar-rotina/configuracao');
    }
  };

  // RENDERIZAR CARD DE TREINO
  const renderTreinoCard = (treino: TreinoConfig) => {
    const gruposSelecionados = treino.gruposMusculares.length;
    const isCompleto = gruposSelecionados > 0;

    return (
      <View key={treino.id} style={styles.treinoCard}>
        {/* Header do treino */}
        <View style={styles.treinoHeader}>
          <View style={styles.treinoTitleContainer}>
            <Text style={styles.treinoNome}>{treino.nome}</Text>
            <View style={[
              styles.statusBadge,
              isCompleto ? styles.statusBadgeCompleto : styles.statusBadgePendente
            ]}>
              <Text style={[
                styles.statusBadgeText,
                isCompleto ? styles.statusBadgeTextCompleto : styles.statusBadgeTextPendente
              ]}>
                {gruposSelecionados} grupo(s) selecionado(s)
              </Text>
            </View>
          </View>

          {gruposSelecionados > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => limparTreino(treino.id)}
            >
              <Ionicons name="refresh" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Grupos selecionados */}
        {treino.gruposMusculares.length > 0 && (
          <View style={styles.gruposSelecionados}>
            <Text style={styles.selecionadosLabel}>Selecionados:</Text>
            <View style={styles.selecionadosTags}>
              {treino.gruposMusculares
                .filter(grupo => grupo && typeof grupo === 'string' && grupo.trim() && grupo.trim() !== '.' && grupo.trim() !== '')
                .map(grupo => (
                <View key={grupo} style={styles.grupoTag}>
                  <Text style={styles.grupoTagText}>{grupo}</Text>
                  <TouchableOpacity
                    onPress={() => toggleGrupoMuscular(treino.id, grupo)}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                  >
                    <Ionicons name="close" size={14} color="#3B82F6" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Grid de grupos musculares */}
        <View style={styles.gruposContainer}>
          <Text style={styles.gruposLabel}>Grupos Musculares:</Text>
          <View style={styles.gruposGrid}>
            {GRUPOS_MUSCULARES.map(grupo => {
              const isSelected = treino.gruposMusculares.includes(grupo);
              
              return (
                <TouchableOpacity
                  key={grupo}
                  style={[
                    styles.grupoButton,
                    isSelected && styles.grupoButtonSelected
                  ]}
                  onPress={() => toggleGrupoMuscular(treino.id, grupo)}
                >
                  <Text style={[
                    styles.grupoButtonText,
                    isSelected && styles.grupoButtonTextSelected
                  ]}>
                    {grupo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // INFO DE REQUISITOS
  const renderRequisitos = () => (
    <View style={styles.requisitosCard}>
      <View style={styles.requisitosHeader}>
        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        <Text style={styles.requisitosTitle}>Requisitos</Text>
      </View>
      
      <View style={styles.requisitosContent}>
        <Text style={styles.requisitoItem}>
          • Selecione pelo menos 1 grupo muscular por treino
        </Text>
        
        {getTreinosValidos().length > 0 && (
          <Text style={[styles.requisitoItem, styles.requisitoSucesso]}>
            ✓ {getTreinosValidos().length} de {treinos.length} treino(s) configurado(s)
          </Text>
        )}

        {getTotalGruposMusculares() > 0 && (
          <Text style={[styles.requisitoItem, styles.requisitoInfo]}>
            📊 {getTotalGruposMusculares()} grupo(s) muscular(es) total
          </Text>
        )}
      </View>
    </View>
  );

  // Loading state
  if (!configSalva?.nomeRotina) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando configuração...</Text>
        <TouchableOpacity 
          style={styles.voltarConfigButton}
          onPress={() => router.replace('/criar-rotina/configuracao')}
        >
          <Text style={styles.voltarConfigText}>Voltar para Configuração</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER COM PROGRESSO */}
      <RotinaProgressHeader
        title="Configuração de Treinos"
        subtitle={`${configSalva?.treinosPorSemana} treinos por semana`}
        alunoId={configSalva?.alunoId}
        showExitButton={true}
      />

      {/* CONTEÚDO PRINCIPAL */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info da rotina */}
        <View style={styles.rotinaInfo}>
          <Ionicons name="information-circle" size={20} color="#A11E0A" />
          <View style={styles.rotinaInfoText}>
            <Text style={styles.rotinaInfoTitle}>{configSalva?.nomeRotina}</Text>
            <Text style={styles.rotinaInfoSubtitle}>
              {configSalva?.dificuldade} • {configSalva?.treinosPorSemana}x por semana
            </Text>
          </View>
        </View>

        {/* Requisitos */}
        {renderRequisitos()}

        {/* Cards dos treinos */}
        {Array.isArray(treinos) && treinos.length > 0 && treinos.map(treino => renderTreinoCard(treino))}

        {/* BOTÕES NO FINAL */}
        <View style={styles.bottomActionsInScroll}>
          <TouchableOpacity 
            style={styles.previousButton}
            onPress={handlePrevious}
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
            <Text style={styles.previousButtonText}>Voltar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.nextButton,
              !isFormValid() && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={!isFormValid() || loading}
          >
            <Text style={[
              styles.nextButtonText,
              !isFormValid() && styles.nextButtonTextDisabled
            ]}>
              {loading ? 'Salvando...' : 'Configurar Exercícios'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  voltarConfigButton: {
    backgroundColor: '#A11E0A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  voltarConfigText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  rotinaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#A11E0A',
    gap: 12,
  },
  rotinaInfoText: {
    flex: 1,
  },
  rotinaInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  rotinaInfoSubtitle: {
    fontSize: 14,
    color: '#3B82F6',
    marginTop: 2,
  },
  requisitosCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  requisitosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  requisitosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  requisitosContent: {
    gap: 6,
  },
  requisitoItem: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  requisitoSucesso: {
    color: '#059669',
    fontWeight: '500',
  },
  requisitoInfo: {
    color: '#1D4ED8',
    fontWeight: '500',
  },
  treinoCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  treinoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  treinoTitleContainer: {
    flex: 1,
  },
  treinoNome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  clearButton: {
    padding: 8,
    marginLeft: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeCompleto: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgePendente: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadgeTextCompleto: {
    color: '#065F46',
  },
  statusBadgeTextPendente: {
    color: '#92400E',
  },
  gruposSelecionados: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  selecionadosLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selecionadosTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  grupoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  grupoTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E40AF',
  },
  gruposContainer: {
    marginTop: 8,
  },
  gruposLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  gruposGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  grupoButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  grupoButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  grupoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  grupoButtonTextSelected: {
    color: 'white',
  },
  bottomActionsInScroll: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  previousButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#A11E0A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonTextDisabled: {
    color: '#9CA3AF',
  },
  bottomSpacing: {
    height: 20,
  },
});

// components/PlanosModal.tsx - VERSÃO COM UPGRADES VÁLIDOS
import { Check, Crown, X, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

interface Plano {
  id: string;
  nome: string;
  preco: number;
  limite_alunos: number | null;
  limite_exercicios: number;
  ativo: boolean;
}

interface PlanosModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string) => void;
  planoAtual?: string; // ✅ NOVO: Plano atual do usuário
}

export const PlanosModal: React.FC<PlanosModalProps> = ({
  visible,
  onClose,
  onSelectPlan,
  planoAtual = 'gratuito' // ✅ Default para gratuito
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [planosValidos, setPlanosValidos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ BUSCAR PLANOS REAIS DO BANCO
  const fetchPlanos = async () => {
    try {
      console.log('🔍 [PlanosModal] Buscando planos...');
      
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .eq('ativo', true)
        .order('preco');

      if (error) {
        console.error('❌ Erro ao buscar planos:', error);
        return;
      }

      console.log('✅ Planos encontrados:', data);
      
      // ✅ FILTRAR APENAS UPGRADES VÁLIDOS
      const planoAtualData = data?.find(p => p.id === planoAtual);
      const precoAtual = planoAtualData?.preco || 0;
      
      const upgradesValidos = data?.filter(plano => plano.preco > precoAtual) || [];
      
      console.log(`💰 Plano atual: ${planoAtual} (R$ ${precoAtual})`);
      console.log(`⬆️ Upgrades válidos: ${upgradesValidos.map(p => p.nome).join(', ')}`);
      
      setPlanosValidos(upgradesValidos);
      
      // ✅ AUTO-SELECIONAR primeiro upgrade válido
      if (upgradesValidos.length > 0) {
        // Priorizar "essencial" se disponível, senão o primeiro
        const planoEssencial = upgradesValidos.find(p => p.id === 'essencial');
        setSelectedPlan(planoEssencial ? 'essencial' : upgradesValidos[0].id);
      }
      
    } catch (error) {
      console.error('💥 Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CARREGAR dados quando modal abrir
  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchPlanos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, planoAtual]); // fetchPlanos é definida dentro do useEffect

  // ✅ FORMATAR PREÇO
  const formatPrice = (preco: number) => {
    return preco === 0 ? 'Grátis' : `R$ ${preco.toFixed(2).replace('.', ',')}`;
  };

  // ✅ FORMATAR LIMITE
  const formatLimit = (limite: number | null) => {
    return limite === null || limite === -1 ? 'ilimitado' : limite.toString();
  };
  const getPlanInfo = (plano: Plano) => {
    const isPopular = plano.id === 'essencial'; // Plano do meio = popular
    
    return {
      isPopular,
      savings: isPopular ? 'Recomendado' : null
    };
  };

  const handleSelectPlan = () => {
    if (selectedPlan) {
      console.log('✅ Plano selecionado para upgrade:', selectedPlan);
      onSelectPlan(selectedPlan);
      onClose();
    }
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>Carregando planos...</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Crown size={48} color="#F59E0B" />
      <Text style={styles.emptyTitle}>Parabéns!</Text>
      <Text style={styles.emptyText}>
        Você já está no melhor plano disponível. 🎉
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessible={false}
      importantForAccessibility="no"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Fazer Upgrade</Text>
              <Text style={styles.subtitle}>
                Plano atual: {planoAtual.charAt(0).toUpperCase() + planoAtual.slice(1)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              renderLoadingState()
            ) : planosValidos.length === 0 ? (
              renderEmptyState()
            ) : (
              <>
                <View style={styles.upgradeInfo}>
                  <Text style={styles.upgradeText}>
                    ⬆️ Escolha seu novo plano para ter mais recursos:
                  </Text>
                </View>

                <View style={styles.plansContainer}>
                  {planosValidos.map((plano) => {
                    const planInfo = getPlanInfo(plano);
                    
                    return (
                      <TouchableOpacity
                        key={plano.id}
                        style={[
                          styles.planCard,
                          selectedPlan === plano.id && styles.planCardSelected,
                          planInfo.isPopular && styles.planCardPopular
                        ]}
                        onPress={() => setSelectedPlan(plano.id)}
                      >
                        {planInfo.isPopular && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularText}>MAIS POPULAR</Text>
                          </View>
                        )}

                        <View style={styles.planHeader}>
                          <Text style={styles.planName}>{plano.nome}</Text>
                        </View>

                        <View style={styles.priceContainer}>
                          <Text style={styles.planPrice}>{formatPrice(plano.preco)}</Text>
                          {plano.preco > 0 && (
                            <Text style={styles.planPeriod}>/mês</Text>
                          )}
                        </View>

                        {/* ✅ MOSTRAR LIMITES REAIS */}
                        <View style={styles.limitsContainer}>
                          <Text style={styles.limitText}>
                            • {plano.limite_alunos === null || plano.limite_alunos === -1 ? 'Alunos ilimitados' : `${plano.limite_alunos} alunos`}
                          </Text>
                          <Text style={styles.limitText}>
                            • {plano.limite_exercicios === null || plano.limite_exercicios === -1 ? 'Exercícios personalizados ilimitados' : `${plano.limite_exercicios} exercícios personalizados`}
                          </Text>
                        </View>

                        <View style={styles.selectIndicator}>
                          <View style={[
                            styles.radio,
                            selectedPlan === plano.id && styles.radioSelected
                          ]}>
                            {selectedPlan === plano.id && (
                              <Check size={16} color="#FFFFFF" />
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ✅ RECURSOS GERAIS (manter alguns hardcoded para marketing) */}
                <View style={styles.featuresSection}>
                  <Text style={styles.featuresTitle}>Recursos inclusos:</Text>
                  <View style={styles.featureItem}>
                    <Zap size={18} color="#10B981" />
                    <Text style={styles.featureText}>Criação de treinos personalizados</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Zap size={18} color="#10B981" />
                    <Text style={styles.featureText}>Acompanhamento de progresso</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Zap size={18} color="#10B981" />
                    <Text style={styles.featureText}>Sistema de avaliações</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Zap size={18} color="#10B981" />
                    <Text style={styles.featureText}>Interface profissional</Text>
                  </View>
                </View>

                <View style={styles.guarantee}>
                  <Text style={styles.guaranteeText}>
                    🛡️ Garantia de 7 dias - Cancele quando quiser
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {!loading && planosValidos.length > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !selectedPlan && styles.continueButtonDisabled
                ]}
                onPress={handleSelectPlan}
                disabled={!selectedPlan}
              >
                <Text style={styles.continueButtonText}>
                  Fazer Upgrade para {planosValidos.find(p => p.id === selectedPlan)?.nome || 'plano selecionado'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  upgradeInfo: {
    padding: 20,
    paddingBottom: 0,
  },
  upgradeText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
  },
  plansContainer: {
    padding: 20,
    gap: 12,
  },
  planCard: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  planCardPopular: {
    borderColor: '#F59E0B',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  savingsBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  planPeriod: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  limitsContainer: {
    marginBottom: 16,
    gap: 4,
  },
  limitText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  guarantee: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  guaranteeText: {
    fontSize: 14,
    color: '#15803D',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
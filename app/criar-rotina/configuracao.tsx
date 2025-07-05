// app/criar-rotina/configuracao.tsx - STORAGE CENTRALIZADO
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Constants
import { DifficultyColors } from '../../constants/Colors';

// Components
import { RotinaProgressHeader } from '../../components/rotina/RotinaProgressHeader';
import { supabase } from '../../lib/supabase';

// ✅ STORAGE CENTRALIZADO
import RotinaStorage, { RotinaConfig } from '../../utils/rotinaStorage';

// ✅ TIPOS LOCAIS (sem Context)
type DificuldadeRotina = 'Baixa' | 'Média' | 'Alta';

export default function ConfiguracaoRotinaScreen() {
  const router = useRouter();
  const { alunoId } = useLocalSearchParams<{ alunoId?: string }>();

  // ✅ FUNÇÃO PARA ALTERAR TREINOS POR SEMANA E RESETAR DURAÇÃO PERSONALIZADA
  const handleTreinosPorSemanaChange = (novoValor: number) => {
    console.log('🔄 Alterando treinos por semana:', treinosPorSemana, '->', novoValor);
    
    // Se estava usando duração personalizada, resetar para o padrão
    if (usandoPersonalizada) {
      console.log('🔄 Resetando duração personalizada para padrão (12 semanas)');
      setDuracaoPersonalizada('');
      setUsandoPersonalizada(false);
      setDuracaoSemanas(getDefaultDuracao());
    }
    
    setTreinosPorSemana(novoValor);
  };

  // ✅ FUNÇÃO PARA DEFAULT FIXO DE DURAÇÃO (SEMPRE 12 SEMANAS)
  const getDefaultDuracao = (): number => {
    return 12; // Sempre 12 semanas como padrão
  };

  // ✅ BUSCAR NOME DO ALUNO PARA SUGESTÃO AUTOMÁTICA
  const [alunoNome, setAlunoNome] = useState<string>('');

  // ✅ ESTADOS LOCAIS - INICIALIZADOS COM STORAGE CENTRALIZADO
  const configSalva = RotinaStorage.getConfig();
  
  const [nomeRotina, setNomeRotina] = useState(() => {
    return configSalva?.nomeRotina || '';
  });
  const [descricao, setDescricao] = useState(() => {
    return configSalva?.descricao || '';
  });
  const [treinosPorSemana, setTreinosPorSemana] = useState(() => {
    return configSalva?.treinosPorSemana || 3;
  });
  const [dificuldade, setDificuldade] = useState<DificuldadeRotina>(() => {
    return configSalva?.dificuldade || 'Média';
  });
  const [duracaoSemanas, setDuracaoSemanas] = useState(() => {
    return configSalva?.duracaoSemanas || getDefaultDuracao();
  });
  const [duracaoPersonalizada, setDuracaoPersonalizada] = useState('');
  const [usandoPersonalizada, setUsandoPersonalizada] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ NOVO: Inicializar campos de duração personalizada com base na duração salva
  useEffect(() => {
    if (configSalva?.duracaoSemanas) {
      const duracaoSalva = configSalva.duracaoSemanas;
      const duracoesPadrao = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      
      // Se a duração salva não está nos botões padrão, é personalizada
      if (!duracoesPadrao.includes(duracaoSalva)) {
        setDuracaoPersonalizada(duracaoSalva.toString());
        setUsandoPersonalizada(true);
        console.log('🔄 Duração personalizada detectada:', duracaoSalva);
      } else {
        setDuracaoPersonalizada('');
        setUsandoPersonalizada(false);
      }
    }
  }, [configSalva?.duracaoSemanas]);

  // Buscar dados do aluno se alunoId estiver presente
  useEffect(() => {
    const fetchAlunoData = async () => {
      if (!alunoId) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: aluno, error } = await supabase
          .from('alunos')
          .select('nome_completo')
          .eq('id', alunoId)
          .eq('personal_trainer_id', user.id)
          .single();

        if (!error && aluno) {
          setAlunoNome(aluno.nome_completo);
          
          // ✅ GERAR SUGESTÃO AUTOMÁTICA DE NOME (só se não tem nome salvo)
          if (!configSalva?.nomeRotina) {
            const agora = new Date();
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const mesAtual = meses[agora.getMonth()];
            const anoAtual = agora.getFullYear();
            
            const sugestaoNome = `Rotina ${aluno.nome_completo} - ${mesAtual}/${anoAtual}`;
            setNomeRotina(sugestaoNome);
            
            console.log('✅ Sugestão de nome gerada:', sugestaoNome);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do aluno:', error);
      }
    };

    fetchAlunoData();
  }, [alunoId, configSalva?.nomeRotina]);

  // ✅ ATUALIZAR DURAÇÃO QUANDO TREINOS/SEMANA MUDAR - REMOVIDO
  // Agora a duração é sempre 12 semanas por padrão, independente dos treinos

  // OPÇÕES DE CONFIGURAÇÃO - DROPDOWN SIMPLES PARA TREINOS POR SEMANA
  const treinosPorSemanaOptions = [
    { value: 1, label: '1x por semana' },
    { value: 2, label: '2x por semana' },
    { value: 3, label: '3x por semana' },
    { value: 4, label: '4x por semana' },
    { value: 5, label: '5x por semana' },
    { value: 6, label: '6x por semana' }
  ];

  const dificuldadeOptions: { value: DificuldadeRotina; label: string; subtitle: string; color: string }[] = [
    { 
      value: 'Baixa', 
      label: 'Baixa', 
      subtitle: 'Exercícios básicos, técnica simples',
      color: DifficultyColors.Baixa
    },
    { 
      value: 'Média', 
      label: 'Média', 
      subtitle: 'Exercícios intermediários, técnica moderada',
      color: DifficultyColors.Média
    },
    { 
      value: 'Alta', 
      label: 'Alta', 
      subtitle: 'Exercícios avançados, técnica complexa',
      color: DifficultyColors.Alta
    }
  ];

  // ✅ VALIDAÇÃO MELHORADA - PERMITINDO 1-3 SEMANAS
  const getValidationErrors = () => {
    const errors: string[] = [];
    
    if (nomeRotina.trim().length === 0) {
      errors.push('Nome da rotina é obrigatório');
    }
    
    if (nomeRotina.trim().length > 0 && nomeRotina.trim().length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }
    
    if (treinosPorSemana < 1 || treinosPorSemana > 6) {
      errors.push('Selecione entre 1 e 6 treinos por semana');
    }
    
    if (duracaoSemanas < 1 || duracaoSemanas > 52) {
      errors.push('Duração deve ser entre 1 e 52 semanas');
    }
    
    return errors;
  };

  const isFormValid = () => {
    return getValidationErrors().length === 0;
  };

  // ✅ HANDLER PARA PRÓXIMO PASSO - VERSÃO SESSIONSTORAGE
  const handleNext = async () => {
    console.log('=== INICIANDO HANDLE NEXT ===');
    
    const errors = getValidationErrors();
    if (errors.length > 0) {
      Alert.alert('Dados incompletos', errors[0]);
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Salvando configuração no SessionStorage...');
      
      // ✅ SALVAR NO STORAGE CENTRALIZADO
      const configCompleta: RotinaConfig = {
        nomeRotina: nomeRotina.trim(),
        descricao: descricao.trim(),
        treinosPorSemana,
        dificuldade,
        duracaoSemanas,
        alunoId: alunoId || ''
      };

      RotinaStorage.saveConfig(configCompleta);
      
      // ✅ NAVEGAÇÃO SIMPLES - SEM PARAMS
      router.push('/criar-rotina/treinos');
      console.log('🚀 Navegação executada');

    } catch (error) {
      console.error('❌ Erro ao salvar configuração:', error);
      Alert.alert('Erro', 'Não foi possível salvar a configuração');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* HEADER COM PROGRESSO */}
      <RotinaProgressHeader
        title="Configuração da Rotina"
        subtitle="Defina as informações básicas"
        alunoId={alunoId}
      />

      {/* CONTEÚDO PRINCIPAL */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ✅ NOME DA ROTINA - COM SUGESTÃO AUTOMÁTICA MAS AINDA OBRIGATÓRIO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Nome da Rotina <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            value={nomeRotina}
            onChangeText={setNomeRotina}
            placeholder={alunoNome ? `Rotina ${alunoNome} - ${new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}` : "Digite o nome da rotina"}
            placeholderTextColor="#9CA3AF"
            maxLength={50}
            autoFocus={false}
          />
          <View style={styles.inputInfo}>
            <Text style={styles.inputHint}>
              {alunoNome 
                ? 'Nome gerado automaticamente, mas você pode editar'
                : 'Escolha um nome descritivo para identificar esta rotina'
              }
            </Text>
            <Text style={styles.characterCount}>
              {(nomeRotina || '').length} de 50
            </Text>
          </View>
        </View>

        {/* Descrição (Opcional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Descrição <Text style={styles.optional}>(Opcional)</Text>
          </Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Descreva os objetivos e características desta rotina"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={200}
          />
          <View style={styles.inputInfo}>
            <Text style={styles.inputHint}>
              Informações adicionais sobre a rotina
            </Text>
            <Text style={styles.characterCount}>
              {(descricao || '').length} de 200
            </Text>
          </View>
        </View>

        {/* Treinos por Semana - DROPDOWN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Treinos por Semana <Text style={styles.required}>*</Text>
          </Text>
          
          {/* Grid de opções de treinos por semana */}
          <View style={styles.optionsGrid}>
            {treinosPorSemanaOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  treinosPorSemana === option.value && styles.optionCardSelected
                ]}
                onPress={() => handleTreinosPorSemanaChange(option.value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.optionCardText,
                  treinosPorSemana === option.value && styles.optionCardTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ✅ NOVA SEÇÃO: DURAÇÃO SIMPLIFICADA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Duração da Rotina <Text style={styles.required}>*</Text>
          </Text>
          
          <Text style={styles.subsectionTitle}>Duração em semanas</Text>

          {/* Grid de opções rápidas */}
          <View style={styles.duracaoGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((semanas) => (
              <TouchableOpacity
                key={semanas}
                style={[
                  styles.duracaoCard,
                  duracaoSemanas === semanas && !usandoPersonalizada && styles.duracaoCardSelected
                ]}
                onPress={() => {
                  setDuracaoSemanas(semanas);
                  setUsandoPersonalizada(false);
                  setDuracaoPersonalizada('');
                }}
              >
                <Text style={[
                  styles.duracaoCardText,
                  duracaoSemanas === semanas && !usandoPersonalizada && styles.duracaoCardTextSelected
                ]}>
                  {semanas}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Campo personalizado */}
          <View style={styles.duracaoPersonalizadaContainer}>
            <Text style={styles.duracaoPersonalizadaLabel}>
              Duração personalizada (1-52 semanas)
            </Text>
            <TextInput
              style={[
                styles.duracaoPersonalizadaInput,
                usandoPersonalizada && styles.duracaoPersonalizadaInputActive
              ]}
              value={duracaoPersonalizada}
              onChangeText={(text) => {
                setDuracaoPersonalizada(text);
                const numero = parseInt(text);
                if (numero >= 1 && numero <= 52) {
                  setDuracaoSemanas(numero);
                  setUsandoPersonalizada(true);
                } else if (text === '') {
                  setUsandoPersonalizada(false);
                }
              }}
              onFocus={() => setUsandoPersonalizada(true)}
              onBlur={() => {
                if (duracaoPersonalizada === '') {
                  setUsandoPersonalizada(false);
                }
              }}
              placeholder="Digite o número de semanas"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.duracaoPersonalizadaHint}>
              Use este campo para duração específica não disponível nos botões acima
            </Text>
          </View>
        </View>

        {/* Dificuldade */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Dificuldade <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.dificuldadeContainer}>
            {dificuldadeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dificuldadeOption,
                  dificuldade === option.value && styles.dificuldadeOptionSelected,
                  dificuldade === option.value && { borderColor: option.color }
                ]}
                onPress={() => setDificuldade(option.value)}
              >
                <View style={[
                  styles.dificuldadeBadge,
                  { backgroundColor: option.color }
                ]}>
                  <Text style={styles.dificuldadeBadgeText}>{option.label}</Text>
                </View>
                <View style={styles.dificuldadeInfo}>
                  <Text style={[
                    styles.dificuldadeLabel,
                    dificuldade === option.value && styles.dificuldadeLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.dificuldadeSubtitle}>
                    {option.subtitle}
                  </Text>
                </View>
                {dificuldade === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color={option.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ✅ BOTÃO MOVIDO PARA DENTRO DO SCROLL - NO FINAL */}
        <View style={styles.bottomActionsInScroll}>
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
              {loading ? 'Salvando...' : 'Configurar Treinos'}
            </Text>
          </TouchableOpacity>
          
          {/* ✅ MENSAGENS DE ERRO ESPECÍFICAS */}
          {!isFormValid() && (
            <View style={styles.errorMessage}>
              <Text style={styles.errorText}>
                {getValidationErrors()[0]}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  
  // SEÇÕES
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  required: {
    color: '#EF4444',
    fontSize: 16,
  },
  optional: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  
  // INPUTS LIMPOS
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  
  // DROPDOWN STYLES
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownContainerOpen: {
    borderColor: '#007AFF',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownOptions: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownOption: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionSelected: {
    backgroundColor: '#F0F9FF',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  
  // OPÇÕES EM GRID
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionCard: {
    flex: 1,
    minWidth: '48%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: '#007AFF',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  optionSubtitleSelected: {
    color: '#1E40AF',
  },
  optionCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  optionCardTextSelected: {
    color: '#007AFF',
  },
  optionCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  
  // DURAÇÃO
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 16,
  },
  duracaoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  duracaoCard: {
    width: '22%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duracaoCardSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  duracaoCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  duracaoCardTextSelected: {
    color: 'white',
  },
  duracaoPersonalizadaContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 20,
  },
  duracaoPersonalizadaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  duracaoPersonalizadaInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: 'white',
    marginBottom: 6,
  },
  duracaoPersonalizadaInputActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  duracaoPersonalizadaHint: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  
  // DIFICULDADE
  dificuldadeContainer: {
    gap: 12,
  },
  dificuldadeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  dificuldadeOptionSelected: {
    backgroundColor: '#F9FAFB',
  },
  dificuldadeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dificuldadeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dificuldadeInfo: {
    flex: 1,
  },
  dificuldadeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  dificuldadeLabelSelected: {
    color: '#1F2937',
  },
  dificuldadeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // BOTÕES
  bottomActionsInScroll: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  nextButton: {
    backgroundColor: '#007AFF',
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
  errorMessage: {
    marginTop: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
});
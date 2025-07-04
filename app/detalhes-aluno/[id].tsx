// app/detalhes-aluno/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import LoadingScreen from '../../components/LoadingScreen';
import { supabase } from '../../lib/supabase';
// ✅ IMPORTAÇÕES DAS CONSTANTES E TIPOS
import {
    FREQUENCIAS_TREINO,
    NIVEIS_EXPERIENCIA_ALUNO,
    OBJETIVOS,
    type FrequenciaTreino,
    type NivelExperienciaAluno,
    type Objetivo
} from '../../constants/usuarios';

// ✅ INTERFACE ATUALIZADA COM TIPOS FORTES
interface AlunoData {
    nomeCompleto: string; // Read-only
    email: string; // Read-only
    genero: string; // Read-only
    dataNascimento: string; // Read-only
    telefone: string; // Read-only
    contatoEmergenciaNome: string; // Read-only
    contatoEmergenciaTelefone: string; // Read-only
    objetivoPrincipal: Objetivo | '';
    nivelExperiencia: NivelExperienciaAluno | '';
    frequenciaTreinoDesejada: FrequenciaTreino | '';
}

export default function DetalhesAluno() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'aluno' | 'rotina'>('aluno');
    const [showObjetivoOptions, setShowObjetivoOptions] = useState(false);
    const [showExperienciaOptions, setShowExperienciaOptions] = useState(false);
    const [showFrequenciaOptions, setShowFrequenciaOptions] = useState(false);

    const [data, setData] = useState<AlunoData>({
        nomeCompleto: '',
        email: '',
        genero: '',
        dataNascimento: '',
        telefone: '',
        contatoEmergenciaNome: '',
        contatoEmergenciaTelefone: '',
        objetivoPrincipal: '',
        nivelExperiencia: '',
        frequenciaTreinoDesejada: ''
    });

    // ✅ USANDO CONSTANTES CENTRALIZADAS
    const objetivoOptions = OBJETIVOS;
    const experienciaOptions = NIVEIS_EXPERIENCIA_ALUNO;
    const frequenciaOptions = FREQUENCIAS_TREINO;


    // Carregar dados do aluno
    useEffect(() => {
        const loadAlunoData = async () => {
            if (!id) {
                Alert.alert('Erro', 'ID do aluno não encontrado');
                router.back();
                return;
            }

            try {
                console.log('🔍 [DetalhesAluno] Carregando dados do aluno:', id);

                const { data: alunoData, error } = await supabase
                    .from('alunos')
                    .select(`
                        nome_completo,
                        email,
                        genero,
                        data_nascimento,
                        telefone,
                        contato_emergencia_nome,
                        contato_emergencia_telefone,
                        objetivo_principal,
                        nivel_experiencia,
                        frequencia_desejada
                    `)
                    .eq('id', id)
                    .single();

                if (error) {
                    console.error('❌ [DetalhesAluno] Erro ao carregar aluno:', error);
                    Alert.alert('Erro', 'Não foi possível carregar os dados do aluno');
                    router.back();
                    return;
                }

                if (!alunoData) {
                    Alert.alert('Erro', 'Aluno não encontrado');
                    router.back();
                    return;
                }

                console.log('✅ [DetalhesAluno] Dados carregados:', alunoData);

                // Preencher formulário
                setData({
                    nomeCompleto: alunoData.nome_completo || '',
                    email: alunoData.email || '',
                    genero: alunoData.genero || '',
                    dataNascimento: alunoData.data_nascimento || '',
                    telefone: alunoData.telefone || '',
                    contatoEmergenciaNome: alunoData.contato_emergencia_nome || '',
                    contatoEmergenciaTelefone: alunoData.contato_emergencia_telefone || '',
                    objetivoPrincipal: alunoData.objetivo_principal || '',
                    nivelExperiencia: alunoData.nivel_experiencia || '',
                    frequenciaTreinoDesejada: alunoData.frequencia_desejada || ''
                });

                // Se há data de nascimento, converter formato americano para brasileiro
                if (alunoData.data_nascimento) {
                    let formattedDate = alunoData.data_nascimento;

                    // Se está no formato americano (YYYY-MM-DD), converter para brasileiro (DD/MM/YYYY)
                    if (alunoData.data_nascimento.includes('-')) {
                        const [year, month, day] = alunoData.data_nascimento.split('-');
                        formattedDate = `${day}/${month}/${year}`;
                    }

                    // Atualizar dados com data formatada
                    setData(prev => ({
                        ...prev,
                        dataNascimento: formattedDate
                    }));
                }

            } catch (error) {
                console.error('💥 [DetalhesAluno] Erro inesperado:', error);
                Alert.alert('Erro', 'Erro inesperado ao carregar dados');
                router.back();
            } finally {
                setLoading(false);
            }
        };

        loadAlunoData();
    }, [id]);

    const updateData = (field: keyof AlunoData, value: string) => {
        setData({ ...data, [field]: value });
    };

    const salvarAlteracoes = async () => {
        if (!data.objetivoPrincipal || !data.nivelExperiencia || !data.frequenciaTreinoDesejada) {
            Alert.alert('Erro', 'Objetivo, nível de experiência e frequência são obrigatórios');
            return;
        }

        setSaving(true);
        try {
            console.log('💾 [DetalhesAluno] Salvando alterações para:', id);

            const updateDataPayload = {
                objetivo_principal: data.objetivoPrincipal,
                nivel_experiencia: data.nivelExperiencia,
                frequencia_desejada: data.frequenciaTreinoDesejada
            };

            const { error } = await supabase
                .from('alunos')
                .update(updateDataPayload)
                .eq('id', id);

            if (error) {
                console.error('❌ [DetalhesAluno] Erro ao salvar:', error);
                Alert.alert('Erro', 'Não foi possível salvar as alterações');
                return;
            }

            console.log('✅ [DetalhesAluno] Alterações salvas com sucesso');
            Alert.alert('Sucesso', 'Alterações salvas com sucesso!', [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (error) {
            console.error('💥 [DetalhesAluno] Erro inesperado:', error);
            Alert.alert('Erro', 'Erro inesperado ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const renderAlunoTab = () => (
        <View style={styles.content}>
            <Text style={styles.sectionTitle}>Aluno</Text>
            <Text style={styles.sectionDescription}>
                Os dados pessoais podem ser alterados pelo próprio aluno.
            </Text>

            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={data.nomeCompleto}
                editable={false}
                placeholder="Nome não cadastrado"
            />

            <View style={styles.row}>
                <View style={styles.halfWidth}>
                    <Text style={styles.label}>Gênero</Text>
                    <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        value={data.genero}
                        editable={false}
                        placeholder="Não informado"
                    />
                </View>

                <View style={styles.halfWidth}>
                    <Text style={styles.label}>Data de Nascimento</Text>
                    <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        value={data.dataNascimento}
                        editable={false}
                        placeholder="Não informado"
                    />
                </View>
            </View>

            <Text style={styles.sectionTitle}>Contato</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={data.email}
                editable={false}
                placeholder="Email não cadastrado"
            />

            <Text style={styles.label}>Telefone</Text>
            <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={data.telefone}
                editable={false}
                placeholder="Telefone não cadastrado"
            />

            <Text style={styles.sectionTitle}>Contato de Emergência</Text>

            <Text style={styles.label}>Nome do Contato</Text>
            <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={data.contatoEmergenciaNome}
                editable={false}
                placeholder="Contato não cadastrado"
            />

            <Text style={styles.label}>Telefone de Emergência</Text>
            <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={data.contatoEmergenciaTelefone}
                editable={false}
                placeholder="Telefone não cadastrado"
            />
        </View>
    );

    const renderRotinaTab = () => (
        <View style={styles.content}>
            <Text style={styles.sectionTitle}>Rotina</Text>

            <Text style={styles.label}>Objetivo Principal *</Text>
            <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                    setShowObjetivoOptions(!showObjetivoOptions);
                    setShowExperienciaOptions(false);
                    setShowFrequenciaOptions(false);
                }}
            >
                <Text style={[styles.selectText, !data.objetivoPrincipal && styles.placeholderText]}>
                    {data.objetivoPrincipal || 'Selecione o objetivo principal'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
            </TouchableOpacity>

            {showObjetivoOptions && (
                <View style={styles.optionsDropdown}>
                    <ScrollView style={styles.optionsScroll} nestedScrollEnabled={true}>
                        {objetivoOptions.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.dropdownItem}
                                onPress={() => {
                                    updateData('objetivoPrincipal', option);
                                    setShowObjetivoOptions(false);
                                }}
                            >
                                <Text style={styles.dropdownItemText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <Text style={styles.label}>Nível de Experiência *</Text>
            <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                    setShowExperienciaOptions(!showExperienciaOptions);
                    setShowObjetivoOptions(false);
                    setShowFrequenciaOptions(false);
                }}
            >
                <Text style={[styles.selectText, !data.nivelExperiencia && styles.placeholderText]}>
                    {data.nivelExperiencia || 'Selecione o nível de experiência'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
            </TouchableOpacity>

            {showExperienciaOptions && (
                <View style={styles.optionsDropdown}>
                    <ScrollView style={styles.optionsScroll} nestedScrollEnabled={true}>
                        {experienciaOptions.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.dropdownItem}
                                onPress={() => {
                                    updateData('nivelExperiencia', option);
                                    setShowExperienciaOptions(false);
                                }}
                            >
                                <Text style={styles.dropdownItemText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <Text style={styles.label}>Frequência de Treino *</Text>
            <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                    setShowFrequenciaOptions(!showFrequenciaOptions);
                    setShowObjetivoOptions(false);
                    setShowExperienciaOptions(false);
                }}
            >
                <Text style={[styles.selectText, !data.frequenciaTreinoDesejada && styles.placeholderText]}>
                    {data.frequenciaTreinoDesejada || 'Selecione a frequência semanal'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
            </TouchableOpacity>

            {showFrequenciaOptions && (
                <View style={styles.optionsDropdown}>
                    <ScrollView style={styles.optionsScroll} nestedScrollEnabled={true}>
                        {frequenciaOptions.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.dropdownItem}
                                onPress={() => {
                                    updateData('frequenciaTreinoDesejada', option);
                                    setShowFrequenciaOptions(false);
                                }}
                            >
                                <Text style={styles.dropdownItemText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );

    if (loading) {
        return <LoadingScreen message="Carregando dados do aluno..." />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.push('/(tabs)/alunos')}
                >
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.title}>Detalhes do Aluno</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Abas */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'aluno' && styles.activeTab]}
                    onPress={() => {
                        setActiveTab('aluno');
                        // Fechar todos os dropdowns ao trocar de aba
                        setShowObjetivoOptions(false);
                        setShowExperienciaOptions(false);
                        setShowFrequenciaOptions(false);
                    }}
                >
                    <Text style={[styles.tabText, activeTab === 'aluno' && styles.activeTabText]}>
                        Aluno
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'rotina' && styles.activeTab]}
                    onPress={() => {
                        setActiveTab('rotina');
                        // Fechar todos os dropdowns ao trocar de aba
                        setShowObjetivoOptions(false);
                        setShowExperienciaOptions(false);
                        setShowFrequenciaOptions(false);
                    }}
                >
                    <Text style={[styles.tabText, activeTab === 'rotina' && styles.activeTabText]}>
                        Rotina
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {activeTab === 'aluno' ? renderAlunoTab() : renderRotinaTab()}
            </ScrollView>

            {/* Footer só aparece na aba Rotina */}
            {activeTab === 'rotina' && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.cancelButtonFooter}
                        onPress={() => router.push('/(tabs)/alunos')}
                    >
                        <Text style={styles.cancelButtonFooterText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={salvarAlteracoes}
                        disabled={saving}
                    >
                        <Text style={styles.saveButtonText}>
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
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
    placeholder: {
        width: 32,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#007AFF',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#007AFF',
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        marginTop: 20,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#EF4444',
        marginBottom: 16,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        backgroundColor: 'white',
    },
    inputDisabled: {
        backgroundColor: '#F9FAFB',
        color: '#6B7280',
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'white',
    },
    selectText: {
        fontSize: 16,
        color: '#1F2937',
    },
    placeholderText: {
        color: '#9CA3AF',
    },
    optionsDropdown: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        backgroundColor: 'white',
        marginTop: 4,
        overflow: 'hidden',
        maxHeight: 200,
        zIndex: 1000,
    },
    optionsScroll: {
        maxHeight: 160,
    },
    dropdownItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#1F2937',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
    },
    cancelButtonFooter: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        alignItems: 'center',
    },
    cancelButtonFooterText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    saveButton: {
        flex: 2,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#007AFF',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    saveButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: '600',
    },
});
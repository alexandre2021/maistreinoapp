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
import {
    type FrequenciaTreino,
    type NivelExperienciaAluno,
    type Objetivo
} from '../../constants/usuarios';
import { supabase } from '../../lib/supabase';

interface AlunoData {
    nomeCompleto: string;
    email: string;
    genero: string;
    dataNascimento: string;
    telefone: string;
    contatoEmergenciaNome: string;
    contatoEmergenciaTelefone: string;
    objetivoPrincipal: Objetivo | '';
    nivelExperiencia: NivelExperienciaAluno | '';
    frequenciaTreinoDesejada: FrequenciaTreino | '';
    dataOnboarding?: string; // Nova prop para exibir a data do onboarding
}

export default function DetalhesAluno() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
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
        frequenciaTreinoDesejada: '',
        dataOnboarding: '',
    });

    useEffect(() => {
        const loadAlunoData = async () => {
            if (!id) {
                Alert.alert('Erro', 'ID do aluno não encontrado');
                router.back();
                return;
            }
            try {
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
                        frequencia_desejada,
                        created_at
                    `)
                    .eq('id', id)
                    .single();
                if (error) {
                    Alert.alert('Erro', 'Não foi possível carregar os dados do aluno');
                    router.back();
                    return;
                }
                if (!alunoData) {
                    Alert.alert('Erro', 'Aluno não encontrado');
                    router.back();
                    return;
                }
                // Formatar datas
                let formattedNascimento = alunoData.data_nascimento || '';
                if (alunoData.data_nascimento && alunoData.data_nascimento.includes('-')) {
                    const [year, month, day] = alunoData.data_nascimento.split('-');
                    formattedNascimento = `${day}/${month}/${year}`;
                }
                let formattedOnboarding = '';
                if (alunoData.created_at && alunoData.created_at.includes('-')) {
                    const [year, month, day] = alunoData.created_at.split('T')[0].split('-');
                    formattedOnboarding = `${day}/${month}/${year}`;
                }
                setData({
                    nomeCompleto: alunoData.nome_completo || '',
                    email: alunoData.email || '',
                    genero: alunoData.genero || '',
                    dataNascimento: formattedNascimento,
                    telefone: alunoData.telefone || '',
                    contatoEmergenciaNome: alunoData.contato_emergencia_nome || '',
                    contatoEmergenciaTelefone: alunoData.contato_emergencia_telefone || '',
                    objetivoPrincipal: alunoData.objetivo_principal || '',
                    nivelExperiencia: alunoData.nivel_experiencia || '',
                    frequenciaTreinoDesejada: alunoData.frequencia_desejada || '',
                    dataOnboarding: formattedOnboarding,
                });
            } catch {
                Alert.alert('Erro', 'Erro inesperado ao carregar dados');
                router.back();
            } finally {
                setLoading(false);
            }
        };
        loadAlunoData();
    }, [id]);

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
                <Text style={styles.title}>Detalhes</Text>
                <View style={styles.placeholder} />
            </View>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* CARD DE IDENTIFICAÇÃO DO ALUNO */}
                <View style={[styles.alunoCard, styles.alunoCardLeftBorderBlue]}>
                    <Text style={styles.alunoNome}>{data.nomeCompleto || '-'}</Text>
                    <Text style={styles.alunoEmail}>{data.email || '-'}</Text>
                </View>

                {/* CARD DE INFORMAÇÕES INICIAIS (CADASTRO) */}
                <View style={[styles.onboardingCard, styles.onboardingCardLeftBorderYellow]}>
                    <View style={styles.onboardingHeader}>
                        <Text style={styles.onboardingTitleYellow}>Informações Iniciais</Text>
                    </View>
                    <View style={styles.onboardingInfoRow}>
                        <Text style={styles.onboardingLabelYellow}>Data do Cadastro:</Text>
                        <Text style={styles.onboardingValueYellow}>{data.dataOnboarding || '-'}</Text>
                    </View>
                    <View style={styles.onboardingInfoRow}>
                        <Text style={styles.onboardingLabelYellow}>Objetivo:</Text>
                        <Text style={styles.onboardingValueYellow}>{data.objetivoPrincipal || '-'}</Text>
                    </View>
                    <View style={styles.onboardingInfoRow}>
                        <Text style={styles.onboardingLabelYellow}>Experiência:</Text>
                        <Text style={styles.onboardingValueYellow}>{data.nivelExperiencia || '-'}</Text>
                    </View>
                    <View style={styles.onboardingInfoRow}>
                        <Text style={styles.onboardingLabelYellow}>Frequência:</Text>
                        <Text style={styles.onboardingValueYellow}>{data.frequenciaTreinoDesejada || '-'}</Text>
                    </View>
                    <Text style={styles.onboardingDescriptionYellow}>
                        Essas informações são uma fotografia inicial do aluno, coletadas no cadastro e não editáveis. Servem como referência histórica para acompanhamento da evolução.
                    </Text>
                </View>

                {/* DADOS PESSOAIS */}
                <Text style={styles.sectionTitle}>Dados Pessoais</Text>
                <Text style={[styles.sectionDescription, styles.sectionDescriptionRed]}>
                    Essas informações podem ser editadas pelo próprio aluno.
                </Text>
                <View style={styles.row}>
                    <View style={[styles.halfWidth, { marginRight: 6 }]}> 
                        <Text style={styles.label}>Gênero</Text>
                        <TextInput
                            style={[styles.input, styles.inputDisabled, { marginLeft: 0, marginRight: 0 }]}
                            value={data.genero}
                            editable={false}
                            placeholder="Não informado"
                        />
                    </View>
                    <View style={[styles.halfWidth, { marginLeft: 6 }]}> 
                        <Text style={styles.label}>Data de Nascimento</Text>
                        <TextInput
                            style={[styles.input, styles.inputDisabled, { marginLeft: 0, marginRight: 0 }]}
                            value={data.dataNascimento}
                            editable={false}
                            placeholder="Não informado"
                        />
                    </View>
                </View>
                <Text style={styles.label}>Telefone</Text>
                <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={data.telefone}
                    editable={false}
                    placeholder="Telefone não cadastrado"
                />
                {/* CONTATO DE EMERGÊNCIA */}
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
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
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
    scrollView: {
        flex: 1,
    },
    alunoCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 0,
        paddingVertical: 16,
        paddingHorizontal: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    alunoCardLeftBorderBlue: {
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6', // azul igual ícone 'Ver Detalhes' na modal
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
    },
    alunoNome: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    alunoEmail: {
        fontSize: 15,
        color: '#64748B',
        fontWeight: '400',
    },
    onboardingCard: {
        backgroundColor: '#FFF9ED',
        borderWidth: 1,
        borderColor: '#F59E42',
        borderRadius: 16,
        padding: 20,
        margin: 20,
        marginBottom: 0,
        shadowColor: '#F59E42',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    onboardingCardLeftBorderBlue: {
        borderLeftWidth: 4,
        borderLeftColor: '#2563EB', // azul padrão do app
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    onboardingCardLeftBorderYellow: {
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B', // amarelo igual avaliações
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    onboardingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    onboardingTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#F59E42',
    },
    onboardingTitleYellow: {
        fontSize: 17,
        fontWeight: '700',
        color: '#92400E', // igual avaliações
    },
    onboardingInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    onboardingLabel: {
        fontSize: 15,
        color: '#A16207',
        fontWeight: '500',
    },
    onboardingLabelYellow: {
        fontSize: 15,
        color: '#92400E', // igual avaliações
        fontWeight: '500',
    },
    onboardingValue: {
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '600',
    },
    onboardingValueYellow: {
        fontSize: 15,
        color: '#92400E', // igual avaliações
        fontWeight: '600',
    },
    onboardingDescription: {
        marginTop: 12,
        fontSize: 13,
        color: '#A16207',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    onboardingDescriptionYellow: {
        marginTop: 12,
        fontSize: 13,
        color: '#92400E', // igual avaliações
        fontStyle: 'italic',
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        marginTop: 20,
        marginLeft: 20,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
        marginLeft: 20,
        marginRight: 20,
    },
    sectionDescriptionRed: {
        color: '#EF4444', // vermelho de destaque
        fontWeight: '600',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 8,
        marginTop: 16,
        marginLeft: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        backgroundColor: 'white',
        marginHorizontal: 20,
    },
    inputDisabled: {
        backgroundColor: '#F9FAFB',
        color: '#6B7280',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginHorizontal: 20,
    },
    halfWidth: {
        flex: 1,
    },
});
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
    dataOnboarding?: string;
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
                    <Ionicons name="arrow-back" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Detalhes</Text>
                <View style={styles.placeholder} />
            </View>
            <ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* CARD DE IDENTIFICAÇÃO DO ALUNO */}
                <View style={styles.alunoCard}>
                    <Text style={styles.alunoNome}>{data.nomeCompleto || '-'}</Text>
                    <Text style={styles.alunoEmail}>{data.email || '-'}</Text>
                </View>

                {/* CARD DE INFORMAÇÕES INICIAIS (CADASTRO) */}
                <View style={[styles.onboardingCard, styles.onboardingCardLeftBorderYellow]}>
                    <View style={styles.onboardingHeader}>
                        <Text style={styles.onboardingTitleYellow}>Informações cadastrais ({data.dataOnboarding || '-'})</Text>
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
                        Informações não editáveis, servem de referência histórica para acompanhamento da evolução.
                    </Text>
                </View>

                {/* DADOS PESSOAIS */}
                <Text style={styles.sectionTitle}>Dados Pessoais (Editáveis pelo aluno)</Text>
                
                <Text style={styles.label}>Gênero</Text>
                <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={data.genero}
                    editable={false}
                    placeholder="Não informado"
                />
                
                <Text style={styles.label}>Data de Nascimento</Text>
                <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={data.dataNascimento}
                    editable={false}
                    placeholder="Não informado"
                />
                
                <Text style={styles.label}>Telefone</Text>
                <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={data.telefone}
                    editable={false}
                    placeholder="Telefone não cadastrado"
                />
                
                {/* CONTATO DE EMERGÊNCIA */}
                <Text style={styles.sectionTitle}>Emergência (Editáveis pelo aluno)</Text>
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
    scrollContent: {
        paddingBottom: 40, // Espaço no final da página
    },
    alunoCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        marginHorizontal: 20,
        marginTop: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6', // Azul dos detalhes (da modal)
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
    onboardingCardLeftBorderYellow: {
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    onboardingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    onboardingTitleYellow: {
        fontSize: 17,
        fontWeight: '700',
        color: '#92400E',
    },
    onboardingInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    onboardingLabelYellow: {
        fontSize: 14,
        color: '#92400E',
        fontWeight: '400',
    },
    onboardingValueYellow: {
        fontSize: 14,
        color: '#92400E',
        fontWeight: '400',
        flex: 1,
        textAlign: 'right',
    },
    onboardingDescriptionYellow: {
        marginTop: 12,
        fontSize: 13,
        color: '#92400E',
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
});
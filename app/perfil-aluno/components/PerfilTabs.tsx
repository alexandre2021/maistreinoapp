import { Calendar, ChevronDown, Edit2, X } from 'lucide-react-native';
import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// INTERFACE ATUALIZADA PARA COMPATIBILIDADE
export interface AlunoData {
    id: string;
    nome_completo: string;
    email: string;
    telefone: string;
    data_nascimento: string;
    genero: string;
    peso: number;
    altura: number;
    objetivo_principal: string;
    nivel_experiencia: string;
    frequencia_desejada: string;
    par_q_respostas: { [key: string]: boolean };
    avatar_letter: string;
    avatar_color: string;
    avatar_type: 'letter' | 'image';
    avatar_image_url: string | null;
    created_at: string;
}

interface PerfilTabsProps {
    // Estados
    activeTab: 'pessoal' | 'objetivos' | 'parq' | 'seguranca';
    userData: AlunoData | null;
    showEditModal: boolean;
    showDatePicker: boolean;
    showGeneroOptions: boolean;
    showObjetivoOptions: boolean;
    showNivelOptions: boolean;
    showFrequenciaOptions: boolean;
    editingSection: 'pessoal' | 'objetivos' | null;
    editData: Partial<AlunoData>;
    selectedDay: number;
    selectedMonth: number;
    selectedYear: number;

    // Constantes
    generoOptions: string[];
    objetivoOptions: string[];
    nivelExperienciaOptions: string[];
    frequenciaTreinoOptions: string[];
    perguntasParQ: string[];

    // Funções
    formatPhoneNumber: (phone: string) => string;
    formatISOToBrazilian: (isoDate: string) => string;
    formatISOToDateTime: (isoDate: string) => string;
    getCurrentDate: () => { day: number; month: number; year: number };
    handlePesoChange: (value: string) => string;
    handleAlturaChange: (value: string) => string;
    openEditModal: (section: 'pessoal' | 'objetivos') => void;
    saveChanges: () => void;
    setShowEditModal: (show: boolean) => void;
    setShowDatePicker: (show: boolean) => void;
    setShowGeneroOptions: (show: boolean) => void;
    setShowObjetivoOptions: (show: boolean) => void;
    setShowNivelOptions: (show: boolean) => void;
    setShowFrequenciaOptions: (show: boolean) => void;
    setEditData: (data: Partial<AlunoData>) => void;
    setSelectedDay: (day: number) => void;
    setSelectedMonth: (month: number) => void;
    setSelectedYear: (year: number) => void;
}

const styles = StyleSheet.create({
    // Tab Content
    tabContent: {
        backgroundColor: 'white',
        margin: 16,
        borderRadius: 12,
        padding: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    editButtonText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },

    // Info Grid
    infoGrid: {
        gap: 16,
    },
    infoItem: {
        width: '100%',
        marginBottom: 12,
    },
    infoItemFull: {
        width: '100%',
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#1F2937',
        lineHeight: 22,
    },

    // PAR-Q Styles
    parqContainer: {
        marginBottom: 16,
    },
    parqHeader: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    parqHeaderTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    parqHeaderDate: {
        fontSize: 14,
        color: '#64748B',
    },
    parqQuestion: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    parqQuestionNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 8,
    },
    parqQuestionText: {
        fontSize: 14,
        color: '#1F2937',
        lineHeight: 20,
        marginBottom: 12,
    },
    parqAnswer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    parqAnswerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    parqAnswerSim: {
        backgroundColor: '#EF4444',
    },
    parqAnswerNao: {
        backgroundColor: '#10B981',
    },
    parqAnswerText: {
        fontSize: 14,
        fontWeight: '500',
    },
    parqAnswerTextSim: {
        color: '#EF4444',
    },
    parqAnswerTextNao: {
        color: '#10B981',
    },

    // Edit Modal
    editModalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        minHeight: '50%',
        width: '100%',
    },
    editModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    editModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    editModalContent: {
        padding: 20,
    },
    editField: {
        marginBottom: 16,
    },
    editLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 8,
    },
    editInput: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: 'white',
    },
    editModalActions: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: 12,
    },
    cancelEditButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        alignItems: 'center',
    },
    cancelEditText: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    saveEditButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#007AFF',
        alignItems: 'center',
    },
    saveEditText: {
        fontSize: 16,
        color: 'white',
        fontWeight: '500',
    },

    // Edit Form Styles
    dateEditInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        padding: 12,
        backgroundColor: 'white',
        gap: 12,
    },
    dateEditText: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    placeholderEditText: {
        color: '#9CA3AF',
    },
    selectEditButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        padding: 12,
        backgroundColor: 'white',
    },
    selectEditText: {
        fontSize: 16,
        color: '#1F2937',
    },
    optionsEditDropdown: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        backgroundColor: 'white',
        marginTop: 4,
        overflow: 'hidden',
        maxHeight: 200,
    },
    dropdownEditItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    dropdownEditItemText: {
        fontSize: 16,
        color: '#1F2937',
    },

    // Date Picker Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    datePickerContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        maxHeight: '80%',
        width: '100%',
    },
    datePickerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 24,
    },
    datePickerRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    pickerColumn: {
        flex: 1,
    },
    pickerLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 8,
    },
    picker: {
        height: 200,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
    },
    pickerItem: {
        padding: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    pickerItemSelected: {
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
    },
    pickerText: {
        fontSize: 16,
        color: '#64748B',
    },
    pickerTextSelected: {
        color: '#007AFF',
        fontWeight: '600',
    },
    datePickerButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    confirmButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#007AFF',
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: '600',
    },
});

export default function PerfilTabs(props: PerfilTabsProps) {
    const {
        activeTab,
        userData,
        showEditModal,
        showDatePicker,
        showGeneroOptions,
        showObjetivoOptions,
        showNivelOptions,
        showFrequenciaOptions,
        editingSection,
        editData,
        selectedDay,
        selectedMonth,
        selectedYear,
        generoOptions,
        objetivoOptions,
        nivelExperienciaOptions,
        frequenciaTreinoOptions,
        perguntasParQ,
        formatISOToBrazilian,
        formatISOToDateTime,
        getCurrentDate,
        handlePesoChange,
        handleAlturaChange,
        openEditModal,
        saveChanges,
        setShowEditModal,
        setShowDatePicker,
        setShowGeneroOptions,
        setShowObjetivoOptions,
        setShowNivelOptions,
        setShowFrequenciaOptions,
        setEditData,
        setSelectedDay,
        setSelectedMonth,
        setSelectedYear,
        formatPhoneNumber,
    } = props;

    // ========= RENDERIZAR ABA PESSOAL (ETAPA 1 ONBOARDING) =========
    const renderPessoalTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Informações Pessoais</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal('pessoal')}
                >
                    <Edit2 size={16} color="#007AFF" />
                    <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Nome Completo</Text>
                    <Text style={styles.infoValue}>{userData?.nome_completo || 'Não informado'}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{userData?.email || 'Não informado'}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Gênero</Text>
                    <Text style={styles.infoValue}>{userData?.genero || 'Não informado'}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Data de Nascimento</Text>
                    <Text style={styles.infoValue}>
                        {userData?.data_nascimento ? formatISOToBrazilian(userData.data_nascimento) : 'Não informado'}
                    </Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Telefone</Text>
                    <Text style={styles.infoValue}>{userData?.telefone || 'Não informado'}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Peso</Text>
                    <Text style={styles.infoValue}>
                        {userData?.peso ? `${userData.peso.toString().replace('.', ',')} kg` : 'Não informado'}
                    </Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Altura</Text>
                    <Text style={styles.infoValue}>
                        {userData?.altura ? `${userData.altura.toString().replace('.', ',')} m` : 'Não informado'}
                    </Text>
                </View>
            </View>
        </View>
    );

    // ========= RENDERIZAR ABA OBJETIVOS (ETAPA 2 ONBOARDING) =========
    const renderObjetivosTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Objetivos e Experiência</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal('objetivos')}
                >
                    <Edit2 size={16} color="#007AFF" />
                    <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Objetivo Principal</Text>
                    <Text style={styles.infoValue}>{userData?.objetivo_principal || 'Não informado'}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Nível de Experiência</Text>
                    <Text style={styles.infoValue}>{userData?.nivel_experiencia || 'Não informado'}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Frequência Desejada</Text>
                    <Text style={styles.infoValue}>{userData?.frequencia_desejada || 'Não informado'}</Text>
                </View>
            </View>
        </View>
    );

    // ========= RENDERIZAR ABA PAR-Q (ETAPA 3 ONBOARDING) =========
    const renderParQTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Questionário PAR-Q</Text>
            </View>

            <View style={styles.parqHeader}>
                <Text style={styles.parqHeaderTitle}>Questionário de Prontidão para Atividade Física</Text>
                <Text style={styles.parqHeaderDate}>
                    Respondido em: {userData?.created_at ? formatISOToDateTime(userData.created_at) : 'Data não disponível'}
                </Text>
            </View>

            {perguntasParQ.map((pergunta, index) => {
                const resposta = userData?.par_q_respostas?.[index.toString()];

                return (
                    <View key={index} style={styles.parqQuestion}>
                        <Text style={styles.parqQuestionNumber}>Pergunta {index + 1}</Text>
                        <Text style={styles.parqQuestionText}>{pergunta}</Text>

                        <View style={styles.parqAnswer}>
                            <View style={[
                                styles.parqAnswerDot,
                                resposta === true ? styles.parqAnswerSim : styles.parqAnswerNao
                            ]} />
                            <Text style={[
                                styles.parqAnswerText,
                                resposta === true ? styles.parqAnswerTextSim : styles.parqAnswerTextNao
                            ]}>
                                {resposta === true ? 'Sim' : resposta === false ? 'Não' : 'Não respondido'}
                            </Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );

    // ========= RENDERIZAR SELETOR DE DATA =========
    const renderDatePicker = () => {
        const currentDate = getCurrentDate();
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];

        const getDaysInMonth = (month: number, year: number) => {
            return new Date(year, month + 1, 0).getDate();
        };

        const years = Array.from({ length: 100 }, (_, i) => currentDate.year - i);

        const confirmDate = () => {
            const formattedDate = `${selectedDay.toString().padStart(2, '0')}/${(selectedMonth + 1).toString().padStart(2, '0')}/${selectedYear}`;
            setEditData({ ...editData, data_nascimento: formattedDate });
            setShowDatePicker(false);
        };

        const cancelDate = () => {
            // Resetar para a data original ou data padrão
            if (editData.data_nascimento) {
                const parts = editData.data_nascimento.split('/');
                if (parts.length === 3) {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const year = parseInt(parts[2], 10);

                    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                        setSelectedDay(day);
                        setSelectedMonth(month);
                        setSelectedYear(year);
                    }
                }
            } else {
                setSelectedDay(1);
                setSelectedMonth(0);
                setSelectedYear(1990);
            }
            setShowDatePicker(false);
        };

        return (
            <Modal visible={showDatePicker} transparent={true} animationType="slide" accessible={false} importantForAccessibility="no">
                <View style={styles.modalOverlay}>
                    <View style={styles.datePickerContainer}>
                        <Text style={styles.datePickerTitle}>Selecione sua data de nascimento</Text>

                        <View style={styles.datePickerRow}>
                            <View style={styles.pickerColumn}>
                                <Text style={styles.pickerLabel}>Dia</Text>
                                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                                    {Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1).map((day) => (
                                        <TouchableOpacity
                                            key={day}
                                            style={[styles.pickerItem, selectedDay === day && styles.pickerItemSelected]}
                                            onPress={() => setSelectedDay(day)}
                                        >
                                            <Text style={[styles.pickerText, selectedDay === day && styles.pickerTextSelected]}>
                                                {day}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.pickerColumn}>
                                <Text style={styles.pickerLabel}>Mês</Text>
                                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                                    {months.map((month, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.pickerItem, selectedMonth === index && styles.pickerItemSelected]}
                                            onPress={() => setSelectedMonth(index)}
                                        >
                                            <Text style={[styles.pickerText, selectedMonth === index && styles.pickerTextSelected]}>
                                                {month}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.pickerColumn}>
                                <Text style={styles.pickerLabel}>Ano</Text>
                                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                                    {years.map((year) => (
                                        <TouchableOpacity
                                            key={year}
                                            style={[styles.pickerItem, selectedYear === year && styles.pickerItemSelected]}
                                            onPress={() => setSelectedYear(year)}
                                        >
                                            <Text style={[styles.pickerText, selectedYear === year && styles.pickerTextSelected]}>
                                                {year}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        <View style={styles.datePickerButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={cancelDate}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={confirmDate}
                            >
                                <Text style={styles.confirmButtonText}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    // ========= RENDERIZAR MODAL DE EDIÇÃO =========
    const renderEditModal = () => {
        if (!editingSection) return null;

        return (
            <Modal visible={showEditModal} transparent animationType="slide" accessible={false} importantForAccessibility="no">
                <View style={styles.modalOverlay}>
                    <View style={styles.editModalContainer}>
                        <View style={styles.editModalHeader}>
                            <Text style={styles.editModalTitle}>
                                Editar {editingSection === 'pessoal' ? 'Informações Pessoais' : 'Objetivos e Experiência'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <X size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.editModalContent}>
                            {editingSection === 'pessoal' && (
                                <>
                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Nome Completo</Text>
                                        <TextInput
                                            style={styles.editInput}
                                            value={editData.nome_completo || ''}
                                            onChangeText={(text) => setEditData({ ...editData, nome_completo: text })}
                                            placeholder="Digite seu nome completo"
                                        />
                                    </View>

                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Gênero</Text>
                                        <TouchableOpacity
                                            style={styles.selectEditButton}
                                            onPress={() => setShowGeneroOptions(!showGeneroOptions)}
                                        >
                                            <Text style={[styles.selectEditText, !editData.genero && styles.placeholderEditText]}>
                                                {editData.genero || 'Selecione seu gênero'}
                                            </Text>
                                            <ChevronDown size={20} color="#64748B" />
                                        </TouchableOpacity>

                                        {showGeneroOptions && (
                                            <View style={styles.optionsEditDropdown}>
                                                {/* ✅ CORREÇÃO ADICIONADA */}
                                                <ScrollView>
                                                    {generoOptions.map((option) => (
                                                        <TouchableOpacity
                                                            key={option}
                                                            style={styles.dropdownEditItem}
                                                            onPress={() => {
                                                                setEditData({ ...editData, genero: option });
                                                                setShowGeneroOptions(false);
                                                            }}
                                                        >
                                                            <Text style={styles.dropdownEditItemText}>{option}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Data de Nascimento</Text>
                                        <TouchableOpacity
                                            style={styles.dateEditInput}
                                            onPress={() => {
                                                // Configurar data atual do usuário antes de abrir o picker
                                                if (editData.data_nascimento) {
                                                    const parts = editData.data_nascimento.split('/');
                                                    if (parts.length === 3) {
                                                        const day = parseInt(parts[0], 10);
                                                        const month = parseInt(parts[1], 10) - 1;
                                                        const year = parseInt(parts[2], 10);

                                                        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                                                            setSelectedDay(day);
                                                            setSelectedMonth(month);
                                                            setSelectedYear(year);
                                                        }
                                                    }
                                                } else {
                                                    setSelectedDay(1);
                                                    setSelectedMonth(0);
                                                    setSelectedYear(1990);
                                                }
                                                setShowDatePicker(true);
                                            }}
                                        >
                                            <Calendar size={20} color="#64748B" />
                                            <Text style={[styles.dateEditText, !editData.data_nascimento && styles.placeholderEditText]}>
                                                {editData.data_nascimento || 'DD/MM/AAAA'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Telefone</Text>
                                        <TextInput
                                            style={styles.editInput}
                                            value={editData.telefone || ''}
                                            onChangeText={(text) => setEditData({ ...editData, telefone: formatPhoneNumber(text) })}
                                            placeholder="(11) 99999-9999"
                                            keyboardType="phone-pad"
                                            maxLength={15}
                                        />
                                    </View>

                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Peso (kg)</Text>
                                        <TextInput
                                            style={styles.editInput}
                                            value={editData.peso?.toString() || ''}
                                            onChangeText={(text) => {
                                                const filteredText = handlePesoChange(text);
                                                setEditData({ ...editData, peso: filteredText as any });
                                            }}
                                            placeholder="ex: 70,5"
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Altura (m)</Text>
                                        <TextInput
                                            style={styles.editInput}
                                            value={editData.altura?.toString() || ''}
                                            onChangeText={(text) => {
                                                const filteredText = handleAlturaChange(text);
                                                setEditData({ ...editData, altura: filteredText as any });
                                            }}
                                            placeholder="ex: 1,70"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </>
                            )}

                            {editingSection === 'objetivos' && (
                                <>
                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Objetivo Principal</Text>
                                        <TouchableOpacity
                                            style={styles.selectEditButton}
                                            onPress={() => setShowObjetivoOptions(!showObjetivoOptions)}
                                        >
                                            <Text style={[styles.selectEditText, !editData.objetivo_principal && styles.placeholderEditText]}>
                                                {editData.objetivo_principal || 'Selecione seu objetivo'}
                                            </Text>
                                            <ChevronDown size={20} color="#64748B" />
                                        </TouchableOpacity>

                                        {showObjetivoOptions && (
                                            <View style={styles.optionsEditDropdown}>
                                                {/* ✅ CORREÇÃO ADICIONADA */}
                                                <ScrollView>
                                                    {objetivoOptions.map((option) => (
                                                        <TouchableOpacity
                                                            key={option}
                                                            style={styles.dropdownEditItem}
                                                            onPress={() => {
                                                                setEditData({ ...editData, objetivo_principal: option });
                                                                setShowObjetivoOptions(false);
                                                            }}
                                                        >
                                                            <Text style={styles.dropdownEditItemText}>{option}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Nível de Experiência</Text>
                                        <TouchableOpacity
                                            style={styles.selectEditButton}
                                            onPress={() => setShowNivelOptions(!showNivelOptions)}
                                        >
                                            <Text style={[styles.selectEditText, !editData.nivel_experiencia && styles.placeholderEditText]}>
                                                {editData.nivel_experiencia || 'Selecione seu nível'}
                                            </Text>
                                            <ChevronDown size={20} color="#64748B" />
                                        </TouchableOpacity>

                                        {showNivelOptions && (
                                            <View style={styles.optionsEditDropdown}>
                                                {/* ✅ CORREÇÃO ADICIONADA */}
                                                <ScrollView>
                                                    {nivelExperienciaOptions.map((option) => (
                                                        <TouchableOpacity
                                                            key={option}
                                                            style={styles.dropdownEditItem}
                                                            onPress={() => {
                                                                setEditData({ ...editData, nivel_experiencia: option });
                                                                setShowNivelOptions(false);
                                                            }}
                                                        >
                                                            <Text style={styles.dropdownEditItemText}>{option}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Frequência de Treino Desejada</Text>
                                        <TouchableOpacity
                                            style={styles.selectEditButton}
                                            onPress={() => setShowFrequenciaOptions(!showFrequenciaOptions)}
                                        >
                                            <Text style={[styles.selectEditText, !editData.frequencia_desejada && styles.placeholderEditText]}>
                                                {editData.frequencia_desejada || 'Selecione a frequência'}
                                            </Text>
                                            <ChevronDown size={20} color="#64748B" />
                                        </TouchableOpacity>

                                        {showFrequenciaOptions && (
                                            <View style={styles.optionsEditDropdown}>
                                                {/* ✅ CORREÇÃO ADICIONADA */}
                                                <ScrollView>
                                                    {frequenciaTreinoOptions.map((option) => (
                                                        <TouchableOpacity
                                                            key={option}
                                                            style={styles.dropdownEditItem}
                                                            onPress={() => {
                                                                setEditData({ ...editData, frequencia_desejada: option });
                                                                setShowFrequenciaOptions(false);
                                                            }}
                                                        >
                                                            <Text style={styles.dropdownEditItemText}>{option}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.editModalActions}>
                            <TouchableOpacity
                                style={styles.cancelEditButton}
                                onPress={() => setShowEditModal(false)}
                            >
                                <Text style={styles.cancelEditText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveEditButton}
                                onPress={saveChanges}
                            >
                                <Text style={styles.saveEditText}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    // ========= RENDERIZAR CONTEÚDO DAS ABAS =========
    const renderTabContent = () => {
        switch (activeTab) {
            case 'pessoal':
                return renderPessoalTab();
            case 'objetivos':
                return renderObjetivosTab();
            case 'parq':
                return renderParQTab();
            default:
                return null;
        }
    };

    return (
        <>
            {/* Conteúdo da aba ativa */}
            {renderTabContent()}

            {/* Modais */}
            {showDatePicker && renderDatePicker()}
            {showEditModal && renderEditModal()}
        </>
    );
}
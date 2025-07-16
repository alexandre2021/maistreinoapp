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
import { PersonalTrainerData } from '../../../hooks/perfil/usePerfilPT';
// ✅ IMPORTS DAS CONSTANTES CENTRALIZADAS
import {
    VALIDACOES,
    formatarTelefone,
    type AnosExperienciaPT,
    type EspecializacaoPT,
    type Genero
} from '../../../constants/usuarios';

interface PerfilTabsProps {
    // Estados
    activeTab: 'pessoal' | 'profissional' | 'redes' | 'seguranca';
    userData: PersonalTrainerData | null;
    showEditModal: boolean;
    showDatePicker: boolean;
    showGeneroOptions: boolean;
    showExperienciaOptions: boolean;
    editingSection: 'pessoal' | 'profissional' | 'redes' | null;
    editData: Partial<PersonalTrainerData>;
    selectedDay: number;
    selectedMonth: number;
    selectedYear: number;

    // ✅ Constantes centralizadas - agora tipadas
    generoOptions: readonly Genero[];
    experienciaOptions: readonly AnosExperienciaPT[];
    especializacoesOptions: readonly EspecializacaoPT[];

    // Funções
    formatISOToBrazilian: (isoDate: string) => string;
    getCurrentDate: () => { day: number; month: number; year: number };
    openEditModal: (section: 'pessoal' | 'profissional' | 'redes') => void;
    saveChanges: () => void;
    toggleEspecializacao: (spec: EspecializacaoPT) => void;
    setShowEditModal: (show: boolean) => void;
    setShowDatePicker: (show: boolean) => void;
    setShowGeneroOptions: (show: boolean) => void;
    setShowExperienciaOptions: (show: boolean) => void;
    setEditData: (data: Partial<PersonalTrainerData>) => void;
    setSelectedDay: (day: number) => void;
    setSelectedMonth: (month: number) => void;
    setSelectedYear: (year: number) => void;
    validateEditData?: () => { isValid: boolean; errors: string[] };
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
        color: '#A11E0A',
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
    bioEditInput: {
        height: 100,
        textAlignVertical: 'top',
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
        backgroundColor: '#A11E0A',
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
    editSublabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 12,
        marginTop: -4,
    },
    especializacoesEditGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    especializacaoEditChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: 'white',
    },
    especializacaoEditChipSelected: {
        backgroundColor: '#A11E0A',
        borderColor: '#A11E0A',
    },
    especializacaoEditChipText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    especializacaoEditChipTextSelected: {
        color: 'white',
        fontWeight: '500',
    },
    selectedEditCount: {
        fontSize: 12,
        color: '#10B981',
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '500',
    },

    // ✅ ESTILOS PARA VALIDAÇÃO
    inputError: {
        borderColor: '#EF4444',
        borderWidth: 2,
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
        marginLeft: 4,
    },
    charCount: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'right',
        marginTop: 4,
    },
    charCountError: {
        color: '#EF4444',
    },

    // Date Picker Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    datePickerContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        margin: 20,
        maxHeight: '80%',
        width: '90%',
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
        color: '#A11E0A',
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
        backgroundColor: '#A11E0A',
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
        userData,
        showEditModal,
        showDatePicker,
        showGeneroOptions,
        showExperienciaOptions,
        editingSection,
        editData,
        selectedDay,
        selectedMonth,
        selectedYear,
        generoOptions,
        experienciaOptions,
        especializacoesOptions,
        formatISOToBrazilian,
        getCurrentDate,
        openEditModal,
        saveChanges,
        toggleEspecializacao,
        setShowEditModal,
        setShowDatePicker,
        setShowGeneroOptions,
        setShowExperienciaOptions,
        setEditData,
        setSelectedDay,
        setSelectedMonth,
        setSelectedYear,
        validateEditData,
    } = props;

    const getFieldError = (field: string): string | null => {
        if (!validateEditData) return null;

        const validation = validateEditData();
        if (validation.isValid) return null;

        const fieldErrors: Record<string, string[]> = {
            nome_completo: validation.errors.filter(err => err.includes('Nome')),
            bio: validation.errors.filter(err => err.includes('Bio')),
            instagram: validation.errors.filter(err => err.includes('Instagram')),
            facebook: validation.errors.filter(err => err.includes('Facebook')),
            linkedin: validation.errors.filter(err => err.includes('LinkedIn')),
            website: validation.errors.filter(err => err.includes('website')),
        };

        return fieldErrors[field]?.[0] || null;
    };

    const renderPessoalTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Informações Pessoais</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal('pessoal')}
                >
                    <Edit2 size={16} color="#A11E0A" />
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
                    <Text style={styles.infoLabel}>Telefone</Text>
                    <Text style={styles.infoValue}>{userData?.telefone || 'Não informado'}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Data de Nascimento</Text>
                    <Text style={styles.infoValue}>
                        {userData?.data_nascimento ? formatISOToBrazilian(userData.data_nascimento) : 'Não informado'}
                    </Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Gênero</Text>
                    <Text style={styles.infoValue}>{userData?.genero || 'Não informado'}</Text>
                </View>
            </View>
        </View>
    );

    const renderProfissionalTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Informações Profissionais</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal('profissional')}
                >
                    <Edit2 size={16} color="#A11E0A" />
                    <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>CREF</Text>
                    <Text style={styles.infoValue}>{userData?.cref || 'Não informado'}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Experiência</Text>
                    <Text style={styles.infoValue}>{userData?.anos_experiencia || 'Não informado'}</Text>
                </View>

                <View style={styles.infoItemFull}>
                    <Text style={styles.infoLabel}>Especializações</Text>
                    <Text style={styles.infoValue}>
                        {userData?.especializacoes?.length ?
                            userData.especializacoes.join(', ') :
                            'Não informado'
                        }
                    </Text>
                </View>

                <View style={styles.infoItemFull}>
                    <Text style={styles.infoLabel}>Bio</Text>
                    <Text style={styles.infoValue}>{userData?.bio || 'Não informado'}</Text>
                </View>
            </View>
        </View>
    );

    const renderRedesTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Redes Sociais</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal('redes')}
                >
                    <Edit2 size={16} color="#A11E0A" />
                    <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Instagram</Text>
                    <Text style={styles.infoValue}>{userData?.instagram || 'Não informado'}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Facebook</Text>
                    <Text style={styles.infoValue}>{userData?.facebook || 'Não informado'}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>LinkedIn</Text>
                    <Text style={styles.infoValue}>{userData?.linkedin || 'Não informado'}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Website</Text>
                    <Text style={styles.infoValue}>{userData?.website || 'Não informado'}</Text>
                </View>
            </View>
        </View>
    );

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

    const renderEditModal = () => {
        if (!editingSection) return null;

        return (
            <Modal visible={showEditModal} transparent animationType="slide" accessible={false} importantForAccessibility="no">
                <View style={styles.modalOverlay}>
                    <View style={styles.editModalContainer}>
                        <View style={styles.editModalHeader}>
                            <Text style={styles.editModalTitle}>
                                Editar {editingSection === 'pessoal' ? 'Informações Pessoais' :
                                    editingSection === 'profissional' ? 'Informações Profissionais' :
                                        'Redes Sociais'}
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
                                            style={[
                                                styles.editInput,
                                                getFieldError('nome_completo') && styles.inputError
                                            ]}
                                            value={editData.nome_completo || ''}
                                            onChangeText={(text) => setEditData({ ...editData, nome_completo: text })}
                                            placeholder="Digite seu nome completo"
                                            maxLength={VALIDACOES.nomeMaxLength}
                                        />
                                        {editData.nome_completo && (
                                            <Text style={[
                                                styles.charCount,
                                                (editData.nome_completo.length > VALIDACOES.nomeMaxLength ||
                                                    editData.nome_completo.length < VALIDACOES.nomeMinLength) && styles.charCountError
                                            ]}>
                                                {editData.nome_completo.length}/{VALIDACOES.nomeMaxLength}
                                            </Text>
                                        )}
                                        {getFieldError('nome_completo') && (
                                            <Text style={styles.errorText}>{getFieldError('nome_completo')}</Text>
                                        )}
                                    </View>

                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Telefone</Text>
                                        <TextInput
                                            style={styles.editInput}
                                            value={editData.telefone || ''}
                                            onChangeText={(text) => setEditData({ ...editData, telefone: formatarTelefone(text) })}
                                            placeholder="(11) 99999-9999"
                                            keyboardType="phone-pad"
                                            maxLength={VALIDACOES.telefoneLength}
                                        />
                                    </View>

                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Data de Nascimento</Text>
                                        <TouchableOpacity
                                            style={styles.dateEditInput}
                                            onPress={() => {
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
                                </>
                            )}

                            {editingSection === 'profissional' && (
                                <>
                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>CREF</Text>
                                        <TextInput
                                            style={styles.editInput}
                                            value={editData.cref || ''}
                                            onChangeText={(text) => setEditData({ ...editData, cref: text })}
                                            placeholder="123456"
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Anos de Experiência</Text>
                                        <TouchableOpacity
                                            style={styles.selectEditButton}
                                            onPress={() => setShowExperienciaOptions(!showExperienciaOptions)}
                                        >
                                            <Text style={[styles.selectEditText, !editData.anos_experiencia && styles.placeholderEditText]}>
                                                {editData.anos_experiencia || 'Selecione sua experiência'}
                                            </Text>
                                            <ChevronDown size={20} color="#64748B" />
                                        </TouchableOpacity>

                                        {showExperienciaOptions && (
                                            <View style={styles.optionsEditDropdown}>
                                                <ScrollView>
                                                    {experienciaOptions.map((option) => (
                                                        <TouchableOpacity
                                                            key={option}
                                                            style={styles.dropdownEditItem}
                                                            onPress={() => {
                                                                setEditData({ ...editData, anos_experiencia: option });
                                                                setShowExperienciaOptions(false);
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
                                        <Text style={styles.editLabel}>Suas Especializações</Text>
                                        <Text style={styles.editSublabel}>Selecione todas que se aplicam</Text>
                                        <View style={styles.especializacoesEditGrid}>
                                            {especializacoesOptions.map((option) => (
                                                <TouchableOpacity
                                                    key={option}
                                                    style={[
                                                        styles.especializacaoEditChip,
                                                        (editData.especializacoes || []).includes(option) && styles.especializacaoEditChipSelected
                                                    ]}
                                                    onPress={() => toggleEspecializacao(option)}
                                                >
                                                    <Text style={[
                                                        styles.especializacaoEditChipText,
                                                        (editData.especializacoes || []).includes(option) && styles.especializacaoEditChipTextSelected
                                                    ]}>
                                                        {option}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        {(editData.especializacoes || []).length > 0 && (
                                            <Text style={styles.selectedEditCount}>
                                                {(editData.especializacoes || []).length} especialização{(editData.especializacoes || []).length > 1 ? 'ões' : ''} selecionada{(editData.especializacoes || []).length > 1 ? 's' : ''}
                                            </Text>
                                        )}
                                    </View>

                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Bio</Text>
                                        <TextInput
                                            style={[
                                                styles.editInput,
                                                styles.bioEditInput,
                                                getFieldError('bio') && styles.inputError
                                            ]}
                                            value={editData.bio || ''}
                                            onChangeText={(text) => setEditData({ ...editData, bio: text })}
                                            placeholder="Conte sobre sua experiência..."
                                            multiline
                                            numberOfLines={4}
                                            maxLength={VALIDACOES.bioMaxLength}
                                        />
                                        {editData.bio && (
                                            <Text style={[
                                                styles.charCount,
                                                (editData.bio.length > VALIDACOES.bioMaxLength ||
                                                    editData.bio.length < VALIDACOES.bioMinLength) && styles.charCountError
                                            ]}>
                                                {editData.bio.length}/{VALIDACOES.bioMaxLength} (mín: {VALIDACOES.bioMinLength})
                                            </Text>
                                        )}
                                        {getFieldError('bio') && (
                                            <Text style={styles.errorText}>{getFieldError('bio')}</Text>
                                        )}
                                    </View>
                                </>
                            )}

                            {editingSection === 'redes' && (
                                <>
                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Instagram</Text>
                                        <TextInput
                                            style={[
                                                styles.editInput,
                                                getFieldError('instagram') && styles.inputError
                                            ]}
                                            value={editData.instagram || ''}
                                            onChangeText={(text) => setEditData({ ...editData, instagram: text })}
                                            placeholder="https://instagram.com/seu.perfil"
                                            autoCapitalize="none"
                                            keyboardType="url"
                                        />
                                        {getFieldError('instagram') && (
                                            <Text style={styles.errorText}>{getFieldError('instagram')}</Text>
                                        )}
                                    </View>

                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Facebook</Text>
                                        <TextInput
                                            style={[
                                                styles.editInput,
                                                getFieldError('facebook') && styles.inputError
                                            ]}
                                            value={editData.facebook || ''}
                                            onChangeText={(text) => setEditData({ ...editData, facebook: text })}
                                            placeholder="https://facebook.com/seu.perfil"
                                            autoCapitalize="none"
                                            keyboardType="url"
                                        />
                                        {getFieldError('facebook') && (
                                            <Text style={styles.errorText}>{getFieldError('facebook')}</Text>
                                        )}
                                    </View>

                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>LinkedIn</Text>
                                        <TextInput
                                            style={[
                                                styles.editInput,
                                                getFieldError('linkedin') && styles.inputError
                                            ]}
                                            value={editData.linkedin || ''}
                                            onChangeText={(text) => setEditData({ ...editData, linkedin: text })}
                                            placeholder="https://linkedin.com/in/seu.perfil"
                                            autoCapitalize="none"
                                            keyboardType="url"
                                        />
                                        {getFieldError('linkedin') && (
                                            <Text style={styles.errorText}>{getFieldError('linkedin')}</Text>
                                        )}
                                    </View>

                                    <View style={styles.editField}>
                                        <Text style={styles.editLabel}>Website</Text>
                                        <TextInput
                                            style={[
                                                styles.editInput,
                                                getFieldError('website') && styles.inputError
                                            ]}
                                            value={editData.website || ''}
                                            onChangeText={(text) => setEditData({ ...editData, website: text })}
                                            placeholder="https://seusite.com.br"
                                            autoCapitalize="none"
                                            keyboardType="url"
                                        />
                                        {getFieldError('website') && (
                                            <Text style={styles.errorText}>{getFieldError('website')}</Text>
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

    const renderTabContent = () => {
        const { activeTab } = props;

        switch (activeTab) {
            case 'pessoal':
                return renderPessoalTab();
            case 'profissional':
                return renderProfissionalTab();
            case 'redes':
                return renderRedesTab();
            default:
                return null;
        }
    };

    return (
        <>
            {renderTabContent()}
            
            {showDatePicker && renderDatePicker()}
            {showEditModal && renderEditModal()}
        </>
    );
}
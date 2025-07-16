import { Calendar, ChevronDown } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { AppOrange } from '../../constants/Colors';
import { GENEROS, formatarTelefone } from '../../constants/usuarios';
import { useOnboardingAluno } from '../../context/OnboardingAlunoContext';

interface DadosBasicosProps {
  userEmail: string;
  fieldErrors: { [key: string]: string };
}

export const DadosBasicos: React.FC<DadosBasicosProps> = ({
  userEmail,
  fieldErrors
}) => {
  const { data, updateField } = useOnboardingAluno();
  
  // Estados locais para dropdowns e modais
  const [showGeneroOptions, setShowGeneroOptions] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(() => {
    const currentDate = new Date();
    return currentDate.getFullYear() - 25;
  });

  // Função para filtrar input de peso (permite números, vírgula e ponto)
  const handlePesoChange = (value: string) => {
    const filtered = value.replace(/[^0-9.,]/g, '');
    updateField('peso', filtered);
  };

  // Função para filtrar input de altura (permite números, vírgula e ponto)
  const handleAlturaChange = (value: string) => {
    const filtered = value.replace(/[^0-9.,]/g, '');
    updateField('altura', filtered);
  };

  const formatDate = (day: number, month: number, year: number) => {
    return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
  };

  const getCurrentDate = () => {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear()
    };
  };

  const confirmDate = () => {
    const formattedDate = formatDate(selectedDay, selectedMonth, selectedYear);
    updateField('dataNascimento', formattedDate);
    setShowDatePicker(false);
  };

  const renderDatePicker = () => {
    const currentDate = getCurrentDate();
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    const getDaysInMonth = (month: number, year: number) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const years = Array.from({ length: 100 }, (_, i) => currentDate.year - i);

    return (
      <Modal 
        visible={showDatePicker} 
        transparent={true} 
        animationType="slide"
        accessible={false} 
        importantForAccessibility="no"
      >
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
                onPress={() => setShowDatePicker(false)}
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

  return (
    <View style={styles.stepContent}>
      {renderDatePicker()}
      
      <Text style={styles.stepTitle}>Informações Básicas</Text>
      
      <Text style={styles.label}>Nome Completo *</Text>
      <TextInput
        style={[
          styles.input,
          fieldErrors.nomeCompleto && styles.inputError
        ]}
        value={data.nomeCompleto}
        onChangeText={(value) => updateField('nomeCompleto', value)}
        placeholder="Digite seu nome completo"
        autoCapitalize="words"
      />
      {fieldErrors.nomeCompleto && (
        <Text style={styles.errorText}>{fieldErrors.nomeCompleto}</Text>
      )}

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, styles.inputDisabled]}
        value={userEmail || ''}
        editable={false}
        placeholder="Email do usuário"
      />

      <Text style={styles.label}>Gênero *</Text>
      <TouchableOpacity 
        style={[
          styles.selectButton,
          fieldErrors.genero && styles.inputError
        ]}
        onPress={() => setShowGeneroOptions(!showGeneroOptions)}
      >
        <Text style={[styles.selectText, !data.genero && styles.placeholderText]}>
          {data.genero || 'Selecione seu gênero'}
        </Text>
        <ChevronDown size={20} color="#64748B" />
      </TouchableOpacity>
      {fieldErrors.genero && (
        <Text style={styles.errorText}>{fieldErrors.genero}</Text>
      )}
      
      {showGeneroOptions && (
        <View style={styles.optionsDropdown}>
          {GENEROS.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.dropdownItem}
              onPress={() => {
                updateField('genero', option);
                setShowGeneroOptions(false);
              }}
            >
              <Text style={styles.dropdownItemText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Data de Nascimento *</Text>
      <TouchableOpacity 
        style={[
          styles.dateInput,
          fieldErrors.dataNascimento && styles.inputError
        ]}
        onPress={() => setShowDatePicker(true)}
      >
        <Calendar size={20} color="#64748B" />
        <Text style={[styles.dateInputText, !data.dataNascimento && styles.placeholderText]}>
          {data.dataNascimento || 'Selecione uma data'}
        </Text>
      </TouchableOpacity>
      {fieldErrors.dataNascimento && (
        <Text style={styles.errorText}>{fieldErrors.dataNascimento}</Text>
      )}

      <Text style={styles.label}>Telefone de Contato</Text>
      <TextInput
        style={styles.input}
        value={data.telefone}
        onChangeText={(value) => updateField('telefone', formatarTelefone(value))}
        placeholder="(11) 99999-9999"
        keyboardType="phone-pad"
        maxLength={15}
      />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            value={data.peso}
            onChangeText={handlePesoChange}
            placeholder="ex: 70"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Altura (m)</Text>
          <TextInput
            style={styles.input}
            value={data.altura}
            onChangeText={handleAlturaChange}
            placeholder="ex: 1,70"
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContent: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AppOrange,
    marginBottom: 8,
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
    backgroundColor: '#F8FAFC',
    color: '#64748B',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    gap: 12,
  },
  dateInputText: {
    flex: 1,
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
  // Date Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
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
    backgroundColor: '#F0FDF4',
  },
  pickerText: {
    fontSize: 16,
    color: '#64748B',
  },
  pickerTextSelected: {
    color: AppOrange,
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
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: AppOrange,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});
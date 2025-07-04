// components/ExerciciosTabs.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ExerciciosTabsProps {
  activeTab: 'padrao' | 'personalizados';
  onTabChange: (tab: 'padrao' | 'personalizados') => void;
  exerciciosPersonalizadosCount?: number;
  limitePersonalizados?: number;
}

export const ExerciciosTabs: React.FC<ExerciciosTabsProps> = ({
  activeTab,
  onTabChange,
  exerciciosPersonalizadosCount = 0,
  limitePersonalizados = 10
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'padrao' && styles.tabActive
          ]}
          onPress={() => onTabChange('padrao')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'padrao' && styles.tabTextActive
          ]}>
            Padrão
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'personalizados' && styles.tabActive
          ]}
          onPress={() => onTabChange('personalizados')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'personalizados' && styles.tabTextActive
          ]}>
            Personalizados
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'personalizados' && (
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {exerciciosPersonalizadosCount}/{limitePersonalizados === -1 ? 'ilimitado' : limitePersonalizados} exercícios criados
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  counterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  counterText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
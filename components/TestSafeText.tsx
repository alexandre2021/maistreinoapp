// components/TestSafeText.tsx
// Componente temporário para testar SafeText e detectar warnings

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeText } from './SafeText';

export const TestSafeText: React.FC = () => {
  // Casos de teste problemáticos
  const testCases = [
    null,
    undefined,
    '',
    '.',
    'undefined',
    'null',
    'NaN',
    [],
    {},
    { nome: 'Teste' },
    0,
    false,
    true,
    'Texto válido'
  ];

  return (
    <View style={styles.container}>
      {testCases.map((testCase, index) => (
        <View key={index} style={styles.testCase}>
          <SafeText debug={true} fallback={`Fallback ${index}`}>
            {testCase}
          </SafeText>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  testCase: {
    marginBottom: 10,
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 5,
  },
});

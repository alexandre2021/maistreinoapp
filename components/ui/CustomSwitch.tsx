// components/ui/CustomSwitch.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const CustomSwitch: React.FC<CustomSwitchProps> = ({ 
  value, 
  onValueChange, 
  disabled = false 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.customSwitch, 
        value && styles.customSwitchActive,
        disabled && styles.customSwitchDisabled
      ]}
      onPress={() => !disabled && onValueChange(!value)}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <View style={[
        styles.customSwitchThumb, 
        value && styles.customSwitchThumbActive
      ]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  customSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  customSwitchActive: {
    backgroundColor: '#A7F3D0', // Verde claro consistente
  },
  customSwitchDisabled: {
    opacity: 0.5,
  },
  customSwitchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9CA3AF',
    alignSelf: 'flex-start',
  },
  customSwitchThumbActive: {
    backgroundColor: '#10B981', // Verde do sistema
    alignSelf: 'flex-end',
  },
});

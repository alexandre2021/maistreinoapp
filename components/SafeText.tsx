// components/SafeText.tsx
// Componente Text seguro que nunca renderiza strings vazias ou inválidas

import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { sanitizeText } from '../utils/textSanitizer';

interface SafeTextProps extends TextProps {
  children: any;
  fallback?: string;
  debug?: boolean; // Para debug em desenvolvimento
}

export const SafeText: React.FC<SafeTextProps> = ({ 
  children, 
  fallback = '', 
  debug = false,
  ...props 
}) => {
  // Debug especial para pontos problemáticos
  if (children === '.' || children === ' .' || children === '. ') {
    if (__DEV__) {
      console.warn('🚨 SafeText: Detected problematic dot character!', {
        children,
        type: typeof children,
        fallback,
        stack: new Error().stack
      });
    }
    return null; // Não renderizar pontos problemáticos
  }
  
  // Debug em desenvolvimento
  if (debug && __DEV__) {
    console.log('🔍 [SafeText] Input:', { children, type: typeof children });
  }
  
  const sanitized = sanitizeText(children);
  
  // Debug do resultado da sanitização
  if (debug && __DEV__) {
    console.log('🔍 [SafeText] Sanitized:', { sanitized, fallback });
  }
  
  // Se não há conteúdo válido e nem fallback, não renderiza
  if (!sanitized && !fallback) {
    if (debug && __DEV__) {
      console.log('🔍 [SafeText] Returning null - no content');
    }
    return null;
  }
  
  // Usa o conteúdo sanitizado ou fallback
  const finalContent = sanitized || fallback;
  
  // Verificação adicional para garantir que o conteúdo final é válido
  if (!finalContent || typeof finalContent !== 'string') {
    if (debug && __DEV__) {
      console.log('🔍 [SafeText] Invalid final content, returning null');
    }
    return null;
  }
  
  // Verificação extra contra pontos problemáticos
  if (finalContent === '.' || finalContent === ' .' || finalContent === '. ') {
    if (__DEV__) {
      console.warn('🚨 SafeText: Final content is problematic dot!', finalContent);
    }
    return null;
  }
  
  if (debug && __DEV__) {
    console.log('🔍 [SafeText] Rendering:', finalContent);
  }
  
  return (
    <RNText {...props}>
      {finalContent}
    </RNText>
  );
};

// components/TitansFitnessLogo.tsx
// Componente do logo Titans Fitness para React Native

import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface TitansFitnessLogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  variant?: 'horizontal' | 'vertical' | 'icon-only' | 'text-only'
  theme?: 'light' | 'dark'
}

const SIZES = {
  small: { icon: 40, text: 21, gap: 8 },
  medium: { icon: 48, text: 30, gap: 8 },
  large: { icon: 64, text: 38, gap: 8 },
  xlarge: { icon: 80, text: 46, gap: 12 }
}

export default function TitansFitnessLogo({
  size = 'medium',
  variant = 'vertical',
  theme = 'light'
}: TitansFitnessLogoProps) {
  const { icon, text, gap } = SIZES[size]
  const isLight = theme === 'light'

  const renderIcon = () => (
    <LinearGradient
      colors={['#FF8C42', '#A11E0A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.iconContainer,
        {
          width: icon,
          height: icon,
          borderRadius: icon * 0.22,
        }
      ]}
    >
      {/* Camadas para dar grossura ao t */}
      <Text style={[styles.letterTShadow, { fontSize: icon * 0.50 }]}>t</Text>
      <Text style={[styles.letterT, { fontSize: icon * 0.50 }]}>t</Text>
      
      {/* Camadas para dar grossura ao F */}
      <Text style={[styles.letterFShadow, { fontSize: icon * 0.50 }]}>F</Text>
      <Text style={[styles.letterF, { fontSize: icon * 0.50 }]}>F</Text>
    </LinearGradient>
  );

  const renderText = () => (
    <Text style={[
      styles.logoText,
      { 
        fontSize: text,
        color: isLight ? '#333333' : '#ffffff'
      }
    ]}>
      <Text style={[styles.titans, { fontSize: text }]}>titans</Text>
      .fitness
    </Text>
  )

  if (variant === 'icon-only') {
    return renderIcon()
  }

  if (variant === 'text-only') {
    return renderText()
  }

  return (
    <View style={[
      styles.container,
      variant === 'vertical' ? styles.vertical : styles.horizontal,
      { gap }
    ]}>
      {renderIcon()}
      {renderText()}
    </View>
  )
}

// Componente para uso em headers/navegação
export function LogoHeader({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  return <TitansFitnessLogo size="medium" variant="horizontal" theme={theme} />
}

// Componente para splash screen
export function LogoSplash() {
  return <TitansFitnessLogo size="xlarge" variant="vertical" />
}

// Componente para app icon/favicon
export function LogoIcon({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' | 'xlarge' }) {
  return <TitansFitnessLogo size={size} variant="icon-only" />
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  horizontal: {
    flexDirection: 'row',
  },
  vertical: {
    flexDirection: 'column',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#FF8C42',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  letterT: {
    color: 'white',
    fontWeight: '900',
    fontFamily: 'System',
    position: 'absolute',
    left: '27%',
    marginTop: -4,
  },
  letterF: {
    color: 'white',
    fontWeight: '900',
    fontFamily: 'System',
    position: 'absolute',
    right: '27%',
  },
  letterTShadow: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '900',
    fontFamily: 'System',
    position: 'absolute',
    left: '26.8%', // Ligeiramente deslocado
    marginTop: -3.8, // Ligeiramente deslocado
  },
  letterFShadow: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '900',
    fontFamily: 'System',
    position: 'absolute',
    right: '26.8%', // Ligeiramente deslocado
    marginTop: 0.2, // Ligeiramente deslocado
  },
  logoText: {
    fontWeight: '800',
    fontFamily: 'System',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  titans: {
    // Gradiente será aplicado via propriedades específicas do tema
  },
  titansGradientLight: {
    // No React Native, gradientes em texto são mais complexos
    // Pode ser implementado com bibliotecas como react-native-linear-gradient-text
    // Por simplicidade, usando cor sólida baseada no gradiente
    color: '#FF6B35',
  },
  titansGradientDark: {
    color: '#FF8C42',
  },
})

// Exemplo de uso:
/*
// No seu arquivo de tela/componente:
import TitansFitnessLogo, { LogoHeader, LogoIcon } from '../components/TitansFitnessLogo'

// Header da aplicação
<LogoHeader theme="light" />

// Tela de login
<TitansFitnessLogo size="large" variant="vertical" />

// Apenas o ícone
<LogoIcon size="small" />

// Apenas texto
<TitansFitnessLogo variant="text-only" size="medium" />

// Logo horizontal
<TitansFitnessLogo variant="horizontal" size="medium" />

// CORES SUGERIDAS PARA BOTÕES:
// Primário: #C1260C (laranja escuro do gradiente)
// Secundário: #FF8C42 (laranja claro do gradiente)
// Hover/Active: #A11E0A (ainda mais escuro)
*/
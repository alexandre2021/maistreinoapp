// components/TitansOnlineLogo.tsx
// Componente do logo titans.fitness para React Native

import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface TitansOnlineLogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  variant?: 'horizontal' | 'vertical' | 'icon-only' | 'text-only'
  theme?: 'light' | 'dark'
}

const SIZES = {
  small: { icon: 24, text: 16, gap: 6 },
  medium: { icon: 32, text: 20, gap: 8 },
  large: { icon: 48, text: 28, gap: 12 },
  xlarge: { icon: 64, text: 36, gap: 16 }
}

export default function TitansOnlineLogo({
  size = 'medium',
  variant = 'horizontal',
  theme = 'light'
}: TitansOnlineLogoProps) {
  const { icon, text, gap } = SIZES[size]
  const isLight = theme === 'light'

  const renderIcon = () => (
    <LinearGradient
      colors={['#A11E0A', '#5856D6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.iconContainer,
        {
          width: icon,
          height: icon,
          borderRadius: icon * 0.25, // 25% do tamanho para bordas arredondadas
        }
      ]}
    >
      <Text style={[styles.letterM, { fontSize: icon * 0.42 }]}>m</Text>
      <Text style={[styles.letterT, { fontSize: icon * 0.42 }]}>T</Text>
    </LinearGradient>
  );

  const renderText = () => (
    <Text style={[
      styles.logoText,
      { 
        fontSize: text,
        color: isLight ? '#1a1a1a' : '#ffffff'
      }
    ]}>
      <Text style={styles.mais}>Mais</Text>
      Treino
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
  return <TitansOnlineLogo size="medium" variant="horizontal" theme={theme} />
}

// Componente para splash screen
export function LogoSplash() {
  return <TitansOnlineLogo size="xlarge" variant="vertical" />
}

// Componente para app icon/favicon
export function LogoIcon({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' | 'xlarge' }) {
  return <TitansOnlineLogo size={size} variant="icon-only" />
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
    flexDirection: 'row',
    shadowColor: '#A11E0A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Para Android
  },
  letterM: {
    color: 'white',
    fontWeight: '800',
    fontFamily: 'System', // Usa a fonte do sistema
    position: 'absolute',
    left: '20%',
  },
  letterT: {
    color: 'white',
    fontWeight: '800',
    fontFamily: 'System',
    position: 'absolute',
    right: '20%',
  },
  logoText: {
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  mais: {
    color: '#A11E0A',
  },
})

// Exemplo de uso:
/*
// No seu arquivo de tela/componente:
import TitansOnlineLogo, { LogoHeader, LogoIcon } from '../components/TitansOnlineLogo'

// Header da aplicação
<LogoHeader theme="light" />

// Tela de login
<titansFitnessLogo size="large" variant="vertical" />

// Apenas o ícone
<LogoIcon size="small" />

// Apenas texto
<titansFitnessLogo variant="text-only" size="medium" />
*/
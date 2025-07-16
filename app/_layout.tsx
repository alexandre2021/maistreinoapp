import { BebasNeue_400Regular, useFonts } from '@expo-google-fonts/bebas-neue';
import { Session } from '@supabase/supabase-js';
import { SplashScreen, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AvatarProvider } from '../context/AvatarContext';
import { supabase } from '../lib/supabase';
// import { fixAriaHiddenIssue } from '../utils/fixAriaHidden'; // TEMPORARIAMENTE DESABILITADO

// Impede que a tela de splash seja escondida automaticamente
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Carrega a fonte Bebas Neue
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
  });

  useEffect(() => {
    // ✅ APLICA CORREÇÃO PARA ARIA-HIDDEN - TEMPORARIAMENTE DESABILITADO
    // const cleanupAriaFix = fixAriaHiddenIssue();

    // ✅ CARREGA SESSÃO APENAS UMA VEZ
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
      SplashScreen.hideAsync();
    })

    // ✅ ESCUTA MUDANÇAS DE AUTH (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, authSession) => {
      console.log('🔄 [AUTH] Mudança de estado:', _event, authSession ? 'LOGADO' : 'DESLOGADO');
      setSession(authSession) // ✅ CORREÇÃO: Usa authSession em vez de session
    })

    return () => {
      subscription.unsubscribe()
      // cleanupAriaFix() // TEMPORARIAMENTE DESABILITADO
    }
  }, []) // ✅ CORREÇÃO: Array vazio - não precisa de dependências

  // ✅ IMPORTANTE: REMOVI TODOS OS REDIRECIONAMENTOS AUTOMÁTICOS!
  // Agora cada página gerencia sua própria navegação


  // Bloqueia render até a fonte estar carregada e sessão pronta
  if (isLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF8C42" />
      </View>
    );
  }

  // ✅ STACK SIMPLES - SEM REDIRECIONAMENTOS FORÇADOS
  return (
    <AvatarProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="tipo-conta" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="detalhes-exercicio/[id]" />
        <Stack.Screen name="detalhes-aluno/[id]" />
        <Stack.Screen name="criar-copia-exercicio/[id]" />
        <Stack.Screen name="perfil-pt/perfil-pt" />
        <Stack.Screen name="perfil-aluno/perfil-aluno" />
      </Stack>
    </AvatarProvider>
  )
}
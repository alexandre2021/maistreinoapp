import { Session } from '@supabase/supabase-js';
import { SplashScreen, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { setupTextNodeDebug } from '../utils/debugTextNode';

// Impede que a tela de splash seja escondida automaticamente
SplashScreen.preventAutoHideAsync();

// Ativa debug de text node em desenvolvimento
if (__DEV__) {
  setupTextNodeDebug();
}

export default function RootLayout() {
  const [, setSession] = useState<Session | null>(null) // ✅ CORREÇÃO: _ indica que não usamos a variável
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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
    }
  }, []) // ✅ CORREÇÃO: Array vazio - não precisa de dependências

  // ✅ IMPORTANTE: REMOVI TODOS OS REDIRECIONAMENTOS AUTOMÁTICOS!
  // Agora cada página gerencia sua própria navegação

  if (isLoading) {
    return null;
  }

  // ✅ STACK SIMPLES - SEM REDIRECIONAMENTOS FORÇADOS
  return (
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
  )
}
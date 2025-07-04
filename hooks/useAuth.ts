// hooks/useAuth.ts
// 🛡️ HOOK SUPER SIMPLES PARA PROTEÇÃO DE PÁGINAS

import { router } from 'expo-router'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * 🛡️ Hook para proteger páginas que precisam de autenticação
 * 
 * USO:
 * import { useAuth } from '../hooks/useAuth'
 * 
 * export default function MinhaPageProtegida() {
 *   useAuth() // ← Só isso! Se não logado, redireciona
 *   
 *   return <View>...</View>
 * }
 */
export function useAuth() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          console.log('🚫 Usuário não autenticado, redirecionando para login...')
          router.replace('/')
        } else {
          console.log('✅ Usuário autenticado:', user.email)
        }
      } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error)
        router.replace('/')
      }
    }

    checkAuth()
  }, [])
}
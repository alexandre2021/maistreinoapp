// app/criar-rotina/index.tsx - VERSÃO SIMPLIFICADA E REALISTA
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import LoadingScreen from '../../components/LoadingScreen';
import { limparDadosRotina } from '../../components/rotina/RotinaProgressHeader';
import { supabase } from '../../lib/supabase';

export default function CriarRotinaIndex() {
  const router = useRouter();
  const { alunoId } = useLocalSearchParams<{ alunoId?: string }>();

  useEffect(() => {
    const initializeRotina = async () => {
      try {
        console.log('🚀 [CriarRotina] Inicializando criação de rotina...');
        
        // ✅ LIMPAR DADOS DE ROTINAS ANTERIORES
        console.log('🧹 [CriarRotina] Limpando dados de rotina anterior...');
        limparDadosRotina();
        
        // ✅ OBTER USUÁRIO (sempre existirá em app mobile logado)
        const { data: { user } } = await supabase.auth.getUser();
        
        // ✅ VALIDAR ALUNO (SE FORNECIDO)
        if (alunoId) {
          console.log('🔍 [CriarRotina] Validando aluno:', alunoId);
          
          const { data: aluno, error: alunoError } = await supabase
            .from('alunos')
            .select('id, nome_completo, personal_trainer_id')
            .eq('id', alunoId)
            .eq('personal_trainer_id', user?.id)
            .single();

          if (alunoError || !aluno) {
            console.error('❌ [CriarRotina] Aluno não encontrado ou não pertence ao PT');
            router.replace('/(tabs)/alunos' as any);
            return;
          }

          console.log('✅ [CriarRotina] Aluno validado:', aluno.nome_completo);
        }

        // ✅ REDIRECIONAR PARA PRIMEIRA ETAPA
        console.log('📋 [CriarRotina] Redirecionando para configuração...');
        
        const targetRoute = alunoId 
          ? `/criar-rotina/configuracao?alunoId=${alunoId}`
          : '/criar-rotina/configuracao';
          
        router.replace(targetRoute as any);

      } catch (error) {
        console.error('💥 [CriarRotina] Erro inesperado:', error);
        // Em caso de erro, volta para alunos
        router.replace('/(tabs)/alunos' as any);
      }
    };

    // ✅ DELAY MÍNIMO PARA UX
    const timer = setTimeout(initializeRotina, 300);
    
    return () => clearTimeout(timer);
  }, [alunoId, router]);

  return (
    <LoadingScreen 
      message={alunoId ? 'Validando aluno...' : 'Iniciando criação de rotina...'} 
    />
  );
}
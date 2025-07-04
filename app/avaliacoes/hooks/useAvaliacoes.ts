// app/avaliacoes/hooks/useAvaliacoes.ts
/**
 * 🎯 HOOK CUSTOMIZADO - useAvaliacoes (COM OTIMIZAÇÃO DE IMAGENS)
 * 
 * Centraliza toda a lógica de estado e funções do sistema de avaliações físicas.
 * Responsabilidade: gerenciar dados, estados dos modais, upload de imagens e persistência.
 * 
 * 📊 GERENCIA:
 * - Estados de loading e dados (aluno, avaliações)
 * - Estados de modais (nova avaliação, detalhes, imagens)
 * - Funções de CRUD (criar, ler avaliações)
 * - Upload e preview de imagens COM OTIMIZAÇÃO WebP (~100KB)
 * - Validações e cálculos (IMC, classificações)
 * - URLs assinadas para imagens privadas
 * - Deleção automática (limite 4 avaliações) com R2 e banco
 */

import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useImageOptimizer } from '../../../components/media/ImageOptimizer';
import { supabase } from '../../../lib/supabase';

export interface AlunoData {
  nomeCompleto: string;
  email: string;
  genero: string;
  altura: number;
  peso: number;
  objetivoPrincipal: string;
}

export interface Avaliacao {
  id: string;
  data_avaliacao: string;
  peso: number;
  altura: number;
  imc: number;
  peito_busto: number | null;
  cintura: number | null;
  quadril: number | null;
  coxa_direita: number | null;
  braco_direito: number | null;
  observacoes: string | null;
  foto_frente_url: string | null;
  foto_lado_url: string | null;
  foto_costas_url: string | null;
  created_at: string;
}

export interface NovaAvaliacao {
  peso: string;
  altura: string;
  peito: string;
  cintura: string;
  quadril: string;
  coxaDireita: string;
  bracoDireito: string;
  observacoes: string;
  foto_frente: string | null;
  foto_perfil: string | null;
  foto_costas: string | null;
}

export type ImageField = 'foto_frente' | 'foto_perfil' | 'foto_costas';

export interface ClassificacaoIMC {
  texto: string;
  cor: string;
}

export function useAvaliacoes(alunoId: string | string[]) {
  // Estados principais
  const [loading, setLoading] = useState(true);
  const [alunoData, setAlunoData] = useState<AlunoData | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Estados dos modais
  const [showNovaAvaliacao, setShowNovaAvaliacao] = useState(false);
  const [showDetalhesAvaliacao, setShowDetalhesAvaliacao] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showConfirmacaoIntervalo, setShowConfirmacaoIntervalo] = useState(false);

  // Estados de seleção
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<Avaliacao | null>(null);
  const [currentImageField, setCurrentImageField] = useState<ImageField | null>(null);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [dadosConfirmacao, setDadosConfirmacao] = useState<{ diasUltima: number; diasRestantes: number; ultimaData: string } | null>(null);

  // Estado do formulário
  const [novaAvaliacao, setNovaAvaliacao] = useState<NovaAvaliacao>({
    peso: '',
    altura: '',
    peito: '',
    cintura: '',
    quadril: '',
    coxaDireita: '',
    bracoDireito: '',
    observacoes: '',
    foto_frente: null,
    foto_perfil: null,
    foto_costas: null
  });

  // ✅ NOVO: Hook para otimização de imagens
  const { optimizeAndConvertToBase64 } = useImageOptimizer({
    maxSizeKB: 100,
    maxWidth: 1080,
    quality: 0.8,
    format: 'webp'
  });

  // ✅ FUNÇÃO CORRIGIDA - Extrair nome do arquivo da URL do R2
  const extrairNomeArquivoR2 = (url: string): string | null => {
    try {
      console.log('🔍 [extrairNomeArquivoR2] URL recebida:', url);
      
      if (!url || typeof url !== 'string') {
        console.error('❌ [extrairNomeArquivoR2] URL inválida ou vazia');
        return null;
      }

      // ✅ CRUCIAL: Remover TODOS os query parameters (tudo após ?)
      const urlSemQuery = url.split('?')[0];
      console.log('🔍 [extrairNomeArquivoR2] URL sem query params:', urlSemQuery);
      
      // ✅ Extrair apenas o nome do arquivo (última parte após /)
      const parts = urlSemQuery.split('/');
      const fileName = parts[parts.length - 1];
      
      console.log('🔍 [extrairNomeArquivoR2] Nome do arquivo extraído:', fileName);
      
      if (!fileName || fileName === '') {
        console.error('❌ [extrairNomeArquivoR2] Nome do arquivo vazio');
        return null;
      }
      
      // Verificar se não contém caracteres de query string residuais
      if (fileName.includes('?') || fileName.includes('&') || fileName.includes('=')) {
        console.error('❌ [extrairNomeArquivoR2] Nome do arquivo contém caracteres de query string:', fileName);
        return null;
      }
      
      console.log('✅ [extrairNomeArquivoR2] Nome final extraído:', fileName);
      return fileName;
      
    } catch (error) {
      console.error('❌ [extrairNomeArquivoR2] Erro ao extrair nome do arquivo:', error);
      return null;
    }
  };

  // ✅ FUNÇÃO - Buscar URL assinada para uma imagem
  const obterUrlAssinada = async (url: string): Promise<string | null> => {
    try {
      console.log('🔗 =================== INÍCIO obterUrlAssinada ===================');
      console.log('🔗 URL recebida:', url);
      if (!url || url.includes('placeholder') || url.includes('via.placeholder.com')) {
        console.log('🔗 URL é placeholder, retornando sem modificar');
        return url; // Retorna URLs placeholder sem modificar
      }

      const filename = extrairNomeArquivoR2(url);
      console.log('🔗 Filename extraído:', filename);
      if (!filename) {
        console.error('❌ Nome do arquivo não encontrado na URL:', url);
        return url; // Fallback para URL original
      }

      console.log('🔗 Buscando URL assinada para:', filename);

      const { data, error } = await supabase.functions.invoke('get-image-url', {
        body: { filename }
      });

      if (error) {
        console.error('❌ Erro ao buscar URL assinada:', error);
        return url; // Fallback para URL original
      }

      if (data && data.success) {
        console.log('✅ URL assinada obtida:', filename);
        return data.url;
      }

      console.warn('⚠️ Resposta inválida da Edge Function:', data);
      return url; // Fallback para URL original

    } catch (error) {
      console.error('💥 Erro inesperado ao obter URL assinada:', error);
      return url; // Fallback para URL original
    }
  };

  // ✅ FUNÇÃO - Processar avaliações e substituir URLs por assinadas
  const processarUrlsAvaliacoes = async (avaliacoes: Avaliacao[]): Promise<Avaliacao[]> => {
    console.log('🔄 Processando URLs das avaliações...');

    const avaliacoesProcessadas = await Promise.all(
      avaliacoes.map(async (avaliacao) => {
        const urlsAssinadas = await Promise.all([
          avaliacao.foto_frente_url ? obterUrlAssinada(avaliacao.foto_frente_url) : null,
          avaliacao.foto_lado_url ? obterUrlAssinada(avaliacao.foto_lado_url) : null,
          avaliacao.foto_costas_url ? obterUrlAssinada(avaliacao.foto_costas_url) : null
        ]);

        return {
          ...avaliacao,
          foto_frente_url: urlsAssinadas[0],
          foto_lado_url: urlsAssinadas[1],
          foto_costas_url: urlsAssinadas[2]
        };
      })
    );

    console.log('✅ URLs processadas com sucesso');
    return avaliacoesProcessadas;
  };

  // ✅ FUNÇÃO CORRIGIDA - Deletar imagem do Cloudflare R2 via Edge Function
  const deletarImagemStorage = async (url: string): Promise<boolean> => {
    try {
      console.log(`🗑️ [useAvaliacoes] === INICIANDO DELETE VIA EDGE FUNCTION ===`);
      console.log(`🗑️ [useAvaliacoes] URL original recebida: ${url}`);

      // ✅ PROBLEMA RESOLVIDO: Extrair apenas o nome do arquivo limpo
      const fileName = extrairNomeArquivoR2(url);
      if (!fileName) {
        console.error('❌ [useAvaliacoes] Falha ao extrair nome do arquivo da URL');
        return false;
      }

      console.log(`🗑️ [useAvaliacoes] Nome do arquivo limpo para delete: ${fileName}`);

      // ✅ CHAMAR Edge Function com nome limpo (sem query params)
      console.log('🚀 [useAvaliacoes] Chamando Edge Function delete-image...');
      
      const { data, error } = await supabase.functions.invoke('delete-image', {
        body: { filename: fileName } // ✅ Apenas nome limpo, sem URL completa
      });

      console.log('📊 [useAvaliacoes] Resposta da Edge Function:', { data, error });

      if (error) {
        console.error('❌ [useAvaliacoes] Erro na Edge Function:', error);
        return false;
      }

      if (!data || !data.success) {
        console.error('❌ [useAvaliacoes] Edge Function retornou erro:', data?.error || data);
        return false;
      }

      console.log('✅ [useAvaliacoes] Arquivo deletado com sucesso via Edge Function');
      console.log('✅ [useAvaliacoes] Detalhes:', data.message);
      
      return true;

    } catch (error) {
      console.error('💥 [useAvaliacoes] ERRO inesperado ao deletar:', error);
      return false;
    }
  };

  // ✅ FUNÇÃO - Deletar avaliação completa (imagens R2 + registro banco)
  const deletarAvaliacaoCompleta = async (avaliacao: Avaliacao): Promise<boolean> => {
    try {
      console.log(`🗑️ [useAvaliacoes] === INICIANDO DELEÇÃO COMPLETA ===`);
      console.log(`🗑️ [useAvaliacoes] Avaliação ID: ${avaliacao.id}`);
      console.log(`🗑️ [useAvaliacoes] Data: ${avaliacao.data_avaliacao}`);

      // ✅ PASSO 1: Coletar URLs das imagens ANTES de deletar o registro
      console.log(`🗑️ [useAvaliacoes] PASSO 1: Coletando URLs das imagens...`);
      const imagensParaDeletar: { url: string; tipo: string }[] = [];

      if (avaliacao.foto_frente_url) {
        imagensParaDeletar.push({ url: avaliacao.foto_frente_url, tipo: 'frente' });
        console.log(`📸 [useAvaliacoes] Imagem FRENTE encontrada: ${avaliacao.foto_frente_url}`);
      }
      if (avaliacao.foto_lado_url) {
        imagensParaDeletar.push({ url: avaliacao.foto_lado_url, tipo: 'lado' });
        console.log(`📸 [useAvaliacoes] Imagem LADO encontrada: ${avaliacao.foto_lado_url}`);
      }
      if (avaliacao.foto_costas_url) {
        imagensParaDeletar.push({ url: avaliacao.foto_costas_url, tipo: 'costas' });
        console.log(`📸 [useAvaliacoes] Imagem COSTAS encontrada: ${avaliacao.foto_costas_url}`);
      }

      console.log(`📋 [useAvaliacoes] TOTAL de ${imagensParaDeletar.length} imagens para deletar`);

      // ✅ PASSO 2: Deletar cada imagem do R2 via Edge Function
      if (imagensParaDeletar.length > 0) {
        console.log(`🗑️ [useAvaliacoes] PASSO 2: Deletando imagens do R2...`);
        for (const imagem of imagensParaDeletar) {
          console.log(`🗑️ [useAvaliacoes] Deletando imagem ${imagem.tipo}: ${imagem.url}`);
          const sucesso = await deletarImagemStorage(imagem.url);
          console.log(`${sucesso ? '✅' : '❌'} [useAvaliacoes] Resultado ${imagem.tipo}: ${sucesso ? 'SUCESSO' : 'FALHA'}`);
          
          // ⚠️ Não interromper processo se uma imagem falhar
          if (!sucesso) {
            console.warn(`⚠️ [useAvaliacoes] Falha ao deletar ${imagem.tipo}, mas continuando...`);
          }
        }
      } else {
        console.log(`ℹ️ [useAvaliacoes] Nenhuma imagem para deletar`);
      }

      // ✅ PASSO 3: Deletar o registro da tabela
      console.log(`🗑️ [useAvaliacoes] PASSO 3: Deletando registro da tabela...`);
      const { error } = await supabase
        .from('avaliacoes_fisicas')
        .delete()
        .eq('id', avaliacao.id);

      if (error) {
        console.error('❌ [useAvaliacoes] ERRO ao deletar registro da avaliação:', error);
        console.error('❌ [useAvaliacoes] Detalhes do erro:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('✅ [useAvaliacoes] SUCESSO: Registro da tabela deletado');
      console.log('✅ [useAvaliacoes] SUCESSO: Avaliação deletada completamente:', avaliacao.id);
      console.log(`✅ [useAvaliacoes] === DELEÇÃO COMPLETA FINALIZADA ===`);
      return true;

    } catch (error) {
      console.error('💥 [useAvaliacoes] ERRO INESPERADO ao deletar avaliação:', error);
      console.error('💥 [useAvaliacoes] Stack trace:', error);
      return false;
    }
  };

  // ✅ FUNÇÃO - Carregar dados (com URLs assinadas)
  const loadData = async () => {
    if (!alunoId) {
      Alert.alert('Erro', 'ID do aluno não encontrado');
      return;
    }

    try {
      console.log('🔍 [useAvaliacoes] Carregando dados para ID:', alunoId);

      // Buscar dados do aluno
      const { data: aluno, error: alunoError } = await supabase
        .from('alunos')
        .select('id, nome_completo, email, genero, altura, peso, objetivo_principal')
        .eq('id', alunoId)
        .single();

      if (alunoError) {
        console.error('❌ [useAvaliacoes] Erro ao carregar aluno:', alunoError);
        Alert.alert('Erro', 'Aluno não encontrado');
        return;
      }

      // Settar dados do aluno
      setAlunoData({
        nomeCompleto: aluno.nome_completo || '',
        email: aluno.email || '',
        genero: aluno.genero || '',
        altura: aluno.altura || 0,
        peso: aluno.peso || 0,
        objetivoPrincipal: aluno.objetivo_principal || ''
      });

      // Buscar avaliações
      const { data: avaliacoesResponse, error: avaliacoesError } = await supabase
        .from('avaliacoes_fisicas')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('created_at', { ascending: false });

      if (avaliacoesError) {
        console.error('❌ [useAvaliacoes] Erro ao carregar avaliações:', avaliacoesError);
        setAvaliacoes([]);
      } else {
        console.log(`📊 [useAvaliacoes] ${avaliacoesResponse?.length || 0} avaliações encontradas`);

        if (avaliacoesResponse && avaliacoesResponse.length > 0) {
          // ✅ Log das URLs ORIGINAIS
          console.log('🔍 ================== URLs ORIGINAIS ==================');
          avaliacoesResponse.forEach((av, index) => {
            console.log(`Avaliação ${index + 1}:`, {
              id: av.id.substring(0, 8),
              frente: av.foto_frente_url,
              lado: av.foto_lado_url,
              costas: av.foto_costas_url
            });
          });

          // ✅ PROCESSAR URLs ASSINADAS
          console.log('🔄 Iniciando processamento de URLs assinadas...');
          const avaliacoesComUrlsAssinadas = await processarUrlsAvaliacoes(avaliacoesResponse);

          // ✅ Log das URLs PROCESSADAS
          console.log('🔍 ================== URLs PROCESSADAS ==================');
          avaliacoesComUrlsAssinadas.forEach((av, index) => {
            console.log(`Avaliação ${index + 1}:`, {
              id: av.id.substring(0, 8),
              frente: av.foto_frente_url,
              lado: av.foto_lado_url,
              costas: av.foto_costas_url
            });
          });

          // ✅ Atualizar estado com URLs processadas
          console.log('📊 Atualizando estado com URLs assinadas...');
          setAvaliacoes(avaliacoesComUrlsAssinadas);
          console.log('✅ setAvaliacoes() executado com sucesso!');

        } else {
          console.log('ℹ️ Nenhuma avaliação encontrada');
          setAvaliacoes([]);
        }
      }

    } catch (error) {
      console.error('💥 [useAvaliacoes] Erro inesperado:', error);
      Alert.alert('Erro', 'Erro inesperado ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Monitor do estado de avaliações
  useEffect(() => {
    console.log('📊 ========== ESTADO AVALIACOES ATUALIZADO ==========');
    console.log(`📊 Total de avaliações no estado: ${avaliacoes.length}`);
    avaliacoes.forEach((av, index) => {
      console.log(`Estado ${index + 1}:`, {
        id: av.id.substring(0, 8),
        frente: av.foto_frente_url,
        lado: av.foto_lado_url,
        costas: av.foto_costas_url
      });
    });
    console.log('📊 ===============================================');
  }, [avaliacoes]);

  // Carregar dados iniciais
  useEffect(() => {
    if (alunoId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId]);

  // Funções utilitárias
  const calcularIMC = (peso: number, altura: number): number => {
    if (peso <= 0 || altura <= 0) return 0;
    const alturaMetros = altura / 100;
    return Number((peso / (alturaMetros * alturaMetros)).toFixed(1));
  };

  const obterClassificacaoIMC = (imc: number): ClassificacaoIMC => {
    if (imc < 18.5) return { texto: 'Abaixo do peso', cor: '#3B82F6' };
    if (imc < 25) return { texto: 'Peso normal', cor: '#10B981' };
    if (imc < 30) return { texto: 'Sobrepeso', cor: '#F59E0B' };
    return { texto: 'Obesidade', cor: '#EF4444' };
  };

  const formatDate = (data: string): string => {
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  };

  // ✅ FUNÇÃO - Calcular dias desde última avaliação
  const calcularDiasUltimaAvaliacao = (): number => {
    if (avaliacoes.length === 0) return 999; // Primeira avaliação - sempre permitir

    const ultimaAvaliacao = avaliacoes[0]; // Já ordenado por data desc
    const dataUltima = new Date(ultimaAvaliacao.data_avaliacao);
    const hoje = new Date();

    const diffTime = hoje.getTime() - dataUltima.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // ✅ FUNÇÃO - Verificar se pode criar nova avaliação
  const verificarIntervaloAvaliacao = (): { podeCrear: boolean; diasRestantes: number; diasUltima: number } => {
    const diasUltima = calcularDiasUltimaAvaliacao();
    const INTERVALO_RECOMENDADO = 30;

    if (diasUltima >= INTERVALO_RECOMENDADO) {
      return { podeCrear: true, diasRestantes: 0, diasUltima };
    }

    const diasRestantes = INTERVALO_RECOMENDADO - diasUltima;
    return { podeCrear: false, diasRestantes, diasUltima };
  };

  // Funções de modal - Detalhes
  const abrirDetalhesAvaliacao = (avaliacao: Avaliacao) => {
    console.log('👁️ [useAvaliacoes] Abrindo detalhes da avaliação:', avaliacao.id);
    setAvaliacaoSelecionada(avaliacao);
    setShowDetalhesAvaliacao(true);
  };

  const fecharDetalhesAvaliacao = () => {
    console.log('👁️ [useAvaliacoes] Fechando detalhes da avaliação');
    setShowDetalhesAvaliacao(false);
    setAvaliacaoSelecionada(null);
  };

  // Funções de modal - Nova Avaliação
  const abrirNovaAvaliacao = () => {
    console.log('🚀 [useAvaliacoes] Abrindo nova avaliação...');

    if (!alunoData) {
      Alert.alert('Erro', 'Dados do aluno ainda não foram carregados. Tente novamente.');
      return;
    }

    // ✅ VERIFICAÇÃO DO INTERVALO DE 30 DIAS - COM MODAL DE CONFIRMAÇÃO
    const { podeCrear, diasRestantes, diasUltima } = verificarIntervaloAvaliacao();

    if (!podeCrear && avaliacoes.length > 0) {
      const ultimaData = formatDate(avaliacoes[0].data_avaliacao);

      console.log(`⚠️ [useAvaliacoes] Mostrando modal de confirmação: ${diasUltima} dias, aguardar ${diasRestantes}`);

      // Salvar dados para o modal e mostrar
      setDadosConfirmacao({ diasUltima, diasRestantes, ultimaData });
      setShowConfirmacaoIntervalo(true);
      return;
    }

    // Se pode criar normalmente ou é primeira avaliação
    console.log('✅ [useAvaliacoes] Criando avaliação sem restrições');
    continuarCriacaoAvaliacao();
  };

  // ✅ FUNÇÕES DO MODAL DE CONFIRMAÇÃO
  const confirmarCriacaoComAviso = () => {
    console.log('✅ [useAvaliacoes] Usuário confirmou criação apesar do aviso');
    setShowConfirmacaoIntervalo(false);
    setDadosConfirmacao(null);
    continuarCriacaoAvaliacao();
  };

  const cancelarCriacaoAvaliacao = () => {
    console.log('❌ [useAvaliacoes] Usuário cancelou criação');
    setShowConfirmacaoIntervalo(false);
    setDadosConfirmacao(null);
  };

  // ✅ FUNÇÃO AUXILIAR - Continuar criação após confirmação
  const continuarCriacaoAvaliacao = () => {
    console.log('🎯 [useAvaliacoes] Continuando criação da avaliação...');

    if (!alunoData) {
      console.error('❌ [useAvaliacoes] alunoData não disponível em continuarCriacaoAvaliacao');
      return;
    }

    // Pré-preencher dados do onboarding se disponíveis
    const isPrimeiraAvaliacao = avaliacoes.length === 0;
    const temPesoOnboarding = alunoData.peso && alunoData.peso > 0;
    const temAlturaOnboarding = alunoData.altura && alunoData.altura > 0;

    const pesoInicial = isPrimeiraAvaliacao && temPesoOnboarding
      ? alunoData.peso.toString()
      : '';

    const alturaInicial = temAlturaOnboarding
      ? (alunoData.altura * 100).toString() // Converter metros para centímetros
      : '';

    console.log('📝 [useAvaliacoes] Pré-preenchendo formulário:', { pesoInicial, alturaInicial });

    setNovaAvaliacao(prev => ({
      ...prev,
      altura: alturaInicial,
      peso: pesoInicial,
      foto_frente: null,
      foto_perfil: null,
      foto_costas: null
    }));

    console.log('🎭 [useAvaliacoes] Abrindo modal de nova avaliação');
    setShowNovaAvaliacao(true);
  };

  const fecharNovaAvaliacao = () => {
    setShowNovaAvaliacao(false);
    // Limpar formulário
    setNovaAvaliacao({
      peso: '',
      altura: '',
      peito: '',
      cintura: '',
      quadril: '',
      coxaDireita: '',
      bracoDireito: '',
      observacoes: '',
      foto_frente: null,
      foto_perfil: null,
      foto_costas: null
    });
  };

  // Funções de imagem - Options Modal
  const openImagePicker = (field: ImageField) => {
    setCurrentImageField(field);
    setShowImageOptions(true);
  };

  const closeImageOptions = () => {
    setShowImageOptions(false);
    setCurrentImageField(null);
  };

  // Funções de imagem - Preview Modal
  const openImagePreview = (uri: string) => {
    setPreviewImageUri(uri);
    setShowImagePreview(true);
  };

  const closeImagePreview = () => {
    setShowImagePreview(false);
    setPreviewImageUri(null);
  };

  // ✅ FUNÇÃO OTIMIZADA - Upload via Edge Function com ImageOptimizer
  const uploadFoto = async (uri: string, tipo: 'frente' | 'perfil' | 'costas'): Promise<string | null> => {
    try {
      console.log(`🖼️ [useAvaliacoes] === INICIANDO UPLOAD OTIMIZADO ===`);
      console.log(`📸 [useAvaliacoes] Tipo: ${tipo}`);
      console.log(`📸 [useAvaliacoes] URI original: ${uri}`);

      // ✅ OTIMIZAR IMAGEM ANTES DO UPLOAD
      console.log(`🔧 [useAvaliacoes] Otimizando imagem para WebP ~100KB...`);
      const { base64, metadata } = await optimizeAndConvertToBase64(uri);

      console.log(`📊 [useAvaliacoes] Resultado da otimização:`, {
        largura: metadata.width,
        altura: metadata.height,
        tamanho: `${metadata.sizeKB}KB`,
        compressao: metadata.compressionApplied ? 'Aplicada' : 'Não necessária',
        economia: metadata.compressionApplied ? 'Sim' : 'Não'
      });

      // ✅ Gerar nome único para o arquivo (agora .webp)
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const filename = `${alunoId}_${tipo}_${timestamp}_${random}.webp`;

      console.log(`📁 [useAvaliacoes] Nome do arquivo: ${filename}`);

      // ✅ CHAMAR Edge Function com imagem otimizada
      console.log(`🚀 [useAvaliacoes] Enviando para Edge Function...`);
      const { data, error } = await supabase.functions.invoke('upload-imagem', {
        body: {
          filename,
          image_base64: base64,
          aluno_id: alunoId,
          tipo
        }
      });

      console.log(`📊 [useAvaliacoes] Resposta da Edge Function:`, { data, error });

      if (error) {
        console.error(`❌ [useAvaliacoes] Erro na Edge Function:`, error);
        return null;
      }

      if (!data || !data.success) {
        console.error(`❌ [useAvaliacoes] Edge Function retornou erro:`, data?.error);
        return null;
      }

      console.log(`✅ [useAvaliacoes] Upload otimizado realizado com sucesso!`);
      console.log(`📊 [useAvaliacoes] Método: ${data.method}`);
      console.log(`📊 [useAvaliacoes] URL: ${data.url}`);
      console.log(`📊 [useAvaliacoes] Economia de banda: ~${100 - metadata.sizeKB}KB+`);
      console.log(`🖼️ [useAvaliacoes] === UPLOAD OTIMIZADO FINALIZADO ===`);

      return data.url;

    } catch (error) {
      console.error(`💥 [useAvaliacoes] Erro inesperado no upload otimizado ${tipo}:`, error);
      return null;
    }
  };

  // ✅ FUNÇÃO - Deletar foto individual durante criação
  const deletarFotoIndividual = async (tipoFoto: 'foto_frente' | 'foto_perfil' | 'foto_costas') => {
    try {
      console.log(`🗑️ [useAvaliacoes] Deletando foto individual: ${tipoFoto}`);

      const urlFoto = novaAvaliacao[tipoFoto];
      if (!urlFoto) {
        console.log(`ℹ️ [useAvaliacoes] Nenhuma foto ${tipoFoto} para deletar`);
        return;
      }

      // Deletar do storage se já foi feito upload
      if (urlFoto.startsWith('https://')) {
        console.log(`🗑️ [useAvaliacoes] Deletando do storage: ${urlFoto}`);
        const sucesso = await deletarImagemStorage(urlFoto);
        if (sucesso) {
          console.log(`✅ [useAvaliacoes] Foto ${tipoFoto} deletada do storage`);
        } else {
          console.log(`⚠️ [useAvaliacoes] Falha ao deletar do storage, continuando...`);
        }
      }

      // Remover do estado
      setNovaAvaliacao(prev => ({
        ...prev,
        [tipoFoto]: null
      }));

      console.log(`✅ [useAvaliacoes] Foto ${tipoFoto} removida com sucesso`);

    } catch (error) {
      console.error(`❌ [useAvaliacoes] Erro ao deletar foto ${tipoFoto}:`, error);
    }
  };

  // ✅ FUNÇÃO - Handle para deletar imagem (alias para o componente)
  const handleDeleteImage = (field: ImageField) => {
    console.log(`🗑️ [useAvaliacoes] Handle delete image: ${field}`);
    deletarFotoIndividual(field);
  };

  // ✅ FUNÇÃO OTIMIZADA - Seleção de imagens - Câmera
  const pickImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de acesso à câmera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1.0, // ✅ Qualidade máxima inicial, otimização será feita depois
      });

      if (!result.canceled && result.assets[0] && currentImageField) {
        console.log('📸 [useAvaliacoes] Imagem capturada da câmera, aplicando otimização...');
        setNovaAvaliacao(prev => ({
          ...prev,
          [currentImageField]: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('❌ [useAvaliacoes] Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    }
  };

  // ✅ FUNÇÃO OTIMIZADA - Seleção de imagens - Galeria
  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de acesso à galeria');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1.0, // ✅ Qualidade máxima inicial, otimização será feita depois
      });

      if (!result.canceled && result.assets[0] && currentImageField) {
        console.log('📸 [useAvaliacoes] Imagem selecionada da galeria, aplicando otimização...');
        setNovaAvaliacao(prev => ({
          ...prev,
          [currentImageField]: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('❌ [useAvaliacoes] Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  // ✅ FUNÇÃO PRINCIPAL - Salvar avaliação COM DELEÇÃO AUTOMÁTICA
  const handleSalvarAvaliacao = async () => {
    const peso = parseFloat(novaAvaliacao.peso.replace(',', '.'));
    const altura = parseFloat(novaAvaliacao.altura.replace(',', '.'));

    if (!novaAvaliacao.peso || !novaAvaliacao.altura) {
      Alert.alert('Erro', 'Peso e altura são obrigatórios');
      return;
    }

    if (peso <= 0 || altura <= 0) {
      Alert.alert('Erro', 'Por favor, insira valores válidos para peso e altura');
      return;
    }

    setIsSaving(true);

    try {
      // ✅ REGRA: LIMITE DE 4 AVALIAÇÕES - DELETAR MAIS ANTIGA ANTES DE CRIAR NOVA
      console.log(`📊 [useAvaliacoes] === DEBUG LIMITE DE AVALIAÇÕES ===`);
      console.log(`📊 [useAvaliacoes] Total de avaliações atuais: ${avaliacoes.length}`);
      console.log(`📊 [useAvaliacoes] Avaliações existentes:`, avaliacoes.map(a => ({
        id: a.id.substring(0, 8),
        data: a.data_avaliacao,
        created_at: a.created_at,
        fotos: {
          frente: !!a.foto_frente_url,
          lado: !!a.foto_lado_url,
          costas: !!a.foto_costas_url
        }
      })));

      // ✅ VERIFICAR SE JÁ TEM 4 AVALIAÇÕES
      if (avaliacoes.length >= 4) {
        console.log(`🗑️ [useAvaliacoes] === LIMITE DE 4 AVALIAÇÕES ATINGIDO ===`);
        
        // Encontrar a avaliação mais antiga (último item do array ordenado por created_at desc)
        const avaliacaoMaisAntiga = avaliacoes[avaliacoes.length - 1];

        console.log(`🗑️ [useAvaliacoes] DELETANDO AVALIAÇÃO MAIS ANTIGA:`);
        console.log(`🗑️ [useAvaliacoes] ID: ${avaliacaoMaisAntiga.id}`);
        console.log(`🗑️ [useAvaliacoes] Data: ${avaliacaoMaisAntiga.data_avaliacao}`);
        console.log(`🗑️ [useAvaliacoes] Created_at: ${avaliacaoMaisAntiga.created_at}`);
        console.log(`🗑️ [useAvaliacoes] Fotos a deletar:`, {
          frente: avaliacaoMaisAntiga.foto_frente_url || 'Nenhuma',
          lado: avaliacaoMaisAntiga.foto_lado_url || 'Nenhuma',
          costas: avaliacaoMaisAntiga.foto_costas_url || 'Nenhuma'
        });

        // ✅ EXECUTAR DELEÇÃO COMPLETA (R2 + Banco)
        const sucessoDelecao = await deletarAvaliacaoCompleta(avaliacaoMaisAntiga);

        if (!sucessoDelecao) {
          console.error('❌ [useAvaliacoes] FALHA NA DELEÇÃO da avaliação antiga');
          Alert.alert(
            'Aviso',
            'Não foi possível remover a avaliação mais antiga. A nova avaliação será criada mesmo assim, mas você pode ter mais de 4 avaliações temporariamente.'
          );
        } else {
          console.log('✅ [useAvaliacoes] Avaliação mais antiga removida com sucesso');
        }
      } else {
        console.log(`✅ [useAvaliacoes] Limite OK. Criando avaliação sem deleção (${avaliacoes.length}/4)`);
      }

      // ✅ UPLOAD DAS FOTOS OTIMIZADAS
      console.log('🖼️ [useAvaliacoes] === INICIANDO UPLOAD OTIMIZADO DAS FOTOS ===');
      let fotoFrenteUrl: string | null = null;
      let fotoPerfilUrl: string | null = null;
      let fotoCostasUrl: string | null = null;

      const errosUpload: string[] = [];

      if (novaAvaliacao.foto_frente) {
        console.log('🖼️ [useAvaliacoes] Fazendo upload otimizado da foto de frente...');
        fotoFrenteUrl = await uploadFoto(novaAvaliacao.foto_frente, 'frente');
        if (!fotoFrenteUrl) {
          errosUpload.push('foto de frente');
          console.error('❌ [useAvaliacoes] Falha no upload da foto de frente');
        } else {
          console.log('✅ [useAvaliacoes] Upload da foto de frente: SUCESSO');
        }
      }

      if (novaAvaliacao.foto_perfil) {
        console.log('🖼️ [useAvaliacoes] Fazendo upload otimizado da foto de perfil...');
        fotoPerfilUrl = await uploadFoto(novaAvaliacao.foto_perfil, 'perfil');
        if (!fotoPerfilUrl) {
          errosUpload.push('foto de perfil');
          console.error('❌ [useAvaliacoes] Falha no upload da foto de perfil');
        } else {
          console.log('✅ [useAvaliacoes] Upload da foto de perfil: SUCESSO');
        }
      }

      if (novaAvaliacao.foto_costas) {
        console.log('🖼️ [useAvaliacoes] Fazendo upload otimizado da foto de costas...');
        fotoCostasUrl = await uploadFoto(novaAvaliacao.foto_costas, 'costas');
        if (!fotoCostasUrl) {
          errosUpload.push('foto de costas');
          console.error('❌ [useAvaliacoes] Falha no upload da foto de costas');
        } else {
          console.log('✅ [useAvaliacoes] Upload da foto de costas: SUCESSO');
        }
      }

      if (errosUpload.length > 0) {
        console.warn('⚠️ [useAvaliacoes] Alguns uploads falharam:', errosUpload);
        Alert.alert(
          'Aviso - Upload de fotos',
          `Não foi possível fazer upload de: ${errosUpload.join(', ')}.\n\nA avaliação será salva sem essas fotos.`
        );
      }

      // ✅ CRIAR REGISTRO NO BANCO
      console.log('💾 [useAvaliacoes] === SALVANDO NO BANCO DE DADOS ===');
      
      const imc = calcularIMC(peso, altura);

      const dadosAvaliacao = {
        aluno_id: alunoId,
        data_avaliacao: new Date().toISOString().split('T')[0],
        peso,
        altura: altura / 100, // Converter para metros
        imc,
        peito_busto: novaAvaliacao.peito ? parseFloat(novaAvaliacao.peito.replace(',', '.')) : null,
        cintura: novaAvaliacao.cintura ? parseFloat(novaAvaliacao.cintura.replace(',', '.')) : null,
        quadril: novaAvaliacao.quadril ? parseFloat(novaAvaliacao.quadril.replace(',', '.')) : null,
        coxa_direita: novaAvaliacao.coxaDireita ? parseFloat(novaAvaliacao.coxaDireita.replace(',', '.')) : null,
        braco_direito: novaAvaliacao.bracoDireito ? parseFloat(novaAvaliacao.bracoDireito.replace(',', '.')) : null,
        observacoes: novaAvaliacao.observacoes || null,
        foto_frente_url: fotoFrenteUrl,
        foto_lado_url: fotoPerfilUrl,
        foto_costas_url: fotoCostasUrl
      };

      console.log('💾 [useAvaliacoes] Dados a serem salvos:', {
        ...dadosAvaliacao,
        foto_frente_url: fotoFrenteUrl ? 'URL_WEBP_OTIMIZADA' : null,
        foto_lado_url: fotoPerfilUrl ? 'URL_WEBP_OTIMIZADA' : null,
        foto_costas_url: fotoCostasUrl ? 'URL_WEBP_OTIMIZADA' : null
      });

      const { data: savedAvaliacao, error } = await supabase
        .from('avaliacoes_fisicas')
        .insert([dadosAvaliacao])
        .select()
        .single();

      if (error) {
        console.error('❌ [useAvaliacoes] Erro ao salvar no banco:', error);
        Alert.alert('Erro', 'Não foi possível salvar a avaliação');
        return;
      }

      console.log('✅ [useAvaliacoes] Avaliação salva no banco:', savedAvaliacao.id);
      console.log('🎉 [useAvaliacoes] === PROCESSO COMPLETO FINALIZADO ===');
      
      Alert.alert('Sucesso', 'Avaliação salva com sucesso!\n\nImagens otimizadas para WebP (~100KB cada)');

      // ✅ RECARREGAR DADOS E FECHAR MODAL
      console.log('🔄 [useAvaliacoes] Recarregando dados...');
      await loadData();
      fecharNovaAvaliacao();

    } catch (error) {
      console.error('💥 [useAvaliacoes] Erro inesperado ao salvar:', error);
      Alert.alert('Erro', 'Erro inesperado ao salvar avaliação');
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ RETORNO DO HOOK - Tudo que o componente pai precisa
  return {
    // Estados
    loading,
    alunoData,
    avaliacoes,
    isSaving,

    // Estados dos modais
    showNovaAvaliacao,
    showDetalhesAvaliacao,
    showImageOptions,
    showImagePreview,
    showConfirmacaoIntervalo,

    // Estados de seleção
    avaliacaoSelecionada,
    previewImageUri,
    novaAvaliacao,
    setNovaAvaliacao,
    dadosConfirmacao,

    // Funções utilitárias
    calcularIMC,
    obterClassificacaoIMC,
    formatDate,
    calcularDiasUltimaAvaliacao,
    verificarIntervaloAvaliacao,

    // Funções de modal
    abrirDetalhesAvaliacao,
    fecharDetalhesAvaliacao,
    abrirNovaAvaliacao,
    fecharNovaAvaliacao,
    confirmarCriacaoComAviso,
    cancelarCriacaoAvaliacao,

    // Funções de imagem
    openImagePicker,
    closeImageOptions,
    openImagePreview,
    closeImagePreview,
    pickImageFromCamera,
    pickImageFromGallery,
    deletarFotoIndividual,
    handleDeleteImage,

    // Funções de ação
    handleSalvarAvaliacao,
    loadData
  };
}
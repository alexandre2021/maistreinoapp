import { useMemo } from 'react';

interface AvatarData {
  letter: string;
  color: string;
  type: 'letter';
  imageUrl: null;
}

interface UseAvatarGeneratorReturn {
  generateAvatarLetter: (nomeCompleto: string, email: string) => string;
  getAvatarData: (nomeCompleto: string, email: string) => AvatarData;
  getDefaultColor: () => string;
}

/**
 * Hook para geração de avatars baseados nas iniciais do nome
 * Mantém consistência com o padrão do app (azul para alunos)
 */
export const useAvatarGenerator = (): UseAvatarGeneratorReturn => {
  
  // Cor padrão para alunos (azul)
  const defaultColor = '#2563EB';

  /**
   * Gera letra(s) do avatar baseado no nome completo
   * @param nomeCompleto - Nome completo do usuário
   * @param email - Email de fallback se nome não disponível
   * @returns String com 1-2 letras para o avatar
   */
  const generateAvatarLetter = useMemo(() => {
    return (nomeCompleto: string, email: string): string => {
      const nome = nomeCompleto?.trim();
      
      // Fallback para primeira letra do email se nome não disponível
      if (!nome) {
        return email?.charAt(0)?.toUpperCase() || 'A';
      }
      
      // Dividir nome em palavras (remove espaços vazios)
      const palavras = nome.split(' ').filter(p => p.length > 0);
      const primeiraLetra = palavras[0].charAt(0).toUpperCase();
      
      // Se tem nome e sobrenome, usar primeira + última letra
      if (palavras.length >= 2) {
        const ultimaLetra = palavras[palavras.length - 1].charAt(0).toUpperCase();
        return primeiraLetra + ultimaLetra;
      } else {
        // Se só tem um nome, usar primeira + segunda letra
        const nomeUnico = palavras[0];
        const segundaLetra = nomeUnico.length > 1 
          ? nomeUnico.charAt(1).toUpperCase() 
          : 'L'; // Fallback se nome tem só 1 letra
        return primeiraLetra + segundaLetra;
      }
    };
  }, []);

  /**
   * Retorna objeto completo com dados do avatar
   * @param nomeCompleto - Nome completo do usuário
   * @param email - Email do usuário
   * @returns Objeto com todos os dados necessários para o avatar
   */
  const getAvatarData = useMemo(() => {
    return (nomeCompleto: string, email: string): AvatarData => {
      return {
        letter: generateAvatarLetter(nomeCompleto, email),
        color: defaultColor,
        type: 'letter' as const,
        imageUrl: null
      };
    };
  }, [generateAvatarLetter, defaultColor]);

  /**
   * Retorna a cor padrão para alunos
   * @returns Cor hex padrão
   */
  const getDefaultColor = useMemo(() => {
    return (): string => defaultColor;
  }, [defaultColor]);

  return {
    generateAvatarLetter,
    getAvatarData,
    getDefaultColor
  };
};
// utils/textSanitizer.ts
// Utilitário para sanitizar textos e evitar warnings "Unexpected text node"

/**
 * Sanitiza um valor para exibição em Text, garantindo que seja uma string válida
 */
export const sanitizeText = (value: any): string => {
  // Casos extremos que podem causar problemas
  if (value === null || value === undefined || value === '') return '';
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Lista completa de valores problemáticos
    const invalidValues = ['.', '', 'undefined', 'null', 'NaN', 'false', 'true', '[object Object]'];
    if (invalidValues.includes(trimmed.toLowerCase())) {
      return '';
    }
    
    // Verificação adicional para caracteres especiais que podem causar problemas
    if (trimmed.length === 1 && /[.,;:!?-]/.test(trimmed)) {
      return '';
    }
    
    return trimmed;
  }
  
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) return '';
    return String(value);
  }
  
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  
  // Se é um array, tenta converter para string
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    // Se tem apenas um elemento, usa ele
    if (value.length === 1) return sanitizeText(value[0]);
    // Se tem múltiplos, junta com vírgula
    return value.map(item => sanitizeText(item)).filter(text => text.length > 0).join(', ');
  }
  
  // Se é um objeto, tenta extrair propriedades comuns
  if (typeof value === 'object' && value !== null) {
    // Verifica se tem uma propriedade 'nome' ou 'name'
    if (value.nome) return sanitizeText(value.nome);
    if (value.name) return sanitizeText(value.name);
    if (value.title) return sanitizeText(value.title);
    if (value.label) return sanitizeText(value.label);
    // Se não tem propriedades úteis, retorna vazio
    return '';
  }
  
  // Fallback final - converte qualquer coisa para string
  try {
    const stringified = String(value).trim();
    const invalidFallbacks = ['undefined', 'null', '[object Object]', 'NaN'];
    return invalidFallbacks.includes(stringified) ? '' : stringified;
  } catch {
    return '';
  }
};

/**
 * Sanitiza um array de strings, removendo valores inválidos
 */
export const sanitizeStringArray = (arr: any[]): string[] => {
  if (!Array.isArray(arr)) return [];
  
  return arr
    .filter((item) => item != null && item !== undefined)
    .map((item) => sanitizeText(item))
    .filter((text) => text.length > 0);
};

/**
 * Verifica se um valor pode ser renderizado com segurança
 */
export const isSafeToRender = (value: any): boolean => {
  const sanitized = sanitizeText(value);
  return sanitized.length > 0;
};

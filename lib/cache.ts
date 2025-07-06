// lib/cache.ts - Sistema de cache global para melhorar performance
import { Aluno } from '../types/Aluno';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  
  // ✅ Definir TTL padrão de 5 minutos para evitar dados obsoletos
  private defaultTTL = 5 * 60 * 1000; // 5 minutos
  
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    console.log(`📦 [Cache] Salvando: ${key}`);
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`❌ [Cache] Não encontrado: ${key}`);
      return null;
    }
    
    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (age > entry.ttl) {
      console.log(`⏰ [Cache] Expirado: ${key} (${Math.round(age / 1000)}s)`);
      this.cache.delete(key);
      return null;
    }
    
    console.log(`✅ [Cache] Usando: ${key} (${Math.round(age / 1000)}s)`);
    return entry.data;
  }
  
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ [Cache] Removido: ${key}`);
  }
  
  clear(): void {
    this.cache.clear();
    console.log('🧹 [Cache] Limpo');
  }
  
  // ✅ Método para invalidar cache relacionado a um usuário
  invalidateUser(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache) {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
  }
}

// ✅ Instância singleton
export const cacheManager = new CacheManager();

// ✅ Tipos específicos para cache de alunos
export interface AlunosCacheData {
  alunos: Aluno[];
  planData: {
    plano: string;
    limite_alunos: number;
  };
  ptId: string;
}

// ✅ Funções específicas para cache de alunos
export const alunosCache = {
  key: (ptId: string) => `alunos:${ptId}`,
  
  get: (ptId: string): AlunosCacheData | null => {
    return cacheManager.get<AlunosCacheData>(alunosCache.key(ptId));
  },
  
  set: (ptId: string, data: AlunosCacheData): void => {
    // ✅ Cache de alunos com TTL de 10 minutos
    cacheManager.set(alunosCache.key(ptId), data, 10 * 60 * 1000);
  },
  
  has: (ptId: string): boolean => {
    return cacheManager.has(alunosCache.key(ptId));
  },
  
  delete: (ptId: string): void => {
    cacheManager.delete(alunosCache.key(ptId));
  }
};

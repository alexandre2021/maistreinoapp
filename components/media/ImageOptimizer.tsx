// components/media/ImageOptimizer.tsx
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface ImageOptimizerProps {
  maxSizeKB?: number;
  maxWidth?: number;
  quality?: number;
  format?: 'webp' | 'jpeg';
}

interface OptimizedImageResult {
  uri: string;
  width: number;
  height: number;
  sizeKB: number;
  compressionApplied: boolean;
}

export class ImageOptimizer {
  private maxSizeKB: number;
  private maxWidth: number;
  private quality: number;
  private format: SaveFormat;

  constructor({
    maxSizeKB = 100,
    maxWidth = 1080,
    quality = 0.8,
    format = 'webp'
  }: ImageOptimizerProps = {}) {
    this.maxSizeKB = maxSizeKB;
    this.maxWidth = maxWidth;
    this.quality = quality;
    this.format = format === 'webp' ? SaveFormat.WEBP : SaveFormat.JPEG;
  }

  /**
   * Otimiza uma imagem para o tamanho alvo usando compressão iterativa
   */
  async optimizeImage(uri: string): Promise<OptimizedImageResult> {
    try {
      console.log(`🖼️ [ImageOptimizer] Iniciando otimização da imagem: ${uri}`);
      console.log(`🎯 [ImageOptimizer] Meta: ${this.maxSizeKB}KB, Largura máx: ${this.maxWidth}px`);

      // Primeiro, redimensionar se necessário
      let result = await manipulateAsync(
        uri,
        [{ resize: { width: this.maxWidth } }],
        {
          compress: this.quality,
          format: this.format,
          base64: false,
        }
      );

      let currentSizeKB = await this.getImageSizeKB(result.uri);
      console.log(`📏 [ImageOptimizer] Tamanho após redimensionamento: ${currentSizeKB}KB`);

      let compressionApplied = false;
      let currentQuality = this.quality;

      // Se ainda está maior que o alvo, aplicar compressão progressiva
      while (currentSizeKB > this.maxSizeKB && currentQuality > 0.1) {
        compressionApplied = true;
        currentQuality -= 0.1;
        
        console.log(`🔄 [ImageOptimizer] Aplicando compressão: qualidade ${currentQuality.toFixed(1)}`);
        
        result = await manipulateAsync(
          result.uri,
          [],
          {
            compress: currentQuality,
            format: this.format,
            base64: false,
          }
        );

        currentSizeKB = await this.getImageSizeKB(result.uri);
        console.log(`📏 [ImageOptimizer] Novo tamanho: ${currentSizeKB}KB`);
      }

      // Se ainda está muito grande, reduzir largura gradualmente
      let currentWidth = this.maxWidth;
      while (currentSizeKB > this.maxSizeKB && currentWidth > 400) {
        compressionApplied = true;
        currentWidth = Math.floor(currentWidth * 0.8);
        
        console.log(`📐 [ImageOptimizer] Reduzindo largura para: ${currentWidth}px`);
        
        result = await manipulateAsync(
          uri, // Usar URI original para manter qualidade
          [{ resize: { width: currentWidth } }],
          {
            compress: Math.max(currentQuality, 0.6), // Manter qualidade mínima
            format: this.format,
            base64: false,
          }
        );

        currentSizeKB = await this.getImageSizeKB(result.uri);
        console.log(`📏 [ImageOptimizer] Tamanho com nova largura: ${currentSizeKB}KB`);
      }

      const finalResult: OptimizedImageResult = {
        uri: result.uri,
        width: result.width,
        height: result.height,
        sizeKB: currentSizeKB,
        compressionApplied
      };

      console.log(`✅ [ImageOptimizer] Otimização concluída:`, {
        largura: finalResult.width,
        altura: finalResult.height,
        tamanho: `${finalResult.sizeKB}KB`,
        compressao: finalResult.compressionApplied ? 'Aplicada' : 'Não necessária'
      });

      return finalResult;

    } catch (error) {
      console.error('❌ [ImageOptimizer] Erro na otimização:', error);
      throw new Error(`Falha na otimização da imagem: ${error}`);
    }
  }

  /**
   * Calcula o tamanho de uma imagem em KB
   */
  private async getImageSizeKB(uri: string): Promise<number> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return Math.round(blob.size / 1024);
    } catch (error) {
      console.warn('⚠️ [ImageOptimizer] Erro ao calcular tamanho, assumindo 0KB:', error);
      return 0;
    }
  }

  /**
   * Converte uma imagem otimizada para base64
   */
  async optimizeAndConvertToBase64(uri: string): Promise<{ base64: string; metadata: OptimizedImageResult }> {
    try {
      const optimized = await this.optimizeImage(uri);
      
      const response = await fetch(optimized.uri);
      const blob = await response.blob();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob); // ✅ Movido para dentro da Promise
      });

      const base64 = await base64Promise;

      return {
        base64,
        metadata: optimized
      };
    } catch (error) {
      console.error('❌ [ImageOptimizer] Erro na conversão para base64:', error);
      throw error;
    }
  }
}

// Hook para usar o otimizador
export function useImageOptimizer(config?: ImageOptimizerProps) {
  const optimizer = new ImageOptimizer(config);

  const optimizeImage = async (uri: string): Promise<OptimizedImageResult> => {
    return optimizer.optimizeImage(uri);
  };

  const optimizeAndConvertToBase64 = async (uri: string) => {
    return optimizer.optimizeAndConvertToBase64(uri);
  };

  return {
    optimizeImage,
    optimizeAndConvertToBase64
  };
}
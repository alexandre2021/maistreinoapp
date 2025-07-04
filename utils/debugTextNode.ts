// utils/debugTextNode.ts
// Utilitário para debuggar warnings de text node

// Hook up console para capturar o warning específico
const originalError = console.error;
const originalWarn = console.warn;

let debugEnabled = false;

export const setupTextNodeDebug = () => {
  if (debugEnabled) return;
  debugEnabled = true;
  
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    if (message.includes('Unexpected text node') || message.includes('A text node cannot be a child of a <View>')) {
      console.log('🚨 DEBUG: Text node ERROR detected!');
      console.log('📍 Stack trace:', new Error().stack);
      console.log('🔍 Arguments:', args);
      console.log('📝 Message:', message);
      
      // Tentar extrair mais informações úteis
      const stack = new Error().stack;
      if (stack) {
        const lines = stack.split('\n');
        const relevantLines = lines.filter(line => 
          line.includes('criar-rotina') || 
          line.includes('components') ||
          line.includes('SafeText') ||
          line.includes('revisao') ||
          line.includes('exercicios')
        );
        
        if (relevantLines.length > 0) {
          console.log('📂 Relevant stack lines:');
          relevantLines.forEach(line => console.log('  ', line.trim()));
        }
      }
      
      // Pausar aqui para debuggar apenas em dev
      if (__DEV__) {
        debugger;
      }
    }
    
    // Chamar o console.error original
    originalError.apply(console, args);
  };
  
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    if (message.includes('Unexpected text node') || message.includes('A text node cannot be a child of a <View>')) {
      console.log('⚠️ DEBUG: Text node WARNING detected!');
      console.log('📍 Stack trace:', new Error().stack);
      console.log('🔍 Arguments:', args);
      console.log('📝 Message:', message);
    }
    
    // Chamar o console.warn original
    originalWarn.apply(console, args);
  };
};

export const cleanupTextNodeDebug = () => {
  if (!debugEnabled) return;
  console.error = originalError;
  console.warn = originalWarn;
  debugEnabled = false;
};

// utils/fixAriaHidden.ts
// Correção para o problema de aria-hidden no React Native Web

export const fixAriaHiddenIssue = () => {
  // Só executa no ambiente web
  if (typeof document !== 'undefined') {
    console.log('🔧 [FixAriaHidden] Iniciando correção para aria-hidden');
    
    // Função para corrigir elementos problemáticos
    const fixAriaHiddenElements = () => {
      // Busca elementos com aria-hidden="true" que contêm elementos focáveis
      const problematicElements = document.querySelectorAll('[aria-hidden="true"]');
      
      problematicElements.forEach((element) => {
        // Verifica se tem elementos focáveis dentro
        const focusableElements = element.querySelectorAll(
          'button, input, select, textarea, [tabindex], [contenteditable], a[href], [role="button"]'
        );
        
        if (focusableElements.length > 0) {
          console.log('🔧 [FixAriaHidden] Removendo aria-hidden de elemento com filhos focáveis:', element);
          element.removeAttribute('aria-hidden');
        }
      });
    };
    
    // Executa imediatamente
    fixAriaHiddenElements();
    
    // Execução periódica mais agressiva para capturar mudanças rápidas
    const intervalId = setInterval(fixAriaHiddenElements, 100); // A cada 100ms
    
    // Observer para detectar novos elementos
    const observer = new MutationObserver((mutations) => {
      let needsCheck = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          if (mutation.attributeName === 'aria-hidden' || 
              mutation.attributeName === 'style' || 
              mutation.attributeName === 'class') {
            needsCheck = true;
          }
        } else if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          needsCheck = true;
        }
      });
      
      if (needsCheck) {
        // Execução imediata + com delay
        fixAriaHiddenElements();
        setTimeout(fixAriaHiddenElements, 10);
        setTimeout(fixAriaHiddenElements, 50);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-hidden', 'style', 'class', 'display']
    });
    
    // Override do setAttribute para interceptar aria-hidden
    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, value) {
      const result = originalSetAttribute.call(this, name, value);
      
      if (name === 'aria-hidden' && value === 'true') {
        // Verifica imediatamente se tem filhos focáveis
        setTimeout(() => {
          const focusableElements = this.querySelectorAll(
            'button, input, select, textarea, [tabindex], [contenteditable], a[href], [role="button"]'
          );
          
          if (focusableElements.length > 0) {
            console.log('🔧 [FixAriaHidden] Interceptado setAttribute aria-hidden, removendo:', this);
            this.removeAttribute('aria-hidden');
          }
        }, 0);
      }
      
      return result;
    };
    
    console.log('✅ [FixAriaHidden] Observer e interceptador ativos');
    
    // Retorna função para cleanup
    return () => {
      observer.disconnect();
      clearInterval(intervalId);
      Element.prototype.setAttribute = originalSetAttribute;
      console.log('🔧 [FixAriaHidden] Cleanup completo');
    };
  }
  
  return () => {}; // Cleanup vazio para ambientes não-web
};

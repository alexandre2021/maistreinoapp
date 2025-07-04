// hooks/useModalManager.ts - VERSÃO GENÉRICA
import { useState } from 'react';

// ✅ Interface genérica para qualquer item selecionado
export interface ModalManagerConfig {
  [key: string]: boolean;
}

export const useModalManager = <T = any>(initialModals: ModalManagerConfig) => {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [modals, setModals] = useState<ModalManagerConfig>(initialModals);

  const openModal = (modalName: string, item?: T) => {
    if (item) setSelectedItem(item);
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: string) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    // Limpar item selecionado para modais específicos
    if (modalName.includes('Options') || modalName.includes('Delete')) {
      setSelectedItem(null);
    }
  };

  const closeAllModals = () => {
    const closedModals: ModalManagerConfig = {};
    Object.keys(modals).forEach(key => {
      closedModals[key] = false;
    });
    setModals(closedModals);
    setSelectedItem(null);
  };

  return {
    selectedItem,
    modals,
    openModal,
    closeModal,
    closeAllModals,
    setSelectedItem
  };
};
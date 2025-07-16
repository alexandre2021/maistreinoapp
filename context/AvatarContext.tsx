import React, { createContext, ReactNode, useContext, useState } from 'react';

interface AvatarContextType {
  avatarUri: string | null;
  setAvatarUri: (uri: string | null) => void;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error('useAvatar must be used within AvatarProvider');
  }
  return context;
};

export const AvatarProvider = ({ children }: { children: ReactNode }) => {
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  
  return (
    <AvatarContext.Provider value={{ avatarUri, setAvatarUri }}>
      {children}
    </AvatarContext.Provider>
  );
};
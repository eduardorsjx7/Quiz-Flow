import React, { createContext, useContext, useState, useCallback } from 'react';

type NavigationInterceptor = (path: string) => Promise<boolean>;

interface NavigationContextType {
  registerInterceptor: (interceptor: NavigationInterceptor | null) => void;
  checkNavigation: (path: string) => Promise<boolean>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [interceptor, setInterceptor] = useState<NavigationInterceptor | null>(null);

  const registerInterceptor = useCallback((newInterceptor: NavigationInterceptor | null) => {
    setInterceptor(() => newInterceptor);
  }, []);

  const checkNavigation = useCallback(
    async (path: string): Promise<boolean> => {
      if (interceptor) {
        return await interceptor(path);
      }
      return true;
    },
    [interceptor]
  );

  return (
    <NavigationContext.Provider value={{ registerInterceptor, checkNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation deve ser usado dentro de um NavigationProvider');
  }
  return context;
};



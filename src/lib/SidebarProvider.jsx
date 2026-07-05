import { createContext, useContext, useState, useCallback } from 'react';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [open, setOpen] = useState(true);
  const toggle = useCallback(() => setOpen(v => !v), []);
  return (
    <SidebarContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

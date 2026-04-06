import { createContext, useContext, useState, type ReactNode } from 'react';

export type Role = 'secretary' | 'doctor' | 'cto';

interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  clinicName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('secretary');

  return (
    <AuthContext.Provider value={{ role, setRole, clinicName: 'Clínica Saúde Vital (Demo)' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

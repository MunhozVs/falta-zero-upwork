import { useAuth } from '../../context/AuthContext';
import { Bell } from 'lucide-react';

export function Header() {
  const { role, setRole, clinicName } = useAuth();

  return (
    <header className="h-20 glass sticky top-0 z-40 w-full flex items-center justify-between px-8 border-b border-outline-variant/10">
      <div className="flex items-center gap-4">
        <h1 className="font-display font-semibold text-xl tracking-tight text-on-surface">
          {clinicName}
        </h1>
        <span className="bg-surface-container-low text-on-surface-variant text-xs font-medium px-2 py-1 rounded-full uppercase tracking-wider">
          Demo
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-on-surface-variant font-sans">
            Perfil:
          </label>
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm rounded-lg focus:ring-primary/50 focus:border-primary block w-full p-2.5 outline-none font-medium shadow-sm transition-all cursor-pointer"
            >
              <option value="secretary">👩‍💼 Secretária (Operacional)</option>
              <option value="doctor">👨‍⚕️ Médico (Estratégico)</option>
              <option value="cto">👨‍💻 CTO (Infra/Admin)</option>
            </select>
          </div>
        </div>

        <div className="h-6 w-px bg-outline-variant/20 hidden md:block"></div>

        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-tertiary-container border border-surface-container-lowest"></span>
        </button>
      </div>
    </header>
  );
}

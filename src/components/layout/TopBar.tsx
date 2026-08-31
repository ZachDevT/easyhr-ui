import { Search, Inbox, HelpCircle, Settings } from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import type { Role } from '../../context/RoleContext';
import { Input } from '../ui/Input';

export function TopBar() {
  const { role, setRole } = useRole();
  const roles: Role[] = ['Employee', 'Manager', 'HR Admin'];

  return (
    <header className="topbar">
      {/* Search */}
      <div className="topbar-search">
        <Input 
          type="text" 
          placeholder="Search people, documents..." 
          leftIcon={<Search size={15} />} 
          containerStyle={{ width: 288 }}
        />
      </div>

      <div className="topbar-actions">
        {/* Role Switcher */}
        <div className="role-switcher">
          {roles.map((r) => (
            <button
              key={r}
              className={`role-switcher-btn${role === r ? ' active' : ''}`}
              onClick={() => setRole(r)}
            >
              {r}
            </button>
          ))}
        </div>

        <button className="topbar-icon-btn">
          <Inbox size={18} strokeWidth={2} />
          {role !== 'Employee' && <span className="topbar-badge">3</span>}
        </button>
        <button className="topbar-icon-btn">
          <HelpCircle size={18} strokeWidth={2} />
        </button>
        <button className="topbar-icon-btn">
          <Settings size={18} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}

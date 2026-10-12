import { Search, Inbox, HelpCircle, Settings } from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { useCompany } from '../../context/CompanyContext';
import { Input } from '../ui/Input';

export function TopBar() {
  const { role } = useRole();
  const { userProfile } = useCompany();

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
        {/* Dynamic Role Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderRadius: 20,
          background: 'var(--primary-tint)',
          color: 'var(--primary)',
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
          <span>{userProfile?.role || role}</span>
        </div>

        <button className="topbar-icon-btn" title="Inbox & Notifications">
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

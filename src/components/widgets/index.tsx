import { useState } from 'react';
import {
  Clock,
  CalendarDays,
  Megaphone,
  ChevronDown,
  ChevronRight,
  CalendarPlus,
  Palmtree,
  CalendarHeart,
  FileSignature,
  UserCircle2,
  UserPlus,
  Sun,
  Users,
  Gift,
  Building,
  X
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { employees } from '../../data/employees';
import { timeSummary, weekEntries } from '../../data/timeData';
import { timeOffBalances } from '../../data/timeOff';

export interface WidgetDef {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  default: boolean;
}

export const OPTIONAL_WIDGETS: WidgetDef[] = [
  { id: 'feed',        label: 'Company Feed',          desc: 'News and announcements',     icon: <Megaphone size={18} strokeWidth={2} />,     default: true  },
  { id: 'birthdays',   label: 'Upcoming Birthdays',    desc: 'Celebrate teammates',        icon: <Gift size={18} strokeWidth={2} />,          default: true  },
  { id: 'new-hires',   label: 'New Hires',             desc: 'Recently joined team',       icon: <UserPlus size={18} strokeWidth={2} />,      default: false },
  { id: 'holidays',    label: 'Company Holidays',      desc: 'Public & company holidays',  icon: <Sun size={18} strokeWidth={2} />,           default: false },
  { id: 'org-updates', label: 'Org Updates',           desc: 'Team changes and moves',     icon: <Users size={18} strokeWidth={2} />,         default: false },
  { id: 'signatures',  label: 'Pending Signatures',    desc: 'Docs needing your sign',     icon: <FileSignature size={18} strokeWidth={2} />, default: false },
];

export function CompulsoryMyTimeWidget() {
  const [clockModal, setClockModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeProject, setActiveProject] = useState('Production');

  return (
    <Card>
      <CardHeader title="My Time" icon={<Clock size={16} strokeWidth={2.5} />} />
      <CardBody>
        <div className="text-center">
          <p className="text-xs text-2">Not Clocked In</p>
          <p className="gradient-text mt-6 mb-4" style={{ fontSize: 32, letterSpacing: '-0.5px' }}>
            {timeSummary.today}
          </p>
          <p className="text-xs text-5">Clocked Out: Sep 25 at 5:00 PM</p>

          <div className="row gap-8 mt-20" style={{ position: 'relative' }}>
            <button
              className="btn-primary w-full"
              style={{ flex: 1, padding: '12px 24px', fontSize: 14 }}
              onClick={() => {
                // Mimic working thing
                timeSummary.isClocked = !timeSummary.isClocked;
                setClockModal(false);
              }}
            >
              <Clock size={16} strokeWidth={2} />
              {timeSummary.isClocked ? 'Clock Out' : `Clock In: ${activeProject}`}
            </button>
            <button 
              className="btn-circle" 
              style={{ width: 42, height: 42 }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <ChevronDown size={16} strokeWidth={2} />
            </button>
            
            {dropdownOpen && (
              <div 
                style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  right: 0, 
                  marginTop: 8, 
                  background: 'var(--card-bg)', 
                  border: '1px solid var(--card-border)', 
                  borderRadius: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 50,
                  width: 220,
                  textAlign: 'left',
                  overflow: 'hidden'
                }}
              >
                {['Lunch', 'Meeting', 'Production', 'Training', 'Billable'].map(proj => (
                  <button 
                    key={proj}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      background: 'none', 
                      border: 'none', 
                      borderBottom: '1px solid var(--card-border)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: 'var(--text-1)'
                    }}
                    onClick={() => {
                      setActiveProject(proj);
                      setDropdownOpen(false);
                    }}
                  >
                    {proj}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="row mt-16 mb-6" style={{ justifyContent: 'center' }}>
            <span className="text-5 text-xs">Today &rarr; {timeSummary.today}</span>
          </div>
          <button
            className="text-xs fw-700"
            style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setClockModal(true)}
          >
            + Add Time Entry
          </button>
        </div>

        <div className="divider" style={{ margin: '20px 0 16px' }} />

        <div className="row-between">
          <div>
            <p className="text-xs text-5 mb-4">This Week</p>
            <p className="text-sm text-1">{timeSummary.thisWeek}</p>
          </div>
          <div>
            <p className="text-xs text-5 mb-4">Pay Period</p>
            <p className="text-sm text-1">{timeSummary.payPeriod}</p>
          </div>
          <button className="btn-neutral btn-sm">My Timesheet</button>
        </div>
      </CardBody>

      <Modal
        isOpen={clockModal}
        onClose={() => setClockModal(false)}
        title="Add Time Entry"
        footer={
          <>
            <button className="btn-neutral" onClick={() => setClockModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => setClockModal(false)}>Save</button>
          </>
        }
      >
        <div>
          <label className="form-label">Date</label>
          <div className="text-sm text-1">{weekEntries[4].day}, {weekEntries[4].date}</div>
        </div>
        <div className="grid-2">
          <div>
            <label className="form-label">Start Time*</label>
            <Input type="time" defaultValue="09:00" />
          </div>
          <div>
            <label className="form-label">Project</label>
            <Select>
              <option>-- Select --</option>
              <option>Internal Admin</option>
              <option>Client Work</option>
            </Select>
          </div>
        </div>
        <div>
          <label className="form-label">Note</label>
          <Textarea rows={3} placeholder="Add a note..." />
        </div>
      </Modal>
    </Card>
  );
}

export function CompulsoryTimeOffWidget() {
  const [modal, setModal] = useState(false);

  return (
    <Card>
      <CardHeader title="Time Off" icon={<CalendarDays size={16} strokeWidth={2.5} />} />
      <CardBody>
        <div className="row gap-16 mb-20">
          {timeOffBalances.slice(0, 2).map((b) => (
            <div key={b.type} style={{ flex: 1, textAlign: 'center' }}>
              {b.type === 'Vacation' ? (
                <Palmtree size={28} strokeWidth={1.5} style={{ color: 'var(--primary)', margin: '0 auto' }} />
              ) : (
                <CalendarHeart size={28} strokeWidth={1.5} style={{ color: 'var(--primary)', margin: '0 auto' }} />
              )}
              <p className="text-xs text-2 mt-8">{b.type}</p>
              <p className="text-xs text-5 mt-4">{b.hoursUsed}h used (YTD)</p>
            </div>
          ))}
          <button className="btn-circle"><ChevronRight size={15} strokeWidth={2} /></button>
        </div>

        <button
          className="btn-secondary w-full"
          style={{ padding: '12px 24px', fontSize: 14 }}
          onClick={() => setModal(true)}
        >
          <CalendarPlus size={16} strokeWidth={2.5} />
          Request Time Off
        </button>
      </CardBody>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Request Time Off"
        footer={
          <>
            <button className="btn-neutral" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => setModal(false)}>Submit Request</button>
          </>
        }
      >
        <div>
          <label className="form-label">Leave Type*</label>
          <Select>
            {timeOffBalances.map((b) => <option key={b.type}>{b.type}</option>)}
          </Select>
        </div>
        <div className="grid-2">
          <div>
            <label className="form-label">Start Date*</label>
            <Input type="date" />
          </div>
          <div>
            <label className="form-label">End Date*</label>
            <Input type="date" />
          </div>
        </div>
        <div>
          <label className="form-label">Note to Manager</label>
          <Textarea rows={3} placeholder="Reason for leave..." />
        </div>
      </Modal>
    </Card>
  );
}

const feedItems = [
  {
    icon: <UserCircle2 size={16} strokeWidth={2.5} />,
    title: 'Take a few minutes to complete your Self Assessment.',
    sub: 'Due Oct 1 (1 day left)',
  },
  {
    icon: <FileSignature size={16} strokeWidth={2.5} />,
    title: 'Direct Deposit Form is waiting for your signature.',
    sub: '2 hours ago',
  },
  {
    icon: <Megaphone size={16} strokeWidth={2.5} />,
    title: 'All Hands Meeting scheduled for Friday, Sep 12 at 3 PM.',
    sub: 'Yesterday',
  },
];

export function FeedWidget({ onRemove, preview }: { onRemove?: () => void; preview?: boolean }) {
  return (
    <Card className={preview ? '' : 'mb-16'}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon"><Megaphone size={16} strokeWidth={2.5} /></div>
          <h2 className="card-header-title">What's happening at Your Co</h2>
        </div>
        {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
      </div>
      <CardBody style={{ padding: '0 20px' }}>
        {feedItems.map((item, i) => (
          <div key={i} className="feed-item" style={{ padding: '16px 0', borderBottom: i === feedItems.length - 1 ? 'none' : '1px solid var(--card-border)' }}>
            <div className="icon-chip" style={{ width: 34, height: 34 }}>{item.icon}</div>
            <div className="feed-content">
              <p className="feed-title">{item.title}</p>
              <p className="feed-sub">{item.sub}</p>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

const birthdays = [
  { name: 'Grace Otieno',  date: 'Sep 5',  daysUntil: 0,  avatar: 'https://randomuser.me/api/portraits/women/28.jpg' },
  { name: 'Brian Ochieng', date: 'Sep 12', daysUntil: 7,  avatar: 'https://randomuser.me/api/portraits/men/52.jpg' },
  { name: 'Fatuma Ali',    date: 'Sep 25', daysUntil: 20, avatar: 'https://randomuser.me/api/portraits/women/17.jpg' },
];

export function BirthdaysWidget({ onRemove, preview }: { onRemove?: () => void; preview?: boolean }) {
  return (
    <Card className={preview ? '' : 'mb-16'}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon"><Gift size={16} strokeWidth={2.5} /></div>
          <h2 className="card-header-title">Upcoming Birthdays</h2>
        </div>
        {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
      </div>
      <CardBody style={{ padding: 0 }}>
        {birthdays.map((b) => (
          <div key={b.name} className="list-row" style={{ padding: '12px 20px' }}>
            <Avatar src={b.avatar} name={b.name} size="sm" />
            <div style={{ flex: 1 }}>
              <p className="text-sm text-1">{b.name}</p>
              <p className="text-xs text-5">{b.date}</p>
            </div>
            {b.daysUntil === 0
              ? <Badge variant="primary" style={{ fontSize: 11, padding: '2px 8px' }}>Today</Badge>
              : <span className="text-xs text-5">in {b.daysUntil}d</span>
            }
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

const newHires = employees.filter((e) => ['4','6','8'].includes(e.id));

export function NewHiresWidget({ onRemove, preview }: { onRemove?: () => void; preview?: boolean }) {
  return (
    <Card className={preview ? '' : 'mb-16'}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon"><UserPlus size={16} strokeWidth={2.5} /></div>
          <h2 className="card-header-title">New Hires</h2>
        </div>
        {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
      </div>
      <CardBody style={{ padding: 0 }}>
        {newHires.map((emp) => (
          <div key={emp.id} className="list-row" style={{ padding: '12px 20px' }}>
            <Avatar src={emp.avatar} name={`${emp.firstName} ${emp.lastName}`} size="sm" />
            <div style={{ flex: 1 }}>
              <p className="text-sm text-1">{emp.firstName} {emp.lastName}</p>
              <p className="text-xs text-5">{emp.title} · {emp.department}</p>
            </div>
            <Badge variant="success" style={{ fontSize: 11, padding: '2px 8px' }}>New</Badge>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

const holidays = [
  { name: 'National Day',  date: 'Sep 12, 2026' },
  { name: 'Moi Day',       date: 'Oct 10, 2026' },
  { name: 'Jamhuri Day',   date: 'Dec 12, 2026' },
  { name: 'Christmas Day', date: 'Dec 25, 2026' },
];

export function HolidaysWidget({ onRemove, preview }: { onRemove?: () => void; preview?: boolean }) {
  return (
    <Card className={preview ? '' : 'mb-16'}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon"><Sun size={16} strokeWidth={2.5} /></div>
          <h2 className="card-header-title">Company Holidays</h2>
        </div>
        {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
      </div>
      <CardBody style={{ padding: 0 }}>
        {holidays.map((h) => (
          <div key={h.name} className="list-row" style={{ padding: '12px 20px' }}>
            <div className="icon-chip" style={{ width: 32, height: 32 }}><Building size={14} strokeWidth={2.5} /></div>
            <div style={{ flex: 1 }}>
              <p className="text-sm text-1">{h.name}</p>
              <p className="text-xs text-5">{h.date}</p>
            </div>
            <Badge variant="neutral" style={{ fontSize: 11, padding: '2px 8px' }}>Holiday</Badge>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

export function OrgUpdatesWidget({ onRemove, preview }: { onRemove?: () => void; preview?: boolean }) {
  return (
    <Card className={preview ? '' : 'mb-16'}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon"><Users size={16} strokeWidth={2.5} /></div>
          <h2 className="card-header-title">Org Updates</h2>
        </div>
        {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
      </div>
      <CardBody>
        <div className="feed-item" style={{ paddingTop: 0 }}>
          <Avatar src="https://randomuser.me/api/portraits/women/65.jpg" name="Amina Hassan" size="sm" />
          <div className="feed-content">
            <p className="feed-title"><strong>Amina Hassan</strong> was promoted to Senior Marketing Manager.</p>
            <p className="feed-sub">2 days ago</p>
          </div>
        </div>
        <div className="feed-item" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <Avatar src="https://randomuser.me/api/portraits/men/71.jpg" name="Peter Njoroge" size="sm" />
          <div className="feed-content">
            <p className="feed-title"><strong>Peter Njoroge</strong> transferred to Platform Engineering.</p>
            <p className="feed-sub">1 week ago</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function SignaturesWidget({ onRemove, preview }: { onRemove?: () => void; preview?: boolean }) {
  return (
    <Card className={preview ? '' : 'mb-16'}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-header-icon"><FileSignature size={16} strokeWidth={2.5} /></div>
          <h2 className="card-header-title">Pending Signatures</h2>
        </div>
        {onRemove && <button className="widget-remove-btn" onClick={onRemove}><X size={11} /></button>}
      </div>
      <CardBody>
        {['Employment Contract.pdf','Employee Handbook Acknowledgement.pdf'].map((name, i, arr) => (
          <div key={name} className="doc-card" style={{ marginBottom: i === arr.length - 1 ? 0 : 12 }}>
            <div className="doc-card-icon" style={{ width: 34, height: 34 }}><FileSignature size={16} strokeWidth={2.5} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="doc-card-name">{name}</div>
              <div className="doc-card-sub">Awaiting your signature</div>
            </div>
            <button className="btn-primary btn-sm" style={{ padding: '4px 12px', fontSize: 12 }}>Sign</button>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

export type WidgetFC = React.FC<{ onRemove?: () => void; preview?: boolean }>;
export const WIDGET_MAP: Record<string, WidgetFC> = {
  'feed':        FeedWidget,
  'birthdays':   BirthdaysWidget,
  'new-hires':   NewHiresWidget,
  'holidays':    HolidaysWidget,
  'org-updates': OrgUpdatesWidget,
  'signatures':  SignaturesWidget,
};

import Link from 'next/link';
import { Briefcase, MapPin, Clock, ArrowRight } from 'lucide-react';

const OPEN_ROLES = [
  { id: 1, title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', type: 'Full-Time', posted: '2 weeks ago' },
  { id: 2, title: 'Product Manager', department: 'Product', location: 'New York, NY', type: 'Full-Time', posted: '5 days ago' },
];

export default function CareersPage() {
  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{ background: '#111827', color: 'white', padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="row gap-12 align-center">
          <div style={{ width: 40, height: 40, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 20 }}>
            E
          </div>
          <span className="fw-800 text-xl text-white">EasyHR Careers</span>
        </div>
        <div className="row gap-24 fw-600 text-sm">
          <Link href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>About Us</Link>
          <Link href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Benefits</Link>
          <Link href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Culture</Link>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: 'var(--gradient)', padding: '120px 48px', textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontSize: 64, fontWeight: 800, margin: '0 0 24px 0', fontFamily: 'var(--font-heading)' }}>Do the best work of your life.</h1>
        <p style={{ fontSize: 24, maxWidth: 800, margin: '0 auto', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
          Join our mission to revolutionize the way companies manage their most valuable asset—their people.
        </p>
      </div>

      {/* Job Listings */}
      <div style={{ maxWidth: 1000, margin: '-60px auto 100px auto', position: 'relative' }}>
        <div style={{ background: 'white', padding: 48, borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
          <div className="row-between align-center mb-40">
            <h2 className="text-3xl fw-800 text-1 m-0">Open Roles</h2>
            <div className="row gap-16 align-center text-sm fw-600 text-4">
              <span>Filter by:</span>
              <select className="select" style={{ padding: '8px 16px', background: '#F9FAFB' }}>
                <option>All Departments</option>
                <option>Engineering</option>
                <option>Product</option>
              </select>
            </div>
          </div>
          
          <div className="col gap-24">
            {OPEN_ROLES.map(role => (
              <Link key={role.id} href={`/careers/preview`} style={{ textDecoration: 'none' }}>
                <div className="hover-scale" style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 32, transition: 'all 0.2s', cursor: 'pointer' }}>
                  <div className="row-between align-center">
                    <div>
                      <h3 className="text-2xl fw-800 text-1 m-0 mb-12">{role.title}</h3>
                      <div className="row gap-16 text-base text-5 fw-500">
                        <span className="row gap-8 align-center"><Briefcase size={18}/> {role.department}</span>
                        <span>•</span>
                        <span className="row gap-8 align-center"><MapPin size={18}/> {role.location}</span>
                        <span>•</span>
                        <span className="row gap-8 align-center"><Clock size={18}/> {role.type}</span>
                      </div>
                    </div>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <ArrowRight size={24}/>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

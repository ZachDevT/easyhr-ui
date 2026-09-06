"use client";

import { useState } from 'react';
import { PieChart as PieChartIcon, Download, Users, TrendingDown, Target, Clock, Filter, Calendar } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatRibbon } from '@/components/ui/StatRibbon';
import { employees } from '@/data/employees';
import { useOperations } from '@/context/OperationsContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const headcountData = [
  { month: 'Jan', count: 42 }, { month: 'Feb', count: 45 },
  { month: 'Mar', count: 48 }, { month: 'Apr', count: 48 },
  { month: 'May', count: 52 }, { month: 'Jun', count: 56 },
  { month: 'Jul', count: 58 }, { month: 'Aug', count: 64 },
  { month: 'Sep', count: 72 }, { month: 'Oct', count: 78 },
];

const diversityData = [
  { name: 'Engineering', value: 35 },
  { name: 'Sales', value: 20 },
  { name: 'Marketing', value: 15 },
  { name: 'Operations', value: 18 },
  { name: 'HR', value: 12 },
];
const DIVERSITY_COLORS = ['#A238FF', '#FF3EA5', '#0F9D58', '#F59E0B', '#3B82F6'];

const compData = [
  { dept: 'Engineering', avgSalary: 125000 },
  { dept: 'Sales', avgSalary: 95000 },
  { dept: 'Marketing', avgSalary: 85000 },
  { dept: 'Operations', avgSalary: 75000 },
  { dept: 'HR', avgSalary: 80000 },
];

export default function ReportsPage() {
  const { role, currentUser } = useRole();
  const { requests } = useOperations();
  const [dateRange, setDateRange] = useState('Year to Date');

  if (role === 'Employee') {
    return (
      <div style={{ textAlign: 'center', marginTop: 80 }}>
        <p className="text-4">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  if (role === 'Manager') return <ManagerTeamReport managerName={`${currentUser.firstName} ${currentUser.lastName}`} requests={requests} dateRange={dateRange} setDateRange={setDateRange} />;

  return (
    <div className="page-container" style={{ background: 'var(--bg-page)', minHeight: '100%' }}>
      
      {/* Executive Header */}
      <div className="row-between mb-32">
        <div>
          <h1 className="page-title text-primary m-0" style={{ fontSize: 24, fontWeight: 700 }}>Executive Dashboard</h1>
          <p className="text-sm text-4 mt-4">Real-time insights and company analytics.</p>
        </div>
        <div className="row gap-12">
          <div className="row gap-8 px-16 py-8" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8 }}>
            <Calendar size={14} className="text-5" />
            <select className="text-sm fw-600 text-1" style={{ border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer' }} value={dateRange} onChange={e => setDateRange(e.target.value)}>
              <option>Year to Date</option>
              <option>Last Quarter</option>
              <option>Last 12 Months</option>
            </select>
          </div>
          <button className="btn-primary">
            <Download size={14} strokeWidth={2} /> Export Report
          </button>
        </div>
      </div>

      {/* Advanced KPI Strip */}
      <div className="grid-4 mb-32">
        {[
          { label: 'Total Headcount', value: '78', sub: '+12% vs last period', icon: <Users size={20}/>, trend: 'up' },
          { label: 'Turnover Rate', value: '4.2%', sub: '-1.1% vs last period', icon: <TrendingDown size={20}/>, trend: 'down' },
          { label: 'Open Roles', value: '12', sub: 'Active in ATS', icon: <Target size={20}/>, trend: 'neutral' },
          { label: 'Avg Time to Fill', value: '18d', sub: '-2 days vs last period', icon: <Clock size={20}/>, trend: 'down' },
        ].map((s, i) => (
          <Card key={i} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: 'none' }}>
            <CardBody style={{ padding: 24 }}>
              <div className="row-between mb-16">
                <div className="text-sm fw-700 text-5 text-uppercase" style={{ letterSpacing: '0.5px' }}>{s.label}</div>
                <div className="icon-chip" style={{ width: 40, height: 40, background: 'var(--primary-tint)', color: 'var(--primary)' }}>{s.icon}</div>
              </div>
              <div className="text-4xl fw-800 text-1 mb-8" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>{s.value}</div>
              <div className="text-xs fw-600 row gap-4" style={{ color: s.trend === 'down' ? 'var(--success)' : s.trend === 'up' ? 'var(--primary)' : 'var(--text-4)' }}>
                {s.sub}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid-2 gap-32 mb-32">
        {/* Headcount Trend */}
        <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: 'none' }}>
          <div className="row-between" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
            <div className="row gap-12">
              <TrendingDown size={20} className="text-primary" />
              <h2 className="text-lg fw-700 text-1 m-0">Headcount Growth</h2>
            </div>
            <Badge variant="primary">Year to Date</Badge>
          </div>
          <CardBody style={{ padding: '32px 24px 16px 12px' }}>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <AreaChart data={headcountData}>
                  <defs>
                    <linearGradient id="hc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A238FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#A238FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#9A998F" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#9A998F" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Questrial', padding: '12px 16px' }} 
                    itemStyle={{ fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#A238FF" strokeWidth={3} fillOpacity={1} fill="url(#hc)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Department Diversity (Donut) */}
        <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: 'none' }}>
          <div className="row-between" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
            <div className="row gap-12">
              <PieChartIcon size={20} className="text-primary" />
              <h2 className="text-lg fw-700 text-1 m-0">Department Distribution</h2>
            </div>
          </div>
          <CardBody style={{ padding: '32px 24px' }}>
            <div style={{ width: '100%', height: 320, display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diversityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={130}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {diversityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DIVERSITY_COLORS[index % DIVERSITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Questrial' }} 
                  />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bottom Chart: Compensation */}
      <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: 'none', marginBottom: 32 }}>
        <div className="row-between" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
          <div className="row gap-12">
            <Target size={20} className="text-primary" />
            <h2 className="text-lg fw-700 text-1 m-0">Avg Compensation by Department</h2>
          </div>
          <button className="btn-secondary btn-sm" style={{ background: 'white' }}><Filter size={14}/> Filter</button>
        </div>
        <CardBody style={{ padding: '40px 32px 24px 12px' }}>
          <div style={{ width: '100%', height: 340 }}>
            <ResponsiveContainer>
              <BarChart data={compData} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="dept" stroke="#9A998F" fontSize={13} fontWeight={600} tickLine={false} axisLine={false} dy={16} />
                <YAxis 
                  stroke="#9A998F" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${val / 1000}k`}
                  dx={-10}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--primary-tint)' }} 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Questrial' }} 
                  formatter={(value: unknown) => [`$${Number(value).toLocaleString()}`, 'Avg Salary']}
                />
                <Bar dataKey="avgSalary" fill="url(#compGradient)" radius={[8, 8, 0, 0]} barSize={48}>
                  {compData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--primary)' : '#EAEAE4'} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="compGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A238FF" />
                    <stop offset="100%" stopColor="#FF3EA5" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
      
    </div>
  );
}

function ManagerTeamReport({managerName,requests,dateRange,setDateRange}:{managerName:string;requests:ReturnType<typeof useOperations>['requests'];dateRange:string;setDateRange:(value:string)=>void}){const team=employees.filter(e=>e.manager===managerName);const ids=new Set(team.map(e=>e.id));const teamLeave=requests.filter(r=>ids.has(r.employeeId));const attendance=[{day:'Mon',present:team.length,away:0},{day:'Tue',present:Math.max(0,team.length-1),away:1},{day:'Wed',present:team.length,away:0},{day:'Thu',present:team.length,away:0},{day:'Fri',present:Math.max(0,team.length-1),away:1}];return <><PageHeader title="Team Reports" subtitle={`Private manager analytics for ${managerName}’s direct reports only.`} icon={<PieChartIcon size={28}/>} actions={<div className="row gap-8" style={{background:'white',borderRadius:9,padding:'7px 12px',color:'var(--text-1)'}}><Calendar size={14}/><select value={dateRange} onChange={e=>setDateRange(e.target.value)} style={{border:0,outline:0,fontFamily:'inherit'}}><option>Year to Date</option><option>Last Quarter</option><option>Last 30 Days</option></select></div>}/><main style={{padding:'0 24px 32px'}}><StatRibbon stats={[{label:'Direct reports',value:team.length,icon:<Users size={20}/>,color:'var(--primary)'},{label:'Attendance rate',value:'96%',trend:'+2 pts',trendType:'positive',icon:<Clock size={20}/>,color:'var(--success)'},{label:'Pending leave',value:teamLeave.filter(r=>r.status.startsWith('Pending')).length,icon:<Calendar size={20}/>,color:'var(--warning)'},{label:'Goals on track',value:'82%',description:'Team average',icon:<Target size={20}/>,color:'var(--text-4)'}]}/><div style={{display:'grid',gridTemplateColumns:'1.35fr .85fr',gap:20,marginTop:20}}><Card><CardBody><div className="row-between mb-24"><div><h2 className="text-xl fw-800 text-1 m-0">Weekly attendance</h2><p className="text-sm text-4">Present and away across your team</p></div><Badge variant="primary">Team only</Badge></div><div style={{height:280}}><ResponsiveContainer><BarChart data={attendance}><CartesianGrid vertical={false} stroke="var(--border)"/><XAxis dataKey="day" axisLine={false} tickLine={false}/><YAxis allowDecimals={false} axisLine={false} tickLine={false}/><RechartsTooltip/><Bar dataKey="present" stackId="a" fill="#A238FF" radius={[6,6,0,0]}/><Bar dataKey="away" stackId="a" fill="#F3D8FF"/></BarChart></ResponsiveContainer></div></CardBody></Card><Card><CardBody><h2 className="text-xl fw-800 text-1 m-0 mb-4">Team composition</h2><p className="text-sm text-4">Your direct reports by status</p><div style={{padding:'24px 0',textAlign:'center'}}><strong style={{fontSize:48,color:'var(--primary)'}}>{team.length}</strong><div className="text-xs text-5">DIRECT REPORTS</div></div>{team.map(e=><div key={e.id} className="row-between" style={{padding:'11px 0',borderTop:'1px solid var(--border)'}}><span className="text-sm fw-700 text-1">{e.firstName} {e.lastName}</span><Badge variant={e.status==='Active'?'success':'warning'}>{e.status}</Badge></div>)}</CardBody></Card><Card><CardBody><h2 className="text-xl fw-800 text-1 m-0 mb-4">Leave usage</h2><p className="text-sm text-4">Approved and pending hours for your team</p>{team.map(e=>{const rs=teamLeave.filter(r=>r.employeeId===e.id);return <div key={e.id} style={{padding:'14px 0',borderBottom:'1px solid var(--border)'}}><div className="row-between"><b className="text-sm">{e.firstName} {e.lastName}</b><span className="text-xs text-4">{rs.reduce((s,r)=>s+r.hours,0)}h requested</span></div></div>})}</CardBody></Card><Card><CardBody><h2 className="text-xl fw-800 text-1 m-0 mb-4">Performance pulse</h2><p className="text-sm text-4">Manager planning signals—not company analytics</p><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:18}}><div style={{padding:18,background:'var(--primary-tint)',borderRadius:11}}><strong style={{fontSize:28,color:'var(--primary)'}}>82%</strong><div className="text-xs text-4">Goals on track</div></div><div style={{padding:18,background:'rgba(22,163,74,.09)',borderRadius:11}}><strong style={{fontSize:28,color:'var(--success)'}}>4.3</strong><div className="text-xs text-4">Check-in score</div></div></div></CardBody></Card></div></main></>}

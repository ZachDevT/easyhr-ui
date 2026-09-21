"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { MessageSquare, Eye, Plus, Paperclip, UploadCloud } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';

// Mock data
const mockTickets = [
  {
    id: 'TKT-1021',
    user: { name: 'David Kimani', email: 'dkimani@easyhr.com', avatar: 'https://i.pravatar.cc/150?u=dk' },
    subject: 'Cannot access my payslip for August',
    status: 'Open',
    createdAt: '2026-09-06T08:30:00Z',
    message: 'Hi Support, I am trying to view my August payslip but the page is throwing an error. Can you help?',
  },
  {
    id: 'TKT-1020',
    user: { name: 'Amina Hassan', email: 'ahassan@easyhr.com', avatar: 'https://i.pravatar.cc/150?u=ah' },
    subject: 'Update direct deposit information',
    status: 'In Progress',
    createdAt: '2026-09-05T14:15:00Z',
    message: 'Hello, I need to update my bank account for direct deposits before the next payroll cycle.',
  },
  {
    id: 'TKT-1019',
    user: { name: 'Grace Otieno', email: 'gotieno@easyhr.com', avatar: 'https://i.pravatar.cc/150?u=go' },
    subject: 'Missing time off approval',
    status: 'Resolved',
    createdAt: '2026-09-04T09:45:00Z',
    message: 'My manager approved my time off but it is not reflecting on my balance.',
  },
];

export default function SupportDashboard() {
  const [activeTab, setActiveTab] = useState<'All' | 'Open' | 'In Progress' | 'Resolved'>('Open');
  const [selectedTicket, setSelectedTicket] = useState<typeof mockTickets[0] | null>(null);
  const [replyText, setReplyText] = useState('');
  
  // New Ticket State
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');

  const filteredTickets = mockTickets.filter(t => activeTab === 'All' || t.status === activeTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'warning';
      case 'In Progress': return 'primary';
      case 'Resolved': return 'success';
      default: return 'neutral';
    }
  };

  const handleReply = () => {
    console.log(`Replying to ${selectedTicket?.id}: ${replyText}`);
    setSelectedTicket(null);
    setReplyText('');
  };

  const handleCreateTicket = () => {
    console.log('Creating new ticket:', { newTicketSubject, newTicketMessage });
    setIsNewTicketModalOpen(false);
    setNewTicketSubject('');
    setNewTicketMessage('');
  };

  return (
    <>
      <PageHeader 
        title="Support Tickets" 
        subtitle="Manage and respond to employee support inquiries."
        actions={
          <Button variant="primary" onClick={() => setIsNewTicketModalOpen(true)}>
            <Plus size={16} /> New Ticket
          </Button>
        }
      />

      <div style={{ padding: '0 32px 32px' }}>
        <Card>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '16px 24px', gap: 24 }}>
            {['Open', 'In Progress', 'Resolved', 'All'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab ? 600 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  padding: '8px 0',
                  borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: -17,
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ padding: '0' }}>
            {filteredTickets.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
                <MessageSquare size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <p>No tickets found in this view.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredTickets.map((ticket, index) => (
                  <div 
                    key={ticket.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '16px 24px',
                      borderBottom: index < filteredTickets.length - 1 ? '1px solid var(--border)' : 'none',
                      gap: 16
                    }}
                  >
                    <Avatar src={ticket.user.avatar} name={ticket.user.name} size="md" />
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{ticket.subject}</strong>
                        <Badge color={getStatusColor(ticket.status) as any}>{ticket.status}</Badge>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span>{ticket.user.name}</span>
                        <span>•</span>
                        <span>{ticket.id}</span>
                        <span>•</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <Button variant="secondary" onClick={() => setSelectedTicket(ticket)}>
                      <Eye size={16} /> View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* View & Reply Ticket Modal */}
      <Modal 
        isOpen={!!selectedTicket} 
        onClose={() => setSelectedTicket(null)}
        title={`Ticket: ${selectedTicket?.id}`}
      >
        {selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar src={selectedTicket.user.avatar} name={selectedTicket.user.name} size="md" />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{selectedTicket.user.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{selectedTicket.user.email}</div>
                  </div>
                </div>
                <Badge color={getStatusColor(selectedTicket.status) as any}>{selectedTicket.status}</Badge>
              </div>
              <h4 style={{ margin: '0 0 8px', fontSize: 16, color: 'var(--text-primary)' }}>{selectedTicket.subject}</h4>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, background: 'var(--bg-page)', padding: 16, borderRadius: 8 }}>
                {selectedTicket.message}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
              <h5 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Reply to Ticket</h5>
              <Textarea 
                placeholder="Type your response here..." 
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              
              {/* File upload for reply */}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                 <label style={{ 
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, 
                    color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 
                 }}>
                   <Paperclip size={16} /> Attach Files
                   <input type="file" multiple style={{ display: 'none' }} />
                 </label>
                 <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>(Max 10MB)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 12 }}>
                <Button variant="secondary" onClick={() => setSelectedTicket(null)}>Cancel</Button>
                <Button variant="primary" onClick={handleReply} disabled={!replyText.trim()}>Send Reply</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* New Ticket Modal */}
      <Modal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        title="Create New Support Ticket"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
              Subject
            </label>
            <Input 
              placeholder="e.g. Need assistance with benefits enrollment" 
              value={newTicketSubject}
              onChange={(e) => setNewTicketSubject(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
              Message
            </label>
            <Textarea 
              placeholder="Provide details about your request..." 
              rows={5}
              value={newTicketMessage}
              onChange={(e) => setNewTicketMessage(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
              Attachments
            </label>
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              border: '2px dashed var(--border)',
              borderRadius: '8px',
              background: 'var(--bg-page)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'border 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <UploadCloud size={24} style={{ color: 'var(--primary)', marginBottom: 8 }} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>Click to upload files</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>PNG, JPG, PDF up to 10MB</span>
              <input type="file" multiple style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <Button variant="secondary" onClick={() => setIsNewTicketModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateTicket} disabled={!newTicketSubject.trim() || !newTicketMessage.trim()}>
              Create Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

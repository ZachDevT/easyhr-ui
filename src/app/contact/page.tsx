"use client";

import React, { useState } from 'react';
import { PublicNav, PublicFooter } from "@/components/marketing/PublicNav";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import styles from "./contact.module.css";
import { CheckCircle2, Mail, Phone, MapPin, UploadCloud, HelpCircle } from "lucide-react";

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
    }, 1200);
  };

  return (
    <div className={styles.site}>
      <PublicNav />
      <main className={styles.main}>
        <div className={styles.container}>
          
          <div className={styles.header}>
            <h1>Get in touch</h1>
            <p>
              We're here to help and answer any questions you might have. We look forward to hearing from you.
            </p>
          </div>

          <div className={styles.contentGrid}>
            {/* Contact Information Sidebar */}
            <div className={styles.contactInfo}>
              <div className={styles.infoBlock}>
                <h3>Chat with sales</h3>
                <p>Speak to our friendly team.</p>
                <a href="mailto:sales@easyhr.com" className={styles.infoLink}>
                  <Mail size={16} /> sales@easyhr.com
                </a>
              </div>

              <div className={styles.infoBlock}>
                <h3>Support</h3>
                <p>We're here to help with any technical issues.</p>
                <a href="mailto:support@easyhr.com" className={styles.infoLink}>
                  <HelpCircle size={16} /> support@easyhr.com
                </a>
              </div>

              <div className={styles.infoBlock}>
                <h3>Call us</h3>
                <p>Mon-Fri from 8am to 5pm.</p>
                <a href="tel:+254700000000" className={styles.infoLink}>
                  <Phone size={16} /> +254 (0) 700 000 000
                </a>
              </div>

              <div className={styles.infoBlock}>
                <h3>Visit us</h3>
                <p>Come say hello at our office HQ.</p>
                <div className={styles.infoText}>
                  <MapPin size={16} />
                  <span>
                    100 Innovation Drive<br />
                    Westlands, Nairobi<br />
                    Kenya
                  </span>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className={styles.formCard}>
              {status === 'success' ? (
                <div className={styles.successState}>
                  <CheckCircle2 size={56} className={styles.successIcon} />
                  <h2>Message Sent Successfully!</h2>
                  <p>Thanks for reaching out. A member of our team will review your request and get back to you within 24 hours.</p>
                  <Button variant="secondary" onClick={() => setStatus('idle')} style={{ marginTop: 16 }}>
                    Submit another request
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                  <h2 className={styles.formTitle}>Send us a message</h2>
                  
                  <div className={styles.row}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>First Name *</label>
                      <Input placeholder="Jane" required name="firstName" />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Last Name *</label>
                      <Input placeholder="Doe" required name="lastName" />
                    </div>
                  </div>
                  
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Email Address *</label>
                    <Input type="email" placeholder="jane@company.com" required name="email" />
                  </div>
                  
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>How can we help? *</label>
                    <Select required name="reason" defaultValue="">
                      <option value="" disabled>Select a topic...</option>
                      <option value="sales">Sales Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing & Invoices</option>
                      <option value="partnership">Partnerships</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>
                  
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Subject *</label>
                    <Input placeholder="Briefly describe your request" required name="subject" />
                  </div>
                  
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Message *</label>
                    <Textarea 
                      placeholder="Please provide as much detail as possible..." 
                      rows={5} 
                      required 
                      name="message"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Attachments (Optional)</label>
                    <div className={styles.fileUploadArea}>
                      <input 
                        type="file" 
                        id="fileUpload" 
                        className={styles.fileInput} 
                        multiple 
                        accept=".pdf,.doc,.docx,.jpg,.png"
                      />
                      <label htmlFor="fileUpload" className={styles.fileLabel}>
                        <UploadCloud size={24} className={styles.uploadIcon} />
                        <span className={styles.uploadText}>
                          <b>Click to upload</b> or drag and drop
                        </span>
                        <span className={styles.uploadHint}>
                          SVG, PNG, JPG or PDF (max. 10MB)
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  <Button 
                    variant="primary" 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? 'Sending Message...' : 'Send Message'}
                  </Button>
                  
                  <p className={styles.privacyNote}>
                    By submitting this form, you agree to our <a href="#">Privacy Policy</a> and <a href="#">Terms of Service</a>.
                  </p>
                </form>
              )}
            </div>
          </div>

        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

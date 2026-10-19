"use client";
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { AuthField, AuthShell, authStyles as s } from '@/components/auth/AuthShell';
import { useClerk, useAuth } from '@clerk/nextjs';

function SignUpContent() {
  const clerk = useClerk();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const signUp = clerk?.client?.signUp;
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectUrl = searchParams.get('redirect_url') || '';
  const initialEmail = searchParams.get('email') || '';
  const postAuthDestination = redirectUrl || '/company/register';

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace(postAuthDestination);
    }
  }, [authLoaded, isSignedIn, postAuthDestination, router]);

  const [firstName, setFirstName]                     = useState('');
  const [lastName, setLastName]                       = useState('');
  const [emailAddress, setEmailAddress]               = useState(initialEmail);
  const [password, setPassword]                       = useState('');
  const [showPassword, setShowPassword]               = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode]                               = useState('');
  const [error, setError]                             = useState('');
  const [isSubmitting, setIsSubmitting]               = useState(false);

  useEffect(() => {
    if (initialEmail && !emailAddress) {
      setEmailAddress(initialEmail);
    }
  }, [initialEmail, emailAddress]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await signUp.create({ firstName, lastName, emailAddress, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign-up error:', err);
      const clerkErr = err?.errors?.[0];
      if (clerkErr?.code === 'form_identifier_exists') {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(clerkErr?.longMessage || clerkErr?.message || err?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    if (code.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    setError('');
    setIsSubmitting(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === 'complete') {
        await clerk.setActive({ session: result.createdSessionId });
        router.push(postAuthDestination);
        return;
      }

      if (result.status === 'missing_requirements') {
        const missing = result.missingFields ?? [];
        if (missing.includes('username')) {
          const f = (firstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
          const l = (lastName || 'member').toLowerCase().replace(/[^a-z0-9]/g, '') || 'member';
          const rand = Math.random().toString(36).substring(2, 7);
          const slug = `${f}_${l}_${rand}`.slice(0, 24);

          const updated = await result.update({ username: slug });
          if (updated.status === 'complete' && updated.createdSessionId) {
            await clerk.setActive({ session: updated.createdSessionId });
            router.push(postAuthDestination);
            return;
          }
          const retry = await updated.attemptEmailAddressVerification({ code });
          if (retry.status === 'complete' && retry.createdSessionId) {
            await clerk.setActive({ session: retry.createdSessionId });
            router.push(postAuthDestination);
            return;
          }
        }
        setError('Your account needs additional info: ' + missing.join(', '));
        return;
      }

      setError('Unexpected status: ' + result.status);
    } catch (err: any) {
      console.error('Verify error:', err);
      const msg = (err?.errors?.[0]?.message ?? '').toLowerCase();
      if (msg.includes('already') && msg.includes('verified')) {
        if (signUp.status === 'missing_requirements' && signUp.missingFields?.includes('username')) {
          try {
            const f = (firstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
            const l = (lastName || 'member').toLowerCase().replace(/[^a-z0-9]/g, '') || 'member';
            const rand = Math.random().toString(36).substring(2, 7);
            const slug = `${f}_${l}_${rand}`.slice(0, 24);
            const updated = await signUp.update({ username: slug });
            if (updated.status === 'complete' && updated.createdSessionId) {
              await clerk.setActive({ session: updated.createdSessionId });
              router.push(postAuthDestination);
              return;
            }
          } catch (updateErr) {
            console.error('Username recovery error:', updateErr);
          }
        }
        if (signUp.status === 'complete' && signUp.createdSessionId) {
          await clerk.setActive({ session: signUp.createdSessionId });
          router.push(postAuthDestination);
          return;
        }
      }
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Invalid code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendCode = async () => {
    if (!signUp) return;
    try {
      setError('');
      setCode('');
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    } catch {
      setError('Could not resend. Try again.');
    }
  };


  const notReady = isSubmitting || !signUp;

  if (pendingVerification) {
    return (
      <AuthShell eyebrow="Verify email" title="Check your inbox"
        subtitle={`We sent a 6-digit code to ${emailAddress}`}>
        <form onSubmit={handleVerify}>
          <div className={s.code}>
            {[0,1,2,3,4,5].map((i) => (
              <input key={i} type="text" inputMode="numeric" maxLength={1}
                autoFocus={i === 0} value={code[i] || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  const a = code.split(''); a[i] = val; setCode(a.join(''));
                  if (val && e.target.nextElementSibling) (e.target.nextElementSibling as HTMLElement).focus();
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
                  if (p) { setCode(p); const ins = e.currentTarget.parentElement?.querySelectorAll('input'); if (ins) (ins[Math.min(p.length,5)] as HTMLElement).focus(); }
                }}
                onKeyDown={(e) => {
                  if (e.key==='Backspace' && !code[i] && e.currentTarget.previousElementSibling) (e.currentTarget.previousElementSibling as HTMLElement).focus();
                }}
              />
            ))}
          </div>
          {error && <div className={s.errorAlert}><AlertCircle size={18} style={{flexShrink:0,marginTop:1}}/><div>{error}</div></div>}
          <div id="clerk-captcha"/>
          <button type="submit" disabled={isSubmitting} className={s.primaryButton}
            style={{width:'100%',marginTop:8,opacity:isSubmitting?0.7:1,cursor:isSubmitting?'not-allowed':'pointer'}}>
            {isSubmitting ? 'Verifying...' : 'Verify & Continue'} <ArrowRight size={16}/>
          </button>
          <div className={s.switch} style={{marginTop:16}}>
            Didn&apos;t receive it?{' '}
            <button type="button" onClick={resendCode}
              style={{background:'none',border:'none',cursor:'pointer',color:'var(--primary)',fontWeight:600,display:'inline-flex',alignItems:'center',gap:4,padding:0,fontSize:'inherit'}}>
              <RefreshCw size={13}/> Resend code
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  const isInviteFlow = redirectUrl.includes('onboarding');

  return (
    <AuthShell
      eyebrow={isInviteFlow ? "Join your team" : "Start your workspace"}
      title={isInviteFlow ? "Create your employee account" : "Create your EasyHR account"}
      subtitle={isInviteFlow ? "Set up your credentials to access your onboarding portal." : "You'll create your company and invite your team next."}
    >
      <form onSubmit={handleSignUp}>
        <div className={s.row}>
          <AuthField label="First name"><input placeholder="Amina" value={firstName} onChange={(e)=>setFirstName(e.target.value)} required/></AuthField>
          <AuthField label="Last name"><input placeholder="Hassan" value={lastName} onChange={(e)=>setLastName(e.target.value)} required/></AuthField>
        </div>
        <AuthField label="Work email">
          <input type="email" placeholder="amina@company.com" value={emailAddress} onChange={(e)=>setEmailAddress(e.target.value)} required/>
        </AuthField>
        <AuthField label="Create password">
          <div style={{position:'relative',display:'flex',alignItems:'center'}}>
            <input type={showPassword?'text':'password'} placeholder="At least 8 characters" minLength={8}
              value={password} onChange={(e)=>setPassword(e.target.value)} required
              style={{width:'100%',paddingRight:'44px'}}/>
            <button type="button" onClick={()=>setShowPassword(!showPassword)}
              style={{position:'absolute',right:'12px',background:'none',border:'none',cursor:'pointer',color:'#686268',display:'grid',placeItems:'center',padding:0}}>
              {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>
        </AuthField>
        <label className={s.check}>
          <input type="checkbox" required/>
          <span>I agree to the Terms of Service and Privacy Policy and confirm I&apos;m authorized to access this workspace.</span>
        </label>
        {error && <div className={s.errorAlert}><AlertCircle size={18} style={{flexShrink:0,marginTop:1}}/><div>{error}</div></div>}
        <div id="clerk-captcha"/>
        <button type="submit" disabled={notReady} className={s.primaryButton}
          style={{width:'100%',opacity:notReady?0.7:1,cursor:notReady?'not-allowed':'pointer'}}>
          {isSubmitting ? 'Loading...' : (isInviteFlow ? 'Continue to onboarding' : 'Continue to company setup')} <ArrowRight size={16}/>
        </button>
      </form>
      <div className={s.switch}>
        Already have an account?{' '}
        <Link href={`/auth/sign-in${redirectUrl ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ''}`}>
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}

export default function SignUp() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center bg-[#fafafa] text-sm text-slate-500">Loading sign up...</div>}>
      <SignUpContent />
    </Suspense>
  );
}

"use client";
import { useState, useEffect, Suspense, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Globe2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Mail,
} from 'lucide-react';
import { AuthField, AuthShell, authStyles as s } from '@/components/auth/AuthShell';
import { useSignIn, useAuth } from '@clerk/nextjs';

type ClerkErrorLike = { errors?: Array<{ longMessage?: string; message?: string }>; message?: string };

function clerkError(error: unknown): ClerkErrorLike {
  return typeof error === 'object' && error !== null ? error as ClerkErrorLike : {};
}

function authTimeout<T>(request: Promise<T>): Promise<T> {
  return Promise.race([
    request,
    new Promise<never>((_, reject) => window.setTimeout(
      () => reject(new Error('The Clerk security check did not finish. Refresh the page, then try Chrome with extensions disabled.')),
      15_000,
    )),
  ]);
}

type VerificationStage = 'first_factor' | 'second_factor' | null;
type VerificationMode = 'email_code' | 'totp' | 'phone_code' | 'backup_code';

function SignInContent() {
  const { signIn, fetchStatus } = useSignIn();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard';
  const urlEmail = searchParams.get('email') || '';

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace(redirectUrl);
    }
  }, [authLoaded, isSignedIn, redirectUrl, router]);

  const [emailAddress, setEmailAddress] = useState(urlEmail);
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [infoMessage, setInfoMessage]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification state
  const [verificationStage, setVerificationStage] = useState<VerificationStage>(null);
  const [verificationMode, setVerificationMode]   = useState<VerificationMode>('email_code');
  const [code, setCode]                           = useState('');

  const setupSecondFactor = async () => {
    const secondFactors = signIn?.supportedSecondFactors || [];
    const hasTotp = secondFactors.some((f) => f.strategy === 'totp');
    const hasEmail = secondFactors.some((f) => f.strategy === 'email_code');
    const hasPhone = secondFactors.some((f) => f.strategy === 'phone_code');
    const hasBackup = secondFactors.some((f) => f.strategy === 'backup_code');

    setVerificationStage('second_factor');
    setCode('');

    if (hasEmail || (!hasTotp && !hasPhone && !hasBackup)) {
      setVerificationMode('email_code');
      try {
        await signIn?.mfa?.sendEmailCode?.();
      } catch (e) {
        console.warn('sendEmailCode note:', e);
      }
    } else if (hasTotp) {
      setVerificationMode('totp');
    } else if (hasPhone) {
      setVerificationMode('phone_code');
      try {
        await signIn?.mfa?.sendPhoneCode?.();
      } catch (e) {
        console.warn('sendPhoneCode note:', e);
      }
    } else if (hasBackup) {
      setVerificationMode('backup_code');
    }
  };

  const setupFirstFactor = async () => {
    const firstFactors = signIn?.supportedFirstFactors || [];
    const hasEmail = firstFactors.some((f) => f.strategy === 'email_code');
    const hasPhone = firstFactors.some((f) => f.strategy === 'phone_code');

    setVerificationStage('first_factor');
    setCode('');

    if (hasEmail || !hasPhone) {
      setVerificationMode('email_code');
      try {
        await signIn?.emailCode?.sendCode?.();
      } catch (e) {
        console.warn('sendCode note:', e);
      }
    } else if (hasPhone) {
      setVerificationMode('phone_code');
      try {
        await signIn?.phoneCode?.sendCode?.();
      } catch (e) {
        console.warn('sendPhoneCode note:', e);
      }
    }
  };

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setIsSubmitting(true);
    try {
      const { error: passwordError } = await signIn.password({ emailAddress, password });
      if (passwordError) throw passwordError;

      if (signIn.status === 'complete') {
        await signIn.finalize({ navigate: () => router.push(redirectUrl) });
        return;
      }

      if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
        await setupSecondFactor();
        return;
      }

      if (signIn.status === 'needs_first_factor') {
        await setupFirstFactor();
        return;
      }

      if (signIn.status === 'needs_new_password') {
        setError('Your account requires a password update. Please use the reset password link.');
        return;
      }

      setError('Additional verification is required for this account.');
    } catch (err: unknown) {
      const details = clerkError(err);
      const clerkErr = details.errors?.[0];
      console.error('Clerk sign-in error:', details.errors ?? err);
      setError(clerkErr?.longMessage || clerkErr?.message || details.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (verificationMode !== 'backup_code' && code.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    if (verificationMode === 'backup_code' && !code.trim()) {
      setError('Please enter your backup recovery code.');
      return;
    }
    setError('');
    setInfoMessage('');
    setIsSubmitting(true);
    try {
      let resultError: unknown = null;

      if (verificationStage === 'second_factor') {
        if (verificationMode === 'email_code') {
          const res = await signIn.mfa.verifyEmailCode({ code });
          resultError = res.error;
        } else if (verificationMode === 'totp') {
          const res = await signIn.mfa.verifyTOTP({ code });
          resultError = res.error;
        } else if (verificationMode === 'phone_code') {
          const res = await signIn.mfa.verifyPhoneCode({ code });
          resultError = res.error;
        } else if (verificationMode === 'backup_code') {
          const res = await signIn.mfa.verifyBackupCode({ code });
          resultError = res.error;
        }
      } else if (verificationStage === 'first_factor') {
        if (verificationMode === 'email_code') {
          const res = await signIn.emailCode.verifyCode({ code });
          resultError = res.error;
        } else if (verificationMode === 'phone_code') {
          const res = await signIn.phoneCode.verifyCode({ code });
          resultError = res.error;
        }
      }

      if (resultError) throw resultError;

      if (signIn.status === 'complete') {
        await signIn.finalize({ navigate: () => router.push(redirectUrl) });
        return;
      }

      if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
        await setupSecondFactor();
        return;
      }

      setError('Verification could not be completed. Please try again.');
    } catch (err: unknown) {
      const details = clerkError(err);
      const clerkErr = details.errors?.[0];
      console.error('Clerk verify error:', details.errors ?? err);
      setError(clerkErr?.longMessage || clerkErr?.message || details.message || 'Invalid verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfoMessage('');
    setIsSubmitting(true);
    try {
      if (verificationStage === 'second_factor') {
        if (verificationMode === 'email_code') {
          const res = await signIn.mfa.sendEmailCode();
          if (res.error) throw res.error;
        } else if (verificationMode === 'phone_code') {
          const res = await signIn.mfa.sendPhoneCode();
          if (res.error) throw res.error;
        }
      } else if (verificationStage === 'first_factor') {
        if (verificationMode === 'email_code') {
          const res = await signIn.emailCode.sendCode();
          if (res.error) throw res.error;
        } else if (verificationMode === 'phone_code') {
          const res = await signIn.phoneCode.sendCode();
          if (res.error) throw res.error;
        }
      }
      setInfoMessage('A new verification code has been sent.');
      setCode('');
    } catch (err: unknown) {
      const details = clerkError(err);
      const clerkErr = details.errors?.[0];
      setError(clerkErr?.longMessage || clerkErr?.message || details.message || 'Could not resend code. Please wait a moment and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToSignIn = async () => {
    setError('');
    setInfoMessage('');
    setVerificationStage(null);
    setCode('');
    try {
      await signIn.reset();
    } catch (e) {
      console.warn('Sign-in reset note:', e);
    }
  };

  const signInWithGoogle = async () => {
    setIsSubmitting(true);
    try {
      const { error: ssoError } = await authTimeout(signIn.sso({
        strategy: 'oauth_google',
        redirectCallbackUrl: '/sso-callback',
        redirectUrl: '/dashboard',
      }));
      if (ssoError) throw ssoError;
    } catch (err: unknown) {
      const details = clerkError(err);
      setError(details.errors?.[0]?.message || details.message || 'Google sign-in failed.');
      setIsSubmitting(false);
    }
  };

  // Render Verification View if challenge is active
  if (verificationStage !== null) {
    const isTotp = verificationMode === 'totp';
    const isEmail = verificationMode === 'email_code';
    const isPhone = verificationMode === 'phone_code';
    const isBackup = verificationMode === 'backup_code';

    const secondFactors = signIn?.supportedSecondFactors || [];
    const hasTotp = secondFactors.some((f) => f.strategy === 'totp');
    const hasEmail = secondFactors.some((f) => f.strategy === 'email_code');
    const hasBackup = secondFactors.some((f) => f.strategy === 'backup_code');

    const eyebrow = isTotp
      ? 'Two-step verification'
      : isBackup
      ? 'Account recovery'
      : 'Security verification';

    const title = isTotp
      ? 'Authenticator App'
      : isBackup
      ? 'Enter backup code'
      : isPhone
      ? 'Check your phone'
      : 'Check your email';

    const subtitle = isTotp
      ? 'Enter the 6-digit verification code generated by your authenticator app.'
      : isBackup
      ? 'Enter one of your emergency recovery backup codes to continue.'
      : isPhone
      ? 'We sent a 6-digit SMS verification code to your phone.'
      : `Enter the 6-digit verification code sent to ${emailAddress || 'your email'}.`;

    return (
      <AuthShell eyebrow={eyebrow} title={title} subtitle={subtitle}>
        {infoMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '12px 14px',
            borderRadius: 8,
            fontSize: 14,
            marginBottom: 20,
            lineHeight: 1.4,
          }}>
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <div>{infoMessage}</div>
          </div>
        )}

        {error && (
          <div className={s.errorAlert}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleVerify}>
          {isBackup ? (
            <AuthField label="Backup recovery code">
              <input
                type="text"
                placeholder="e.g. 1a2b-3c4d"
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                autoFocus
                required
              />
            </AuthField>
          ) : (
            <div className={s.code}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  autoFocus={i === 0}
                  value={code[i] || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const a = code.split('');
                    a[i] = val;
                    setCode(a.join(''));
                    if (val && e.target.nextElementSibling) {
                      (e.target.nextElementSibling as HTMLElement).focus();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                    if (p) {
                      setCode(p);
                      const ins = e.currentTarget.parentElement?.querySelectorAll('input');
                      if (ins) (ins[Math.min(p.length, 5)] as HTMLElement).focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !code[i] && e.currentTarget.previousElementSibling) {
                      (e.currentTarget.previousElementSibling as HTMLElement).focus();
                    }
                  }}
                />
              ))}
            </div>
          )}

          <div id="clerk-captcha" />

          <button
            type="submit"
            disabled={isSubmitting || fetchStatus === 'fetching'}
            className={s.primaryButton}
            style={{
              width: '100%',
              marginTop: 8,
              opacity: isSubmitting || fetchStatus === 'fetching' ? 0.7 : 1,
              cursor: isSubmitting || fetchStatus === 'fetching' ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Verifying...' : 'Verify & Continue'} <ArrowRight size={16} />
          </button>

          {(isEmail || isPhone) && (
            <div className={s.switch} style={{ marginTop: 16 }}>
              Didn&apos;t receive it?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={isSubmitting}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--primary, #9c32f3)',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                  fontSize: 'inherit',
                }}
              >
                <RefreshCw size={13} /> Resend code
              </button>
            </div>
          )}

          {verificationStage === 'second_factor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, textAlign: 'center' }}>
              {!isTotp && hasTotp && (
                <button
                  type="button"
                  onClick={() => { setVerificationMode('totp'); setCode(''); setError(''); setInfoMessage(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9c32f3',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <KeyRound size={14} /> Use authenticator app instead
                </button>
              )}
              {!isEmail && hasEmail && (
                <button
                  type="button"
                  onClick={async () => {
                    setVerificationMode('email_code');
                    setCode('');
                    setError('');
                    setInfoMessage('');
                    try {
                      await signIn.mfa.sendEmailCode();
                    } catch (e) {
                      console.warn('sendEmailCode note:', e);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9c32f3',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Mail size={14} /> Send code to email instead
                </button>
              )}
              {!isBackup && hasBackup && (
                <button
                  type="button"
                  onClick={() => { setVerificationMode('backup_code'); setCode(''); setError(''); setInfoMessage(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#777179',
                    fontSize: 13,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <ShieldCheck size={14} /> Use a backup recovery code
                </button>
              )}
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleBackToSignIn}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#777179',
                fontSize: 13,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ArrowLeft size={14} /> Back to sign in
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Welcome back" title="Sign in to your account"
      subtitle="Use your work email to continue to EasyHR.">
      {redirectUrl.includes('/my-onboarding') && (
        <div style={{
          display: 'flex',
          gap: 12,
          padding: '14px 16px',
          background: '#FAF5FF',
          border: '1.5px solid #EDE9FE',
          borderRadius: 10,
          marginBottom: 18,
          fontSize: 13,
          color: '#581C87',
          lineHeight: 1.5,
        }}>
          <div>
            <strong>Starting your onboarding?</strong> If you have not created your password yet,{' '}
            <Link
              href={`/auth/accept-invite?redirect_url=${encodeURIComponent(redirectUrl)}${emailAddress ? `&email=${encodeURIComponent(emailAddress)}` : ''}`}
              style={{ color: 'var(--primary, #A238FF)', fontWeight: 700, textDecoration: 'underline' }}
            >
              activate your invitation here →
            </Link>
          </div>
        </div>
      )}
      <button type="button" disabled={isSubmitting || fetchStatus === 'fetching'} onClick={signInWithGoogle} className={s.secondaryButton}
        style={{opacity:(isSubmitting || fetchStatus === 'fetching')?0.7:1,cursor:(isSubmitting || fetchStatus === 'fetching')?'not-allowed':'pointer'}}>
        <Globe2 size={17}/> {isSubmitting ? 'Redirecting to Google...' : 'Continue with Google'}
      </button>
      <div className={s.divider}>or continue with email</div>
      <form onSubmit={handleSignIn}>
        <AuthField label="Work email">
          <input type="email" placeholder="amina@company.com" value={emailAddress} onChange={(e)=>setEmailAddress(e.target.value)} required/>
        </AuthField>
        <AuthField label="Password" hint={<Link href="/auth/forgot-password" className={s.forgot}>Forgot?</Link>}>
          <div style={{position:'relative',display:'flex',alignItems:'center'}}>
            <input type={showPassword?'text':'password'} placeholder="••••••••••••"
              value={password} onChange={(e)=>setPassword(e.target.value)} required
              style={{width:'100%',paddingRight:'44px'}}/>
            <button type="button" onClick={()=>setShowPassword(!showPassword)}
              style={{position:'absolute',right:'12px',background:'none',border:'none',cursor:'pointer',color:'#686268',display:'grid',placeItems:'center',padding:0}}>
              {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>
        </AuthField>
        <label className={s.check}>
          <input type="checkbox"/>
          <span>Keep me signed in on this device</span>
        </label>
        {error && <div className={s.errorAlert}><AlertCircle size={18} style={{flexShrink:0,marginTop:1}}/><div>{error}</div></div>}
        <div id="clerk-captcha"/>
        <button type="submit" disabled={isSubmitting || fetchStatus === 'fetching'} className={s.primaryButton}
          style={{width:'100%',opacity:(isSubmitting || fetchStatus === 'fetching')?0.7:1,cursor:(isSubmitting || fetchStatus === 'fetching')?'not-allowed':'pointer'}}>
          {isSubmitting ? 'Signing in...' : 'Sign in securely'} <ArrowRight size={16}/>
        </button>
      </form>
      <div className={s.switch}>
        Don&apos;t have an account?{' '}
        <Link href={`/auth/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}${emailAddress ? `&email=${encodeURIComponent(emailAddress)}` : ''}`}>
          Sign up
        </Link>
      </div>
    </AuthShell>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading sign in…</div>}>
      <SignInContent />
    </Suspense>
  );
}

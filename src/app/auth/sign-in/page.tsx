"use client";
import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Globe2, AlertCircle, Eye, EyeOff } from 'lucide-react';
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

export default function SignIn() {
  const { signIn, fetchStatus } = useSignIn();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace('/dashboard');
    }
  }, [authLoaded, isSignedIn, router]);

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const { error: passwordError } = await signIn.password({ emailAddress, password });
      if (passwordError) throw passwordError;
      if (signIn.status === 'complete') {
        await signIn.finalize({ navigate: () => router.push('/dashboard') });
      } else setError('Additional verification required.');
    } catch (err: unknown) {
      const details = clerkError(err);
      const clerkErr = details.errors?.[0];
      console.error('Clerk sign-in error:', details.errors ?? err);
      setError(clerkErr?.longMessage || clerkErr?.message || details.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
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

  return (
    <AuthShell eyebrow="Welcome back" title="Sign in to your account"
      subtitle="Use your work email to continue to EasyHR.">
      <button type="button" disabled={isSubmitting || fetchStatus === 'fetching'} onClick={signInWithGoogle} className={s.secondaryButton}
        style={{opacity:(isSubmitting || fetchStatus === 'fetching')?.7:1,cursor:(isSubmitting || fetchStatus === 'fetching')?'not-allowed':'pointer'}}>
        <Globe2 size={17}/> {isSubmitting ? 'Redirecting to Google...' : 'Continue with Google'}
      </button>
      <div className={s.divider}>or continue with email</div>
      <form onSubmit={handleSignIn}>
        <AuthField label="Work email">
          <input type="email" placeholder="amina@company.com" value={emailAddress} onChange={(e)=>setEmailAddress(e.target.value)}/>
        </AuthField>
        <AuthField label="Password" hint={<Link href="/auth/forgot-password" className={s.forgot}>Forgot?</Link>}>
          <div style={{position:'relative',display:'flex',alignItems:'center'}}>
            <input type={showPassword?'text':'password'} placeholder="••••••••••••"
              value={password} onChange={(e)=>setPassword(e.target.value)}
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
          style={{width:'100%',opacity:(isSubmitting || fetchStatus === 'fetching')?.7:1,cursor:(isSubmitting || fetchStatus === 'fetching')?'not-allowed':'pointer'}}>
          {isSubmitting ? 'Signing in...' : 'Sign in securely'} <ArrowRight size={16}/>
        </button>
      </form>
      <div className={s.switch}>Don&apos;t have an account? <Link href="/auth/sign-up">Sign up</Link></div>
    </AuthShell>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase';
import { SpaceData, storeEmailVerificationOTP, verifyEmailOTP } from '@/services/auth';
import { sendVerificationEmail, generateOTP } from '@/ai/flows/send-verification-email';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';

interface EmailVerificationProps {
  spaceId: string;
  spaceData: SpaceData;
  onVerified: () => void;
  onBack: () => void;
}

type Step = 'email' | 'otp';

export function EmailVerification({
  spaceId,
  spaceData,
  onVerified,
  onBack,
}: EmailVerificationProps) {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get verification config from space data
  const verification = spaceData.verification;
  const emailPattern = verification?.emailPattern
    ? new RegExp(verification.emailPattern)
    : null;
  const emailDomain = verification?.emailDomain || '';

  // Resend timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0 && step === 'otp') {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [resendTimer, step]);

  const validateEmail = (emailToValidate: string): boolean => {
    if (!emailToValidate) {
      setError('Please enter your email address');
      return false;
    }

    // If there's a pattern, validate against it
    if (emailPattern && !emailPattern.test(emailToValidate)) {
      setError(
        verification?.verificationMessage ||
          `Please enter a valid email with @${emailDomain}`
      );
      return false;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToValidate)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSendOTP = async () => {
    if (!validateEmail(email)) return;
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in to continue',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Generate OTP
      const generatedOtp = await generateOTP();

      // Store OTP in Firestore
      await storeEmailVerificationOTP(
        firestore,
        user.uid,
        spaceId,
        email,
        generatedOtp
      );

      // Send email
      const result = await sendVerificationEmail({
        email,
        spaceName: spaceData.name,
        otp: generatedOtp,
      });

      if (!result.success) {
        setError(result.error || 'Failed to send verification email');
        return;
      }

      toast({
        title: 'Verification Code Sent',
        description: `We've sent a 6-digit code to ${email}`,
      });

      setStep('otp');
      setResendTimer(60);
      setCanResend(false);

      // Focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Move to next input if digit entered
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Clear error when user types
    if (error) setError('');
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (otp[index]) {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // Move to previous input and clear it
        otpInputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
      e.preventDefault();
    }

    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('');
        const newOtp = [...otp];
        digits.forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit;
        });
        setOtp(newOtp);
        // Focus last filled or last input
        const lastFilledIndex = Math.min(digits.length, 5);
        otpInputRefs.current[lastFilledIndex]?.focus();
      });
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in to continue',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await verifyEmailOTP(firestore, user.uid, spaceId, otpCode);

      if (!result.success) {
        setError(result.error || 'Invalid verification code');
        return;
      }

      toast({
        title: 'Email Verified',
        description: 'Your email has been verified successfully!',
      });

      onVerified();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    await handleSendOTP();
  };

  // Render email input step
  if (step === 'email') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Verify Your Email
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {verification?.verificationMessage ||
                `Enter your ${emailDomain} email to verify you're a member of ${spaceData.name}`}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">College Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={`rollno@${emailDomain}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value.toLowerCase());
                  if (error) setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSendOTP();
                  }
                }}
                className={error ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              We'll send a verification code to this email
            </p>

            <Button
              className="w-full"
              size="lg"
              onClick={handleSendOTP}
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={onBack}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render OTP verification step
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Enter Verification Code
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We've sent a 6-digit code to{' '}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  otpInputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className={`h-12 w-12 text-center text-lg font-semibold ${
                  error ? 'border-destructive' : ''
                }`}
                disabled={isLoading}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleVerifyOTP}
            disabled={isLoading || otp.join('').length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?{' '}
              {canResend ? (
                <button
                  onClick={handleResendOTP}
                  className="text-primary hover:underline font-medium"
                  disabled={isLoading}
                >
                  Resend
                </button>
              ) : (
                <span className="text-muted-foreground">
                  Resend in {resendTimer}s
                </span>
              )}
            </p>
          </div>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setStep('email');
              setOtp(['', '', '', '', '', '']);
              setError('');
            }}
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Change Email
          </Button>
        </div>
      </div>
    </div>
  );
}

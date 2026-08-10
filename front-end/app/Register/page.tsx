"use client";
import Link from 'next/link'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Check, Sparkles, ChartNoAxesCombined, GraduationCap, Users, Eye, EyeOff, MailCheck } from "lucide-react";
import Image from 'next/image'
import { auth, googleProvider } from '@/lib/firebase'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, deleteUser, getAdditionalUserInfo, signOut, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import toast from 'react-hot-toast';

// =========================================================================
// 🚨 EMAIL VERIFICATION TOGGLE FOR REGISTRATION
// Set REQUIRE_EMAIL_VERIFICATION = true for PRODUCTION deployment.
// Set REQUIRE_EMAIL_VERIFICATION = false for easy LOCAL TESTING.
// =========================================================================
const REQUIRE_EMAIL_VERIFICATION = true;


const Register = () => {

  const subContent = [
    { icon: Sparkles, text: "AI-matched on goals, schedule & style" },
    { icon: Users, text: "Live voice sessions with shared notes" },
    { icon: ChartNoAxesCombined, text: "Track focus minutes & weekly progress" }
  ]

  const formContent = [
    { id: "firstName", text: "First Name", placeholder: "John", type: "text" },
    { id: "lastName", text: "Last Name", placeholder: "Doe", type: "text" },
    { id: "email", text: "Email", placeholder: "name@example.com", type: "email" },
    { id: "password", text: "Password", placeholder: "Create a strong password", type: "password" },
    { id: "CnfrmPassword", text: "Confirm Password", placeholder: "Re-Enter the Password", type: "password" },
  ]

  const [formData, setFormData] = useState({ email: '', password: '', CnfrmPassword: '', firstName: '', lastName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification Pending States
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredUserId, setRegisteredUserId] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const router = useRouter();

  // Cooldown countdown timer for resend email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Polling every 2s: auto-detect verification from ANY device (phone, another tab etc.)
  // Once detected, THIS tab handles the redirect — so onboarding never opens on the wrong device.
  useEffect(() => {
    if (!isPendingVerification || !registeredUserId || isVerified) return;

    const checkVerificationStatus = async () => {
      try {
        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            setIsVerified(true);
            setTimeout(() => {
              router.push(`/OnBoardingFlow/${registeredUserId}`);
            }, 2000);
          }
        }
      } catch {
        // Silently ignore transient network errors during polling
      }
    };

    const interval = setInterval(checkVerificationStatus, 2000);
    return () => clearInterval(interval);
  }, [isPendingVerification, registeredUserId, isVerified, router]);

  const passwordChecks = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "One number", test: (p: string) => /[0-9]/.test(p) },
    { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];

  const getInputType = (item: { id: string; type: string }) => {
    if (item.id === "password") return showPassword ? "text" : "password";
    if (item.id === "CnfrmPassword") return showConfirmPassword ? "text" : "password";
    return item.type;
  };

  const handleGoogleSignIn = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let googleUser: any = null;
    let isNewGoogleUser = false;
    try {
      //Google Popup
      const result = await signInWithPopup(auth, googleProvider);
      googleUser = result.user;

      const additionalInfo = getAdditionalUserInfo(result);
      isNewGoogleUser = !!additionalInfo?.isNewUser;

      if (!isNewGoogleUser) {
        await signOut(auth);
        toast.error("This account is already registered. Please sign in to continue.");
        router.push("/Login");
        return;
      }

      const token = await googleUser.getIdToken();
      const names = googleUser.displayName?.split(' ') || ['']
      const firstName = names[0];
      const lastName = names.slice(1).join(' ');

      const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/auth/sync`, {
        method: "POST",
        headers: {
          'Content-Type': "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: firstName || "Student",
          lastName: lastName || ""
        })
      })

      const data = await response.json();
      if (response.ok) {
        toast.success("Successfully Registered");
        router.push(`/OnBoardingFlow/${data.user.id}`);
      } else {
        // Database sync failed -> Roll back Firebase user creation
        if (googleUser && isNewGoogleUser) {
          await deleteUser(googleUser).catch(err => console.error("Firebase rollback error:", err));
        }
        toast.error(data.message || "Database sync failed. Registration rolled back.");
      }

    } catch (error: unknown) {
      console.error("Auth error ", error);
      if (googleUser && isNewGoogleUser) {
        await deleteUser(googleUser).catch(err => console.error("Firebase rollback error:", err));
      }
      toast.error((error as Error)?.message || "Registration Failed");
    }
  }

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/auth/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail, userId: registeredUserId })
      });
      if (res.ok) {
        toast.success("Verification email resent! Check your inbox.");
        setResendCooldown(30);
      } else {
        toast.error("Failed to resend email. Please try again.");
      }
    } catch (err) {
      console.error("Resend error:", err);
      toast.error("Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };



  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check all fields filled
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.CnfrmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    // Check all password requirements
    const allChecksPassed = passwordChecks.every(check => check.test(formData.password));
    if (!allChecksPassed) {
      toast.error("Password does not meet all requirements.");
      return;
    }

    // Check passwords match
    if (formData.password !== formData.CnfrmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let createdUser: any = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      createdUser = userCredential.user;
      const token = await createdUser.getIdToken();

      const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/auth/sync`, {
        method: "POST",
        headers: {
          'content-type': "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName
        })
      });

      const data = await response.json();
      if (response.ok) {
        if (REQUIRE_EMAIL_VERIFICATION) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_URL}/api/auth/send-verification-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: formData.email, userId: data.user.id })
            });
          } catch (e) {
            console.warn("Failed to send verification email via Brevo, attempting fallback:", e);
            await sendEmailVerification(createdUser).catch(err => console.warn("Fallback email verification error:", err));
          }
          setRegisteredEmail(formData.email);
          setRegisteredUserId(data.user.id);
          setIsPendingVerification(true);
          setResendCooldown(30);
          toast.success("Account created! Please check your email to verify.");
          return;
        }

        toast.success("Successfully Registered");
        router.push(`/OnBoardingFlow/${data.user.id}`);
      } else {
        // Database creation failed -> Roll back Firebase creation!
        if (createdUser) {
          await deleteUser(createdUser).catch(err => console.error("Firebase rollback error:", err));
        }
        toast.error(data.message || "Database sync failed. Account creation rolled back.");
      }

    } catch (error: unknown) {
      console.error("Auth error ", error);
      const authError = error as { code?: string; message?: string };
      if (createdUser && authError?.code !== 'auth/email-already-in-use') {
        await deleteUser(createdUser).catch(err => console.error("Firebase rollback error:", err));
      }

      if (authError?.code === 'auth/email-already-in-use') {
        toast.error("This email is already registered in Firebase. Try logging in instead.");
        router.push("/Login");
      } else {
        toast.error(authError?.message || "Registration Failed");
      }
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen lg:mx-20 mx-4 my-28">
        <section className="relative w-full bg-primary-linear rounded-[2.5rem] flex flex-col lg:flex-row overflow-hidden shadow-2xl">

          {/* LEFT SIDE */}
          <div className="relative z-10 flex-1 flex flex-col justify-center p-10 lg:p-20 text-white">

            <Link href="/" className="flex items-center gap-2 w-fit relative lg:-top-10 lg:-left-10 -left-5 -top-5">
              <div className="lg:siz-10 size-7 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-sm">
                <GraduationCap className="lg:size-5 size-4 text-white" />
              </div>
              <span className="lg:text-2xl font-bold tracking-tight">BondEd</span>
            </Link>

            <div className="flex flex-col items-center">
              <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-center mb-4 leading-[1.1]">
                Find a study partner who  <br /> actually shows up.
              </h1>
              <p className="text-lg text-white/60 max-w-md leading-relaxed font-medium font-geist mb-10 text-center">
                Join 24,000+ students using AI-matched sessions to study smarter, not lonelier.
              </p>

              <div className="flex flex-col gap-4 mt-10 mb-23">
                {subContent.map((item, key) => (
                  <div className='flex items-center gap-2 w-fit font-geist' key={key}>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-sm">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[16px] font-light tracking-tight">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className='p-3 bg-white/20 flex flex-col gap-3 rounded-md justify-center backdrop-blur-md border border-white/20 shadow-sm font-geist'>
                <span>&quot;I matched with three premed students within a day. Our weekly sessions doubled my MCAT practice score.&quot;</span>
                <span>Priya Raman</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="relative z-10 w-full lg:w-125 flex items-center">

            <div className="w-full lg:mr-10.25 lg:my-8.75 m-6 p-8 sm:p-10 bg-white/35 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] flex flex-col text-white">

              {isPendingVerification ? (
                <div className="flex flex-col items-center text-center font-geist py-4">
                  {/* Icon - animates from mail to check when verified */}
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center backdrop-blur-xl border shadow-2xl mb-6 text-white transition-all duration-500 ${
                    isVerified ? "bg-emerald-500/30 border-emerald-400/50 scale-110" : "bg-white/20 border-white/30 animate-pulse"
                  }`}>
                    {isVerified ? <Check className="w-10 h-10 text-emerald-300" /> : <MailCheck className="w-10 h-10 text-white" />}
                  </div>

                  <h2 className="text-3xl font-bold tracking-tight mb-3 text-white">
                    {isVerified ? "Email Verified! 🎉" : "Check Your Email"}
                  </h2>

                  <p className="text-sm text-white/85 font-medium max-w-xs mb-6 leading-relaxed">
                    {isVerified ? (
                      "Your email is verified. Taking you to onboarding now..."
                    ) : (
                      <>
                        We sent a verification link to{" "}
                        <strong className="text-white">{registeredEmail}</strong>.
                        <br /><br />
                        Click the link in your email — this page will <span className="text-white font-semibold">automatically continue</span> once verified.
                      </>
                    )}
                  </p>

                  {/* Live Status Indicator */}
                  <div className={`w-full rounded-2xl px-4 py-3.5 mb-6 flex items-center justify-center gap-3 border transition-all duration-500 ${
                    isVerified
                      ? "bg-emerald-500/20 border-emerald-400/40"
                      : "bg-white/10 border-white/20"
                  }`}>
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isVerified ? "bg-emerald-400" : "bg-blue-400"}`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isVerified ? "bg-emerald-500" : "bg-blue-500"}`}></span>
                    </span>
                    <span className={`text-xs font-bold tracking-wide ${isVerified ? "text-emerald-200" : "text-white/80"}`}>
                      {isVerified ? "Verified — launching onboarding..." : "Waiting for you to verify your email..."}
                    </span>
                  </div>

                  {/* Only show Resend button when not yet verified */}
                  {!isVerified && (
                    <>
                      <button
                        type="button"
                        onClick={handleResendEmail}
                        disabled={resendCooldown > 0 || isResending}
                        className="w-full py-3.5 px-4 rounded-xl border border-white/30 bg-white/10 font-semibold text-white hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                      >
                        {isResending ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Verification Email"}
                      </button>

                      <p className="text-xs text-white/45 leading-relaxed max-w-xs">
                        Verifying from your phone? No worries — this page on your computer will automatically open onboarding once your email is verified.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-col mb-8 text-center">
                    <h2 className="text-3xl font-bold tracking-tight mb-2">
                      Create an account
                    </h2>
                    <p className="text-sm font-geist">
                      Enter your details to get started.
                    </p>
                  </div>

                  <div className="flex flex-col gap-6 font-geist">

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full flex items-center justify-center gap-3 rounded-xl border border-line-linear bg-white/5 px-4 py-3.5 text-sm font-regular transition-all hover:bg-white/10 hover:border-white/30 shadow-sm active:scale-[0.98] text-black"
                    >
                      <Image src="/icons/google.svg" width={24} height={24} alt='Google Icon' />
                      Sign up with Google
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-white/20"></div>
                      <span className="text-xs font-medium uppercase text-white/50 tracking-wider">Or continue with</span>
                      <div className="h-px flex-1 bg-white/20"></div>
                    </div>

                    <form className="grid grid-cols-2 gap-4">
                      {formContent.map((item, key) => {
                        const isHalfWidth = item.id === "firstName" || item.id === "lastName";
                        const isPasswordField = item.id === "password" || item.id === "CnfrmPassword";
                        const isShowingPassword = item.id === "password" ? showPassword : showConfirmPassword;

                        return (
                          <div
                            key={key}
                            className={`flex flex-col gap-1.5 ${isHalfWidth ? "col-span-1" : "col-span-2"}`}
                          >
                            <label htmlFor={item.id} className="text-sm font-medium text-white/90">
                              {item.text}
                            </label>
                            <div className="relative">
                              <input
                                type={getInputType(item)}
                                id={item.id}
                                placeholder={item.placeholder}
                                onChange={(e) => {
                                  setFormData((prevData) => ({
                                    ...prevData,
                                    [item.id]: e.target.value
                                  }));
                                }}
                                className={`h-11 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white outline-none transition-all placeholder:text-white/60 focus:placeholder:text-white focus:border-white/50 focus:bg-white/20 focus:ring-4 focus:ring-white/10 ${isPasswordField ? 'pr-11' : ''}`}
                              />
                              {isPasswordField && (
                                <button
                                  type="button"
                                  onClick={() => item.id === "password" ? setShowPassword(p => !p) : setShowConfirmPassword(p => !p)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                                >
                                  {isShowingPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              )}
                            </div>

                            {/* Password checklist — shown only under the password field */}
                            {item.id === "password" && formData.password.length > 0 && (
                              <div className="mt-1 flex flex-col gap-1">
                                {passwordChecks.map((check, i) => {
                                  const passed = check.test(formData.password);
                                  return (
                                    <div key={i} className={`flex items-center gap-1.5 text-xs transition-colors ${passed ? 'text-green-300' : 'text-white/50'}`}>
                                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${passed ? 'bg-green-400/30 border-green-400' : 'border-white/30'}`}>
                                        {passed && <Check className="w-2.5 h-2.5" />}
                                      </div>
                                      {check.label}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Confirm password mismatch hint */}
                            {item.id === "CnfrmPassword" && formData.CnfrmPassword.length > 0 && (
                              <p className={`text-xs mt-0.5 transition-colors ${formData.password === formData.CnfrmPassword ? 'text-green-300' : 'text-red-300'}`}>
                                {formData.password === formData.CnfrmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </form>

                    <button type='button' onClick={handleRegister} className="group border-2 bg-primary-linear px-6 py-2 text-white hover:bg-white hover:border-primary-linear transition-all">
                      <span className="group-hover:text-primary-linear group-hover:font-bold">Create Account</span>
                    </button>
                  </div>

                  <p className="mt-8 text-center text-sm text-white/70 font-geist">
                    Already have an account?{" "}
                    <Link href="/Login" className="font-semibold text-primary hover:text-white/80 transition-colors">
                      Log in
                    </Link>
                  </p>
                </>
              )}

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default Register
"use client";
import Link from 'next/link'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ChartNoAxesCombined, Eye, EyeOff, GraduationCap, Sparkles, Users } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, googleProvider } from '@/lib/firebase'
import { getAdditionalUserInfo, signInWithEmailAndPassword, signInWithPopup, signOut, sendPasswordResetEmail } from 'firebase/auth'
import toast from 'react-hot-toast';

const Login = () => {

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot Password State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  interface PendingUser {
    id?: string;
    email?: string | null;
    [key: string]: unknown;
  }

  // MFA Verification State
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [pendingLoginUser, setPendingLoginUser] = useState<PendingUser | null>(null);
  const [sendingCode, setSendingCode] = useState(false);

  const subContent = [
    { icon: Sparkles, text: "Access your personalized dashboard" },
    { icon: Users, text: "Connect with your matches" },
    { icon: ChartNoAxesCombined, text: "Review your study sessions" }
  ]

  const formContent = [
    { id: "email", text: "Email", placeholder: "name@example.com", type: "email" },
    { id: "password", text: "Password", placeholder: "Enter Your Password", type: "password" }
  ]

  const [formData, setFormData] = useState({ email: '', password: '' });
  const router = useRouter();

  const getInputType = (item: { id: string; type: string }) => {
    if (item.id === "password") return showPassword ? "text" : "password";
    if (item.id === "CnfrmPassword") return showConfirmPassword ? "text" : "password";
    return item.type;
  };

  // Helper to trigger 6-digit MFA OTP code generation & sending
  const triggerMfaCode = async (userEmail: string, userObj: PendingUser) => {
    setPendingLoginUser({ ...userObj, email: userEmail });
    setSendingCode(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/auth/send-mfa-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`2FA security code sent to ${userEmail}`);
      } else {
        toast.error(data.message || "Failed to generate MFA code. Try resending.");
      }
    } catch (err) {
      console.error("MFA trigger error", err);
      toast.error("Network error triggering 2FA code.");
    } finally {
      setSendingCode(false);
      setIsMfaStep(true);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      //Google Popup
      const result = await signInWithPopup(auth, googleProvider);
      const additionalInfo = getAdditionalUserInfo(result);

      if (additionalInfo?.isNewUser) {
        await signOut(auth);
        toast.error("Account not found. Please sign up using your Google account to get started.");
        router.push("/Register");
        return;
      }

      const token = await result.user.getIdToken();
      const names = result.user.displayName?.split(' ') || ['']
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
        // Check if profile has mfaEnabled
        const profileRes = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/profile/${data.user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const pData = await profileRes.json();
          if (pData.profile?.mfaEnabled) {
            await triggerMfaCode(result.user.email || data.user.email, data.user);
            return;
          }
        }

        toast.success("Login Successful");
        const destination = data.user.hasCompletedOnboarding
          ? `/Student/${data.user.id}/Dashboard`
          : `/OnBoardingFlow/${data.user.id}`;
        router.push(destination);
      }

    } catch (error) {
      console.error("Auth error ", error);
      toast.error("Login Failed");
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const additionalInfo = getAdditionalUserInfo(userCredential);

      if (additionalInfo?.isNewUser) {
        await signOut(auth);
        toast.error("Account not found. Please sign up first to get started.");
        router.push("/Register");
        return;
      }

      const token = await userCredential.user.getIdToken();

      const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/auth/sync`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json();

      if (response.ok) {
        // Check if MFA enabled for user
        const profileRes = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/profile/${data.user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const pData = await profileRes.json();
          if (pData.profile?.mfaEnabled) {
            await triggerMfaCode(formData.email, data.user);
            return;
          }
        }

        toast.success("Login Successful")
        const destination = data.user.hasCompletedOnboarding
          ? `/Student/${data.user.id}/Dashboard`
          : `/OnBoardingFlow/${data.user.id}`;
        router.push(destination);
      }
    } catch (error) {
      console.log("Login Error", error);
      toast.error("Login Failed")
    }
  }

  const handleSendForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      toast.success("Password reset email sent! Check your inbox.");
      setIsForgotOpen(false);
      setForgotEmail('');
    } catch (err: unknown) {
      console.error("Forgot password error", err);
      toast.error((err as Error).message || "Failed to send reset email.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode || mfaCode.length < 4) {
      toast.error("Please enter valid 6-digit MFA security code.");
      return;
    }

    const emailToVerify = pendingLoginUser?.email || formData.email;
    if (!emailToVerify) {
      toast.error("Session expired. Please log in again.");
      setIsMfaStep(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/auth/verify-mfa-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToVerify, code: mfaCode })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("MFA Verified Successfully!");
        router.push(`/Student/${pendingLoginUser?.id}/Dashboard`);
      } else {
        toast.error(data.message || "Invalid or expired MFA code.");
      }
    } catch (err) {
      console.error("MFA Verification error:", err);
      toast.error("Network error verifying MFA code.");
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen lg:mx-20 mx-4 my-28">
        <section className="relative w-full bg-primary-linear rounded-[2.5rem] flex flex-col lg:flex-row overflow-hidden shadow-2xl">

          {/* LEFT SIDE */}
          <div className="relative z-10 flex-1 flex flex-col justify-center p-10 lg:p-20 text-white">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 w-fit relative lg:-top-10 lg:-left-10 -left-5 -top-5">
              <div className="lg:siz-10 size-7 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-sm">
                <GraduationCap className="lg:size-5 size-4 text-white" />
              </div>
              <span className="lg:text-2xl font-bold tracking-tight">BondEd</span>
            </Link>

            <div className="flex flex-col items-center">
              <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-center mb-4 leading-[1.1]">
                Welcome back, Continue  <br />  your learning journey.
              </h1>
              <p className="text-lg text-white/60 max-w-md leading-relaxed font-medium font-geist mb-10 text-center">
                Pick up where you left off. Review pending requests, jump into scheduled sessions, and track your weekly progress.
              </p>

              <div className="flex flex-col gap-4 mt-10 mb-23">

                {subContent.map((item, key) => (
                  <div className='flex items-center gap-2 w-fit font-geist' key={key}>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex  items-center justify-center backdrop-blur-md border border-white/20 shadow-sm">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[16px] font-light tracking-tight">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="relative z-10 w-full lg:w-125 flex items-center ">
            <div className="w-full lg:mr-10.25 lg:my-8.75 m-6 p-8 sm:p-10 bg-white/35 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] flex flex-col text-white">

              {isMfaStep ? (
                /* MFA STEP VIEW */
                <form onSubmit={handleVerifyMfa} className="flex flex-col gap-6 font-geist">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">2-Factor Authentication</h2>
                    <p className="text-xs text-white/70">
                      Enter the 6-digit security code sent to <span className="font-bold underline">{pendingLoginUser?.email || formData.email}</span>.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/90">Verification Code</label>
                    <input
                      type="text"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="h-12 w-full text-center tracking-widest text-lg font-mono rounded-xl border border-white/20 bg-white/10 px-4 text-white outline-none focus:border-white/50 focus:bg-white/20"
                    />
                  </div>
                  <button type='submit' className="group border-2 bg-primary-linear px-6 py-2 text-white hover:bg-white hover:border-primary-linear transition-all cursor-pointer">
                    <span className="group-hover:text-primary-linear group-hover:font-bold">Verify &amp; Continue</span>
                  </button>

                  <div className="flex items-center justify-between text-xs text-white/70">
                    <button
                      type="button"
                      disabled={sendingCode || !pendingLoginUser}
                      onClick={() => pendingLoginUser && triggerMfaCode(pendingLoginUser.email || formData.email, pendingLoginUser)}
                      className="hover:text-white underline cursor-pointer disabled:opacity-50"
                    >
                      {sendingCode ? "Sending..." : "Resend Code"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMfaStep(false)}
                      className="hover:text-white cursor-pointer"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              ) : (
                /* STANDARD LOGIN FORM */
                <>
                  <div className="flex flex-col mb-8 text-center">
                    <h2 className="text-3xl font-bold tracking-tight mb-2">
                      Welcome Back
                    </h2>
                    <p className="text-sm font-geist">
                      Glad to have you back 😊
                    </p>
                  </div>

                  <div className="flex flex-col gap-6 font-geist">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full flex items-center justify-center gap-3 rounded-xl border border-line-linear bg-white/5 px-4 py-3.5 text-sm font-regular transition-all hover:bg-white/10 hover:border-white/30 shadow-sm active:scale-[0.98] text-black"
                    >
                      <Image src="/icons/google.svg" width={24} height={24} alt='Google Icon' />
                      Sign in with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-white/20"></div>
                      <span className="text-xs font-medium uppercase text-white/50 tracking-wider">Or continue with</span>
                      <div className="h-px flex-1 bg-white/20"></div>
                    </div>

                    <form className="grid grid-cols-2 gap-4">
                      {formContent.map((item, key) => {
                        const isHalfWidth = item.id === "firstName" || item.id === "lastName";
                        const isPasswordField = item.id === "password"
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
                          </div>
                        );
                      })}
                    </form>

                    <div className='font-geist flex justify-between items-center'>
                      <button
                        type="button"
                        onClick={() => { setIsForgotOpen(true); setForgotEmail(formData.email); }}
                        className='text-sm font-medium text-white/90 hover:text-white underline cursor-pointer'
                      >
                        Forgot Password ?
                      </button>
                    </div>

                    <button type='button' onClick={handleLogin} className="group border-2 bg-primary-linear px-6 py-2 text-white hover:bg-white hover:border-primary-linear transition-all cursor-pointer">
                      <span className="group-hover:text-primary-linear group-hover:font-bold">Login</span>
                    </button>
                  </div>
                </>
              )}

              {/* Footer Sign Up Link */}
              <p className="mt-6 text-center text-sm text-white/70 font-geist">
                Don&apos;t have an account ?{" "}
                <Link href="/Register" className="font-semibold text-white underline hover:text-white/80 transition-colors">
                  Sign Up
                </Link>
              </p>

            </div>
          </div>
        </section>

        {/* FORGOT PASSWORD MODAL */}
        {isForgotOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-gray-900 animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h3>
              <p className="text-xs text-gray-500 mb-6">Enter your registered email address and we will send you instructions to reset your password.</p>

              <form onSubmit={handleSendForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#1363CB] outline-none text-sm text-gray-800"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-3 px-4 bg-[#1363CB] hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? "Sending..." : "Send Reset Email"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}

export default Login
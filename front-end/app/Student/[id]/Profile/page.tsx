'use client';
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signOut, sendPasswordResetEmail, updatePassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, LogOut, Save, User, BookOpen, Target, Brain, Zap, Mic, CheckCircle2, Shield, Key, Camera, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";

const TABS = [
  { id: "learning", label: "Learning", icon: Target },
  { id: "security", label: "Security", icon: Shield },
] as const;

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"learning" | "security">("learning");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profileData, setProfileData] = useState<any>({
    academicGoals: "",
    topics: "",
    subjects: "",
    learningStyle: "Adaptive",
    avatarUrl: "",
    mfaEnabled: false
  });

  const [userName, setUserName] = useState("Student");
  const [userEmail, setUserEmail] = useState("");

  // Password & Security state
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string, error?: boolean } | null>(null);

  // Handle Avatar Image File Upload from Device
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setProfileData((prev: any) => ({ ...prev, avatarUrl: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Fetch Existing Profile Data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!studentId) return;

      const user = auth.currentUser;
      if (user) {
        setUserName(user.displayName || "Student");
        setUserEmail(user.email || "");

        try {
          const token = await user.getIdToken();
          const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:5000";

          const res = await fetch(`${baseUrl}/api/profile/${studentId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.ok) {
            const data = await res.json();
            const p = data.profile || data;
            setProfileData({
              academicGoals: p.academicGoals || "",
              topics: p.topics?.join(", ") || "",
              subjects: p.subjects?.join(", ") || "",
              learningStyle: p.learningStyle?.[0] || "Adaptive",
              preferredVoice: p.preferredVoice || "aura-asteria-en",
              avatarUrl: p.avatarUrl || user.photoURL || "",
              mfaEnabled: p.mfaEnabled || false,
              personality: p.personality || {},
              knowledgeLevel: p.knowledgeLevel || {},
              availability: p.availability || {}
            });
          }
        } catch (error) {
          console.error("Failed to load profile", error);
        } finally {
          setLoading(false);
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) fetchProfile();
      else router.push("/login");
    });

    return () => unsubscribe();
  }, [studentId, router]);

  // Handle Updates
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  // Handle Form Submission (Save Profile)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Update Firebase Auth photoURL if set
      if (profileData.avatarUrl && profileData.avatarUrl !== user.photoURL) {
        try {
          await updateProfile(user, { photoURL: profileData.avatarUrl });
        } catch (fbErr) {
          console.warn("Optional Firebase Auth photoURL sync warning:", fbErr);
        }
      }

      const token = await user.getIdToken();
      const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:5000";

      const payload = {
        ...profileData,
        learningStyle: [profileData.learningStyle],
        topics: profileData.topics.split(",").map((t: string) => t.trim()).filter(Boolean),
        subjects: profileData.subjects.split(",").map((s: string) => s.trim()).filter(Boolean),
      };

      const res = await fetch(`${baseUrl}/api/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Profile & Security preferences saved!");
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(`Failed to update profile: ${errorData.message || res.statusText || res.status}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ text: "Password must be at least 6 characters long.", error: true });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        setPasswordMsg({ text: "Password updated successfully!" });
        setNewPassword("");
      }
    } catch (err: unknown) {
      console.error("Password update error", err);
      setPasswordMsg({ text: (err as Error).message || "Failed to update password. Try re-logging in.", error: true });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!userEmail) return;
    try {
      await sendPasswordResetEmail(auth, userEmail);
      toast.success(`Password reset email sent to ${userEmail}!`);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to send reset email.");
    }
  };

  // Handle Firebase Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };


  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm text-gray-800 outline-none transition-all focus:border-[#1363CB] focus:bg-white focus:ring-2 focus:ring-[#1363CB]/30";
  const labelClass =
    "mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-gray-500";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#1363CB]" />
          <p className="text-sm font-semibold text-gray-500">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Cover banner */}
      <div className="h-44 w-full bg-gradient-to-br from-[#1363CB] via-[#4A4FD6] to-[#9C2FDF] sm:h-56" />

      <div className="mx-auto -mt-16 w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFileChange}
          />

          {/* Identity header */}
          <header className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_12px_32px_-12px_rgba(19,99,203,0.18)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:p-6">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Click to change profile picture"
              className="group relative -mt-16 h-24 w-24 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-gray-100 shadow-lg sm:h-28 sm:w-28"
            >
              {profileData.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileData.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1363CB] to-[#9C2FDF] text-2xl font-bold text-white">
                  {userName.substring(0, 2).toUpperCase()}
                </span>
              )}
              <span className="absolute inset-0 hidden flex-col items-center justify-center gap-1 bg-black/50 text-[10px] font-bold text-white group-hover:flex">
                <Camera className="h-4 w-4" />
                Change
              </span>
            </button>

            <div className="col-span-2 min-w-0 sm:col-span-1">
              <h1 className="truncate text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {userName}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-gray-500">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {userEmail}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-[#1363CB]">
                  {profileData.learningStyle}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${profileData.mfaEnabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}
                >
                  MFA {profileData.mfaEnabled ? "on" : "off"}
                </span>
              </div>
            </div>

            <div className="col-span-2 flex gap-2 sm:col-span-1 sm:justify-end">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-200"
              >
                <Camera className="h-4 w-4" /> Upload
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </header>

          <form onSubmit={handleSave} className="mt-6">
            {/* Tabs */}
            <div className="mb-6 inline-flex gap-1 rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${activeTab === id
                      ? "bg-[#1363CB] text-white shadow-md shadow-[#1363CB]/25"
                      : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>

            {/* LEARNING */}
            {activeTab === "learning" && (
              <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                    <Target className="h-4 w-4 text-[#1363CB]" /> Learning Preferences
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">Tell the tutor what you&apos;re working toward.</p>
                </div>

                <div className="mt-6 space-y-6">
                  <div>
                    <label className={labelClass}>
                      <User className="h-3.5 w-3.5" /> Current Academic Goals
                    </label>
                    <textarea
                      name="academicGoals"
                      rows={4}
                      value={profileData.academicGoals}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="E.g., Score above 90% in calculus midterms."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>
                        <BookOpen className="h-3.5 w-3.5" /> Enrolled Subjects
                      </label>
                      <input
                        type="text"
                        name="subjects"
                        value={profileData.subjects}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="E.g., Math, Science (Comma separated)"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        <Zap className="h-3.5 w-3.5" /> Active Topics
                      </label>
                      <input
                        type="text"
                        name="topics"
                        value={profileData.topics}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="E.g., Algebra, React (Comma separated)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      <Brain className="h-3.5 w-3.5" /> Preferred Learning Style
                    </label>
                    <select
                      name="learningStyle"
                      value={profileData.learningStyle}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="Adaptive">Adaptive (Let AI Decide)</option>
                      <option value="Visual">Visual (Diagrams &amp; Imagery)</option>
                      <option value="Aural">Aural (Listening &amp; Speaking)</option>
                      <option value="Read/Write">Read/Write (Text Heavy)</option>
                      <option value="Kinesthetic">Kinesthetic (Interactive &amp; Examples)</option>
                    </select>
                  </div>
                </div>
              </section>
            )}



            {/* SECURITY */}
            {activeTab === "security" && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                    <Shield className="h-4 w-4 text-[#1363CB]" /> Security &amp; MFA
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">Add a second step when signing in.</p>

                  <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        <Lock className="h-3.5 w-3.5 text-gray-400" /> Multi-Factor Auth (MFA)
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">Require 2FA code on login</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfileData({ ...profileData, mfaEnabled: !profileData.mfaEnabled })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${profileData.mfaEnabled ? "bg-[#1363CB]" : "bg-gray-300"
                        }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${profileData.mfaEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                      />
                    </button>
                  </div>
                </section>

                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                    <Key className="h-4 w-4 text-[#1363CB]" /> Update Password
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">Use at least 6 characters.</p>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className={labelClass}>
                        <Lock className="h-3.5 w-3.5" /> New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 chars)"
                        className={inputClass}
                      />
                    </div>

                    {passwordMsg && (
                      <p
                        className={`rounded-xl px-3 py-2 text-xs font-semibold ${passwordMsg.error
                            ? "bg-red-50 text-red-600"
                            : "bg-emerald-50 text-emerald-700"
                          }`}
                      >
                        {passwordMsg.text}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleUpdatePassword}
                        disabled={passwordLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#1363CB] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#1363CB]/20 transition-all hover:bg-[#1054a8] disabled:opacity-70"
                      >
                        {passwordLoading ? "Updating..." : "Update Password"}
                      </button>
                      <button
                        type="button"
                        onClick={handleSendResetEmail}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50"
                      >
                        Email Reset
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            <div className="my-8 h-px w-full bg-gray-100" />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">Changes apply to your next study session.</p>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#1363CB] px-8 py-3 font-bold text-white shadow-lg shadow-[#1363CB]/20 transition-all hover:bg-[#1054a8] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

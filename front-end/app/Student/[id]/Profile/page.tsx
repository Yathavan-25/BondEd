/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getAuth, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, LogOut, Save, User, BookOpen, Target, Brain, Zap } from "lucide-react";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>({
    academicGoals: "",
    topics: "",
    subjects: "",
    learningStyle: "Adaptive"
  });

  const [userName, setUserName] = useState("Student");
  const [userEmail, setUserEmail] = useState("");

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
              // We preserve these so we don't accidentally overwrite them
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

    // Give Firebase a tiny moment to ensure auth is loaded
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) fetchProfile();
      else router.push("/login"); // Kick out if logged out
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
      const token = await auth.currentUser?.getIdToken();
      const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:5000";

      // Convert comma strings back to arrays
      const payload = {
        ...profileData,
        learningStyle: [profileData.learningStyle],
        topics: profileData.topics.split(",").map((t: string) => t.trim()).filter(Boolean),
        subjects: profileData.subjects.split(",").map((s: string) => s.trim()).filter(Boolean),
      };

      const res = await fetch(`${baseUrl}/api/profile`, {
        method: "POST", // Your submitQuestionnaire controller uses POST /api/profile
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Firebase Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/"); // Redirect to homepage after logout
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 className="size-10 animate-spin mb-4 text-[#1363CB]" />
        <p className="font-semibold text-lg">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 pt-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Account Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your profile, preferences, and account security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: User Identity & Actions */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#1363CB] to-[#9C2FDF] flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-[#9C2FDF]/20 mb-4">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{userName}</h2>
            <p className="text-gray-500 text-sm mt-1">{userEmail}</p>
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
              <User className="w-3.5 h-3.5" /> BondEd Student
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Danger Zone</h3>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Editable Form */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#9C2FDF]" /> Learning Preferences
            </h3>

            <div className="space-y-6">
              
              {/* Academic Goals */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-400" /> Current Academic Goals
                </label>
                <textarea
                  name="academicGoals"
                  value={profileData.academicGoals}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#1363CB]/30 focus:border-[#1363CB] outline-none transition-all text-sm text-gray-800"
                  placeholder="E.g., I want to improve my grades in Computer Science..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subjects */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" /> Enrolled Subjects
                  </label>
                  <input
                    type="text"
                    name="subjects"
                    value={profileData.subjects}
                    onChange={handleChange}
                    className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#1363CB]/30 focus:border-[#1363CB] outline-none transition-all text-sm text-gray-800"
                    placeholder="E.g., Math, Science (Comma separated)"
                  />
                </div>

                {/* Topics */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-gray-400" /> Active Topics
                  </label>
                  <input
                    type="text"
                    name="topics"
                    value={profileData.topics}
                    onChange={handleChange}
                    className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#1363CB]/30 focus:border-[#1363CB] outline-none transition-all text-sm text-gray-800"
                    placeholder="E.g., Algebra, React (Comma separated)"
                  />
                </div>
              </div>

              {/* Learning Style */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-gray-400" /> Preferred Learning Style
                </label>
                <select
                  name="learningStyle"
                  value={profileData.learningStyle}
                  onChange={handleChange}
                  className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#1363CB]/30 focus:border-[#1363CB] outline-none transition-all text-sm text-gray-800"
                >
                  <option value="Adaptive">Adaptive (Let AI Decide)</option>
                  <option value="Visual">Visual (Diagrams & Imagery)</option>
                  <option value="Aural">Aural (Listening & Speaking)</option>
                  <option value="Read/Write">Read/Write (Text Heavy)</option>
                  <option value="Kinesthetic">Kinesthetic (Interactive & Examples)</option>
                </select>
              </div>

            </div>

            <div className="w-full h-px bg-gray-100 my-8" />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-[#1363CB] hover:bg-[#1054a8] text-white font-bold rounded-xl shadow-lg shadow-[#1363CB]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>

      </div>
    </div>
  );
}
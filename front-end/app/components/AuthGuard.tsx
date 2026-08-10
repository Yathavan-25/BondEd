'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, } from 'firebase/auth';
import { auth } from '@/config/firebase'; // Ensure this matches your firebase export
import { Loader2 } from 'lucide-react';

const publicPaths = [
  '/',
  '/Login',
  '/Register',
  '/VerifyEmail',
  '/About',
  '/Faqs',
  '/Contact',
  '/Privacy',
  '/Terms'
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebase) => {
      
      const isPublicPath = publicPaths.includes(pathname);
      const isOnboarding = pathname.startsWith('/OnBoardingFlow');

      if (!firebase) {
        if (!isPublicPath) {
          router.replace('/Login');
        } else {
          setLoading(false);
        }
        return;
      }

      // If user is authenticated, we need to check their onboarding status
      try {
        const token = await firebase.getIdToken();
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';
        const res = await fetch(`${baseUrl}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          const hasCompletedOnboarding = data?.user?.hasCompletedOnboarding;

          if (!hasCompletedOnboarding) {
            // hasn't completed onboarding. Allow them on OnboardingFlow or public paths, else redirect
            if (!isOnboarding && !isPublicPath) {
              router.replace(`/OnBoardingFlow/${firebase.uid}`);
            } else {
              setLoading(false);
            }
          } else {
            // HAS completed onboarding. 
            // If they are on OnboardingFlow, kick them to Dashboard.
            if (isOnboarding) {
              router.replace(`/Student/${firebase.uid}/Dashboard`);
            } else if (pathname === '/Login' || pathname === '/Register') {
              router.replace(`/Student/${firebase.uid}/Dashboard`);
            } else {
              setLoading(false);
            }
          }
        } else {
          // If the backend fails to respond properly, just let them through (or handle error)
          console.error("Failed to fetch user data for AuthGuard", res.status);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking user status in AuthGuard:", error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}

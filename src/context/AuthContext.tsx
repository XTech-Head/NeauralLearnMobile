// src/context/AuthContext.tsx — Firebase auth state, exposed app-wide
import {
    createUserWithEmailAndPassword,
    deleteUser,
    EmailAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    reauthenticateWithCredential,
    sendEmailVerification,
    signInWithEmailAndPassword,
    updatePassword,
    updateProfile,
    verifyBeforeUpdateEmail,
    type User,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getUserByFirebaseUid, upsertUserProfile } from "../lib/db";
import { auth } from "../lib/firebase";

interface AuthContextValue {
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  isVerified: boolean;
  /** null = not checked yet (still loading or not applicable), true = the
   *  onboarding screen should be shown, false = already completed it. */
  needsOnboarding: boolean | null;
  /** Call right after completeOnboarding() succeeds so the gate/UI update
   *  immediately, without waiting for a re-fetch. */
  markOnboardingComplete: () => void;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  /** Re-authenticates with the current password, then sends a verification
   *  link to newEmail. The email on the account does NOT change until the
   *  user clicks that link — Firebase deprecated instant email changes in
   *  favor of this flow. Poll `refreshUser` afterward to detect completion. */
  changeEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  /** Re-authenticates with the current password, then sets the new one. */
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  /** Re-authenticates with the given password, then permanently deletes the
   *  Firebase account. Throws with code "auth/wrong-password" (or similar)
   *  if the password is wrong — callers should show that inline. */
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsLoaded(true);
    });
    return unsub;
  }, []);

  // Check onboarding status once a verified user shows up. Resets to null
  // (unknown) when signed out, so a later sign-in re-checks fresh.
  useEffect(() => {
    if (!user?.emailVerified) {
      setNeedsOnboarding(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const row = await getUserByFirebaseUid(user.uid);
        if (!cancelled) setNeedsOnboarding(!row?.onboarding_completed);
      } catch (e) {
        console.error("Onboarding status check error:", e);
        // Fail open — don't trap the user behind a broken check.
        if (!cancelled) setNeedsOnboarding(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.emailVerified]);

  const markOnboardingComplete = () => setNeedsOnboarding(false);

  const signUp = async (email: string, password: string, username: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: username });
    await sendEmailVerification(cred.user);
    // Mirror the user into Supabase (Firebase uid is the foreign key everywhere).
    await upsertUserProfile({
      firebaseUid: cred.user.uid,
      email,
      username,
    });
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resendVerification = async () => {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser);
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser(auth.currentUser ? ({ ...auth.currentUser } as User) : null);
    }
  };

  const updateDisplayName = async (name: string) => {
    if (!auth.currentUser) throw new Error("Not signed in");
    await updateProfile(auth.currentUser, { displayName: name });
    setUser({ ...auth.currentUser } as User);
  };

  /** Shared by every destructive/sensitive action below — Firebase requires
   *  a *recent* sign-in for these, and re-authenticating right before satisfies
   *  that without forcing a full sign-out/sign-in round trip. */
  const reauthenticate = async (password: string) => {
    if (!auth.currentUser?.email) throw new Error("Not signed in");
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      password,
    );
    await reauthenticateWithCredential(auth.currentUser, credential);
  };

  const changeEmail = async (newEmail: string, currentPassword: string) => {
    if (!auth.currentUser) throw new Error("Not signed in");
    await reauthenticate(currentPassword);
    // This sends a confirmation link to newEmail — the account's email only
    // actually updates once that link is clicked, not immediately here.
    await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    if (!auth.currentUser) throw new Error("Not signed in");
    await reauthenticate(currentPassword);
    await updatePassword(auth.currentUser, newPassword);
  };

  const deleteAccount = async (password: string) => {
    if (!auth.currentUser) throw new Error("Not signed in");
    await reauthenticate(password);
    await deleteUser(auth.currentUser);
  };

  const value: AuthContextValue = {
    user,
    isLoaded,
    isSignedIn: !!user,
    isVerified: !!user?.emailVerified,
    needsOnboarding,
    markOnboardingComplete,
    signUp,
    signIn,
    signOut,
    resendVerification,
    refreshUser,
    updateDisplayName,
    changeEmail,
    changePassword,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

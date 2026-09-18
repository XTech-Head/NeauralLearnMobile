// src/types/firebase-rn-auth.d.ts
//
// firebase/auth's published .d.ts (the "types" condition in its exports
// map) points at a platform-generic build and omits
// getReactNativePersistence, even though the function is genuinely present
// at runtime: firebase/auth re-exports * from @firebase/auth, and Metro
// (bundling for the "react-native" platform) resolves that nested
// specifier to @firebase/auth's RN-specific build, which does define it.
// This just restores the type for tsc; it changes nothing at runtime.
import type { Persistence } from "firebase/auth";

interface ReactNativeAsyncStorageLike {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
}

declare module "firebase/auth" {
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorageLike,
  ): Persistence;
}

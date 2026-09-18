# "Cannot find native module 'ClerkExpo'" — patch notes

Drop these two new files into your project root (they don't touch anything
you already have — `metro.config.js` didn't exist before, and neither did
`shims/`).

## What was actually happening

This isn't a bug in your code — it's a known **Expo Go on Android**
limitation with `@clerk/expo`. Expo Go is a fixed, pre-built app from the
Play Store; it only contains Expo's own native modules, not third-party ones
like Clerk's. `@clerk/expo` needs a custom "development build" for its
native module to exist at all.

Normally that would just mean native-only features (Google/Apple sign-in,
`<AuthView>`, passkeys) silently fall back to unavailable. But on Android
specifically, `@clerk/expo`'s bundle calls
`requireNativeModule('ClerkExpo')` at the **top of the file**, outside any
try/catch — so it throws immediately the moment anything imports
`@clerk/expo`, before your app even starts. That's why your log showed
*every single route* as "missing the required default export" — they all
import `@clerk/expo` transitively (directly, or via `app/_layout.tsx`'s
`ClerkProvider`), so all of them crashed on load, not just sign-in.

Your actual auth flow (`useSignIn`/`useSignUp`, email + password) is
JavaScript-only and doesn't need any native module — it should work fine in
Expo Go. The crash was just an overly-eager import, not a real feature gap.

## The fix

- **`metro.config.js`** (new) — adds a targeted Metro resolver rule: on
  Android, when `@clerk/expo`'s internal code asks for its native module
  file, redirect that one specific import to a stub instead of letting it
  crash. Everything else resolves completely normally — this doesn't touch
  iOS or web bundling at all (verified: iOS still resolves Clerk's real
  `NativeClerkModule.js`, unaffected).

- **`shims/clerk-expo-native-module.js`** (new) — the stub. It exports
  `{ default: null }`, which is exactly what `@clerk/expo`'s own code
  already expects when no native module is available — it checks for that
  and falls back to the pure-JS flow cleanly.

**This is automatically inert once you move to a real dev client.** The
resolver checks `require.resolve('expo-dev-client')` first — if that
package is installed (i.e. you've started using `npx expo run:android` /
EAS Build instead of Expo Go), the whole shim is skipped and the real
compiled native module is used. Nothing to remove by hand later.

## Verified

I couldn't run an emulator in my sandbox, but I did verify the part that
matters — the actual module resolution:

```
npx expo export --platform android --no-minify --source-maps
```

Confirmed in the resulting source map that the bundle includes
`shims/clerk-expo-native-module.js` and does **not** include the crashing
`@clerk/expo/dist/specs/NativeClerkModule.android.js` anywhere in the graph.
Re-ran the same export for `--platform ios` and confirmed iOS still resolves
the real, unshimmed native module file — so this only changes Android
behavior, as intended.

## When you'll actually want a dev client instead

This shim gets your email/password flow running in Expo Go, which is the
fastest way to keep iterating. But Expo Go can never support:

- Native Google/Apple Sign-In
- Clerk's `<AuthView>` / native UI components
- Passkeys

If you add any of those later, you'll need `expo-dev-client` and to build
with `npx expo run:android` / `eas build` — at which point this shim gets
out of the way automatically, as noted above.

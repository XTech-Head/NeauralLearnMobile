// shims/clerk-expo-native-module.js
//
// Expo Go on Android does not ship @clerk/expo's compiled native module
// ("ClerkExpo"), and @clerk/expo's Android bundle calls
// requireNativeModule('ClerkExpo') at the top level of
// dist/specs/NativeClerkModule.android.js — eagerly, not lazily inside a
// try/catch — which crashes the whole app on import, before the JS-only
// email/password flow this app actually uses ever gets a chance to run.
//
// metro.config.js redirects that one internal import to this file instead,
// but ONLY while there's no custom dev client installed (see the check
// there). Exporting `default: null` here matches what @clerk/expo's own
// native-module.js already expects when no real native module is present —
// it treats `null` as "native features unavailable" and falls back to the
// pure-JS flow cleanly.
//
// Once you add `expo-dev-client` and build with `npx expo run:android` (or
// EAS Build), the real compiled native module takes over automatically and
// this shim is skipped — see metro.config.js. At that point you can delete
// this file and the resolver block, or just leave them; they're inert once
// expo-dev-client is installed.

module.exports = { default: null };

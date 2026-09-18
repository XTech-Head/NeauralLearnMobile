// src/hooks/useVoiceRecorder.ts — records speech and resolves it as plain
// text, transcribed entirely on-device. Replaces the old expo-audio-based
// hook that captured raw audio for Gemini to listen to directly — OpenRouter
// has no free model that accepts audio, so transcription now happens here
// instead, and the AI layer (src/lib/ai.ts) never sees anything but text.
//
// Uses expo-speech-recognition (iOS SFSpeechRecognizer / Android
// SpeechRecognizer) — a custom native module, NOT part of Expo Go's
// built-in module set. This means: voice input needs a development build
// to test (`npx expo run:android` / `run:ios`, or an EAS dev build) — it
// will not work in plain Expo Go. Nothing else in the app is affected by
// that requirement.
import { useCallback, useRef, useState } from "react";

const speechApi = (() => {
  try {
    return Function("return require('expo-speech-recognition')")();
  } catch {
    return null;
  }
})();

const useSpeechEvent =
  speechApi?.useSpeechRecognitionEvent ?? (() => undefined);
const ExpoSpeechRecognitionModule =
  speechApi?.ExpoSpeechRecognitionModule ?? null;

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [durationMillis, setDurationMillis] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const transcriptRef = useRef("");
  const resolveRef = useRef<((text: string | null) => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useSpeechEvent("start", () => {
    setIsRecording(true);
    setDurationMillis(0);
    timerRef.current = setInterval(
      () => setDurationMillis((d) => d + 200),
      200,
    );
  });

  useSpeechEvent("result", (event: any) => {
    const text = event.results[0]?.transcript;
    if (text) transcriptRef.current = text;
  });

  useSpeechEvent("end", () => {
    stopTimer();
    setIsRecording(false);
    const text = transcriptRef.current.trim();
    transcriptRef.current = "";
    resolveRef.current?.(text || null);
    resolveRef.current = null;
  });

  useSpeechEvent("error", (event: any) => {
    stopTimer();
    setIsRecording(false);
    if (event.error === "not-allowed") setPermissionDenied(true);
    resolveRef.current?.(null);
    resolveRef.current = null;
  });

  const start = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule) {
      setPermissionDenied(true);
      return;
    }

    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      setPermissionDenied(true);
      return;
    }
    setPermissionDenied(false);
    transcriptRef.current = "";
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: false,
      continuous: false,
    });
  }, []);

  /** Stops listening and resolves with the transcribed text — or null if
   *  nothing was recognized, permission was denied, or an error occurred. */
  const stop = useCallback((): Promise<string | null> => {
    if (!ExpoSpeechRecognitionModule) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      resolveRef.current = resolve;
      ExpoSpeechRecognitionModule.stop();
    });
  }, []);

  /** Cancels without producing a transcript (e.g. user backs out mid-recording). */
  const cancel = useCallback(() => {
    if (!ExpoSpeechRecognitionModule) return;
    resolveRef.current = null;
    ExpoSpeechRecognitionModule.abort();
  }, []);

  return { isRecording, durationMillis, permissionDenied, start, stop, cancel };
}

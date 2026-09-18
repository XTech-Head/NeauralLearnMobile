// src/lib/attachments.ts — pick an image and base64-encode it for the AI
// tutor's image_url content part. Document/PDF picking was dropped when
// migrating off Gemini to OpenRouter — see the note at the top of ai.ts.
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import type { Attachment } from "./ai";

export async function pickImageAttachment(): Promise<Attachment | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.6,
    base64: false, // we read via expo-file-system for a consistent path below
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const file = new File(asset.uri);
  const base64 = await file.base64();
  const mimeType = asset.mimeType ?? "image/jpeg";

  return { kind: "image", base64, mimeType };
}
/**
 * Helpers Supabase Storage pour les photos de profil.
 *
 * Bucket : `avatars` (public read, owner write).
 * Layout : `{user_id}/avatar.jpg` — un seul fichier par user, écrasement à
 * chaque update. La public URL est cache-bustée par un `?v=<timestamp>`
 * pour forcer le rafraîchissement après upload.
 */
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

const BUCKET = 'avatars';

export async function pickImageFromLibrary(): Promise<ImagePicker.ImagePickerAsset | null> {
  // Demande la permission seulement si nécessaire (Android < 13 / iOS).
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("L'accès à tes photos est nécessaire pour choisir un avatar.");

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

/**
 * Upload un fichier local vers le bucket avatars sous le path `{userId}/avatar.{ext}`.
 * Retourne la public URL avec cache-bust pour invalider les caches d'image.
 */
export async function uploadAvatar(
  userId: string,
  asset: ImagePicker.ImagePickerAsset,
): Promise<string> {
  const mime = asset.mimeType ?? 'image/jpeg';
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const path = `${userId}/avatar.${ext}`;

  // React Native : on doit lire le fichier en blob via fetch.
  const response = await fetch(asset.uri);
  const blob = await response.blob();

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: mime,
    upsert: true,
    cacheControl: '3600',
  });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

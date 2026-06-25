import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

// Abre la galería, deja recortar en cuadrado, sube la foto al bucket `avatars`
// (una sola por usuario: `{userId}/avatar.jpg`, se sobreescribe) y devuelve la
// URL pública con cache-buster para que la UI la refresque. Devuelve null si el
// usuario cancela. Lanza Error('sin-permiso') si no conceden acceso a las fotos.
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('sin-permiso');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    base64: true,
  });
  if (result.canceled) return null;

  const base64 = result.assets[0]?.base64;
  if (!base64) return null;

  const path = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, decode(base64), { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

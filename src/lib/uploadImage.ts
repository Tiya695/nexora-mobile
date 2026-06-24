import * as ImagePicker from 'expo-image-picker';

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '@env';

const cloudName = CLOUDINARY_CLOUD_NAME;
const uploadPreset = CLOUDINARY_UPLOAD_PRESET;

export async function pickImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function takePhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    quality: 0.6,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function uploadToCloudinary(uri: string): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    const data = await res.json();
    console.log('Cloudinary response:', JSON.stringify(data));
    return data.secure_url ?? null;
  } catch (e) {
    console.error('Upload failed:', e);
    return null;
  }
}

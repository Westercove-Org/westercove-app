import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import type { Attachment } from './types';

/**
 * Attachment pickers behind a tiny interface, so screens don't touch the Expo
 * modules directly. Both return `null` when the user cancels. On web the modules
 * fall back to a hidden file input.
 */

export async function pickImage(): Promise<Attachment | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted && perm.canAskAgain === false) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  return { kind: 'image', uri: asset.uri, name: asset.fileName ?? 'photo' };
}

export async function pickDocument(): Promise<Attachment | null> {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  return { kind: 'document', uri: asset.uri, name: asset.name };
}

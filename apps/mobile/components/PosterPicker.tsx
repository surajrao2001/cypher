import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

type Props = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

export function PosterPicker({ value, onChange, disabled }: Props) {
  const auth = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);

  async function pickAndUpload() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is required to upload a poster.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    const asset = result.assets[0];
    setUploading(true);
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const name = asset.fileName ?? `poster.${asset.mimeType?.split('/')[1] ?? 'jpg'}`;
      const uploaded = await auth.api.uploadPoster(blob, name);
      onChange(uploaded.url);
      setShowUrl(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View className="gap-2">
      <Text variant="label">Event poster</Text>
      <Text variant="caption">
        Upload a flyer image for Discover cards and the event cover. JPEG/PNG/WebP/GIF, max 5MB.
      </Text>
      <Button loading={uploading} disabled={disabled} variant="secondary" onPress={() => void pickAndUpload()}>
        Upload from photos
      </Button>
      <Button
        disabled={disabled}
        variant="ghost"
        onPress={() => setShowUrl((open) => !open)}
      >
        {showUrl ? 'Hide URL field' : 'Paste image URL instead'}
      </Button>
      {showUrl ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          autoCapitalize="none"
          placeholder="https://…"
          placeholderTextColor={colors.muted}
          className="h-12 rounded-md border border-border bg-elevated px-3"
          style={{ color: colors.ink }}
        />
      ) : null}
      {value ? (
        <Text variant="caption" numberOfLines={2}>
          Poster set
        </Text>
      ) : null}
      {error ? (
        <Text variant="caption" className="text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

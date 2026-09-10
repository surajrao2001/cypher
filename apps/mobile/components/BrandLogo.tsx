import { Image, type ImageStyle, type StyleProp, View } from 'react-native';

const mark = require('@/assets/brand/bynd8-mark.png');
const lockup = require('@/assets/brand/bynd8-lockup-horizontal-dark.png');
const wordmark = require('@/assets/brand/bynd8-wordmark-dark.png');

type BrandLogoProps = {
  variant?: 'mark' | 'lockup' | 'wordmark';
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export function BrandLogo({ variant = 'lockup', height = 36, style }: BrandLogoProps) {
  const source = variant === 'mark' ? mark : variant === 'wordmark' ? wordmark : lockup;
  const aspect = variant === 'mark' ? 1 : variant === 'wordmark' ? 4.2 : 3.6;

  return (
    <View>
      <Image
        source={source}
        accessibilityLabel="BYND8"
        resizeMode="contain"
        style={[{ height, width: height * aspect }, style]}
      />
    </View>
  );
}

import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/format';
import { useCypherFonts } from '@/lib/fonts';

export type TextVariant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'kicker' | 'label';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  className?: string;
};

const variantClass: Record<TextVariant, string> = {
  display: 'text-5xl text-ink uppercase',
  title: 'text-3xl text-ink uppercase',
  subtitle: 'text-xl text-ink uppercase',
  body: 'text-base text-ink',
  caption: 'text-[13px] text-secondary',
  kicker: 'text-[11px] uppercase tracking-[2px] text-lime',
  label: 'text-xs uppercase tracking-[1.5px] text-secondary',
};

export function Text({ variant = 'body', className, style, ...props }: TextProps) {
  const fonts = useCypherFonts();
  const isDisplay = variant === 'display' || variant === 'title' || variant === 'subtitle';
  const fontFamily = isDisplay
    ? fonts.displayFamily
    : variant === 'label' || variant === 'kicker'
      ? fonts.bodySemiFamily
      : fonts.bodyFamily;

  return (
    <RNText
      className={cn(variantClass[variant], className)}
      style={[
        { fontFamily },
        !fonts.displayLoaded && isDisplay ? { letterSpacing: 1.2, fontWeight: '700' } : null,
        style,
      ]}
      {...props}
    />
  );
}

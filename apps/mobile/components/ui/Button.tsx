import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/format';
import { useCypherFonts } from '@/lib/fonts';
import { colors } from '@/lib/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'lime';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-accent active:bg-accent-hover',
  secondary: 'bg-elevated border border-border active:bg-surface',
  ghost: 'bg-transparent active:bg-elevated',
  lime: 'bg-lime active:opacity-90',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-10 px-3',
  md: 'h-12 px-4',
  lg: 'h-14 px-5',
};

const labelClass: Record<ButtonVariant, string> = {
  primary: 'text-ink',
  secondary: 'text-ink',
  ghost: 'text-ink',
  lime: 'text-bg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const fonts = useCypherFonts();
  const isDisabled = disabled || loading;
  const spinnerColor = variant === 'lime' ? colors.bg : colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(isDisabled), busy: loading }}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center rounded-md',
        variantClass[variant],
        sizeClass[size],
        isDisabled && 'opacity-40',
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text
          variant="label"
          className={cn('text-[13px] tracking-[1.8px]', labelClass[variant])}
          style={{ fontFamily: fonts.bodyBoldFamily }}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

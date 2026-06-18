import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';

type Variant = 'primary' | 'accent' | 'outline' | 'ghost';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
};

export function AppButton({ label, onPress, variant = 'primary', icon, loading, disabled }: AppButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variantStyle.container,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text.color} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={variantStyle.text.color} /> : null}
          <Text style={[styles.label, variantStyle.text]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const VARIANT_STYLES = {
  primary: {
    container: { backgroundColor: colors.primary, borderWidth: 0 },
    text: { color: colors.onPrimary },
  },
  accent: {
    container: { backgroundColor: colors.accent, borderWidth: 0 },
    text: { color: colors.onAccent },
  },
  outline: {
    container: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
    text: { color: colors.text },
  },
  ghost: {
    container: { backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0 },
    text: { color: colors.primary },
  },
} as const;

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  label: typography.label,
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});

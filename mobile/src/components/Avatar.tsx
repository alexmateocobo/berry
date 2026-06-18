import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type AvatarProps = {
  label: string;
  size?: number;
};

export function Avatar({ label, size = 48 }: AvatarProps) {
  const initials = label
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: colors.primary, fontWeight: '700' },
});

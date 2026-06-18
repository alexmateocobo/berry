import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { colors, spacing, typography } from '../theme';

type ListRowProps = {
  title: string;
  subtitle?: string;
  avatarLabel?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
};

export function ListRow({ title, subtitle, avatarLabel, leading, trailing, onPress }: ListRowProps) {
  const content = (
    <View style={styles.row}>
      {leading ?? (avatarLabel ? <Avatar label={avatarLabel} size={44} /> : null)}
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  pressed: { opacity: 0.7 },
  text: { flex: 1, gap: 2 },
  title: { ...typography.label, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted },
});

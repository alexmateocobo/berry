import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EventItem } from '../data';
import { colors, radii, spacing, typography } from '../theme';
import { formatEventDate, formatEventTime, formatPrice } from '../utils/format';

type EventCardProps = {
  event: EventItem;
  onPress: () => void;
  variant?: 'default' | 'compact';
};

export function EventCard({ event, onPress, variant = 'default' }: EventCardProps) {
  const isCompact = variant === 'compact';
  const time = formatEventTime(event);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, isCompact && styles.cardCompact, pressed && styles.pressed]}
    >
      {event.image_url ? (
        <Image
          source={{ uri: event.image_url }}
          style={[styles.image, isCompact && styles.imageCompact]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder, isCompact && styles.imageCompact]}>
          <Ionicons name="image-outline" size={28} color={colors.tabInactive} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.meta}>
          {formatEventDate(event)}
          {time ? ` · ${time}` : ''}
        </Text>
        {event.venue.name ? (
          <Text style={styles.meta} numberOfLines={1}>
            {event.venue.name}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formatPrice(event)}</Text>
          </View>
          {event.registration_required ? (
            <View style={[styles.badge, styles.badgeOutline]}>
              <Text style={styles.badgeOutlineText}>Registration</Text>
            </View>
          ) : null}
          {typeof event.spots_remaining === 'number' ? (
            <View style={[styles.badge, styles.badgeOutline]}>
              <Text style={styles.badgeOutlineText}>{event.spots_remaining} spots left</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardCompact: {
    width: 220,
  },
  pressed: { opacity: 0.9 },
  image: { width: '100%', height: 140, backgroundColor: colors.surface },
  imageCompact: { height: 110 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.md, gap: spacing.xs },
  title: { ...typography.heading, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted },
  footer: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, flexWrap: 'wrap' },
  badge: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { ...typography.caption, color: colors.text, fontWeight: '700' },
  badgeOutline: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  badgeOutlineText: { ...typography.caption, color: colors.textMuted },
});

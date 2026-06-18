import { useLayoutEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { Chip } from '../../components/Chip';
import { ScreenContainer } from '../../components/ScreenContainer';
import { FOLLOWS, getEventById } from '../../data';
import { colors, radii, spacing, typography } from '../../theme';
import { formatEventDate, formatEventTime, formatPrice } from '../../utils/format';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'EventDetail'>;

type RsvpStatus = 'none' | 'going' | 'interested';

export function EventDetailScreen({ route, navigation }: Props) {
  const { eventId } = route.params;
  const event = getEventById(eventId);
  const [rsvp, setRsvp] = useState<RsvpStatus>('none');
  const [liked, setLiked] = useState(false);

  useLayoutEffect(() => {
    if (event) navigation.setOptions({ title: event.title });
  }, [event, navigation]);

  if (!event) {
    return (
      <ScreenContainer>
        <Text style={styles.notFound}>Event not found.</Text>
      </ScreenContainer>
    );
  }

  const time = formatEventTime(event);

  return (
    <ScreenContainer>
      {event.image_url ? <Image source={{ uri: event.image_url }} style={styles.image} resizeMode="cover" /> : null}

      <View style={styles.headerRow}>
        <Text style={styles.title}>{event.title}</Text>
        <Pressable onPress={() => setLiked((value) => !value)} hitSlop={8}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={26} color={colors.accent} />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
        <Text style={styles.metaText}>
          {formatEventDate(event)}
          {time ? ` · ${time}` : ''}
        </Text>
      </View>

      {event.venue.name ? (
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={16} color={colors.textMuted} />
          <Text style={styles.metaText}>
            {event.venue.name}
            {event.venue.address ? `\n${event.venue.address}` : ''}
          </Text>
        </View>
      ) : null}

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{formatPrice(event)}</Text>
        </View>
        {event.registration_required ? (
          <View style={[styles.badge, styles.badgeOutline]}>
            <Text style={styles.badgeOutlineText}>Registration required</Text>
          </View>
        ) : null}
        {typeof event.spots_remaining === 'number' ? (
          <View style={[styles.badge, styles.badgeOutline]}>
            <Text style={styles.badgeOutlineText}>{event.spots_remaining} spots left</Text>
          </View>
        ) : null}
      </View>

      {event.tags.length ? (
        <View style={styles.chipRow}>
          {event.tags.map((tag) => (
            <Chip key={tag} label={tag} />
          ))}
        </View>
      ) : null}

      <Text style={styles.description}>{event.description}</Text>

      {event.organizer ? <Text style={styles.organizer}>Organized by {event.organizer}</Text> : null}

      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <AppButton
            label={rsvp === 'going' ? 'Going ✓' : 'Going'}
            variant={rsvp === 'going' ? 'accent' : 'outline'}
            onPress={() => setRsvp((status) => (status === 'going' ? 'none' : 'going'))}
          />
        </View>
        <View style={styles.actionButton}>
          <AppButton
            label={rsvp === 'interested' ? 'Interested ✓' : 'Interested'}
            variant={rsvp === 'interested' ? 'primary' : 'outline'}
            onPress={() => setRsvp((status) => (status === 'interested' ? 'none' : 'interested'))}
          />
        </View>
      </View>

      <AppButton
        label={event.registration_required ? 'Get tickets / register' : 'View original listing'}
        variant="primary"
        icon="open-outline"
        onPress={() => Linking.openURL(event.url)}
      />

      <AppButton
        label="See who's interested"
        variant="ghost"
        onPress={() => navigation.navigate('Likes', { eventId: event.id })}
      />
      <AppButton
        label={`View ${FOLLOWS[0].name}'s profile`}
        variant="ghost"
        onPress={() => navigation.navigate('UserProfile', { userId: FOLLOWS[0].id })}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  notFound: { ...typography.body, color: colors.textMuted },
  image: { width: '100%', height: 220, borderRadius: radii.lg, backgroundColor: colors.surface },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  title: { ...typography.title, color: colors.text, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  metaText: { ...typography.body, color: colors.text, flex: 1 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  badge: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: { ...typography.label, color: colors.text },
  badgeOutline: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  badgeOutlineText: { ...typography.caption, color: colors.textMuted },
  chipRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  description: { ...typography.body, color: colors.text },
  organizer: { ...typography.caption, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionButton: { flex: 1 },
});

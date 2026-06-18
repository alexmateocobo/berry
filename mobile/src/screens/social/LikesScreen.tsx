import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventCard } from '../../components/EventCard';
import { ListRow } from '../../components/ListRow';
import { ScreenContainer } from '../../components/ScreenContainer';
import { FOLLOWS, LIKED_EVENT_IDS, getEventById } from '../../data';
import type { EventItem } from '../../data';
import { colors, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Likes'>;

export function LikesScreen({ route, navigation }: Props) {
  const { eventId } = route.params;

  if (eventId) {
    const interested = FOLLOWS.slice(0, 2);

    return (
      <ScreenContainer>
        <Text style={styles.title}>Interested</Text>
        <Text style={styles.subtitle}>People who liked this event</Text>
        <View style={styles.list}>
          {interested.map((user) => (
            <ListRow
              key={user.id}
              avatarLabel={user.name}
              title={user.name}
              subtitle={user.handle}
              onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
            />
          ))}
        </View>
        <Text style={styles.subtitle}>+ {FOLLOWS.length - interested.length} more people you follow</Text>
      </ScreenContainer>
    );
  }

  const events = LIKED_EVENT_IDS.map((id) => getEventById(id)).filter((event): event is EventItem => Boolean(event));

  return (
    <ScreenContainer>
      <Text style={styles.title}>Your Likes</Text>
      <Text style={styles.subtitle}>{events.length} events you've liked</Text>
      <View style={styles.list}>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  list: { gap: spacing.md },
});

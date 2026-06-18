import { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { Avatar } from '../../components/Avatar';
import { EventCard } from '../../components/EventCard';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionHeader } from '../../components/SectionHeader';
import { MOCK_EVENTS, getUserById } from '../../data';
import { colors, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'UserProfile'>;

export function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const user = getUserById(userId);

  useLayoutEffect(() => {
    if (user) navigation.setOptions({ title: user.name });
  }, [user, navigation]);

  if (!user) {
    return (
      <ScreenContainer>
        <Text style={styles.notFound}>User not found.</Text>
      </ScreenContainer>
    );
  }

  const sharedEvents = MOCK_EVENTS.slice(0, 3);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Avatar label={user.name} size={72} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.handle}>{user.handle}</Text>
        </View>
      </View>

      <Text style={styles.bio}>{user.bio}</Text>
      <Text style={styles.mutuals}>You and {user.name.split(' ')[0]} both follow 3 people</Text>

      <AppButton
        label={`Swipe ${user.name.split(' ')[0]}'s swipes`}
        variant="accent"
        icon="shuffle"
        onPress={() =>
          navigation.navigate('SwipeDeck', { context: { type: 'user', id: user.id, label: user.name } })
        }
      />

      <SectionHeader title="You're both interested in" />
      <View style={styles.list}>
        {sharedEvents.map((event) => (
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
  notFound: { ...typography.body, color: colors.textMuted },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerText: { gap: 2 },
  name: { ...typography.title, color: colors.text },
  handle: { ...typography.body, color: colors.textMuted },
  bio: { ...typography.body, color: colors.text },
  mutuals: { ...typography.caption, color: colors.textMuted },
  list: { gap: spacing.md },
});

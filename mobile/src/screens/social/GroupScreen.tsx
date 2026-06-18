import { useLayoutEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { Avatar } from '../../components/Avatar';
import { EventCard } from '../../components/EventCard';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionHeader } from '../../components/SectionHeader';
import { getEventById, getGroupById, getUserById } from '../../data';
import type { EventItem } from '../../data';
import { colors, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'GroupPage'>;

export function GroupScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const group = getGroupById(groupId);

  useLayoutEffect(() => {
    if (group) navigation.setOptions({ title: group.name });
  }, [group, navigation]);

  if (!group) {
    return (
      <ScreenContainer>
        <Text style={styles.notFound}>Group not found.</Text>
      </ScreenContainer>
    );
  }

  const members = group.memberIds
    .map((id) => getUserById(id))
    .filter((user): user is NonNullable<typeof user> => Boolean(user));
  const events = group.eventIds.map((id) => getEventById(id)).filter((event): event is EventItem => Boolean(event));

  return (
    <ScreenContainer>
      <Text style={styles.title}>{group.name}</Text>

      <View style={styles.membersRow}>
        {members.map((member) => (
          <Pressable
            key={member.id}
            style={styles.memberItem}
            onPress={() =>
              member.id !== 'me' ? navigation.navigate('UserProfile', { userId: member.id }) : undefined
            }
          >
            <Avatar label={member.name} />
            <Text style={styles.memberName} numberOfLines={1}>
              {member.id === 'me' ? 'You' : member.name.split(' ')[0]}
            </Text>
          </Pressable>
        ))}
      </View>

      <AppButton
        label="Swipe group's swipes"
        variant="accent"
        icon="shuffle"
        onPress={() =>
          navigation.navigate('SwipeDeck', { context: { type: 'group', id: group.id, label: group.name } })
        }
      />

      <SectionHeader title="Upcoming for this group" />
      <View style={styles.list}>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
          />
        ))}
      </View>

      <AppButton label="View likes" variant="outline" onPress={() => navigation.navigate('Likes', {})} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  notFound: { ...typography.body, color: colors.textMuted },
  title: { ...typography.display, color: colors.text },
  membersRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  memberItem: { alignItems: 'center', gap: spacing.xs, width: 64 },
  memberName: { ...typography.caption, color: colors.textMuted },
  list: { gap: spacing.md },
});

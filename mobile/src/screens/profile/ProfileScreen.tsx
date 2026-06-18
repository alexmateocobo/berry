import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { Avatar } from '../../components/Avatar';
import { Card } from '../../components/Card';
import { ListRow } from '../../components/ListRow';
import { ScreenContainer } from '../../components/ScreenContainer';
import { CURRENT_USER, FOLLOWS, GROUPS, MY_EVENTS } from '../../data';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography } from '../../theme';
import type { AppStackParamList, MainTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<AppStackParamList>
>;

const STATS = [
  { label: 'Going', value: MY_EVENTS.going.length },
  { label: 'Interested', value: MY_EVENTS.interested.length },
  { label: 'Groups', value: GROUPS.length },
  { label: 'Following', value: FOLLOWS.length },
];

export function ProfileScreen({ navigation }: Props) {
  const logout = useAuthStore((state) => state.logout);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Avatar label={CURRENT_USER.name} size={72} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{CURRENT_USER.name}</Text>
          <Text style={styles.handle}>{CURRENT_USER.handle}</Text>
        </View>
      </View>
      <Text style={styles.bio}>{CURRENT_USER.bio}</Text>

      <Card style={styles.statsCard}>
        {STATS.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.list}>
        <ListRow
          title="My Events"
          subtitle="Events you're going to or interested in"
          leading={
            <View style={styles.iconWrap}>
              <Ionicons name="calendar-outline" size={22} color={colors.primary} />
            </View>
          }
          trailing={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          onPress={() => navigation.navigate('MyEvents')}
        />
        <ListRow
          title="Follows"
          subtitle={`${FOLLOWS.length} people you follow`}
          leading={
            <View style={styles.iconWrap}>
              <Ionicons name="people-outline" size={22} color={colors.primary} />
            </View>
          }
          trailing={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          onPress={() => navigation.navigate('Follows')}
        />
        <ListRow
          title="Settings"
          subtitle="Account, notifications, invitations"
          leading={
            <View style={styles.iconWrap}>
              <Ionicons name="settings-outline" size={22} color={colors.primary} />
            </View>
          }
          trailing={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          onPress={() => navigation.navigate('Settings')}
        />
      </View>

      <AppButton label="Log out" variant="outline" icon="log-out-outline" onPress={logout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerText: { gap: 2 },
  name: { ...typography.title, color: colors.text },
  handle: { ...typography.body, color: colors.textMuted },
  bio: { ...typography.body, color: colors.text },
  statsCard: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { ...typography.heading, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textMuted },
  list: { gap: spacing.xs },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

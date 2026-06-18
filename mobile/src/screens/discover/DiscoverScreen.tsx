import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionHeader } from '../../components/SectionHeader';
import { CURRENT_USER, FOLLOWS, GROUPS } from '../../data';
import { colors, radii, spacing, typography } from '../../theme';
import type { AppStackParamList, MainTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Discover'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function DiscoverScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <View>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Swipe through events curated for you, your groups, or your friends.</Text>
      </View>

      <Card style={styles.heroCard}>
        <Ionicons name="shuffle" size={28} color={colors.accent} />
        <Text style={styles.heroTitle}>Solo swipe</Text>
        <Text style={styles.heroBody}>
          Like or pass on events picked for {CURRENT_USER.name.split(' ')[0]}.
        </Text>
        <AppButton
          label="Start swiping"
          variant="accent"
          icon="play"
          onPress={() =>
            navigation.navigate('SwipeDeck', {
              context: { type: 'self', id: CURRENT_USER.id, label: CURRENT_USER.name },
            })
          }
        />
      </Card>

      <SectionHeader title="Swipe with a group" />
      <View style={styles.list}>
        {GROUPS.map((group) => (
          <Pressable
            key={group.id}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() =>
              navigation.navigate('SwipeDeck', { context: { type: 'group', id: group.id, label: group.name } })
            }
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{group.name}</Text>
              <Text style={styles.rowSubtitle}>{group.eventIds.length} events to react to</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Swipe with a friend" />
      <View style={styles.list}>
        {FOLLOWS.slice(0, 3).map((user) => (
          <Pressable
            key={user.id}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() =>
              navigation.navigate('SwipeDeck', { context: { type: 'user', id: user.id, label: user.name } })
            }
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{user.name}</Text>
              <Text style={styles.rowSubtitle}>See what {user.name.split(' ')[0]} might like</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  heroCard: { alignItems: 'flex-start', gap: spacing.sm },
  heroTitle: { ...typography.title, color: colors.text },
  heroBody: { ...typography.body, color: colors.textMuted },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowPressed: { opacity: 0.7 },
  rowText: { gap: 2 },
  rowTitle: { ...typography.label, color: colors.text },
  rowSubtitle: { ...typography.caption, color: colors.textMuted },
});

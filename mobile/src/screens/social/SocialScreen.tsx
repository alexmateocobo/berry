import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { ListRow } from '../../components/ListRow';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionHeader } from '../../components/SectionHeader';
import { FOLLOWS, FOLLOW_REQUESTS, GROUPS, GROUP_INVITATIONS } from '../../data';
import { colors, spacing, typography } from '../../theme';
import type { AppStackParamList, MainTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Social'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function SocialScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Social</Text>

      <SectionHeader title="Your groups" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupRow}>
        {GROUPS.map((group) => (
          <Pressable key={group.id} onPress={() => navigation.navigate('GroupPage', { groupId: group.id })}>
            <Card style={styles.groupCard}>
              <Ionicons name="people" size={22} color={colors.primary} />
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMeta}>{group.memberIds.length} members</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      <SectionHeader title="Following" actionLabel="See all" onPressAction={() => navigation.navigate('Follows')} />
      <View style={styles.list}>
        {FOLLOWS.map((user) => (
          <ListRow
            key={user.id}
            avatarLabel={user.name}
            title={user.name}
            subtitle={user.handle}
            onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
            trailing={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          />
        ))}
      </View>

      <SectionHeader title="Activity" />
      <View style={styles.list}>
        <ListRow
          title="Requests"
          subtitle={`${FOLLOW_REQUESTS.length} pending`}
          leading={<Ionicons name="person-add-outline" size={26} color={colors.primary} />}
          onPress={() => navigation.navigate('Requests')}
          trailing={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
        />
        <ListRow
          title="Likes"
          subtitle="Events you've liked"
          leading={<Ionicons name="heart-outline" size={26} color={colors.accent} />}
          onPress={() => navigation.navigate('Likes', {})}
          trailing={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
        />
        <ListRow
          title="Manage invitations"
          subtitle={`${GROUP_INVITATIONS.length} pending`}
          leading={<Ionicons name="mail-outline" size={26} color={colors.primary} />}
          onPress={() => navigation.navigate('ManageInvitations')}
          trailing={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
  groupRow: { gap: spacing.md, paddingRight: spacing.lg },
  groupCard: { width: 160, gap: spacing.xs, alignItems: 'flex-start' },
  groupName: { ...typography.label, color: colors.text },
  groupMeta: { ...typography.caption, color: colors.textMuted },
  list: { gap: spacing.xs },
});

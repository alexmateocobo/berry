import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ListRow } from '../../components/ListRow';
import { ScreenContainer } from '../../components/ScreenContainer';
import { GROUP_INVITATIONS } from '../../data';
import { colors, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.list}>
        <ListRow
          title="Account"
          subtitle="Profile info, email, password"
          leading={
            <View style={styles.iconWrap}>
              <Ionicons name="person-outline" size={22} color={colors.primary} />
            </View>
          }
          trailing={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          onPress={() => navigation.navigate('AccountSettings')}
        />
        <ListRow
          title="Notifications"
          subtitle="Friend activity, recommendations, follows"
          leading={
            <View style={styles.iconWrap}>
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
            </View>
          }
          trailing={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          onPress={() => navigation.navigate('NotificationSettings')}
        />
        <ListRow
          title="Manage invitations"
          subtitle={`${GROUP_INVITATIONS.length} pending group invitation${GROUP_INVITATIONS.length === 1 ? '' : 's'}`}
          leading={
            <View style={styles.iconWrap}>
              <Ionicons name="mail-open-outline" size={22} color={colors.primary} />
            </View>
          }
          trailing={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          onPress={() => navigation.navigate('ManageInvitations')}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
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

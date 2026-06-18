import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ListRow } from '../../components/ListRow';
import { ScreenContainer } from '../../components/ScreenContainer';
import { FOLLOWS } from '../../data';
import { colors, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Follows'>;

export function FollowsScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Follows</Text>
      <Text style={styles.subtitle}>{FOLLOWS.length} people you follow</Text>
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  list: { gap: spacing.xs },
});

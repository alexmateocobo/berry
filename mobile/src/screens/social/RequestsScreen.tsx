import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { ListRow } from '../../components/ListRow';
import { ScreenContainer } from '../../components/ScreenContainer';
import { FOLLOW_REQUESTS } from '../../data';
import { colors, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Requests'>;

type Decision = 'accepted' | 'declined';

export function RequestsScreen(_props: Props) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  return (
    <ScreenContainer>
      <Text style={styles.title}>Requests</Text>
      <Text style={styles.subtitle}>People who want to follow you</Text>

      <View style={styles.list}>
        {FOLLOW_REQUESTS.map((user) => {
          const decision = decisions[user.id];
          return (
            <View key={user.id} style={styles.row}>
              <ListRow avatarLabel={user.name} title={user.name} subtitle={user.handle} />
              {decision ? (
                <Text style={styles.decision}>{decision === 'accepted' ? 'Accepted' : 'Declined'}</Text>
              ) : (
                <View style={styles.actions}>
                  <View style={styles.actionButton}>
                    <AppButton
                      label="Decline"
                      variant="outline"
                      icon="close"
                      onPress={() => setDecisions((prev) => ({ ...prev, [user.id]: 'declined' }))}
                    />
                  </View>
                  <View style={styles.actionButton}>
                    <AppButton
                      label="Accept"
                      variant="accent"
                      icon="checkmark"
                      onPress={() => setDecisions((prev) => ({ ...prev, [user.id]: 'accepted' }))}
                    />
                  </View>
                </View>
              )}
            </View>
          );
        })}
        {FOLLOW_REQUESTS.length === 0 ? <Text style={styles.empty}>No pending requests.</Text> : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  list: { gap: spacing.md },
  row: { gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1 },
  decision: { ...typography.caption, color: colors.textMuted },
  empty: { ...typography.body, color: colors.textMuted },
});

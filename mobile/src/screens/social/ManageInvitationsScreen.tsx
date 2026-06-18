import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { GROUP_INVITATIONS } from '../../data';
import { colors, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'ManageInvitations'>;

type Decision = 'accepted' | 'declined';

export function ManageInvitationsScreen(_props: Props) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  return (
    <ScreenContainer>
      <Text style={styles.title}>Manage Invitations</Text>
      <Text style={styles.subtitle}>Pending invitations to join groups</Text>

      <View style={styles.list}>
        {GROUP_INVITATIONS.map((invitation) => {
          const decision = decisions[invitation.id];
          return (
            <Card key={invitation.id} style={styles.card}>
              <Text style={styles.groupName}>{invitation.group.name}</Text>
              <Text style={styles.invitedBy}>Invited by {invitation.invitedBy.name}</Text>
              {decision ? (
                <Text style={styles.decision}>{decision === 'accepted' ? 'Joined' : 'Declined'}</Text>
              ) : (
                <View style={styles.actions}>
                  <View style={styles.actionButton}>
                    <AppButton
                      label="Decline"
                      variant="outline"
                      onPress={() => setDecisions((prev) => ({ ...prev, [invitation.id]: 'declined' }))}
                    />
                  </View>
                  <View style={styles.actionButton}>
                    <AppButton
                      label="Join"
                      variant="accent"
                      onPress={() => setDecisions((prev) => ({ ...prev, [invitation.id]: 'accepted' }))}
                    />
                  </View>
                </View>
              )}
            </Card>
          );
        })}
        {GROUP_INVITATIONS.length === 0 ? <Text style={styles.empty}>No pending invitations.</Text> : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  list: { gap: spacing.md },
  card: { gap: spacing.sm },
  groupName: { ...typography.heading, color: colors.text },
  invitedBy: { ...typography.caption, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1 },
  decision: { ...typography.caption, color: colors.textMuted },
  empty: { ...typography.body, color: colors.textMuted },
});

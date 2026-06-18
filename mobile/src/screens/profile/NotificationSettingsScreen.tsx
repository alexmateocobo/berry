import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'NotificationSettings'>;

type NotificationKey = 'friendActivity' | 'eventMatches' | 'recommendations' | 'newFollowers';

const NOTIFICATION_OPTIONS: { key: NotificationKey; title: string; description: string }[] = [
  { key: 'friendActivity', title: 'Friend activity', description: 'When friends RSVP or join a group swipe.' },
  { key: 'eventMatches', title: 'Event matches', description: 'When you and a friend both like the same event.' },
  { key: 'recommendations', title: 'Recommendations', description: 'New events picked for you each week.' },
  { key: 'newFollowers', title: 'New followers', description: 'When someone starts following you.' },
];

export function NotificationSettingsScreen(_props: Props) {
  const [settings, setSettings] = useState<Record<NotificationKey, boolean>>({
    friendActivity: true,
    eventMatches: true,
    recommendations: true,
    newFollowers: false,
  });

  const allMuted = Object.values(settings).every((value) => !value);

  const toggle = (key: NotificationKey) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const muteAll = () => {
    const next = allMuted;
    setSettings({
      friendActivity: next,
      eventMatches: next,
      recommendations: next,
      newFollowers: next,
    });
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Choose what you hear about</Text>

      <Card style={styles.card}>
        {NOTIFICATION_OPTIONS.map((option) => (
          <View key={option.key} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{option.title}</Text>
              <Text style={styles.rowDescription}>{option.description}</Text>
            </View>
            <Switch
              value={settings[option.key]}
              onValueChange={() => toggle(option.key)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>
        ))}
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Mute all notifications</Text>
            <Text style={styles.rowDescription}>Turn everything off in one tap.</Text>
          </View>
          <Switch
            value={allMuted}
            onValueChange={muteAll}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.background}
          />
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...typography.label, color: colors.text },
  rowDescription: { ...typography.caption, color: colors.textMuted },
});

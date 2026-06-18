import { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { Avatar } from '../../components/Avatar';
import { ListRow } from '../../components/ListRow';
import { ScreenContainer } from '../../components/ScreenContainer';
import { CURRENT_USER, FOLLOWS } from '../../data';
import { useAuthStore } from '../../store/authStore';
import { colors, radii, spacing, typography } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const TOTAL_STEPS = 3;

export function OnboardingScreen(_props: Props) {
  const login = useAuthStore((state) => state.login);
  const [step, setStep] = useState(0);

  const [name, setName] = useState(CURRENT_USER.name);
  const [bio, setBio] = useState(CURRENT_USER.bio);
  const [following, setFollowing] = useState<Record<string, boolean>>(
    Object.fromEntries(FOLLOWS.map((user) => [user.id, true])),
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const toggleFollow = (id: string) => {
    setFollowing((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isLastStep = step === TOTAL_STEPS - 1;

  const handleContinue = () => {
    if (isLastStep) {
      login();
    } else {
      setStep((prev) => prev + 1);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.dots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View key={index} style={[styles.dot, index === step && styles.dotActive]} />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.step}>
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.subtitle}>This is how others will see you on Berry.</Text>

          <View style={styles.avatarRow}>
            <Avatar label={name || CURRENT_USER.name} size={64} />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={bio}
              onChangeText={setBio}
              multiline
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.step}>
          <Text style={styles.title}>Follow people you know</Text>
          <Text style={styles.subtitle}>
            We found some people already on Berry. Follow them to see their plans.
          </Text>

          <View style={styles.list}>
            {FOLLOWS.map((user) => (
              <View key={user.id} style={styles.followRow}>
                <View style={styles.followInfo}>
                  <ListRow avatarLabel={user.name} title={user.name} subtitle={user.handle} />
                </View>
                <AppButton
                  label={following[user.id] ? 'Following' : 'Follow'}
                  variant={following[user.id] ? 'outline' : 'accent'}
                  onPress={() => toggleFollow(user.id)}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.step}>
          <Text style={styles.title}>Stay in the loop</Text>
          <Text style={styles.subtitle}>
            Get notified about friend activity, event matches, and recommendations.
          </Text>

          <View style={styles.notificationRow}>
            <View style={styles.notificationText}>
              <Text style={styles.fieldLabel}>Allow notifications</Text>
              <Text style={styles.subtitle}>You can change this anytime in Settings.</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        {step > 0 ? (
          <View style={styles.actionButton}>
            <AppButton label="Back" variant="outline" onPress={() => setStep((prev) => prev - 1)} />
          </View>
        ) : null}
        <View style={styles.actionButton}>
          <AppButton label={isLastStep ? 'Get started' : 'Continue'} variant="primary" onPress={handleContinue} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  step: { gap: spacing.md },
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  avatarRow: { alignItems: 'center', marginVertical: spacing.sm },
  field: { gap: spacing.xs },
  fieldLabel: { ...typography.label, color: colors.text },
  input: {
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  list: { gap: spacing.sm },
  followRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  followInfo: { flex: 1 },
  notificationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  notificationText: { flex: 1, gap: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionButton: { flex: 1 },
});

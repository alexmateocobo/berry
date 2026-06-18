import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { Avatar } from '../../components/Avatar';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { CURRENT_USER } from '../../data';
import { colors, radii, spacing, typography } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'AccountSettings'>;

export function AccountSettingsScreen(_props: Props) {
  const [name, setName] = useState(CURRENT_USER.name);
  const [handle, setHandle] = useState(CURRENT_USER.handle);
  const [email, setEmail] = useState('alex.cobo@example.com');
  const [bio, setBio] = useState(CURRENT_USER.bio);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <ScreenContainer>
      <Text style={styles.title}>Account</Text>

      <View style={styles.avatarRow}>
        <Avatar label={name || CURRENT_USER.name} size={64} />
        <AppButton
          label="Change photo"
          variant="outline"
          onPress={() => Alert.alert('Demo', 'Photo upload is not available in this demo.')}
        />
      </View>

      <Card style={styles.card}>
        <LabeledInput label="Name" value={name} onChangeText={setName} />
        <LabeledInput label="Username" value={handle} onChangeText={setHandle} autoCapitalize="none" />
        <LabeledInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <LabeledInput label="Bio" value={bio} onChangeText={setBio} multiline />
      </Card>

      <Text style={styles.sectionTitle}>Change password</Text>
      <Card style={styles.card}>
        <LabeledInput label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
        <LabeledInput label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        <LabeledInput label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      </Card>

      <AppButton
        label="Save changes"
        variant="accent"
        onPress={() => Alert.alert('Saved', 'Your profile changes have been saved.')}
      />
    </ScreenContainer>
  );
}

type LabeledInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
};

function LabeledInput({ label, ...inputProps }: LabeledInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, inputProps.multiline && styles.inputMultiline]}
        placeholderTextColor={colors.textMuted}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  card: { gap: spacing.md },
  sectionTitle: { ...typography.heading, color: colors.text },
  field: { gap: spacing.xs },
  fieldLabel: { ...typography.caption, color: colors.textMuted },
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
});

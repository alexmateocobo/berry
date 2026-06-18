import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors, radii, spacing, typography } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <ScreenContainer>
      <Text style={styles.title}>Create your{'\n'}account</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      <AppButton label="Create your account" onPress={() => navigation.navigate('Onboarding')} variant="primary" />

      <Text style={styles.divider}>or</Text>

      <View style={styles.form}>
        <AppButton
          label="Sign Up with Google"
          onPress={() => navigation.navigate('Onboarding')}
          variant="outline"
          icon="logo-google"
        />
        <AppButton
          label="Sign Up with Apple"
          onPress={() => navigation.navigate('Onboarding')}
          variant="outline"
          icon="logo-apple"
        />
      </View>

      <Text style={styles.footer}>
        Already have an account?{' '}
        <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
          Login
        </Text>
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text, marginBottom: spacing.xl },
  form: { gap: spacing.md, marginBottom: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  divider: { ...typography.body, textAlign: 'center', color: colors.textMuted, marginBottom: spacing.lg },
  footer: { ...typography.body, textAlign: 'center', color: colors.textMuted, marginTop: spacing.lg },
  link: { color: colors.primary, fontWeight: '700' },
});

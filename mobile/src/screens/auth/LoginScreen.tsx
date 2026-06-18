import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuthStore } from '../../store/authStore';
import { colors, radii, spacing, typography } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ScreenContainer>
      <Text style={styles.title}>Login to your{'\n'}account</Text>

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
      </View>

      <AppButton label="Login to your account" onPress={login} variant="primary" />

      <Text style={styles.divider}>or</Text>

      <View style={styles.form}>
        <AppButton label="Login with Google" onPress={login} variant="outline" icon="logo-google" />
        <AppButton label="Login with Apple" onPress={login} variant="outline" icon="logo-apple" />
      </View>

      <Text style={styles.footer}>
        Don't have an account yet?{' '}
        <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>
          Sign Up
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

import type { TextStyle } from 'react-native';

export const typography = {
  display: { fontSize: 30, fontWeight: '800', lineHeight: 36 },
  title: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  heading: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  label: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
} satisfies Record<string, TextStyle>;

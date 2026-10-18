import { Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { databaseStatus } from '../src/db/database';
import { SCHEMA_VERSION } from '../src/db/migrations';
import { fontSize, radius, spacing, useTheme } from '../src/theme';

// Phase 1 placeholder: proves routing, theme and database all work.
export default function Home() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    databaseStatus(db)
      .then((s) => alive && setStatus(s))
      .catch((e) => alive && setError(e));
    return () => {
      alive = false;
    };
  }, [db]);

  const ready = status && status.version === SCHEMA_VERSION;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Sehat' }} />
      <Text style={[styles.display, { color: theme.text }]}>Sehat</Text>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.body }}>Foundation is in place.</Text>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Database</Text>
        <Text style={[styles.value, { color: theme.text }]}>
          {error ? `Error: ${error.message}` : !status ? 'Opening…' : ready ? `Ready · schema v${status.version}` : `Unexpected schema v${status.version}`}
        </Text>
        {status && (
          <Text style={{ color: theme.textMuted, fontSize: fontSize.small }}>{status.tables.join(' · ')}</Text>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Theme</Text>
        <Text style={[styles.value, { color: theme.text }]}>{theme.mode === 'dark' ? 'Dark' : 'Light'} (follows your phone)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, gap: spacing.md },
  display: { fontSize: fontSize.display, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  label: { fontSize: fontSize.small, textTransform: 'uppercase', letterSpacing: 1 },
  value: { fontSize: fontSize.body, fontWeight: '600' },
});

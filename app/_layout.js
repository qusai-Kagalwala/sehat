import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DATABASE_NAME, initDatabase } from '../src/db/database';
import { fontSize, spacing, useTheme } from '../src/theme';

export default function RootLayout() {
  const theme = useTheme();
  const [dbError, setDbError] = useState(null);

  if (dbError) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Couldn't open the database</Text>
        <Text style={{ color: theme.textMuted, textAlign: 'center' }}>{String(dbError.message ?? dbError)}</Text>
      </View>
    );
  }

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase} onError={setDbError}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      />
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  title: { fontSize: fontSize.title, fontWeight: '700' },
});

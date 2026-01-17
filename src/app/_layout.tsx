import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

    if (!session && !inAuthGroup) {
      // ログインしていない場合はログイン画面へ
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // ログイン済みの場合はメイン画面へ
      router.replace('/(tabs)');
    }
  }, [session, segments, loading]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </PaperProvider>
  );
}

import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/hooks/use_auth';
import { AuthScreen } from './src/screens/auth_screen';
import { HomeScreen } from './src/screens/home_screen';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return null;
  }

  return session ? <HomeScreen /> : <AuthScreen />;
}

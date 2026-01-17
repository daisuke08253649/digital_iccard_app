import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Divider, Button, Dialog, Portal, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      setLogoutDialogVisible(false);
      router.replace('/login');
    } catch (error) {
      Alert.alert('エラー', 'ログアウトに失敗しました');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>アカウント情報</List.Subheader>
        <List.Item
          title="メールアドレス"
          description={user?.email || '未設定'}
          left={(props) => <List.Icon {...props} icon="email" />}
        />
        <List.Item
          title="ユーザーID"
          description={user?.id || '未設定'}
          left={(props) => <List.Icon {...props} icon="account" />}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>アプリ情報</List.Subheader>
        <List.Item
          title="バージョン"
          description="1.0.0 (プロトタイプ)"
          left={(props) => <List.Icon {...props} icon="information" />}
        />
        <List.Item
          title="開発フェーズ"
          description="Phase 3 - UI/UX実装中"
          left={(props) => <List.Icon {...props} icon="cog" />}
        />
      </List.Section>

      <Divider />

      <View style={styles.buttonSection}>
        <Button
          mode="contained"
          onPress={() => setLogoutDialogVisible(true)}
          style={styles.logoutButton}
          buttonColor="#d32f2f"
          icon="logout"
        >
          ログアウト
        </Button>
      </View>

      <View style={styles.noteSection}>
        <Text variant="bodySmall" style={styles.noteText}>
          このアプリは技術検証・学習目的のプロトタイプです。
        </Text>
        <Text variant="bodySmall" style={styles.noteText}>
          実際の金銭取引は行われません。
        </Text>
      </View>

      <Portal>
        <Dialog visible={logoutDialogVisible} onDismiss={() => setLogoutDialogVisible(false)}>
          <Dialog.Title>ログアウト確認</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">ログアウトしてもよろしいですか？</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>キャンセル</Button>
            <Button onPress={handleLogout} textColor="#d32f2f">
              ログアウト
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  buttonSection: {
    padding: 16,
  },
  logoutButton: {
    marginVertical: 8,
  },
  noteSection: {
    padding: 16,
    alignItems: 'center',
  },
  noteText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
});

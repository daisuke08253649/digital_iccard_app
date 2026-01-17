import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ChargeScreen() {
  const chargeAmounts = [1000, 2000, 3000, 5000, 10000];

  const handleCharge = (amount: number) => {
    // TODO: Phase 4でモックチャージ機能を実装
    Alert.alert(
      'チャージ機能',
      `¥${amount.toLocaleString()}のチャージ機能は現在開発中です（Phase 4で実装予定）`
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.infoCard}>
        <Card.Content style={styles.infoContent}>
          <MaterialCommunityIcons name="information" size={48} color="#1976d2" />
          <Text variant="titleMedium" style={styles.infoTitle}>
            デモモード
          </Text>
          <Text variant="bodyMedium" style={styles.infoText}>
            このアプリはプロトタイプです。実際の決済は行われません。
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          チャージ金額を選択
        </Text>
        {chargeAmounts.map((amount) => (
          <Card key={amount} style={styles.amountCard}>
            <Card.Content style={styles.amountCardContent}>
              <Text variant="titleLarge" style={styles.amountText}>
                ¥{amount.toLocaleString()}
              </Text>
              <Button
                mode="contained"
                onPress={() => handleCharge(amount)}
                style={styles.chargeButton}
              >
                チャージ
              </Button>
            </Card.Content>
          </Card>
        ))}
      </View>

      <Card style={styles.noteCard}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.noteTitle}>
            注意事項
          </Text>
          <Text variant="bodySmall" style={styles.noteText}>
            • このチャージ機能はデモモードです
          </Text>
          <Text variant="bodySmall" style={styles.noteText}>
            • 実際の決済は行われません
          </Text>
          <Text variant="bodySmall" style={styles.noteText}>
            • Phase 4で完全なモック実装を予定しています
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  infoCard: {
    margin: 16,
    backgroundColor: '#e3f2fd',
  },
  infoContent: {
    alignItems: 'center',
    padding: 16,
  },
  infoTitle: {
    marginTop: 8,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  infoText: {
    textAlign: 'center',
    color: '#666',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  amountCard: {
    marginBottom: 12,
  },
  amountCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  chargeButton: {
    minWidth: 120,
  },
  noteCard: {
    margin: 16,
    backgroundColor: '#fff3e0',
  },
  noteTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noteText: {
    marginBottom: 4,
    color: '#666',
  },
});

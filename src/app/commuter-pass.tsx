import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  RadioButton,
  Divider,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getAccount } from '../services/accountService';
import {
  purchaseCommuterPass,
  calculatePassPrice,
  DURATION_LABELS,
  SAMPLE_STATIONS,
  PassDuration,
} from '../services/commuterPassService';
import { Account } from '../types/database';

export default function CommuterPassScreen() {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const [startStation, setStartStation] = useState(SAMPLE_STATIONS[0]);
  const [endStation, setEndStation] = useState(SAMPLE_STATIONS[1]);
  const [duration, setDuration] = useState<PassDuration>('1month');

  const loadAccount = useCallback(async () => {
    if (!user) {
      setAccount(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const accountData = await getAccount(user.id);
      setAccount(accountData);
    } catch (e) {
      console.error('Error loading account:', e);
      Alert.alert('エラー', 'アカウント情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadAccount();
    }, [loadAccount])
  );

  const price = calculatePassPrice(startStation, endStation, duration);

  const handlePurchase = () => {
    if (!account) {
      Alert.alert('エラー', 'アカウント情報が取得できません');
      return;
    }

    if (startStation === endStation) {
      Alert.alert('エラー', '乗車駅と降車駅が同じです');
      return;
    }

    Alert.alert(
      '定期券購入確認',
      `以下の内容で定期券を購入しますか？\n\n区間: ${startStation} → ${endStation}\n期間: ${DURATION_LABELS[duration]}\n価格: ¥${price.toLocaleString()}\n\n※デモモード: 残高から引き落とされます`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '購入する',
          onPress: async () => {
            setPurchasing(true);
            try {
              const result = await purchaseCommuterPass(
                account.id,
                startStation,
                endStation,
                `${startStation}〜${endStation}`,
                duration
              );

              if (result.success) {
                const warning = result.error ? `\n\n※${result.error}` : '';
                Alert.alert(
                  '購入完了',
                  `定期券を購入しました\n新しい残高: ¥${result.newBalance?.toLocaleString()}${warning}`,
                  [
                    {
                      text: 'OK',
                      onPress: () => router.back(),
                    },
                  ]
                );
              } else {
                Alert.alert('エラー', result.error || '購入に失敗しました');
              }
            } catch (e) {
              console.error('Error purchasing commuter pass:', e);
              Alert.alert('エラー', '購入処理中にエラーが発生しました');
            } finally {
              setPurchasing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* デモモード表示 */}
      <Card style={styles.infoCard}>
        <Card.Content style={styles.infoContent}>
          <MaterialCommunityIcons name="information" size={32} color="#1976d2" />
          <Text variant="bodyMedium" style={styles.infoText}>
            デモモードです。実際の定期券は発行されません。残高から代金が引き落とされます。
          </Text>
        </Card.Content>
      </Card>

      {/* 現在の残高 */}
      <Card style={styles.balanceCard}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.balanceLabel}>
            現在の残高
          </Text>
          <Text variant="headlineMedium" style={styles.balanceAmount}>
            ¥{account?.balance?.toLocaleString() ?? '0'}
          </Text>
        </Card.Content>
      </Card>

      {/* 区間選択 */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            区間を選択
          </Text>

          <Text variant="bodyMedium" style={styles.label}>乗車駅</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={startStation}
              onValueChange={setStartStation}
              style={styles.picker}
            >
              {SAMPLE_STATIONS.map((station) => (
                <Picker.Item key={station} label={station} value={station} />
              ))}
            </Picker>
          </View>

          <Text variant="bodyMedium" style={styles.label}>降車駅</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={endStation}
              onValueChange={setEndStation}
              style={styles.picker}
            >
              {SAMPLE_STATIONS.map((station) => (
                <Picker.Item key={station} label={station} value={station} />
              ))}
            </Picker>
          </View>
        </Card.Content>
      </Card>

      {/* 期間選択 */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            期間を選択
          </Text>
          <RadioButton.Group
            value={duration}
            onValueChange={(value) => setDuration(value as PassDuration)}
          >
            {(Object.keys(DURATION_LABELS) as PassDuration[]).map((key) => (
              <View key={key} style={styles.radioItem}>
                <RadioButton value={key} />
                <Text style={styles.radioLabel}>{DURATION_LABELS[key]}</Text>
                <Text style={styles.radioPrice}>
                  ¥{calculatePassPrice(startStation, endStation, key).toLocaleString()}
                </Text>
              </View>
            ))}
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {/* 購入内容確認 */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            購入内容
          </Text>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text>区間</Text>
            <Text style={styles.summaryValue}>{startStation} → {endStation}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>期間</Text>
            <Text style={styles.summaryValue}>{DURATION_LABELS[duration]}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text variant="titleMedium">合計金額</Text>
            <Text variant="titleLarge" style={styles.totalPrice}>
              ¥{price.toLocaleString()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* 購入ボタン */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handlePurchase}
          loading={purchasing}
          disabled={purchasing || !account || startStation === endStation}
          style={styles.purchaseButton}
          contentStyle={styles.purchaseButtonContent}
        >
          定期券を購入する
        </Button>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          戻る
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  infoCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#e3f2fd',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: '#666',
  },
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  balanceLabel: {
    color: '#666',
  },
  balanceAmount: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    color: '#666',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  picker: {
    height: 50,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioLabel: {
    flex: 1,
    marginLeft: 8,
  },
  radioPrice: {
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  totalPrice: {
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  purchaseButton: {
    backgroundColor: '#d32f2f',
  },
  purchaseButtonContent: {
    paddingVertical: 8,
  },
  backButton: {},
});

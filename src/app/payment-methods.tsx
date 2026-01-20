import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  IconButton,
  Portal,
  Modal,
  TextInput,
  RadioButton,
  Chip,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import {
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getPaymentTypeDisplayName,
} from '../services/paymentMethodService';
import { PaymentMethod } from '../types/database';

type PaymentType = PaymentMethod['type'];

const PAYMENT_TYPES: { value: PaymentType; label: string; icon: string }[] = [
  { value: 'credit_card', label: 'クレジットカード', icon: 'credit-card' },
  { value: 'e_money_paypay', label: 'PayPay', icon: 'cellphone' },
  { value: 'e_money_linepay', label: 'LINE Pay', icon: 'message' },
  { value: 'virtual_card', label: 'バーチャルカード', icon: 'card-account-details' },
];

export default function PaymentMethodsScreen() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<PaymentType>('credit_card');
  const [displayName, setDisplayName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPaymentMethods = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const methods = await getPaymentMethods(user.id);
      setPaymentMethods(methods);
    } catch (e) {
      console.error('Error loading payment methods:', e);
      Alert.alert('エラー', '支払い方法の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const handleAddPaymentMethod = async () => {
    if (!user || !displayName.trim()) {
      Alert.alert('エラー', '表示名を入力してください');
      return;
    }

    setSaving(true);
    try {
      const result = await addPaymentMethod(
        user.id,
        selectedType,
        displayName.trim(),
        isDefault || paymentMethods.length === 0
      );

      if (result) {
        setModalVisible(false);
        setDisplayName('');
        setSelectedType('credit_card');
        setIsDefault(false);
        await loadPaymentMethods();
        Alert.alert('完了', '支払い方法を追加しました');
      } else {
        Alert.alert('エラー', '支払い方法の追加に失敗しました');
      }
    } catch (e) {
      console.error('Error adding payment method:', e);
      Alert.alert('エラー', '支払い方法の追加に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePaymentMethod = (method: PaymentMethod) => {
    Alert.alert(
      '削除確認',
      `「${method.display_name || getPaymentTypeDisplayName(method.type)}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            const success = await deletePaymentMethod(method.id);
            if (success) {
              await loadPaymentMethods();
              Alert.alert('完了', '支払い方法を削除しました');
            } else {
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (method: PaymentMethod) => {
    if (!user || method.is_default) return;

    const success = await setDefaultPaymentMethod(user.id, method.id);
    if (success) {
      await loadPaymentMethods();
    } else {
      Alert.alert('エラー', 'デフォルトの設定に失敗しました');
    }
  };

  const getIconName = (type: PaymentType): string => {
    const found = PAYMENT_TYPES.find((t) => t.value === type);
    return found?.icon || 'credit-card';
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
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.infoCard}>
          <Card.Content style={styles.infoContent}>
            <MaterialCommunityIcons name="information" size={32} color="#1976d2" />
            <Text variant="bodyMedium" style={styles.infoText}>
              このアプリはデモモードです。実際の決済情報は保存されません。
            </Text>
          </Card.Content>
        </Card>

        {paymentMethods.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="credit-card-off" size={64} color="#ccc" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                支払い方法がありません
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                チャージに使用する支払い方法を追加してください
              </Text>
            </Card.Content>
          </Card>
        ) : (
          paymentMethods.map((method) => (
            <Card key={method.id} style={styles.methodCard}>
              <Card.Content style={styles.methodContent}>
                <View style={styles.methodLeft}>
                  <MaterialCommunityIcons
                    name={getIconName(method.type) as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={32}
                    color="#1976d2"
                  />
                  <View style={styles.methodInfo}>
                    <Text variant="titleMedium" style={styles.methodName}>
                      {method.display_name || getPaymentTypeDisplayName(method.type)}
                    </Text>
                    <Text variant="bodySmall" style={styles.methodType}>
                      {getPaymentTypeDisplayName(method.type)}
                    </Text>
                    {method.is_default && (
                      <Chip
                        mode="flat"
                        compact
                        style={styles.defaultChip}
                        textStyle={styles.defaultChipText}
                      >
                        デフォルト
                      </Chip>
                    )}
                  </View>
                </View>
                <View style={styles.methodActions}>
                  {!method.is_default && (
                    <IconButton
                      icon="star-outline"
                      size={20}
                      onPress={() => handleSetDefault(method)}
                    />
                  )}
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor="#d32f2f"
                    onPress={() => handleDeletePaymentMethod(method)}
                  />
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <View style={styles.bottomActions}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
        >
          支払い方法を追加
        </Button>
        <Button mode="outlined" onPress={() => router.back()} style={styles.backButton}>
          戻る
        </Button>
      </View>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            支払い方法を追加
          </Text>

          <Divider style={styles.divider} />

          <Text variant="titleSmall" style={styles.sectionTitle}>
            種類を選択
          </Text>
          <RadioButton.Group
            value={selectedType}
            onValueChange={(value) => setSelectedType(value as PaymentType)}
          >
            {PAYMENT_TYPES.map((type) => (
              <View key={type.value} style={styles.radioItem}>
                <RadioButton value={type.value} />
                <MaterialCommunityIcons
                  name={type.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={20}
                  color="#666"
                  style={styles.radioIcon}
                />
                <Text>{type.label}</Text>
              </View>
            ))}
          </RadioButton.Group>

          <TextInput
            label="表示名"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="例: メインカード、PayPay残高"
            style={styles.input}
            mode="outlined"
          />

          <View style={styles.checkboxRow}>
            <RadioButton
              value="default"
              status={isDefault ? 'checked' : 'unchecked'}
              onPress={() => setIsDefault(!isDefault)}
            />
            <Text onPress={() => setIsDefault(!isDefault)}>デフォルトに設定</Text>
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              キャンセル
            </Button>
            <Button
              mode="contained"
              onPress={handleAddPaymentMethod}
              loading={saving}
              disabled={saving || !displayName.trim()}
              style={styles.modalButton}
            >
              追加
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
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
  scrollView: {
    flex: 1,
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
  emptyCard: {
    margin: 16,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  methodCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  methodContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodInfo: {
    marginLeft: 12,
    flex: 1,
  },
  methodName: {
    fontWeight: 'bold',
  },
  methodType: {
    color: '#666',
  },
  defaultChip: {
    marginTop: 4,
    backgroundColor: '#e8f5e9',
    alignSelf: 'flex-start',
  },
  defaultChipText: {
    fontSize: 10,
    color: '#2e7d32',
  },
  methodActions: {
    flexDirection: 'row',
  },
  bottomActions: {
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addButton: {
    marginBottom: 8,
  },
  backButton: {},
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioIcon: {
    marginRight: 8,
  },
  input: {
    marginTop: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 8,
  },
  modalButton: {
    minWidth: 100,
  },
});

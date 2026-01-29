import { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Card, Text, Button, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { getAccount, executeCharge } from "../../services/accountService";
import {
  getPaymentMethods,
  getDefaultPaymentMethod,
  getPaymentTypeDisplayName,
} from "../../services/paymentMethodService";
import { Account, PaymentMethod } from "../../types/database";
import { customAlert } from "../../utils/alertPolyfill";

const CHARGE_AMOUNTS = [1000, 2000, 3000, 5000, 10000];

export default function ChargeScreen() {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) {
      setAccount(null);
      setPaymentMethods([]);
      setSelectedPaymentMethod(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const [accountData, methodsData, defaultMethod] = await Promise.all([
        getAccount(user.id),
        getPaymentMethods(user.id),
        getDefaultPaymentMethod(user.id),
      ]);

      setAccount(accountData);
      setPaymentMethods(methodsData);
      setSelectedPaymentMethod(defaultMethod);
    } catch (e) {
      console.error("Error loading charge data:", e);
      customAlert("エラー", "データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleCharge = async (amount: number) => {
    if (!account) {
      customAlert("エラー", "アカウント情報が取得できません");
      return;
    }

    if (!selectedPaymentMethod) {
      customAlert(
        "支払い方法未設定",
        "チャージするには支払い方法を設定してください",
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "設定する",
            onPress: () => router.push("/payment-methods"),
          },
        ],
      );
      return;
    }

    customAlert(
      "チャージ確認",
      `¥${amount.toLocaleString()}をチャージしますか？\n\n支払い方法: ${selectedPaymentMethod.display_name || getPaymentTypeDisplayName(selectedPaymentMethod.type)}\n\n※デモモード: 実際の決済は行われません`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "チャージする",
          onPress: async () => {
            setCharging(true);
            try {
              const result = await executeCharge(
                account.id,
                amount,
                selectedPaymentMethod.id,
              );

              if (result.success) {
                const warning = result.error ? `\n\n※${result.error}` : "";
                customAlert(
                  "チャージ完了",
                  `¥${amount.toLocaleString()}をチャージしました\n新しい残高: ¥${result.newBalance?.toLocaleString()}${warning}`,
                );
                // アカウント情報を更新
                if (user) {
                  const updatedAccount = await getAccount(user.id);
                  setAccount(updatedAccount);
                }
              } else {
                customAlert("エラー", result.error || "チャージに失敗しました");
              }
            } catch (e) {
              console.error("Error during charge:", e);
              customAlert("エラー", "チャージに失敗しました");
            } finally {
              setCharging(false);
            }
          },
        },
      ],
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
          <MaterialCommunityIcons
            name="information"
            size={48}
            color="#1976d2"
          />
          <Text variant="titleMedium" style={styles.infoTitle}>
            デモモード
          </Text>
          <Text variant="bodyMedium" style={styles.infoText}>
            このアプリはプロトタイプです。実際の決済は行われません。
          </Text>
        </Card.Content>
      </Card>

      {/* 現在の残高 */}
      <Card style={styles.balanceCard}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.balanceLabel}>
            現在の残高
          </Text>
          <Text variant="displaySmall" style={styles.balanceAmount}>
            ¥{account?.balance?.toLocaleString() ?? "0"}
          </Text>
        </Card.Content>
      </Card>

      {/* 支払い方法選択 */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          支払い方法
        </Text>
        {paymentMethods.length === 0 ? (
          <Card style={styles.noPaymentCard}>
            <Card.Content style={styles.noPaymentContent}>
              <MaterialCommunityIcons
                name="credit-card-off"
                size={32}
                color="#999"
              />
              <Text variant="bodyMedium" style={styles.noPaymentText}>
                支払い方法が登録されていません
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push("/payment-methods")}
                style={styles.addPaymentButton}
              >
                支払い方法を追加
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.paymentMethodCard}>
            <Card.Content>
              <View style={styles.paymentMethodRow}>
                <View style={styles.paymentMethodInfo}>
                  <MaterialCommunityIcons
                    name={
                      selectedPaymentMethod?.type === "credit_card"
                        ? "credit-card"
                        : "cellphone"
                    }
                    size={24}
                    color="#1976d2"
                  />
                  <View style={styles.paymentMethodText}>
                    <Text variant="titleMedium">
                      {selectedPaymentMethod?.display_name ||
                        (selectedPaymentMethod
                          ? getPaymentTypeDisplayName(
                              selectedPaymentMethod.type,
                            )
                          : "未選択")}
                    </Text>
                    {selectedPaymentMethod && (
                      <Text
                        variant="bodySmall"
                        style={styles.paymentMethodType}
                      >
                        {getPaymentTypeDisplayName(selectedPaymentMethod.type)}
                      </Text>
                    )}
                  </View>
                </View>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => router.push("/payment-methods")}
                >
                  変更
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* チャージ金額選択 */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          チャージ金額を選択
        </Text>
        {CHARGE_AMOUNTS.map((amount) => (
          <Card key={amount} style={styles.amountCard}>
            <Card.Content style={styles.amountCardContent}>
              <Text variant="titleLarge" style={styles.amountText}>
                ¥{amount.toLocaleString()}
              </Text>
              <Button
                mode="contained"
                onPress={() => handleCharge(amount)}
                loading={charging}
                disabled={charging || !selectedPaymentMethod}
                style={styles.chargeButton}
              >
                チャージ
              </Button>
            </Card.Content>
          </Card>
        ))}
      </View>

      {/* 注意事項 */}
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
            • 1回のチャージ上限: ¥50,000
          </Text>
          <Text variant="bodySmall" style={styles.noteText}>
            • 残高上限: ¥200,000
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  infoCard: {
    margin: 16,
    backgroundColor: "#e3f2fd",
  },
  infoContent: {
    alignItems: "center",
    padding: 16,
  },
  infoTitle: {
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "bold",
  },
  infoText: {
    textAlign: "center",
    color: "#666",
  },
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  balanceLabel: {
    color: "#666",
    marginBottom: 4,
  },
  balanceAmount: {
    fontWeight: "bold",
    color: "#1976d2",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: "bold",
  },
  noPaymentCard: {
    backgroundColor: "#fafafa",
  },
  noPaymentContent: {
    alignItems: "center",
    padding: 16,
  },
  noPaymentText: {
    marginTop: 8,
    marginBottom: 16,
    color: "#666",
  },
  addPaymentButton: {},
  paymentMethodCard: {},
  paymentMethodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentMethodInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentMethodText: {
    marginLeft: 12,
  },
  paymentMethodType: {
    color: "#666",
  },
  amountCard: {
    marginBottom: 12,
  },
  amountCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountText: {
    fontWeight: "bold",
    color: "#d32f2f",
  },
  chargeButton: {
    minWidth: 120,
  },
  noteCard: {
    margin: 16,
    backgroundColor: "#fff3e0",
  },
  noteTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  noteText: {
    marginBottom: 4,
    color: "#666",
  },
});

import { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { getAccount } from "../services/accountService";
import { issueQRTicket, calculateFare } from "../services/qrTicketService";
import { SAMPLE_STATIONS } from "../services/commuterPassService";
import { Account } from "../types/database";
import { customAlert } from "../utils/alertPolyfill";

export default function QRTicketScreen() {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);

  const [startStation, setStartStation] = useState(SAMPLE_STATIONS[0]);
  const [endStation, setEndStation] = useState(SAMPLE_STATIONS[1]);

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
      console.error("Error loading account:", e);
      customAlert("エラー", "アカウント情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadAccount();
    }, [loadAccount]),
  );

  const fare = calculateFare(startStation, endStation);

  const handleIssue = () => {
    if (!account) {
      customAlert("エラー", "アカウント情報が取得できません");
      return;
    }

    if (startStation === endStation) {
      customAlert("エラー", "乗車駅と降車駅が同じです");
      return;
    }

    customAlert(
      "QRチケット発券確認",
      `以下の内容でQRチケットを発券しますか？\n\n区間: ${startStation} → ${endStation}\n運賃: ¥${fare.toLocaleString()}\n有効期限: 本日中\n\n※デモモード: 残高から引き落とされます`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "発券する",
          onPress: async () => {
            setIssuing(true);
            try {
              const result = await issueQRTicket(
                account.id,
                startStation,
                endStation,
              );

              if (result.success) {
                const warning = result.error ? `\n\n※${result.error}` : "";
                customAlert(
                  "発券完了",
                  `QRチケットを発券しました\n\nチケットコード: ${result.ticket?.ticket_code}\n新しい残高: ¥${result.newBalance?.toLocaleString()}${warning}`,
                  [
                    {
                      text: "OK",
                      onPress: () => router.back(),
                    },
                  ],
                );
              } else {
                customAlert("エラー", result.error || "発券に失敗しました");
              }
            } catch (e) {
              console.error("Error issuing QR ticket:", e);
              customAlert("エラー", "発券処理中にエラーが発生しました");
            } finally {
              setIssuing(false);
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
            size={32}
            color="#1976d2"
          />
          <Text variant="bodyMedium" style={styles.infoText}>
            デモモードです。QRチケットは本日中有効です。残高から運賃が引き落とされます。
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
            ¥{account?.balance?.toLocaleString() ?? "0"}
          </Text>
        </Card.Content>
      </Card>

      {/* 区間選択 */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            区間を選択
          </Text>

          <Text variant="bodyMedium" style={styles.label}>
            乗車駅
          </Text>
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

          <Text variant="bodyMedium" style={styles.label}>
            降車駅
          </Text>
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

      {/* 発券内容確認 */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            発券内容
          </Text>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text>区間</Text>
            <Text style={styles.summaryValue}>
              {startStation} → {endStation}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>有効期限</Text>
            <Text style={styles.summaryValue}>本日 23:59 まで</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text variant="titleMedium">運賃</Text>
            <Text variant="titleLarge" style={styles.totalPrice}>
              ¥{fare.toLocaleString()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* 注意事項 */}
      <Card style={styles.noteCard}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.noteTitle}>
            ご注意
          </Text>
          <Text variant="bodySmall" style={styles.noteText}>
            • QRチケットは発券日当日のみ有効です
          </Text>
          <Text variant="bodySmall" style={styles.noteText}>
            • 一度使用したチケットは再利用できません
          </Text>
          <Text variant="bodySmall" style={styles.noteText}>
            • ホーム画面からQRコードを表示して改札をご通過ください
          </Text>
        </Card.Content>
      </Card>

      {/* 発券ボタン */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleIssue}
          loading={issuing}
          disabled={issuing || !account || startStation === endStation}
          style={styles.issueButton}
          contentStyle={styles.issueButtonContent}
        >
          QRチケットを発券する
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
    marginBottom: 8,
    backgroundColor: "#e3f2fd",
  },
  infoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: "#666",
  },
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  balanceLabel: {
    color: "#666",
  },
  balanceAmount: {
    fontWeight: "bold",
    color: "#1976d2",
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    color: "#666",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  picker: {
    height: 50,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  summaryValue: {
    fontWeight: "bold",
  },
  totalPrice: {
    fontWeight: "bold",
    color: "#d32f2f",
  },
  noteCard: {
    marginHorizontal: 16,
    marginBottom: 16,
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
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  issueButton: {
    backgroundColor: "#1976d2",
  },
  issueButtonContent: {
    paddingVertical: 8,
  },
  backButton: {},
});

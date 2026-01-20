import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, ActivityIndicator, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAccount,
  getActiveCommuterPasses,
  getActiveQRTickets,
} from '../../services/accountService';
import { generateQRCodeData } from '../../services/qrTicketService';
import { Account, CommuterPass, QRTicket } from '../../types/database';

export default function HomeScreen() {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [commuterPasses, setCommuterPasses] = useState<CommuterPass[]>([]);
  const [qrTickets, setQRTickets] = useState<QRTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) {
      setAccount(null);
      setCommuterPasses([]);
      setQRTickets([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const accountData = await getAccount(user.id);
      setAccount(accountData);

      if (accountData) {
        const [passes, tickets] = await Promise.all([
          getActiveCommuterPasses(accountData.id),
          getActiveQRTickets(accountData.id),
        ]);

        setCommuterPasses(passes);
        setQRTickets(tickets);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  if (!account) {
    return (
      <View style={styles.centerContainer}>
        <Text>アカウント情報が見つかりません</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 残高表示 */}
      <Card style={styles.balanceCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.balanceLabel}>
            残高
          </Text>
          <Text variant="displayMedium" style={styles.balanceAmount}>
            ¥{account.balance.toLocaleString()}
          </Text>
          <Text variant="bodySmall" style={styles.cardNumber}>
            カード番号: {account.card_number}
          </Text>
        </Card.Content>
      </Card>

      {/* クイックアクション */}
      <View style={styles.quickActions}>
        <Button
          mode="contained"
          icon="train"
          onPress={() => router.push('/commuter-pass')}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          定期券購入
        </Button>
        <Button
          mode="contained"
          icon="qrcode"
          onPress={() => router.push('/qr-ticket')}
          style={[styles.actionButton, styles.actionButtonSecondary]}
          contentStyle={styles.actionButtonContent}
        >
          QRチケット
        </Button>
      </View>

      {/* 定期券情報 */}
      {commuterPasses.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            定期券
          </Text>
          {commuterPasses.map((pass) => (
            <Card key={pass.id} style={styles.card}>
              <Card.Content style={styles.cardContentCenter}>
                <MaterialCommunityIcons name="train" size={32} color="#d32f2f" />
                <Text variant="titleMedium" style={styles.routeName}>
                  {pass.route_name || '定期券'}
                </Text>
                <Text variant="bodyLarge" style={styles.stationInfo}>
                  {pass.start_station} → {pass.end_station}
                </Text>
                <View style={styles.dateContainer}>
                  <Text variant="bodySmall" style={styles.dateText}>
                    {new Date(pass.start_date).toLocaleDateString('ja-JP')} ~{' '}
                    {new Date(pass.end_date).toLocaleDateString('ja-JP')}
                  </Text>
                </View>
                <Chip mode="outlined" style={styles.statusChip} textStyle={styles.statusChipText}>
                  有効期限中
                </Chip>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* QRコード切符 */}
      {qrTickets.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            QRコード切符
          </Text>
          {qrTickets.map((ticket) => (
            <Card key={ticket.id} style={styles.qrCard}>
              <Card.Content style={styles.qrCardContent}>
                <View style={styles.qrInfo}>
                  <Text variant="titleMedium" style={styles.qrRoute}>
                    {ticket.start_station} → {ticket.end_station}
                  </Text>
                  <Text variant="bodyMedium" style={styles.fareText}>
                    運賃: ¥{ticket.fare.toLocaleString()}
                  </Text>
                  <Text variant="bodySmall" style={styles.dateText}>
                    有効期限: {new Date(ticket.expiry_date).toLocaleString('ja-JP')}
                  </Text>
                  <Text variant="bodySmall" style={styles.ticketCode}>
                    コード: {ticket.ticket_code}
                  </Text>
                </View>
                <View style={styles.qrCodeContainer}>
                  <QRCode
                    value={generateQRCodeData(ticket)}
                    size={120}
                    backgroundColor="#fff"
                  />
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* 空の状態 */}
      {commuterPasses.length === 0 && qrTickets.length === 0 && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons name="ticket-outline" size={64} color="#ccc" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              定期券やQRコード切符はありません
            </Text>
            <Text variant="bodySmall" style={styles.emptySubText}>
              上のボタンから購入・発券できます
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    margin: 16,
    backgroundColor: '#d32f2f',
  },
  balanceLabel: {
    color: '#fff',
    textAlign: 'center',
  },
  balanceAmount: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    marginVertical: 8,
  },
  cardNumber: {
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#d32f2f',
  },
  actionButtonSecondary: {
    backgroundColor: '#1976d2',
  },
  actionButtonContent: {
    paddingVertical: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 12,
  },
  cardContentCenter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  routeName: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  stationInfo: {
    marginBottom: 8,
  },
  dateContainer: {
    marginVertical: 4,
  },
  dateText: {
    color: '#666',
  },
  statusChip: {
    marginTop: 8,
    backgroundColor: '#e8f5e9',
  },
  statusChipText: {
    color: '#2e7d32',
  },
  qrCard: {
    marginBottom: 12,
  },
  qrCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrInfo: {
    flex: 1,
  },
  qrRoute: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fareText: {
    marginVertical: 4,
  },
  ticketCode: {
    color: '#666',
    fontFamily: 'monospace',
  },
  qrCodeContainer: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  emptyCard: {
    margin: 16,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
  },
  emptySubText: {
    marginTop: 8,
    color: '#999',
  },
});

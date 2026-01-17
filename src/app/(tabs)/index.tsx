import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, ActivityIndicator, Chip } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAccount,
  getActiveCommuterPasses,
  getActiveQRTickets,
} from '../../services/accountService';
import { Account, CommuterPass, QRTicket } from '../../types/database';

export default function HomeScreen() {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [commuterPasses, setCommuterPasses] = useState<CommuterPass[]>([]);
  const [qrTickets, setQRTickets] = useState<QRTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) {
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
  };

  useEffect(() => {
    loadData();
  }, [user]);

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

      {/* 定期券情報 */}
      {commuterPasses.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            定期券
          </Text>
          {commuterPasses.map((pass) => (
            <Card key={pass.id} style={styles.card}>
              <Card.Content style={styles.cardContentCenter}>
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
                <Chip mode="outlined" style={styles.statusChip}>
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
            <Card key={ticket.id} style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">
                  {ticket.start_station} → {ticket.end_station}
                </Text>
                <Text variant="bodyMedium" style={styles.fareText}>
                  運賃: ¥{ticket.fare.toLocaleString()}
                </Text>
                <Text variant="bodySmall" style={styles.dateText}>
                  有効期限: {new Date(ticket.expiry_date).toLocaleString('ja-JP')}
                </Text>
                <View style={styles.qrPlaceholder}>
                  <Text>QRコード表示予定</Text>
                  <Text variant="bodySmall">コード: {ticket.ticket_code}</Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {commuterPasses.length === 0 && qrTickets.length === 0 && (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            定期券やQRコード切符はありません
          </Text>
        </View>
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
  },
  routeName: {
    fontWeight: 'bold',
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
  },
  fareText: {
    marginVertical: 4,
  },
  qrPlaceholder: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
});

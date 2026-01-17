import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { List, ActivityIndicator, Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getAccount, getTransactions } from '../../services/accountService';
import { Transaction } from '../../types/database';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) {
      return;
    }

    try {
      const accountData = await getAccount(user.id);
      if (accountData) {
        const transactionData = await getTransactions(accountData.id);
        setTransactions(transactionData);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
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

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'charge':
      case 'demo_charge':
        return 'cash-plus';
      case 'fare':
        return 'train';
      case 'purchase':
      case 'demo_purchase':
        return 'shopping';
      case 'commuter_pass_buy':
        return 'credit-card';
      default:
        return 'help-circle';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    if (type === 'charge' || type === 'demo_charge') {
      return '#388e3c';
    }
    return '#d32f2f';
  };

  const getTransactionLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'charge':
        return 'チャージ';
      case 'demo_charge':
        return 'デモチャージ';
      case 'fare':
        return '運賃';
      case 'purchase':
        return '購入';
      case 'demo_purchase':
        return 'デモ購入';
      case 'commuter_pass_buy':
        return '定期券購入';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="history" size={64} color="#ccc" />
        <Text variant="titleMedium" style={styles.emptyText}>
          利用履歴がありません
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {transactions.map((transaction) => (
        <List.Item
          key={transaction.id}
          title={transaction.description || getTransactionLabel(transaction.type)}
          description={`${new Date(transaction.transaction_date).toLocaleString('ja-JP')}${
            transaction.location ? ` - ${transaction.location}` : ''
          }`}
          left={(props) => (
            <List.Icon
              {...props}
              icon={getTransactionIcon(transaction.type)}
              color={getTransactionColor(transaction.type)}
            />
          )}
          right={() => (
            <View style={styles.rightContent}>
              <Text
                variant="titleMedium"
                style={[
                  styles.amountText,
                  { color: getTransactionColor(transaction.type) },
                ]}
              >
                {transaction.amount > 0 ? '+' : ''}¥
                {transaction.amount.toLocaleString()}
              </Text>
              <Chip mode="outlined" compact style={styles.typeChip}>
                {getTransactionLabel(transaction.type)}
              </Chip>
            </View>
          )}
          style={styles.listItem}
        />
      ))}
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
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontWeight: 'bold',
  },
  typeChip: {
    marginTop: 4,
  },
});

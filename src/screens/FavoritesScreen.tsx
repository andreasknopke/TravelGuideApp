import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '../hooks';
import { Attraction } from '../types';
import { RootStackParamList } from '../types/navigation';

type FavoritesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const { t } = useTranslation();
  const { favorites, toggleFavorite } = useFavorites();

  const renderFavorite = ({ item }: { item: Attraction }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('WebView', { name: item.name })}
    >
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.type}>{item.type}</Text>
        <Text style={styles.rating}>⭐ {item.rating.toFixed(1)}</Text>
      </View>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={(e) => {
          e?.stopPropagation?.();
          toggleFavorite(item);
        }}
      >
        <Text style={styles.favoriteIcon}>❤️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('favorites')}</Text>
        <Text style={styles.count}>{favorites.length} {favorites.length === 1 ? 'Favorit' : 'Favoriten'}</Text>
      </View>
      <FlatList
        data={favorites}
        renderItem={renderFavorite}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('noFavoritesSaved')}</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  count: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  favoriteButton: {
    justifyContent: 'center',
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999',
  },
});

export default FavoritesScreen;

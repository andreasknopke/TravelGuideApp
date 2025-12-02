import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getFavorites, removeFavorite } from './favoritesStorage';

export default function FavoritesScreen({ navigation }) {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
    
    // Reload favorites when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadFavorites();
    });
    
    return unsubscribe;
  }, [navigation]);

  const loadFavorites = async () => {
    setRefreshing(true);
    const favs = await getFavorites();
    setFavorites(favs);
    setRefreshing(false);
  };

  const handleRemoveFavorite = async (attraction) => {
    Alert.alert(
      'Favorit entfernen',
      `Möchten Sie "${attraction.name}" aus Ihren Favoriten entfernen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: async () => {
            const newFavorites = await removeFavorite(attraction.id);
            setFavorites(newFavorites);
          }
        }
      ]
    );
  };

  const viewDetails = (attraction) => {
    navigation.navigate('Details', {
      location: attraction.name,
      coordinates: { lat: attraction.latitude, lng: attraction.longitude }
    });
  };

  const renderFavorite = ({ item }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() => viewDetails(item)}
    >
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteName}>{item.name}</Text>
        <Text style={styles.favoriteType}>{item.type}</Text>
        {item.distance && (
          <Text style={styles.favoriteDistance}>
            📍 {item.distance}m entfernt
          </Text>
        )}
        {item.savedAt && (
          <Text style={styles.savedDate}>
            Gespeichert: {new Date(item.savedAt).toLocaleDateString('de-DE')}
          </Text>
        )}
      </View>
      <View style={styles.actionButtons}>
        <Text style={styles.rating}>⭐ {item.rating?.toFixed(1) || 'N/A'}</Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFavorite(item)}
        >
          <Text style={styles.removeButtonText}>❌</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>❤️ Meine Favoriten</Text>
        <Text style={styles.headerSubtitle}>
          {favorites.length} {favorites.length === 1 ? 'Sehenswürdigkeit' : 'Sehenswürdigkeiten'} gespeichert
        </Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💭</Text>
          <Text style={styles.emptyText}>Keine Favoriten gespeichert</Text>
          <Text style={styles.emptySubtext}>
            Tippen Sie auf das ❤️ Symbol bei Sehenswürdigkeiten, um sie hier zu speichern
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={(item) => item.id.toString()}
          refreshing={refreshing}
          onRefresh={loadFavorites}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  favoriteCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  favoriteType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  favoriteDistance: {
    fontSize: 13,
    color: '#007AFF',
    marginBottom: 2,
  },
  savedDate: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  actionButtons: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

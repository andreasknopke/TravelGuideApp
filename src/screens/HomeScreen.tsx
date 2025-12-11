import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { Attraction, Coordinates, MapData, SearchResult } from '../types';
import { RootStackParamList } from '../types/navigation';
import { useLocation, useFavorites, useAttractions } from '../hooks';
import LocationSearchBar from '../components/LocationSearchBar';
import { locationService, storageService } from '../services';
import { STORAGE_KEYS, APP_CONFIG } from '../constants';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { t } = useTranslation();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSearchLocation, setSelectedSearchLocation] = useState<Coordinates | null>(null);
  const [selectedCityInfo, setSelectedCityInfo] = useState<any>(null);
  const [isRefreshingGPS, setIsRefreshingGPS] = useState(false);
  
  const { location, cityInfo, loading: locationLoading, error: locationError, gpsStatus, refreshLocation } = useLocation(true);
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { attractions, loading: attractionsLoading, loadAttractions } = useAttractions();

  useEffect(() => {
    const effectiveLocation = selectedSearchLocation || location;
    // Load attractions if we have a valid location from manual selection OR GPS is ready
    if (effectiveLocation && (selectedSearchLocation || gpsStatus !== 'SEARCHING')) {
      loadAttractions(effectiveLocation);
      saveMapData(effectiveLocation, attractions);
    }
  }, [location, selectedSearchLocation, gpsStatus]);

  useEffect(() => {
    if (attractions.length > 0 && location) {
      saveMapData(location, attractions);
    }
  }, [attractions]);

  const saveMapData = async (coords: Coordinates, attractionsList: Attraction[]) => {
    const mapData: MapData = {
      location: coords,
      attractions: attractionsList,
      useGPS: !selectedSearchLocation, // true if using GPS, false if search result
    };
    await storageService.set(STORAGE_KEYS.MAP_DATA, mapData);
  };

  const handleSelectLocation = async (result: SearchResult) => {
    try {
      const cityInfoData = await locationService.selectSearchResult(result);
      const coords: Coordinates = {
        latitude: cityInfoData.latitude,
        longitude: cityInfoData.longitude,
      };
      
      setSelectedSearchLocation(coords);
      setSelectedCityInfo(cityInfoData);
      await loadAttractions(coords);
      saveMapData(coords, attractions);
    } catch (error) {
      Alert.alert(t('error'), t('locationSearchError'));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setSelectedSearchLocation(null); // Clear search selection
    setSelectedCityInfo(null);
    await refreshLocation();
    setRefreshing(false);
  };

  const handleGPSRefresh = async () => {
    try {
      setIsRefreshingGPS(true);
      setSelectedSearchLocation(null);
      setSelectedCityInfo(null);
      await refreshLocation();
      
      // Show toast if GPS signal could not be acquired
      if (gpsStatus === 'UNAVAILABLE' || gpsStatus === 'PERMISSION_DENIED') {
        Alert.alert(t('error'), gpsStatus === 'PERMISSION_DENIED' ? t('locationPermissionDenied') : t('gpsUnavailable'));
      }
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('gpsUnavailable'));
    } finally {
      setIsRefreshingGPS(false);
    }
  };

  const openInMaps = (item: Attraction) => {
    const { latitude, longitude, name } = item;
    const label = encodeURIComponent(name);
    
    let url: string;
    if (Platform.OS === 'ios') {
      url = `maps://app?daddr=${latitude},${longitude}&q=${label}`;
    } else if (Platform.OS === 'android') {
      url = `google.navigation:q=${latitude},${longitude}`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
          Linking.openURL(webUrl);
        }
      })
      .catch(() => {
        Alert.alert(t('errorTitle'), t('routePlannerError'));
      });
  };

  const renderAttraction = ({ item }: { item: Attraction }) => (
    <TouchableOpacity
      style={[
        styles.attractionCard,
        (item.interestScore ?? 0) >= APP_CONFIG.HIGH_INTEREST_SCORE && styles.highlightedCard,
      ]}
      onPress={() => navigation.navigate('WebView', { name: item.name })}
    >
      <View style={styles.attractionInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.attractionName}>{item.name}</Text>
          {(item.interestScore ?? 0) >= APP_CONFIG.HIGH_INTEREST_SCORE && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchBadgeText}>✨ Top Match</Text>
            </View>
          )}
        </View>
        {item.interestReason && item.interestScore && item.interestScore >= APP_CONFIG.MIN_INTEREST_SCORE && (
          <Text style={styles.interestReason}>💡 {item.interestReason}</Text>
        )}
        <Text style={styles.attractionType}>{item.type}</Text>
        <Text style={styles.attractionDistance}>
          {t('distance')}: {item.distance}m
        </Text>
        <TouchableOpacity
          style={styles.routeButton}
          onPress={(e) => {
            e?.stopPropagation?.();
            openInMaps(item);
          }}
        >
          <Text style={styles.routeButtonText}>🗺️ Route</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.ratingContainer}>
        {item.interestScore && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Match</Text>
            <Text style={styles.scoreValue}>{item.interestScore}/10</Text>
          </View>
        )}
        <Text style={styles.rating}>⭐ {item.rating.toFixed(1)}</Text>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(e) => {
            e?.stopPropagation?.();
            toggleFavorite(item);
          }}
        >
          <Text style={styles.favoriteIcon}>
            {favoriteIds.has(item.id) ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const loading = locationLoading || attractionsLoading;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchBarWrapper}>
            <LocationSearchBar 
              onSelectLocation={handleSelectLocation}
              placeholder={t('searchLocationPlaceholder')}
            />
          </View>
          <TouchableOpacity
            testID="gps-button"
            style={[
              styles.gpsButton,
              (isRefreshingGPS || gpsStatus === 'SEARCHING') && styles.gpsButtonDisabled
            ]}
            onPress={handleGPSRefresh}
            disabled={isRefreshingGPS || gpsStatus === 'SEARCHING'}
          >
            {isRefreshingGPS || gpsStatus === 'SEARCHING' ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.gpsButtonIcon}>📍</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{t('nearbyAttractions')}</Text>
        {(selectedCityInfo || cityInfo) && (() => {
          const displayCityInfo = selectedCityInfo || cityInfo;
          return (
            <TouchableOpacity 
              style={styles.cityInfoContainer}
              onPress={() => navigation.navigate('WebView', { name: displayCityInfo.city })}
            >
              <View style={styles.cityImagePlaceholder}>
                <Text style={styles.cityImageEmoji}>🏛️</Text>
              </View>
              <Text style={styles.cityName}>
                {selectedCityInfo ? '🔍' : '📍'} {displayCityInfo.city}
              </Text>
              {displayCityInfo.state && (
                <Text style={styles.cityDetails}>
                  {displayCityInfo.state}, {displayCityInfo.country}
                </Text>
              )}
              <Text style={styles.cityLink}>
                👉 {t('learnMoreAbout', { city: displayCityInfo.city })}
              </Text>
            </TouchableOpacity>
          );
        })()}
        {location && !cityInfo && !selectedCityInfo && (
          <Text style={styles.locationText}>
            📍 {t('currentLocation')}: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      {locationError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {locationError}</Text>
        </View>
      )}

      {loading && !refreshing ? (
        <ActivityIndicator testID="activity-indicator" size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          testID="attractions-list"
          data={attractions}
          renderItem={renderAttraction}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t('noAttractionsFound')}</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  searchBarWrapper: {
    flex: 1,
  },
  gpsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  gpsButtonDisabled: {
    opacity: 0.5,
  },
  gpsButtonIcon: {
    fontSize: 24,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  cityInfoContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  cityImagePlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityImageEmoji: {
    fontSize: 72,
  },
  cityName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  cityDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cityLink: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 4,
  },
  attractionCard: {
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
  highlightedCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: '#FFFEF0',
  },
  attractionInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  attractionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  matchBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },
  interestReason: {
    fontSize: 13,
    color: '#007AFF',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  attractionType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  attractionDistance: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  routeButton: {
    marginTop: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  routeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  ratingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 6,
    marginBottom: 8,
    alignItems: 'center',
    minWidth: 50,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
  },
  favoriteButton: {
    marginTop: 8,
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  loader: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999',
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    margin: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default HomeScreen;

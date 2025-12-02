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
  Linking,
  Platform,
  Alert,
  Switch,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import axios from 'axios';
import { getNearbyAttractions, searchWikitravelLocations, reverseGeocode, classifyAttractionsByInterests, getCityImage } from './api';
import { addFavorite, removeFavorite, getFavorites } from './favoritesStorage';
import { getInterests } from './interestsStorage';
import { getCachedAttractions, cacheAttractions } from './attractionsCache';
import { getCachedCityImage, cacheCityImage, cleanupInvalidCache } from './cityImageCache';

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const [location, setLocation] = useState(null);
  const [currentCity, setCurrentCity] = useState(null);
  const [cityImage, setCityImage] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [useGPS, setUseGPS] = useState(true);
  const [manualLocation, setManualLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  useEffect(() => {
    // Lösche City Image Cache beim Start (damit neue Scraping-Methode verwendet wird)
    AsyncStorage.removeItem('@travel_guide_city_images').then(() => {
      console.log('City image cache cleared for new scraping method');
    });
    
    getCurrentLocation();
    loadFavoriteIds();
    
    // GPS-Tracking für automatische Updates
    let locationSubscription;
    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 500, // Update bei 500m Bewegung (vorher 100m)
            timeInterval: 120000, // Oder alle 2 Minuten (vorher 30 Sekunden)
          },
          (newLocation) => {
            const { latitude, longitude } = newLocation.coords;
            const oldLat = location?.latitude;
            const oldLng = location?.longitude;
            
            // Prüfe ob sich Position signifikant geändert hat
            if (!oldLat || !oldLng || 
                Math.abs(latitude - oldLat) > 0.005 || 
                Math.abs(longitude - oldLng) > 0.005) {
              setLocation(newLocation.coords);
              
              // Aktualisiere Stadt und Sehenswürdigkeiten
              reverseGeocode(latitude, longitude).then(setCurrentCity);
              loadNearbyAttractions(latitude, longitude);
            }
          }
        );
      }
    };
    
    startLocationTracking();
    
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);
  
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert(t('locationPermissionDenied'));
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      
      // Ermittle Stadt/Ort
      const cityInfo = await reverseGeocode(
        currentLocation.coords.latitude, 
        currentLocation.coords.longitude
      );
      setCurrentCity(cityInfo);
      
      // Lade Stadtbild mit Cache
      if (cityInfo && cityInfo.city) {
        loadCityImage(cityInfo.city);
      }
      
      loadNearbyAttractions(currentLocation.coords.latitude, currentLocation.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadNearbyAttractions = async (lat, lng) => {
    setLoading(true);
    try {
      const userInterests = await getInterests();
      
      // Prüfe Cache zuerst
      const cached = await getCachedAttractions(lat, lng, userInterests);
      if (cached) {
        setAttractions(cached);
        await loadFavoriteIds();
        
        // Speichere für MapScreen
        await AsyncStorage.setItem('@travel_guide_map_data', JSON.stringify({
          location: { latitude: lat, longitude: lng },
          attractions: cached,
          useGPS: useGPS
        }));
        
        setLoading(false);
        return;
      }
      
      // Keine Cache-Daten, lade von API
      console.log('No cache, fetching from API...');
      const nearby = await getNearbyAttractions(lat, lng);
      setAttractions(nearby);
      await loadFavoriteIds();
      
      // Speichere für MapScreen
      await AsyncStorage.setItem('@travel_guide_map_data', JSON.stringify({
        location: { latitude: lat, longitude: lng },
        attractions: nearby,
        useGPS: useGPS
      }));
      
      // Klassifiziere im Hintergrund (optional)
      classifyAttractionsInBackground(nearby, lat, lng, userInterests);
    } catch (error) {
      console.error('Error loading attractions:', error);
    } finally {
      setLoading(false);
    }
  };

  const classifyAttractionsInBackground = async (attractionsList, lat, lng, userInterests) => {
    try {
      if (userInterests.length > 0) {
        const classified = await classifyAttractionsByInterests(attractionsList, userInterests);
        setAttractions(classified);
        
        // Speichere klassifizierte Daten im Cache
        await cacheAttractions(lat, lng, classified, userInterests);
        
        // Aktualisiere für MapScreen
        await AsyncStorage.setItem('@travel_guide_map_data', JSON.stringify({
          location: { latitude: lat, longitude: lng },
          attractions: classified,
          useGPS: useGPS
        }));
      } else {
        // Speichere auch unklassifizierte Daten
        await cacheAttractions(lat, lng, attractionsList, userInterests);
      }
    } catch (error) {
      console.log('Classification skipped:', error.message);
      // Speichere unklassifizierte Daten im Cache
      await cacheAttractions(lat, lng, attractionsList, userInterests);
    }
  };

  const loadCityImage = async (cityName) => {
    // Wikimedia blockiert alle Bilder ohne User-Agent Header (HTTP 403)
    // React Native Image kann keine Custom Headers setzen
    // Zeige Platzhalter-Emoji statt Bild
    setCityImage('placeholder');
  };

  const loadFavoriteIds = async () => {
    try {
      const favs = await getFavorites();
      setFavoriteIds(new Set(favs.map(f => f.id)));
    } catch (error) {
      console.error('Error loading favorite IDs:', error);
    }
  };

  const toggleFavorite = async (attraction) => {
    const isFav = favoriteIds.has(attraction.id);
    
    if (isFav) {
      await removeFavorite(attraction.id);
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(attraction.id);
        return newSet;
      });
    } else {
      await addFavorite(attraction);
      setFavoriteIds(prev => new Set(prev).add(attraction.id));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (useGPS) {
      await getCurrentLocation();
    } else if (manualLocation.trim()) {
      await searchManualLocation(manualLocation);
    }
    setRefreshing(false);
  };

  const searchManualLocation = async (locationName) => {
    setLoading(true);
    try {
      // Suche über Wikipedia/Nominatim nach dem Ortsnamen
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: locationName,
          format: 'json',
          limit: 1,
          'accept-language': 'de'
        },
        headers: {
          'User-Agent': 'TravelGuideApp/1.0'
        }
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        setLocation({ latitude: lat, longitude: lng });
        
        const cityInfo = await reverseGeocode(lat, lng);
        setCurrentCity(cityInfo);
        
        if (cityInfo && cityInfo.city) {
          loadCityImage(cityInfo.city);
        }
        
        await loadNearbyAttractions(lat, lng);
      } else {
        Alert.alert('Fehler', 'Ort nicht gefunden');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      Alert.alert('Fehler', 'Fehler bei der Ortssuche');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLocationSubmit = () => {
    if (manualLocation.trim()) {
      searchManualLocation(manualLocation);
    }
  };

  const handleGPSToggle = (value) => {
    setUseGPS(value);
    if (value) {
      // Aktiviere GPS-Tracking
      getCurrentLocation();
    }
  };

  const openInMaps = (item) => {
    const { latitude, longitude, name } = item;
    const label = encodeURIComponent(name);
    
    let url;
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
        Alert.alert('Fehler', 'Routenplaner konnte nicht geöffnet werden');
      });
  };

  const renderAttraction = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.attractionCard,
        item.interestScore >= 8 && styles.highlightedCard
      ]}
      onPress={() => navigation.navigate('WebView', { name: item.name })}
    >
      <View style={styles.attractionInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.attractionName}>{item.name}</Text>
          {item.interestScore >= 8 && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchBadgeText}>✨ Top Match</Text>
            </View>
          )}
        </View>
        {item.interestReason && item.interestScore >= 7 && (
          <Text style={styles.interestReason}>💡 {item.interestReason}</Text>
        )}
        <Text style={styles.attractionType}>{item.type}</Text>
        <Text style={styles.attractionDistance}>
          {t('distance')}: {item.distance}m
        </Text>
        <TouchableOpacity
          style={styles.routeButton}
          onPress={(e) => {
            e.stopPropagation();
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
            e.stopPropagation();
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

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => selectLocation(item)}
    >
      <Text style={styles.searchResultTitle}>{item.title}</Text>
      <Text style={styles.searchResultDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.modeContainer}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>
            {useGPS ? '📍 GPS-Modus' : '🔍 Manuelle Suche'}
          </Text>
          <Switch
            value={useGPS}
            onValueChange={handleGPSToggle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={useGPS ? '#007AFF' : '#f4f3f4'}
          />
        </View>
        
        {!useGPS && (
          <View style={styles.manualSearchContainer}>
            <TextInput
              style={styles.manualSearchInput}
              placeholder="Ort eingeben (z.B. Bad Doberan)"
              value={manualLocation}
              onChangeText={setManualLocation}
              onSubmitEditing={handleManualLocationSubmit}
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handleManualLocationSubmit}
            >
              <Text style={styles.searchButtonText}>Suchen</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{t('nearbyAttractions')}</Text>
        {currentCity && (
          <TouchableOpacity 
            style={styles.cityInfoContainer}
            onPress={() => navigation.navigate('WebView', { 
              name: currentCity.city
            })}
          >
            {cityImage && (
              <View style={styles.cityImagePlaceholder}>
                <Text style={styles.cityImageEmoji}>🏛️</Text>
              </View>
            )}
            <Text style={styles.cityName}>📍 {currentCity.city}</Text>
            {currentCity.state && (
              <Text style={styles.cityDetails}>{currentCity.state}, {currentCity.country}</Text>
            )}
            <Text style={styles.cityLink}>👉 Mehr über {currentCity.city} erfahren</Text>
          </TouchableOpacity>
        )}
        {location && !currentCity && (
          <Text style={styles.locationText}>
            📍 {t('currentLocation')}: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modeContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  manualSearchContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  manualSearchInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  searchResultsList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchResultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  searchResultDescription: {
    fontSize: 14,
    color: '#666',
  },
});

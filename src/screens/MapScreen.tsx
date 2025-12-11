import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { getNearbyAttractions } from '../services/attractions.service';
import { RootStackParamList } from '../types/navigation';
import { Attraction, Coordinates } from '../types';

// Only import MapView on native platforms
let MapView: any, Marker: any, PROVIDER_GOOGLE: any;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const { width, height } = Dimensions.get('window');

interface Props {
  navigation: NavigationProp<RootStackParamList>;
}

export default function MapScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [location, setLocation] = useState<Location.LocationObject | Coordinates | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [useGPS, setUseGPS] = useState(true);
  const [mapRef, setMapRef] = useState<any>(null);

  // Load data from HomeScreen when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const getCurrentLocation = async () => {
        try {
          const { status} = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(t('error'), t('locationPermissionDenied'));
            setLoading(false);
            return;
          }

          const currentLocation = await Location.getCurrentPositionAsync({});
          setLocation(currentLocation);

          const nearby = await getNearbyAttractions({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude
          });
          setAttractions(nearby);
          setLoading(false);
        } catch (error) {
          console.error('Error getting location:', error);
          setLoading(false);
        }
      };

      const loadMapData = async () => {
        try {
          setLoading(true);
          
          // Versuche gespeicherte Daten vom HomeScreen zu laden
          const savedData = await AsyncStorage.getItem('@travel_guide_map_data');
          
          if (savedData) {
            const { location: savedLocation, attractions: savedAttractions, useGPS: savedUseGPS } = JSON.parse(savedData);
            
            setLocation(savedLocation);
            setAttractions(savedAttractions || []);
            setUseGPS(savedUseGPS);
            setLoading(false);
            
            // Recenter map on the location
            if (mapRef && savedLocation) {
              const coords = 'coords' in savedLocation ? savedLocation.coords : savedLocation;
              mapRef.animateToRegion({
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }, 500);
            }
          } else {
            // Fallback: Hole aktuelle GPS-Position
            await getCurrentLocation();
          }
        } catch (error) {
          console.error('Error loading map data:', error);
          await getCurrentLocation();
        }
      };
      
      loadMapData();
    }, [t])
  );

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('error'), t('locationPermissionDenied'));
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      const nearby = await getNearbyAttractions({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude
      });
      setAttractions(nearby);
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setLoading(false);
    }
  };

  const handleMarkerPress = (attraction: Attraction) => {
    try {
      setSelectedAttraction(attraction);
    } catch (error) {
      console.error('Error selecting attraction:', error);
    }
  };

  const navigateToDetails = () => {
    try {
      if (selectedAttraction) {
        navigation.navigate('WebView', {
          name: selectedAttraction.name
        });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(t('error'), t('navigationError'));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('locationPermissionDenied')}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={getCurrentLocation}
        >
          <Text style={styles.retryButtonText}>{t('getLocation')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Helper function to get coordinates from either Location.LocationObject or Coordinates
  const getCoords = (loc: Location.LocationObject | Coordinates) => {
    if ('coords' in loc) {
      return loc.coords;
    }
    return loc;
  };

  const coords = getCoords(location);

  // Web fallback - show list instead of map
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webHeader}>
          <Text style={styles.webTitle}>📍 {t('map')}</Text>
          <Text style={styles.webSubtitle}>
            {t('currentLocation')}: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
          </Text>
          <Text style={styles.webNote}>
            {t('mapOnlyMobileApp')}
          </Text>
        </View>
        <View style={styles.attractionsList}>
          {attractions.map((attraction) => (
            <TouchableOpacity
              key={attraction.id}
              style={styles.webAttractionCard}
              onPress={() => {
                setSelectedAttraction(attraction);
              }}
            >
              <Text style={styles.webAttractionName}>{attraction.name}</Text>
              <Text style={styles.webAttractionType}>{attraction.type}</Text>
              <Text style={styles.webAttractionDistance}>
                {t('distance')}: {attraction.distance}m | ⭐ {attraction.rating}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {selectedAttraction && (
          <View style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>{selectedAttraction.name}</Text>
              <Text style={styles.infoType}>{selectedAttraction.type}</Text>
              <Text style={styles.infoDistance}>
                {t('distance')}: {selectedAttraction.distance}m
              </Text>
              <Text style={styles.infoRating}>⭐ {selectedAttraction.rating}</Text>
            </View>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={navigateToDetails}
            >
              <Text style={styles.detailsButtonText}>{t('viewDetails')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Native map rendering with error handling
  try {
    return (
      <View style={styles.container}>
        <MapView
          ref={(ref) => setMapRef(ref)}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {attractions.map((attraction) => (
            <Marker
              key={attraction.id}
              coordinate={{
                latitude: attraction.latitude,
                longitude: attraction.longitude,
              }}
              title={attraction.name}
              description={`${attraction.type} - ${attraction.distance}m`}
              onPress={() => handleMarkerPress(attraction)}
            />
          ))}
        </MapView>

        {selectedAttraction && (
          <View style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>{selectedAttraction.name}</Text>
              <Text style={styles.infoType}>{selectedAttraction.type}</Text>
              <Text style={styles.infoDistance}>
                {t('distance')}: {selectedAttraction.distance}m
              </Text>
              <Text style={styles.infoRating}>⭐ {selectedAttraction.rating}</Text>
            </View>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={navigateToDetails}
            >
              <Text style={styles.detailsButtonText}>{t('viewDetails')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  } catch (error) {
    console.error('MapView error:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('mapLoadError')}</Text>
        <Text style={styles.errorSubtext}>
          {t('checkMapsConfig')}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadMapData}
        >
          <Text style={styles.retryButtonText}>{t('retryButton')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoContent: {
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  infoType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  infoDistance: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  infoRating: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailsButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webHeader: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  webTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  webSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  webNote: {
    fontSize: 13,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  attractionsList: {
    flex: 1,
    padding: 16,
  },
  webAttractionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  webAttractionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  webAttractionType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  webAttractionDistance: {
    fontSize: 14,
    color: '#999',
  },
});

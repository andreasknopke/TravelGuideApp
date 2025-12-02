import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { getNearbyAttractions } from './api';

// Only import MapView on native platforms
let MapView, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const { width, height } = Dimensions.get('window');

export default function MapScreen({ navigation }) {
  const { t } = useTranslation();
  const [location, setLocation] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [useGPS, setUseGPS] = useState(true);

  // Lade Daten vom HomeScreen wenn Screen fokussiert wird
  useFocusEffect(
    React.useCallback(() => {
      loadMapData();
    }, [])
  );

  const loadMapData = async () => {
    try {
      setLoading(true);
      
      // Versuche gespeicherte Daten vom HomeScreen zu laden
      const savedData = await AsyncStorage.getItem('@travel_guide_map_data');
      
      if (savedData) {
        const { location: savedLocation, attractions: savedAttractions, useGPS: savedUseGPS } = JSON.parse(savedData);
        
        setLocation({
          latitude: savedLocation.latitude,
          longitude: savedLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        setAttractions(savedAttractions || []);
        setUseGPS(savedUseGPS);
        setLoading(false);
      } else {
        // Fallback: Hole aktuelle GPS-Position
        await getCurrentLocation();
      }
    } catch (error) {
      console.error('Error loading map data:', error);
      await getCurrentLocation();
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert(t('locationPermissionDenied'));
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      const nearby = await getNearbyAttractions(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
      setAttractions(nearby);
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setLoading(false);
    }
  };

  const handleMarkerPress = (attraction) => {
    setSelectedAttraction(attraction);
  };

  const navigateToDetails = () => {
    if (selectedAttraction) {
      navigation.navigate('Details', {
        location: selectedAttraction.name,
        coordinates: {
          lat: selectedAttraction.latitude,
          lng: selectedAttraction.longitude
        }
      });
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
      </View>
    );
  }

  // Web fallback - show list instead of map
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webHeader}>
          <Text style={styles.webTitle}>📍 {t('map')}</Text>
          <Text style={styles.webSubtitle}>
            {t('currentLocation')}: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
          <Text style={styles.webNote}>
            💡 Kartenansicht ist nur in der mobilen App verfügbar
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

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={location}
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

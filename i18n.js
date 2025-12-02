import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'Travel Guide',
      home: 'Home',
      map: 'Map',
      favorites: 'Favorites',
      settings: 'Settings',
      nearbyAttractions: 'Nearby Attractions',
      searchPlaceholder: 'Search city or attraction...',
      currentLocation: 'Current Location',
      selectLanguage: 'Select Language',
      english: 'English',
      german: 'German',
      loading: 'Loading...',
      error: 'Error',
      locationPermissionDenied: 'Location permission denied',
      distance: 'Distance',
      getDirections: 'Get Directions',
      viewDetails: 'View Details',
      noAttractionsFound: 'No attractions found nearby',
      refreshing: 'Refreshing...',
      aboutThisPlace: 'About this place',
      openingHours: 'Opening Hours',
      contact: 'Contact',
      website: 'Website'
    }
  },
  de: {
    translation: {
      appName: 'Reiseführer',
      home: 'Start',
      map: 'Karte',
      favorites: 'Favoriten',
      settings: 'Einstellungen',
      nearbyAttractions: 'Sehenswürdigkeiten in der Nähe',
      searchPlaceholder: 'Stadt oder Sehenswürdigkeit suchen...',
      currentLocation: 'Aktueller Standort',
      selectLanguage: 'Sprache wählen',
      english: 'Englisch',
      german: 'Deutsch',
      loading: 'Lädt...',
      error: 'Fehler',
      locationPermissionDenied: 'Standortberechtigung verweigert',
      distance: 'Entfernung',
      getDirections: 'Route anzeigen',
      viewDetails: 'Details anzeigen',
      noAttractionsFound: 'Keine Sehenswürdigkeiten in der Nähe gefunden',
      refreshing: 'Aktualisieren...',
      aboutThisPlace: 'Über diesen Ort',
      openingHours: 'Öffnungszeiten',
      contact: 'Kontakt',
      website: 'Webseite'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'de',
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

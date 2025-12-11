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
      website: 'Website',
      // Empty States
      noFavoritesSaved: 'No favorites saved',
      noInformationAvailable: 'No information available.',
      noWikipediaData: 'No Wikipedia data available for this location.',
      noPersonalizedInfo: 'No personalized information available.',
      mapOnlyMobileApp: '💡 Map view is only available in mobile app',
      // Mode Labels
      gpsMode: '📍 GPS Mode',
      manualSearch: '🔍 Manual Search',
      // Action Buttons
      searchButton: 'Search',
      retryButton: 'Try Again',
      getLocation: 'Get Location',
      // Input Placeholders
      enterLocationPlaceholder: 'Enter location (e.g. Bad Doberan)',
      searchLocationPlaceholder: 'Search for a location...',
      // Search States
      noResultsFound: 'No results found',
      searchingLocations: 'Searching...',
      selectLocation: 'Select a location',
      // GPS Button
      useCurrentLocation: 'Use my location',
      detectingLocation: 'Detecting location...',
      locationDetected: 'Location detected',
      // GPS Status Indicators
      gpsActive: 'GPS Active',
      gpsSearching: 'Searching for GPS signal...',
      gpsUnavailable: 'GPS signal unavailable',
      gpsPermissionDenied: 'Location permission needed',
      gpsDisabled: 'GPS disabled',
      openSettings: 'Open Settings',
      // AI & Personalization
      interestingForYou: 'Interesting for you',
      sourceWikipedia: 'Source: Wikipedia',
      personalizedDescription: 'Personalized Description',
      myInterests: 'My Interests',
      // Prompts
      selectInterestsPrompt: 'Select your interests to get personalized recommendations:',
      learnMoreAbout: 'Learn more about {{city}}',
      // Settings & About
      appInformation: 'App Information',
      version: 'Version',
      dataSources: 'Data Sources',
      aboutThisApp: 'About this App',
      aboutDescription: 'This travel guide app uses GPS locations to find interesting places nearby. Data is sourced from Wikitravel and AI services to provide you with the best information about attractions and cities.',
      // Error Messages
      errorTitle: 'Error',
      locationNotFoundError: 'Location not found',
      locationSearchError: 'Error searching location',
      navigationError: 'Could not navigate to details',
      routePlannerError: 'Could not open route planner',
      mapLoadError: 'Map could not be loaded',
      checkMapsConfig: 'Please check Google Maps configuration',
      // Error Notification System
      errors: {
        location: {
          permissionDenied: 'Location access is required to find nearby attractions. Please enable location in settings.',
          unavailable: 'Unable to determine your location. Please try again.',
          timeout: 'Location request timed out. Please try again.',
        },
        network: {
          offline: 'No internet connection. Please check your connection and try again.',
          timeout: 'Request timed out. Please try again.',
          serverError: 'Unable to load data. Please try again later.',
        },
        storage: {
          saveFailed: 'Unable to save {{itemType}}. Please try again.',
          loadFailed: 'Unable to load saved data.',
        },
        api: {
          openaiUnavailable: 'Unable to personalize recommendations. Showing all attractions.',
          wikiUnavailable: 'Additional information not available for this attraction.',
          rateLimited: 'Too many requests. Please wait a moment.',
        },
        actions: {
          openSettings: 'Open Settings',
          retry: 'Retry',
          dismiss: 'Dismiss',
          ok: 'OK',
        },
      },
    },
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
      website: 'Webseite',
      // Empty States
      noFavoritesSaved: 'Keine Favoriten gespeichert',
      noInformationAvailable: 'Keine Informationen verfügbar.',
      noWikipediaData: 'Keine Wikipedia-Daten für diesen Ort verfügbar.',
      noPersonalizedInfo: 'Keine personalisierten Informationen verfügbar.',
      mapOnlyMobileApp: '💡 Kartenansicht ist nur in der mobilen App verfügbar',
      // Mode Labels
      gpsMode: '📍 GPS-Modus',
      manualSearch: '🔍 Manuelle Suche',
      // Action Buttons
      searchButton: 'Suchen',
      retryButton: 'Erneut versuchen',
      getLocation: 'Standort abrufen',
      // Input Placeholders
      enterLocationPlaceholder: 'Ort eingeben (z.B. Bad Doberan)',
      searchLocationPlaceholder: 'Nach einem Ort suchen...',
      // Search States
      noResultsFound: 'Keine Ergebnisse gefunden',
      searchingLocations: 'Suche läuft...',
      selectLocation: 'Ort auswählen',
      // GPS Button
      useCurrentLocation: 'Meinen Standort verwenden',
      detectingLocation: 'Standort wird ermittelt...',
      locationDetected: 'Standort ermittelt',
      // GPS Status Indicators
      gpsActive: 'GPS Aktiv',
      gpsSearching: 'Suche nach GPS-Signal...',
      gpsUnavailable: 'GPS-Signal nicht verfügbar',
      gpsPermissionDenied: 'Standortberechtigung erforderlich',
      gpsDisabled: 'GPS deaktiviert',
      openSettings: 'Einstellungen öffnen',
      // AI & Personalization
      interestingForYou: 'Für dich interessant',
      sourceWikipedia: 'Quelle: Wikipedia',
      personalizedDescription: 'Personalisierte Beschreibung',
      myInterests: 'Meine Interessen',
      // Prompts
      selectInterestsPrompt: 'Wähle deine Interessen aus, um personalisierte Empfehlungen zu erhalten:',
      learnMoreAbout: 'Mehr über {{city}} erfahren',
      // Settings & About
      appInformation: 'App Information',
      version: 'Version',
      dataSources: 'Datenquellen',
      aboutThisApp: 'Über diese App',
      aboutDescription: 'Diese Reiseführer-App nutzt GPS-Standorte, um interessante Orte in Ihrer Nähe zu finden. Daten werden von Wikitravel und KI-Diensten bezogen, um Ihnen die besten Informationen über Sehenswürdigkeiten und Städte zu liefern.',
      // Error Messages
      errorTitle: 'Fehler',
      locationNotFoundError: 'Ort nicht gefunden',
      locationSearchError: 'Fehler bei der Ortssuche',
      navigationError: 'Konnte nicht zu den Details navigieren',
      routePlannerError: 'Routenplaner konnte nicht geöffnet werden',
      mapLoadError: 'Karte konnte nicht geladen werden',
      checkMapsConfig: 'Bitte überprüfen Sie die Google Maps Konfiguration',
      // Error Notification System
      errors: {
        location: {
          permissionDenied: 'Standortzugriff ist erforderlich, um Sehenswürdigkeiten in der Nähe zu finden. Bitte aktivieren Sie den Standort in den Einstellungen.',
          unavailable: 'Ihr Standort kann nicht ermittelt werden. Bitte versuchen Sie es erneut.',
          timeout: 'Standortanfrage ist abgelaufen. Bitte versuchen Sie es erneut.',
        },
        network: {
          offline: 'Keine Internetverbindung. Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
          timeout: 'Anfrage ist abgelaufen. Bitte versuchen Sie es erneut.',
          serverError: 'Daten können nicht geladen werden. Bitte versuchen Sie es später erneut.',
        },
        storage: {
          saveFailed: '{{itemType}} kann nicht gespeichert werden. Bitte versuchen Sie es erneut.',
          loadFailed: 'Gespeicherte Daten können nicht geladen werden.',
        },
        api: {
          openaiUnavailable: 'Empfehlungen können nicht personalisiert werden. Alle Sehenswürdigkeiten werden angezeigt.',
          wikiUnavailable: 'Zusätzliche Informationen für diese Sehenswürdigkeit nicht verfügbar.',
          rateLimited: 'Zu viele Anfragen. Bitte warten Sie einen Moment.',
        },
        actions: {
          openSettings: 'Einstellungen öffnen',
          retry: 'Erneut versuchen',
          dismiss: 'Schließen',
          ok: 'OK',
        },
      },
    },
  },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: 'de',
  fallbackLng: 'en',
  compatibilityJSON: 'v3',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

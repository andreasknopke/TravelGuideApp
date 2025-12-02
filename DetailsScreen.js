import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { fetchWikitravelData, fetchLLMDescription } from './api';
import { getInterests, AVAILABLE_INTERESTS } from './interestsStorage';
import { getCachedAIDescription, cacheAIDescription } from './aiDescriptionCache';

export default function DetailsScreen({ route }) {
  const { location, coordinates } = route.params;
  const { t, i18n } = useTranslation();
  const [wikitravelData, setWikitravelData] = useState(null);
  const [llmDescription, setLLMDescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('wikitravel');

  useEffect(() => {
    loadData();
  }, [location]);

  const loadData = async () => {
    setLoading(true);
    try {
      const language = i18n.language === 'de' ? 'de' : 'en';
      
      // Lade Benutzerinteressen
      const userInterests = await getInterests();
      const interestLabels = userInterests.map(id => 
        AVAILABLE_INTERESTS.find(i => i.id === id)?.label
      ).filter(Boolean);
      
      const interestContext = interestLabels.length > 0 
        ? `Der Nutzer interessiert sich besonders für: ${interestLabels.join(', ')}. Fokussiere deine Beschreibung auf diese Aspekte.`
        : '';
      
      // Prüfe Cache für AI-Beschreibung
      const cachedAI = await getCachedAIDescription(location, userInterests);
      
      // Lade Wikipedia-Daten und AI-Beschreibung (falls nicht gecacht)
      const wikiDataPromise = fetchWikitravelData(location, language);
      const aiDescriptionPromise = cachedAI 
        ? Promise.resolve(cachedAI)
        : fetchLLMDescription(location, interestContext);
      
      const [wikiData, aiDescription] = await Promise.all([
        wikiDataPromise,
        aiDescriptionPromise
      ]);

      setWikitravelData(wikiData);
      setLLMDescription(aiDescription);
      
      // Cache AI-Beschreibung wenn neu geladen
      if (!cachedAI && aiDescription) {
        await cacheAIDescription(location, userInterests, aiDescription);
      }
      
      // Wenn keine Wikipedia-Daten vorhanden, zeige "Für dich interessant"
      if (!wikiData.extract || wikiData.extract.includes('keine detaillierten Informationen') || wikiData.extract.includes('konnten nicht geladen werden')) {
        setActiveTab('ai');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{location}</Text>
        {coordinates && (
          <Text style={styles.coordinates}>
            📍 {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </Text>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wikitravel' && styles.activeTab]}
          onPress={() => setActiveTab('wikitravel')}
        >
          <Text style={[styles.tabText, activeTab === 'wikitravel' && styles.activeTabText]}>
            Wikipedia
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ai' && styles.activeTab]}
          onPress={() => setActiveTab('ai')}
        >
          <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>
            Für dich interessant
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'wikitravel' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>{t('aboutThisPlace')}</Text>
          {wikitravelData ? (
            <>
              <Text style={styles.description}>
                {wikitravelData.extract || 'Keine Informationen verfügbar.'}
              </Text>
              {wikitravelData.coordinates && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Koordinaten:</Text>
                  <Text style={styles.infoText}>
                    Lat: {wikitravelData.coordinates.lat}, Lon: {wikitravelData.coordinates.lon}
                  </Text>
                </View>
              )}
              <View style={styles.sourceNote}>
                <Text style={styles.sourceText}>📚 Quelle: Wikipedia</Text>
              </View>
            </>
          ) : (
            <Text style={styles.noData}>
              Keine Wikipedia-Daten für diesen Ort verfügbar.
            </Text>
          )}
        </View>
      )}

      {activeTab === 'ai' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Für dich interessant</Text>
          {llmDescription ? (
            <View style={styles.aiContainer}>
              <Text style={styles.aiLabel}>💡 Personalisierte Beschreibung</Text>
              <Text style={styles.description}>{llmDescription}</Text>
            </View>
          ) : (
            <Text style={styles.noData}>Keine personalisierten Informationen verfügbar.</Text>
          )}
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  coordinates: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  infoBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#444',
  },
  noData: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  aiContainer: {
    marginTop: 8,
  },
  aiLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
  },
  aiNotice: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB800',
  },
  aiNoticeText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  actionsContainer: {
    padding: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sourceNote: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sourceText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

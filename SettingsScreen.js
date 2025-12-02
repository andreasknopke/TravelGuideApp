import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AVAILABLE_INTERESTS, getInterests, saveInterests } from './interestsStorage';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);
  const [selectedInterests, setSelectedInterests] = useState([]);

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    const interests = await getInterests();
    setSelectedInterests(interests);
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  const toggleInterest = async (interestId) => {
    let newInterests;
    if (selectedInterests.includes(interestId)) {
      newInterests = selectedInterests.filter(id => id !== interestId);
    } else {
      newInterests = [...selectedInterests, interestId];
    }
    setSelectedInterests(newInterests);
    await saveInterests(newInterests);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('selectLanguage')}</Text>
        
        <TouchableOpacity
          style={[
            styles.languageOption,
            language === 'de' && styles.selectedLanguage
          ]}
          onPress={() => changeLanguage('de')}
        >
          <View style={styles.languageInfo}>
            <Text style={styles.languageFlag}>🇩🇪</Text>
            <Text style={styles.languageText}>{t('german')}</Text>
          </View>
          {language === 'de' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.languageOption,
            language === 'en' && styles.selectedLanguage
          ]}
          onPress={() => changeLanguage('en')}
        >
          <View style={styles.languageInfo}>
            <Text style={styles.languageFlag}>🇬🇧</Text>
            <Text style={styles.languageText}>{t('english')}</Text>
          </View>
          {language === 'en' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meine Interessen</Text>
        <Text style={styles.interestsSubtitle}>
          Wähle deine Interessen aus, um personalisierte Empfehlungen zu erhalten:
        </Text>
        {AVAILABLE_INTERESTS.map((interest) => (
          <TouchableOpacity
            key={interest.id}
            style={[
              styles.interestOption,
              selectedInterests.includes(interest.id) && styles.selectedInterest
            ]}
            onPress={() => toggleInterest(interest.id)}
          >
            <View style={styles.interestInfo}>
              <Text style={styles.interestIcon}>{interest.icon}</Text>
              <Text style={styles.interestText}>{interest.label}</Text>
            </View>
            {selectedInterests.includes(interest.id) && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Data Sources</Text>
          <Text style={styles.infoValue}>Wikitravel API & LLM</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Über diese App</Text>
        <Text style={styles.aboutText}>
          Diese Reiseführer-App nutzt GPS-Standorte, um interessante Orte in Ihrer Nähe zu finden. 
          Daten werden von Wikitravel und KI-Diensten bezogen, um Ihnen die besten Informationen 
          über Sehenswürdigkeiten und Städte zu liefern.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLanguage: {
    backgroundColor: '#E8F4FF',
    borderColor: '#007AFF',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  interestsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  interestOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedInterest: {
    backgroundColor: '#E8F4FF',
    borderColor: '#007AFF',
  },
  interestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interestIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  interestText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  aboutText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
});

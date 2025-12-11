import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type WebViewScreenRouteProp = RouteProp<RootStackParamList, 'WebView'>;

interface Props {
  route: WebViewScreenRouteProp;
}

export default function WebViewScreen({ route }: Props) {
  const { name } = route.params;
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');

  useEffect(() => {
    loadPage();
  }, [name]);

  const loadPage = async () => {
    setLoading(true);
    
    // Check Wikitravel first (German)
    const wikitravelUrl = `https://wikitravel.org/de/${encodeURIComponent(name.replace(/ /g, '_'))}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(wikitravelUrl, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        setUrl(wikitravelUrl);
        setSource('Wikitravel');
        setLoading(false);
        return;
      }
    } catch (error) {
      console.log('Wikitravel not found, trying Wikipedia');
    }
    
    // Fallback: Wikipedia (deutsch)
    const wikipediaUrl = `https://de.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, '_'))}`;
    setUrl(wikipediaUrl);
    setSource('Wikipedia');
    setLoading(false);
  };

  const handleOpenInBrowser = () => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{name}</Text>
        {source && <Text style={styles.source}>📚 {source}</Text>}
        <TouchableOpacity 
          style={styles.openBrowserButton}
          onPress={handleOpenInBrowser}
        >
          <Text style={styles.openBrowserText}>🌐 In Browser öffnen</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Lade Seite...</Text>
        </View>
      ) : (
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          startInLoadingState={true}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error (non-critical):', nativeEvent);
          }}
          renderLoading={() => (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  source: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  openBrowserButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  openBrowserText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export default function WebViewScreen({ route }) {
  const { name } = route.params;
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');

  useEffect(() => {
    loadPage();
  }, [name]);

  const loadPage = async () => {
    setLoading(true);
    
    // Prüfe zuerst Wikitravel (deutsch)
    const wikitravelUrl = `https://wikitravel.org/de/${encodeURIComponent(name.replace(/ /g, '_'))}`;
    
    try {
      const response = await fetch(wikitravelUrl, { method: 'HEAD', timeout: 3000 });
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{name}</Text>
        {source && <Text style={styles.source}>📚 {source}</Text>}
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

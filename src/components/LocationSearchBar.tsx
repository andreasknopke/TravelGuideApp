import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocationSearch } from '../hooks';
import { SearchResult } from '../types';

interface LocationSearchBarProps {
  onSelectLocation: (result: SearchResult) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  onSelectLocation,
  placeholder,
  autoFocus = false,
}) => {
  const { t } = useTranslation();
  const {
    query,
    results,
    loading,
    error,
    setQuery,
    selectResult,
    clearSearch,
  } = useLocationSearch();

  const inputRef = useRef<TextInput>(null);
  const showDropdown = results.length > 0 || loading || (query.length > 0 && !loading && results.length === 0);

  const handleSelectResult = (result: SearchResult) => {
    selectResult(result);
    onSelectLocation(result);
    clearSearch(); // Clear the search field after selection
    Keyboard.dismiss();
  };

  const handleClearSearch = () => {
    clearSearch();
    Keyboard.dismiss();
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectResult(item)}
      testID={`search-result-${item.id}`}
    >
      <View style={styles.resultTextContainer}>
        <Text style={styles.resultPrimary}>{item.primaryName}</Text>
        {item.secondaryInfo && (
          <Text style={styles.resultSecondary}>{item.secondaryInfo}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.emptyStateText}>{t('searchingLocations')}</Text>
        </View>
      );
    }

    if (query.length > 0 && results.length === 0 && !error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('noResultsFound')}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchInputContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={placeholder || t('searchLocationPlaceholder')}
          value={query}
          onChangeText={setQuery}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          testID="location-search-input"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={handleClearSearch}
            style={styles.clearButton}
            testID="clear-search-button"
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
        {loading && (
          <ActivityIndicator
            size="small"
            color="#007AFF"
            style={styles.loadingIndicator}
          />
        )}
      </View>

      {showDropdown && (
        <View style={styles.dropdown}>
          {results.length > 0 ? (
            <>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownHeaderText}>
                  {t('selectLocation')}
                </Text>
              </View>
              <FlatList
                data={results}
                renderItem={renderResult}
                keyExtractor={(item) => item.id}
                style={styles.resultsList}
                keyboardShouldPersistTaps="handled"
                testID="search-results-list"
              />
            </>
          ) : (
            renderEmptyState()
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  dropdown: {
    backgroundColor: '#fff',
    marginTop: 8,
    borderRadius: 12,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownHeaderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  resultsList: {
    maxHeight: 350,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultTextContainer: {
    flex: 1,
  },
  resultPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultSecondary: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
  },
});

export default LocationSearchBar;

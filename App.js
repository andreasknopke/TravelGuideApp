import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import './i18n';

import HomeScreen from './HomeScreen';
import MapScreen from './MapScreen';
import DetailsScreen from './DetailsScreen';
import WebViewScreen from './WebViewScreen';
import SettingsScreen from './SettingsScreen';
import FavoritesScreen from './FavoritesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  const { t } = useTranslation();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: t('home'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          tabBarLabel: t('map'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🗺️</Text>,
        }}
      />
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesScreen}
        options={{
          tabBarLabel: t('favorites'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>❤️</Text>,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('settings'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { t } = useTranslation();

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeTabs}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Details"
            component={DetailsScreen}
            options={{
              headerTitle: t('viewDetails'),
              headerBackTitle: t('home'),
            }}
          />
          <Stack.Screen
            name="WebView"
            component={WebViewScreen}
            options={{
              headerTitle: 'Wikitravel/Wikipedia',
              headerBackTitle: t('home'),
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </>
  );
}

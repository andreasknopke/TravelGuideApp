import { NavigatorScreenParams } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';
import { Coordinates } from './index';

export type RootStackParamList = {
  Home: NavigatorScreenParams<TabParamList>;
  Details: {
    location: string;
    coordinates?: Coordinates;
  };
  WebView: {
    name: string;
  };
};

export type TabParamList = {
  HomeTab: undefined;
  MapTab: undefined;
  FavoritesTab: undefined;
  SettingsTab: undefined;
};

export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type HomeTabNavigationProp = BottomTabNavigationProp<TabParamList, 'HomeTab'>;
export type MapTabNavigationProp = BottomTabNavigationProp<TabParamList, 'MapTab'>;
export type FavoritesTabNavigationProp = BottomTabNavigationProp<TabParamList, 'FavoritesTab'>;
export type SettingsTabNavigationProp = BottomTabNavigationProp<TabParamList, 'SettingsTab'>;

export type DetailsScreenRouteProp = RouteProp<RootStackParamList, 'Details'>;
export type WebViewScreenRouteProp = RouteProp<RootStackParamList, 'WebView'>;

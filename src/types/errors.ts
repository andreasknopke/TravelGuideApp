// Error type definitions for error notification system

export enum ErrorType {
  Location = 'location',
  Network = 'network',
  Storage = 'storage',
  API = 'api',
  Permission = 'permission',
  Validation = 'validation',
  Unknown = 'unknown'
}

export enum ErrorSource {
  LocationService = 'locationService',
  AttractionsService = 'attractionsService',
  WikiService = 'wikiService',
  OpenAIService = 'openaiService',
  StorageService = 'storageService',
  FavoritesService = 'favoritesService',
  InterestsService = 'interestsService',
  UseLocation = 'useLocation',
  UseAttractions = 'useAttractions',
  UseFavorites = 'useFavorites',
  HomeScreen = 'homeScreen',
  MapScreen = 'mapScreen',
  DetailsScreen = 'detailsScreen',
  FavoritesScreen = 'favoritesScreen',
  SettingsScreen = 'settingsScreen',
  System = 'system',
  Unknown = 'unknown'
}

export enum ErrorSeverity {
  Critical = 'critical',
  Warning = 'warning',
  Info = 'info'
}

export enum RecoveryActionType {
  OpenSettings = 'openSettings',
  Retry = 'retry',
  Dismiss = 'dismiss'
}

export interface ErrorContext {
  errorType: string;
  message: string;
  stack?: string;
  serviceName: string;
  methodName: string;
  inputParams?: any;
  httpStatus?: number;
  requestUrl?: string;
}

export interface RecoveryAction {
  type: RecoveryActionType;
  labelKey: string;
  callback: () => void | Promise<void>;
  primary: boolean;
}

export interface ErrorNotification {
  id: string;
  type: ErrorType;
  source: ErrorSource;
  severity: ErrorSeverity;
  messageKey: string;
  messageParams?: Record<string, any>;
  timestamp: number;
  technicalDetails: ErrorContext;
  recoveryActions: RecoveryAction[];
}

export interface ShowErrorOptions {
  type: ErrorType;
  source: ErrorSource;
  severity: ErrorSeverity;
  messageKey: string;
  messageParams?: Record<string, any>;
  error?: Error;
  context?: Partial<ErrorContext>;
  onRetry?: () => void | Promise<void>;
  onOpenSettings?: boolean;
}

export interface ErrorSignature {
  type: ErrorType;
  source: ErrorSource;
  severity: ErrorSeverity;
}

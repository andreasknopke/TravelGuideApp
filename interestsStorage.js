import AsyncStorage from '@react-native-async-storage/async-storage';

const INTERESTS_KEY = '@travel_guide_interests';

export const saveInterests = async (interests) => {
  try {
    await AsyncStorage.setItem(INTERESTS_KEY, JSON.stringify(interests));
  } catch (error) {
    console.error('Error saving interests:', error);
  }
};

export const getInterests = async () => {
  try {
    const interests = await AsyncStorage.getItem(INTERESTS_KEY);
    return interests ? JSON.parse(interests) : [];
  } catch (error) {
    console.error('Error loading interests:', error);
    return [];
  }
};

export const AVAILABLE_INTERESTS = [
  { id: 'history', label: 'Geschichte & Historisches', icon: '🏛️' },
  { id: 'architecture', label: 'Architektur', icon: '🏰' },
  { id: 'art', label: 'Kunst & Museen', icon: '🎨' },
  { id: 'nature', label: 'Natur & Parks', icon: '🌳' },
  { id: 'religion', label: 'Religion & Kirchen', icon: '⛪' },
  { id: 'food', label: 'Essen & Kulinarik', icon: '🍽️' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'nightlife', label: 'Nachtleben & Unterhaltung', icon: '🎭' },
  { id: 'sports', label: 'Sport & Aktivitäten', icon: '⚽' },
  { id: 'culture', label: 'Kultur & Tradition', icon: '🎪' },
];

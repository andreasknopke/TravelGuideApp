import axios from 'axios';
import { OPENAI_API_KEY } from './openai-api';

// Klassifizierung von Sehenswürdigkeiten basierend auf Benutzerinteressen
export const classifyAttractionsByInterests = async (attractions, userInterests) => {
  if (!userInterests || userInterests.length === 0) {
    console.log('No user interests - skipping classification');
    return attractions;
  }

  // Prüfe ob OpenAI API Key vorhanden ist
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
    console.log('No valid OpenAI API key - skipping classification');
    return attractions;
  }

  try {
    const attractionNames = attractions.map(a => a.name).join(', ');
    const interestsText = userInterests.join(', ');
    
    console.log('Classifying attractions:', {
      attractionsCount: attractions.length,
      interests: interestsText
    });
    
    const requestData = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein Reise-Experte. Bewerte Sehenswürdigkeiten basierend auf Benutzerinteressen. Antworte NUR mit einem JSON-Array ohne Markdown-Formatierung.'
        },
        {
          role: 'user',
          content: `Benutzerinteressen: ${interestsText}\n\nSehenswürdigkeiten: ${attractionNames}\n\nBewerte jede Sehenswürdigkeit mit einem Score von 0-10, wie gut sie zu den Interessen passt. Antworte im JSON-Format: [{"name": "Name", "score": 8, "reason": "kurze Begründung"}]`
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    };

    console.log('Sending classification request to OpenAI...');
    
    const response = await axios({
      method: 'post',
      url: 'https://api.openai.com/v1/chat/completions',
      data: requestData,
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });
    
    console.log('OpenAI Response Status:', response.status);
    
    console.log('OpenAI Response Status:', response.status);
    const content = response.data.choices[0].message.content;
    console.log('OpenAI Raw Response:', content);
    
    // Entferne Markdown Code-Blöcke falls vorhanden
    let jsonText = content;
    if (content.includes('```')) {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonText = match[1].trim();
        console.log('Extracted JSON from markdown:', jsonText);
      }
    }
    
    try {
      const scores = JSON.parse(jsonText);
      console.log('Parsed scores:', scores.length, 'items');
      
      return attractions.map(attraction => {
        const scoreData = scores.find(s => s.name === attraction.name);
        return {
          ...attraction,
          interestScore: scoreData?.score || 5,
          interestReason: scoreData?.reason || ''
        };
      }).sort((a, b) => (b.interestScore || 0) - (a.interestScore || 0));
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Failed to parse:', jsonText);
      return attractions;
    }
    
  } catch (error) {
    console.error('Classification Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      code: error.code,
      config: error.config?.url
    });
    
    // Bei Network Error: Gebe unklassifizierte Attraktionen zurück
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error - möglicherweise CORS-Problem oder keine Internetverbindung');
    }
    
    return attractions;
  }
};

// Bild für Stadt von Wikitravel holen
export const getCityImage = async (cityName) => {
  try {
    console.log('Fetching city image for:', cityName);
    
    // Versuche zuerst Wikitravel mit pageimages
    const wikitravelResponse = await axios.get('https://wikitravel.org/wiki/de/api.php', {
      params: {
        action: 'query',
        format: 'json',
        titles: cityName,
        prop: 'pageimages',
        piprop: 'original',
        origin: '*'
      },
      headers: {
        'User-Agent': 'TravelGuideApp/1.0'
      },
      timeout: 8000
    });

    const pages = wikitravelResponse.data?.query?.pages;
    if (pages) {
      const pageId = Object.keys(pages)[0];
      if (pageId !== '-1' && pages[pageId].original) {
        const imageUrl = pages[pageId].original.source;
        console.log('Found Wikitravel pageimage:', imageUrl);
        return imageUrl;
      }
    }

    console.log('No Wikitravel pageimage, trying to fetch all images...');
    
    // Fallback: Hole alle Bilder von der Seite
    const imagesResponse = await axios.get('https://wikitravel.org/wiki/de/api.php', {
      params: {
        action: 'query',
        format: 'json',
        titles: cityName,
        prop: 'images',
        imlimit: 20,
        origin: '*'
      },
      headers: {
        'User-Agent': 'TravelGuideApp/1.0'
      },
      timeout: 8000
    });

    const imgPages = imagesResponse.data?.query?.pages;
    if (imgPages) {
      const pageId = Object.keys(imgPages)[0];
      if (pageId !== '-1' && imgPages[pageId].images && imgPages[pageId].images.length > 0) {
        console.log('Found images on page:', imgPages[pageId].images.map(i => i.title));
        
        // Finde das Hauptbild - bevorzuge "Rathaus", dann andere "DE_" Bilder
        const relevantImage = imgPages[pageId].images.find(img => 
          img.title.toLowerCase().includes('rathaus') &&
          !img.title.toLowerCase().includes('.svg') &&
          (img.title.toLowerCase().includes('.jpg') || 
           img.title.toLowerCase().includes('.jpeg') ||
           img.title.toLowerCase().includes('.png'))
        ) || imgPages[pageId].images.find(img => 
          (img.title.includes('Datei:DE_') || img.title.includes('File:DE_')) &&
          !img.title.toLowerCase().includes('banner') &&
          !img.title.toLowerCase().includes('ferry') &&
          !img.title.toLowerCase().includes('map') &&
          !img.title.toLowerCase().includes('dot') &&
          !img.title.toLowerCase().includes('.svg') &&
          (img.title.toLowerCase().includes('.jpg') || 
           img.title.toLowerCase().includes('.jpeg') ||
           img.title.toLowerCase().includes('.png'))
        ) || imgPages[pageId].images.find(img => 
          !img.title.toLowerCase().includes('icon') &&
          !img.title.toLowerCase().includes('wappen') &&
          !img.title.toLowerCase().includes('banner') &&
          !img.title.toLowerCase().includes('map') &&
          !img.title.toLowerCase().includes('dot') &&
          !img.title.toLowerCase().includes('.svg') &&
          (img.title.toLowerCase().includes('.jpg') || 
           img.title.toLowerCase().includes('.jpeg') ||
           img.title.toLowerCase().includes('.png'))
        );
        
        if (relevantImage) {
          console.log('Selected image:', relevantImage.title);
          
          // Extrahiere den Dateinamen (entferne "Datei:" oder "File:")
          const fileName = relevantImage.title.replace(/^(Datei|File):/, '');
          
          // Direkter Zugriff auf Shared-Archiv
          // Wikitravel verwendet: wikitravel.org/shared/Image:Dateiname
          const sharedUrl = `https://wikitravel.org/shared/Image:${fileName.replace(/ /g, '_')}`;
          console.log('Fetching shared image page:', sharedUrl);
          
          try {
            const sharedResponse = await axios.get(sharedUrl, {
              headers: {
                'User-Agent': 'TravelGuideApp/1.0'
              },
              timeout: 8000
            });
            
            const html = sharedResponse.data;
            
            // Wikitravel Shared verweist auf Wikimedia Commons
            // Suche nach upload.wikimedia.org/wikipedia/commons URL
            const commonsMatch = html.match(/(https?:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"'\s<>]+\.(?:jpg|jpeg|png|JPG|JPEG|PNG))/i);
            if (commonsMatch && commonsMatch[1]) {
              // Verwende einen Image-Proxy, der die Wikimedia-Bilder spiegelt
              // Wikimedia Thumbs sind öffentlich zugänglich (kleinere Version)
              const originalUrl = commonsMatch[1];
              
              // Extrahiere Pfad: /wikipedia/commons/f/f1/DoberanMolli01.jpg
              const pathMatch = originalUrl.match(/\/wikipedia\/commons\/(.+)$/);
              if (pathMatch) {
                // Verwende Wikimedia Thumbnail-Service (öffentlich, keine Auth nötig)
                // Format: upload.wikimedia.org/wikipedia/commons/thumb/X/XX/File.jpg/800px-File.jpg
                const path = pathMatch[1]; // z.B. "f/f1/DoberanMolli01.jpg"
                const fileName = path.split('/').pop();
                const thumbUrl = `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/800px-${fileName}`;
                console.log('Using Wikimedia thumbnail URL:', thumbUrl);
                return thumbUrl;
              }
              
              console.log('Could not create thumbnail URL, using original');
              return originalUrl;
            }
          } catch (sharedError) {
            console.log('Error fetching shared page:', sharedError.message);
          }
          
          console.log('Could not extract image URL from shared page');
        }
      }
    }
    
    console.log('No Wikitravel image found, trying Wikimedia Commons...');
    
    // Fallback: Versuche Wikipedia (statt Commons - weniger restriktiv)
    const wikipediaResponse = await axios.get('https://de.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        format: 'json',
        titles: cityName,
        prop: 'pageimages',
        piprop: 'original',
        origin: '*'
      },
      headers: {
        'User-Agent': 'TravelGuideApp/1.0'
      },
      timeout: 8000
    });

    const wikiPages = wikipediaResponse.data?.query?.pages;
    if (wikiPages) {
      const pageId = Object.keys(wikiPages)[0];
      if (pageId !== '-1' && wikiPages[pageId].original) {
        const imageUrl = wikiPages[pageId].original.source;
        console.log('Found Wikipedia image:', imageUrl);
        return imageUrl;
      }
    }
    
    console.log('No city image found');
    return null;
  } catch (error) {
    console.error('Error fetching city image:', error.message);
    return null;
  }
};

// Reverse Geocoding - GPS-Koordinaten in Ortsname umwandeln
export const reverseGeocode = async (latitude, longitude) => {
  try {
    // Verwende Nominatim API (OpenStreetMap) für Reverse Geocoding
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        'accept-language': 'de'
      },
      headers: {
        'User-Agent': 'TravelGuideApp/1.0'
      }
    });

    if (response.data) {
      const address = response.data.address;
      
      // Priorisiere Stadt/Dorf/Ort
      const cityName = address.city || 
                       address.town || 
                       address.village || 
                       address.municipality || 
                       address.county ||
                       response.data.display_name.split(',')[0];
      
      return {
        city: cityName,
        country: address.country,
        state: address.state,
        fullAddress: response.data.display_name,
        latitude: parseFloat(response.data.lat),
        longitude: parseFloat(response.data.lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error.message);
    return null;
  }
};

export const fetchWikitravelData = async (location, language = 'en') => {
  try {
    // Verwende Wikipedia API mit korrekten Headers
    const lang = language === 'de' ? 'de' : 'en';
    const baseUrl = `https://${lang}.wikipedia.org/w/api.php`;
    
    const response = await axios.get(baseUrl, {
      params: {
        action: 'query',
        format: 'json',
        prop: 'extracts|pageimages|coordinates',
        exintro: true,
        explaintext: true,
        titles: location,
        redirects: 1,
        origin: '*'
      },
      headers: {
        'User-Agent': 'TravelGuideApp/1.0'
      }
    });

    const pages = response.data.query.pages;
    const pageId = Object.keys(pages)[0];
    
    if (pageId === '-1') {
      return {
        title: location,
        extract: 'Für diesen Ort sind aktuell keine detaillierten Informationen verfügbar. Versuchen Sie es mit der AI-Beschreibung oder suchen Sie nach einem anderen Ort.',
        coordinates: null
      };
    }

    const page = pages[pageId];
    return {
      title: page.title,
      extract: page.extract || 'Keine Beschreibung verfügbar.',
      coordinates: page.coordinates ? {
        lat: page.coordinates[0].lat,
        lon: page.coordinates[0].lon
      } : null
    };
  } catch (error) {
    console.error('Error fetching Wikipedia data:', error.message);
    return {
      title: location,
      extract: `Informationen für "${location}" konnten nicht geladen werden. Dies kann an Netzwerkproblemen oder CORS-Einschränkungen liegen. Die AI-Beschreibung könnte dennoch funktionieren.`,
      coordinates: null
    };
  }
};

export const searchWikitravelLocations = async (searchTerm, language = 'en') => {
  try {
    const lang = language === 'de' ? 'de' : 'en';
    const baseUrl = `https://${lang}.wikipedia.org/w/api.php`;
    
    const response = await axios.get(baseUrl, {
      params: {
        action: 'opensearch',
        format: 'json',
        search: searchTerm,
        limit: 10,
        origin: '*'
      },
      headers: {
        'User-Agent': 'TravelGuideApp/1.0'
      }
    });

    if (response.data && response.data[1]) {
      return response.data[1].map((title, index) => ({
        title: title,
        description: response.data[2][index] || 'Keine Beschreibung',
        url: response.data[3][index]
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching Wikipedia:', error.message);
    return [];
  }
};

// LLM-Integration mit OpenAI
export const fetchLLMDescription = async (location, context = '') => {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein hilfreicher Reiseführer-Assistent. Gib detaillierte, interessante und nützliche Informationen über Orte und Sehenswürdigkeiten auf Deutsch.'
        },
        {
          role: 'user',
          content: `Erzähle mir über ${location}. Gib Informationen über Geschichte, Sehenswürdigkeiten, kulturelle Bedeutung und praktische Reisetipps. ${context}`
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error fetching LLM description:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      return `⚠️ Momentan sind zu viele API-Anfragen aktiv. Bitte versuchen Sie es in ein paar Minuten erneut.\n\nFallback-Info: ${location} ist ein interessanter Ort. Für detaillierte Informationen schauen Sie bitte in die Wikipedia-Daten oder versuchen Sie es später erneut.`;
    }
    
    if (error.response?.status === 401) {
      return `⚠️ API-Schlüssel ungültig. Bitte überprüfen Sie Ihren OpenAI API-Schlüssel.\n\nFallback-Info: Weitere Informationen finden Sie in der Wikipedia-Ansicht.`;
    }
    
    return `⚠️ Fehler beim Abrufen der AI-Beschreibung: ${error.response?.data?.error?.message || error.message}\n\nBitte nutzen Sie die Wikipedia-Informationen oder versuchen Sie es später erneut.`;
  }
};

// Funktion zum Abrufen von Sehenswürdigkeiten in der Nähe
export const getNearbyAttractions = async (latitude, longitude, radius = 5000) => {
  try {
    // Verwende Overpass API (OpenStreetMap) für echte Sehenswürdigkeiten
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    
    // Radius in Metern für die Suche
    const searchRadius = radius;
    
    // Overpass QL Query für touristische Attraktionen (optimiert)
    const query = `
      [out:json][timeout:20];
      (
        node["tourism"](around:${searchRadius},${latitude},${longitude});
        node["historic"](around:${searchRadius},${latitude},${longitude});
      );
      out center 30;
    `;

    const response = await axios.post(overpassUrl, `data=${encodeURIComponent(query)}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 20000 // 20 Sekunden Timeout
    });

    console.log('Overpass API Response:', response.data?.elements?.length, 'elements found');

    if (response.data && response.data.elements) {
      const attractions = response.data.elements
        .filter(element => element.tags && element.tags.name)
        .map((element, index) => {
          const lat = element.lat || element.center?.lat;
          const lon = element.lon || element.center?.lon;
          
          if (!lat || !lon) return null;
          
          // Berechne Entfernung
          const distance = calculateDistance(latitude, longitude, lat, lon);
          
          // Bestimme Typ
          let type = 'attraction';
          if (element.tags.tourism) type = element.tags.tourism;
          else if (element.tags.historic) type = element.tags.historic;
          else if (element.tags.amenity) type = element.tags.amenity;
          
          return {
            id: element.id || index,
            name: element.tags.name,
            latitude: lat,
            longitude: lon,
            type: type,
            distance: Math.round(distance),
            rating: 4.0 + Math.random() * 1.0, // OSM hat keine Bewertungen, generiere Platzhalter
            description: element.tags.description || element.tags['wikipedia:de'] || ''
          };
        })
        .filter(item => item !== null)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20); // Limitiere auf 20 nächste Attraktionen

      console.log('Filtered attractions:', attractions.length);

      if (attractions.length > 0) {
        return attractions;
      }
    }

    // Keine Sehenswürdigkeiten gefunden
    console.log('Keine Sehenswürdigkeiten von Overpass API gefunden');
    return [];
    
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message.includes('504') || error.message.includes('timeout')) {
      console.error('Overpass API Timeout');
    } else if (error.response?.status === 429) {
      console.error('Overpass API Rate Limit (429) - Bitte warten Sie einige Minuten.');
    } else {
      console.error('Error fetching nearby attractions:', error.message, error.response?.status);
    }
    // Bei Fehler: Leeres Array zurückgeben
    return [];
  }
};

// Hilfsfunktion zur Entfernungsberechnung (Haversine-Formel)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Erdradius in Metern
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Entfernung in Metern
}

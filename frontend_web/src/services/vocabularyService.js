// Vocabulary service using secure backend API
import { apiClient } from '../api/api';

class VocabularyService {
  constructor() {
    this.apiBaseUrl = '/api/vocabulary/definition';
    this.cache = new Map(); // Cache for API responses
  }

  // Fetch word definition from backend API
  async fetchWordDefinition(word) {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    
    // Check cache first
    if (this.cache.has(cleanWord)) {
      return this.cache.get(cleanWord);
    }

    try {
      // Use apiClient for automatic authentication
      const response = await apiClient.get(`${this.apiBaseUrl}/${cleanWord}`);
      const data = response.data; // axios uses .data not .json()
      const wordData = data[0]; // Get first entry

      // Parse the API response
      const definition = this.parseApiResponse(wordData);
      
      // Cache the result
      this.cache.set(cleanWord, definition);
      
      return definition;
    } catch (error) {
      console.error('Error fetching word definition:', error);
      return null;
    }
  }

  // Parse Dictionary API response into our format
  parseApiResponse(apiData) {
    const { word, phonetic, phonetics, meanings } = apiData;
    
    // Get pronunciation (prefer audio pronunciation)
    let pronunciation = '';
    if (phonetic) {
      pronunciation = phonetic;
    } else if (phonetics && phonetics.length > 0) {
      const audioPhonetic = phonetics.find(p => p.text);
      if (audioPhonetic) {
        pronunciation = audioPhonetic.text;
      }
    }

    // Get definition and example from first meaning
    let definition = '';
    let example = '';
    
    if (meanings && meanings.length > 0) {
      const firstMeaning = meanings[0];
      if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
        const firstDef = firstMeaning.definitions[0];
        definition = firstDef.definition;
        example = firstDef.example || '';
      }
    }

    return {
      word: word,
      definition: definition,
      pronunciation: pronunciation,
      example: example,
      partOfSpeech: meanings?.[0]?.partOfSpeech || '',
      audio: phonetics?.find(p => p.audio)?.audio || null
    };
  }


  // Get word definition (from cache or API)
  async getWordDefinition(word) {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    
    // Check cache first
    if (this.cache.has(cleanWord)) {
      return this.cache.get(cleanWord);
    }

    // Fetch from API
    return await this.fetchWordDefinition(cleanWord);
  }

  // Get cache statistics
  getCacheStats() {
    return {
      cachedWords: this.cache.size
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
const vocabularyService = new VocabularyService();

export default vocabularyService;

/**
 * Secure Storage Utilities
 * 
 * Best practices:
 * 1. NEVER store tokens/passwords in localStorage or sessionStorage
 * 2. Use HTTPOnly cookies for authentication tokens
 * 3. Use sessionStorage for temporary UI state (cleared on tab close)
 * 4. Use memory (React state/context) for sensitive data
 * 5. Encrypt sensitive data if you must store it locally
 */

// ============================================
// SESSION STORAGE (for temporary UI state)
// Better than localStorage - cleared when tab closes
// ============================================

export const sessionStore = {
  set: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("SessionStorage error:", error);
    }
  },

  get: (key) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("SessionStorage error:", error);
      return null;
    }
  },

  remove: (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error("SessionStorage error:", error);
    }
  },

  clear: () => {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error("SessionStorage error:", error);
    }
  },
};

// ============================================
// INDEXED DB (for larger data, app cache)
// Better for storing large amounts of data
// ============================================

class IndexedDBStore {
  constructor(dbName = "ReadleDB", storeName = "appData") {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async set(key, value) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(key) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async remove(key) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedStore = new IndexedDBStore();

// ============================================
// ENCRYPTED STORAGE (if you must store locally)
// Use Web Crypto API for encryption
// ============================================

class EncryptedStorage {
  constructor() {
    this.algorithm = "AES-GCM";
    this.keyLength = 256;
  }

  // Generate encryption key from user's password/pin
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async encrypt(text, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(password, salt);

    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: this.algorithm, iv },
      key,
      encoder.encode(text)
    );

    // Combine salt + iv + encrypted data
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...result));
  }

  async decrypt(encryptedData, password) {
    const data = new Uint8Array(
      atob(encryptedData)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);

    const key = await this.deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: this.algorithm, iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // Store encrypted data in localStorage
  async setEncrypted(key, value, password) {
    try {
      const encrypted = await this.encrypt(JSON.stringify(value), password);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error("Encryption error:", error);
      throw error;
    }
  }

  async getEncrypted(key, password) {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      const decrypted = await this.decrypt(encrypted, password);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Decryption error:", error);
      return null;
    }
  }
}

export const encryptedStore = new EncryptedStorage();

// ============================================
// USAGE EXAMPLES
// ============================================

/**
 * Example 1: UI State (use sessionStorage)
 * 
 * // Store temporary UI preferences
 * sessionStore.set('hasSeenJoinPrompt', true);
 * sessionStore.set('currentPage', { page: 1, filters: {...} });
 * 
 * // Retrieve
 * const hasSeenPrompt = sessionStore.get('hasSeenJoinPrompt');
 */

/**
 * Example 2: Large data / Cache (use IndexedDB)
 * 
 * // Cache book covers or content
 * await indexedStore.set('bookCovers', largeArrayOfImages);
 * await indexedStore.set('offlineBooks', booksData);
 * 
 * // Retrieve
 * const covers = await indexedStore.get('bookCovers');
 */

/**
 * Example 3: Sensitive data (use encryption IF you must store locally)
 * 
 * // IMPORTANT: Still not recommended! Use HTTPOnly cookies instead
 * // But if you absolutely must store locally:
 * 
 * const userPin = '1234'; // Get from user
 * await encryptedStore.setEncrypted('userData', sensitiveData, userPin);
 * const data = await encryptedStore.getEncrypted('userData', userPin);
 */

/**
 * Example 4: Authentication (use HTTPOnly cookies - see SecureAuthContext)
 * 
 * NEVER store JWT tokens in localStorage/sessionStorage
 * Instead, configure your backend to use HTTPOnly cookies
 */



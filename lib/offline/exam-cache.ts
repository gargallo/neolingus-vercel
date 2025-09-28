/**
 * Offline Exam Cache System
 * Neolingus Academy - Offline Support
 * 
 * Comprehensive offline support for exam sessions with local caching,
 * synchronization, and data persistence using IndexedDB and Service Workers
 */

import { 
  ExamSession, 
  ExamQuestion, 
  UserProgress, 
  Component,
  ExamResponse 
} from "@/lib/exam-engine/types";

// IndexedDB Configuration
const DB_NAME = "neolingus_offline_cache";
const DB_VERSION = 1;

// Store names
const STORES = {
  QUESTIONS: "questions",
  SESSIONS: "sessions", 
  PROGRESS: "progress",
  SYNC_QUEUE: "sync_queue",
  METADATA: "metadata",
  RESOURCES: "resources",
} as const;

// Cache configuration
export interface OfflineCacheConfig {
  maxStorageSize: number; // in MB
  maxQuestionsPerComponent: number;
  syncRetryAttempts: number;
  syncRetryDelay: number; // in ms
  cacheExpiryDays: number;
  enableCompression: boolean;
  autoSync: boolean;
  debugMode: boolean;
}

export const DEFAULT_CACHE_CONFIG: OfflineCacheConfig = {
  maxStorageSize: 50, // 50 MB
  maxQuestionsPerComponent: 500,
  syncRetryAttempts: 3,
  syncRetryDelay: 5000,
  cacheExpiryDays: 7,
  enableCompression: true,
  autoSync: true,
  debugMode: false,
};

// Cache entry types
export interface CachedQuestion extends ExamQuestion {
  cachedAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

export interface CachedSession extends ExamSession {
  cachedAt: Date;
  isSynced: boolean;
  syncAttempts: number;
  lastSyncAttempt?: Date;
  offlineId: string;
}

export interface CachedProgress extends UserProgress {
  cachedAt: Date;
  isSynced: boolean;
  version: number;
}

export interface SyncQueueItem {
  id: string;
  type: "session" | "progress" | "response";
  data: any;
  createdAt: Date;
  attempts: number;
  lastAttempt?: Date;
  priority: "high" | "medium" | "low";
  endpoint: string;
  method: "POST" | "PUT" | "PATCH";
}

export interface CacheMetadata {
  lastSync: Date;
  totalSizeBytes: number;
  questionCount: number;
  sessionCount: number;
  version: string;
  userId: string;
}

export interface OfflineResource {
  id: string;
  type: "audio" | "image" | "video" | "document";
  url: string;
  data: ArrayBuffer;
  mimeType: string;
  size: number;
  cachedAt: Date;
  expiresAt: Date;
  accessCount: number;
}

// Connection and sync status
export interface ConnectionStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface SyncStatus {
  isActive: boolean;
  pendingItems: number;
  completedItems: number;
  failedItems: number;
  lastSync: Date | null;
  nextSync: Date | null;
}

// Error types
export class OfflineError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = "OfflineError";
  }
}

/**
 * Main offline cache manager class
 */
export class ExamCacheManager {
  private db: IDBDatabase | null = null;
  private config: OfflineCacheConfig;
  private connectionStatus: ConnectionStatus;
  private syncStatus: SyncStatus;
  private syncWorker: Worker | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private compressionSupported: boolean = false;

  constructor(config: OfflineCacheConfig = DEFAULT_CACHE_CONFIG) {
    this.config = config;
    this.connectionStatus = this.getInitialConnectionStatus();
    this.syncStatus = {
      isActive: false,
      pendingItems: 0,
      completedItems: 0,
      failedItems: 0,
      lastSync: null,
      nextSync: null,
    };

    this.initializeCache();
    this.setupConnectionMonitoring();
    this.setupSyncWorker();
  }

  /**
   * Initialize the IndexedDB cache
   */
  private async initializeCache(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new OfflineError("Failed to open IndexedDB", "DB_OPEN_ERROR"));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.setupDBErrorHandling();
        this.checkCompressionSupport();
        this.emit("cache-initialized", { success: true });
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });
  }

  /**
   * Create IndexedDB object stores
   */
  private createObjectStores(db: IDBDatabase): void {
    // Questions store
    if (!db.objectStoreNames.contains(STORES.QUESTIONS)) {
      const questionsStore = db.createObjectStore(STORES.QUESTIONS, { keyPath: "id" });
      questionsStore.createIndex("component", "component", { unique: false });
      questionsStore.createIndex("difficulty", "difficulty", { unique: false });
      questionsStore.createIndex("cachedAt", "cachedAt", { unique: false });
      questionsStore.createIndex("expiresAt", "expiresAt", { unique: false });
      questionsStore.createIndex("accessCount", "accessCount", { unique: false });
    }

    // Sessions store  
    if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
      const sessionsStore = db.createObjectStore(STORES.SESSIONS, { keyPath: "offlineId" });
      sessionsStore.createIndex("id", "id", { unique: false });
      sessionsStore.createIndex("userId", "userId", { unique: false });
      sessionsStore.createIndex("courseId", "courseId", { unique: false });
      sessionsStore.createIndex("component", "component", { unique: false });
      sessionsStore.createIndex("isSynced", "isSynced", { unique: false });
      sessionsStore.createIndex("cachedAt", "cachedAt", { unique: false });
    }

    // Progress store
    if (!db.objectStoreNames.contains(STORES.PROGRESS)) {
      const progressStore = db.createObjectStore(STORES.PROGRESS, { keyPath: "id" });
      progressStore.createIndex("userId", "userId", { unique: false });
      progressStore.createIndex("courseId", "courseId", { unique: false });
      progressStore.createIndex("isSynced", "isSynced", { unique: false });
      progressStore.createIndex("version", "version", { unique: false });
    }

    // Sync queue store
    if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
      const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: "id" });
      syncStore.createIndex("type", "type", { unique: false });
      syncStore.createIndex("priority", "priority", { unique: false });
      syncStore.createIndex("createdAt", "createdAt", { unique: false });
      syncStore.createIndex("attempts", "attempts", { unique: false });
    }

    // Metadata store
    if (!db.objectStoreNames.contains(STORES.METADATA)) {
      db.createObjectStore(STORES.METADATA, { keyPath: "key" });
    }

    // Resources store  
    if (!db.objectStoreNames.contains(STORES.RESOURCES)) {
      const resourcesStore = db.createObjectStore(STORES.RESOURCES, { keyPath: "id" });
      resourcesStore.createIndex("type", "type", { unique: false });
      resourcesStore.createIndex("url", "url", { unique: true });
      resourcesStore.createIndex("cachedAt", "cachedAt", { unique: false });
      resourcesStore.createIndex("expiresAt", "expiresAt", { unique: false });
    }
  }

  /**
   * Setup database error handling
   */
  private setupDBErrorHandling(): void {
    if (!this.db) return;

    this.db.onerror = (event) => {
      this.emit("cache-error", {
        error: "Database error",
        context: event,
      });
    };

    this.db.onversionchange = () => {
      this.db?.close();
      this.emit("cache-version-change", {
        message: "Database version changed. Please refresh the page.",
      });
    };
  }

  /**
   * Check compression support
   */
  private async checkCompressionSupport(): Promise<void> {
    if (typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined") {
      this.compressionSupported = true;
    } else {
      // Fallback to other compression libraries or disable compression
      this.compressionSupported = false;
      if (this.config.debugMode) {
        console.warn("Compression not supported, disabling compression");
      }
    }
  }

  /**
   * Setup connection monitoring
   */
  private setupConnectionMonitoring(): void {
    // Online/offline events
    window.addEventListener("online", () => {
      this.updateConnectionStatus();
      this.emit("connection-change", { isOnline: true });
      if (this.config.autoSync) {
        this.startSync();
      }
    });

    window.addEventListener("offline", () => {
      this.updateConnectionStatus();
      this.emit("connection-change", { isOnline: false });
    });

    // Network information API
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener("change", () => {
        this.updateConnectionStatus();
        this.emit("connection-change", this.connectionStatus);
      });
    }

    // Initial status
    this.updateConnectionStatus();
  }

  /**
   * Setup sync worker for background synchronization
   */
  private setupSyncWorker(): void {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register sync event if supported
        if ("sync" in registration) {
          this.emit("sync-worker-ready", { registration });
        }
      });
    }
  }

  /**
   * Get initial connection status
   */
  private getInitialConnectionStatus(): ConnectionStatus {
    const connection = (navigator as any).connection;
    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type || "unknown",
      effectiveType: connection?.effectiveType || "4g",
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 100,
      saveData: connection?.saveData || false,
    };
  }

  /**
   * Update connection status
   */
  private updateConnectionStatus(): void {
    this.connectionStatus = this.getInitialConnectionStatus();
  }

  /**
   * Cache exam questions for offline access
   */
  async cacheQuestions(questions: ExamQuestion[], component: Component): Promise<void> {
    if (!this.db) throw new OfflineError("Database not initialized", "DB_NOT_INITIALIZED");

    const transaction = this.db.transaction([STORES.QUESTIONS], "readwrite");
    const store = transaction.objectStore(STORES.QUESTIONS);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (this.config.cacheExpiryDays * 24 * 60 * 60 * 1000));

    const promises = questions.map(async (question) => {
      const cachedQuestion: CachedQuestion = {
        ...question,
        cachedAt: now,
        expiresAt,
        accessCount: 0,
        lastAccessed: now,
      };

      if (this.config.enableCompression && this.compressionSupported) {
        cachedQuestion.content = await this.compressData(question.content);
      }

      return new Promise<void>((resolve, reject) => {
        const request = store.put(cachedQuestion);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    await this.updateCacheMetadata();
    
    this.emit("questions-cached", {
      count: questions.length,
      component,
      timestamp: now,
    });

    if (this.config.debugMode) {
      console.log(`Cached ${questions.length} questions for ${component}`);
    }
  }

  /**
   * Get cached questions
   */
  async getCachedQuestions(
    component: Component,
    limit?: number,
    excludeExpired: boolean = true
  ): Promise<CachedQuestion[]> {
    if (!this.db) throw new OfflineError("Database not initialized", "DB_NOT_INITIALIZED");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.QUESTIONS], "readonly");
      const store = transaction.objectStore(STORES.QUESTIONS);
      const index = store.index("component");
      const request = index.getAll(component);

      request.onsuccess = async () => {
        let questions: CachedQuestion[] = request.result;

        // Filter expired questions
        if (excludeExpired) {
          const now = new Date();
          questions = questions.filter(q => new Date(q.expiresAt) > now);
        }

        // Decompress if needed
        if (this.config.enableCompression && this.compressionSupported) {
          questions = await Promise.all(
            questions.map(async (q) => ({
              ...q,
              content: await this.decompressData(q.content),
            }))
          );
        }

        // Apply limit
        if (limit) {
          questions = questions.slice(0, limit);
        }

        // Update access count
        this.updateQuestionAccess(questions.map(q => q.id));

        resolve(questions);
      };

      request.onerror = () => {
        reject(new OfflineError("Failed to retrieve cached questions", "CACHE_READ_ERROR"));
      };
    });
  }

  /**
   * Cache exam session for offline sync
   */
  async cacheSession(session: ExamSession): Promise<string> {
    if (!this.db) throw new OfflineError("Database not initialized", "DB_NOT_INITIALIZED");

    const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cachedSession: CachedSession = {
      ...session,
      offlineId,
      cachedAt: new Date(),
      isSynced: false,
      syncAttempts: 0,
    };

    const transaction = this.db.transaction([STORES.SESSIONS], "readwrite");
    const store = transaction.objectStore(STORES.SESSIONS);

    return new Promise((resolve, reject) => {
      const request = store.put(cachedSession);
      
      request.onsuccess = () => {
        // Add to sync queue
        this.addToSyncQueue({
          id: `session_${offlineId}`,
          type: "session",
          data: cachedSession,
          createdAt: new Date(),
          attempts: 0,
          priority: "high",
          endpoint: "/api/academia/exams/sessions",
          method: "POST",
        });

        this.emit("session-cached", {
          offlineId,
          sessionId: session.id,
          timestamp: new Date(),
        });

        resolve(offlineId);
      };

      request.onerror = () => {
        reject(new OfflineError("Failed to cache session", "CACHE_WRITE_ERROR"));
      };
    });
  }

  /**
   * Get cached sessions
   */
  async getCachedSessions(userId: string, unsyncedOnly: boolean = false): Promise<CachedSession[]> {
    if (!this.db) throw new OfflineError("Database not initialized", "DB_NOT_INITIALIZED");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SESSIONS], "readonly");
      const store = transaction.objectStore(STORES.SESSIONS);
      const index = store.index("userId");
      const request = index.getAll(userId);

      request.onsuccess = () => {
        let sessions: CachedSession[] = request.result;

        if (unsyncedOnly) {
          sessions = sessions.filter(s => !s.isSynced);
        }

        resolve(sessions);
      };

      request.onerror = () => {
        reject(new OfflineError("Failed to retrieve cached sessions", "CACHE_READ_ERROR"));
      };
    });
  }

  /**
   * Cache user progress
   */
  async cacheProgress(progress: UserProgress): Promise<void> {
    if (!this.db) throw new OfflineError("Database not initialized", "DB_NOT_INITIALIZED");

    const cachedProgress: CachedProgress = {
      ...progress,
      cachedAt: new Date(),
      isSynced: false,
      version: Date.now(),
    };

    const transaction = this.db.transaction([STORES.PROGRESS], "readwrite");
    const store = transaction.objectStore(PROGRESS);

    return new Promise((resolve, reject) => {
      const request = store.put(cachedProgress);
      
      request.onsuccess = () => {
        // Add to sync queue
        this.addToSyncQueue({
          id: `progress_${progress.id}_${Date.now()}`,
          type: "progress",
          data: cachedProgress,
          createdAt: new Date(),
          attempts: 0,
          priority: "medium",
          endpoint: `/api/academia/progress/${progress.courseId}`,
          method: "PUT",
        });

        this.emit("progress-cached", {
          progressId: progress.id,
          timestamp: new Date(),
        });

        resolve();
      };

      request.onerror = () => {
        reject(new OfflineError("Failed to cache progress", "CACHE_WRITE_ERROR"));
      };
    });
  }

  /**
   * Get cached progress
   */
  async getCachedProgress(userId: string, courseId: string): Promise<CachedProgress | null> {
    if (!this.db) throw new OfflineError("Database not initialized", "DB_NOT_INITIALIZED");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.PROGRESS], "readonly");
      const store = transaction.objectStore(STORES.PROGRESS);
      const progressId = `${userId}_${courseId}`;
      const request = store.get(progressId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new OfflineError("Failed to retrieve cached progress", "CACHE_READ_ERROR"));
      };
    });
  }

  /**
   * Add item to sync queue
   */
  private async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([STORES.SYNC_QUEUE], "readwrite");
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    return new Promise((resolve, reject) => {
      const request = store.put(item);
      
      request.onsuccess = () => {
        this.updateSyncStatus();
        resolve();
      };

      request.onerror = () => {
        reject(new OfflineError("Failed to add to sync queue", "SYNC_QUEUE_ERROR"));
      };
    });
  }

  /**
   * Start synchronization process
   */
  async startSync(): Promise<void> {
    if (!this.connectionStatus.isOnline || this.syncStatus.isActive) {
      return;
    }

    this.syncStatus.isActive = true;
    this.emit("sync-started", { timestamp: new Date() });

    try {
      const pendingItems = await this.getSyncQueue();
      
      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          await this.removeFromSyncQueue(item.id);
          this.syncStatus.completedItems++;
        } catch (error) {
          await this.updateSyncItemAttempt(item);
          this.syncStatus.failedItems++;
          
          if (this.config.debugMode) {
            console.error("Sync item failed:", item.id, error);
          }
        }
      }

      this.syncStatus.lastSync = new Date();
      await this.updateCacheMetadata();
      
    } finally {
      this.syncStatus.isActive = false;
      this.emit("sync-completed", {
        completed: this.syncStatus.completedItems,
        failed: this.syncStatus.failedItems,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    const response = await fetch(item.endpoint, {
      method: item.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item.data),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
    }

    // Update local cache with synced flag
    if (item.type === "session") {
      await this.markSessionAsSynced(item.data.offlineId);
    } else if (item.type === "progress") {
      await this.markProgressAsSynced(item.data.id);
    }
  }

  /**
   * Get sync queue items
   */
  private async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC_QUEUE], "readonly");
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const index = store.index("priority");
      const request = index.getAll();

      request.onsuccess = () => {
        const items: SyncQueueItem[] = request.result;
        // Sort by priority (high first) and creation date
        items.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority];
          const bPriority = priorityOrder[b.priority];
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        resolve(items);
      };

      request.onerror = () => {
        reject(new OfflineError("Failed to get sync queue", "SYNC_QUEUE_ERROR"));
      };
    });
  }

  /**
   * Remove item from sync queue
   */
  private async removeFromSyncQueue(itemId: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([STORES.SYNC_QUEUE], "readwrite");
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    return new Promise((resolve, reject) => {
      const request = store.delete(itemId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new OfflineError("Failed to remove from sync queue", "SYNC_QUEUE_ERROR"));
    });
  }

  /**
   * Update sync item attempt count
   */
  private async updateSyncItemAttempt(item: SyncQueueItem): Promise<void> {
    if (!this.db) return;

    item.attempts++;
    item.lastAttempt = new Date();

    // Remove item if max attempts reached
    if (item.attempts >= this.config.syncRetryAttempts) {
      await this.removeFromSyncQueue(item.id);
      this.emit("sync-item-failed", { item, reason: "max_attempts_reached" });
      return;
    }

    const transaction = this.db.transaction([STORES.SYNC_QUEUE], "readwrite");
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    return new Promise((resolve, reject) => {
      const request = store.put(item);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new OfflineError("Failed to update sync item", "SYNC_QUEUE_ERROR"));
    });
  }

  /**
   * Mark session as synced
   */
  private async markSessionAsSynced(offlineId: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([STORES.SESSIONS], "readwrite");
    const store = transaction.objectStore(STORES.SESSIONS);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(offlineId);
      
      getRequest.onsuccess = () => {
        const session = getRequest.result;
        if (session) {
          session.isSynced = true;
          const putRequest = store.put(session);
          
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(); // Session not found, consider it synced
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Mark progress as synced
   */
  private async markProgressAsSynced(progressId: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([STORES.PROGRESS], "readwrite");
    const store = transaction.objectStore(STORES.PROGRESS);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(progressId);
      
      getRequest.onsuccess = () => {
        const progress = getRequest.result;
        if (progress) {
          progress.isSynced = true;
          const putRequest = store.put(progress);
          
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(); // Progress not found, consider it synced
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Update question access count
   */
  private async updateQuestionAccess(questionIds: string[]): Promise<void> {
    if (!this.db || questionIds.length === 0) return;

    const transaction = this.db.transaction([STORES.QUESTIONS], "readwrite");
    const store = transaction.objectStore(STORES.QUESTIONS);

    const promises = questionIds.map(id => new Promise<void>((resolve) => {
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const question = getRequest.result;
        if (question) {
          question.accessCount = (question.accessCount || 0) + 1;
          question.lastAccessed = new Date();
          
          const putRequest = store.put(question);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => resolve(); // Don't fail on access update errors
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => resolve(); // Don't fail on access update errors
    }));

    await Promise.all(promises);
  }

  /**
   * Update cache metadata
   */
  private async updateCacheMetadata(): Promise<void> {
    if (!this.db) return;

    const metadata: CacheMetadata = {
      lastSync: new Date(),
      totalSizeBytes: await this.calculateCacheSize(),
      questionCount: await this.getItemCount(STORES.QUESTIONS),
      sessionCount: await this.getItemCount(STORES.SESSIONS),
      version: "1.0.0",
      userId: "current_user", // Would be actual user ID
    };

    const transaction = this.db.transaction([STORES.METADATA], "readwrite");
    const store = transaction.objectStore(STORES.METADATA);

    return new Promise((resolve, reject) => {
      const request = store.put({ key: "cache_metadata", ...metadata });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new OfflineError("Failed to update metadata", "METADATA_ERROR"));
    });
  }

  /**
   * Update sync status
   */
  private async updateSyncStatus(): Promise<void> {
    if (!this.db) return;

    const pendingCount = await this.getItemCount(STORES.SYNC_QUEUE);
    this.syncStatus.pendingItems = pendingCount;
    
    this.emit("sync-status-updated", this.syncStatus);
  }

  /**
   * Get item count from store
   */
  private async getItemCount(storeName: string): Promise<number> {
    if (!this.db) return 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new OfflineError("Failed to count items", "COUNT_ERROR"));
    });
  }

  /**
   * Calculate total cache size (estimation)
   */
  private async calculateCacheSize(): Promise<number> {
    if (!this.db) return 0;

    // This is a simplified estimation
    // In a real implementation, you'd calculate actual byte sizes
    const questionCount = await this.getItemCount(STORES.QUESTIONS);
    const sessionCount = await this.getItemCount(STORES.SESSIONS);
    const resourceCount = await this.getItemCount(STORES.RESOURCES);

    const averageQuestionSize = 2048; // 2KB per question
    const averageSessionSize = 1024;  // 1KB per session
    const averageResourceSize = 51200; // 50KB per resource

    return (questionCount * averageQuestionSize) + 
           (sessionCount * averageSessionSize) + 
           (resourceCount * averageResourceSize);
  }

  /**
   * Compress data if compression is enabled and supported
   */
  private async compressData(data: any): Promise<any> {
    if (!this.config.enableCompression || !this.compressionSupported) {
      return data;
    }

    try {
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const stream = new CompressionStream("gzip");
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(encoder.encode(jsonString));
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }

      // Return compressed data with metadata
      return {
        compressed: true,
        data: Array.from(new Uint8Array(chunks.reduce((acc, chunk) => {
          const newArray = new Uint8Array(acc.length + chunk.length);
          newArray.set(acc);
          newArray.set(chunk, acc.length);
          return newArray;
        }, new Uint8Array()))),
        originalSize: jsonString.length,
      };
    } catch (error) {
      if (this.config.debugMode) {
        console.warn("Compression failed, storing uncompressed:", error);
      }
      return data;
    }
  }

  /**
   * Decompress data if it was compressed
   */
  private async decompressData(data: any): Promise<any> {
    if (!data || typeof data !== 'object' || !data.compressed) {
      return data;
    }

    if (!this.compressionSupported) {
      throw new OfflineError("Cannot decompress data: compression not supported", "COMPRESSION_ERROR");
    }

    try {
      const compressedData = new Uint8Array(data.data);
      const stream = new DecompressionStream("gzip");
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(compressedData);
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }

      const decompressed = chunks.reduce((acc, chunk) => {
        const newArray = new Uint8Array(acc.length + chunk.length);
        newArray.set(acc);
        newArray.set(chunk, acc.length);
        return newArray;
      }, new Uint8Array());

      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decompressed);
      return JSON.parse(jsonString);
    } catch (error) {
      throw new OfflineError("Failed to decompress data", "DECOMPRESSION_ERROR", { error, data });
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    if (!this.db) return;

    const now = new Date();
    const transaction = this.db.transaction([STORES.QUESTIONS, STORES.RESOURCES], "readwrite");

    // Clear expired questions
    const questionsStore = transaction.objectStore(STORES.QUESTIONS);
    const questionsIndex = questionsStore.index("expiresAt");
    const questionsRequest = questionsIndex.openCursor(IDBKeyRange.upperBound(now));

    questionsRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Clear expired resources
    const resourcesStore = transaction.objectStore(STORES.RESOURCES);
    const resourcesIndex = resourcesStore.index("expiresAt");
    const resourcesRequest = resourcesIndex.openCursor(IDBKeyRange.upperBound(now));

    resourcesRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    await new Promise<void>((resolve) => {
      transaction.oncomplete = () => {
        this.emit("cache-cleaned", { timestamp: now });
        resolve();
      };
    });
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalSize: number;
    questionCount: number;
    sessionCount: number;
    unsyncedSessionCount: number;
    resourceCount: number;
    syncQueueCount: number;
    lastSync: Date | null;
  }> {
    if (!this.db) {
      return {
        totalSize: 0,
        questionCount: 0,
        sessionCount: 0,
        unsyncedSessionCount: 0,
        resourceCount: 0,
        syncQueueCount: 0,
        lastSync: null,
      };
    }

    const questionCount = await this.getItemCount(STORES.QUESTIONS);
    const sessionCount = await this.getItemCount(STORES.SESSIONS);
    const resourceCount = await this.getItemCount(STORES.RESOURCES);
    const syncQueueCount = await this.getItemCount(STORES.SYNC_QUEUE);
    const totalSize = await this.calculateCacheSize();

    // Get unsynced session count
    const unsyncedSessions = await this.getCachedSessions("current_user", true);
    const unsyncedSessionCount = unsyncedSessions.length;

    return {
      totalSize,
      questionCount,
      sessionCount,
      unsyncedSessionCount,
      resourceCount,
      syncQueueCount,
      lastSync: this.syncStatus.lastSync,
    };
  }

  /**
   * Clear all cache data
   */
  async clearCache(): Promise<void> {
    if (!this.db) return;

    const storeNames = Object.values(STORES);
    const transaction = this.db.transaction(storeNames, "readwrite");

    const promises = storeNames.map(storeName => new Promise<void>((resolve, reject) => {
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new OfflineError(`Failed to clear ${storeName}`, "CLEAR_ERROR"));
    }));

    await Promise.all(promises);
    
    this.syncStatus = {
      isActive: false,
      pendingItems: 0,
      completedItems: 0,
      failedItems: 0,
      lastSync: null,
      nextSync: null,
    };

    this.emit("cache-cleared", { timestamp: new Date() });
  }

  /**
   * Event handling
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          if (this.config.debugMode) {
            console.error(`Error in event callback for ${event}:`, error);
          }
        }
      });
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Check if offline mode is available
   */
  isOfflineModeAvailable(): boolean {
    return this.db !== null && this.compressionSupported;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    if (this.syncWorker) {
      this.syncWorker.terminate();
      this.syncWorker = null;
    }

    this.listeners.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OfflineCacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit("config-updated", this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): OfflineCacheConfig {
    return { ...this.config };
  }
}

// Create singleton instance
export const examCache = new ExamCacheManager();
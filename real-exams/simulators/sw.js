// NEOLINGUS Simulators Service Worker
// Provides offline functionality and caching for exam simulators

const CACHE_NAME = 'neolingus-simulators-v1';
const urlsToCache = [
    // Core simulator files
    '/simulators/',
    '/simulators/index.html',
    
    // English B2 First
    '/simulators/english/b2-first/',
    '/simulators/english/b2-first/index.html',
    '/simulators/english/b2-first/styles.css',
    '/simulators/english/b2-first/script.js',
    
    // Valenciano C1 CIEACOVA
    '/simulators/valenciano/c1-cieacova/',
    '/simulators/valenciano/c1-cieacova/index.html',
    '/simulators/valenciano/c1-cieacova/estils.css',
    '/simulators/valenciano/c1-cieacova/script.js',
    
    // External dependencies
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('NEOLINGUS SW: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('NEOLINGUS SW: Caching simulator files');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('NEOLINGUS SW: Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('NEOLINGUS SW: Installation failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('NEOLINGUS SW: Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('NEOLINGUS SW: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('NEOLINGUS SW: Activation complete');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    console.log('NEOLINGUS SW: Serving from cache', event.request.url);
                    return response;
                }
                
                // Fetch from network and cache the response
                return fetch(event.request)
                    .then((response) => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone response for caching
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        console.log('NEOLINGUS SW: Fetched and cached', event.request.url);
                        return response;
                    })
                    .catch((error) => {
                        console.error('NEOLINGUS SW: Fetch failed', event.request.url, error);
                        
                        // Return offline page for HTML requests
                        if (event.request.destination === 'document') {
                            return caches.match('/simulators/offline.html');
                        }
                        
                        // Return empty response for other resources
                        return new Response('', {
                            status: 408,
                            statusText: 'Request timeout - offline'
                        });
                    });
            })
    );
});

// Background sync for saving exam progress
self.addEventListener('sync', (event) => {
    if (event.tag === 'save-exam-progress') {
        console.log('NEOLINGUS SW: Background sync - saving exam progress');
        
        event.waitUntil(
            saveExamProgressToServer()
        );
    }
});

// Push notifications for exam reminders
self.addEventListener('push', (event) => {
    console.log('NEOLINGUS SW: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'Your exam session is about to expire',
        icon: '/simulators/assets/icon-192.png',
        badge: '/simulators/assets/badge-72.png',
        tag: 'exam-reminder',
        actions: [
            {
                action: 'continue',
                title: 'Continue Exam',
                icon: '/simulators/assets/continue-icon.png'
            },
            {
                action: 'pause',
                title: 'Pause Exam',
                icon: '/simulators/assets/pause-icon.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('NEOLINGUS Exam', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('NEOLINGUS SW: Notification clicked', event.action);
    
    event.notification.close();
    
    if (event.action === 'continue') {
        event.waitUntil(
            clients.openWindow('/simulators/')
        );
    } else if (event.action === 'pause') {
        // Send message to pause exam
        event.waitUntil(
            clients.matchAll().then((clientsList) => {
                clientsList.forEach((client) => {
                    client.postMessage({
                        type: 'PAUSE_EXAM',
                        data: { reason: 'notification_click' }
                    });
                });
            })
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('NEOLINGUS SW: Message received', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_EXAM_DATA') {
        const examData = event.data.data;
        
        event.waitUntil(
            caches.open('exam-data-cache')
                .then((cache) => {
                    const response = new Response(JSON.stringify(examData));
                    return cache.put('/exam-data/' + examData.examId, response);
                })
        );
    }
});

// Helper function to save exam progress to server
async function saveExamProgressToServer() {
    try {
        // Get pending progress data from IndexedDB
        const progressData = await getProgressFromDB();
        
        if (progressData.length === 0) {
            console.log('NEOLINGUS SW: No pending progress to sync');
            return;
        }
        
        // Send to server
        const response = await fetch('/api/save-progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(progressData)
        });
        
        if (response.ok) {
            console.log('NEOLINGUS SW: Progress saved successfully');
            await clearProgressFromDB();
        } else {
            throw new Error('Server responded with error');
        }
        
    } catch (error) {
        console.error('NEOLINGUS SW: Failed to save progress', error);
        // Will retry on next sync event
    }
}

// Helper function to get progress from IndexedDB
function getProgressFromDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('NEOLINGUSExamDB', 1);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['progress'], 'readonly');
            const store = transaction.objectStore('progress');
            const getRequest = store.getAll();
            
            getRequest.onsuccess = () => {
                resolve(getRequest.result);
            };
            
            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Helper function to clear progress from IndexedDB
function clearProgressFromDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('NEOLINGUSExamDB', 1);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['progress'], 'readwrite');
            const store = transaction.objectStore('progress');
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => {
                resolve();
            };
            
            clearRequest.onerror = () => {
                reject(clearRequest.error);
            };
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Update cache with new exam content
async function updateExamCache(examType, content) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const response = new Response(JSON.stringify(content), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        await cache.put(`/simulators/data/${examType}`, response);
        console.log(`NEOLINGUS SW: Updated cache for ${examType}`);
        
    } catch (error) {
        console.error('NEOLINGUS SW: Failed to update cache', error);
    }
}

console.log('NEOLINGUS SW: Service Worker script loaded');
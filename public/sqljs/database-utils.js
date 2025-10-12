// Database initialization and utility functions

// Initialize the database
function initDatabase() {
    console.log('init db called');
    return new Promise((resolve, reject) => {
        // Check if we already have a database in IndexedDB
        const openRequest = indexedDB.open('SQLiteDB', 1);

        openRequest.onupgradeneeded = (e) => {
            const idb = e.target.result;
            if (!idb.objectStoreNames.contains('sqlite')) {
                idb.createObjectStore('sqlite');
            }
        };

        openRequest.onsuccess = (e) => {
            const idb = e.target.result;
            const transaction = idb.transaction(['sqlite'], 'readonly');
            const store = transaction.objectStore('sqlite');
            const getRequest = store.get('database');

            getRequest.onsuccess = (event) => {
                if (event.target.result) {
                    // Load the database from IndexedDB
                    initSqlJs({
                        locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/${file}`
                    }).then(SQL => {
                        resolve(new SQL.Database(event.target.result));
                    }).catch(reject);
                } else {
                    // Create a new database
                    initSqlJs({
                        locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/${file}`
                    }).then(SQL => {
                        resolve(new SQL.Database());
                    }).catch(reject);
                }
            };

            getRequest.onerror = () => {
                // Create a new database if there was an error
                initSqlJs({
                    locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/${file}`
                }).then(SQL => {
                    resolve(new SQL.Database());
                }).catch(reject);
            };
        };

        openRequest.onerror = reject;
    });
}

// Save the database to IndexedDB
function saveDatabase(db) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }

        const data = db.export();
        const openRequest = indexedDB.open('SQLiteDB', 1);

        openRequest.onsuccess = (e) => {
            const idb = e.target.result;
            const transaction = idb.transaction(['sqlite'], 'readwrite');
            const store = transaction.objectStore('sqlite');
            const putRequest = store.put(data, 'database');

            putRequest.onsuccess = () => resolve();
            putRequest.onerror = reject;
        };

        openRequest.onerror = reject;
    });
}
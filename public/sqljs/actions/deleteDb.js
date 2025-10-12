// Action for deleting and recreating the database
function deleteDb(db, initDatabase) {
    return new Promise(async (resolve, reject) => {
        try {
            // Close the current database if it exists
            if (db) {
                db.close();
                db = null;
            }

            // Clear the IndexedDB storage
            const clearRequest = indexedDB.open('SQLiteDB', 1);

            const clearDB = () => {
                return new Promise((resolve, reject) => {
                    clearRequest.onsuccess = (e) => {
                        const idb = e.target.result;
                        const transaction = idb.transaction(['sqlite'], 'readwrite');
                        const store = transaction.objectStore('sqlite');
                        const deleteRequest = store.delete('database');

                        deleteRequest.onsuccess = () => {
                            resolve();
                        };
                        deleteRequest.onerror = (e) => {
                            console.error('Error deleting database from IndexedDB:', e);
                            reject(e);
                        };
                    };
                    clearRequest.onerror = reject;
                });
            };

            await clearDB();

            // Initialize a fresh database after deletion
            await initDatabase();

            resolve({ success: true, message: 'Database cleared and recreated successfully' });
        } catch (error) {
            console.log('error', error);
            reject(new Error(`Failed to delete database: ${error.message}`));
        }
    });
}
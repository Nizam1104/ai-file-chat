// This is the worker code that will be running in a separate thread
let db;
let isInitialized = false;

// Import SQL.js
// self.importScripts('https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/sql-wasm.js');
self.importScripts('/sql-wasm.js');

// Initialize the database
function initDatabase() {
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
                        db = new SQL.Database(event.target.result);
                        isInitialized = true;
                        resolve();
                    }).catch(reject);
                } else {
                    // Create a new database
                    initSqlJs({
                        locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/${file}`
                    }).then(SQL => {
                        db = new SQL.Database();
                        isInitialized = true;
                        resolve();
                    }).catch(reject);
                }
            };

            getRequest.onerror = () => {
                // Create a new database if there was an error
                initSqlJs({
                    locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/${file}`
                }).then(SQL => {
                    db = new SQL.Database();
                    isInitialized = true;
                    resolve();
                }).catch(reject);
            };
        };

        openRequest.onerror = reject;
    });
}

// Save the database to IndexedDB
function saveDatabase() {
    return new Promise((resolve, reject) => {
        if (!isInitialized) {
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

// Handle messages from the main thread
self.onmessage = async (e) => {
    console.log('DEBUG: Worker received message:', e.data);
    const { id, command, data } = e.data;
    console.log('DEBUG: Worker processing - ID:', id, 'Command:', command, 'Data:', data);

    try {
        console.log('DEBUG: Worker initialized status:', isInitialized);
        if (!isInitialized) {
            console.log('DEBUG: Initializing database...');
            await initDatabase();
            console.log('DEBUG: Database initialized successfully');
        }

        let result;

        console.log('DEBUG: Executing command:', command);

        switch (command) {
            case 'createExcelTable':
                const tableName = data.tableName.replace(/[^a-zA-Z0-9_]/g, '_');
                const excelData = data.data;

                if (excelData.length === 0) {
                    throw new Error('No data to create table');
                }

                // Sanitize table name to prevent SQL injection
                const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');

                // Drop existing table if it exists
                try {
                    db.run(`DROP TABLE IF EXISTS "${safeTableName}"`);
                } catch (e) {
                    console.log('Table does not exist, continuing...', e.message);
                }

                // Get column names from the first row
                const columns = Object.keys(excelData[0]);
                const columnDefinitions = columns.map(col => {
                    // Sanitize column name
                    const cleanCol = col.replace(/[^a-zA-Z0-9_]/g, '_');
                    return `"${cleanCol}" TEXT`;
                }).join(', ');

                // Create table with quoted table name
                const createTableSQL = `CREATE TABLE "${safeTableName}" (${columnDefinitions})`;
                console.log('Creating table with SQL:', createTableSQL);
                db.run(createTableSQL);

                // Prepare insert statement with both table and column names properly quoted
                const sanitizedColumns = columns.map(col => `"${col.replace(/[^a-zA-Z0-9_]/g, '_')}"`);
                const columnNames = sanitizedColumns.join(', ');
                const placeholders = columns.map(() => '?').join(', ');
                const insertSQL = `INSERT INTO "${safeTableName}" (${columnNames}) VALUES (${placeholders})`;
                const insertStmt = db.prepare(insertSQL);

                // Insert data with error handling
                let insertedRows = 0;
                excelData.forEach((row, index) => {
                    try {
                        const values = columns.map(col => String(row[col] || ''));
                        insertStmt.run(values);
                        insertedRows++;
                    } catch (rowError) {
                        console.error(`Error inserting row ${index}:`, rowError);
                        throw new Error(`Failed to insert row ${index}: ${rowError.message}`);
                    }
                });

                insertStmt.free();
                await saveDatabase();

                result = {
                  success: true,
                  message: `Table ${safeTableName} created with ${insertedRows} rows`,
                  tableName: safeTableName,
                  columns: columns
                };
                break;

            case 'getTableData':
                console.log('DEBUG: getTableData - Processing request');
                console.log('DEBUG: getTableData - Raw tableName:', data.tableName);

                if (!data || !data.tableName) {
                    throw new Error('Table name is required for getTableData');
                }

                const requestedTableName = data.tableName.replace(/[^a-zA-Z0-9_]/g, '_');
                const safeRequestedTableName = requestedTableName.replace(/[^a-zA-Z0-9_]/g, '_');
                const limit = data.limit || 10;
                const offset = data.offset || 0;

                console.log('DEBUG: getTableData - Safe tableName:', safeRequestedTableName, 'Limit:', limit, 'Offset:', offset);

                try {
                    console.log('DEBUG: getTableData - Preparing query');
                    const tableData = [];
                    const tableStmt = db.prepare(`SELECT * FROM "${safeRequestedTableName}" LIMIT ? OFFSET ?`);
                    tableStmt.bind([limit, offset]);
                    console.log('DEBUG: getTableData - Query prepared and bound');

                    while (tableStmt.step()) {
                        const row = tableStmt.getAsObject();
                        tableData.push(row);
                    }
                    tableStmt.free();

                    console.log('DEBUG: getTableData - Query executed, rows returned:', tableData.length);
                    result = { success: true, data: tableData, tableName: safeRequestedTableName };
                } catch (e) {
                    console.error('DEBUG: getTableData - Query failed:', e);
                    throw new Error(`Table ${safeRequestedTableName} does not exist or query failed: ${e.message}`);
                }
                break;

            case 'getTableList':
                console.log('DEBUG: getTableList - Processing request');
                try {
                    console.log('DEBUG: getTableList - Preparing query');
                    const tableListStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table'");
                    const tables = [];
                    while (tableListStmt.step()) {
                        tables.push(tableListStmt.getAsObject().name);
                    }
                    tableListStmt.free();
                    console.log('DEBUG: getTableList - Found tables:', tables);
                    result = { success: true, tables };
                } catch (e) {
                    console.error('DEBUG: getTableList - Query failed:', e);
                    throw new Error(`Failed to get table list: ${e.message}`);
                }
                break;
              case 'deleteDb':
                try {
                    // Close the current database if it exists
                    if (db) {
                        db.close();
                        db = null;
                    }
                    isInitialized = false;

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

                    result = { success: true, message: 'Database cleared and recreated successfully' };
                    break;
                } catch(error) {
                  console.log('error', error)
                    throw new Error(`Failed to delete database: ${error.message}`);
                }

            case 'executeQuery':
                const query = data.query;

                try {
                    // Execute the query
                    const stmt = db.prepare(query);
                    const results = [];

                    while (stmt.step()) {
                        const row = stmt.getAsObject();
                        results.push(row);
                    }

                    stmt.free();

                    result = {
                        success: true,
                        data: results,
                        count: results.length
                    };
                } catch (e) {
                    throw new Error(`Query execution failed: ${e.message}`);
                }
                break;

            default:
                console.error('DEBUG: Unknown command received:', command);
                throw new Error('Unknown command: ' + command);
        }

        console.log('DEBUG: Command completed successfully - ID:', id, 'Command:', command);
        self.postMessage({ id, success: true, result });
    } catch (error) {
        console.error('DEBUG: Command failed - ID:', id, 'Command:', command, 'Error:', error);
        self.postMessage({ id, success: false, error: error.message });
    }
};

// // This is the worker code that will be running in a separate thread
// let db;
// let isInitialized = false;
// let initPromise = null;

// // Import SQL.js
// self.importScripts('/sql-wasm.js');

// // Initialize the database with proper locking and error handling
// function initDatabase() {
//     // If already initializing, return the existing promise
//     if (initPromise) {
//         console.log('DEBUG: Initialization already in progress, reusing promise');
//         return initPromise;
//     }
    
//     // If already initialized, return resolved promise
//     if (isInitialized) {
//         console.log('DEBUG: Database already initialized');
//         return Promise.resolve();
//     }

//     console.log('DEBUG: Starting new initialization');
//     initPromise = new Promise((resolve, reject) => {
//         const openRequest = indexedDB.open('SQLiteDB', 1);

//         openRequest.onupgradeneeded = (e) => {
//             console.log('DEBUG: IndexedDB upgrade needed');
//             const idb = e.target.result;
//             if (!idb.objectStoreNames.contains('sqlite')) {
//                 idb.createObjectStore('sqlite');
//             }
//         };

//         openRequest.onsuccess = (e) => {
//             console.log('DEBUG: IndexedDB opened successfully');
//             const idb = e.target.result;
            
//             try {
//                 const transaction = idb.transaction(['sqlite'], 'readonly');
//                 const store = transaction.objectStore('sqlite');
//                 const getRequest = store.get('database');

//                 getRequest.onsuccess = (event) => {
//                     console.log('DEBUG: Get request successful, has data:', !!event.target.result);
                    
//                     const initSQL = () => {
//                         initSqlJs({
//                             locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/${file}`
//                         }).then(SQL => {
//                             if (event.target.result) {
//                                 console.log('DEBUG: Loading existing database from IndexedDB');
//                                 db = new SQL.Database(event.target.result);
//                             } else {
//                                 console.log('DEBUG: Creating new database');
//                                 db = new SQL.Database();
//                             }
//                             isInitialized = true;
//                             initPromise = null;
//                             console.log('DEBUG: Database initialization complete');
                            
//                             // Close IndexedDB connection
//                             idb.close();
//                             resolve();
//                         }).catch(err => {
//                             console.error('DEBUG: SQL.js initialization failed:', err);
//                             initPromise = null;
//                             idb.close();
//                             reject(err);
//                         });
//                     };

//                     initSQL();
//                 };

//                 getRequest.onerror = (err) => {
//                     console.error('DEBUG: Get request failed:', err);
//                     // Try to create new database anyway
//                     initSqlJs({
//                         locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/${file}`
//                     }).then(SQL => {
//                         db = new SQL.Database();
//                         isInitialized = true;
//                         initPromise = null;
//                         console.log('DEBUG: New database created after get error');
//                         idb.close();
//                         resolve();
//                     }).catch(err => {
//                         initPromise = null;
//                         idb.close();
//                         reject(err);
//                     });
//                 };

//                 transaction.onerror = (err) => {
//                     console.error('DEBUG: Transaction error:', err);
//                     initPromise = null;
//                     idb.close();
//                     reject(err);
//                 };

//             } catch (err) {
//                 console.error('DEBUG: Error creating transaction:', err);
//                 initPromise = null;
//                 idb.close();
//                 reject(err);
//             }
//         };

//         openRequest.onerror = (err) => {
//             console.error('DEBUG: IndexedDB open failed:', err);
//             initPromise = null;
//             reject(err);
//         };

//         openRequest.onblocked = (e) => {
//             console.warn('DEBUG: IndexedDB open blocked:', e);
//         };
//     });

//     return initPromise;
// }

// // Save the database to IndexedDB
// function saveDatabase() {
//     return new Promise((resolve, reject) => {
//         if (!isInitialized) {
//             reject(new Error('Database not initialized'));
//             return;
//         }

//         try {
//             const data = db.export();
//             const openRequest = indexedDB.open('SQLiteDB', 1);

//             openRequest.onsuccess = (e) => {
//                 const idb = e.target.result;
                
//                 try {
//                     const transaction = idb.transaction(['sqlite'], 'readwrite');
//                     const store = transaction.objectStore('sqlite');
//                     const putRequest = store.put(data, 'database');

//                     putRequest.onsuccess = () => {
//                         console.log('DEBUG: Database saved to IndexedDB');
//                         idb.close();
//                         resolve();
//                     };

//                     putRequest.onerror = (err) => {
//                         console.error('DEBUG: Put request failed:', err);
//                         idb.close();
//                         reject(err);
//                     };

//                     transaction.onerror = (err) => {
//                         console.error('DEBUG: Save transaction error:', err);
//                         idb.close();
//                         reject(err);
//                     };
//                 } catch (err) {
//                     console.error('DEBUG: Error in save transaction:', err);
//                     idb.close();
//                     reject(err);
//                 }
//             };

//             openRequest.onerror = (err) => {
//                 console.error('DEBUG: IndexedDB open failed during save:', err);
//                 reject(err);
//             };
//         } catch (err) {
//             console.error('DEBUG: Error exporting database:', err);
//             reject(err);
//         }
//     });
// }

// // Handle messages from the main thread
// self.onmessage = async (e) => {
//     const { id, command, data } = e.data;
//     console.log('DEBUG: Worker received message - ID:', id, 'Command:', command);

//     try {
//         // Ensure database is initialized
//         if (!isInitialized) {
//             console.log('DEBUG: Waiting for database initialization...');
//             await initDatabase();
//             console.log('DEBUG: Database ready');
//         }

//         let result;

//         switch (command) {
//             case 'createExcelTable':
//                 const tableName = data.tableName.replace(/[^a-zA-Z0-9_]/g, '_');
//                 const excelData = data.data;

//                 if (excelData.length === 0) {
//                     throw new Error('No data to create table');
//                 }

//                 const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');

//                 try {
//                     db.run(`DROP TABLE IF EXISTS "${safeTableName}"`);
//                 } catch (e) {
//                     console.log('Table does not exist, continuing...');
//                 }

//                 const columns = Object.keys(excelData[0]);
//                 const columnDefinitions = columns.map(col => {
//                     const cleanCol = col.replace(/[^a-zA-Z0-9_]/g, '_');
//                     return `"${cleanCol}" TEXT`;
//                 }).join(', ');

//                 const createTableSQL = `CREATE TABLE "${safeTableName}" (${columnDefinitions})`;
//                 console.log('Creating table:', safeTableName);
//                 db.run(createTableSQL);

//                 const sanitizedColumns = columns.map(col => `"${col.replace(/[^a-zA-Z0-9_]/g, '_')}"`);
//                 const columnNames = sanitizedColumns.join(', ');
//                 const placeholders = columns.map(() => '?').join(', ');
//                 const insertSQL = `INSERT INTO "${safeTableName}" (${columnNames}) VALUES (${placeholders})`;
//                 const insertStmt = db.prepare(insertSQL);

//                 let insertedRows = 0;
//                 excelData.forEach((row, index) => {
//                     try {
//                         const values = columns.map(col => String(row[col] || ''));
//                         insertStmt.run(values);
//                         insertedRows++;
//                     } catch (rowError) {
//                         console.error(`Error inserting row ${index}:`, rowError);
//                         throw new Error(`Failed to insert row ${index}: ${rowError.message}`);
//                     }
//                 });

//                 insertStmt.free();
//                 await saveDatabase();

//                 result = {
//                     success: true,
//                     message: `Table ${safeTableName} created with ${insertedRows} rows`,
//                     tableName: safeTableName,
//                     columns: columns
//                 };
//                 break;

//             case 'getTableData':
//                 console.log('DEBUG: getTableData - tableName:', data?.tableName);

//                 if (!data || !data.tableName) {
//                     throw new Error('Table name is required for getTableData');
//                 }

//                 const requestedTableName = data.tableName.replace(/[^a-zA-Z0-9_]/g, '_');
//                 const limit = data.limit || 10;
//                 const offset = data.offset || 0;

//                 console.log('DEBUG: Querying table:', requestedTableName, 'limit:', limit, 'offset:', offset);

//                 const tableData = [];
//                 const tableStmt = db.prepare(`SELECT * FROM "${requestedTableName}" LIMIT ? OFFSET ?`);
//                 tableStmt.bind([limit, offset]);

//                 while (tableStmt.step()) {
//                     const row = tableStmt.getAsObject();
//                     tableData.push(row);
//                 }
//                 tableStmt.free();

//                 console.log('DEBUG: Query returned', tableData.length, 'rows');
//                 result = { success: true, data: tableData, tableName: requestedTableName };
//                 break;

//             case 'getTableList':
//                 console.log('DEBUG: getTableList - Getting list of tables');
//                 const tableListStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table'");
//                 const tables = [];
                
//                 while (tableListStmt.step()) {
//                     tables.push(tableListStmt.getAsObject().name);
//                 }
//                 tableListStmt.free();
                
//                 console.log('DEBUG: Found tables:', tables);
//                 result = { success: true, tables };
//                 break;

//             case 'deleteDb':
//                 console.log('DEBUG: Deleting database');
                
//                 if (db) {
//                     db.close();
//                     db = null;
//                 }
//                 isInitialized = false;
//                 initPromise = null;

//                 await new Promise((resolve, reject) => {
//                     const openRequest = indexedDB.open('SQLiteDB', 1);

//                     openRequest.onsuccess = (e) => {
//                         const idb = e.target.result;
//                         const transaction = idb.transaction(['sqlite'], 'readwrite');
//                         const store = transaction.objectStore('sqlite');
//                         const deleteRequest = store.delete('database');

//                         deleteRequest.onsuccess = () => {
//                             console.log('DEBUG: Database deleted from IndexedDB');
//                             idb.close();
//                             resolve();
//                         };

//                         deleteRequest.onerror = (err) => {
//                             console.error('DEBUG: Delete failed:', err);
//                             idb.close();
//                             reject(err);
//                         };
//                     };

//                     openRequest.onerror = reject;
//                 });

//                 await initDatabase();
//                 result = { success: true, message: 'Database cleared and recreated successfully' };
//                 break;

//             case 'executeQuery':
//                 const query = data.query;
//                 console.log('DEBUG: Executing query:', query);

//                 if (!query.trim().toLowerCase().startsWith('select')) {
//                     throw new Error('Only SELECT queries are allowed');
//                 }

//                 const stmt = db.prepare(query);
//                 const results = [];

//                 while (stmt.step()) {
//                     const row = stmt.getAsObject();
//                     results.push(row);
//                 }
//                 stmt.free();

//                 result = {
//                     success: true,
//                     data: results,
//                     count: results.length
//                 };
//                 break;

//             default:
//                 throw new Error('Unknown command: ' + command);
//         }

//         console.log('DEBUG: Command completed - ID:', id);
//         self.postMessage({ id, success: true, result });
        
//     } catch (error) {
//         console.error('DEBUG: Command failed - ID:', id, 'Error:', error.message);
//         self.postMessage({ id, success: false, error: error.message });
//     }
// };

// // Global error handlers
// self.onerror = (error) => {
//     console.error('DEBUG: Worker global error:', error);
// };

// self.onunhandledrejection = (event) => {
//     console.error('DEBUG: Worker unhandled rejection:', event.reason);
// };

// console.log('DEBUG: Worker script loaded and ready');
// This is the worker code that will be running in a separate thread
let db;
let isInitialized = false;
let isInitializing = false;

// Import SQL.js
// self.importScripts('https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/sql-wasm.js');
self.importScripts('/sql-wasm.js');

// Initialize the database
function initDatabase() {
    console.log('init db called')
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
                        resolve();
                    }).catch(reject);
                } else {
                    // Create a new database
                    initSqlJs({
                        locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/${file}`
                    }).then(SQL => {
                        db = new SQL.Database();
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
    const { id, command, data } = e.data;

    try {
        // Wait for initialization if it's already in progress
        if (!isInitialized) {
            if (isInitializing) {
                // If already initializing, wait for it to complete
                while (isInitializing) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            } else {
                // Start initialization if not already done
                console.log('Starting database initialization');
                isInitializing = true;
                try {
                    await initDatabase();
                    isInitialized = true;
                    console.log('Database initialization completed');
                } catch (error) {
                    console.error('Database initialization failed:', error);
                    throw error;
                } finally {
                    isInitializing = false;
                }
            }
        }

        let result;

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

                if (!data || !data.tableName) {
                    throw new Error('Table name is required for getTableData');
                }

                const requestedTableName = data.tableName.replace(/[^a-zA-Z0-9_]/g, '_');
                const safeRequestedTableName = requestedTableName.replace(/[^a-zA-Z0-9_]/g, '_');
                const limit = data.limit || 10;
                const offset = data.offset || 0;


                try {
                    const tableData = [];
                    const tableStmt = db.prepare(`SELECT * FROM "${safeRequestedTableName}" LIMIT ? OFFSET ?`);
                    tableStmt.bind([limit, offset]);

                    while (tableStmt.step()) {
                        const row = tableStmt.getAsObject();
                        tableData.push(row);
                    }
                    tableStmt.free();

                    result = { success: true, data: tableData, tableName: safeRequestedTableName };
                } catch (e) {
                    throw new Error(`Table ${safeRequestedTableName} does not exist or query failed: ${e.message}`);
                }
                break;

            case 'getTableList':
                try {
                    const tableListStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table'");
                    const tables = [];
                    while (tableListStmt.step()) {
                        tables.push(tableListStmt.getAsObject().name);
                    }
                    tableListStmt.free();
                    result = { success: true, tables };
                } catch (e) {
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
                throw new Error('Unknown command: ' + command);
        }

        self.postMessage({ id, success: true, result });
    } catch (error) {
        self.postMessage({ id, success: false, error: error.message });
    }
};

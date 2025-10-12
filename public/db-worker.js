// This is the worker code that will be running in a separate thread
let db;
let isInitialized = false;
let isInitializing = false;

// Import modules
importScripts('/sql-wasm.js');
importScripts('/sqljs/database-utils.js');
importScripts('/sqljs/actions/createExcelTable.js');
importScripts('/sqljs/actions/getTableData.js');
importScripts('/sqljs/actions/getTableList.js');
importScripts('/sqljs/actions/deleteDb.js');
importScripts('/sqljs/actions/executeQuery.js');


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
                    db = await initDatabase();
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

        // Route commands to appropriate action modules
        switch (command) {
            case 'createExcelTable':
                result = await createExcelTable(db, data, () => saveDatabase(db));
                break;

            case 'getTableData':
                result = await getTableData(db, data);
                break;

            case 'getTableList':
                result = await getTableList(db);
                break;

            case 'deleteDb':
                isInitialized = false;
                result = await deleteDb(db, initDatabase);
                db = await initDatabase(); // Reinitialize after deletion
                isInitialized = true;
                break;

            case 'executeQuery':
                result = await executeQuery(db, data);
                break;

            default:
                throw new Error('Unknown command: ' + command);
        }

        self.postMessage({ id, success: true, result });
    } catch (error) {
        self.postMessage({ id, success: false, error: error.message });
    }
};

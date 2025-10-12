// This is the worker code that will be running in a separate thread
let db;
let initPromise;

// Import modules
importScripts('/sql-wasm.js');
importScripts('/sqljs/database-utils.js');
importScripts('/sqljs/actions/createExcelTable.js');
importScripts('/sqljs/actions/getTableData.js');
importScripts('/sqljs/actions/getTableList.js');
importScripts('/sqljs/actions/deleteDb.js');
importScripts('/sqljs/actions/executeQuery.js');
importScripts('/sqljs/actions/getFirstNRows.js');

// Initialize database once
async function getDatabase() {
    if (!initPromise) {
        initPromise = initDatabase().then(database => {
            db = database;
            return db;
        });
    }
    return initPromise;
}

// Handle messages from the main thread
self.onmessage = async (e) => {
    const { id, command, data } = e.data;

    try {
        const database = await getDatabase();
        let result;

        // Route commands to appropriate action modules
        switch (command) {
            case 'createExcelTable':
                result = await createExcelTable(database, data, () => saveDatabase(database));
                break;

            case 'getTableData':
                result = await getTableData(database, data);
                break;

            case 'getTableList':
                result = await getTableList(database);
                break;

            case 'deleteDb':
                initPromise = null; // Reset init promise
                result = await deleteDb(database, initDatabase);
                db = await initDatabase(); // Reinitialize after deletion
                break;

            case 'executeQuery':
                result = await executeQuery(database, data);
                break;

            case 'getFirstNRows':
                result = await getFirstNRows(database, data);
                break;

            default:
                throw new Error('Unknown command: ' + command);
        }

        self.postMessage({ id, success: true, result });
    } catch (error) {
        self.postMessage({ id, success: false, error: error.message });
    }
};

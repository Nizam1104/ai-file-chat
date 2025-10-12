// Action for getting list of tables
function getTableList(db) {
    return new Promise((resolve, reject) => {
        try {
            const tableListStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table'");
            const tables = [];
            while (tableListStmt.step()) {
                tables.push(tableListStmt.getAsObject().name);
            }
            tableListStmt.free();
            resolve({ success: true, tables });
        } catch (e) {
            reject(new Error(`Failed to get table list: ${e.message}`));
        }
    });
}
// Action for getting table data
function getTableData(db, data) {
    return new Promise((resolve, reject) => {
        try {
            if (!data || !data.tableName) {
                throw new Error('Table name is required for getTableData');
            }

            const requestedTableName = data.tableName.replace(/[^a-zA-Z0-9_]/g, '_');
            const safeRequestedTableName = requestedTableName.replace(/[^a-zA-Z0-9_]/g, '_');
            const limit = data.limit || 10;
            const offset = data.offset || 0;

            const tableData = [];
            const tableStmt = db.prepare(`SELECT * FROM "${safeRequestedTableName}" LIMIT ? OFFSET ?`);
            tableStmt.bind([limit, offset]);

            while (tableStmt.step()) {
                const row = tableStmt.getAsObject();
                tableData.push(row);
            }
            tableStmt.free();

            resolve({ success: true, data: tableData, tableName: safeRequestedTableName });
        } catch (e) {
            reject(new Error(`Table ${data?.tableName?.replace(/[^a-zA-Z0-9_]/g, '_')} does not exist or query failed: ${e.message}`));
        }
    });
}
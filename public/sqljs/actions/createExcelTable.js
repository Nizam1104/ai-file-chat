// Action for creating Excel tables
function createExcelTable(db, data, saveDatabase) {
    return new Promise(async (resolve, reject) => {
        try {
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

            resolve({
                success: true,
                message: `Table ${safeTableName} created with ${insertedRows} rows`,
                tableName: safeTableName,
                columns: columns
            });
        } catch (error) {
            reject(error);
        }
    });
}
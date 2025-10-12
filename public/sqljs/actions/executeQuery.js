// Action for executing custom SQL queries
function executeQuery(db, data) {
    return new Promise((resolve, reject) => {
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

            resolve({
                success: true,
                data: results,
                count: results.length
            });
        } catch (e) {
            reject(new Error(`Query execution failed: ${e.message}`));
        }
    });
}
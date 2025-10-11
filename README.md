# AI File Analysis System

This application allows users to upload Excel files and ask natural language questions about their data. The system uses AI to generate SQL queries and execute them on the uploaded data.

## Features

1. **Excel File Upload**: Upload Excel (.xlsx, .xls) files to create a searchable database
2. **Natural Language Queries**: Ask questions about your data in plain English
3. **AI-Powered SQL Generation**: Uses Google Gemini 2.5 Flash to generate SQL queries from natural language
4. **Instant Results**: View query results in a formatted table with the generated SQL
5. **Persistent Database**: Database tables persist across browser sessions

## Getting Started

First, set up your environment variables:

```bash
# Create a .env file and add your Google Gemini API key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How It Works

1. **Upload Excel File**: Use the file upload area to select an Excel file
2. **Create Database**: Click "Create Database" to convert the Excel data into a searchable SQL database
3. **Ask Questions**: Once the database is created, type questions like:
   - "Show me all records where amount is greater than 1000"
   - "Find the top 5 most expensive items"
   - "Show me records from last month"
   - "What are the unique categories in the data?"
4. **Get Results**: The AI generates an SQL query, executes it, and displays the results

## Technical Architecture

### Frontend Components
- **ChatInput**: Main component for file upload and user queries
- **useDatabase**: Custom hook for database operations using Web Workers
- **Query Results Display**: Shows formatted tables with generated SQL

### Backend APIs
- **`/api/ai-sql`**: Generates SQL queries using Google Gemini AI
- **`/api/execute-db-query`**: Executes SQL queries on the persistent database

### Database System
- Uses SQL.js with Web Workers for client-side SQL execution
- IndexedDB for persistent storage across browser sessions
- In-memory database creation from Excel files

## Dependencies

Key packages used:
- `@google/generative-ai`: Google Gemini AI SDK
- `xlsx`: Excel file parsing
- `sql.js`: SQL database engine
- Excel data is automatically converted to SQL tables

## Usage Example

1. Upload an Excel file with sales data
2. Create the database (shows table info and row count)
3. Ask: "Show me sales greater than $5000"
4. AI generates: `SELECT * FROM sales WHERE amount > 5000`
5. Results display in a formatted table

The system intelligently handles different data types, understands complex queries, and provides instant feedback on query processing.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

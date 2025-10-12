import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { message, tableSchema } = await request.json();

    if (!message || !tableSchema) {
      return NextResponse.json(
        { error: 'Message and table schema are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Gemini API key not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `You are an SQLite query generator. Generate a JSON response with the SQL query.

Table Schema:
${JSON.stringify(tableSchema, null, 2)}

Rules:
- Generate proper SQLite queries that works
- Generate ONLY standard SQL SELECT queries
- Use appropriate WHERE clauses for filtering
- Use ORDER BY when sorting is needed
- Use LIMIT when the user asks for a specific number of results
- Always return valid SQL syntax
- Do not generate DROP, DELETE, UPDATE, INSERT, or any modifying queries
- If the request is unclear, generate a query that returns the most relevant data

CRITICAL: Your response must be valid JSON in the format: {"query": "SQL_QUERY_HERE"}

User Message: "${message}"

Example correct response: {"query": "SELECT * FROM users WHERE email_verified = true"}

Example INCORRECT response (do not do this): \`\`\`sql
SELECT * FROM users
\`\`\`

Example INCORRECT response (do not do this): SELECT * FROM users WHERE email_verified = true

Respond with ONLY the JSON object starting with { and ending with }`;

    const result = await model.generateContent(systemPrompt);
    let responseText = result.response.text().trim();

    // Remove markdown code blocks if present
    if (responseText.startsWith('```')) {
      const firstNewline = responseText.indexOf('\n');
      if (firstNewline !== -1) {
        responseText = responseText.slice(firstNewline + 1);
      } else {
        responseText = responseText.replace(/^```[\w]*\s*/, '');
      }
    }

    if (responseText.endsWith('```')) {
      responseText = responseText.slice(0, responseText.length - 3);
    }

    responseText = responseText.trim();

    try {
      // Parse JSON response
      const jsonResponse = JSON.parse(responseText);
      const sqlQuery = jsonResponse.query;

      if (!sqlQuery) {
        return NextResponse.json(
          { error: 'No query found in AI response' },
          { status: 400 }
        );
      }

      // Validate that it's a SELECT query
      if (!sqlQuery.toLowerCase().startsWith('select')) {
        return NextResponse.json(
          { error: 'Generated query is not a valid SELECT query' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        sqlQuery,
        success: true
      });
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON response from AI' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating SQL query:', error);
    return NextResponse.json(
      { error: 'Failed to generate SQL query' },
      { status: 500 }
    );
  }
}

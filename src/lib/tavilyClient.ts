export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilyResponse {
  results: TavilySearchResult[];
}

export const searchTavily = async (query: string): Promise<string> => {
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Tavily search failed: ${response.statusText}`);
    }

    const data: TavilyResponse = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return '';
    }

    const context = data.results
      .map((res, i) => `[Source ${i + 1}: ${res.title}] (${res.url})\n${res.content}`)
      .join('\n\n');

    return `\n\n--- RÉSULTATS DE RECHERCHE WEB TAVILY ---\n${context}\n----------------------------------------\n`;
  } catch (error) {
    console.error('Tavily Search Error:', error);
    return '';
  }
};

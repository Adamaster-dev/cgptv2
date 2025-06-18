// LLM service for natural-language preference processing and explanation breakdowns
import axios from 'axios';
import { config, validateEnvironment } from '../config/environment';
import { indexService } from './indexService';

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4';
const MAX_TOKENS = 1500;
const TEMPERATURE = 0.7;

// Cache for recent queries to avoid duplicate API calls
const queryCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Validate environment and API key
 */
function checkEnvironment() {
  if (!validateEnvironment()) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your environment variables.');
  }
}

/**
 * Create system prompt for the LLM
 */
function createSystemPrompt(year, weightingScheme) {
  return `You are an expert expatriation advisor with deep knowledge of global climate risks, economic conditions, and quality of living factors. You help people find ideal locations based on their preferences.

CONTEXT:
- Current analysis year: ${year}
- Weighting scheme: ${weightingScheme}
- Available criteria: floods, cyclones, extreme heat, wildfires, water scarcity, GDP per capita, food security
- Scores are normalized 0-100 (higher = better quality of living)

INSTRUCTIONS:
1. Analyze the user's preferences and match them to available countries
2. Consider both explicit preferences (e.g., "warm climate") and implicit needs (e.g., safety, stability)
3. Provide 3-5 country recommendations ranked by suitability
4. Explain your reasoning clearly and mention specific criteria scores when relevant
5. Include both strengths and potential considerations for each recommendation
6. Be honest about limitations and uncertainties in the data

RESPONSE FORMAT:
Provide a JSON response with this structure:
{
  "summary": "Brief overview of the analysis",
  "recommendations": [
    {
      "country": "Country Name",
      "countryCode": "ISO3",
      "score": 85.2,
      "rank": 1,
      "matchPercentage": 92,
      "reasoning": "Why this country matches the preferences",
      "strengths": ["strength1", "strength2"],
      "considerations": ["consideration1", "consideration2"]
    }
  ],
  "explanation": "Detailed explanation of the analysis approach",
  "methodology": "How the recommendations were determined"
}

Be conversational but informative. Focus on practical insights that help decision-making.`;
}

/**
 * Create user prompt with preferences and available data
 */
function createUserPrompt(query, availableCountries, indexData) {
  const countryList = availableCountries.slice(0, 20).map(country => {
    const data = indexData[country];
    if (!data) return null;
    
    return {
      country,
      score: data.compositeScore,
      rank: data.ranking?.rank,
      components: Object.entries(data.componentScores || {}).reduce((acc, [key, value]) => {
        acc[key] = value.score;
        return acc;
      }, {})
    };
  }).filter(Boolean);

  return `USER QUERY: "${query}"

AVAILABLE COUNTRY DATA (top 20 by overall score):
${JSON.stringify(countryList, null, 2)}

Please analyze this query and provide recommendations based on the available data. Consider the user's stated preferences and suggest countries that best match their needs.`;
}

/**
 * Parse LLM response and validate structure
 */
function parseLLMResponse(responseText) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      throw new Error('Invalid response structure: missing recommendations array');
    }
    
    // Ensure each recommendation has required fields
    parsed.recommendations = parsed.recommendations.map(rec => ({
      country: rec.country || 'Unknown',
      countryCode: rec.countryCode || null,
      score: typeof rec.score === 'number' ? rec.score : null,
      rank: typeof rec.rank === 'number' ? rec.rank : null,
      matchPercentage: typeof rec.matchPercentage === 'number' ? rec.matchPercentage : 85,
      reasoning: rec.reasoning || 'No reasoning provided',
      strengths: Array.isArray(rec.strengths) ? rec.strengths : [],
      considerations: Array.isArray(rec.considerations) ? rec.considerations : []
    }));
    
    return {
      summary: parsed.summary || 'Analysis completed',
      recommendations: parsed.recommendations,
      explanation: parsed.explanation || 'Recommendations based on available data',
      methodology: parsed.methodology || 'Analysis performed using quality of living index data'
    };
  } catch (error) {
    console.error('Failed to parse LLM response:', error);
    
    // Fallback: create a basic response structure
    return {
      summary: 'Unable to parse detailed analysis, but here are some general insights.',
      recommendations: [],
      explanation: 'The analysis encountered formatting issues. Please try rephrasing your query.',
      methodology: 'Standard quality of living index analysis'
    };
  }
}

/**
 * Make API call to OpenAI
 */
async function callOpenAI(messages) {
  checkEnvironment();
  
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: MODEL,
        messages,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        response_format: { type: 'text' }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openai.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );
    
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI API');
    }
    
    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your configuration.');
    } else if (error.response?.status === 429) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid request to OpenAI API. Please try a different query.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    } else {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to connect to AI service. Please try again later.');
    }
  }
}

/**
 * Generate cache key for query
 */
function getCacheKey(query, year, weightingScheme) {
  return `${query.toLowerCase().trim()}_${year}_${weightingScheme}`;
}

/**
 * Main query processing function
 */
export const llmService = {
  /**
   * Process natural language query and return country recommendations
   */
  async processQuery(query, year = 2020, weightingScheme = 'equal') {
    if (!query || typeof query !== 'string' || query.trim().length < 10) {
      throw new Error('Please provide a more detailed description of your preferences (at least 10 characters).');
    }
    
    const cacheKey = getCacheKey(query, year, weightingScheme);
    
    // Check cache first
    if (queryCache.has(cacheKey)) {
      const cached = queryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      } else {
        queryCache.delete(cacheKey);
      }
    }
    
    try {
      // Get current index data
      const indexData = await indexService.calculateCompositeIndex(year, weightingScheme);
      
      if (!indexData || Object.keys(indexData).length === 0) {
        throw new Error('No country data available for the selected year and weighting scheme.');
      }
      
      // Get ranked list of countries
      const rankedCountries = Object.keys(indexData)
        .map(country => ({
          country,
          score: indexData[country].compositeScore,
          rank: indexData[country].ranking?.rank || 999
        }))
        .sort((a, b) => b.score - a.score)
        .map(item => item.country);
      
      // Create prompts
      const systemPrompt = createSystemPrompt(year, weightingScheme);
      const userPrompt = createUserPrompt(query, rankedCountries, indexData);
      
      // Call OpenAI API
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
      
      const responseText = await callOpenAI(messages);
      const parsedResponse = parseLLMResponse(responseText);
      
      // Enhance recommendations with actual data
      parsedResponse.recommendations = parsedResponse.recommendations.map(rec => {
        const countryData = indexData[rec.countryCode] || 
                           Object.values(indexData).find(data => 
                             data.country === rec.country || 
                             rec.country.includes(data.country)
                           );
        
        if (countryData) {
          return {
            ...rec,
            score: countryData.compositeScore,
            rank: countryData.ranking?.rank,
            actualData: countryData
          };
        }
        
        return rec;
      });
      
      // Cache the result
      queryCache.set(cacheKey, {
        data: parsedResponse,
        timestamp: Date.now()
      });
      
      // Clean up old cache entries
      if (queryCache.size > 50) {
        const oldestKey = queryCache.keys().next().value;
        queryCache.delete(oldestKey);
      }
      
      return parsedResponse;
    } catch (error) {
      console.error('Query processing failed:', error);
      
      // If it's an API-related error, re-throw it
      if (error.message.includes('API') || error.message.includes('OpenAI')) {
        throw error;
      }
      
      // For other errors, provide a fallback response
      throw new Error('Unable to process your query at this time. Please try again or rephrase your request.');
    }
  },
  
  /**
   * Get query suggestions based on common patterns
   */
  getQuerySuggestions() {
    return [
      "I want a warm climate with low flood risk and good economic opportunities",
      "Find countries with stable economies but minimal wildfire threats",
      "Where can I live with low water scarcity and high GDP per capita?",
      "Recommend places with minimal climate risks for raising a family",
      "I need somewhere with good food security and low cyclone risk",
      "Show me countries with the best overall quality of living",
      "I prefer cooler climates with strong economic growth",
      "Find locations with low environmental risks and high living standards"
    ];
  },
  
  /**
   * Clear query cache
   */
  clearCache() {
    queryCache.clear();
  },
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: queryCache.size,
      entries: Array.from(queryCache.keys())
    };
  }
};

export default llmService;
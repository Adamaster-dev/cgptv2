// Environment configuration for the expatriation dashboard
export const config = {
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  },
  apis: {
    ipcc: import.meta.env.VITE_IPCC_API_BASE || 'https://api.ipcc.ch',
    worldBank: import.meta.env.VITE_WORLDBANK_API_BASE || 'https://api.worldbank.org/v2',
  },
};

// Validation function to ensure required environment variables are set
export const validateEnvironment = () => {
  const errors: string[] = [];
  
  if (!config.openai.apiKey || config.openai.apiKey.includes('example')) {
    errors.push('VITE_OPENAI_API_KEY is required. Get one from https://platform.openai.com/api-keys');
  }
  
  if (errors.length > 0) {
    console.warn('Environment configuration issues:', errors);
    return false;
  }
  
  return true;
};
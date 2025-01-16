class NFTScannerError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'NFTScannerError';
    this.code = code;
  }
}

class NetworkError extends NFTScannerError {
  constructor(message, originalError = null) {
    super(message, 'NETWORK_ERROR');
    this.originalError = originalError;
  }
}

class ValidationError extends NFTScannerError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR');
  }
}

class RateLimitError extends NFTScannerError {
  constructor(message, retryAfter = null) {
    super(message, 'RATE_LIMIT_ERROR');
    this.retryAfter = retryAfter;
  }
}

class ContractError extends NFTScannerError {
  constructor(message, contractAddress = null) {
    super(message, 'CONTRACT_ERROR');
    this.contractAddress = contractAddress;
  }
}

function handleApiError(error, context = '') {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.message;
    
    switch (status) {
      case 401:
        throw new NetworkError(`Authentication failed. Check your API key. ${context}`, error);
      case 403:
        throw new NetworkError(`Access forbidden. Check your API permissions. ${context}`, error);
      case 404:
        throw new ContractError(`Collection not found. Check contract address. ${context}`);
      case 429:
        const retryAfter = error.response.headers['retry-after'];
        throw new RateLimitError(`Rate limit exceeded. Try again later. ${context}`, retryAfter);
      case 500:
      case 502:
      case 503:
        throw new NetworkError(`Server error (${status}). Try again later. ${context}`, error);
      default:
        throw new NetworkError(`API error (${status}): ${message} ${context}`, error);
    }
  } else if (error.code === 'ECONNABORTED') {
    throw new NetworkError(`Request timeout. Check your connection. ${context}`, error);
  } else if (error.code === 'ENOTFOUND') {
    throw new NetworkError(`Network error. Check your internet connection. ${context}`, error);
  } else {
    throw new NetworkError(`Unexpected error: ${error.message} ${context}`, error);
  }
}

function logError(error, context = '') {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR ${context}:`);
  
  if (error instanceof NFTScannerError) {
    console.error(`  Type: ${error.code}`);
    console.error(`  Message: ${error.message}`);
    
    if (error instanceof RateLimitError && error.retryAfter) {
      console.error(`  Retry after: ${error.retryAfter} seconds`);
    }
    
    if (error instanceof ContractError && error.contractAddress) {
      console.error(`  Contract: ${error.contractAddress}`);
    }
    
    if (error.originalError && process.env.NODE_ENV === 'development') {
      console.error(`  Original error: ${error.originalError.message}`);
    }
  } else {
    console.error(`  Message: ${error.message}`);
    if (process.env.NODE_ENV === 'development') {
      console.error(`  Stack: ${error.stack}`);
    }
  }
}

function retry(fn, maxRetries = 3, delay = 1000) {
  return async (...args) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        if (error instanceof RateLimitError || 
            (error instanceof NetworkError && error.originalError?.response?.status >= 500)) {
          
          if (attempt < maxRetries) {
            const waitTime = error instanceof RateLimitError && error.retryAfter 
              ? error.retryAfter * 1000 
              : delay * Math.pow(2, attempt - 1);
              
            console.warn(`Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
        
        throw error;
      }
    }
    
    throw lastError;
  };
}

module.exports = {
  NFTScannerError,
  NetworkError,
  ValidationError,
  RateLimitError,
  ContractError,
  handleApiError,
  logError,
  retry
};
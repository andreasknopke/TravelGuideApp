// Wikipedia API response fixtures
export const mockWikipediaResponse = {
  query: {
    pages: {
      '1': {
        pageid: 1,
        title: 'Brandenburg Gate',
        extract: 'The Brandenburg Gate is an 18th-century neoclassical monument in Berlin.',
        thumbnail: {
          source: 'https://example.com/image.jpg'
        }
      }
    }
  }
};

export const mockWikipediaEmptyResponse = {
  query: {
    pages: {
      '-1': {
        missing: true,
        title: 'Nonexistent Page'
      }
    }
  }
};

// Wikitravel API response fixtures
export const mockWikitravelResponse = {
  parse: {
    title: 'Berlin',
    text: {
      '*': '<p>Berlin is the capital and largest city of Germany...</p>'
    }
  }
};

// OpenAI API response fixtures
export const mockOpenAIClassificationResponse = {
  choices: [
    {
      message: {
        content: 'monument'
      }
    }
  ]
};

export const mockOpenAIDescriptionResponse = {
  choices: [
    {
      message: {
        content: 'The Brandenburg Gate is a famous landmark located in Berlin, Germany. It was built in the 18th century and stands as a symbol of German unity.'
      }
    }
  ]
};

export const mockOpenAIErrorResponse = {
  error: {
    message: 'Rate limit exceeded',
    type: 'rate_limit_error',
    code: 'rate_limit_exceeded'
  }
};

// Generic API error responses
export const mockNetworkError = new Error('Network request failed');
export const mockTimeoutError = new Error('Request timeout');
export const mockServerError = {
  message: 'Internal server error',
  status: 500
};

const useProduction = false;

const getApiUrl = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return 'https://unoffending-shelley-swingingly.ngrok-free.dev/api';
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiUrl();
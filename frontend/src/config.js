const config = {
    API_BASE_URL: process.env.NODE_ENV === 'production' 
      ? process.env.REACT_APP_API_URL || 'https://your-backend-url.railway.app'
      : 'http://localhost:5000'
  };
  
  export default config;
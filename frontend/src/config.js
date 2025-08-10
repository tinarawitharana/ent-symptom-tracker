const config = {
    API_BASE_URL: process.env.NODE_ENV === 'production' 
      ? 'https://ent-symptom-tracker-production.up.railway.app'
      : 'http://localhost:5000'
  };
  
  export default config;
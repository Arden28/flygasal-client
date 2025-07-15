import axios from 'axios';

let accessToken = null;
let tokenExpiry = null;

const getAccessToken = async () => {
  const clientId = import.meta.env.REACT_APP_AMADEUS_API_KEY; // Store in .env
  const clientSecret = import.meta.env.REACT_APP_AMADEUS_API_SECRET; // Store in .env
  const url = 'https://test.api.amadeus.com/v1/security/oauth2/token';

  // Check if token is valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      url,
      `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000 - 60000; // Subtract 1 min for safety
    return accessToken;
  } catch (error) {
    console.error('Error fetching access token:', error);
    throw error;
  }
};

export default getAccessToken;
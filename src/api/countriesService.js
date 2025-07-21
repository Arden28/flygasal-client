// countriesService.js
import axios from 'axios';

const API_BASE_URL = 'https://flygasal.koverae.com/api';
const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your actual API key

const api = axios.create({
  baseURL: API_BASE_URL
});

export const getAllCountries = async () => {
  try {
    const response = await api.get("/proxy/countries"); 
    return response.data;
  } catch (error) {
    console.error('Failed to fetch countries:', error);
    throw error;
  }
};

export const getCountryByCode = async (code) => {
  try {
    const response = await api.get(`/countries/${code}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch country with code ${code}:`, error);
    throw error;
  }
};

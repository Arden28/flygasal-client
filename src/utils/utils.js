import { airlines, airports } from "../data/fakeData";


  // Get airport name from code
  export const getAirportName = (code) => {
    const airport = airports.find((a) => a.value === code);
    return airport ? `${airport.label}` : code;
  };

  // Get airline name from code
  export const getAirlineName = (code) => {
    const airline = airlines.find((a) => a.code === code);
    return airline ? airline.name : code;
  };

  // Get airline logo from code
  export const getAirlineLogo = (code) => {
    const airline = airlines.find((a) => a.code === code);
    return airline ? code : code;
    // return airline ? airline.logo : code;
  };
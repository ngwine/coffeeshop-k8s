import { apiClient } from './client';

/**
 * Get all countries
 * @returns {Promise<{success: boolean, data: Array<{code: string, name: string}>}>}
 */
export function fetchCountries() {
  return apiClient.get('addresses/countries');
}

/**
 * Get cities by country code
 * @param {string} countryCode - Country code (e.g., 'VN', 'US')
 * @returns {Promise<{success: boolean, data: Array<{code: string, name: string, provinceCode: string}>}>}
 */
export function fetchCitiesByCountry(countryCode) {
  return apiClient.get('addresses/cities', {
    params: { country: countryCode },
  });
}

/**
 * Get districts by country and city
 * @param {string} countryCode - Country code
 * @param {string} cityCode - City code
 * @returns {Promise<{success: boolean, data: Array<{code: string, name: string}>}>}
 */
export function fetchDistrictsByCity(countryCode, cityCode) {
  return apiClient.get('addresses/districts', {
    params: { country: countryCode, city: cityCode },
  });
}

/**
 * Get wards by country, city and district
 * @param {string} countryCode - Country code
 * @param {string} cityCode - City code
 * @param {string} districtCode - District code
 * @returns {Promise<{success: boolean, data: Array<{code: string, name: string}>}>}
 */
export function fetchWardsByDistrict(countryCode, cityCode, districtCode) {
  return apiClient.get('addresses/wards', {
    params: { country: countryCode, city: cityCode, district: districtCode },
  });
}

export default {
  fetchCountries,
  fetchCitiesByCountry,
  fetchDistrictsByCity,
  fetchWardsByDistrict,
};


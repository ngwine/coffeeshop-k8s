const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');

// Cache for API responses (cache for 24 hours)
const cache = {
  countries: { data: null, time: null },
  cities: {}, // key: countryCode
  districts: {}, // key: countryCode-cityCode
  wards: {}, // key: countryCode-cityCode-districtCode
};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Geonames API username (free tier - can use 'demo' for testing, but limited)
// For production, register at http://www.geonames.org/login
const GEONAMES_USERNAME = process.env.GEONAMES_USERNAME || 'k217';

// Helper function to make HTTP/HTTPS requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const timeout = options.timeout || 10000; // 10 seconds default
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (err) {
          reject(new Error('Failed to parse JSON response'));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Helper to check cache
function getCached(key, cacheObj) {
  if (cacheObj[key] && cacheObj[key].time && (Date.now() - cacheObj[key].time) < CACHE_DURATION) {
    return cacheObj[key].data;
  }
  return null;
}

// Helper to set cache
function setCached(key, data, cacheObj) {
  cacheObj[key] = { data, time: Date.now() };
}

// GET /api/addresses/countries - Lấy danh sách tất cả countries từ REST Countries API
router.get('/countries', async (req, res) => {
  try {
    // Check cache first
    const cached = getCached('countries', cache);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
      });
    }

    // Fetch from REST Countries API
    const apiUrl = 'https://restcountries.com/v3.1/all?fields=name,cca2,cca3';
    const countriesData = await makeRequest(apiUrl);

    // Transform to our format
    const countries = countriesData
      .map((country) => ({
        code: country.cca2, // ISO 3166-1 alpha-2 code (e.g., 'VN', 'US')
        name: country.name.common || country.name.official,
        code3: country.cca3, // ISO 3166-1 alpha-3 code (e.g., 'VNM', 'USA')
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    // Update cache
    setCached('countries', countries, cache);

    res.json({
      success: true,
      data: countries,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch countries from API',
      error: err.message,
    });
  }
});

// GET /api/addresses/cities - Lấy danh sách cities theo country từ Geonames API
router.get('/cities', async (req, res) => {
  try {
    const { country } = req.query;

    if (!country) {
      return res.status(400).json({
        success: false,
        message: 'Country parameter is required',
      });
    }

    // Check cache first
    const cacheKey = country;
    const cached = getCached(cacheKey, cache.cities);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
      });
    }

    // For Vietnam, use GitHub API (kenzouno1/DiaGioiHanhChinhVN)
    if (country === 'VN') {
      try {
        // Fetch all Vietnam administrative data from GitHub
        const apiUrl = 'https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json';
        const vnData = await makeRequest(apiUrl);
        
        if (Array.isArray(vnData)) {
          // Transform to our format - use Id (number) as code and provinceCode
          const cities = vnData.map((province) => ({
            code: province.Id?.toString() || province.Code || province.Name,
            name: province.Name,
            provinceCode: province.Id?.toString() || province.Code || province.Name, // Use Id (number) as provinceCode
          }));
          
          setCached(cacheKey, cities, cache.cities);
          return res.json({
            success: true,
            data: cities,
          });
        }
      } catch (err) {
        // Continue to Geonames fallback
      }
    }

    // For other countries, use Geonames API
    try {
      // Geonames API: Get cities by country code
      // Documentation: http://www.geonames.org/export/web-services.html
      // Note: Requires valid Geonames username (register at http://www.geonames.org/login)
      const apiUrl = `https://secure.geonames.org/searchJSON?country=${country}&featureClass=P&maxRows=1000&username=${GEONAMES_USERNAME}`;
      const geonamesData = await makeRequest(apiUrl);
      
      // Check for API errors
      if (geonamesData.status && geonamesData.status.value !== 0) {
        throw new Error(geonamesData.status.message);
      }
      
      if (geonamesData && geonamesData.geonames && Array.isArray(geonamesData.geonames)) {
        const cities = geonamesData.geonames
          .map((city) => ({
            code: city.geonameId?.toString() || city.name,
            name: city.name,
            provinceCode: city.adminCode1 || city.adminCode2 || city.code || city.name,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setCached(cacheKey, cities, cache.cities);
        return res.json({
          success: true,
          data: cities,
        });
      }
    } catch (err) {
      // Continue to return empty array
    }

    // If all APIs fail, return empty array
    res.json({
      success: true,
      data: [],
      message: 'No cities data available for this country from external APIs.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: err.message,
    });
  }
});

// GET /api/addresses/districts - Lấy danh sách districts theo country và city từ API
router.get('/districts', async (req, res) => {
  try {
    const { country, city } = req.query;

    if (!country || !city) {
      return res.status(400).json({
        success: false,
        message: 'Country and city parameters are required',
      });
    }

    // Check cache first
    const cacheKey = `${country}-${city}`;
    const cached = getCached(cacheKey, cache.districts);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
      });
    }

    // For Vietnam, use GitHub API (kenzouno1/DiaGioiHanhChinhVN)
    if (country === 'VN') {
      try {
        // Fetch all Vietnam administrative data from GitHub
        const apiUrl = 'https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json';
        const vnData = await makeRequest(apiUrl);
        
        if (Array.isArray(vnData)) {
          // Find the city/province by name (city parameter can be name or code)
          const province = vnData.find(p => 
            p.Name === city || 
            p.Name.includes(city) || 
            city.includes(p.Name) ||
            p.Id === city ||
            p.Code === city
          );
          
          if (province && province.Districts && Array.isArray(province.Districts)) {
            const districts = province.Districts.map((district) => ({
              code: district.Id?.toString() || district.Code || district.Name,
              name: district.Name,
            }));
            
            // Sort by name
            districts.sort((a, b) => a.name.localeCompare(b.name));
            
            if (districts.length > 0) {
              setCached(cacheKey, districts, cache.districts);
              return res.json({
                success: true,
                data: districts,
              });
            }
          }
        }
      } catch (err) {
      }
    }

    // For other countries, use Geonames API
    // Note: Different countries have different administrative structures
    // Some countries may not have districts (e.g., US uses states, not districts)
    // Geonames API will return what's available for each country
    try {
      // First, try to get city geonameId if city is a name
      let cityGeonameId = city;
      
      // If city is not a numeric ID, try to find it
      if (isNaN(city)) {
        try {
          const searchUrl = `https://secure.geonames.org/searchJSON?name=${encodeURIComponent(city)}&country=${country}&maxRows=1&username=${GEONAMES_USERNAME}`;
          const searchData = await makeRequest(searchUrl);
          if (searchData && searchData.geonames && searchData.geonames.length > 0) {
            cityGeonameId = searchData.geonames[0].geonameId;
          }
        } catch (searchErr) {
        }
      }
      
      // Geonames API: Get administrative divisions (districts) by city
      // Note: Requires valid Geonames username (register at http://www.geonames.org/login)
      const apiUrl = `https://secure.geonames.org/childrenJSON?geonameId=${cityGeonameId}&username=${GEONAMES_USERNAME}`;
      const geonamesData = await makeRequest(apiUrl);
      
      // Check for API errors
      if (geonamesData.status && geonamesData.status.value !== 0) {
        throw new Error(geonamesData.status.message);
      }
      
      if (geonamesData && geonamesData.geonames && Array.isArray(geonamesData.geonames)) {
        // Get all administrative divisions - let Geonames determine what's available for this country
        // Different countries have different administrative levels:
        // - ADM1: First-level administrative division (states, provinces)
        // - ADM2: Second-level administrative division (counties, districts)
        // - ADM3: Third-level administrative division (districts, municipalities)
        // - ADM4: Fourth-level administrative division (wards, communes)
        // - PPL: Populated places (cities, towns)
        // - PPLX: Populated places (neighborhoods, suburbs)
        const districts = geonamesData.geonames
          .filter((item) => {
            // Include all administrative divisions and populated places
            // Let the data determine what's available for this country
            return (
              item.fcode?.startsWith('ADM') || // All administrative divisions
              item.fcode === 'PPL' || // Populated places
              item.fcode === 'PPLX' || // Populated places (neighborhoods)
              item.fcl === 'A' || // Administrative boundaries
              item.fcl === 'P' // Populated places
            );
          })
          .map((district) => ({
            code: district.geonameId?.toString() || district.name,
            name: district.name,
            // Include additional metadata about the administrative level
            adminLevel: district.fcode || district.fcl,
            countryCode: district.countryCode || country,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        if (districts.length > 0) {
          setCached(cacheKey, districts, cache.districts);
          return res.json({
            success: true,
            data: districts,
            // Include metadata about what type of data is available
            metadata: {
              country: country,
              hasDistricts: districts.length > 0,
              adminLevels: [...new Set(districts.map(d => d.adminLevel))],
            },
          });
        }
      }
    } catch (err) {
      // Continue to return empty array - this is normal for countries without districts
    }

    // If all APIs fail, return empty array
    res.json({
      success: true,
      data: [],
      message: 'No districts data available for this city from external APIs.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch districts',
      error: err.message,
    });
  }
});

// GET /api/addresses/wards - Lấy danh sách wards theo country, city và district từ API
// Nếu không có district, có thể fetch wards trực tiếp từ city
router.get('/wards', async (req, res) => {
  try {
    const { country, city, district } = req.query;

    if (!country || !city) {
      return res.status(400).json({
        success: false,
        message: 'Country and city parameters are required',
      });
    }

    // Use district if provided, otherwise use city code
    const parentId = district || city;
    
    // Check cache first
    const cacheKey = `${country}-${city}-${parentId}`;
    const cached = getCached(cacheKey, cache.wards);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
      });
    }

    // For Vietnam, use GitHub API (kenzouno1/DiaGioiHanhChinhVN)
    if (country === 'VN') {
      try {
        // Fetch all Vietnam administrative data from GitHub
        const apiUrl = 'https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json';
        const vnData = await makeRequest(apiUrl);
        
        if (Array.isArray(vnData)) {
          // Find the city/province by name (city parameter can be name or code)
          const province = vnData.find(p => 
            p.Name === city || 
            p.Name.includes(city) || 
            city.includes(p.Name) ||
            p.Id === city ||
            p.Code === city
          );
          
          if (province && province.Districts) {
            let wards = [];
            
            if (district) {
              // If district is provided, get wards from that specific district
              const districtObj = province.Districts.find(d => 
                d.Name === district || 
                d.Name.includes(district) || 
                district.includes(d.Name) ||
                d.Id === district ||
                d.Code === district
              );
              
              if (districtObj && districtObj.Wards && Array.isArray(districtObj.Wards)) {
                wards = districtObj.Wards.map((ward) => ({
                  code: ward.Id?.toString() || ward.Code || ward.Name,
                  name: ward.Name,
                }));
              }
            } else {
              // If no district, get all wards from all districts in the city
              province.Districts.forEach(dist => {
                if (dist.Wards && Array.isArray(dist.Wards)) {
                  dist.Wards.forEach(ward => {
                    wards.push({
                      code: ward.Id?.toString() || ward.Code || ward.Name,
                      name: ward.Name,
                    });
                  });
                }
              });
            }
            
            // Remove duplicates by name
            const uniqueWards = wards.filter((ward, index, self) =>
              index === self.findIndex(w => w.name === ward.name)
            );
            
            // Sort by name
            uniqueWards.sort((a, b) => a.name.localeCompare(b.name));
            
            if (uniqueWards.length > 0) {
              setCached(cacheKey, uniqueWards, cache.wards);
              return res.json({
                success: true,
                data: uniqueWards,
              });
            }
          }
        }
      } catch (err) {
      }
    }

    // For other countries, use Geonames API
    // Note: Different countries have different administrative structures
    // Some countries may not have wards (e.g., US uses ZIP codes, not wards)
    // Geonames API will return what's available for each country
    try {
      // Use district if provided, otherwise use city
      let parentGeonameId = district || city;
      
      // If parent is not a numeric ID, try to find it
      if (isNaN(parentGeonameId)) {
        try {
          const searchUrl = `https://secure.geonames.org/searchJSON?name=${encodeURIComponent(parentGeonameId)}&country=${country}&maxRows=1&username=${GEONAMES_USERNAME}`;
          const searchData = await makeRequest(searchUrl);
          if (searchData && searchData.geonames && searchData.geonames.length > 0) {
            parentGeonameId = searchData.geonames[0].geonameId;
          }
        } catch (searchErr) {
        }
      }
      
      // Geonames API: Get administrative divisions (wards) by district or city
      // Note: Requires valid Geonames username (register at http://www.geonames.org/login)
      const apiUrl = `https://secure.geonames.org/childrenJSON?geonameId=${parentGeonameId}&username=${GEONAMES_USERNAME}`;
      const geonamesData = await makeRequest(apiUrl);
      
      // Check for API errors
      if (geonamesData.status && geonamesData.status.value !== 0) {
        throw new Error(geonamesData.status.message);
      }
      
      if (geonamesData && geonamesData.geonames && Array.isArray(geonamesData.geonames)) {
        // Get all administrative divisions - let Geonames determine what's available for this country
        // Different countries have different administrative levels for wards:
        // - ADM4: Fourth-level administrative division (wards, communes)
        // - ADM5: Fifth-level administrative division (sub-wards, hamlets)
        // - PPL: Populated places (villages, neighborhoods)
        // - PPLX: Populated places (neighborhoods, suburbs)
        const wards = geonamesData.geonames
          .filter((item) => {
            // Include all administrative divisions and populated places
            // Let the data determine what's available for this country
            return (
              item.fcode?.startsWith('ADM') || // All administrative divisions
              item.fcode === 'PPL' || // Populated places
              item.fcode === 'PPLX' || // Populated places (neighborhoods)
              item.fcl === 'A' || // Administrative boundaries
              item.fcl === 'P' // Populated places
            );
          })
          .map((ward) => ({
            code: ward.geonameId?.toString() || ward.name,
            name: ward.name,
            // Include additional metadata about the administrative level
            adminLevel: ward.fcode || ward.fcl,
            countryCode: ward.countryCode || country,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        if (wards.length > 0) {
          setCached(cacheKey, wards, cache.wards);
          return res.json({
            success: true,
            data: wards,
            // Include metadata about what type of data is available
            metadata: {
              country: country,
              hasWards: wards.length > 0,
              adminLevels: [...new Set(wards.map(w => w.adminLevel))],
            },
          });
        }
      }
    } catch (err) {
      // Continue to return empty array - this is normal for countries without wards
    }

    // If all APIs fail, return empty array
    res.json({
      success: true,
      data: [],
      message: 'No wards data available for this district from external APIs.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wards',
      error: err.message,
    });
  }
});

module.exports = router;


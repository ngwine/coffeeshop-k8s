import React, { useState, useEffect, useRef } from 'react';
import { X, Home, Building2 } from 'lucide-react';
import {
  fetchCountries,
  fetchCitiesByCountry,
  fetchDistrictsByCity,
  fetchWardsByDistrict,
} from '../../../../../../api/addresses';
import CountrySelectWithAlphabet from '../shared/CountrySelectWithAlphabet';
import CitySelectWithAlphabet from '../shared/CitySelectWithAlphabet';
import DistrictSelectWithAlphabet from '../shared/DistrictSelectWithAlphabet';
import WardSelectWithAlphabet from '../shared/WardSelectWithAlphabet';

type AddNewAddressModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (addressData: any, addressId?: string) => Promise<void> | void;
  customer?: any;
  initialData?: any; // Address data for edit mode
  addressId?: string; // Address ID for edit mode
};

const AddNewAddressModal: React.FC<AddNewAddressModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customer,
  initialData,
  addressId,
}) => {
  const isEditMode = !!initialData && !!addressId;
  
  // Helper function to normalize strings (remove accents, special chars for better matching)
  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .trim();
  };

  // Comprehensive matching function that handles all edge cases
  const findBestMatch = (
    searchName: string,
    options: Array<{ code: string; name: string }>,
    type: 'city' | 'district' | 'ward' = 'city'
  ): { code: string; name: string } | null => {
    if (!searchName || !options || options.length === 0) return null;

    const searchNameLower = searchName.toLowerCase().trim();
    const searchNameNormalized = normalizeString(searchName);

    // Priority 1: Exact match (case-sensitive)
    let match = options.find((item: any) => 
      item.name === searchName || item.code === searchName
    );
    if (match) {
      return match;
    }

    // Priority 2: Case-insensitive exact match
    match = options.find((item: any) => {
      const itemNameLower = item.name.toLowerCase().trim();
      const itemCodeLower = (item.code || '').toLowerCase().trim();
      return itemNameLower === searchNameLower || itemCodeLower === searchNameLower;
    });
    if (match) {
      return match;
    }

    // Priority 3: Normalized exact match (handles accents)
    match = options.find((item: any) => {
      const itemNameNormalized = normalizeString(item.name);
      return itemNameNormalized === searchNameNormalized;
    });
    if (match) {
      return match;
    }

    // Priority 4: Remove common prefixes/suffixes and match
    const commonPrefixes = type === 'city' 
      ? ['tỉnh', 'thành phố', 'tp', 't.p', 'city', 'province', 'prefecture', 'state']
      : type === 'district'
      ? ['district', 'quận', 'huyện', 'county', 'arrondissement', 'borough', 'ward', 'gu', '-gu']
      : ['ward', 'phường', 'xã', 'commune', 'gu', '-gu', 'ward'];
    
    const nameWithoutPrefix = searchNameLower
      .replace(new RegExp(`^(${commonPrefixes.join('|')})\\s+`, 'i'), '')
      .replace(/\s+(city|ward|gu)$/i, '')
      .replace(/\s*-\s*/g, ' ')
      .trim();

    match = options.find((item: any) => {
      const itemNameLower = item.name.toLowerCase().trim();
      const itemNameWithoutPrefix = itemNameLower
        .replace(new RegExp(`^(${commonPrefixes.join('|')})\\s+`, 'i'), '')
        .replace(/\s+(city|ward|gu)$/i, '')
        .replace(/\s*-\s*/g, ' ')
        .trim();

      // Exact match after removing prefixes
      if (nameWithoutPrefix === itemNameWithoutPrefix) return true;

      // Extract key words (words longer than 2 chars)
      const searchWords = nameWithoutPrefix.split(/\s+/).filter(w => w.length > 2);
      const itemWords = itemNameWithoutPrefix.split(/\s+/).filter(w => w.length > 2);

      if (searchWords.length > 0 && itemWords.length > 0) {
        // Normalize both for comparison
        const normalizedSearchWords = searchWords.map(w => normalizeString(w));
        const normalizedItemWords = itemWords.map(w => normalizeString(w));

        // Check if all key words from search name exist in item name (normalized)
        const allSearchWordsMatch = normalizedSearchWords.every(word => 
          normalizedItemWords.some(itemWord => 
            itemWord.includes(word) || word.includes(itemWord) || itemWord === word
          )
        );

        // Also check reverse: all item key words in search name
        const allItemWordsMatch = normalizedItemWords.every(itemWord => 
          normalizedSearchWords.some(word => 
            word.includes(itemWord) || itemWord.includes(word) || word === itemWord
          )
        );

        // Require at least one direction to match all words
        if (allSearchWordsMatch || allItemWordsMatch) return true;
      }

      return false;
    });
    if (match) {
      return match;
    }

    // Priority 5: Starts with match
    match = options.find((item: any) => {
      const itemNameLower = item.name.toLowerCase().trim();
      return itemNameLower.startsWith(searchNameLower) || searchNameLower.startsWith(itemNameLower);
    });
    if (match) {
      return match;
    }

    // Priority 6: Contains match with word requirement (to avoid false positives)
    const searchWords = searchNameLower.split(/\s+/).filter(w => w.length > 2);
    
    if (searchWords.length >= 2) {
      // Find all matches where at least 2 key words match
      const matches = options.filter((item: any) => {
        const itemNameLower = item.name.toLowerCase().trim();
        const itemNameNormalized = normalizeString(item.name);
        
        // Count how many words match (normalized)
        const normalizedSearchWords = searchWords.map(w => normalizeString(w));
        const itemWords = itemNameLower.split(/\s+/).filter(w => w.length > 2);
        const normalizedItemWords = itemWords.map(w => normalizeString(w));
        
        const matchingWords = normalizedSearchWords.filter(word => 
          normalizedItemWords.some(itemWord => 
            itemWord.includes(word) || word.includes(itemWord) || itemWord === word
          )
        );
        
        // Require at least 2 words to match (or 1 word if it's a long word > 5 chars)
        const hasEnoughMatches = matchingWords.length >= 2 || 
          (matchingWords.length === 1 && matchingWords[0].length > 5);
        
        return hasEnoughMatches && (
          itemNameLower.includes(searchNameLower) || 
          searchNameLower.includes(itemNameLower) ||
          itemNameNormalized.includes(searchNameNormalized) || 
          searchNameNormalized.includes(itemNameNormalized)
        );
      });
      
      if (matches.length > 0) {
        // Prefer the match with the longest name (most specific)
        match = matches.reduce((prev, curr) => 
          curr.name.length > prev.name.length ? curr : prev
        );
        // Count matching words for logging
        const normalizedSearchWords = searchWords.map(w => normalizeString(w));
        const matchWords = match.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const normalizedMatchWords = matchWords.map(w => normalizeString(w));
        return match;
      }
    } else {
      // If less than 2 words, use exact contains match only
      const matches = options.filter((item: any) => {
        const itemNameLower = item.name.toLowerCase().trim();
        const itemNameNormalized = normalizeString(item.name);
        return itemNameLower.includes(searchNameLower) || 
               searchNameLower.includes(itemNameLower) ||
               itemNameNormalized.includes(searchNameNormalized) || 
               searchNameNormalized.includes(itemNameNormalized);
      });
      
      if (matches.length > 0) {
        match = matches.reduce((prev, curr) => 
          curr.name.length > prev.name.length ? curr : prev
        );
        return match;
      }
    }

    return null;
  };
  
  const [formData, setFormData] = useState({
    type: 'home',
    phone: '',
    country: '',
    city: '',
    district: '',
    ward: '',
    addressLine1: '',
    addressLine2: '',
    notes: '',
    useAsBilling: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for dropdown options
  const [countries, setCountries] = useState<Array<{ code: string; name: string }>>([]);
  const [cities, setCities] = useState<Array<{ code: string; name: string; provinceCode?: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ code: string; name: string }>>([]);
  const [wards, setWards] = useState<Array<{ code: string; name: string }>>([]);
  
  // Store original names for edit mode (to find codes after data loads)
  const [editModeNames, setEditModeNames] = useState<{
    city?: string;
    district?: string;
    ward?: string;
    country?: string;
  }>({});
  const [loadingOptions, setLoadingOptions] = useState({
    countries: false,
    cities: false,
    districts: false,
    wards: false,
  });
  // Track if districts/wards are available for the selected country
  const [featuresAvailable, setFeaturesAvailable] = useState({
    districts: false,
    wards: false,
  });
  
  // State for dropdown open/close
  const [dropdownOpen, setDropdownOpen] = useState({
    country: false,
    city: false,
    district: false,
    ward: false,
  });
  
  // Refs for dropdown containers (no longer needed, handled by components)

  // Get selected city (by code or name)
  const selectedCity = cities.find((c) => c.code === formData.city || c.name === formData.city);

  // Pre-load all data when initialData is available (before modal opens)
  useEffect(() => {
    if (initialData && addressId) {
      
      // Store original country value (could be code or name)
      const countryValue = initialData.country || '';
      
      // Store original names for matching codes later
      const cityName = initialData.city || '';
      const districtName = initialData.district || '';
      const wardName = initialData.ward || '';
      
      // Store original values for matching
      setEditModeNames({
        city: cityName,
        district: districtName,
        ward: wardName,
        country: countryValue,
      });
      
      // Pre-load countries, cities, districts, wards in sequence
      const preloadData = async () => {
        try {
          // 1. Load countries
          const countriesResponse = await fetchCountries();
          let countriesData: Array<{ code: string; name: string }> = [];
          if (countriesResponse?.success && countriesResponse?.data && Array.isArray(countriesResponse.data)) {
            countriesData = countriesResponse.data;
          } else if (Array.isArray(countriesResponse)) {
            countriesData = countriesResponse;
          }
          setCountries(countriesData);
          
          // 2. Find and set country code
          let countryCode = countryValue;
          if (countriesData.length > 0 && countryValue) {
            const isCode = countryValue.length <= 3 && /^[A-Z]{2,3}$/i.test(countryValue);
            if (!isCode) {
              const countryObj = countriesData.find((c: any) => {
                const cNameLower = c.name.toLowerCase().trim();
                const cCodeLower = (c.code || '').toLowerCase().trim();
                const countryNameLower = countryValue.toLowerCase().trim();
                return c.name === countryValue || c.code === countryValue ||
                       cNameLower === countryNameLower || cCodeLower === countryNameLower ||
                       cNameLower.includes(countryNameLower) || countryNameLower.includes(cNameLower);
              });
              if (countryObj) {
                countryCode = countryObj.code;
              }
            } else {
              const countryObj = countriesData.find((c: any) => c.code === countryValue);
            }
          }
          
          // 3. Load cities
          if (countryCode) {
            const citiesResponse = await fetchCitiesByCountry(countryCode);
            let citiesData: Array<{ code: string; name: string }> = [];
            if (citiesResponse?.success && citiesResponse?.data && Array.isArray(citiesResponse.data)) {
              citiesData = citiesResponse.data;
            } else if (Array.isArray(citiesResponse)) {
              citiesData = citiesResponse;
            }
            setCities(citiesData);
            
            // 4. Find and set city code
            let cityCode = cityName;
            if (citiesData.length > 0 && cityName) {
              const cityObj = findBestMatch(cityName, citiesData, 'city');
              if (cityObj) {
                cityCode = cityObj.code;
              }
            }
            
            // 5. Load districts
            if (cityCode && cityCode !== cityName) {
              const districtsResponse = await fetchDistrictsByCity(countryCode, cityCode);
              let districtsData: Array<{ code: string; name: string }> = [];
              if (districtsResponse?.success && districtsResponse?.data && Array.isArray(districtsResponse.data)) {
                districtsData = districtsResponse.data;
              } else if (Array.isArray(districtsResponse)) {
                districtsData = districtsResponse;
              }
              setDistricts(districtsData);
              
              if (districtsData.length > 0) {
                setFeaturesAvailable((prev) => ({ ...prev, districts: true }));
              }
              
              // 6. Find and set district code
              let districtCode = districtName;
              if (districtsData.length > 0 && districtName) {
                const districtObj = findBestMatch(districtName, districtsData, 'district');
                if (districtObj) {
                  districtCode = districtObj.code;
                }
              }
              
              // 7. Load wards
              if (districtCode && districtCode !== districtName) {
                const wardsResponse = await fetchWardsByDistrict(countryCode, cityCode, districtCode);
                let wardsData: Array<{ code: string; name: string }> = [];
                if (wardsResponse?.success && wardsResponse?.data && Array.isArray(wardsResponse.data)) {
                  wardsData = wardsResponse.data;
                } else if (Array.isArray(wardsResponse)) {
                  wardsData = wardsResponse;
                }
                setWards(wardsData);
                
                if (wardsData.length > 0) {
                  setFeaturesAvailable((prev) => ({ ...prev, wards: true }));
                }
                
                // 8. Find and set ward code
                if (wardsData.length > 0 && wardName) {
                  const wardObj = findBestMatch(wardName, wardsData, 'ward');
                }
              } else if (!districtName && cityCode) {
                // Try to load wards directly from city if no district
                const wardsResponse = await fetchWardsByDistrict(countryCode, cityCode, '');
                let wardsData: Array<{ code: string; name: string }> = [];
                if (wardsResponse?.success && wardsResponse?.data && Array.isArray(wardsResponse.data)) {
                  wardsData = wardsResponse.data;
                } else if (Array.isArray(wardsResponse)) {
                  wardsData = wardsResponse;
                }
                if (wardsData.length > 0) {
                  setWards(wardsData);
                  setFeaturesAvailable((prev) => ({ ...prev, wards: true }));
                }
              }
            }
          }
        } catch (err) {
        }
      };
      
      preloadData();
    }
  }, [initialData, addressId]);

  // Fill form with address data when modal opens or initialData changes (similar to EditUserInformationModal)
  useEffect(() => {
    if (initialData && isOpen && addressId) {
      
      // Store original country value (could be code or name)
      const countryValue = initialData.country || '';
      
      // Store original names for matching codes later
      const cityName = initialData.city || '';
      const districtName = initialData.district || '';
      const wardName = initialData.ward || '';
      
      // Determine address type from label (case-insensitive)
      // label can be 'Home', 'home', 'Office', 'office', etc.
      const label = initialData.label || '';
      const addressType = label.toLowerCase() === 'home' ? 'home' : 'office';
      
      // Store original values for matching
      setEditModeNames({
        city: cityName,
        district: districtName,
        ward: wardName,
        country: countryValue, // Store original country value too
      });
      
      // Set form data - try to use codes if already loaded from pre-load, otherwise use names
      const getCountryCode = () => {
        if (countries.length > 0 && countryValue) {
          const isCode = countryValue.length <= 3 && /^[A-Z]{2,3}$/i.test(countryValue);
          if (isCode) return countryValue;
          const countryObj = countries.find((c: any) => 
            c.name === countryValue || c.code === countryValue ||
            c.name.toLowerCase() === countryValue.toLowerCase() ||
            c.code.toLowerCase() === countryValue.toLowerCase()
          );
          return countryObj?.code || countryValue;
        }
        return countryValue;
      };
      
      const getCityCode = () => {
        if (cities.length > 0 && cityName) {
          const cityObj = cities.find((c: any) => 
            c.code === cityName || c.name === cityName ||
            c.code.toLowerCase() === cityName.toLowerCase() ||
            c.name.toLowerCase() === cityName.toLowerCase()
          );
          if (cityObj) return cityObj.code;
          const matched = findBestMatch(cityName, cities, 'city');
          return matched?.code || cityName;
        }
        return cityName;
      };
      
      const getDistrictCode = () => {
        if (districts.length > 0 && districtName) {
          const districtObj = districts.find((d: any) => 
            d.code === districtName || d.name === districtName ||
            d.code.toLowerCase() === districtName.toLowerCase() ||
            d.name.toLowerCase() === districtName.toLowerCase()
          );
          if (districtObj) return districtObj.code;
          const matched = findBestMatch(districtName, districts, 'district');
          return matched?.code || districtName;
        }
        return districtName;
      };
      
      const getWardCode = () => {
        if (wards.length > 0 && wardName) {
          const wardObj = wards.find((w: any) => 
            w.code === wardName || w.name === wardName ||
            w.code.toLowerCase() === wardName.toLowerCase() ||
            w.name.toLowerCase() === wardName.toLowerCase()
          );
          if (wardObj) return wardObj.code;
          const matched = findBestMatch(wardName, wards, 'ward');
          return matched?.code || wardName;
        }
        return wardName;
      };
      
      const newFormData = {
        type: addressType,
        phone: initialData.phone || '',
        country: getCountryCode(),
        city: getCityCode(),
        district: getDistrictCode(),
        ward: getWardCode(),
        addressLine1: initialData.addressLine1 || '',
        addressLine2: initialData.addressLine2 || '',
        notes: initialData.notes || '',
        useAsBilling: initialData.type === 'billing',
      };
      
      setFormData(newFormData);
      setError(null);
    } else if (isOpen && !initialData) {
      // Reset form when modal opens in add mode
      setEditModeNames({});
      setFormData({
        type: 'home',
        phone: '',
        country: '',
        city: '',
        district: '',
        ward: '',
        addressLine1: '',
        addressLine2: '',
        notes: '',
        useAsBilling: false,
      });
      setError(null);
    }
  }, [initialData, isOpen, addressId, countries, cities, districts, wards]); // Include pre-loaded data in dependencies

  // Fetch countries on mount
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingOptions((prev) => ({ ...prev, countries: true }));
      try {
        const response = await fetchCountries();
        // API client returns data directly, which is { success: true, data: [...] }
        let countriesData: Array<{ code: string; name: string }> = [];
        if (response?.success && response?.data && Array.isArray(response.data)) {
          countriesData = response.data;
        } else if (Array.isArray(response)) {
          countriesData = response;
        }
        
        setCountries(countriesData);
        
        // If in edit mode and we have a country value, find and set the country code
        if (isEditMode && editModeNames.country && countriesData.length > 0) {
          // Check if current country is already a code (2-3 characters) or a name
          const countryValue = editModeNames.country;
          const isCode = countryValue.length <= 3 && /^[A-Z]{2,3}$/i.test(countryValue);
          
          if (!isCode) {
            // It's a name, find the code
            const countryNameLower = countryValue.toLowerCase().trim();
            const countryObj = countriesData.find((c: any) => {
              const cNameLower = c.name.toLowerCase().trim();
              const cCodeLower = (c.code || '').toLowerCase().trim();
              
              // Exact match
              if (c.name === countryValue || c.code === countryValue) return true;
              // Case-insensitive match
              if (cNameLower === countryNameLower || cCodeLower === countryNameLower) return true;
              // Partial match
              if (cNameLower.includes(countryNameLower) || countryNameLower.includes(cNameLower)) return true;
              return false;
            });
            
            if (countryObj) {
              setFormData((prev) => ({ ...prev, country: countryObj.code }));
            }
          } else {
            // It's already a code, verify it exists
            const countryObj = countriesData.find((c: any) => c.code === countryValue);
          }
        }
      } catch (err) {
        setError('Failed to load countries. Please try again.');
        setCountries([]);
      } finally {
        setLoadingOptions((prev) => ({ ...prev, countries: false }));
      }
    };

    if (isOpen) {
      loadCountries();
    }
  }, [isOpen, isEditMode, editModeNames.country]);

  // Fetch cities when country changes
  useEffect(() => {
    const loadCities = async () => {
      if (!formData.country) {
        setCities([]);
        return;
      }

      setLoadingOptions((prev) => ({ ...prev, cities: true }));
      try {
        const response = await fetchCitiesByCountry(formData.country);
        let citiesData: Array<{ code: string; name: string; provinceCode?: string }> = [];
        if (response?.success && response?.data && Array.isArray(response.data)) {
          citiesData = response.data;
        } else if (Array.isArray(response)) {
          citiesData = response;
        }
        
        setCities(citiesData);
        
        // If in edit mode and we have a city name, find and set the city code
        if (isEditMode && editModeNames.city && citiesData.length > 0) {
          const cityObj = findBestMatch(editModeNames.city, citiesData, 'city');
          
          if (cityObj) {
            setFormData((prev) => ({
              ...prev,
              city: cityObj.code,
            }));
          } else {
            // Keep city name in formData if no match found
            setFormData((prev) => ({ ...prev, city: editModeNames.city || '' }));
          }
        }
      } catch (err) {
        setCities([]);
      } finally {
        setLoadingOptions((prev) => ({ ...prev, cities: false }));
      }
    };

    if (formData.country) {
      loadCities();
    }
  }, [formData.country, isEditMode, editModeNames.city]);

  // Fetch districts when city changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (!formData.country || !formData.city) {
        setDistricts([]);
        setFeaturesAvailable((prev) => ({ ...prev, districts: false, wards: false }));
        return;
      }

      // Wait for cities to load first
      if (cities.length === 0) {
        return;
      }

      // Check if city is a valid code (exists in cities list)
      const cityObj = cities.find(c => c.code === formData.city || c.name === formData.city);
      
      if (!cityObj) {
        return;
      }

      // Get the actual city code (not name)
      const cityCode = cityObj.code;
      
      // If city is still a name, wait for city code to be set by the match logic
      if (formData.city !== cityCode && formData.city === cityObj.name) {
        return;
      }

      // Verify we have a valid city code before proceeding
      if (!cityCode) {
        return;
      }

      // Show loading for all countries to check availability
      setLoadingOptions((prev) => ({ ...prev, districts: true }));
      
      try {
        const response = await fetchDistrictsByCity(formData.country, cityCode);
        let districtsData: Array<{ code: string; name: string }> = [];
        
        if (response?.success && response?.data && Array.isArray(response.data)) {
          districtsData = response.data;
        } else if (Array.isArray(response)) {
          districtsData = response;
        }
        
        setDistricts(districtsData);
        
        // If in edit mode and we have a district name, find and set the district code
        if (isEditMode && editModeNames.district && districtsData.length > 0) {
          const districtObj = findBestMatch(editModeNames.district, districtsData, 'district');
          
          if (districtObj) {
            setFormData((prev) => ({ ...prev, district: districtObj.code }));
          } else {
            // Try to keep the district name in formData if no match found (user can see it)
            setFormData((prev) => ({ ...prev, district: editModeNames.district || '' }));
          }
        }
        
        // If districts array is empty, disable districts and wards
        const hasDistricts = districtsData.length > 0;
        setFeaturesAvailable((prev) => ({ 
          ...prev, 
          districts: hasDistricts,
          wards: false // Reset wards availability
        }));
        
        // Reset district and ward selection if no districts available (only if not in edit mode)
        if (!hasDistricts && !isEditMode) {
          setFormData((prev) => ({ ...prev, district: '', ward: '' }));
        }
      } catch (err) {
        setDistricts([]);
        setFeaturesAvailable((prev) => ({ ...prev, districts: false, wards: false }));
      } finally {
        setLoadingOptions((prev) => ({ ...prev, districts: false }));
      }
    };

    loadDistricts();
  }, [formData.country, formData.city, isEditMode, editModeNames.district, cities]);

  // Fetch wards when district changes OR when city changes (if no districts available)
  useEffect(() => {
    const loadWards = async () => {
      // If no city selected, clear wards
      if (!formData.country || !formData.city) {
        setWards([]);
        setFeaturesAvailable((prev) => ({ ...prev, wards: false }));
        return;
      }

      // Wait for cities to load first and get city code
      if (cities.length === 0) {
        return;
      }

      const cityObj = cities.find(c => c.code === formData.city || c.name === formData.city);
      if (!cityObj || formData.city !== cityObj.code) {
        return;
      }
      const cityCode = cityObj.code;

      // If districts are available, require district to be selected
      if (featuresAvailable.districts && !formData.district) {
        setWards([]);
        setFeaturesAvailable((prev) => ({ ...prev, wards: false }));
        return;
      }

      // Check if district is a valid code (exists in districts list) or if districts haven't loaded yet
      // In edit mode, district might be a name initially, so we need to wait for districts to load
      let districtCode = null;
      if (featuresAvailable.districts && formData.district) {
        // Wait for districts to load first
        if (districts.length === 0) {
          return;
        }

        const districtObj = districts.find(d => d.code === formData.district || d.name === formData.district);
        
        if (!districtObj) {
          return;
        }

        districtCode = districtObj.code;
        
        // If district is still a name, wait for district code to be set
        if (formData.district !== districtCode && formData.district === districtObj.name) {
          return;
        }

        if (!districtCode) {
          return;
        }
      }

      // Show loading
      setLoadingOptions((prev) => ({ ...prev, wards: true }));
      
      try {
        let response;
        
        // If districts are available, fetch wards by district
        if (featuresAvailable.districts && districtCode) {
          response = await fetchWardsByDistrict(
            formData.country,
            cityCode,
            districtCode
          );
        } else {
          // If no districts, try to fetch wards directly from city
          response = await fetchWardsByDistrict(
            formData.country,
            cityCode,
            cityCode // Use city code as district parameter
          );
        }
        
        let wardsData: Array<{ code: string; name: string }> = [];
        
        if (response?.success && response?.data && Array.isArray(response.data)) {
          wardsData = response.data;
        } else if (Array.isArray(response)) {
          wardsData = response;
        }
        setWards(wardsData);
        
        // If in edit mode and we have a ward name, find and set the ward code
        if (isEditMode && editModeNames.ward && wardsData.length > 0) {
          const wardObj = findBestMatch(editModeNames.ward, wardsData, 'ward');
          
          if (wardObj) {
            setFormData((prev) => ({ ...prev, ward: wardObj.code }));
          } else {
            // Try to keep the ward name in formData if no match found (user can see it)
            setFormData((prev) => ({ ...prev, ward: editModeNames.ward || '' }));
          }
        }
        
        // If wards array is empty but no districts available, still enable wards field
        // (user can manually enter or it might be available later)
        const hasWards = wardsData.length > 0;
        // If no districts available, always enable wards field (even if empty)
        const shouldEnableWards = !featuresAvailable.districts || hasWards;
        setFeaturesAvailable((prev) => ({ ...prev, wards: shouldEnableWards }));
        
        // Reset ward selection if no wards available and districts are required (only if not in edit mode)
        if (!hasWards && featuresAvailable.districts && !isEditMode) {
          setFormData((prev) => ({ ...prev, ward: '' }));
        }
      } catch (err) {
        setWards([]);
        // If no districts available, still enable wards field (user can enter manually)
        const shouldEnableWards = !featuresAvailable.districts;
        setFeaturesAvailable((prev) => ({ ...prev, wards: shouldEnableWards }));
      } finally {
        setLoadingOptions((prev) => ({ ...prev, wards: false }));
      }
    };

    loadWards();
  }, [formData.country, formData.city, formData.district, featuresAvailable.districts, isEditMode, editModeNames.ward, districts, cities]);

  // Re-match city when cities load and editModeNames is available
  useEffect(() => {
    if (isEditMode && editModeNames.city && cities.length > 0 && formData.country) {
      // Check if current city is already a valid code
      const cityIsValidCode = cities.some(c => c.code === formData.city);
      
      // If city is already a valid code, no need to re-match
      if (cityIsValidCode) {
        return;
      }
      
      // If city is not a valid code (could be name or invalid code), try to match it
      const cityObj = findBestMatch(editModeNames.city, cities, 'city');
      
      if (cityObj) {
        setFormData((prev) => ({
          ...prev,
          city: cityObj.code,
        }));
      } else {
        // Keep the original name if no match found
        if (formData.city !== editModeNames.city) {
          setFormData((prev) => ({
            ...prev,
            city: editModeNames.city,
          }));
        }
      }
    }
  }, [cities, editModeNames.city, isEditMode, formData.city, formData.country]);

  // Re-match district when districts load and editModeNames is available
  useEffect(() => {
    if (isEditMode && editModeNames.district && districts.length > 0 && formData.city) {
      // Check if current district is already a valid code
      const districtIsValidCode = districts.some(d => d.code === formData.district);
      
      // If district is already a valid code, no need to re-match
      if (districtIsValidCode) {
        return;
      }
      
      // If district is not a valid code (could be name or invalid code), try to match it
      const districtObj = findBestMatch(editModeNames.district, districts, 'district');
      
      if (districtObj) {
        setFormData((prev) => ({
          ...prev,
          district: districtObj.code,
        }));
      } else {
        // Keep the original name if no match found
        if (formData.district !== editModeNames.district) {
          setFormData((prev) => ({
            ...prev,
            district: editModeNames.district,
          }));
        }
      }
    }
  }, [districts, editModeNames.district, isEditMode, formData.district, formData.city]);

  // Re-match ward when wards load and editModeNames is available
  useEffect(() => {
    if (isEditMode && editModeNames.ward && wards.length > 0 && formData.city) {
      // Check if current ward is already a valid code
      const wardIsValidCode = wards.some(w => w.code === formData.ward);
      
      // If ward is already a valid code, no need to re-match
      if (wardIsValidCode) {
        return;
      }
      
      // If ward is not a valid code (could be name or invalid code), try to match it
      const wardObj = findBestMatch(editModeNames.ward, wards, 'ward');
      
      if (wardObj) {
        setFormData((prev) => ({
          ...prev,
          ward: wardObj.code,
        }));
      } else {
        // Keep the original name if no match found
        if (formData.ward !== editModeNames.ward) {
          setFormData((prev) => ({
            ...prev,
            ward: editModeNames.ward,
          }));
        }
      }
    }
  }, [wards, editModeNames.ward, isEditMode, formData.ward, formData.city]);

  // Pre-fill phone and country from customer when modal opens (only in add mode, not edit mode)
  useEffect(() => {
    // Don't run if we're in edit mode - let the initialData effect handle it
    if (isEditMode) return;
    
    if (customer && isOpen && !initialData) {
      const primaryAddress = customer.addresses?.find((a: any) => a.isDefault) || customer.addresses?.[0];
      const country = customer.country || primaryAddress?.country || 'VN';
      
      setFormData((prev) => ({
        ...prev,
        phone: customer.phone || prev.phone,
        country: country === 'Vietnam' ? 'VN' : country || prev.country,
      }));
    }
  }, [customer, isOpen, isEditMode, initialData]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        type: 'home',
        phone: '',
        country: '',
        city: '',
        district: '',
        ward: '',
        addressLine1: '',
        addressLine2: '',
        notes: '',
        useAsBilling: false,
      });
      setError(null);
    }
  }, [isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // Reset dependent fields when parent changes
      if (field === 'country') {
        newData.city = '';
        newData.district = '';
        newData.ward = '';
        setFeaturesAvailable({ districts: false, wards: false });
        setDropdownOpen({ country: false, city: false, district: false, ward: false }); // country is handled by component
      } else if (field === 'city') {
        newData.district = '';
        newData.ward = '';
        setFeaturesAvailable((prev) => ({ ...prev, wards: false }));
        setDropdownOpen((prev) => ({ ...prev, district: false, ward: false }));
      } else if (field === 'district') {
        newData.ward = '';
        setFeaturesAvailable((prev) => ({ ...prev, wards: false }));
        setDropdownOpen((prev) => ({ ...prev, ward: false }));
      }
      
      return newData;
    });
    setError(null);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.country || !formData.city || !formData.addressLine1) {
        const missingFields = [];
        if (!formData.country) missingFields.push('Country');
        if (!formData.city) missingFields.push('City');
        if (!formData.addressLine1) missingFields.push('Address Line 1');
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      // Helper to get name from code or keep name if already a name
      const getCountryName = () => {
        if (!formData.country) return undefined;
        // Check if it's a code (exists in countries array)
        const countryByCode = countries.find((c) => c.code === formData.country);
        if (countryByCode) return countryByCode.name;
        // Check if it's already a name (exists in countries array)
        const countryByName = countries.find((c) => c.name === formData.country);
        if (countryByName) return countryByName.name;
        // If not found, keep the value as is (could be a name from database)
        return formData.country;
      };

      const getCityName = () => {
        if (!formData.city) return undefined;
        // If selectedCity exists, use its name
        if (selectedCity) return selectedCity.name;
        // Check if formData.city is a code
        const cityByCode = cities.find((c) => c.code === formData.city);
        if (cityByCode) return cityByCode.name;
        // Check if formData.city is already a name
        const cityByName = cities.find((c) => c.name === formData.city);
        if (cityByName) return cityByName.name;
        // If not found, keep the value as is (could be a name from database)
        return formData.city;
      };

      const getDistrictName = () => {
        if (!formData.district) return undefined;
        // Check if it's a code (exists in districts array)
        const districtByCode = districts.find((d) => d.code === formData.district);
        if (districtByCode) return districtByCode.name;
        // Check if it's already a name (exists in districts array)
        const districtByName = districts.find((d) => d.name === formData.district);
        if (districtByName) return districtByName.name;
        // If not found in districts array, keep the value as is (could be a name from database)
        return formData.district;
      };

      const getWardName = () => {
        if (!formData.ward) return undefined;
        
        // Priority 1: Check if it's a code (exists in wards array)
        const wardByCode = wards.find((w) => w.code === formData.ward);
        if (wardByCode) return wardByCode.name;
        
        // Priority 2: Check if it's already a name (exists in wards array)
        const wardByName = wards.find((w) => w.name === formData.ward);
        if (wardByName) return wardByName.name;
        
        // Priority 3: If in edit mode and we have editModeNames, use that (it's the original name from database)
        // This ensures we always save the name, not the code
        if (isEditMode && editModeNames.ward) {
          return editModeNames.ward;
        }
        
        // Priority 4: If formData.ward looks like a code (numeric or alphanumeric code pattern),
        // don't save it as is - try to find the name or use editModeNames
        const isCodePattern = /^\d+$/.test(formData.ward) || /^[A-Z0-9]+$/i.test(formData.ward);
        if (isCodePattern) {
          // If it's a code but we can't find it, use editModeNames or return undefined
          return editModeNames.ward || undefined;
        }
        
        // Priority 5: If formData.ward is not a code pattern, it might be a name
        // Return it as is (this should be the name from database)
        return formData.ward;
      };

      // Resolve all values to names before saving
      const countryName = getCountryName();
      const cityName = getCityName();
      const districtName = getDistrictName();
      const wardName = getWardName();

      // Validate resolved values (ensure required fields are not undefined)
      if (!cityName) {
        setError('City is required. Please select a valid city.');
        setLoading(false);
        return;
      }

      if (!countryName && !formData.country) {
        setError('Country is required. Please select a valid country.');
        setLoading(false);
        return;
      }

      const addressData = {
        type: formData.type === 'home' ? 'shipping' : 'shipping', // Will be set to 'billing' if useAsBilling is true
        label: formData.type === 'home' ? 'Home' : 'Office',
        phone: formData.phone.trim() || undefined,
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || undefined,
        ward: wardName || undefined,
        district: districtName || undefined,
        city: cityName, // Required - already validated above
        country: countryName || formData.country, // Always save country name
        notes: formData.notes.trim() || undefined,
        useAsBilling: formData.useAsBilling,
        isDefault: isEditMode ? initialData?.isDefault : false, // Keep existing isDefault in edit mode
      };

      await onSubmit(addressData, addressId);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to add address');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background-light rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {isEditMode ? 'Edit Address' : 'Add New Address'}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {isEditMode ? 'Update address information' : 'Add new address for express delivery'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary"
            aria-label="Close modal"
            style={{
              transition: 'none !important',
              boxShadow: 'none !important',
              WebkitTransition: 'none !important',
              MozTransition: 'none !important',
              OTransition: 'none !important',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Address Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-3">
              Address Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleChange('type', 'home')}
                className={`p-4 rounded-lg border-2 ${
                  formData.type === 'home'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-600 bg-background-dark'
                }`}
                style={{
                  transition: 'none !important',
                  boxShadow: 'none !important',
                  WebkitTransition: 'none !important',
                  MozTransition: 'none !important',
                  OTransition: 'none !important',
                  msTransition: 'none !important',
                  backgroundColor: formData.type === 'home' ? 'rgba(124, 58, 237, 0.1)' : 'rgb(23, 23, 23)',
                  borderColor: formData.type === 'home' ? '#7c3aed' : 'rgb(75, 85, 99)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  if (formData.type === 'home') {
                    e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.1)';
                    e.currentTarget.style.borderColor = '#7c3aed';
                  } else {
                    e.currentTarget.style.backgroundColor = 'rgb(23, 23, 23)';
                    e.currentTarget.style.borderColor = 'rgb(75, 85, 99)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  if (formData.type === 'home') {
                    e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.1)';
                    e.currentTarget.style.borderColor = '#7c3aed';
                  } else {
                    e.currentTarget.style.backgroundColor = 'rgb(23, 23, 23)';
                    e.currentTarget.style.borderColor = 'rgb(75, 85, 99)';
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.type === 'home'
                        ? 'border-primary bg-primary'
                        : 'border-gray-500'
                    }`}
                  >
                    {formData.type === 'home' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Home size={20} className="text-text-primary" />
                      <span className="font-medium text-text-primary">Home</span>
                    </div>
                    <p className="text-xs text-text-secondary">Delivery time (9am-9pm)</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChange('type', 'office')}
                className={`p-4 rounded-lg border-2 ${
                  formData.type === 'office'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-600 bg-background-dark'
                }`}
                style={{
                  transition: 'none !important',
                  boxShadow: 'none !important',
                  WebkitTransition: 'none !important',
                  MozTransition: 'none !important',
                  OTransition: 'none !important',
                  msTransition: 'none !important',
                  backgroundColor: formData.type === 'office' ? 'rgba(124, 58, 237, 0.1)' : 'rgb(23, 23, 23)',
                  borderColor: formData.type === 'office' ? '#7c3aed' : 'rgb(75, 85, 99)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  if (formData.type === 'office') {
                    e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.1)';
                    e.currentTarget.style.borderColor = '#7c3aed';
                  } else {
                    e.currentTarget.style.backgroundColor = 'rgb(23, 23, 23)';
                    e.currentTarget.style.borderColor = 'rgb(75, 85, 99)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  if (formData.type === 'office') {
                    e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.1)';
                    e.currentTarget.style.borderColor = '#7c3aed';
                  } else {
                    e.currentTarget.style.backgroundColor = 'rgb(23, 23, 23)';
                    e.currentTarget.style.borderColor = 'rgb(75, 85, 99)';
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.type === 'office'
                        ? 'border-primary bg-primary'
                        : 'border-gray-500'
                    }`}
                  >
                    {formData.type === 'office' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 size={20} className="text-text-primary" />
                      <span className="font-medium text-text-primary">Office</span>
                    </div>
                    <p className="text-xs text-text-secondary">Delivery time (9am-5pm)</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Form Fields - Reordered */}
          <div className="space-y-4">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full h-10 bg-background-dark border border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                placeholder="+84 123 456 789"
              />
            </div>

            {/* Country */}
            <CountrySelectWithAlphabet
              value={formData.country}
              onChange={(code) => handleChange('country', code)}
              label="Country"
              required
            />

            {/* City */}
            <CitySelectWithAlphabet
              value={formData.city}
              onChange={(code) => handleChange('city', code)}
              countryCode={formData.country}
              cities={cities}
              loading={loadingOptions.cities}
              label="City / Province"
              required
              onLoadingChange={(loading) => setLoadingOptions(prev => ({ ...prev, cities: loading }))}
            />

            {/* District */}
            <DistrictSelectWithAlphabet
              value={formData.district}
              onChange={(code) => handleChange('district', code)}
              countryCode={formData.country}
              cityCode={formData.city}
              districts={districts}
              loading={loadingOptions.districts}
              label="District / County"
              featuresAvailable={featuresAvailable.districts}
              editModeName={editModeNames.district}
              onLoadingChange={(loading) => setLoadingOptions(prev => ({ ...prev, districts: loading }))}
            />

            {/* Ward */}
            <WardSelectWithAlphabet
              value={formData.ward}
              onChange={(code) => handleChange('ward', code)}
              countryCode={formData.country}
              cityCode={formData.city}
              districtCode={formData.district}
              wards={wards}
              loading={loadingOptions.wards}
              label="Ward / Commune"
              featuresAvailable={featuresAvailable}
              editModeName={editModeNames.ward}
              onLoadingChange={(loading) => setLoadingOptions(prev => ({ ...prev, wards: loading }))}
            />

            {/* Address Line 1 */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Street Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => handleChange('addressLine1', e.target.value)}
                className="w-full h-10 bg-background-dark border border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                placeholder="e.g., 123 Main Street"
                required
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                House / Building Number
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => handleChange('addressLine2', e.target.value)}
                className="w-full h-10 bg-background-dark border border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                placeholder="e.g., Building A, Floor 5, Room 501"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full min-h-[80px] bg-background-dark border border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary resize-none"
                placeholder="Additional notes or landmark (e.g., Nr. Hard Rock Cafe)"
              />
            </div>

            {/* Use as billing address toggle */}
            <div className="flex items-center gap-3 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.useAsBilling}
                  onChange={(e) => handleChange('useAsBilling', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span className="text-sm text-text-secondary">
                Use as a billing address?
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                transition: 'none !important',
                boxShadow: 'none !important',
                WebkitTransition: 'none !important',
                MozTransition: 'none !important',
                OTransition: 'none !important',
                msTransition: 'none !important',
                backgroundColor: '#7c3aed',
                color: 'rgb(255, 255, 255)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transition = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = '#7c3aed';
                e.currentTarget.style.color = 'rgb(255, 255, 255)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transition = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = '#7c3aed';
                e.currentTarget.style.color = 'rgb(255, 255, 255)';
              }}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 bg-background-dark text-text-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                transition: 'none !important',
                boxShadow: 'none !important',
                WebkitTransition: 'none !important',
                MozTransition: 'none !important',
                OTransition: 'none !important',
                msTransition: 'none !important',
                backgroundColor: 'rgb(23, 23, 23)',
                color: 'rgb(156, 163, 175)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transition = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = 'rgb(23, 23, 23)';
                e.currentTarget.style.color = 'rgb(156, 163, 175)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transition = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = 'rgb(23, 23, 23)';
                e.currentTarget.style.color = 'rgb(156, 163, 175)';
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewAddressModal;

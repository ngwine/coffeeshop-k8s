import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { fetchCitiesByCountry } from '../../../../../../api/addresses';

type CitySelectWithAlphabetProps = {
  value: string; // City code or name (will be normalized)
  onChange: (cityCode: string) => void;
  countryCode: string; // Required: country code to fetch cities
  cities?: Array<{ code: string; name: string; provinceCode?: string }>; // Optional: pass cities data to avoid duplicate fetching
  loading?: boolean; // Optional: pass loading state
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onDropdownOpenChange?: (isOpen: boolean) => void;
  onLoadingChange?: (loading: boolean) => void;
};

const CitySelectWithAlphabet: React.FC<CitySelectWithAlphabetProps> = ({
  value,
  onChange,
  countryCode,
  cities: citiesProp,
  loading: loadingProp,
  label,
  required = false,
  disabled = false,
  className = '',
  onDropdownOpenChange,
  onLoadingChange,
}) => {
  const [citiesInternal, setCitiesInternal] = useState<Array<{ code: string; name: string; provinceCode?: string }>>([]);
  const [loadingCitiesInternal, setLoadingCitiesInternal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [visibleCityLetter, setVisibleCityLetter] = useState<string | null>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const cityListRef = useRef<HTMLDivElement>(null);
  const alphabetSidebarRef = useRef<HTMLDivElement>(null);

  // Use prop cities if provided and not empty, otherwise use internal or fetch
  const cities = (citiesProp && citiesProp.length > 0) ? citiesProp : citiesInternal;
  const loadingCities = loadingProp !== undefined ? loadingProp : loadingCitiesInternal;

  // Fetch cities when country changes (only if cities prop not provided or is empty)
  useEffect(() => {
    // If parent provides cities and they're not empty, don't fetch
    if (citiesProp && citiesProp.length > 0) {
      return;
    }

    if (!countryCode) {
      setCitiesInternal([]);
      return;
    }

    const loadCities = async () => {
      setLoadingCitiesInternal(true);
      if (onLoadingChange) onLoadingChange(true);
      try {
        const response = await fetchCitiesByCountry(countryCode);
        let citiesData: Array<{ code: string; name: string; provinceCode?: string }> = [];
        if (response?.success && response?.data && Array.isArray(response.data)) {
          citiesData = response.data;
        } else if (Array.isArray(response)) {
          citiesData = response;
        }
        setCitiesInternal(citiesData);
      } catch (err: any) {
      } finally {
        setLoadingCitiesInternal(false);
        if (onLoadingChange) onLoadingChange(false);
      }
    };
    
    loadCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, citiesProp?.length]); // Only depend on citiesProp.length, not the whole array

  // Normalized value (city code) - memoized
  const normalizedValue = useMemo(() => {
    if (!value) {
      return '';
    }
    
    // If cities not loaded yet, return value as is
    if (cities.length === 0) {
      return String(value).trim();
    }
    
    const valueStr = String(value).trim();
    const valueUpper = valueStr.toUpperCase();
    const valueLower = valueStr.toLowerCase();
    
    // Try to find by code first (handle both string and number codes)
    let match = cities.find((c) => {
      const codeStr = String(c.code);
      return codeStr === valueStr || codeStr.toUpperCase() === valueUpper;
    });
    if (match) {
      return String(match.code);
    }
    
    // Try to find by name
    match = cities.find((c) => {
      const nameLower = c.name.toLowerCase();
      return nameLower === valueLower || 
             nameLower.includes(valueLower) ||
             valueLower.includes(nameLower);
    });
    if (match) {
      return String(match.code);
    }
    
    return valueStr;
  }, [cities, value]);

  // DON'T auto-normalize when cities are provided from parent
  // Parent (AddNewAddressModal) handles all matching and value updates
  // Component only uses normalizedValue for display purposes

  // Get first letter of selected city
  const getSelectedCityFirstLetter = (): string | null => {
    if (!normalizedValue || cities.length === 0) return null;
    const selectedCity = cities.find(c => String(c.code) === String(normalizedValue));
    if (!selectedCity) return null;
    return selectedCity.name.charAt(0).toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Notify parent about dropdown state change
  useEffect(() => {
    if (onDropdownOpenChange) {
      onDropdownOpenChange(dropdownOpen);
    }
  }, [dropdownOpen, onDropdownOpenChange]);

  // Scroll to selected option BEFORE dropdown is visible
  useLayoutEffect(() => {
    if (dropdownOpen && cityListRef.current) {
      const selectedOption = cityListRef.current.querySelector(`button[data-selected="true"]`);
      if (selectedOption) {
        selectedOption.scrollIntoView({
          behavior: 'auto',
          block: 'center',
          inline: 'nearest'
        });
      }
      
      const selectedLetter = getSelectedCityFirstLetter();
      if (selectedLetter && alphabetSidebarRef.current) {
        const letterButton = alphabetSidebarRef.current.querySelector(`button[data-letter="${selectedLetter}"]`);
        if (letterButton) {
          letterButton.scrollIntoView({
            behavior: 'auto',
            block: 'center',
            inline: 'nearest'
          });
        }
      }
    }
  }, [dropdownOpen, normalizedValue, cities]);

  // Also scroll to selected option when dropdown opens (with slight delay to ensure DOM is ready)
  useEffect(() => {
    if (dropdownOpen && cityListRef.current && normalizedValue) {
      // Use setTimeout to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        const selectedOption = cityListRef.current?.querySelector(`button[data-selected="true"]`);
        if (selectedOption) {
          selectedOption.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [dropdownOpen, normalizedValue, cities]);

  // Scroll alphabet sidebar to selected letter when value changes (even if dropdown is already open)
  useEffect(() => {
    if (dropdownOpen && alphabetSidebarRef.current) {
      const selectedLetter = getSelectedCityFirstLetter();
      if (selectedLetter) {
        const letterButton = alphabetSidebarRef.current.querySelector(`button[data-letter="${selectedLetter}"]`);
        if (letterButton) {
          // Use setTimeout to ensure DOM is ready
          setTimeout(() => {
            letterButton.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          }, 100);
        }
      }
    }
  }, [normalizedValue, dropdownOpen, cities]);

  // Scroll to letter in city list
  const scrollToLetter = (letter: string) => {
    if (!cityListRef.current) return;
    
    const buttons = cityListRef.current.querySelectorAll('button[data-city-name]');
    for (const button of Array.from(buttons)) {
      const cityName = button.getAttribute('data-city-name') || '';
      if (cityName.charAt(0).toUpperCase() === letter.toUpperCase()) {
        button.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
        break;
      }
    }
  };

  // Sync alphabet sidebar scroll with city list scroll (bidirectional)
  useEffect(() => {
    if (!dropdownOpen || !cityListRef.current || !alphabetSidebarRef.current) {
      setVisibleCityLetter(null);
      return;
    }

    const cityList = cityListRef.current;
    const alphabetSidebar = alphabetSidebarRef.current;
    let isScrollingCity = false;
    let isScrollingAlphabet = false;
    
    const handleCityScroll = () => {
      if (isScrollingAlphabet) return;
      
      const buttons = cityList.querySelectorAll('button[data-city-name]');
      const containerRect = cityList.getBoundingClientRect();
      
      for (const button of Array.from(buttons)) {
        const buttonRect = button.getBoundingClientRect();
        if (buttonRect.top >= containerRect.top && buttonRect.top <= containerRect.bottom) {
          const cityName = button.getAttribute('data-city-name') || '';
          const firstLetter = cityName.charAt(0).toUpperCase();
          
          setVisibleCityLetter(firstLetter);
          
          const letterButton = alphabetSidebar.querySelector(`button[data-letter="${firstLetter}"]`);
          if (letterButton) {
            isScrollingCity = true;
            letterButton.scrollIntoView({
              behavior: 'auto',
              block: 'center',
              inline: 'nearest'
            });
            setTimeout(() => { isScrollingCity = false; }, 100);
          }
          break;
        }
      }
    };

    const handleAlphabetScroll = () => {
      if (isScrollingCity) return;
      
      const letterButtons = alphabetSidebar.querySelectorAll('button[data-letter]');
      const sidebarRect = alphabetSidebar.getBoundingClientRect();
      
      for (const letterButton of Array.from(letterButtons)) {
        const buttonRect = letterButton.getBoundingClientRect();
        if (buttonRect.top >= sidebarRect.top && buttonRect.top <= sidebarRect.bottom) {
          const letter = letterButton.getAttribute('data-letter');
          if (letter) {
            const cityButtons = cityList.querySelectorAll('button[data-city-name]');
            for (const cityButton of Array.from(cityButtons)) {
              const cityName = cityButton.getAttribute('data-city-name') || '';
              if (cityName.charAt(0).toUpperCase() === letter) {
                isScrollingAlphabet = true;
                cityButton.scrollIntoView({
                  behavior: 'auto',
                  block: 'center',
                  inline: 'nearest'
                });
                setTimeout(() => { isScrollingAlphabet = false; }, 100);
                break;
              }
            }
          }
          break;
        }
      }
    };

    handleCityScroll();
    
    cityList.addEventListener('scroll', handleCityScroll);
    alphabetSidebar.addEventListener('scroll', handleAlphabetScroll);
    
    return () => {
      cityList.removeEventListener('scroll', handleCityScroll);
      alphabetSidebar.removeEventListener('scroll', handleAlphabetScroll);
    };
  }, [dropdownOpen, cities]);

  const selectedCityName = useMemo(() => {
    if (!normalizedValue) {
      return 'Select City';
    }
    
    // If cities are loaded, try to find the city name
    if (cities.length > 0) {
      const city = cities.find(c => String(c.code) === String(normalizedValue));
      if (city) {
        return city.name;
      }
      // If not found by code, maybe value is a name - try to find by name
      const cityByName = cities.find(c => 
        c.name.toLowerCase() === String(normalizedValue).toLowerCase() ||
        c.name.toLowerCase().includes(String(normalizedValue).toLowerCase())
      );
      if (cityByName) {
        return cityByName.name;
      }
    }
    
    // If cities not loaded yet but we have a value
    // Check if value looks like a code (numeric) - if so, don't show it, wait for cities to load
    const valueStr = String(normalizedValue).trim();
    const isNumericCode = /^\d+$/.test(valueStr);
    
    if (isNumericCode && cities.length === 0) {
      // Value is a code but cities not loaded - show placeholder
      return 'Select City';
    }
    
    // Value might be a name - show it
    if (!isNumericCode) {
      return valueStr;
    }
    
    return 'Select City';
  }, [normalizedValue, cities]);

  const isDisabled = disabled || !countryCode || loadingCities;

  return (
    <div className={`relative ${className}`} ref={cityDropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        disabled={isDisabled}
        className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary h-10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
        style={{
          transition: 'none !important',
          boxShadow: 'none !important',
          WebkitTransition: 'none !important',
          MozTransition: 'none !important',
          OTransition: 'none !important',
          msTransition: 'none !important',
          backgroundColor: 'rgb(23, 23, 23)', // bg-background-dark
          borderColor: 'rgb(75, 85, 99)', // border-gray-600
          color: normalizedValue ? 'rgb(229, 231, 235)' : 'rgb(156, 163, 175)', // text-text-primary or text-text-secondary
        }}
        onMouseEnter={(e) => {
          const currentColor = e.currentTarget.style.color || (normalizedValue ? 'rgb(229, 231, 235)' : 'rgb(156, 163, 175)');
          e.currentTarget.style.transition = 'none';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.backgroundColor = 'rgb(23, 23, 23)';
          e.currentTarget.style.borderColor = 'rgb(75, 85, 99)';
          e.currentTarget.style.color = currentColor;
        }}
        onMouseLeave={(e) => {
          const currentColor = e.currentTarget.style.color || (normalizedValue ? 'rgb(229, 231, 235)' : 'rgb(156, 163, 175)');
          e.currentTarget.style.transition = 'none';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.backgroundColor = 'rgb(23, 23, 23)';
          e.currentTarget.style.borderColor = 'rgb(75, 85, 99)';
          e.currentTarget.style.color = currentColor;
        }}
      >
        <span className={normalizedValue ? 'text-text-primary' : 'text-text-secondary'}>
          {!countryCode
            ? 'Select Country first'
            : loadingCities 
            ? 'Loading cities...' 
            : selectedCityName
          }
        </span>
        <ChevronDown 
          size={16} 
          className={`text-text-secondary ${dropdownOpen ? 'rotate-180' : ''}`}
          style={{
            transition: 'none !important',
            WebkitTransition: 'none !important',
            MozTransition: 'none !important',
            OTransition: 'none !important',
          }}
        />
      </button>
      {dropdownOpen && countryCode && (
        <div className="absolute z-[100] w-full mt-1 bg-background-dark border border-gray-600 rounded-lg shadow-xl overflow-hidden top-full flex max-h-[210px]">
          <div ref={cityListRef} className="flex-1 overflow-y-auto hide-scrollbar">
            {loadingCities ? (
              <div className="px-3 py-2 text-sm text-text-secondary">Loading cities...</div>
            ) : cities.length > 0 ? (
              cities.map((city) => (
                <button
                  key={city.code}
                  type="button"
                  data-city-name={city.name}
                  data-selected={String(normalizedValue) === String(city.code)}
                  onClick={() => {
                    onChange(String(city.code));
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm ${
                    String(normalizedValue) === String(city.code)
                      ? 'bg-primary/20 text-primary font-semibold'
                      : 'text-text-primary'
                  }`}
                  style={{
                    transition: 'none !important',
                    boxShadow: 'none !important',
                    WebkitTransition: 'none !important',
                    MozTransition: 'none !important',
                    OTransition: 'none !important',
                    msTransition: 'none !important',
                    backgroundColor: String(normalizedValue) === String(city.code) ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                    color: String(normalizedValue) === String(city.code) ? '#7c3aed' : 'rgb(229, 231, 235)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    if (String(normalizedValue) === String(city.code)) {
                      e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.2)';
                      e.currentTarget.style.color = '#7c3aed';
                    } else {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgb(229, 231, 235)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    if (String(normalizedValue) === String(city.code)) {
                      e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.2)';
                      e.currentTarget.style.color = '#7c3aed';
                    } else {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgb(229, 231, 235)';
                    }
                  }}
                >
                  {city.name}
                </button>
              ))
            ) : (
              !loadingCities && (
                <div className="px-3 py-2 text-sm text-text-secondary">No cities available</div>
              )
            )}
          </div>
          {/* Alphabet sidebar */}
          <div 
            ref={alphabetSidebarRef}
            className="flex flex-col items-center justify-start py-2 px-1 border-l border-gray-600 bg-background-light/30 flex-shrink-0 overflow-y-auto hide-scrollbar"
            style={{ maxHeight: '210px' }}
          >
              {Array.from({ length: 26 }, (_, i) => {
                const letter = String.fromCharCode(65 + i); // A-Z
                const selectedLetter = getSelectedCityFirstLetter();
                // Only highlight the letter of the selected item, not the visible one
                const isSelected = selectedLetter === letter;
                return (
                  <button
                    key={letter}
                    type="button"
                    data-letter={letter}
                    onClick={() => scrollToLetter(letter)}
                    className={`text-[10px] leading-none px-0.5 py-1.5 min-w-[16px] text-center flex items-center justify-center ${
                      isSelected
                        ? 'text-primary font-bold'
                        : 'text-text-secondary'
                    }`}
                    style={{
                      transition: 'none !important',
                      boxShadow: 'none !important',
                      WebkitTransition: 'none !important',
                      MozTransition: 'none !important',
                      OTransition: 'none !important',
                      msTransition: 'none !important',
                      backgroundColor: 'transparent',
                      color: isSelected ? '#7c3aed' : 'rgb(156, 163, 175)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transition = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      if (isSelected) {
                        e.currentTarget.style.color = '#7c3aed';
                      } else {
                        e.currentTarget.style.color = 'rgb(156, 163, 175)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transition = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      if (isSelected) {
                        e.currentTarget.style.color = '#7c3aed';
                      } else {
                        e.currentTarget.style.color = 'rgb(156, 163, 175)';
                      }
                    }}
                    title={`Scroll to cities starting with ${letter}`}
                  >
                    {letter}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CitySelectWithAlphabet;


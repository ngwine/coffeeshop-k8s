import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { fetchCountries } from '../../../../../../api/addresses';

type CountrySelectWithAlphabetProps = {
  value: string; // Country code or name (will be normalized)
  onChange: (countryCode: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onDropdownOpenChange?: (isOpen: boolean) => void; // Callback for parent to handle buttons position
};

const CountrySelectWithAlphabet: React.FC<CountrySelectWithAlphabetProps> = ({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  className = '',
  onDropdownOpenChange,
}) => {
  const [countries, setCountries] = useState<Array<{ code: string; name: string }>>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [visibleCountryLetter, setVisibleCountryLetter] = useState<string | null>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const countryListRef = useRef<HTMLDivElement>(null);
  const alphabetSidebarRef = useRef<HTMLDivElement>(null);

  // Fetch countries from API
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true);
      try {
        const response = await fetchCountries();
        let countriesData: Array<{ code: string; name: string }> = [];
        if (response?.success && response?.data && Array.isArray(response.data)) {
          countriesData = response.data;
        } else if (Array.isArray(response)) {
          countriesData = response;
        }
        setCountries(countriesData);
      } catch (err: any) {
      } finally {
        setLoadingCountries(false);
      }
    };
    
    loadCountries();
  }, []);

  // Normalized value (country code) - memoized to avoid recalculation
  const normalizedValue = useMemo(() => {
    if (!value || countries.length === 0) {
      return value || '';
    }
    
    const valueUpper = value.trim().toUpperCase();
    const valueLower = value.trim().toLowerCase();
    
    // Try to find by code first (exact match)
    let match = countries.find((c) => c.code.toUpperCase() === valueUpper);
    if (match) {
      return match.code;
    }
    
    // Try to find by name (case-insensitive, partial match)
    match = countries.find((c) => 
      c.name.toLowerCase() === valueLower || 
      c.name.toLowerCase().includes(valueLower) ||
      valueLower.includes(c.name.toLowerCase())
    );
    if (match) {
      return match.code;
    }
    
    // If no match found, return original value
    return value.trim();
  }, [countries, value]);

  // Update parent when value is normalized (if it changed) - only once when countries load
  const [hasNormalized, setHasNormalized] = useState(false);
  useEffect(() => {
    if (countries.length > 0 && value && normalizedValue !== value && !hasNormalized) {
      onChange(normalizedValue);
      setHasNormalized(true);
    }
  }, [countries.length, value, normalizedValue, onChange, hasNormalized]);

  // Get first letter of selected country
  const getSelectedCountryFirstLetter = (): string | null => {
    if (!normalizedValue || countries.length === 0) return null;
    const selectedCountry = countries.find(c => c.code === normalizedValue);
    if (!selectedCountry) return null;
    return selectedCountry.name.charAt(0).toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
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
    if (dropdownOpen && countryListRef.current) {
      const selectedOption = countryListRef.current.querySelector(`button[data-selected="true"]`);
      if (selectedOption) {
        selectedOption.scrollIntoView({
          behavior: 'auto',
          block: 'center',
          inline: 'nearest'
        });
      }
      
      // Also scroll alphabet sidebar to show selected letter
      const selectedLetter = getSelectedCountryFirstLetter();
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
  }, [dropdownOpen, normalizedValue, countries]);

  // Also scroll to selected option when dropdown opens (with slight delay to ensure DOM is ready)
  useEffect(() => {
    if (dropdownOpen && countryListRef.current && normalizedValue) {
      // Use setTimeout to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        const selectedOption = countryListRef.current?.querySelector(`button[data-selected="true"]`);
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
  }, [dropdownOpen, normalizedValue, countries]);

  // Scroll alphabet sidebar to selected letter when value changes (even if dropdown is already open)
  useEffect(() => {
    if (dropdownOpen && alphabetSidebarRef.current) {
      const selectedLetter = getSelectedCountryFirstLetter();
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
  }, [normalizedValue, dropdownOpen, countries]);

  // Scroll to letter in country list
  const scrollToLetter = (letter: string) => {
    if (!countryListRef.current) return;
    
    const buttons = countryListRef.current.querySelectorAll('button[data-country-name]');
    for (const button of Array.from(buttons)) {
      const countryName = button.getAttribute('data-country-name') || '';
      if (countryName.charAt(0).toUpperCase() === letter.toUpperCase()) {
        button.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
        break;
      }
    }
  };

  // Sync alphabet sidebar scroll with country list scroll (bidirectional)
  useEffect(() => {
    if (!dropdownOpen || !countryListRef.current || !alphabetSidebarRef.current) {
      setVisibleCountryLetter(null);
      return;
    }

    const countryList = countryListRef.current;
    const alphabetSidebar = alphabetSidebarRef.current;
    let isScrollingCountry = false;
    let isScrollingAlphabet = false;
    
    // When country list scrolls, update alphabet sidebar
    const handleCountryScroll = () => {
      if (isScrollingAlphabet) return;
      
      const buttons = countryList.querySelectorAll('button[data-country-name]');
      const containerRect = countryList.getBoundingClientRect();
      
      for (const button of Array.from(buttons)) {
        const buttonRect = button.getBoundingClientRect();
        if (buttonRect.top >= containerRect.top && buttonRect.top <= containerRect.bottom) {
          const countryName = button.getAttribute('data-country-name') || '';
          const firstLetter = countryName.charAt(0).toUpperCase();
          
          setVisibleCountryLetter(firstLetter);
          
          const letterButton = alphabetSidebar.querySelector(`button[data-letter="${firstLetter}"]`);
          if (letterButton) {
            isScrollingCountry = true;
            letterButton.scrollIntoView({
              behavior: 'auto',
              block: 'center',
              inline: 'nearest'
            });
            setTimeout(() => { isScrollingCountry = false; }, 100);
          }
          break;
        }
      }
    };

    // When alphabet sidebar scrolls, scroll country list to corresponding letter
    const handleAlphabetScroll = () => {
      if (isScrollingCountry) return;
      
      const letterButtons = alphabetSidebar.querySelectorAll('button[data-letter]');
      const sidebarRect = alphabetSidebar.getBoundingClientRect();
      
      for (const letterButton of Array.from(letterButtons)) {
        const buttonRect = letterButton.getBoundingClientRect();
        if (buttonRect.top >= sidebarRect.top && buttonRect.top <= sidebarRect.bottom) {
          const letter = letterButton.getAttribute('data-letter');
          if (letter) {
            const countryButtons = countryList.querySelectorAll('button[data-country-name]');
            for (const countryButton of Array.from(countryButtons)) {
              const countryName = countryButton.getAttribute('data-country-name') || '';
              if (countryName.charAt(0).toUpperCase() === letter) {
                isScrollingAlphabet = true;
                countryButton.scrollIntoView({
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

    handleCountryScroll();
    
    countryList.addEventListener('scroll', handleCountryScroll);
    alphabetSidebar.addEventListener('scroll', handleAlphabetScroll);
    
    return () => {
      countryList.removeEventListener('scroll', handleCountryScroll);
      alphabetSidebar.removeEventListener('scroll', handleAlphabetScroll);
    };
  }, [dropdownOpen, countries]);

  const selectedCountryName = normalizedValue 
    ? countries.find(c => c.code === normalizedValue)?.name || 'Select Country'
    : 'Select Country';

  return (
    <div className={`relative min-w-0 ${className}`} ref={countryDropdownRef}>
      {label && (
        <label className="block text-[11px] uppercase text-text-secondary mb-1.5">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        disabled={disabled || loadingCountries}
        className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary h-10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between min-w-0"
        style={{
          transition: 'none !important',
          boxShadow: 'none !important',
          WebkitTransition: 'none !important',
          MozTransition: 'none !important',
          OTransition: 'none !important',
          msTransition: 'none !important',
          backgroundColor: 'rgb(23, 23, 23)', // bg-background-dark - đồng bộ với input fields
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
        <span className={`truncate text-xs md:text-sm ${normalizedValue ? 'text-text-primary' : 'text-text-secondary'}`}>
          {loadingCountries 
            ? 'Loading countries...' 
            : selectedCountryName
          }
        </span>
        <ChevronDown 
          size={14} 
          className={`text-text-secondary flex-shrink-0 ml-1 md:ml-2 ${dropdownOpen ? 'rotate-180' : ''}`}
          style={{
            transition: 'none !important',
            WebkitTransition: 'none !important',
            MozTransition: 'none !important',
            OTransition: 'none !important',
          }} 
        />
      </button>
      {dropdownOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-background-dark border border-gray-600 rounded-lg shadow-xl overflow-hidden top-full flex max-h-[210px]">
          <div ref={countryListRef} className="flex-1 overflow-y-auto hide-scrollbar">
            {countries.length > 0 ? (
              countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  data-country-name={country.name}
                  data-selected={normalizedValue === country.code}
                  onClick={() => {
                    onChange(country.code);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm ${
                    normalizedValue === country.code
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
                    backgroundColor: normalizedValue === country.code ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                    color: normalizedValue === country.code ? '#7c3aed' : 'rgb(229, 231, 235)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    if (normalizedValue === country.code) {
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
                    if (normalizedValue === country.code) {
                      e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.2)';
                      e.currentTarget.style.color = '#7c3aed';
                    } else {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgb(229, 231, 235)';
                    }
                  }}
                >
                  {country.name}
                </button>
              ))
            ) : (
              !loadingCountries && (
                <div className="px-3 py-2 text-sm text-text-secondary">No countries available</div>
              )
            )}
          </div>
          {/* Alphabet sidebar - scrollable, syncs with country list scroll */}
          <div 
            ref={alphabetSidebarRef}
            className="flex flex-col items-center justify-start py-2 px-1 border-l border-gray-600 bg-background-light/30 flex-shrink-0 overflow-y-auto hide-scrollbar"
            style={{ maxHeight: '210px' }}
          >
              {Array.from({ length: 26 }, (_, i) => {
                const letter = String.fromCharCode(65 + i); // A-Z
                const selectedLetter = getSelectedCountryFirstLetter();
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
                    title={`Scroll to countries starting with ${letter}`}
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

export default CountrySelectWithAlphabet;


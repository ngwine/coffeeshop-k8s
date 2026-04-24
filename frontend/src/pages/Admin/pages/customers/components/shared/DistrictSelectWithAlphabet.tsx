import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { fetchDistrictsByCity } from '../../../../../../api/addresses';

type DistrictSelectWithAlphabetProps = {
  value: string; // District code or name (will be normalized)
  onChange: (districtCode: string) => void;
  countryCode: string;
  cityCode: string; // Required: city code to fetch districts
  districts?: Array<{ code: string; name: string }>; // Optional: pass districts data to avoid duplicate fetching
  loading?: boolean; // Optional: pass loading state
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onDropdownOpenChange?: (isOpen: boolean) => void;
  onLoadingChange?: (loading: boolean) => void;
  featuresAvailable?: boolean; // Whether districts are available for this location
  editModeName?: string; // Original name from database for edit mode
};

const DistrictSelectWithAlphabet: React.FC<DistrictSelectWithAlphabetProps> = ({
  value,
  onChange,
  countryCode,
  cityCode,
  districts: districtsProp,
  loading: loadingProp,
  label,
  required = false,
  disabled = false,
  className = '',
  onDropdownOpenChange,
  onLoadingChange,
  featuresAvailable = true,
  editModeName,
}) => {
  const [districtsInternal, setDistrictsInternal] = useState<Array<{ code: string; name: string }>>([]);
  const [loadingDistrictsInternal, setLoadingDistrictsInternal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [visibleDistrictLetter, setVisibleDistrictLetter] = useState<string | null>(null);
  const districtDropdownRef = useRef<HTMLDivElement>(null);
  const districtListRef = useRef<HTMLDivElement>(null);
  const alphabetSidebarRef = useRef<HTMLDivElement>(null);

  // Use prop districts if provided, otherwise fetch internally
  const districts = districtsProp || districtsInternal;
  const loadingDistricts = loadingProp !== undefined ? loadingProp : loadingDistrictsInternal;

  // Fetch districts when city changes (only if districts prop not provided)
  useEffect(() => {
    if (districtsProp !== undefined) {
      // Parent is providing districts, don't fetch
      return;
    }

    if (!countryCode || !cityCode) {
      setDistrictsInternal([]);
      return;
    }

    const loadDistricts = async () => {
      setLoadingDistrictsInternal(true);
      if (onLoadingChange) onLoadingChange(true);
      try {
        const response = await fetchDistrictsByCity(countryCode, cityCode);
        let districtsData: Array<{ code: string; name: string }> = [];
        if (response?.success && response?.data && Array.isArray(response.data)) {
          districtsData = response.data;
        } else if (Array.isArray(response)) {
          districtsData = response;
        }
        setDistrictsInternal(districtsData);
      } catch (err: any) {
      } finally {
        setLoadingDistrictsInternal(false);
        if (onLoadingChange) onLoadingChange(false);
      }
    };
    
    loadDistricts();
  }, [countryCode, cityCode, districtsProp, onLoadingChange]);

  // Normalized value (district code) - memoized
  const normalizedValue = useMemo(() => {
    if (!value || districts.length === 0) {
      return value || '';
    }
    
    const valueUpper = value.trim().toUpperCase();
    const valueLower = value.trim().toLowerCase();
    
    // Try to find by code first
    let match = districts.find((d) => d.code.toUpperCase() === valueUpper);
    if (match) {
      return match.code;
    }
    
    // Try to find by name
    match = districts.find((d) => 
      d.name.toLowerCase() === valueLower || 
      d.name.toLowerCase().includes(valueLower) ||
      valueLower.includes(d.name.toLowerCase())
    );
    if (match) {
      return match.code;
    }
    
    return value.trim();
  }, [districts, value]);

  // Update parent when value is normalized
  const [hasNormalized, setHasNormalized] = useState(false);
  useEffect(() => {
    if (districts.length > 0 && value && normalizedValue !== value && !hasNormalized) {
      onChange(normalizedValue);
      setHasNormalized(true);
    }
  }, [districts.length, value, normalizedValue, onChange, hasNormalized]);

  // Reset hasNormalized when city changes
  useEffect(() => {
    setHasNormalized(false);
  }, [cityCode]);

  // Get first letter of selected district
  const getSelectedDistrictFirstLetter = (): string | null => {
    if (!normalizedValue || districts.length === 0) return null;
    const selectedDistrict = districts.find(d => d.code === normalizedValue);
    if (!selectedDistrict) return null;
    return selectedDistrict.name.charAt(0).toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (districtDropdownRef.current && !districtDropdownRef.current.contains(event.target as Node)) {
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
    if (dropdownOpen && districtListRef.current && normalizedValue) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const selectedOption = districtListRef.current?.querySelector(`button[data-selected="true"]`);
        if (selectedOption) {
          selectedOption.scrollIntoView({
            behavior: 'auto',
            block: 'center',
            inline: 'nearest'
          });
        }
        
        const selectedLetter = getSelectedDistrictFirstLetter();
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
      });
    }
  }, [dropdownOpen, normalizedValue, districts]);

  // Also scroll to selected option when dropdown opens (with delay to ensure DOM is ready)
  useEffect(() => {
    if (dropdownOpen && districtListRef.current && normalizedValue) {
      // Use setTimeout to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        const selectedOption = districtListRef.current?.querySelector(`button[data-selected="true"]`);
        if (selectedOption) {
          selectedOption.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [dropdownOpen, normalizedValue, districts]);

  // Scroll alphabet sidebar to selected letter when value changes (even if dropdown is already open)
  useEffect(() => {
    if (dropdownOpen && alphabetSidebarRef.current) {
      const selectedLetter = getSelectedDistrictFirstLetter();
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
  }, [normalizedValue, dropdownOpen, districts]);

  // Scroll to letter in district list
  const scrollToLetter = (letter: string) => {
    if (!districtListRef.current) return;
    
    const buttons = districtListRef.current.querySelectorAll('button[data-district-name]');
    for (const button of Array.from(buttons)) {
      const districtName = button.getAttribute('data-district-name') || '';
      if (districtName.charAt(0).toUpperCase() === letter.toUpperCase()) {
        button.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
        break;
      }
    }
  };

  // Sync alphabet sidebar scroll with district list scroll (bidirectional)
  useEffect(() => {
    if (!dropdownOpen || !districtListRef.current || !alphabetSidebarRef.current) {
      setVisibleDistrictLetter(null);
      return;
    }

    const districtList = districtListRef.current;
    const alphabetSidebar = alphabetSidebarRef.current;
    let isScrollingDistrict = false;
    let isScrollingAlphabet = false;
    
    const handleDistrictScroll = () => {
      if (isScrollingAlphabet) return;
      
      const buttons = districtList.querySelectorAll('button[data-district-name]');
      const containerRect = districtList.getBoundingClientRect();
      
      for (const button of Array.from(buttons)) {
        const buttonRect = button.getBoundingClientRect();
        if (buttonRect.top >= containerRect.top && buttonRect.top <= containerRect.bottom) {
          const districtName = button.getAttribute('data-district-name') || '';
          const firstLetter = districtName.charAt(0).toUpperCase();
          
          setVisibleDistrictLetter(firstLetter);
          
          const letterButton = alphabetSidebar.querySelector(`button[data-letter="${firstLetter}"]`);
          if (letterButton) {
            isScrollingDistrict = true;
            letterButton.scrollIntoView({
              behavior: 'auto',
              block: 'center',
              inline: 'nearest'
            });
            setTimeout(() => { isScrollingDistrict = false; }, 100);
          }
          break;
        }
      }
    };

    const handleAlphabetScroll = () => {
      if (isScrollingDistrict) return;
      
      const letterButtons = alphabetSidebar.querySelectorAll('button[data-letter]');
      const sidebarRect = alphabetSidebar.getBoundingClientRect();
      
      for (const letterButton of Array.from(letterButtons)) {
        const buttonRect = letterButton.getBoundingClientRect();
        if (buttonRect.top >= sidebarRect.top && buttonRect.top <= sidebarRect.bottom) {
          const letter = letterButton.getAttribute('data-letter');
          if (letter) {
            const districtButtons = districtList.querySelectorAll('button[data-district-name]');
            for (const districtButton of Array.from(districtButtons)) {
              const districtName = districtButton.getAttribute('data-district-name') || '';
              if (districtName.charAt(0).toUpperCase() === letter) {
                isScrollingAlphabet = true;
                districtButton.scrollIntoView({
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

    handleDistrictScroll();
    
    districtList.addEventListener('scroll', handleDistrictScroll);
    alphabetSidebar.addEventListener('scroll', handleAlphabetScroll);
    
    return () => {
      districtList.removeEventListener('scroll', handleDistrictScroll);
      alphabetSidebar.removeEventListener('scroll', handleAlphabetScroll);
    };
  }, [dropdownOpen, districts]);

  // Get display name
  const getDisplayName = (): string => {
    if (!cityCode) return 'Select City first';
    if (normalizedValue) {
      const district = districts.find(d => d.code === normalizedValue);
      if (district) return district.name;
      // If not found but we have editModeName, use it
      if (editModeName) return editModeName;
    }
    if (loadingDistricts) return 'Loading districts...';
    if (!featuresAvailable && districts.length === 0) return 'Not available for this location';
    return 'Select District';
  };

  const isDisabled = disabled || !cityCode || (!featuresAvailable && districts.length === 0 && !loadingDistricts && !value);

  return (
    <div className={`relative ${className}`} ref={districtDropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => {
          if (cityCode && (featuresAvailable || loadingDistricts || value)) {
            setDropdownOpen(!dropdownOpen);
          }
        }}
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
          {getDisplayName()}
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
      {dropdownOpen && cityCode && (featuresAvailable || loadingDistricts || value) && (
        <div className="absolute z-[100] w-full mt-1 bg-background-dark border border-gray-600 rounded-lg shadow-xl overflow-hidden top-full flex max-h-[210px]">
          <div ref={districtListRef} className="flex-1 overflow-y-auto hide-scrollbar">
            {districts.length > 0 ? (
              <>
                {districts.map((district) => (
                  <button
                    key={district.code}
                    type="button"
                    data-district-name={district.name}
                    data-selected={normalizedValue === district.code}
                    onClick={() => {
                      onChange(district.code);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm ${
                      normalizedValue === district.code
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
                      backgroundColor: normalizedValue === district.code ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                      color: normalizedValue === district.code ? '#7c3aed' : 'rgb(229, 231, 235)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transition = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      if (normalizedValue === district.code) {
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
                      if (normalizedValue === district.code) {
                        e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.2)';
                        e.currentTarget.style.color = '#7c3aed';
                      } else {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'rgb(229, 231, 235)';
                      }
                    }}
                  >
                    {district.name}
                  </button>
                ))}
                {/* Option to clear district if it has a value but not in the list */}
                {value && !districts.some(d => d.code === normalizedValue || d.name === value) && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange('');
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-text-primary border-t border-gray-600"
                    style={{
                      transition: 'none !important',
                      boxShadow: 'none !important',
                      WebkitTransition: 'none !important',
                      MozTransition: 'none !important',
                      OTransition: 'none !important',
                      msTransition: 'none !important',
                      backgroundColor: 'transparent',
                      color: 'rgb(229, 231, 235)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transition = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgb(229, 231, 235)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transition = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgb(229, 231, 235)';
                    }}
                  >
                    Clear selection
                  </button>
                )}
              </>
            ) : (
              !loadingDistricts && (
                <div className="px-3 py-2 text-sm text-text-secondary">
                  {value || editModeName ? (
                    <div>
                      <div className="mb-2">No districts available for this location</div>
                      <button
                        type="button"
                        onClick={() => {
                          onChange('');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-2 py-1 text-sm text-primary rounded"
                        style={{
                          transition: 'none !important',
                          boxShadow: 'none !important',
                          WebkitTransition: 'none !important',
                          MozTransition: 'none !important',
                          OTransition: 'none !important',
                          msTransition: 'none !important',
                          backgroundColor: 'transparent',
                          color: '#7c3aed',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transition = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#7c3aed';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transition = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#7c3aed';
                        }}
                      >
                        Clear current value: {editModeName || value}
                      </button>
                    </div>
                  ) : (
                    'No districts available'
                  )}
                </div>
              )
            )}
          </div>
          {/* Alphabet sidebar */}
          {districts.length > 0 && (
            <div 
              ref={alphabetSidebarRef}
              className="flex flex-col items-center justify-start py-2 px-1 border-l border-gray-600 bg-background-light/30 flex-shrink-0 overflow-y-auto hide-scrollbar"
              style={{ maxHeight: '210px' }}
            >
              {Array.from({ length: 26 }, (_, i) => {
                const letter = String.fromCharCode(65 + i); // A-Z
                const selectedLetter = getSelectedDistrictFirstLetter();
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
                    title={`Scroll to districts starting with ${letter}`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DistrictSelectWithAlphabet;


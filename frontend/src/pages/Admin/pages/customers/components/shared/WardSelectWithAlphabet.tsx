import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { fetchWardsByDistrict } from '../../../../../../api/addresses';

type WardSelectWithAlphabetProps = {
  value: string; // Ward code or name (will be normalized)
  onChange: (wardCode: string) => void;
  countryCode: string;
  cityCode: string;
  districtCode?: string; // Optional: district code to fetch wards
  wards?: Array<{ code: string; name: string }>; // Optional: pass wards data to avoid duplicate fetching
  loading?: boolean; // Optional: pass loading state
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onDropdownOpenChange?: (isOpen: boolean) => void;
  onLoadingChange?: (loading: boolean) => void;
  featuresAvailable?: { districts: boolean; wards: boolean }; // Whether districts/wards are available
  editModeName?: string; // Original name from database for edit mode
};

const WardSelectWithAlphabet: React.FC<WardSelectWithAlphabetProps> = ({
  value,
  onChange,
  countryCode,
  cityCode,
  districtCode,
  wards: wardsProp,
  loading: loadingProp,
  label,
  required = false,
  disabled = false,
  className = '',
  onDropdownOpenChange,
  onLoadingChange,
  featuresAvailable = { districts: true, wards: true },
  editModeName,
}) => {
  const [wardsInternal, setWardsInternal] = useState<Array<{ code: string; name: string }>>([]);
  const [loadingWardsInternal, setLoadingWardsInternal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [visibleWardLetter, setVisibleWardLetter] = useState<string | null>(null);
  const wardDropdownRef = useRef<HTMLDivElement>(null);
  const wardListRef = useRef<HTMLDivElement>(null);
  const alphabetSidebarRef = useRef<HTMLDivElement>(null);

  // Use prop wards if provided and not empty, otherwise use internal or fetch
  const wards = (wardsProp && wardsProp.length > 0) ? wardsProp : wardsInternal;
  const loadingWards = loadingProp !== undefined ? loadingProp : loadingWardsInternal;

  // Fetch wards when district or city changes (only if wards prop not provided or is empty)
  useEffect(() => {
    // If parent provides wards and they're not empty, don't fetch
    if (wardsProp && wardsProp.length > 0) {
      return;
    }

    if (!countryCode || !cityCode) {
      setWardsInternal([]);
      return;
    }

    // If districts are available, we need districtCode. Otherwise, fetch by city only.
    if (featuresAvailable.districts && !districtCode) {
      setWardsInternal([]);
      return;
    }

    const loadWards = async () => {
      setLoadingWardsInternal(true);
      if (onLoadingChange) onLoadingChange(true);
      try {
        // If districts are available, use district. Otherwise, use city.
        const response = featuresAvailable.districts && districtCode
          ? await fetchWardsByDistrict(countryCode, cityCode, districtCode)
          : await fetchWardsByDistrict(countryCode, cityCode, ''); // Some APIs might support city-only
        
        let wardsData: Array<{ code: string; name: string }> = [];
        if (response?.success && response?.data && Array.isArray(response.data)) {
          wardsData = response.data;
        } else if (Array.isArray(response)) {
          wardsData = response;
        }
        setWardsInternal(wardsData);
      } catch (err: any) {
      } finally {
        setLoadingWardsInternal(false);
        if (onLoadingChange) onLoadingChange(false);
      }
    };
    
    loadWards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, cityCode, districtCode, featuresAvailable.districts, wardsProp?.length]); // Only depend on wardsProp.length, not the whole array

  // Normalized value (ward code) - memoized
  const normalizedValue = useMemo(() => {
    if (!value) {
      return '';
    }
    
    // If wards not loaded yet, return value as is
    if (wards.length === 0) {
      return String(value).trim();
    }
    
    const valueStr = String(value).trim();
    const valueUpper = valueStr.toUpperCase();
    const valueLower = valueStr.toLowerCase();
    
    // Try to find by code first (handle both string and number codes)
    let match = wards.find((w) => {
      const codeStr = String(w.code);
      return codeStr === valueStr || codeStr.toUpperCase() === valueUpper;
    });
    if (match) {
      return String(match.code);
    }
    
    // Try to find by name
    match = wards.find((w) => {
      const nameLower = w.name.toLowerCase();
      return nameLower === valueLower || 
             nameLower.includes(valueLower) ||
             valueLower.includes(nameLower);
    });
    if (match) {
      return String(match.code);
    }
    
    return valueStr;
  }, [wards, value]);

  // DON'T auto-normalize when wards are provided from parent
  // Parent (AddNewAddressModal) handles all matching and value updates
  // Component only uses normalizedValue for display purposes

  // Helper function to remove "Phường" and "Ward" prefix from ward name
  const removeWardPrefix = (wardName: string): string => {
    if (!wardName) return wardName;
    return wardName
      .replace(/^Phường\s+/i, '')
      .replace(/^Ward\s+/i, '')
      .trim();
  };

  // Get first letter of selected ward (after removing prefix)
  const getSelectedWardFirstLetter = (): string | null => {
    if (!normalizedValue || wards.length === 0) return null;
    const selectedWard = wards.find(w => String(w.code) === String(normalizedValue));
    if (!selectedWard) return null;
    const displayName = removeWardPrefix(selectedWard.name);
    return displayName.charAt(0).toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wardDropdownRef.current && !wardDropdownRef.current.contains(event.target as Node)) {
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
    if (dropdownOpen && wardListRef.current && normalizedValue) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const selectedOption = wardListRef.current?.querySelector(`button[data-selected="true"]`);
        if (selectedOption) {
          selectedOption.scrollIntoView({
            behavior: 'auto',
            block: 'center',
            inline: 'nearest'
          });
        }
        
        const selectedLetter = getSelectedWardFirstLetter();
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
  }, [dropdownOpen, normalizedValue, wards]);

  // Also scroll to selected option when dropdown opens (with delay to ensure DOM is ready)
  useEffect(() => {
    if (dropdownOpen && wardListRef.current && normalizedValue) {
      // Use setTimeout to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        const selectedOption = wardListRef.current?.querySelector(`button[data-selected="true"]`);
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
  }, [dropdownOpen, normalizedValue, wards]);

  // Scroll alphabet sidebar to selected letter when value changes (even if dropdown is already open)
  useEffect(() => {
    if (dropdownOpen && alphabetSidebarRef.current) {
      const selectedLetter = getSelectedWardFirstLetter();
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
  }, [normalizedValue, dropdownOpen, wards]);

  // Scroll to letter in ward list
  const scrollToLetter = (letter: string) => {
    if (!wardListRef.current) return;
    
    const buttons = wardListRef.current.querySelectorAll('button[data-ward-name]');
    for (const button of Array.from(buttons)) {
      const wardName = button.getAttribute('data-ward-name') || '';
      const displayName = removeWardPrefix(wardName);
      if (displayName.charAt(0).toUpperCase() === letter.toUpperCase()) {
        button.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
        break;
      }
    }
  };

  // Sync alphabet sidebar scroll with ward list scroll (bidirectional)
  useEffect(() => {
    if (!dropdownOpen || !wardListRef.current || !alphabetSidebarRef.current) {
      setVisibleWardLetter(null);
      return;
    }

    const wardList = wardListRef.current;
    const alphabetSidebar = alphabetSidebarRef.current;
    let isScrollingWard = false;
    let isScrollingAlphabet = false;
    
    const handleWardScroll = () => {
      if (isScrollingAlphabet) return;
      
      const buttons = wardList.querySelectorAll('button[data-ward-name]');
      const containerRect = wardList.getBoundingClientRect();
      
      for (const button of Array.from(buttons)) {
        const buttonRect = button.getBoundingClientRect();
        if (buttonRect.top >= containerRect.top && buttonRect.top <= containerRect.bottom) {
          const wardName = button.getAttribute('data-ward-name') || '';
          const displayName = removeWardPrefix(wardName);
          const firstLetter = displayName.charAt(0).toUpperCase();
          
          setVisibleWardLetter(firstLetter);
          
          const letterButton = alphabetSidebar.querySelector(`button[data-letter="${firstLetter}"]`);
          if (letterButton) {
            isScrollingWard = true;
            letterButton.scrollIntoView({
              behavior: 'auto',
              block: 'center',
              inline: 'nearest'
            });
            setTimeout(() => { isScrollingWard = false; }, 100);
          }
          break;
        }
      }
    };

    const handleAlphabetScroll = () => {
      if (isScrollingWard) return;
      
      const letterButtons = alphabetSidebar.querySelectorAll('button[data-letter]');
      const sidebarRect = alphabetSidebar.getBoundingClientRect();
      
      for (const letterButton of Array.from(letterButtons)) {
        const buttonRect = letterButton.getBoundingClientRect();
        if (buttonRect.top >= sidebarRect.top && buttonRect.top <= sidebarRect.bottom) {
          const letter = letterButton.getAttribute('data-letter');
          if (letter) {
            const wardButtons = wardList.querySelectorAll('button[data-ward-name]');
            for (const wardButton of Array.from(wardButtons)) {
              const wardName = wardButton.getAttribute('data-ward-name') || '';
              const displayName = removeWardPrefix(wardName);
              if (displayName.charAt(0).toUpperCase() === letter) {
                isScrollingAlphabet = true;
                wardButton.scrollIntoView({
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

    handleWardScroll();
    
    wardList.addEventListener('scroll', handleWardScroll);
    alphabetSidebar.addEventListener('scroll', handleAlphabetScroll);
    
    return () => {
      wardList.removeEventListener('scroll', handleWardScroll);
      alphabetSidebar.removeEventListener('scroll', handleAlphabetScroll);
    };
  }, [dropdownOpen, wards]);

  // Get display name
  const getDisplayName = (): string => {
    if (!cityCode) return 'Select City first';
    if (featuresAvailable.districts && !districtCode) return 'Select District first';
    
    // If no value, show placeholder
    if (!value) {
      if (loadingWards) return 'Loading wards...';
      if (!featuresAvailable.wards && wards.length === 0 && featuresAvailable.districts) {
        return 'Not available for this location';
      }
      return 'Select Ward';
    }
    
    const valueStr = String(value).trim();
    const isNumericCode = /^\d+$/.test(valueStr);
    
    // If wards are loaded, try to find the ward by code or name
    if (wards.length > 0) {
      // Priority 1: Try to find by value directly as code (most common case)
      const wardByValueCode = wards.find(w => String(w.code) === valueStr);
      if (wardByValueCode) {
        return removeWardPrefix(wardByValueCode.name);
      }
      
      // Priority 2: Try to find by normalizedValue (code)
      if (normalizedValue && String(normalizedValue) !== valueStr) {
        const wardByCode = wards.find(w => String(w.code) === String(normalizedValue));
        if (wardByCode) {
          return removeWardPrefix(wardByCode.name);
        }
      }
      
      // Priority 3: Always show name from editModeName if available (it's the original name from DB)
      if (editModeName) {
        const wardByName = wards.find((w) => w.name === editModeName);
        if (wardByName) return removeWardPrefix(wardByName.name);
        // If editModeName doesn't match exactly, try fuzzy match
        const wardByFuzzyName = wards.find((w) => {
          const nameLower = w.name.toLowerCase();
          const editNameLower = editModeName.toLowerCase();
          return nameLower === editNameLower || 
                 nameLower.includes(editNameLower) ||
                 editNameLower.includes(nameLower);
        });
        if (wardByFuzzyName) return removeWardPrefix(wardByFuzzyName.name);
        // If still no match, show editModeName without prefix
        return removeWardPrefix(editModeName);
      }
      
      // Priority 4: Try to find by name (fuzzy match) - only if value is not a numeric code
      if (!isNumericCode) {
        const wardByName = wards.find(w => {
          const nameLower = w.name.toLowerCase();
          const valueLower = valueStr.toLowerCase();
          return nameLower === valueLower || 
                 nameLower.includes(valueLower) ||
                 valueLower.includes(nameLower);
        });
        if (wardByName) return removeWardPrefix(wardByName.name);
      }
      
      // If value is a numeric code but not found in wards, NEVER show the code
      if (isNumericCode) {
        if (loadingWards) return 'Loading wards...';
        // Don't show the code, show placeholder instead
        return 'Select Ward';
      }
      
      // Value might be a name that doesn't match - show it (without prefix if it has one)
      // But only if it's not a numeric code
      return removeWardPrefix(valueStr);
    }
    
    // If wards not loaded yet but we have a value
    // Check if value looks like a code (numeric) - if so, don't show it, wait for wards to load
    // valueStr and isNumericCode are already defined above
    if (isNumericCode) {
      if (loadingWards) return 'Loading wards...';
      // NEVER show numeric code, always show placeholder
      return 'Select Ward';
    }
    
    // Value might be a name - show it (without prefix if it has one)
    if (loadingWards) return 'Loading wards...';
    return removeWardPrefix(valueStr);
  };

  const isDisabled = disabled || !cityCode || (featuresAvailable.districts && !districtCode);

  return (
    <div className={`relative ${className}`} ref={wardDropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => {
          if (cityCode && (!featuresAvailable.districts || (featuresAvailable.districts && districtCode))) {
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
          color: (normalizedValue || editModeName) ? 'rgb(229, 231, 235)' : 'rgb(156, 163, 175)', // text-text-primary or text-text-secondary
        }}
        onMouseEnter={(e) => {
          const currentColor = e.currentTarget.style.color || ((normalizedValue || editModeName) ? 'rgb(229, 231, 235)' : 'rgb(156, 163, 175)');
          e.currentTarget.style.transition = 'none';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.backgroundColor = 'rgb(23, 23, 23)';
          e.currentTarget.style.borderColor = 'rgb(75, 85, 99)';
          e.currentTarget.style.color = currentColor;
        }}
        onMouseLeave={(e) => {
          const currentColor = e.currentTarget.style.color || ((normalizedValue || editModeName) ? 'rgb(229, 231, 235)' : 'rgb(156, 163, 175)');
          e.currentTarget.style.transition = 'none';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.backgroundColor = 'rgb(23, 23, 23)';
          e.currentTarget.style.borderColor = 'rgb(75, 85, 99)';
          e.currentTarget.style.color = currentColor;
        }}
      >
        <span className={normalizedValue || editModeName ? 'text-text-primary' : 'text-text-secondary'}>
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
      {dropdownOpen && cityCode && (!featuresAvailable.districts || (featuresAvailable.districts && districtCode)) && (
        <div className="absolute z-[100] w-full mt-1 bg-background-dark border border-gray-600 rounded-lg shadow-xl overflow-hidden top-full flex max-h-[210px]">
          <div ref={wardListRef} className="flex-1 overflow-y-auto hide-scrollbar">
            {loadingWards ? (
              <div className="px-3 py-2 text-sm text-text-secondary">Loading wards...</div>
            ) : wards.length > 0 ? (
              <>
                {wards.map((ward) => (
                  <button
                    key={ward.code}
                    type="button"
                    data-ward-name={ward.name}
                  data-selected={String(normalizedValue) === String(ward.code)}
                  onClick={() => {
                    onChange(String(ward.code));
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm ${
                    String(normalizedValue) === String(ward.code)
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
                    backgroundColor: String(normalizedValue) === String(ward.code) ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                    color: String(normalizedValue) === String(ward.code) ? '#7c3aed' : 'rgb(229, 231, 235)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    if (String(normalizedValue) === String(ward.code)) {
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
                    if (String(normalizedValue) === String(ward.code)) {
                      e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.2)';
                      e.currentTarget.style.color = '#7c3aed';
                    } else {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgb(229, 231, 235)';
                    }
                  }}
                  >
                    {removeWardPrefix(ward.name)}
                  </button>
                ))}
                {/* Option to clear ward if it has a value but not in the list */}
                {value && !wards.some(w => String(w.code) === String(normalizedValue) || w.name === value) && (
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
                    Clear selection: {editModeName || value}
                  </button>
                )}
              </>
            ) : (
              !loadingWards && (
                <div className="px-3 py-2 text-sm text-text-secondary">
                  {value || editModeName ? (
                    <div>
                      <div className="mb-2">No wards available for this location</div>
                      <div className="text-xs text-text-secondary mb-2">
                        Current value: {editModeName || value}
                      </div>
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
                        Clear current value
                      </button>
                    </div>
                  ) : (
                    'No wards available'
                  )}
                </div>
              )
            )}
          </div>
          {/* Alphabet sidebar */}
          {wards.length > 0 && (
            <div 
              ref={alphabetSidebarRef}
              className="flex flex-col items-center justify-start py-2 px-1 border-l border-gray-600 bg-background-light/30 flex-shrink-0 overflow-y-auto hide-scrollbar"
              style={{ maxHeight: '210px' }}
            >
              {Array.from({ length: 26 }, (_, i) => {
                const letter = String.fromCharCode(65 + i); // A-Z
                const selectedLetter = getSelectedWardFirstLetter();
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
                    title={`Scroll to wards starting with ${letter}`}
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

export default WardSelectWithAlphabet;


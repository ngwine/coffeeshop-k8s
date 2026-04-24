import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, UploadCloud, ChevronDown, Banknote } from 'lucide-react';
import { createCustomer } from '../../../../api/customers';
import { COUNTRY_CODE_MAP } from './constants/countries';
import CountrySelectWithAlphabet from './components/shared/CountrySelectWithAlphabet';
import CitySelectWithAlphabet from './components/shared/CitySelectWithAlphabet';
import DistrictSelectWithAlphabet from './components/shared/DistrictSelectWithAlphabet';
import WardSelectWithAlphabet from './components/shared/WardSelectWithAlphabet';
import JoinDatePicker from './components/shared/JoinDatePicker';
import AddNewAddressModal from './components/detail/AddNewAddressModal';
import {
  fetchCitiesByCountry,
  fetchDistrictsByCity,
  fetchWardsByDistrict,
} from '../../../../api/addresses';

// Phone country codes
const PHONE_COUNTRY_CODES = [
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+84', country: 'VN', flag: '🇻🇳' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+82', country: 'KR', flag: '🇰🇷' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+60', country: 'MY', flag: '🇲🇾' },
  { code: '+66', country: 'TH', flag: '🇹🇭' },
  { code: '+62', country: 'ID', flag: '🇮🇩' },
  { code: '+63', country: 'PH', flag: '🇵🇭' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+64', country: 'NZ', flag: '🇳🇿' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+39', country: 'IT', flag: '🇮🇹' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+31', country: 'NL', flag: '🇳🇱' },
  { code: '+46', country: 'SE', flag: '🇸🇪' },
  { code: '+47', country: 'NO', flag: '🇳🇴' },
  { code: '+45', country: 'DK', flag: '🇩🇰' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+971', country: 'AE', flag: '🇦🇪' },
  { code: '+966', country: 'SA', flag: '🇸🇦' },
];

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

type AddCustomerProps = {
  onBack?: () => void;
  setActivePage?: (page: string) => void;
};

const AddCustomer: React.FC<AddCustomerProps> = ({ onBack, setActivePage }) => {
  const [saving, setSaving] = useState(false);
  const [useAsBilling, setUseAsBilling] = useState(true);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<{ file: File; url: string } | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  // Payment method mặc định là COD (cash)
  const [paymentMethods] = useState<Array<{
    type: 'cash' | 'card' | 'bank';
    isDefault: boolean;
    provider?: string;
    accountNumber?: string;
    accountName?: string;
    brand?: string;
    last4?: string;
  }>>([{ type: 'cash', isDefault: true }]);

  const [phoneCountryCode, setPhoneCountryCode] = useState('+84');
  const [phoneCodeMenuOpen, setPhoneCodeMenuOpen] = useState(false);
  const phoneCodeDropdownRef = useRef<HTMLDivElement | null>(null);

  // State for address dropdown options
  const [cities, setCities] = useState<Array<{ code: string; name: string; provinceCode?: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ code: string; name: string }>>([]);
  const [wards, setWards] = useState<Array<{ code: string; name: string }>>([]);
  const [loadingOptions, setLoadingOptions] = useState({
    cities: false,
    districts: false,
    wards: false,
  });
  const [featuresAvailable, setFeaturesAvailable] = useState({
    districts: false,
    wards: false,
  });

  const [formData, setFormData] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '' as '' | 'male' | 'female' | 'other',
    dateOfBirth: '',
    status: '' as '' | 'active' | 'inactive' | 'banned',
    
    // Shipping Information
    addressLine1: '',
    ward: '',
    district: '',
    city: '',
    country: '',
  });

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (phoneCodeDropdownRef.current && !phoneCodeDropdownRef.current.contains(e.target as Node)) {
        setPhoneCodeMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset dependent fields when parent changes
      if (field === 'country') {
        newData.city = '';
        newData.district = '';
        newData.ward = '';
        setFeaturesAvailable({ districts: false, wards: false });
      } else if (field === 'city') {
        newData.district = '';
        newData.ward = '';
        setFeaturesAvailable((prev) => ({ ...prev, wards: false }));
      } else if (field === 'district') {
        newData.ward = '';
        setFeaturesAvailable((prev) => ({ ...prev, wards: false }));
      }
      
      return newData;
    });
  };

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
      } catch (err) {
        setCities([]);
      } finally {
        setLoadingOptions((prev) => ({ ...prev, cities: false }));
      }
    };

    if (formData.country) {
      loadCities();
    }
  }, [formData.country]);

  // Fetch districts when city changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (!formData.country || !formData.city) {
        setDistricts([]);
        setFeaturesAvailable((prev) => ({ ...prev, districts: false, wards: false }));
        return;
      }

      if (cities.length === 0) return;

      const cityObj = cities.find(c => c.code === formData.city || c.name === formData.city);
      if (!cityObj) return;

      const cityCode = cityObj.code;
      if (!cityCode) return;

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
        const hasDistricts = districtsData.length > 0;
        setFeaturesAvailable((prev) => ({ 
          ...prev, 
          districts: hasDistricts,
          wards: false
        }));
      } catch (err) {
        setDistricts([]);
        setFeaturesAvailable((prev) => ({ ...prev, districts: false, wards: false }));
      } finally {
        setLoadingOptions((prev) => ({ ...prev, districts: false }));
      }
    };

    loadDistricts();
  }, [formData.country, formData.city, cities]);

  // Fetch wards when district changes
  useEffect(() => {
    const loadWards = async () => {
      if (!formData.country || !formData.city) {
        setWards([]);
        setFeaturesAvailable((prev) => ({ ...prev, wards: false }));
        return;
      }

      if (cities.length === 0) return;

      const cityObj = cities.find(c => c.code === formData.city || c.name === formData.city);
      if (!cityObj) return;
      const cityCode = cityObj.code;

      if (featuresAvailable.districts && !formData.district) {
        setWards([]);
        setFeaturesAvailable((prev) => ({ ...prev, wards: false }));
        return;
      }

      if (featuresAvailable.districts && formData.district) {
        if (districts.length === 0) return;

        const districtObj = districts.find(d => d.code === formData.district || d.name === formData.district);
        if (!districtObj) return;
        const districtCode = districtObj.code;
        if (!districtCode) return;

        setLoadingOptions((prev) => ({ ...prev, wards: true }));
        try {
          const response = await fetchWardsByDistrict(formData.country, cityCode, districtCode);
          let wardsData: Array<{ code: string; name: string }> = [];
          if (response?.success && response?.data && Array.isArray(response.data)) {
            wardsData = response.data;
          } else if (Array.isArray(response)) {
            wardsData = response;
          }
          setWards(wardsData);
          const hasWards = wardsData.length > 0;
          setFeaturesAvailable((prev) => ({ ...prev, wards: hasWards }));
        } catch (err) {
          setWards([]);
          setFeaturesAvailable((prev) => ({ ...prev, wards: false }));
        } finally {
          setLoadingOptions((prev) => ({ ...prev, wards: false }));
        }
      } else {
        // Try to load wards directly from city if no districts
        setLoadingOptions((prev) => ({ ...prev, wards: true }));
        try {
          const response = await fetchWardsByDistrict(formData.country, cityCode, '');
          let wardsData: Array<{ code: string; name: string }> = [];
          if (response?.success && response?.data && Array.isArray(response.data)) {
            wardsData = response.data;
          } else if (Array.isArray(response)) {
            wardsData = response;
          }
          setWards(wardsData);
          const hasWards = wardsData.length > 0;
          setFeaturesAvailable((prev) => ({ ...prev, wards: hasWards }));
        } catch (err) {
          setWards([]);
          setFeaturesAvailable((prev) => ({ ...prev, wards: false }));
        } finally {
          setLoadingOptions((prev) => ({ ...prev, wards: false }));
        }
      }
    };

    loadWards();
  }, [formData.country, formData.city, formData.district, featuresAvailable.districts, districts, cities]);

  const convertDateToISO = (dateStr: string): string | undefined => {
    if (!dateStr) return undefined;
    // Convert from mm/dd/yyyy to yyyy-mm-dd
    const [mm, dd, yyyy] = dateStr.split('/');
    if (mm && dd && yyyy) {
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    // If already in ISO format or other format, try to parse it
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // Invalid date
    }
    return undefined;
  };

  const handleAvatarTrigger = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    const url = URL.createObjectURL(file);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview.url);
    }
    setAvatarPreview({ file, url });
  };

  const handleAvatarDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    handleAvatarFiles(event.dataTransfer.files);
  };

  const handleAvatarDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragActive) setIsDragActive(true);
  };

  const handleAvatarDragLeave = () => {
    if (isDragActive) setIsDragActive(false);
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview.url);
    }
    setAvatarPreview(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };


  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.firstName.trim()) {
        alert('First name is required');
        return;
      }
      if (!formData.lastName.trim()) {
        alert('Last name is required');
        return;
      }
      if (!formData.email.trim()) {
        alert('Email is required');
        return;
      }
      if (!formData.addressLine1.trim()) {
        alert('Address Line 1 is required');
        return;
      }
      if (!formData.city.trim()) {
        alert('City is required');
        return;
      }
      if (!formData.gender) {
        alert('Gender is required');
        return;
      }
      if (!formData.status) {
        alert('Status is required');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert('Please enter a valid email address');
        return;
      }

      setSaving(true);

      // Prepare customer data
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      
      // Combine phone country code with phone number
      const fullPhone = formData.phone.trim() 
        ? `${phoneCountryCode}${formData.phone.trim()}` 
        : undefined;

      // Helper functions to get name from code or keep name if already a name
      const getCityName = () => {
        if (!formData.city) return undefined;
        const cityObj = cities.find((c) => c.code === formData.city || c.name === formData.city);
        if (cityObj) return cityObj.name;
        return formData.city;
      };

      const getDistrictName = () => {
        if (!formData.district) return undefined;
        const districtObj = districts.find((d) => d.code === formData.district || d.name === formData.district);
        if (districtObj) return districtObj.name;
        return formData.district;
      };

      const getWardName = () => {
        if (!formData.ward) return undefined;
        const wardObj = wards.find((w) => w.code === formData.ward || w.name === formData.ward);
        if (wardObj) return wardObj.name;
        return formData.ward;
      };

      const cityName = getCityName();
      const districtName = getDistrictName();
      const wardName = getWardName();

      const addresses: any[] = [
        {
          label: 'home',
          type: 'shipping',
          isDefault: true,
          fullName: fullName,
          phone: fullPhone,
          addressLine1: formData.addressLine1.trim(),
          ward: wardName || undefined,
          district: districtName || undefined,
          city: cityName || formData.city.trim(),
          country: COUNTRY_CODE_MAP[formData.country] || formData.country,
        }
      ];

      // Add billing address if useAsBilling is true
      if (useAsBilling) {
        addresses.push({
          label: 'billing',
          type: 'billing',
          isDefault: true,
          fullName: fullName,
          phone: fullPhone,
          addressLine1: formData.addressLine1.trim(),
          ward: wardName || undefined,
          district: districtName || undefined,
          city: cityName || formData.city.trim(),
          country: COUNTRY_CODE_MAP[formData.country] || formData.country,
        });
      }

      // Prepare payment methods
      const preparedPaymentMethods = paymentMethods.map(pm => {
        const method: any = {
          type: pm.type,
          isDefault: pm.isDefault,
        };
        
        if (pm.type === 'bank') {
          if (pm.provider) method.provider = pm.provider.trim();
          if (pm.accountNumber) method.accountNumber = pm.accountNumber.trim();
          if (pm.accountName) method.accountName = pm.accountName.trim();
          if (pm.last4) method.last4 = pm.last4.trim();
        } else if (pm.type === 'card') {
          if (pm.brand) method.brand = pm.brand.trim();
          if (pm.last4) method.last4 = pm.last4.trim();
          if (pm.accountName) method.accountName = pm.accountName.trim();
        }
        // For cash type, no additional fields needed
        
        return method;
      });

      const customerData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fullName: fullName,
        email: formData.email.trim().toLowerCase(),
        phone: fullPhone,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth ? (() => {
          const isoDate = convertDateToISO(formData.dateOfBirth);
          return isoDate ? new Date(isoDate).toISOString() : undefined;
        })() : undefined,
        avatarUrl: avatarPreview?.url || undefined,
        status: formData.status,
        addresses: addresses,
        paymentMethods: preparedPaymentMethods,
      };

      const response = await createCustomer(customerData);
      
      if (response?.success || response?.data) {
        alert('Customer added successfully!');
        if (setActivePage) {
          setActivePage('Customers');
        } else if (onBack) {
          onBack();
        }
      } else {
        throw new Error(response?.message || 'Failed to create customer');
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || error?.message || 'Failed to create customer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setIsDiscardModalOpen(true);
  };

  const handleCloseDiscardModal = () => {
    setIsDiscardModalOpen(false);
  };

  const handleConfirmDiscard = () => {
    if (setActivePage) {
      setActivePage('Customers');
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="bg-background-light p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Add Customer</h2>
        <button
          onClick={handleDiscard}
          className="p-0 text-text-secondary"
          aria-label="Close"
          style={{
            transition: 'none !important',
            boxShadow: 'none !important',
            WebkitTransition: 'none !important',
            MozTransition: 'none !important',
            OTransition: 'none !important',
            msTransition: 'none !important',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transition = 'none';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'rgb(156, 163, 175)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transition = 'none';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'rgb(156, 163, 175)';
          }}
        >
          <X size={24} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-background-dark/40 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-text-primary">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full h-10 bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full h-10 bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full h-10 bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Phone
              </label>
              <div className="flex gap-2">
                <div className="relative" ref={phoneCodeDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setPhoneCodeMenuOpen((prev) => !prev)}
                    className="h-10 bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary flex items-center gap-1 hover:bg-background-dark hover:transform-none hover:shadow-none min-w-[90px]"
                  >
                    <span className="text-text-primary">{phoneCountryCode}</span>
                    <ChevronDown size={16} className="text-text-secondary" />
                  </button>
                  {phoneCodeMenuOpen && (
                    <div className="absolute z-30 mt-2 w-48 bg-background-dark border border-gray-600 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                      {PHONE_COUNTRY_CODES.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setPhoneCountryCode(item.code);
                            setPhoneCodeMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-text-primary hover:bg-background-dark/60 flex items-center gap-2"
                        >
                          <span>{item.flag}</span>
                          <span className="flex-1">{item.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  placeholder="1234567890"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="flex-1 h-10 bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Gender <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className={`w-full h-10 bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary ${
                  formData.gender === '' ? 'text-text-secondary' : 'text-text-primary'
                }`}
                required
              >
                <option value="" disabled>Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <JoinDatePicker
                label="Date of Birth"
                value={formData.dateOfBirth}
                onChange={(value) => handleInputChange('dateOfBirth', value)}
                placeholder="mm/dd/yyyy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Status <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className={`w-full h-10 bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary ${
                  formData.status === '' ? 'text-text-secondary' : 'text-text-primary'
                }`}
                required
              >
                <option value="" disabled>Select status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="banned">Banned</option>
              </select>
            </div>

          </div>
        </div>

        {/* Avatar Upload */}
        <div className="bg-background-dark/40 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-text-primary">Avatar</h3>
          <div
            className={`group border-2 border-dashed rounded-lg p-6 sm:p-10 transition-all duration-300 cursor-pointer ${
              isDragActive 
                ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg shadow-primary/20' 
                : 'border-gray-600 hover:border-primary hover:bg-primary/5 hover:shadow-md'
            } ${avatarPreview ? 'text-left' : 'text-center'}`}
            onClick={handleAvatarTrigger}
            onDrop={handleAvatarDrop}
            onDragOver={handleAvatarDragOver}
            onDragLeave={handleAvatarDragLeave}
          >
            {avatarPreview ? (
              <div className="max-w-xs bg-background-dark/50 border border-gray-700 rounded-lg overflow-hidden">
                <div className="aspect-square bg-background-dark">
                  <img
                    src={avatarPreview.url}
                    alt={avatarPreview.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-sm font-semibold text-text-primary truncate">{avatarPreview.file.name}</p>
                  <p className="text-xs text-text-secondary">{formatFileSize(avatarPreview.file.size)}</p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveAvatar();
                    }}
                    className="flex items-center gap-2 text-xs font-medium text-red-400 hover:underline"
                  >
                    <Trash2 size={14} />
                    Remove file
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <UploadCloud className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-sm font-medium text-text-primary">
                    <span className="text-primary hover:underline">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-text-secondary">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              onChange={(e) => handleAvatarFiles(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* Shipping Information */}
        <div className="bg-background-dark/40 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-text-primary">Shipping Information</h3>
          <div className="space-y-4">
            {/* Country */}
            <CountrySelectWithAlphabet
              value={formData.country}
              onChange={(code) => handleInputChange('country', code)}
              label="Country"
              required
            />

            {/* City */}
            <CitySelectWithAlphabet
              value={formData.city}
              onChange={(code) => handleInputChange('city', code)}
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
              onChange={(code) => handleInputChange('district', code)}
              countryCode={formData.country}
              cityCode={formData.city}
              districts={districts}
              loading={loadingOptions.districts}
              label="District / County"
              featuresAvailable={featuresAvailable.districts}
              onLoadingChange={(loading) => setLoadingOptions(prev => ({ ...prev, districts: loading }))}
            />

            {/* Ward */}
            <WardSelectWithAlphabet
              value={formData.ward}
              onChange={(code) => handleInputChange('ward', code)}
              countryCode={formData.country}
              cityCode={formData.city}
              districtCode={formData.district}
              wards={wards}
              loading={loadingOptions.wards}
              label="Ward / Commune"
              featuresAvailable={featuresAvailable}
              onLoadingChange={(loading) => setLoadingOptions(prev => ({ ...prev, wards: loading }))}
            />

            {/* Address Line 1 */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Address Line 1 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                className="w-full h-10 bg-background-dark border border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                placeholder="e.g., 123 Main Street"
                required
              />
            </div>

          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-background-dark/40 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Payment Methods</h3>
          <div className="bg-background-dark border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20">
                <Banknote className="text-primary" size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Cash on Delivery (COD)</p>
                <p className="text-xs text-text-secondary">Default payment method</p>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Address Option */}
        <div className="bg-background-dark/40 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Use as a billing address?
              </label>
              <p className="text-xs text-text-secondary mt-1">
                If you need more info, please check budget.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUseAsBilling(!useAsBilling)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors hover:transform-none hover:shadow-none ${
                useAsBilling ? 'bg-primary' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useAsBilling ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {isDiscardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-background-light rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-text-primary mb-2">Discard changes</h3>
            <p className="text-text-secondary text-sm">
              Are you sure you want to discard this customer? All unsaved changes will be lost.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCloseDiscardModal}
                className="px-4 py-2 rounded-lg border border-gray-600 text-text-primary hover:bg-gray-700/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDiscard}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCustomer;


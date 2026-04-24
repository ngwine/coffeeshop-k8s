import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

type JoinDatePickerProps = {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
};

const JoinDatePicker: React.FC<JoinDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'mm/dd/yyyy',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const parseValue = (val: string) => {
    if (!val) return null;
    const [mm, dd, yyyy] = val.split('/');
    if (mm && dd && yyyy) {
      return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    }
    return null;
  };

  const formatDate = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const selectedDate = parseValue(value);

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate.getMonth());
      setCurrentYear(selectedDate.getFullYear());
    }
  }, [value]);

  useEffect(() => {
    const updatePosition = () => {
      if (inputRef.current && isOpen) {
        const rect = inputRef.current.getBoundingClientRect();
        setPopupPosition({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
    };

    if (isOpen) {
      updatePosition();
      // Update position on scroll (using capture phase to catch all scrolls)
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      // Also listen to scroll on all scrollable parents
      const parents: Element[] = [];
      let parent = inputRef.current?.parentElement;
      while (parent) {
        parents.push(parent);
        parent.addEventListener('scroll', updatePosition, true);
        parent = parent.parentElement;
      }

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
        // Clean up parent scroll listeners
        parents.forEach(p => {
          p.removeEventListener('scroll', updatePosition, true);
        });
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideContainer = containerRef.current?.contains(target);
      const isClickInsidePopup = popupRef.current?.contains(target);
      
      if (!isClickInsideContainer && !isClickInsidePopup) {
        setIsOpen(false);
        setShowMonthPicker(false);
        setShowYearPicker(false);
      }
    };

    if (isOpen) {
      // Use setTimeout to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const newDate = new Date(currentYear, currentMonth, day);
    onChange(formatDate(newDate));
    setIsOpen(false);
    setShowMonthPicker(false);
    setShowYearPicker(false);
  };

  const handleToday = () => {
    const today = new Date();
    onChange(formatDate(today));
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setIsOpen(false);
    setShowMonthPicker(false);
    setShowYearPicker(false);
  };

  const handleClear = () => {
      onChange('');
    setIsOpen(false);
    setShowMonthPicker(false);
    setShowYearPicker(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const days = [];

  // Previous month's days
  const prevMonthDays = getDaysInMonth(currentMonth - 1 < 0 ? 11 : currentMonth - 1, currentMonth - 1 < 0 ? currentYear - 1 : currentYear);
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }

  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true });
  }

  // Next month's days
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({ day: i, isCurrentMonth: false });
  }

  const years = [];
  const startYear = currentYear - 10;
  const endYear = currentYear + 10;
  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }

  const isToday = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day: number, isCurrentMonth: boolean) => {
    if (!selectedDate || !isCurrentMonth) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

  return (
    <div className="space-y-1.5 min-w-0" ref={containerRef}>
      {label ? <label className="text-[11px] uppercase text-text-secondary block mb-1">{label}</label> : null}
      <div className="relative flex items-center gap-1.5 min-w-0">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={value}
          placeholder={placeholder}
          onClick={(e) => {
            e.stopPropagation();
            if (!isOpen && inputRef.current) {
              const rect = inputRef.current.getBoundingClientRect();
              setPopupPosition({
                top: rect.bottom + 8,
                left: rect.left,
              });
            }
            setIsOpen(!isOpen);
          }}
          className="w-full bg-background-dark border rounded-lg px-3 py-2 text-xs text-text-primary cursor-pointer focus:outline-none min-w-0 flex-1 h-10"
          style={{
            transition: 'none !important',
            boxShadow: 'none !important',
            WebkitTransition: 'none !important',
            MozTransition: 'none !important',
            OTransition: 'none !important',
            borderColor: isOpen ? 'rgb(124, 58, 237)' : 'rgb(75, 85, 99)',
            borderWidth: '1px',
          }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isOpen && inputRef.current) {
              const rect = inputRef.current.getBoundingClientRect();
              setPopupPosition({
                top: rect.bottom + 8,
                left: rect.left,
              });
            }
            setIsOpen(!isOpen);
          }}
          className="h-10 w-10 rounded-lg border flex items-center justify-center text-text-secondary flex-shrink-0"
          aria-label={`Pick ${label || 'date'}`}
          style={{
            transition: 'none !important',
            boxShadow: 'none !important',
            WebkitTransition: 'none !important',
            MozTransition: 'none !important',
            OTransition: 'none !important',
            backgroundColor: isOpen ? 'rgb(39, 39, 42)' : 'transparent',
            borderColor: isOpen ? 'rgb(124, 58, 237)' : 'rgb(75, 85, 99)',
            color: isOpen ? 'rgb(124, 58, 237)' : 'rgb(156, 163, 175)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transition = 'none';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.backgroundColor = isOpen ? 'rgb(39, 39, 42)' : 'transparent';
            e.currentTarget.style.borderColor = isOpen ? 'rgb(124, 58, 237)' : 'rgb(75, 85, 99)';
            e.currentTarget.style.color = isOpen ? 'rgb(124, 58, 237)' : 'rgb(156, 163, 175)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transition = 'none';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.backgroundColor = isOpen ? 'rgb(39, 39, 42)' : 'transparent';
            e.currentTarget.style.borderColor = isOpen ? 'rgb(124, 58, 237)' : 'rgb(75, 85, 99)';
            e.currentTarget.style.color = isOpen ? 'rgb(124, 58, 237)' : 'rgb(156, 163, 175)';
          }}
        >
          <Calendar size={14} />
        </button>

        {isOpen && createPortal(
          <div 
            ref={popupRef}
            className="fixed z-[9999] bg-background-light border border-gray-700 rounded-lg shadow-xl p-2.5 w-64"
            style={{
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateMonth('prev');
                  }}
                  className="p-1 rounded hover:bg-background-dark text-text-secondary"
                  style={{
                    transition: 'none !important',
                    boxShadow: 'none !important',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'rgb(23, 23, 23)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMonthPicker(!showMonthPicker);
                      setShowYearPicker(false);
                    }}
                    className="px-1.5 py-0.5 rounded text-xs font-semibold text-text-primary hover:bg-background-dark"
                    style={{
                      transition: 'none !important',
                      boxShadow: 'none !important',
                      backgroundColor: showMonthPicker ? 'rgb(39, 39, 42)' : 'transparent',
                      color: 'rgb(229, 231, 235)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transition = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = 'rgb(39, 39, 42)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transition = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = showMonthPicker ? 'rgb(39, 39, 42)' : 'transparent';
                    }}
                  >
                    {monthNames[currentMonth]}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowYearPicker(!showYearPicker);
                      setShowMonthPicker(false);
                    }}
                    className="px-1.5 py-0.5 rounded text-xs font-semibold text-text-primary hover:bg-background-dark"
                    style={{
                      transition: 'none !important',
                      boxShadow: 'none !important',
                      backgroundColor: showYearPicker ? 'rgb(39, 39, 42)' : 'transparent',
                      color: 'rgb(229, 231, 235)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transition = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = 'rgb(39, 39, 42)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transition = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = showYearPicker ? 'rgb(39, 39, 42)' : 'transparent';
                    }}
                  >
                    {currentYear}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateMonth('next');
                  }}
                  className="p-1 rounded hover:bg-background-dark text-text-secondary"
                  style={{
                    transition: 'none !important',
                    boxShadow: 'none !important',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'rgb(23, 23, 23)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Month Picker */}
            {showMonthPicker && (
              <div className="mb-2.5 p-1.5 bg-background-dark rounded-lg">
                <div className="grid grid-cols-3 gap-1.5">
                  {monthNames.map((month, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setCurrentMonth(idx);
                        setShowMonthPicker(false);
                      }}
                      className={`px-2 py-1 rounded text-[10px] ${
                        currentMonth === idx
                          ? 'bg-primary text-white'
                          : 'text-text-secondary hover:bg-background-light'
                      }`}
                      style={{
                        transition: 'none !important',
                        boxShadow: 'none !important',
                        backgroundColor: currentMonth === idx ? 'rgb(124, 58, 237)' : 'transparent',
                        color: currentMonth === idx ? 'rgb(255, 255, 255)' : 'rgb(156, 163, 175)',
                      }}
                      onMouseEnter={(e) => {
                        if (currentMonth !== idx) {
                          e.currentTarget.style.transition = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.backgroundColor = 'rgb(39, 39, 42)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentMonth !== idx) {
                          e.currentTarget.style.transition = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {month.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Year Picker */}
            {showYearPicker && (
              <div className="mb-2.5 p-1.5 bg-background-dark rounded-lg max-h-40 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="grid grid-cols-4 gap-1.5">
                  {years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setCurrentYear(year);
                        setShowYearPicker(false);
                      }}
                      className={`px-2 py-1 rounded text-[10px] ${
                        currentYear === year
                          ? 'bg-primary text-white'
                          : 'text-text-secondary hover:bg-background-light'
                      }`}
                      style={{
                        transition: 'none !important',
                        boxShadow: 'none !important',
                        backgroundColor: currentYear === year ? 'rgb(124, 58, 237)' : 'transparent',
                        color: currentYear === year ? 'rgb(255, 255, 255)' : 'rgb(156, 163, 175)',
                      }}
                      onMouseEnter={(e) => {
                        if (currentYear !== year) {
                          e.currentTarget.style.transition = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.backgroundColor = 'rgb(39, 39, 42)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentYear !== year) {
                          e.currentTarget.style.transition = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar Grid */}
            {!showMonthPicker && !showYearPicker && (
              <>
                {/* Day names */}
                <div className="grid grid-cols-7 gap-0.5 mb-1.5">
                  {dayNames.map((day) => (
                    <div key={day} className="text-center text-[10px] text-text-secondary font-medium py-0.5">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-0.5">
                  {days.map(({ day, isCurrentMonth }, idx) => {
                    const isTodayDate = isToday(day, isCurrentMonth);
                    const isSelectedDate = isSelected(day, isCurrentMonth);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (isCurrentMonth) {
                            handleDateSelect(day, e);
                          }
                        }}
                        disabled={!isCurrentMonth}
                        className={`text-[11px] py-1.5 rounded ${
                          !isCurrentMonth
                            ? 'text-gray-600 cursor-not-allowed'
                            : isSelectedDate
                              ? 'bg-primary text-white'
                              : isTodayDate
                                ? 'bg-primary/20 text-primary border border-primary'
                                : 'text-text-primary hover:bg-background-dark'
                        }`}
                        style={{
                          transition: 'none !important',
                          boxShadow: 'none !important',
                          backgroundColor: !isCurrentMonth
                            ? 'transparent'
                            : isSelectedDate
                              ? 'rgb(124, 58, 237)'
                              : isTodayDate
                                ? 'rgba(124, 58, 237, 0.2)'
                                : 'transparent',
                          color: !isCurrentMonth
                            ? 'rgb(75, 85, 99)'
                            : isSelectedDate
                              ? 'rgb(255, 255, 255)'
                              : isTodayDate
                                ? 'rgb(124, 58, 237)'
                                : 'rgb(229, 231, 235)',
                          borderColor: isTodayDate && !isSelectedDate ? 'rgb(124, 58, 237)' : 'transparent',
                          borderWidth: isTodayDate && !isSelectedDate ? '1px' : '0px',
                        }}
                        onMouseEnter={(e) => {
                          if (isCurrentMonth && !isSelectedDate) {
                            e.currentTarget.style.transition = 'none';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.backgroundColor = isTodayDate ? 'rgba(124, 58, 237, 0.2)' : 'rgb(23, 23, 23)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isCurrentMonth && !isSelectedDate) {
                            e.currentTarget.style.transition = 'none';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.backgroundColor = isSelectedDate
                              ? 'rgb(124, 58, 237)'
                              : isTodayDate
                                ? 'rgba(124, 58, 237, 0.2)'
                                : 'transparent';
                          }
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-gray-700">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="text-xs text-primary"
                style={{
                  transition: 'none !important',
                  boxShadow: 'none !important',
                  WebkitTransition: 'none !important',
                  MozTransition: 'none !important',
                  OTransition: 'none !important',
                  msTransition: 'none !important',
                  color: 'rgb(124, 58, 237)',
                  textDecoration: 'none',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.textDecoration = 'none';
                  e.currentTarget.style.color = 'rgb(124, 58, 237)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.textDecoration = 'none';
                  e.currentTarget.style.color = 'rgb(124, 58, 237)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToday();
                }}
                className="text-xs text-primary"
                style={{
                  transition: 'none !important',
                  boxShadow: 'none !important',
                  WebkitTransition: 'none !important',
                  MozTransition: 'none !important',
                  OTransition: 'none !important',
                  msTransition: 'none !important',
                  color: 'rgb(124, 58, 237)',
                  textDecoration: 'none',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.textDecoration = 'none';
                  e.currentTarget.style.color = 'rgb(124, 58, 237)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.textDecoration = 'none';
                  e.currentTarget.style.color = 'rgb(124, 58, 237)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Today
        </button>
            </div>
          </div>
        , document.body)}
      </div>
    </div>
  );
};

export default JoinDatePicker;

import { useState, useRef } from 'react';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';

interface Option {
  value: string;
  label: string;
  subLabel?: string;
}

interface InfiniteSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function InfiniteSelect({
  options,
  value,
  onChange,
  onLoadMore,
  hasMore,
  isLoading,
  placeholder = 'Select an option',
  label,
  className = '',
}: InfiniteSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useOnClickOutside(containerRef, () => setIsOpen(false));

  const handleScroll = () => {
    if (!listRef.current || isLoading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop <= clientHeight + 50) { // Load when 50px from bottom
      onLoadMore();
    }
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-3 py-2 text-left bg-white border rounded-md
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-colors duration-150 flex justify-between items-center
          ${isOpen ? 'ring-2 ring-primary border-transparent' : 'border-gray-300'}
        `}
      >
        <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto py-1 focus:outline-none custom-scrollbar"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onScroll={handleScroll}
          >
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50
                  ${option.value === value ? 'bg-primary/5 text-primary' : 'text-gray-900'}
                `}
              >
                <div className="flex flex-col">
                  <span className={`block truncate ${option.value === value ? 'font-semibold' : 'font-normal'}`}>
                    {option.label}
                  </span>
                  {option.subLabel && (
                    <span className="text-xs text-gray-500">
                      {option.subLabel}
                    </span>
                  )}
                </div>

                {option.value === value && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </li>
            ))}
            
            {options.length === 0 && !isLoading && (
              <li className="py-2 px-3 text-gray-500 text-sm text-center">
                No options available
              </li>
            )}

            {isLoading && (
              <li className="py-2 px-3 text-center">
                <div className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </li>
            )}
            
            {/* Height spacer if expecting more but not loading yet (rare, but helps scroll) */}
            {!isLoading && hasMore && <li className="h-4"></li>}
          </ul>
        </div>
      )}
    </div>
  );
}

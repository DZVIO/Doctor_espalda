import React, { useState, useRef, useEffect, useMemo } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface SearchableOption {
  id: number;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: number | null | undefined;
  onChange: (id: number) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * Normalizes a string by removing diacritics (tildes) and lowering case
 * so "Masaje Terapéutico" matches a search for "terapeutico".
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Buscar por nombre, ID o precio...',
  emptyMessage = 'Sin resultados',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.id === value) ?? null,
    [options, value],
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = normalize(query.trim());
    return options.filter((o) => {
      const haystack = normalize(`${o.id} ${o.label} ${o.sublabel ?? ''}`);
      return haystack.includes(q);
    });
  }, [options, query]);

  const handleSelect = (opt: SearchableOption) => {
    if (opt.disabled) return;
    onChange(opt.id);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(0 as unknown as number); // signal "no selection"
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="group relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-500 text-gray-400">
          <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={selected && !isOpen ? selected.label : query}
          onChange={handleInputChange}
          onFocus={() => {
            if (selected) setQuery('');
            handleFocus();
          }}
          placeholder={selected ? selected.label : placeholder}
          className="block w-full pl-9 pr-10 py-2 text-sm border-gray-300 bg-white border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400"
        />

        {selected && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500 transition-colors duration-200"
            title="Limpiar selección"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="max-h-60 overflow-auto py-1 scrollbar-thin scrollbar-thumb-gray-200">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-500 italic text-center bg-gray-50">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((opt) => (
                <li
                  key={opt.id}
                  onClick={() => handleSelect(opt)}
                  className={`px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-colors duration-150 ${
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed bg-gray-50/50 grayscale-[0.5]'
                      : opt.id === value
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-blue-50/50 hover:text-blue-600'
                  }`}
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 truncate">{opt.label}</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                        #{opt.id}
                      </span>
                    </div>
                    {opt.sublabel && (
                      <span className={`text-xs truncate ${opt.id === value ? 'text-blue-500' : 'text-gray-500'}`}>
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                  {opt.id === value && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>

  );
};

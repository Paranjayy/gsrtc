'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { STATIONS, Station } from '@/lib/gsrtc-data';
import { CalendarIcon, MapPin, Users, ArrowRightLeft, Search } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface SearchFormProps {
  onSearch: (params: {
    origin: string;
    destination: string;
    originId: string;
    originCode: string;
    destinationId: string;
    destinationCode: string;
    date: string;
    passengers: number;
  }) => void;
}

export default function GSRTCSearchForm({ onSearch }: SearchFormProps) {
  const [originInput, setOriginInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState<Station | null>(null);
  const [selectedDest, setSelectedDest] = useState<Station | null>(null);
  const [originSuggestions, setOriginSuggestions] = useState<Station[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Station[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date()); // Default to today
  const [passengers, setPassengers] = useState<number>(1);
  const [showOriginList, setShowOriginList] = useState(false);
  const [showDestList, setShowDestList] = useState(false);
  const [loadingOrigin, setLoadingOrigin] = useState(false);
  const [loadingDest, setLoadingDest] = useState(false);
  const [originFocusedIndex, setOriginFocusedIndex] = useState(-1);
  const [destFocusedIndex, setDestFocusedIndex] = useState(-1);

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginList(false);
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setShowDestList(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced autocomplete for Origin
  useEffect(() => {
    if (selectedOrigin && originInput === `${selectedOrigin.name} (${selectedOrigin.code})`) {
      return;
    }
    const trimmed = originInput.trim();
    if (trimmed.length < 2) {
      setOriginSuggestions([]);
      setShowOriginList(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingOrigin(true);
      try {
        const res = await fetch(`/api/stations?term=${encodeURIComponent(trimmed)}&type=from`);
        if (res.ok) {
          const data = await res.json();
          setOriginSuggestions(data);
          setShowOriginList(data.length > 0);
        }
      } catch (err) {
        console.error('Error fetching origin stations:', err);
      } finally {
        setLoadingOrigin(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [originInput, selectedOrigin]);

  // Debounced autocomplete for Destination
  useEffect(() => {
    if (selectedDest && destInput === `${selectedDest.name} (${selectedDest.code})`) {
      return;
    }
    const trimmed = destInput.trim();
    if (trimmed.length < 2) {
      setDestSuggestions([]);
      setShowDestList(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingDest(true);
      try {
        const res = await fetch(`/api/stations?term=${encodeURIComponent(trimmed)}&type=to`);
        if (res.ok) {
          const data = await res.json();
          setDestSuggestions(data);
          setShowDestList(data.length > 0);
        }
      } catch (err) {
        console.error('Error fetching dest stations:', err);
      } finally {
        setLoadingDest(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [destInput, selectedDest]);

  const handleOriginChange = (val: string) => {
    setOriginInput(val);
    setOriginFocusedIndex(-1);
    // If user clears the text, clear the selection state
    if (!val.trim()) {
      setSelectedOrigin(null);
    }
  };

  const handleDestChange = (val: string) => {
    setDestInput(val);
    setDestFocusedIndex(-1);
    // If user clears the text, clear the selection state
    if (!val.trim()) {
      setSelectedDest(null);
    }
  };

  const handleOriginKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showOriginList || originSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOriginFocusedIndex(prev => (prev < originSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOriginFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (originFocusedIndex >= 0 && originFocusedIndex < originSuggestions.length) {
        e.preventDefault();
        const item = originSuggestions[originFocusedIndex];
        setSelectedOrigin(item);
        setOriginInput(`${item.name} (${item.code})`);
        setShowOriginList(false);
      }
    } else if (e.key === 'Escape') {
      setShowOriginList(false);
    }
  };

  const handleDestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDestList || destSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDestFocusedIndex(prev => (prev < destSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDestFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (destFocusedIndex >= 0 && destFocusedIndex < destSuggestions.length) {
        e.preventDefault();
        const item = destSuggestions[destFocusedIndex];
        setSelectedDest(item);
        setDestInput(`${item.name} (${item.code})`);
        setShowDestList(false);
      }
    } else if (e.key === 'Escape') {
      setShowDestList(false);
    }
  };

  const handleSwap = () => {
    const tempOrig = selectedOrigin;
    const tempOrigInput = originInput;
    setSelectedOrigin(selectedDest);
    setOriginInput(destInput);
    setSelectedDest(tempOrig);
    setDestInput(tempOrigInput);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrigin || !selectedDest || !date) return;
    
    onSearch({
      origin: selectedOrigin.name,
      destination: selectedDest.name,
      originId: selectedOrigin.id,
      originCode: selectedOrigin.code,
      destinationId: selectedDest.id,
      destinationCode: selectedDest.code,
      date: format(date, 'dd/MM/yyyy'),
      passengers
    });
  };

  return (
    <Card className="w-full shadow-lg border overflow-visible bg-card text-card-foreground">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
          
          {/* Origin field */}
          <div ref={originRef} className="flex-[1.5] relative space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Origin</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={originInput}
                onChange={(e) => handleOriginChange(e.target.value)}
                onKeyDown={handleOriginKeyDown}
                onFocus={() => {
                  if (originSuggestions.length > 0) setShowOriginList(true);
                }}
                placeholder="Where from?"
                className="pl-10 pr-4"
              />
            </div>
            
            {showOriginList && (
              <ul className="absolute z-50 w-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto divide-y divide-border">
                {originSuggestions.map((item, idx) => (
                  <li
                    key={item.id}
                    onClick={() => {
                      setSelectedOrigin(item);
                      setOriginInput(`${item.name} (${item.code})`);
                      setShowOriginList(false);
                    }}
                    className={`px-4 py-2.5 cursor-pointer text-sm flex justify-between ${
                      idx === originFocusedIndex 
                        ? 'bg-accent text-accent-foreground' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="text-xs text-muted-foreground uppercase font-mono">{item.code}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center md:pb-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleSwap}
              className="rounded-full w-10 h-10 shrink-0"
            >
              <ArrowRightLeft className="w-4 h-4 md:rotate-90" />
            </Button>
          </div>

          {/* Destination field */}
          <div ref={destRef} className="flex-[1.5] relative space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Destination</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={destInput}
                onChange={(e) => handleDestChange(e.target.value)}
                onKeyDown={handleDestKeyDown}
                onFocus={() => {
                  if (destSuggestions.length > 0) setShowDestList(true);
                }}
                placeholder="Where to?"
                className="pl-10 pr-4"
              />
            </div>
            
            {showDestList && (
              <ul className="absolute z-50 w-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto divide-y divide-border">
                {destSuggestions.map((item, idx) => (
                  <li
                    key={item.id}
                    onClick={() => {
                      setSelectedDest(item);
                      setDestInput(`${item.name} (${item.code})`);
                      setShowDestList(false);
                    }}
                    className={`px-4 py-2.5 cursor-pointer text-sm flex justify-between ${
                      idx === destFocusedIndex 
                        ? 'bg-accent text-accent-foreground' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="text-xs text-muted-foreground uppercase font-mono">{item.code}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Date Picker field */}
          <div className="w-[130px] shrink-0 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
              <Popover>
                <PopoverTrigger className={`inline-flex items-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1 w-full justify-start text-left font-normal pl-10 truncate ${!date && "text-muted-foreground"}`}>
                  <span className="truncate">{date ? format(date, 'MMM do') : "Pick"}</span>
                </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            </div>
          </div>

          <div className="flex items-end gap-2">
            {/* Passengers field */}
            <div className="w-full md:w-24 relative space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Passengers</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                <Select value={String(passengers)} onValueChange={(val) => setPassengers(Number(val))}>
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="1" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={String(num)}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Search Button */}
            <div className="w-full md:w-auto">
              <Button
                type="submit"
                disabled={!selectedOrigin || !selectedDest || !date}
                className="w-full md:w-auto px-8 bg-red-600 hover:bg-red-700 text-white font-bold h-8 shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}

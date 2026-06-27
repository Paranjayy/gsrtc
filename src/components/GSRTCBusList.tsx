'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BusService } from '@/lib/gsrtc-data';
import { Clock, IndianRupee, ArrowRight, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface BusListProps {
  origin: string;
  originId: string;
  originCode: string;
  destination: string;
  destinationId: string;
  destinationCode: string;
  date: string;
  passengers: number;
  onSelectBus: (bus: BusService, jsessionid: string) => void;
  selectedBusId?: string;
  onDateChange?: (newDate: string) => void;
}

export default function GSRTCBusList({
  origin,
  originId,
  originCode,
  destination,
  destinationId,
  destinationCode,
  date,
  passengers,
  onSelectBus,
  selectedBusId,
  onDateChange
}: BusListProps) {
  const [buses, setBuses] = useState<BusService[]>([]);
  const [viaOpenId, setViaOpenId] = useState<string | null>(null);
  const [viaPos, setViaPos] = useState<{ x: number; y: number } | null>(null);
  // Cache: via raw string -> resolved display string
  const viaCache = useRef<Map<string, string>>(new Map());
  const [, forceUpdate] = useState(0);

  const resolveViaCodes = useCallback(async (via: string) => {
    if (viaCache.current.has(via)) return;
    viaCache.current.set(via, '…'); // placeholder while loading
    try {
      const res = await fetch(`/api/via-resolve?codes=${encodeURIComponent(via)}`);
      if (res.ok) {
        const data: { code: string; name: string }[] = await res.json();
        viaCache.current.set(via, data.map(d => d.name).join(' → '));
        forceUpdate(n => n + 1);
      }
    } catch {
      viaCache.current.set(via, via.toUpperCase());
    }
  }, []);

  const generateDates = (currentDateStr: string) => {
    const [day, month, year] = currentDateStr.split('/');
    const current = new Date(Number(year), Number(month) - 1, Number(day));
    current.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = [];
    let startOffset = -2;

    const idealStartDate = new Date(current);
    idealStartDate.setDate(current.getDate() + startOffset);

    if (idealStartDate < today) {
      const diffTime = today.getTime() - idealStartDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      startOffset += diffDays;
    }

    for (let i = 0; i < 5; i++) {
      const d = new Date(current);
      d.setDate(current.getDate() + startOffset + i);
      
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      
      dates.push({
        str: `${dd}/${mm}/${yyyy}`,
        label: `${dd} ${d.toLocaleString('default', { month: 'short' })}`,
        isCurrent: d.getTime() === current.getTime(),
        isHiddenMobile: false
      });
    }

    // Figure out which 3 to show on mobile (always include the current date)
    const selectedIndex = dates.findIndex(d => d.isCurrent);
    let showStart = selectedIndex - 1;
    let showEnd = selectedIndex + 1;
    
    if (showStart < 0) {
      showStart = 0;
      showEnd = 2;
    } else if (showEnd >= 5) {
      showEnd = 4;
      showStart = 2;
    }

    dates.forEach((d, idx) => {
      d.isHiddenMobile = idx < showStart || idx > showEnd;
    });

    return dates;
  };
  const [jsessionid, setJsessionid] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<string>('ALL');

  useEffect(() => {
    let active = true;
    const fetchBuses = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          originName: origin,
          originId,
          originCode,
          destName: destination,
          destId: destinationId,
          destCode: destinationCode,
          date,
          passengers: String(passengers)
        });
        const res = await fetch(`/api/search?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error(`Failed to load buses (status ${res.status})`);
        }
        const data = await res.json();
        if (active) {
          setBuses(data.buses || []);
          setJsessionid(data.jsessionid || '');
        }
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError(err.message || 'An error occurred while fetching bus schedules.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchBuses();
    return () => {
      active = false;
    };
  }, [origin, originId, originCode, destination, destinationId, destinationCode, date, passengers]);

  const getClassColor = (className: string) => {
    switch (className) {
      case 'AC LUXURY':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800';
      case 'LUXURY':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800';
      case 'EXPRESS':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center bg-muted/50 border rounded-lg px-4 py-3 animate-pulse">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded"></div>
            <div className="h-3.5 w-32 bg-muted rounded"></div>
          </div>
          <div className="h-5 w-24 bg-muted rounded"></div>
        </div>

        {/* Bus Card Skeletons */}
        {[1, 2, 3].map((n) => (
          <Card key={n} className="bg-card p-5 md:p-6 animate-pulse">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex gap-2">
                  <div className="h-5 w-32 bg-muted rounded"></div>
                  <div className="h-5 w-20 bg-muted rounded-full"></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-8 bg-muted rounded"></div>
                  <div className="h-8 bg-muted rounded"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-border shrink-0">
                <div className="h-10 w-20 bg-muted rounded"></div>
                <div className="h-10 w-28 bg-muted rounded"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/20 border text-center py-12">
        <CardContent>
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Failed to Retrieve Schedules</h3>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const CLASS_ORDER: Record<string, number> = {
    // --- Bus List Sort Order (Primary: Bus Class Priority) ---
    // Edit the numbers to change display order. Lower = appears first.
    // Any class not listed here will appear at the very bottom (rank 99).
    'VOLVO':          0,
    'AC LUXURY':      1,
    'SLEEPER':        2,
    'ELECTRIC AC':    3,
    'LUXURY':         4,
    'EXPRESS':        5,
    'GURJARNAGRI':    6,
    'LOCAL ORDINARY': 7,
  };

  const classRank = (cls: string) => {
    const key = cls.trim().toUpperCase();
    return CLASS_ORDER[key] ?? 99;
  };

  const parseTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const uniqueClasses = Array.from(new Set(buses.map(b => b.className))).filter(Boolean);
  const filteredBuses = (filterClass === 'ALL' ? buses : buses.filter(b => b.className === filterClass))
    .slice()
    .sort((a, b) => {
      // 1. Sort by class priority rank
      const classDiff = classRank(a.className) - classRank(b.className);
      if (classDiff !== 0) return classDiff;
      // 2. Same rank (e.g. both unknown) → group by class name alphabetically
      const nameDiff = a.className.localeCompare(b.className);
      if (nameDiff !== 0) return nameDiff;
      return parseTime(a.departureTime) - parseTime(b.departureTime);
    });

  return (
    <>
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-muted/50 border rounded-lg px-4 py-3 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span>{origin}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <span>{destination}</span>
          </h2>
          <div className="flex items-center gap-1.5 mt-2">
            {generateDates(date).map(d => (
              <button
                key={d.str}
                onClick={() => onDateChange && onDateChange(d.str)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors border ${
                  d.isHiddenMobile ? 'hidden sm:block' : ''
                } ${
                  d.isCurrent 
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm pointer-events-none' 
                    : 'bg-background border-border hover:bg-muted text-muted-foreground'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={filterClass} onValueChange={(val) => setFilterClass(val || 'ALL')}>
            <SelectTrigger className="w-full md:w-[140px] h-9 text-xs bg-background border-border shadow-sm focus:ring-1 focus:ring-primary/50 focus:ring-offset-0">
              <SelectValue placeholder="Bus Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Bus Types</SelectItem>
              {uniqueClasses.map(cls => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shadow-sm">
            {filteredBuses.length} Trips
          </div>
        </div>
      </div>

      {filteredBuses.length === 0 ? (
        <Card className="bg-card border text-center py-12">
          <CardContent>
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No Services Found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              No bus schedules match your query on the selected date. Please try another date or route combination.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBuses.map((bus) => {
            const isSelected = selectedBusId === bus.serviceId;
            return (
              <Card
                key={bus.serviceId}
                className={`transition-all duration-300 border bg-card text-card-foreground overflow-hidden ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                    : 'hover:border-border hover:bg-accent/30'
                }`}
              >
                <CardContent className="px-4 py-3">
                  {/* MOBILE LAYOUT (block on mobile, hidden on md+) */}
                  <div className="block md:hidden space-y-2.5">
                    {/* Upper row: Info left, Action right */}
                    <div className="flex justify-between items-start gap-2">
                      {/* Left: Code, Dept, Dur */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-sm font-bold uppercase tracking-wide">
                            {bus.tripCode}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getClassColor(bus.className)}`}>
                            {bus.className}
                          </span>
                        </div>
                        <div className="flex gap-6 text-sm text-muted-foreground pt-0.5">
                          <div>
                            <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">Dept</p>
                            <p className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-primary shrink-0" />
                              {bus.departureTime}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">Dur.</p>
                            <p className="font-semibold text-foreground mt-0.5">{bus.duration}h</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Pricing & Seat Button aligned higher */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="text-right">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider leading-none">Fare</p>
                          <p className="text-base font-black flex items-center justify-end gap-0.5 mt-0.5 font-mono">
                            <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                            {bus.fare.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          {bus.isFull ? (
                            <div className="px-3 py-1 rounded-md bg-destructive/10 border border-destructive/20 text-destructive font-bold text-[10px] tracking-wide text-center shrink-0">
                              Full
                            </div>
                          ) : (
                            <Button
                              onClick={() => onSelectBus(bus, jsessionid)}
                              className={`px-2.5 py-1 h-7 text-xs font-bold transition-all relative ${
                                isSelected
                                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                  : 'bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground'
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {bus.availableSeats} Seats
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lower row: Route (spans 100% card width) */}
                    <div className="border-t border-border/50 pt-2">
                      <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider flex items-center gap-2 flex-wrap">
                        Route
                        {bus.via && (
                          <span className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onMouseEnter={(e) => {
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setViaPos({ x: rect.left, y: rect.top });
                                setViaOpenId(bus.serviceId);
                                resolveViaCodes(bus.via!);
                              }}
                              onMouseLeave={() => { setViaOpenId(null); setViaPos(null); }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                resolveViaCodes(bus.via!);
                                if (viaOpenId === bus.serviceId) {
                                  setViaOpenId(null); setViaPos(null);
                                } else {
                                  setViaPos({ x: rect.left, y: rect.top });
                                  setViaOpenId(bus.serviceId);
                                }
                              }}
                              className="flex items-center gap-1 text-[11px] font-medium normal-case tracking-normal text-primary/80 hover:text-primary cursor-pointer underline-offset-2 hover:underline"
                            >
                              <Info className="w-3 h-3 shrink-0" />
                              via {bus.via}
                            </button>
                          </span>
                        )}
                      </p>
                      <p className="font-semibold text-foreground text-sm mt-0.5 w-full break-words">
                        <span className="uppercase">{bus.origin}</span>
                        {' → '}
                        <span>{bus.destination.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</span>
                      </p>
                    </div>
                  </div>

                  {/* DESKTOP LAYOUT (hidden on mobile, flex on md+) */}
                  <div className="hidden md:flex justify-between items-center gap-3">
                    {/* Left: Bus Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-bold uppercase tracking-wide">
                          {bus.tripCode}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getClassColor(bus.className)}`}>
                          {bus.className}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-[120px_120px_1fr] gap-2 text-sm text-muted-foreground">
                        <div>
                          <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">Dept</p>
                          <p className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-primary shrink-0" />
                            {bus.departureTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">Dur.</p>
                          <p className="font-semibold text-foreground mt-0.5">{bus.duration}h</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground/70 uppercase tracking-wider flex items-center gap-2 flex-wrap">
                            Route
                            {bus.via && (
                              <span className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onMouseEnter={(e) => {
                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                    setViaPos({ x: rect.left, y: rect.top });
                                    setViaOpenId(bus.serviceId);
                                    resolveViaCodes(bus.via!);
                                  }}
                                  onMouseLeave={() => { setViaOpenId(null); setViaPos(null); }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                    resolveViaCodes(bus.via!);
                                    if (viaOpenId === bus.serviceId) {
                                      setViaOpenId(null); setViaPos(null);
                                    } else {
                                      setViaPos({ x: rect.left, y: rect.top });
                                      setViaOpenId(bus.serviceId);
                                    }
                                  }}
                                  className="flex items-center gap-1 text-xs font-medium normal-case tracking-normal text-primary/80 hover:text-primary cursor-pointer underline-offset-2 hover:underline"
                                >
                                  <Info className="w-3 h-3 shrink-0" />
                                  via {bus.via}
                                </button>
                              </span>
                            )}
                          </p>
                          <p className="font-semibold text-foreground truncate mt-0.5">
                            <span className="uppercase">{bus.origin}</span>
                            {' → '}
                            <span>{bus.destination.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Pricing and Action */}
                    <div className="flex flex-col items-end gap-2 shrink-0 self-center">
                      
                      {/* Price */}
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Fare</p>
                        <p className="text-lg md:text-xl font-black flex items-center justify-end gap-0.5 mt-0.5 font-mono">
                          <IndianRupee className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                          {bus.fare.toFixed(2)}
                        </p>
                      </div>

                      {/* Select Button */}
                      <div>
                        {bus.isFull ? (
                          <div className="px-4 py-1.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive font-bold text-xs tracking-wide text-center shrink-0">
                            Full
                          </div>
                        ) : (
                          <Button
                            onClick={() => onSelectBus(bus, jsessionid)}
                            className={`px-3 py-1 h-8 text-xs font-bold transition-all relative ${
                              isSelected
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                : 'bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {bus.availableSeats} Seats
                          </Button>
                        )}
                      </div>

                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>

    {/* Via Tooltip — fixed position, escapes overflow-hidden on cards */}
    {viaOpenId && viaPos && (
      <div
        className="fixed z-[9999] bg-popover border border-border text-popover-foreground text-xs font-normal rounded-md shadow-xl px-3 py-2.5 pointer-events-none max-w-xs leading-relaxed"
        style={{ left: viaPos.x, top: viaPos.y - 8, transform: 'translateY(-100%)' }}
      >
        <span className="font-semibold text-muted-foreground block mb-1.5 uppercase text-[10px] tracking-widest">Via Stops</span>
        {viaCache.current.get(buses.find(b => b.serviceId === viaOpenId)?.via ?? '') ?? '…'}
      </div>
    )}
    </>
  );
}

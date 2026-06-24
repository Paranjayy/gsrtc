'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BusService } from '@/lib/gsrtc-data';
import { Clock, IndianRupee, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

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
  selectedBusId
}: BusListProps) {
  const [buses, setBuses] = useState<BusService[]>([]);
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

  const uniqueClasses = Array.from(new Set(buses.map(b => b.className))).filter(Boolean);
  const filteredBuses = filterClass === 'ALL' ? buses : buses.filter(b => b.className === filterClass);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-muted/50 border rounded-lg px-4 py-3 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span>{origin}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <span>{destination}</span>
          </h2>
          <p className="text-xs text-muted-foreground">Date of Journey: {date}</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-[160px] h-8 text-xs bg-background">
              <SelectValue placeholder="Bus Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Bus Types</SelectItem>
              {uniqueClasses.map(cls => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm font-semibold text-primary font-mono whitespace-nowrap">
            {filteredBuses.length} Trips Available
          </span>
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
                <CardContent className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Bus Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-bold uppercase tracking-wide">
                          {bus.tripCode}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getClassColor(bus.className)}`}>
                          {bus.className}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div>
                          <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">Dept Time</p>
                          <p className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {bus.departureTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">Duration</p>
                          <p className="font-semibold text-foreground mt-0.5">{bus.duration} hrs</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">Route</p>
                          <p className="font-semibold text-foreground truncate mt-0.5">{bus.origin} → {bus.destination}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pricing and Action */}
                    <div className="flex items-center justify-between md:justify-end md:gap-8 border-t md:border-t-0 pt-4 md:pt-0 border-border shrink-0">
                      
                      {/* Price */}
                      <div className="text-left md:text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Fare</p>
                        <p className="text-xl font-black flex items-center gap-0.5 mt-0.5 font-mono">
                          <IndianRupee className="w-4 h-4 text-emerald-500" />
                          {bus.fare.toFixed(2)}
                        </p>
                      </div>

                      {/* Select Button */}
                      <div>
                        {bus.isFull ? (
                          <div className="px-5 py-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive font-bold text-sm tracking-wide text-center shrink-0">
                            Full
                          </div>
                        ) : (
                          <Button
                            onClick={() => onSelectBus(bus, jsessionid)}
                            className={`px-5 font-bold transition-all relative ${
                              isSelected
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                : 'bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-4 h-4 mr-2" />}
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
  );
}

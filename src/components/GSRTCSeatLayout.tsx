'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Seat, BusService } from '@/lib/gsrtc-data';
import { Compass, User, AlertCircle, Loader2 } from 'lucide-react';

interface SeatLayoutProps {
  bus: BusService;
  jsessionid: string;
  selectedSeats: string[];
  maxSeats: number;
  onSeatToggle: (seatNo: string) => void;
  boardingPoint: string;
  onBoardingPointChange: (val: string) => void;
  droppingPoint: string;
  onDroppingPointChange: (val: string) => void;
}

export default function GSRTCSeatLayout({
  bus,
  jsessionid,
  selectedSeats,
  maxSeats,
  onSeatToggle,
  boardingPoint,
  onBoardingPointChange,
  droppingPoint,
  onDroppingPointChange
}: SeatLayoutProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [boardingOptions, setBoardingOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [droppingOptions, setDroppingOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchSeats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/seats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            serviceInfo: bus.serviceInfo || `${bus.serviceId},0,${bus.className},0,0,00:00,00:00,${bus.origin},${bus.origin},${bus.destination},${bus.tripCode},Y`,
            jsessionid
          })
        });
        if (!res.ok) {
          throw new Error(`Failed to load seat layout (status ${res.status})`);
        }
        const data = await res.json();
        if (active) {
          setSeats(data.seats || []);
          setBoardingOptions(data.boardingPoints || []);
          setDroppingOptions(data.droppingPoints || []);
          
          if (data.boardingPoints?.length > 0) {
            onBoardingPointChange(data.boardingPoints[0].value);
          }
          if (data.droppingPoints?.length > 0) {
            onDroppingPointChange(data.droppingPoints[0].value);
          }
        }
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError(err.message || 'An error occurred while loading the seat map.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    
    fetchSeats();
    return () => {
      active = false;
    };
  }, [bus, jsessionid]);

  // Group seats by rows
  const rows: { [key: number]: Seat[] } = {};
  seats.forEach(seat => {
    if (!rows[seat.row]) {
      rows[seat.row] = [];
    }
    rows[seat.row].push(seat);
  });

  // Calculate fallbacks
  const finalBoardingOptions = boardingOptions.length > 0 ? boardingOptions : [
    { label: `${bus.origin}--${bus.departureTime}`, value: `91,${bus.departureTime},1` }
  ];
  
  const [depHrs, depMins] = bus.departureTime.split(':').map(Number);
  let dropMins = depMins + 45;
  let dropHrs = depHrs + Math.floor(dropMins / 60);
  dropMins = dropMins % 60;
  const dropTime = `${String(dropHrs).padStart(2, '0')}:${String(dropMins).padStart(2, '0')}`;

  const finalDroppingOptions = droppingOptions.length > 0 ? droppingOptions : [
    { label: `${bus.destination}--${dropTime}`, value: `81,${dropTime},null` }
  ];

  if (loading) {
    return (
      <Card className="bg-card text-card-foreground shadow-xl overflow-hidden">
        <CardContent className="p-6 space-y-6">
          <div className="border-b border-border pb-3">
            <div className="h-5 w-48 bg-muted rounded animate-pulse"></div>
            <div className="h-3.5 w-32 bg-muted rounded mt-2 animate-pulse"></div>
          </div>
          <div className="flex flex-col lg:flex-row gap-8 items-center justify-center py-10">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Loading Seat Layout...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/20 border text-foreground shadow-xl overflow-hidden">
        <CardContent className="p-6 text-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Failed to Load Seat Map</h3>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card text-card-foreground shadow-xl overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <div className="border-b border-border pb-3">
          <h3 className="text-md font-bold text-foreground uppercase tracking-wide">
            Seat Layout - {bus.tripCode} ({bus.className})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select up to {maxSeats} seat{maxSeats > 1 ? 's' : ''}. Selected: {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
          </p>
        </div>

        <div className="flex flex-wrap gap-6 items-start justify-center">
          
          {/* Seat Grid Cabin */}
          <div className="bg-muted/30 border border-border p-4 rounded-2xl relative w-full max-w-sm shrink-0">
            {/* Steering wheel (Front of Bus) */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary animate-spin-slow" />
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">FRONT</span>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center text-muted-foreground hover:text-foreground">
                🛞
              </div>
            </div>

            {/* Rows of seats */}
            <div className="space-y-1.5">
              {Object.keys(rows).map(rowNum => {
                const rowSeats = rows[Number(rowNum)];
                
                // Determine if any seat exists in specific column groups for the entire bus
                const hasLeftSeats = Object.values(rows).some(r => r.some(s => s.col === 1 || s.col === 2));
                const hasCenterSeats = Object.values(rows).some(r => r.some(s => s.col === 3 || s.col === 4));
                const hasRightSeats = Object.values(rows).some(r => r.some(s => s.col === 5 || s.col === 6));
                
                const renderSeat = (colNum: number) => {
                  const seat = rowSeats.find(s => s.col === colNum);
                  if (!seat) {
                    return <div key={`empty-${rowNum}-${colNum}`} className="w-9 h-9" />;
                  }
                  
                  const isSelected = selectedSeats.includes(seat.seatNo);
                  return (
                    <button
                      key={seat.seatNo}
                      disabled={seat.isBooked}
                      type="button"
                      onClick={() => onSeatToggle(seat.seatNo)}
                      className={`w-9 h-9 rounded-md border flex flex-col items-center justify-center text-[10px] font-bold transition-all relative outline-none select-none ${
                        seat.isBooked
                          ? 'bg-muted border-border text-muted-foreground/70 cursor-not-allowed'
                          : seat.isLadies
                          ? isSelected
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950/20'
                            : 'bg-pink-900/30 border-pink-700/60 text-pink-300 hover:bg-pink-800/40'
                          : isSelected
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950/20'
                          : 'bg-secondary border-border text-secondary-foreground hover:bg-secondary/80 hover:border-border'
                      }`}
                      title={`Seat ${seat.seatNo} ${seat.isBooked ? '(Booked)' : seat.isLadies ? '(Ladies only)' : '(Available)'}`}
                    >
                      <span>{seat.seatNo.replace(/[WA]/g, '')}</span>
                      <span className="text-[7px] opacity-75 font-normal -mt-0.5">
                        {seat.col === 1 || seat.col === 6 ? 'W' : 'A'}
                      </span>
                    </button>
                  );
                };

                return (
                  <div key={rowNum} className="flex items-center justify-between gap-1">
                    {hasLeftSeats && (
                      <div className="flex gap-1">
                        {renderSeat(1)}
                        {renderSeat(2)}
                      </div>
                    )}

                    {hasCenterSeats && (
                      <div className="flex gap-1 justify-center w-10">
                        {rowSeats.some(s => s.col === 3 || s.col === 4) ? (
                          <>
                            {renderSeat(3)}
                            {renderSeat(4)}
                          </>
                        ) : null}
                      </div>
                    )}

                    {hasRightSeats && (
                      <div className="flex gap-1">
                        {renderSeat(5)}
                        {renderSeat(6)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legends & Dropdowns Info */}
          <div className="flex-1 w-full space-y-6">
            {/* Legends */}
            <div className="bg-muted/40 border border-border p-4 rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Seating Legend</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded border border-border bg-secondary"></div>
                  <span className="text-foreground">Available Seat</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded border border-pink-700 bg-pink-900/30"></div>
                  <span className="text-foreground">Ladies Seat</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded border border-border bg-muted flex items-center justify-center text-muted-foreground/70">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-foreground">Booked Seat</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded border border-emerald-500 bg-emerald-600"></div>
                  <span className="text-foreground">Selected Seat</span>
                </div>
              </div>
            </div>

            {/* Dropdowns */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Boarding Point & Time</label>
                <Select value={boardingPoint} onValueChange={(val) => onBoardingPointChange(val || '')}>
                  <SelectTrigger className="w-full bg-background focus:ring-primary">
                    <span className="truncate flex-1 text-left">
                      {finalBoardingOptions.find(opt => opt.value === boardingPoint)?.label || 'Select Boarding'}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {finalBoardingOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-foreground">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alighting Point & Time</label>
                <Select value={droppingPoint} onValueChange={(val) => onDroppingPointChange(val || '')}>
                  <SelectTrigger className="w-full bg-background focus:ring-primary">
                    <span className="truncate flex-1 text-left">
                      {finalDroppingOptions.find(opt => opt.value === droppingPoint)?.label || 'Select Dropping'}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {finalDroppingOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-foreground">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedSeats.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Please click on an available seat in the bus map to continue.</span>
              </div>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}

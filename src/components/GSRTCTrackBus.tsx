'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Navigation, Radio, MapPin, ShieldAlert,
  User, Phone, Calendar, Info, Loader2, BusFront
} from 'lucide-react';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-accent/10 text-muted-foreground gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm font-semibold">Loading Map Engine…</p>
    </div>
  ),
});

interface TrackingData {
  regNo: string;
  busNo: string;
  latitude: string | null;
  longitude: string | null;
  location: string;
  speed: string;
  direction: string;
  ignition: string;
  routeName: string;
  routeId: string;
  serviceType: string;
  depotName: string;
  conductorName: string;
  conductorNumber: string;
  makerName: string;
  receivedDate: string;
  lastStation: string;
  nextLocation: string;
  eta: string;
  status: string;
}

interface Props {
  onFirstSearch?: () => void;
}

export default function GSRTCTrackBus({ onFirstSearch }: Props) {
  const [regInput, setRegInput] = useState('');
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);
  // Controls whether we show the simple pre-search form or the full 2-col layout
  const [hasSearched, setHasSearched] = useState(false);
  const hasCalledFirstSearch = useRef(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTracking = async (targetReg: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/track?regNo=${encodeURIComponent(targetReg)}`);
      if (!res.ok) throw new Error('Vehicle not found or tracking offline.');
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setData(result);
      setCountdown(30);
      if (!hasCalledFirstSearch.current) {
        hasCalledFirstSearch.current = true;
        onFirstSearch?.();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while tracking.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regInput.trim()) return;
    setHasSearched(true); // immediately switch to 2-col layout
    fetchTracking(regInput.trim());
  };

  // Auto-refresh polling
  useEffect(() => {
    if (isAutoRefresh && data) {
      timerRef.current = setInterval(() => {
        fetchTracking(data.regNo);
      }, 30000);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => (prev > 1 ? prev - 1 : 30));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAutoRefresh, data?.regNo]);

  const isOnline = data?.ignition === 'ON';

  /* ─────────────────────────────────────────────────────────────
     PRE-SEARCH: simple centred search card — shown before the
     user clicks "Track Vehicle" for the first time
  ───────────────────────────────────────────────────────────── */
  if (!hasSearched) {
    return (
      <div className="max-w-xl mx-auto">
        <Card className="shadow-md border bg-card">
          <CardContent className="py-6 px-6">
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Vehicle Reg No. / PNR Number
                </label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 rotate-45" />
                  <Input
                    value={regInput}
                    onChange={e => setRegInput(e.target.value)}
                    placeholder="e.g. GJ-18-ZT-0206 or G227214486"
                    className="pl-9 h-10 w-full font-semibold uppercase text-sm placeholder:normal-case placeholder:font-normal"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Locating…</>
                  : 'Track Vehicle'}
              </Button>
              {error && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1 -mt-1">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />{error}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     POST-SEARCH: full 2-column grid
     Left  1/3 → status / route / checkpoints / staff cards
     Right 2/3 → search bar + live map
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 h-full">

      {/* ── LEFT COLUMN (33%) ── */}
      <div className="lg:col-span-1 flex flex-col gap-4 lg:h-[calc(100vh-8.5rem)] order-2 lg:order-1">

        {/* Loading / empty placeholder */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center h-40 rounded-xl border text-muted-foreground/50 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-medium">Locating vehicle…</p>
          </div>
        )}

        {!loading && !data && (
          <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed text-muted-foreground/50 gap-3">
            <BusFront className="w-10 h-10" />
            <p className="text-xs text-center font-medium">
              No data found.<br />Try a different registration number.
            </p>
          </div>
        )}

        {data && (
          <>
            {/* Unified Vehicle Details Card */}
            <Card className="shadow-sm border bg-card overflow-hidden shrink-0 p-0 h-full overflow-y-auto">
              <CardContent className="p-0">
                {/* 1. Status Section */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-lg font-black tracking-tight leading-none">{data.regNo}</p>
                      <p className="text-xs text-muted-foreground font-semibold mt-0.5">Bus No: {data.busNo}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0 ${
                      isOnline
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : 'bg-secondary text-secondary-foreground border-border'
                    }`}>
                      {isOnline ? '● Online' : '○ Offline'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-b border-border/40 py-2.5 text-center">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase font-bold block mb-0.5">Speed</span>
                      <span className="text-2xl font-black font-mono leading-none">{data.speed}</span>
                      <span className="text-xs text-muted-foreground font-normal ml-0.5">km/h</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground uppercase font-bold block mb-0.5">Status</span>
                      <span className={`text-sm font-bold uppercase block mt-1 ${
                        data.status === 'OnTrip' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                      }`}>
                        {data.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Radio className={`w-3 h-3 ${isAutoRefresh ? 'text-emerald-500 animate-pulse' : ''}`} />
                      <span className="text-xs">Auto refresh</span>
                    </div>
                    <button
                      onClick={() => setIsAutoRefresh(p => !p)}
                      className="text-xs font-bold text-primary hover:underline uppercase"
                    >
                      {isAutoRefresh ? `Stop (${countdown}s)` : 'Resume'}
                    </button>
                  </div>
                </div>

                {/* 2. Route Section */}
                <div className="border-t px-4 py-3 text-sm grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
                  {data.routeName !== 'N/A' && (
                    <>
                      <div className="text-muted-foreground font-bold uppercase tracking-wider text-xs pt-[1px]">Route:</div>
                      <div className="font-bold text-foreground leading-snug">{data.routeName.replace(/ to /gi, ' → ')}</div>
                    </>
                  )}
                  {data.depotName !== 'N/A' && (
                    <>
                      <div className="text-muted-foreground font-bold uppercase tracking-wider text-xs pt-[1px]">Depot:</div>
                      <div className="font-medium leading-snug">{data.depotName}</div>
                    </>
                  )}
                  {data.serviceType !== 'N/A' && (
                    <>
                      <div className="text-muted-foreground font-bold uppercase tracking-wider text-xs pt-[1px]">Bus:</div>
                      <div className="font-medium leading-snug">{data.serviceType}</div>
                    </>
                  )}
                </div>

                {/* 3. Checkpoints Section */}
                {(data.lastStation !== 'N/A' || data.nextLocation !== 'N/A') && (
                  <div className="border-t">
                    <div className="py-3 px-4 border-b bg-muted/20">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        Trip Progress
                      </h3>
                    </div>
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b bg-muted/30 text-[10px] text-muted-foreground uppercase font-semibold">
                          <th className="px-4 py-2">Type</th>
                          <th className="px-4 py-2">Station</th>
                          <th className="px-4 py-2">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {data.lastStation !== 'N/A' && (
                          <tr className="hover:bg-accent/10">
                            <td className="px-4 py-2 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">Last</td>
                            <td className="px-4 py-2 font-semibold">{data.lastStation}</td>
                            <td className="px-4 py-2 text-muted-foreground font-mono text-xs">{data.receivedDate}</td>
                          </tr>
                        )}
                        {data.nextLocation !== 'N/A' && (
                          <tr className="hover:bg-accent/10">
                            <td className="px-4 py-2 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">Next</td>
                            <td className="px-4 py-2 font-semibold">{data.nextLocation}</td>
                            <td className="px-4 py-2 text-muted-foreground font-mono text-xs">{data.eta}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 4. Duty Staff Section */}
                {(data.conductorName !== 'N/A' || data.conductorNumber !== 'N/A') && (
                  <div className="border-t">
                    <div className="py-3 px-4 border-b bg-muted/20">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        Duty Staff
                      </h3>
                    </div>
                    <div className="px-4 py-3 space-y-2.5 text-sm">
                      {data.conductorName !== 'N/A' && (
                        <div>
                          <span className="text-xs text-muted-foreground uppercase font-bold block">Conductor</span>
                          <span className="font-semibold uppercase">{data.conductorName}</span>
                        </div>
                      )}
                      {data.conductorNumber !== 'N/A' && (
                        <div>
                          <span className="text-xs text-muted-foreground uppercase font-bold block">Contact</span>
                          <a href={`tel:${data.conductorNumber}`} className="font-bold text-primary hover:underline flex items-center gap-1 mt-0.5 tracking-wide">
                            <Phone className="w-3.5 h-3.5" />
                            {data.conductorNumber.length === 10 
                              ? data.conductorNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
                              : data.conductorNumber}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── RIGHT COLUMN (66%) ── */}
      <div className="lg:col-span-2 flex flex-col gap-4 lg:h-[calc(100vh-8.5rem)] order-1 lg:order-2">

        {/* Search bar */}
        <Card className="shadow-sm border bg-card shrink-0 p-0">
          <CardContent className="py-2.5 px-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Vehicle Registration Number or PNR
                </label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 rotate-45" />
                  <Input
                    value={regInput}
                    onChange={e => setRegInput(e.target.value)}
                    placeholder="e.g. GJ-18-ZT-0206 or G227214486"
                    className="pl-9 h-9 w-full font-semibold uppercase text-sm placeholder:normal-case placeholder:font-normal"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-9 px-5 font-bold w-full sm:w-auto shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:mt-5"
              >
                {loading
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Locating…</>
                  : 'Track Vehicle'}
              </Button>
            </form>
            {error && (
              <p className="text-xs text-destructive mt-2 font-medium flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />{error}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Live Map — flex fill */}
        <Card className="shadow-sm border bg-card overflow-hidden p-0 flex-1 flex flex-col min-h-[400px] lg:min-h-0">
          <CardContent className="p-0 relative flex-1">
            {data?.latitude && data?.longitude ? (
              <LiveMap latitude={data.latitude} longitude={data.longitude} />
            ) : (
              <div
                className="w-full flex flex-col items-center justify-center bg-accent/10 text-muted-foreground gap-3"
                style={{ height: '100%' }}
              >
                <MapPin className="w-10 h-10 text-muted-foreground/30" />
                <div className="text-center">
                  <p className="text-sm font-semibold">
                    {loading ? 'Fetching location…' : 'No GPS Signal'}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">
                    {loading
                      ? 'Please wait while we locate this vehicle.'
                      : 'This vehicle is not currently reporting coordinates.'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

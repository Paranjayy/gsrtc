'use client';

import React, { useState } from 'react';
import GSRTCSearchForm from '@/components/GSRTCSearchForm';
import GSRTCBusList from '@/components/GSRTCBusList';
import GSRTCSeatLayout from '@/components/GSRTCSeatLayout';
import GSRTCPassengerForm from '@/components/GSRTCPassengerForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BusService } from '@/lib/gsrtc-data';
import { 
  Bus, CheckCircle2, Award, Calendar, Compass, 
  MapPin, Users, Ticket, ArrowLeft, ArrowRight, 
  Coins, CreditCard, Sparkles, Navigation, Loader2
} from 'lucide-react';

type BookingStep = 'search' | 'seat-selection' | 'summary' | 'success';

export default function Home() {
  // Booking States
  const [step, setStep] = useState<BookingStep>('search');
  const [searchParams, setSearchParams] = useState<{
    origin: string;
    destination: string;
    originId: string;
    originCode: string;
    destinationId: string;
    destinationCode: string;
    date: string;
    passengers: number;
    timestamp?: number;
  } | null>(null);

  const [selectedBus, setSelectedBus] = useState<BusService | null>(null);
  const [jsessionid, setJsessionid] = useState<string>('');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [boardingPoint, setBoardingPoint] = useState('');
  const [droppingPoint, setDroppingPoint] = useState('');

  const [passengerDetails, setPassengerDetails] = useState<{
    email: string;
    mobile: string;
    passengers: { name: string; age: number; gender: 'M' | 'F' }[];
  } | null>(null);

  const [pricing, setPricing] = useState({
    basic: 0, resFee: 0, accFee: 0, tollFee: 0, tollFeeR: 0, 
    serviceCharge: 0, otherLevies: 0, gst: 0, concessions: 0, 
    discount: 0, total: 0
  });
  const [isPricingLoading, setIsPricingLoading] = useState(false);

  // Search Submit Handler
  const handleSearchSubmit = (params: typeof searchParams) => {
    if (params) {
      setSearchParams({ ...params, timestamp: Date.now() });
    } else {
      setSearchParams(null);
    }
    setSelectedBus(null);
    setSelectedSeats([]);
    setStep('search'); // Stay on search, which will now display the listings below
  };

  // Bus Select Handler
  const handleSelectBus = (bus: BusService, sessionid: string) => {
    setSelectedBus(bus);
    setJsessionid(sessionid);
    setSelectedSeats([]);
    setBoardingPoint(`91,${bus.departureTime},1`); // default
    
    // drop off time calculation
    const [depHrs, depMins] = bus.departureTime.split(':').map(Number);
    let dropMins = depMins + 45;
    let dropHrs = depHrs + Math.floor(dropMins / 60);
    dropMins = dropMins % 60;
    const dropTime = `${String(dropHrs).padStart(2, '0')}:${String(dropMins).padStart(2, '0')}`;
    setDroppingPoint(`81,${dropTime},null`);
    
    setStep('seat-selection');
  };

  // Seat toggle handler
  const handleSeatToggle = (seatNo: string) => {
    const limit = searchParams?.passengers || 1;
    setSelectedSeats(prev => {
      if (prev.includes(seatNo)) {
        return prev.filter(s => s !== seatNo);
      }
      if (prev.length >= limit) {
        // Replace first selected seat
        return [...prev.slice(1), seatNo];
      }
      return [...prev, seatNo];
    });
  };

  // Booking details submit handler
  const handleBookingSubmit = async (details: NonNullable<typeof passengerDetails>) => {
    setPassengerDetails(details);
    setIsPricingLoading(true);
    
    try {
      const res = await fetch(`/api/fare?serviceInfo=${encodeURIComponent(selectedBus?.serviceInfo || '')}&jsessionid=${jsessionid}`);
      if (res.ok) {
        const data = await res.json();
        const m = selectedSeats.length;
        setPricing({
          basic: (data.basicFare || 0) * m,
          resFee: (data.resFee || 0) * m,
          accFee: (data.accFee || 0) * m,
          tollFee: (data.tollFee || 0) * m,
          tollFeeR: (data.tollFeeR || 0) * m,
          serviceCharge: (data.serviceCharge || 0) * m,
          otherLevies: (data.otherLevies || 0) * m,
          gst: (data.gst || 0) * m,
          concessions: (data.concessions || 0) * m,
          discount: (data.discount || 0) * m,
          total: (data.totalAmount || 0) * m
        });
      }
    } catch (e) {
      console.error("Failed to fetch pricing", e);
    } finally {
      setIsPricingLoading(false);
      setStep('summary');
    }
  };

  const handleReset = () => {
    setStep('search');
    setSearchParams(null);
    setSelectedBus(null);
    setSelectedSeats([]);
    setPassengerDetails(null);
  };

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleMockPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setStep('success');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Premium Navbar */}
      <header className="sticky top-0 z-50 bg-background/80 border-b backdrop-blur-md print:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-md font-black tracking-wider uppercase flex items-center gap-1.5 leading-none">
                GSRTC <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">CLONE</span>
              </span>
              <span className="text-[9px] text-muted-foreground font-semibold tracking-wide uppercase mt-0.5 block">
                Steering Miles with Smiles
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer transition-colors" onClick={handleReset}>Home</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Track Bus</span>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl space-y-6">
        
        {/* Banner Title */}
        {step !== 'summary' && (
          <div className="text-center space-y-2 py-4">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
              Advance Bus Ticket Booking
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm max-w-md mx-auto">
              Book your bus tickets quickly and securely using our clean, high-performance interface.
            </p>
          </div>
        )}

        {/* FUNNEL FLOW */}

        {/* STEP 1: Search and Listings */}
        {['search', 'seat-selection'].includes(step) && (
          <div className="space-y-6">
            <GSRTCSearchForm onSearch={handleSearchSubmit} />
            {searchParams && (
              <GSRTCBusList
                key={searchParams.timestamp}
                origin={searchParams.origin}
                originId={searchParams.originId}
                originCode={searchParams.originCode}
                destination={searchParams.destination}
                destinationId={searchParams.destinationId}
                destinationCode={searchParams.destinationCode}
                date={searchParams.date}
                passengers={searchParams.passengers}
                onSelectBus={handleSelectBus}
                selectedBusId={selectedBus?.serviceId}
              />
            )}
          </div>
        )}

        {/* STEP 2: Seat Selection and Passenger Details */}
        <Dialog open={step === 'seat-selection'} onOpenChange={(open) => {
          if (!open) {
            setStep('search');
            setSelectedBus(null);
            setSelectedSeats([]);
            setBoardingPoint('');
            setDroppingPoint('');
          }
        }}>
          <DialogContent className="max-w-6xl w-[95vw] h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-xl font-black tracking-tight">Select Seats & Passengers</DialogTitle>
            </DialogHeader>
            {/* Minimal spacing for the interactive grid */}

            {selectedBus && searchParams && (
              <div className="p-6 pt-2">
                {/* Main Interactive Container */}
                <div className="max-w-4xl mx-auto space-y-8 transition-all duration-500 ease-in-out">
                  
                  {/* Top/Full Width: Seat Map */}
                  <div>
                    <GSRTCSeatLayout
                      bus={selectedBus}
                      jsessionid={jsessionid}
                      selectedSeats={selectedSeats}
                      maxSeats={searchParams.passengers}
                      onSeatToggle={handleSeatToggle}
                      boardingPoint={boardingPoint}
                      onBoardingPointChange={setBoardingPoint}
                      droppingPoint={droppingPoint}
                      onDroppingPointChange={setDroppingPoint}
                    />
                  </div>

                  {/* Bottom: Passenger details (only enabled if a seat is selected) */}
                  {selectedSeats.length > 0 && (
                    <div className="animate-fade-in pb-8 relative">
                      <GSRTCPassengerForm
                        selectedSeatsCount={selectedSeats.length}
                        selectedSeats={selectedSeats}
                        onSubmit={handleBookingSubmit}
                      />
                      {isPricingLoading && (
                        <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <p className="mt-2 text-xs font-semibold text-primary uppercase tracking-widest">Fetching Exact Fare...</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* STEP 3: Summary / Success details */}
        {step === 'summary' && selectedBus && searchParams && passengerDetails && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            
            {/* Header checkmark */}
            <div className="text-center space-y-3 py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">Passenger Details Confirmed</h2>
              <p className="text-muted-foreground text-xs max-w-sm mx-auto">
                Your ticket details have been mapped. Review the invoice below before proceeding to checkout.
              </p>
            </div>

            {/* Trip Details Card */}
            <Card className="bg-card shadow-2xl overflow-hidden divide-y divide-border">
              
              <div className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Trip Details</h3>
                <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-sm">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Date of Journey</span>
                    <span className="font-semibold text-foreground mt-0.5 block flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {searchParams.date}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Service Start Place</span>
                    <span className="font-semibold text-foreground mt-0.5 block uppercase">{selectedBus.serviceInfo?.split(',')[7] || selectedBus.origin}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Passenger Start Point</span>
                    <span className="font-semibold text-foreground mt-0.5 block uppercase">{searchParams.origin}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Time of Departure</span>
                    <span className="font-semibold text-foreground mt-0.5 block">{selectedBus.departureTime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Class of Service</span>
                    <span className="font-semibold text-foreground mt-0.5 block uppercase">{selectedBus.className}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Pickup Point</span>
                    <span className="font-semibold text-foreground mt-0.5 block uppercase">{boardingPoint ? boardingPoint.split(',')[2] : searchParams.origin}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Service End Place</span>
                    <span className="font-semibold text-foreground mt-0.5 block uppercase">{selectedBus.serviceInfo?.split(',')[9] || selectedBus.destination}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Passenger End Point</span>
                    <span className="font-semibold text-foreground mt-0.5 block uppercase">{searchParams.destination}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Trip Code</span>
                    <span className="font-semibold text-foreground mt-0.5 block font-mono">{selectedBus.tripCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">No. of Seats</span>
                    <span className="font-semibold text-foreground mt-0.5 block">{selectedSeats.length}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Seat No/s</span>
                    <span className="font-semibold text-foreground mt-0.5 block font-mono text-primary">{selectedSeats.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Passenger Info */}
              <div className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Passenger Information</h3>
                <div className="space-y-3">
                  {passengerDetails.passengers.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-muted/40 border p-3 rounded-lg text-sm">
                      <div>
                        <p className="font-bold text-foreground tracking-wide">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">
                          Age: {p.age} • Gender: {p.gender === 'M' ? 'Male' : 'Female'}
                        </p>
                      </div>
                      <span className="text-xs font-bold bg-secondary border border-border text-secondary-foreground px-2 py-0.5 rounded">
                        Seat {selectedSeats[i]}
                      </span>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Email ID</span>
                      <span className="text-foreground block truncate">{passengerDetails.email}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Mobile No</span>
                      <span className="text-foreground block">{passengerDetails.mobile}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="p-6 bg-muted/20 divide-y divide-border space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Summary Info</h3>
                <div className="space-y-2 pt-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span className="uppercase text-xs">Basic Fare</span>
                    <span className="font-mono text-foreground">₹{pricing.basic.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="uppercase text-xs">Reservation Fee</span>
                    <span className="font-mono text-foreground">₹{pricing.resFee.toFixed(2)}</span>
                  </div>
                  {pricing.accFee > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span className="uppercase text-xs">Accident Insc Charges</span>
                      <span className="font-mono text-foreground">₹{pricing.accFee.toFixed(2)}</span>
                    </div>
                  )}
                  {pricing.tollFee > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span className="uppercase text-xs">Toll Fee</span>
                      <span className="font-mono text-foreground">₹{pricing.tollFee.toFixed(2)}</span>
                    </div>
                  )}
                  {pricing.tollFeeR > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span className="uppercase text-xs">Toll Fee Rajasthan</span>
                      <span className="font-mono text-foreground">₹{pricing.tollFeeR.toFixed(2)}</span>
                    </div>
                  )}
                  {pricing.serviceCharge > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span className="uppercase text-xs">Service Charge</span>
                      <span className="font-mono text-foreground">₹{pricing.serviceCharge.toFixed(2)}</span>
                    </div>
                  )}
                  {pricing.otherLevies > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span className="uppercase text-xs">Other Levies</span>
                      <span className="font-mono text-foreground">₹{pricing.otherLevies.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span className="uppercase text-xs">GST</span>
                    <span className="font-mono text-foreground">₹{pricing.gst.toFixed(2)}</span>
                  </div>
                  {pricing.concessions > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span className="uppercase text-xs">Concessions</span>
                      <span className="font-mono text-emerald-500">-₹{pricing.concessions.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span className="uppercase text-xs">Discounts</span>
                    <span className="font-mono text-emerald-500">-₹{pricing.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground border-t border-border pt-2.5 text-base uppercase">
                    <span className="text-[#ff5500]">Total</span>
                    <span className="font-bold text-[#ff5500]">Rs. {pricing.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Wallet Assignment details */}
              <div className="p-6 bg-muted/50 text-xs space-y-2">
                <div className="flex gap-2 text-primary">
                  <Coins className="w-4 h-4 shrink-0" />
                  <span className="font-bold uppercase tracking-wider text-[10px]">GSRTC Wallet Assigned</span>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-card border p-3 rounded-lg">
                  <div>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase block">Account Number</span>
                    <span className="font-mono text-foreground block mt-0.5">GJEWA1332996</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase block">Available Balance</span>
                    <span className="font-mono text-foreground block mt-0.5">₹0.00</span>
                  </div>
                </div>
              </div>

            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between pt-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="bg-secondary hover:bg-secondary/80 border-transparent text-secondary-foreground py-6"
                disabled={isProcessingPayment}
              >
                Book Another Ticket
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-6 shadow-lg shadow-emerald-950/40 flex items-center gap-2"
                onClick={handleMockPayment}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting to Gateway...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Proceed to Payment
                  </>
                )}
              </Button>
            </div>

          </div>
        )}

        {/* STEP 4: Success Ticket View */}
        {step === 'success' && selectedBus && searchParams && passengerDetails && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in print:max-w-none print:m-0">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Trip Details Left */}
              <Card className="md:col-span-2 bg-muted/10 shadow-none border rounded-none">
                <div className="p-4 border-b">
                  <h3 className="text-lg text-muted-foreground font-light">Trip Details</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-y-4 text-[11px] md:text-xs text-muted-foreground">
                    <div className="uppercase text-[#ff5500] font-semibold">TRIP DETAILS</div>
                    <div className="text-[#ff5500] font-semibold">One Way</div>
                    
                    <div className="uppercase">PNR NUMBER</div>
                    <div className="text-foreground">G227214486</div>
                    
                    <div className="uppercase">DATE OF JOURNEY</div>
                    <div className="text-foreground">{searchParams.date}</div>
                    
                    <div className="uppercase">SERVICE START PLACE</div>
                    <div className="text-foreground uppercase">{selectedBus.serviceInfo?.split(',')[7] || selectedBus.origin}</div>
                    
                    <div className="uppercase">SERVICE START POINT</div>
                    <div className="text-foreground uppercase">{selectedBus.serviceInfo?.split(',')[7] || selectedBus.origin}</div>
                    
                    <div className="uppercase">PASSENGER START POINT</div>
                    <div className="text-foreground uppercase">{searchParams.origin}</div>
                    
                    <div className="uppercase">TIME OF DEPARTURE</div>
                    <div className="text-foreground">{selectedBus.departureTime}</div>
                    
                    <div className="uppercase">CLASS OF SERVICE</div>
                    <div className="text-foreground uppercase">{selectedBus.className}</div>
                    
                    <div className="uppercase">PICKUP POINT</div>
                    <div className="text-foreground uppercase">{boardingPoint ? boardingPoint.split(',')[2] : searchParams.origin}</div>
                    
                    <div className="uppercase">SERVICE END PLACE</div>
                    <div className="text-foreground uppercase">{selectedBus.serviceInfo?.split(',')[9] || selectedBus.destination}</div>
                    
                    <div className="uppercase">PASSENGER END POINT</div>
                    <div className="text-foreground uppercase">{searchParams.destination}</div>
                    
                    <div className="uppercase">TRIP CODE</div>
                    <div className="text-foreground">{selectedBus.tripCode}</div>
                    
                    <div className="uppercase">NO. OF SEATS</div>
                    <div className="text-foreground">{selectedSeats.length}</div>
                    
                    <div className="uppercase">SEAT NO/S</div>
                    <div className="text-foreground">{selectedSeats.join(', ')}</div>
                  </div>
                </div>
              </Card>

              {/* Booking Summary Right */}
              <Card className="bg-muted/10 shadow-none border rounded-none h-fit">
                <div className="p-4 border-b">
                  <h3 className="text-lg text-muted-foreground font-light">Booking summary</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-y-4 text-[11px] md:text-xs text-muted-foreground">
                    <div></div>
                    <div className="text-[#ff5500] font-semibold text-right">One Way</div>

                    <div className="uppercase">BASIC FARE</div>
                    <div className="text-foreground text-right">{pricing.basic.toFixed(2)}</div>

                    <div className="uppercase">RESERVATION FEE</div>
                    <div className="text-foreground text-right">{pricing.resFee.toFixed(2)}</div>

                    <div className="uppercase">ACCIDENT INSC CHARGES</div>
                    <div className="text-foreground text-right">{pricing.accFee.toFixed(2)}</div>

                    <div className="uppercase">TOLL FEE</div>
                    <div className="text-foreground text-right">{pricing.tollFee.toFixed(2)}</div>

                    <div className="uppercase">TOLL FEE RAJASTHAN</div>
                    <div className="text-foreground text-right">{pricing.tollFeeR.toFixed(2)}</div>

                    <div className="uppercase">SERVICE CHARGE</div>
                    <div className="text-foreground text-right">{pricing.serviceCharge.toFixed(2)}</div>

                    <div className="uppercase">OTHER LEVIES</div>
                    <div className="text-foreground text-right">{pricing.otherLevies.toFixed(2)}</div>

                    <div className="uppercase">GST</div>
                    <div className="text-foreground text-right">{pricing.gst.toFixed(2)}</div>

                    <div className="uppercase">CONCESSIONS</div>
                    <div className="text-foreground text-right">{pricing.concessions.toFixed(2)}</div>

                    <div className="uppercase">DISCOUNTS</div>
                    <div className="text-foreground text-right">{pricing.discount.toFixed(2)}</div>

                    <div className="uppercase font-bold text-[#ff5500] pt-4 border-t mt-2">TOTAL</div>
                    <div className="font-bold text-[#ff5500] text-right pt-4 border-t mt-2">RS. {pricing.total.toFixed(2)}</div>
                  </div>
                </div>
              </Card>

            </div>

            {/* Passenger Information */}
            <Card className="bg-muted/10 shadow-none border rounded-none">
              <div className="p-4 border-b">
                <h3 className="text-lg text-muted-foreground font-light">Passenger Information</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-y-4 text-[11px] md:text-xs">
                  <div className="uppercase text-[#ff5500] font-semibold">NAME</div>
                  <div className="uppercase text-[#ff5500] font-semibold">AGE</div>
                  <div className="uppercase text-[#ff5500] font-semibold">GENDER</div>

                  {passengerDetails.passengers.map((p, i) => (
                    <React.Fragment key={i}>
                      <div className="uppercase text-muted-foreground">{p.name}</div>
                      <div className="text-muted-foreground">{p.age} (Adult)</div>
                      <div className="text-muted-foreground">{p.gender === 'M' ? 'Male' : 'Female'}</div>
                    </React.Fragment>
                  ))}

                  <div className="uppercase text-muted-foreground mt-4">EMAIL ID</div>
                  <div className="text-muted-foreground mt-4 col-span-2">{passengerDetails.email}</div>

                  <div className="uppercase text-muted-foreground mt-2">MOBILE NO</div>
                  <div className="text-muted-foreground mt-2 col-span-2">{passengerDetails.mobile}</div>
                </div>
                
                <div className="pt-2 print:hidden">
                  <Button 
                    className="bg-[#d9534f] hover:bg-[#c9302c] text-white rounded shadow"
                    onClick={() => window.print()}
                  >
                    Print-Onward
                  </Button>
                </div>
              </div>
            </Card>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-background border-t py-6 text-center text-xs text-muted-foreground mt-12 leading-relaxed print:hidden">
        <div className="container mx-auto space-y-1">
          <p>© {new Date().getFullYear()} Gujarat State Road Transport Corporation (GSRTC) Clone.</p>
          <p>Built for educational demonstration. Enhanced UI, zero-latency caching, and client-side form validations.</p>
        </div>
      </footer>

    </div>
  );
}

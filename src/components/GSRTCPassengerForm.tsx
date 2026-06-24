'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, User, Award, ShieldAlert, Sparkles } from 'lucide-react';

interface PassengerFormProps {
  selectedSeatsCount: number;
  selectedSeats: string[];
  onSubmit: (details: {
    email: string;
    mobile: string;
    passengers: Array<{
      name: string;
      age: number;
      gender: 'M' | 'F';
    }>;
  }) => void;
}

export default function GSRTCPassengerForm({
  selectedSeatsCount,
  selectedSeats,
  onSubmit
}: PassengerFormProps) {
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  
  // Create an array of passenger details state matching selectedSeatsCount
  const [passengerDetails, setPassengerDetails] = useState<Array<{ name: string; age: string; gender: 'M' | 'F' }>>(
    Array.from({ length: selectedSeatsCount || 1 }, () => ({ name: '', age: '', gender: 'M' }))
  );

  // Sync inputs if seat selection changes count
  React.useEffect(() => {
    setPassengerDetails(prev => {
      const currentCount = selectedSeatsCount || 1;
      if (prev.length === currentCount) return prev;
      if (prev.length < currentCount) {
        const diff = currentCount - prev.length;
        const newItems = Array.from({ length: diff }, () => ({ name: '', age: '', gender: 'M' as const }));
        return [...prev, ...newItems];
      } else {
        return prev.slice(0, currentCount);
      }
    });
  }, [selectedSeatsCount]);

  // Validation States
  const [errors, setErrors] = useState<{
    email?: string;
    mobile?: string;
    passengers?: string[];
  }>({});

  const handlePassengerChange = (index: number, key: 'name' | 'age' | 'gender', value: string) => {
    setPassengerDetails(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [key]: value
      };
      return updated;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    let isValid = true;

    // Email Check
    if (!email) {
      newErrors.email = 'Email address is required.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
      isValid = false;
    }

    // Mobile Check (Sequential and Repetitive Check)
    if (!mobile) {
      newErrors.mobile = 'Mobile number is required.';
      isValid = false;
    } else if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      newErrors.mobile = 'Mobile number must be exactly 10 digits.';
      isValid = false;
    } else {
      // Repetitive or sequential check
      const digits = mobile.split('');
      const isRepetitive = digits.every(d => d === digits[0]);
      
      const sequentialForward = '0123456789';
      const sequentialBackward = '9876543210';
      const isSequential = sequentialForward.includes(mobile) || sequentialBackward.includes(mobile);
      
      if (isRepetitive || isSequential) {
        newErrors.mobile = 'Invalid mobile number: Repetitive or sequential patterns are not allowed.';
        isValid = false;
      }
    }

    // Passenger details validation
    const passErrors: string[] = [];
    passengerDetails.forEach((p, idx) => {
      let err = '';
      if (!p.name.trim()) {
        err = 'Name is required.';
      } else if (!/^[A-Za-z\s]+$/.test(p.name)) {
        err = 'Name must contain only alphabets.';
      } else if (!p.age) {
        err = 'Age is required.';
      } else {
        const ageNum = Number(p.age);
        if (isNaN(ageNum) || ageNum < 5 || ageNum > 120) {
          err = 'Age must be between 5 and 120.';
        }
      }
      passErrors[idx] = err;
      if (err) isValid = false;
    });

    newErrors.passengers = passErrors;
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        email,
        mobile,
        passengers: passengerDetails.map(p => ({
          name: p.name.toUpperCase(),
          age: Number(p.age),
          gender: p.gender
        }))
      });
    }
  };

  return (
    <Card className="bg-card text-card-foreground shadow-xl overflow-hidden">
      <CardHeader className="border-b border-border bg-muted/20 py-4">
        <CardTitle className="text-md font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Passenger Information
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Contact Details */}
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email for ticket delivery"
                  className={`pl-10 bg-background ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit mobile number"
                  className={`pl-10 bg-background ${
                    errors.mobile ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                />
              </div>
              {errors.mobile && <p className="text-xs text-red-400 mt-1">{errors.mobile}</p>}
            </div>
          </div>

          <hr className="border-border" />

          {/* Passenger Input Fields */}
          <div className="space-y-5">
            {passengerDetails.map((passenger, index) => (
              <div key={index} className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border relative">
                <span className="absolute right-4 top-3 text-[10px] bg-secondary border border-border text-secondary-foreground px-2 py-0.5 rounded-full font-mono font-bold">
                  Seat: {selectedSeats[index] || `Temp-${index+1}`}
                </span>
                
                <h4 className="text-xs font-bold text-primary uppercase tracking-wide">
                  Passenger #{index + 1}
                </h4>

                <div className="flex flex-col gap-4">
                  
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={passenger.name}
                        onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                        placeholder="Enter full name"
                        className="pl-10 bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    {/* Age */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Age</label>
                      <Input
                        type="text"
                        maxLength={3}
                        value={passenger.age}
                        onChange={(e) => handlePassengerChange(index, 'age', e.target.value.replace(/\D/g, ''))}
                        placeholder="Age"
                        className="bg-background text-center"
                      />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gender</label>
                      <Select
                        value={passenger.gender}
                        onValueChange={(val) => handlePassengerChange(index, 'gender', val as 'M' | 'F')}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          <SelectItem value="M" className="text-foreground">Male</SelectItem>
                          <SelectItem value="F" className="text-foreground">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {errors.passengers?.[index] && (
                  <p className="text-xs text-red-400 mt-1">{errors.passengers[index]}</p>
                )}

              </div>
            ))}
          </div>

          {/* Guidelines notes */}
          <div className="space-y-2 bg-muted/50 border border-border p-4 rounded-xl text-xs text-muted-foreground leading-relaxed">
            <div className="flex gap-2 text-yellow-500">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Important Note:</span>
            </div>
            <p>
              Please ensure that payment transaction is completed in <strong>7 minutes</strong> or else the seat will be automatically released for other passengers.
            </p>
            <p className="flex items-center gap-1.5 mt-1">
              <Award className="w-3.5 h-3.5 text-primary" />
              E-Wallet account details will be automatically retrieved or created using the provided email and mobile number.
            </p>
          </div>

          {/* Book Ticket CTA */}
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 text-sm tracking-wider uppercase transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]"
          >
            Book Ticket
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}

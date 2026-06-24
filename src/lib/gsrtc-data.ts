export interface Station {
  id: string;
  code: string;
  name: string;
}

export interface BusService {
  serviceId: string;
  tripCode: string;
  className: string;
  origin: string;
  destination: string;
  departureTime: string;
  duration: string;
  fare: number;
  availableSeats: number;
  isFull: boolean;
  serviceInfo?: string;
}

export interface Seat {
  seatNo: string;
  isBooked: boolean;
  isLadies: boolean;
  type: 'Seat' | 'Berth';
  row: number;
  col: number;
}

export const STATIONS: Station[] = [
  { id: '57', code: 'JND', name: 'JUNAGADH' },
  { id: '64', code: 'DRJ', name: 'DHORAJI' },
  { id: '4993', code: 'Junag', name: 'Junagadh (Local)' },
  { id: '9409', code: 'Jun436', name: 'Junagadh Amreli' },
  { id: '10191', code: 'AZADC', name: 'JUNAGADH AZAD CHOK' },
  { id: '10553', code: 'JNDDL', name: 'JUNAGADH DOLATPARA' },
  { id: '3071', code: 'JNDGC', name: 'JUNAGADH GANDHI CHOWK' },
  { id: '4745', code: 'DRJBD', name: 'DHORAJI BHADER' },
  { id: '10682', code: 'DHRB', name: 'DHORAJI BYPASS' },
  { id: '4751', code: 'DRJHY', name: 'DHORAJI HARIYASAN' },
  { id: '4752', code: 'DRJJT', name: 'DHORAJI JAMTIMDI' },
  { id: '4757', code: 'DRJKT', name: 'DHORAJI KHATLI' }
];

export const BUS_SERVICES: BusService[] = [
  {
    serviceId: '47934',
    tripCode: '0600JNDJMNAC45',
    className: 'AC LUXURY',
    origin: 'JUNAGADH',
    destination: 'DHORAJI',
    departureTime: '06:00',
    duration: '00:45',
    fare: 63,
    availableSeats: 37,
    isFull: false
  },
  {
    serviceId: '47935',
    tripCode: '1110JNDJMNLUXRY',
    className: 'LUXURY',
    origin: 'JUNAGADH',
    destination: 'DHORAJI',
    departureTime: '11:10',
    duration: '00:40',
    fare: 49,
    availableSeats: 39,
    isFull: false
  },
  {
    serviceId: '47936',
    tripCode: '1745VRLJMNLUX41',
    className: 'LUXURY',
    origin: 'JUNAGADH',
    destination: 'DHORAJI',
    departureTime: '20:05',
    duration: '00:40',
    fare: 49,
    availableSeats: 0,
    isFull: true
  },
  {
    serviceId: '47937',
    tripCode: '0615JNDJMNGJR47',
    className: 'EXPRESS',
    origin: 'JUNAGADH',
    destination: 'DHORAJI',
    departureTime: '06:15',
    duration: '00:40',
    fare: 34,
    availableSeats: 42,
    isFull: false
  },
  {
    serviceId: '47938',
    tripCode: '1200JNDDHLLC51',
    className: 'EXPRESS',
    origin: 'JUNAGADH',
    destination: 'DHORAJI',
    departureTime: '12:00',
    duration: '01:10',
    fare: 30,
    availableSeats: 40,
    isFull: false
  }
];

// Generates a mock seat configuration for a bus layout (2x2 seating grid)
export function getMockSeats(serviceId: string): Seat[] {
  const seats: Seat[] = [];
  
  // Custom seed using service ID length to make seats unique
  const seed = serviceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Total 40 seats in rows 1 to 10, cols 1 to 4
  // Plus back row
  let seatIndex = 1;
  
  for (let row = 1; row <= 10; row++) {
    for (let col = 1; col <= 4; col++) {
      const isBooked = ((seed * row * col) % 7 === 0) || ((row + col) % 4 === 0);
      const isLadies = !isBooked && ((row * col) % 11 === 0);
      
      // Let's name the seat, e.g. "5" or "12W" etc.
      // In the layout: window seats are on the sides (col 1 and col 4)
      const suffix = col === 1 || col === 4 ? 'W' : 'A';
      
      seats.push({
        seatNo: `${seatIndex}${suffix}`,
        isBooked,
        isLadies,
        type: 'Seat',
        row,
        col
      });
      seatIndex++;
    }
  }
  return seats;
}

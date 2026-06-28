# GSRTC API Architecture Overview

This document outlines all the upstream GSRTC APIs our application currently uses, their purpose, and the data they provide.

## 1. Route Search API
* **Endpoint**: `POST https://gsrtc.in/OPRSOnline/jqreq.do?hiddenAction=SearchServiceForHome`
* **Purpose**: Fetches the official schedule of available buses between two stations (Origins and Destinations) for a specific date.
* **How it works**: This is a legacy servlet endpoint. It requires a complex `application/x-www-form-urlencoded` body. Instead of JSON, it responds with raw HTML representing the booking tables. Our Next.js backend intercepts this HTML and parses it into a clean JSON array.
* **Information Provided**:
  - `tripCode` (e.g. `1415SMLBVN`)
  - `serviceId` (Booking ID)
  - `origin` & `destination`
  - `departureTime`
  - `duration` & `fare`
  - `availableSeats` & `className` (e.g., Sleeper, Luxury, Express)

## 2. PNR Resolution API
* **Endpoint**: `POST https://live.gsrtc.org/api/pnr`
* **Purpose**: Takes a passenger's PNR/Ticket Booking Number (e.g., `G227214486`) and resolves it into actionable tracking data.
* **How it works**: Expects a JSON body with `{ pnrNo: "..." }`.
* **Information Provided**:
  - `VEHICLE_NO`: The actual assigned license plate of the bus running that trip.
  - `CONDUCTOR_MOBILE_NO`: The active phone number of the conductor assigned to that PNR's trip.

## 3. Vehicle Tooltip & Telemetry API
* **Endpoint**: `POST https://live.gsrtc.org/api/vehicle/tooltip`
* **Purpose**: Retrieves real-time vehicle metadata and hardware telemetry for a specific bus registration number.
* **How it works**: Expects a JSON body with `{ vehicleNo: "GJ18ZT0304" }`.
* **Information Provided**:
  - `busNo` (Internal Fleet ID, e.g., `17648`)
  - `speed` (Current GPS speed in km/h)
  - `depotName`, `routeName`, `serviceType`
  - `conductorName` & `conductorNumber`
  - **Hardware Metrics**: `ignition` status, `idle`/`running` flags, `makerName` (bus manufacturer), and `busOwner`.

## 4. Live Vehicle Tracking API
* **Endpoint**: `POST https://live.gsrtc.org/api/vehicle/live`
* **Purpose**: Retrieves the live geographical coordinates and route checkpoint progress of the vehicle.
* **How it works**: Expects a JSON body with `{ vehicleNo: "GJ18ZT0304", scheduleDate: "YYYY-MM-DD" }`.
* **Information Provided**:
  - `latitude` & `longitude`
  - `lastBusStation` (The previous checkpoint crossed)
  - `lastArrivalDateTime` (When it crossed the last checkpoint)
  - `nextLocation` (The upcoming scheduled stop)
  - `eta` (Estimated Time of Arrival at the next location)
  - `status` (e.g., `OnTrip`)

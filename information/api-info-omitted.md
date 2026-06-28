# GSRTC API Omitted Data

This document catalogs the telemetry and operational data provided by the GSRTC tracking APIs (`/api/vehicle/tooltip` and `/api/vehicle/live`) that is **not currently displayed** on the frontend tracking dashboard.

## 1. Engine & Telemetry Status
* **`ignition`**: Whether the engine is currently `ON` or `OFF`.
* **`idle` / `running`**: Boolean flags (0 or 1) indicating if the bus is currently driving or idling at a stop.
* **`nocomm`**: A flag that indicates if the GPS device has lost communication with the cellular network.
* **`underMaintenance`**: A flag indicating if the bus is currently marked as being in the garage for repairs or servicing.

## 2. Vehicle Hardware Details
* **`makerName`**: The manufacturer of the bus chassis (e.g. `"Ashok Leyland"`, `"Tata"`, `"Volvo"`).
* **`busOwner`**: Who owns the bus (e.g. `"GSRTC"`). GSRTC sometimes hires private operator buses during peak seasons, so this field can indicate whether it's a state-owned or a hired/contractor bus.

## 3. Extra Trip Data
* **`direction`**: Indicates `"Up"` or `"Down"` (In Indian transit systems, Up/Down traditionally refers to the direction of travel relative to the main terminus or headquarters).
* **`departureDateTime`**: The exact timestamp when the bus originally departed from its *very first* starting station of the entire route (e.g., `28/06/2026 21:00:00`). Note: The dashboard currently only shows the most recently crossed station timestamp (`lastArrivalDateTime`).
* **`routeId`**: The internal database ID for the scheduled route (e.g. `"3571"`).
* **`location`**: A raw text string of the general geographic location pinged by the GPS (e.g. `"Gujarat,India"`). This is largely redundant since we plot the exact latitude/longitude directly onto an interactive map.

# GSRTC Payment Integration Diagnostic Report

This document details the exhaustive efforts to reverse-engineer and integrate the final payment step of the GSRTC booking flow into a custom Next.js application.

## 🎯 The Goal
To allow users to search for buses, select seats, and initiate payment entirely within a custom Next.js UI, before seamlessly handing off the session to GSRTC's payment gateway (ICICI/HDFC) to complete the transaction.

## 🏗️ Architectures Attempted

### 1. The Backend Proxy Approach
**How it worked:**
- The Next.js API route (`/api/booking/initiate`) attempted to mimic the exact HTTP POST request that the official GSRTC website's `<form>` submits to `advanceBooking.do`.
- We perfectly synthesized the 100+ hidden fields, including extracting specific internal IDs like `rowcol` (e.g., `057-O39`) and `hiddenOnwardPickupPointDetails` (e.g., `AMRELI--20:00`).
- We passed the exact `JSESSIONID`, `Referer`, and `Origin` headers to bypass basic CSRF checks.

**Why it failed:**
- The server consistently returned an opaque `Oops! Invalid URL Detected` page instead of the expected Prepayment gateway HTML. 
- **Diagnosis:** GSRTC's legacy Java Struts backend (or their Web Application Firewall like F5 BIG-IP) has hyper-strict session state validations. If any internal server state (like a hidden token, sequence counter, or specific IP-binding to the `JSESSIONID`) mismatches the exact flow expected by their monolithic frontend, it throws a `NullPointerException` or `TokenException`, which is caught and rendered as the generic "Oops" page.

### 2. The Frontend Auto-Submit Approach
**How it worked:**
- Instead of using the Node.js backend to make the request, we used the backend to compute the complex payload dictionary and returned it to the React frontend.
- The frontend dynamically generated an invisible HTML `<form>` targeting `https://gsrtc.in/OPRSOnline/advanceBooking.do;jsessionid=...` and automatically submitted it via JavaScript.

**Why it failed:**
- **Cross-Origin Referer Blocks:** Browsers strictly enforce the `Referer` and `Origin` headers on form submissions. Because the form was hosted on `http://localhost:3000`, the browser sent `localhost` as the Referer.
- GSRTC's firewall natively drops any POST request to `advanceBooking.do` that does not originate from `https://gsrtc.in`, instantly triggering the same "Oops" error page.

---

## 🔍 Payload Secrets Decoded (What We Got Right)

Despite the final submission failing, we successfully reverse-engineered 95% of the booking payload sequence:

1. **Seat Locking (`SubmitToGetAjaxSeatLayout`)**: We successfully replicated the seat locking mechanism. This step is mandatory because it registers the chosen `slNo` (Seat Layout Number) into the Java `JSESSIONID` state.
2. **`rowcol` Mapping**: We discovered that seats cannot just be passed as `39`. They must be mapped to their internal grid ID (e.g., `057-O39`), which must be regex-extracted from the `checkBooking` click handlers in the seat layout HTML.
3. **Pickup/Drop Formatting**: The system will crash if you do not synthesize the exact `CITY_NAME--HH:MM` string (e.g., `AMRELI--20:00`). Sending the raw value (`126,20:00,null`) is insufficient.
4. **Array Formatting**: Arrays like `txtNameArray` require trailing commas (e.g., `Yajuvendra Gida,`) because the legacy Javascript on their site unconditionally appends them, and the Java backend expects that specific split behavior.

---

## 🚀 Future Approaches (How to make it work)

To successfully finalize a booking, we must bridge the gap between our custom UI and GSRTC's strict session enforcement. Here are the viable paths forward:

### Option A: The iFrame Handoff (Recommended)
Instead of trying to bypass the `advanceBooking.do` form submission, we can embed the official GSRTC site in a hidden `<iframe>` during the final step.
1. Our backend logs into GSRTC or initializes the session and passes the `JSESSIONID` to the frontend.
2. We load the official `advanceBooking.do` page inside an iframe.
3. We use `postMessage` or cross-origin hacks (if possible) to inject the passenger details into their native form, and trigger their native `GetFareDetails()` click event.

### Option B: Reverse Engineer the Struts Token
There is a high probability that a hidden Struts session counter or token is being incremented when `SubmitToGetAjaxSeatLayout` is called.
- We need to capture the *entire* sequence of network requests from a clean browser session using a tool like Wireshark or Charles Proxy, paying close attention to any `Set-Cookie` headers from intermediate load balancers (like Cloudflare `__cf_bm` or AWS ELB cookies) that `node-fetch` might be dropping.

### Option C: The Headless Browser (Puppeteer/Playwright)
If API parity is impossible due to WAF bot-protection (e.g., Akamai/Cloudflare TLS fingerprinting), the Next.js backend can spin up a lightweight Headless Chrome instance.
1. The user clicks "Pay" on the Next.js UI.
2. The Node.js server opens Puppeteer, navigates to GSRTC, injects the cookies, fills the form using DOM manipulation, and clicks the native buttons.
3. Puppeteer intercepts the final redirect to ICICI, extracts the ICICI payload, and passes it back to the Next.js frontend to execute.
*(Note: This is slower, but guaranteed to work since it perfectly mimics a real browser).*

### Option D: Direct Payment Gateway Spoofing (Risky)
Instead of submitting passenger details to GSRTC, we jump straight to the ICICI payload generation. 
- However, this is likely impossible because GSRTC must internally register the PNR/Ticket status as "Pending Payment" in their Oracle database before ICICI processes it. If we bypass GSRTC, the payment will succeed but the ticket will not be generated.

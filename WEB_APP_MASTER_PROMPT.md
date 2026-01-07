# MASTER PROMPT: React.js Web Application for NANO Taxi Booking System

## 🎯 OBJECTIVE
Convert the existing React Native mobile application (NANO Taxi) into a fully functional ReactJS web application that maintains 100% feature parity with the mobile app while adapting the UI/UX for web browsers and ensuring responsive design across all device sizes.

---

## 📁 PROJECT SETUP

### 1. Initialize Project
```bash
npx create-react-app nanosuperapp-web --template typescript
cd nanosuperapp-web
```

### 2. Install Required Dependencies
```bash
npm install axios react-router-dom
npm install @types/react-router-dom --save-dev
npm install lucide-react
npm install html2canvas jspdf
npm install date-fns
```

### 3. Folder Structure
Create the following folder structure:
```
nanosuperapp-web/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AuthPopup.tsx
│   │   ├── TaxiLoading.tsx
│   │   ├── InvoiceGenerator.tsx
│   │   ├── LocationInputModal.tsx
│   │   ├── HireDriverButton.tsx
│   │   └── PremiumModal.tsx
│   ├── contexts/            # React Context for state management
│   │   ├── AuthContext.tsx
│   │   └── BookingContext.tsx
│   ├── pages/               # Page components (screens)
│   │   ├── HomePage.tsx
│   │   ├── BookingsPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── LocationPage.tsx
│   │   ├── VehicleSelectionPage.tsx
│   │   ├── ConfirmationPage.tsx
│   │   ├── TrackingPage.tsx
│   │   └── HireDriverPage.tsx
│   ├── services/            # API and utility services
│   │   ├── apiClient.ts
│   │   └── Distance.ts
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   ├── constants/           # App constants
│   │   └── Colors.ts
│   ├── hooks/               # Custom React hooks
│   │   └── useThemeColor.ts
│   ├── App.tsx              # Main App component with routing
│   ├── App.css              # Global styles
│   └── index.tsx            # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔐 AUTHENTICATION SYSTEM

### AuthContext.tsx
Create a React Context that manages user authentication state. This context must provide:

**Context Interface:**
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
}
```

**User Type:**
```typescript
interface User {
  id: string;
  customer_id: string;
  username: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  contact?: string;
}
```

**Storage:**
- Use `localStorage.setItem('user', JSON.stringify(userData))` instead of AsyncStorage
- On app load, check `localStorage.getItem('user')` to restore user session

**API Endpoints:**
1. **Login:** `POST /api/login/`
   - Payload: `{ contact: string, password: string }`
   - Response: User object with `customer_id`
   
2. **Signup (Registration):** `POST /api/register/`
   - Payload: `{ contact: string, type: 'email' | 'phone' }`
   - Response: OTP sent confirmation
   
3. **Verify OTP:** `POST /api/verify_otp/`
   - Payload: `{ contact: string, otp: string }`
   - Response: `{ status: 'success', temp_key: string }`
   
4. **Set Password:** `POST /api/set_password/`
   - Payload: `{ temp_key: string, password: string }`
   - Response: `{ status: 'success', customer_id: string }`

---

## 🚗 BOOKING SYSTEM

### BookingContext.tsx
Create a React Context for managing booking state and operations.

**Context Interface:**
```typescript
interface BookingContextType {
  currentBooking: Booking | null;
  confirmedBookings: Booking[];
  bookingHistory: Booking[];
  createBooking: (
    user: any,
    startLocation: Location,
    endLocation: Location,
    vehicle: Vehicle,
    fare: number,
    pickupInstructions?: string,
    pickupOption?: 'now' | 'schedule',
    pickupDate?: Date | null,
    pickupTime?: Date | null,
    roundTrip?: boolean
  ) => Promise<boolean>;
  calculateFare: (start: Location, end: Location, vehicle: Vehicle) => number;
  fetchConfirmedBookings: () => Promise<void>;
  fetchBookingHistory: () => Promise<void>;
  setCurrentBooking: (booking: Booking | null) => void;
}
```

**API Endpoints:**
1. **Create Booking:** `POST /api/book_ride/`
   ```json
   {
     "customer_id": "string",
     "start_point": "string",
     "end_point": "string",
     "vehicle_type": "string",
     "total_amount": "string",
     "date_of_travel": "YYYY-MM-DD",
     "pickup_time": "HH:MM",
     "ride_instructions": "string",
     "round_trip": boolean
   }
   ```

2. **Fetch Confirmed Bookings:** `GET /api/list_rides_by_customer/{customer_id}`
   - Response: `{ rides: Booking[] }`

3. **Fetch Booking History:** `GET /api/list_closed_rides_by_customer/{customer_id}`
   - Response: `{ closed_rides: Booking[] }`

4. **Fetch Package Bookings:** `GET /api/list_package_rides_by_customer/{customer_id}`
   - Response: `{ package_rides: PackageBooking[] }`

5. **Fetch Customer Details:** `GET /api/get_customer/{customer_id}/`
   - Response: `{ customer: CustomerData }`

6. **Update Customer:** `PUT /api/edit_customer/{customer_id}/`
   - Payload: `{ email?: string, phone_number?: string }`

---

## 📡 API CLIENT SERVICE

### apiClient.ts
Create an axios-based API client with dynamic base URL fetching.

```typescript
import axios, { AxiosInstance } from 'axios';

let api: AxiosInstance | null = null;

export const fetchBaseURL = async (): Promise<string> => {
  try {
    const response = await axios.get('https://server-url-chi.vercel.app/url');
    return response.data?.base_url || 'https://api.namma-taxi.com';
  } catch (error) {
    console.warn('Failed to fetch dynamic URL:', error);
    return 'https://api.namma-taxi.com';
  }
};

export const getApiClient = async (): Promise<AxiosInstance> => {
  if (api) return api;

  const baseURL = await fetchBaseURL();
  api = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Add interceptors for logging
  api.interceptors.request.use(
    (config) => {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        console.error(`API Response Error: ${error.response.status}`, error.response.data);
      } else if (error.request) {
        console.error('API No Response:', error.message);
      } else {
        console.error('API Request Setup Error:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return api;
};

export const apiGet = async (endpoint: string, config = {}) => {
  const client = await getApiClient();
  return client.get(endpoint, config);
};

export const apiPost = async (endpoint: string, data = {}, config = {}) => {
  const client = await getApiClient();
  return client.post(endpoint, data, config);
};

export const apiPut = async (endpoint: string, data = {}, config = {}) => {
  const client = await getApiClient();
  return client.put(endpoint, data, config);
};
```

---

## 🗺️ LOCATION & DISTANCE SERVICES

### Distance.ts
```typescript
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";
const OPENROUTESERVICE_API_KEY = "YOUR_ORS_KEY";

export async function getGoogleDrivingDistance(
  start: Location,
  end: Location
): Promise<number> {
  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${start.latitude},${start.longitude}&destinations=${end.latitude},${end.longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.rows?.[0]?.elements?.[0]?.distance) {
      return data.rows[0].elements[0].distance.value / 1000; // meters to km
    }
    
    return 0;
  } catch (error) {
    console.error("Google Distance error:", error);
    return 0;
  }
}

export async function getORSDrivingDistance(
  start: Location,
  end: Location
): Promise<number> {
  try {
    const url = "https://api.openrouteservice.org/v2/matrix/driving-car";
    const body = JSON.stringify({
      locations: [
        [start.longitude, start.latitude],
        [end.longitude, end.latitude]
      ],
      metrics: ["distance"]
    });
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": OPENROUTESERVICE_API_KEY,
        "Content-Type": "application/json",
      },
      body,
    });
    
    const data = await response.json();
    if (data.distances?.[0]?.[1]) {
      return data.distances[0][1] / 1000;
    }
    
    return 0;
  } catch (error) {
    console.error("ORS Distance error:", error);
    return 0;
  }
}
```

**Location Search:**
Use Google Places Autocomplete API for location search:
```typescript
const searchLocations = async (query: string): Promise<Location[]> => {
  const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:IN&key=${GOOGLE_MAPS_API_KEY}`;
  
  const res = await fetch(autocompleteUrl);
  const data = await res.json();
  
  const locations = await Promise.all(
    data.predictions.map(async (prediction: any) => {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,name,formatted_address,place_id&key=${GOOGLE_MAPS_API_KEY}`;
      const detailsRes = await fetch(detailsUrl);
      const detailsData = await detailsRes.json();
      const location = detailsData.result;
      
      return {
        id: location.place_id,
        name: location.name,
        address: location.formatted_address,
        latitude: location.geometry.location.lat,
        longitude: location.geometry.location.lng,
      };
    })
  );
  
  return locations;
};
```

---

## 📄 TYPE DEFINITIONS

### types/index.ts
```typescript
export interface User {
  id: string;
  customer_id?: string;
  username: string;
  email: string;
  phone?: string;
  contact?: string;
  profilePicture?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Vehicle {
  id: string;
  type: string;
  name: string;
  pricePerKm: number;
  image: string;
  capacity: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  carNumber: string;
  rating: number;
  latitude: number;
  longitude: number;
}

export interface Booking {
  id: string;
  userId: string;
  customer_id?: string;
  start_point?: string;
  end_point?: string;
  startLocation?: Location;
  endLocation?: Location;
  vehicle?: Vehicle;
  vehicle_type?: string;
  driver?: Driver;
  fare?: number;
  total_amount?: string;
  pending_payment?: string;
  advanced_payment?: string;
  status?: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'Started';
  created_at?: string;
  date_of_travel?: string;
  pickup_time?: string;
  pickupInstructions?: string;
  ride_instructions?: string;
  amountPending?: number;
  amountPaid?: number;
  rating?: number;
  feedback?: string;
  is_confirmed?: boolean | string;
  is_ride_closed?: boolean | string;
  is_closed?: boolean | string;
  round_trip?: boolean | string;
  trip_type?: 'single' | 'package';
  base_fare?: number;
  toll_charges?: { total: number };
  waiting_charges?: number;
  parking_fee?: number;
  night_halt_charges?: number;
  total_amount_for_extra_km?: number;
  total_amount_for_extra_hr?: number;
}

export interface PackageBooking {
  package_ride_id: string;
  customer_id: string;
  pick_up_place: string;
  pick_up_address: string;
  vehicle_type: string;
  date_of_travel: string;
  pickup_time?: string;
  total_km_booked: number;
  total_hours_booked: number;
  no_of_nights: number;
  total_amount: string;
  pending_payment: string;
  advanced_payment: string;
  base_amount: number;
  toll_amount: number;
  parking_fee: number;
  night_halt_charges: number;
  total_amount_for_extra_km: number;
  total_amount_for_extra_hr: number;
  special_instructions?: string;
  is_confirmed: boolean | string;
  is_closed: boolean | string;
  status: string;
  created_at: string;
}
```

---

## 🎨 RESPONSIVE DESIGN GUIDELINES

### Breakpoints
```css
/* Mobile (default) */
@media (min-width: 320px) { /* ... */ }

/* Tablet */
@media (min-width: 768px) { /* ... */ }

/* Laptop */
@media (min-width: 1024px) { /* ... */ }

/* Desktop */
@media (min-width: 1280px) { /* ... */ }

/* Large Desktop */
@media (min-width: 1536px) { /* ... */ }
```

### Design Principles
1. **Mobile-First Approach:** Design for mobile screens first, then add styles for larger screens
2. **Flexbox & Grid:** Use CSS Flexbox and Grid for responsive layouts
3. **Relative Units:** Use `rem`, `em`, `%`, `vw`, `vh` instead of fixed `px` where appropriate
4. **Touch Targets:** Ensure buttons and interactive elements are at least 44x44px for mobile
5. **Navigation:** Use hamburger menu on mobile/tablet, full navbar on desktop
6. **Images:** Use responsive images with `max-width: 100%` and `height: auto`

---

## 🧩 COMPONENT LIBRARY

### TaxiLoading Component
A custom loading spinner with taxi icon and animated circles.

**Features:**
- Rotating outer ring animation
- Shaking taxi icon (simulating engine vibration)
- Animated loading dots
- Rotating motivational quotes
- Progress bar animation

**Usage:**
```tsx
<TaxiLoading
  visible={loading}
  loadingText="Finding available drivers..."
  backgroundColor="#FFFFFF"
/>
```

### AuthPopup Component
A modal popup for login/signup with OTP verification.

**Features:**
- Toggle between email and mobile authentication
- OTP-based signup flow
- Password visibility toggle
- Resend OTP with countdown timer
- Smooth slide-up animation

**Usage:**
```tsx
<AuthPopup
  visible={showAuth}
  onClose={() => setShowAuth(false)}
  onLoginSuccess={(customerId) => console.log('Logged in')}
  onGuestContinue={() => console.log('Guest mode')}
/>
```

### InvoiceGenerator Component
Generate and download/share PDF invoices for completed rides.

**Features:**
- HTML-to-PDF conversion using `html2canvas` and `jspdf`
- Detailed fare breakdown
- Package trip vs regular trip templates
- Download and share functionality

**Usage:**
```tsx
<InvoiceGenerator
  booking={selectedBooking}
  visible={showInvoice}
  onClose={() => setShowInvoice(false)}
/>
```

### LocationInputModal Component
A modal for searching and selecting locations with autocomplete.

**Features:**
- Google Places Autocomplete integration
- Recent/suggested locations
- Loading state during search
- Clear and select actions

**Usage:**
```tsx
<LocationInputModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onSelectLocation={(loc) => setLocation(loc)}
  onSearchChange={setQuery}
  title="Select Pickup Location"
  placeholder="Search for location..."
  initialValue={query}
  suggestions={suggestions}
  loading={searching}
  iconName="map-marker"
  iconColor="#10B981"
/>
```

---

## 📱 PAGE COMPONENTS

### 1. HomePage (/)
**Purpose:** Landing page with booking initiation

**Features:**
- Header with user profile/login button
- "Plans & Pricing Info" link (opens https://nanotaxibooking.com)
- Language toggle (English/Tamil) - Optional
- Embedded `LocationPage` for quick booking

**Route:** `/`

### 2. LocationPage (/booking/location)
**Purpose:** Select pickup, destination, and trip options

**Features:**
- Mode toggle: Trip vs Hourly Package
- Current location detection (use browser Geolocation API)
- Location search with Google Places API
- Round trip toggle
- Date/time picker for scheduled rides
- "Select Vehicle" button to proceed

**Route:** `/booking/location`

**API Endpoints:**
- `GET /api/list_all_package/` - Fetch hourly packages

### 3. VehicleSelectionPage (/booking/vehicle-selection)
**Purpose:** Choose vehicle type and view pricing

**Features:**
- Display available vehicles with images
- Show price per km
- Pickup time selection (Now vs Schedule)
- Date and time pickers
- Fare breakdown (collapsible)
- Display distance and fare

**Route:** `/booking/vehicle-selection?startLocation=...&endLocation=...&distanceKm=...&roundTrip=...`

**API Endpoints:**
- `POST /api/get_vehicle_available/` - Get available vehicles
  ```json
  { "start_point": "string", "end_point": "string" }
  ```
- `GET /api/list_fixed_charges/` - Get GST and other fixed charges

### 4. ConfirmationPage (/booking/confirmation)
**Purpose:** Review booking details and confirm

**Features:**
- Display trip route (from → to → from for round trip)
- Vehicle details
- Pickup details (now vs scheduled)
- Pickup instructions (text area)
- Total fare display
- "Confirm Ride" button
- If not logged in, show `AuthPopup`

**Route:** `/booking/confirmation?startLocation=...&endLocation=...&vehicle=...&fare=...&pickupOption=...&pickupDate=...&pickupTime=...&roundTrip=...`

### 5. TrackingPage (/tracking)
**Purpose:** Booking confirmation screen

**Features:**
- Success checkmark animation
- "Booking Confirmed!" message
- Features list (real-time tracking, driver contact, rating)
- "Go to My Rides" button (navigates to `/bookings`)
- "Go to Home" button (navigates to `/`)

**Route:** `/tracking`

### 6. BookingsPage (/bookings)
**Purpose:** View current and upcoming rides

**Features:**
- Latest booking card with refresh button
- Toggle between: All Rides, Single Trips, Round Trips, Package Trips
- Display booking cards with status (Pending, Confirmed, Ongoing, Completed)
- Driver info (if confirmed)
- Call driver button
- Refresh functionality
- Loading state

**Route:** `/bookings`

**API Endpoints:**
- `GET /api/list_rides_by_customer/{customer_id}` - Current rides
- `GET /api/list_package_rides_by_customer/{customer_id}` - Package rides

### 7. HistoryPage (/history)
**Purpose:** View past completed rides

**Features:**
- List of completed rides
- Fare breakdown
- Share invoice button (opens `InvoiceGenerator`)
- Rating display (if rated)
- Rate ride button (if not rated)
- Combined single trips, round trips, and package trips

**Route:** `/history`

**API Endpoints:**
- `GET /api/list_closed_rides_by_customer/{customer_id}` - Closed rides
- `GET /api/list_package_rides_by_customer/{customer_id}` - Filter by `is_closed`

### 8. ProfilePage (/profile)
**Purpose:** User account management

**Features:**
- Avatar and user info
- Edit email (modal popup)
- Edit phone number (modal popup)
- Customer support call button (opens tel:+919840407707)
- Logout button (shows confirmation modal)
- App info section

**Route:** `/profile`

**API Endpoints:**
- `GET /api/get_customer/{customer_id}/` - Fetch customer details
- `PUT /api/edit_customer/{customer_id}/` - Update email or phone

### 9. LoginPage (/login)
**Purpose:** Standalone login/signup page

**Features:**
- Toggle between email and mobile
- Login form (email/mobile + password)
- Signup flow (OTP verification + password creation)
- Switch between login and signup
- Animated UI with gradient header

**Route:** `/login`

---

## 🛤️ ROUTING SETUP

### App.tsx
```tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';

// Pages
import HomePage from './pages/HomePage';
import BookingsPage from './pages/BookingsPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import LocationPage from './pages/LocationPage';
import VehicleSelectionPage from './pages/VehicleSelectionPage';
import ConfirmationPage from './pages/ConfirmationPage';
import TrackingPage from './pages/TrackingPage';
import HireDriverPage from './pages/HireDriverPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/booking/location" element={<LocationPage />} />
            <Route path="/booking/vehicle-selection" element={<VehicleSelectionPage />} />
            <Route path="/booking/confirmation" element={<ConfirmationPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/booking/hire-driver" element={<HireDriverPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

## 🎨 STYLING GUIDELINES

### Color Palette
```css
:root {
  --primary-green: #10B981;
  --primary-yellow: #FACC14;
  --secondary-blue: #3B82F6;
  --secondary-red: #EF4444;
  --text-dark: #1F2937;
  --text-gray: #6B7280;
  --bg-light: #F9FAFB;
  --bg-white: #FFFFFF;
  --border-gray: #E5E7EB;
}
```

### Typography
- **Font Family:** System fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`)
- **Headings:** Bold, 24-32px
- **Body:** Regular, 14-16px
- **Small Text:** 12-14px

### Buttons
- **Primary Button:** Green background (#10B981), white text, rounded corners, shadow
- **Secondary Button:** White background, green border, green text
- **Disabled:** Gray background (#D1D5DB), no shadow

### Cards
- White background, rounded corners (12-16px), subtle shadow
- Border: 1px solid #E5E7EB

---

## 📦 FEATURE COMPLETENESS CHECKLIST

### Authentication
- [x] Login with email/mobile + password
- [x] Signup with OTP verification
- [x] Password creation after OTP verification
- [x] Session persistence with localStorage
- [x] Logout functionality
- [x] Auto-restore session on page load

### Booking Flow
- [x] Location search with autocomplete
- [x] Current location detection
- [x] Round trip toggle
- [x] Scheduled vs immediate pickup
- [x] Vehicle selection
- [x] Fare calculation
- [x] Pickup instructions
- [x] Booking confirmation
- [x] Hourly package booking

### My Rides
- [x] Display current/upcoming rides
- [x] Display confirmed rides with driver info
- [x] Call driver functionality
- [x] Refresh rides
- [x] Filter by trip type

### History
- [x] Display completed rides
- [x] Fare breakdown
- [x] PDF invoice generation
- [x] Share/download invoice
- [x] Rate completed rides

### Profile
- [x] Display user info
- [x] Update email
- [x] Update phone number
- [x] Customer support call
- [x] Logout with confirmation

### UI/UX
- [x] Loading animations
- [x] Error handling
- [x] Empty states
- [x] Responsive design (mobile, tablet, laptop, desktop)
- [x] Touch-friendly buttons
- [x] Smooth transitions

---

## 🚀 DEPLOYMENT

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

### Environment Variables
Create a `.env` file:
```
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
REACT_APP_ORS_API_KEY=your_openrouteservice_key
```

---

## 🧪 TESTING

### Manual Testing Checklist
1. **Authentication:**
   - Sign up with email/mobile
   - Verify OTP and set password
   - Log in with credentials
   - Log out and verify session is cleared

2. **Booking:**
   - Search and select locations
   - Toggle round trip
   - Schedule a ride
   - Select vehicle
   - Confirm booking (logged in and guest)

3. **My Rides:**
   - View current rides
   - Refresh rides list
   - Filter by trip type
   - Call driver (if confirmed)

4. **History:**
   - View past rides
   - Generate and download invoice
   - Rate a ride

5. **Profile:**
   - Update email
   - Update phone number
   - Call support
   - Logout

6. **Responsive Design:**
   - Test on mobile (375px width)
   - Test on tablet (768px width)
   - Test on laptop (1024px width)
   - Test on desktop (1280px+ width)

---

## 📝 ADDITIONAL NOTES

### Data Flow
1. **User Session:** AuthContext → localStorage → auto-restore on load
2. **Booking Data:** BookingContext → API → localStorage (optional caching)
3. **API Calls:** All API calls go through `apiClient.ts` with dynamic base URL

### Error Handling
- Show user-friendly error messages (avoid raw API errors)
- Use try-catch blocks in all async functions
- Fallback to default values on API failures
- Log errors to console for debugging

### Performance Optimization
- Lazy load components with `React.lazy()` and `Suspense`
- Memoize expensive calculations with `useMemo()`
- Debounce search inputs (300ms delay)
- Cache API responses in localStorage (with TTL)

### Accessibility
- Use semantic HTML (`<nav>`, `<main>`, `<section>`)
- Add ARIA labels to interactive elements
- Ensure keyboard navigation works
- Maintain color contrast ratios (WCAG AA)

---

## 🎯 FINAL DELIVERABLE

A fully functional ReactJS web application that:
1. ✅ Matches 100% of the mobile app's functionality
2. ✅ Uses the same API endpoints and payloads
3. ✅ Maintains the same data flow and state management patterns
4. ✅ Provides a responsive, mobile-first UI/UX
5. ✅ Works seamlessly across all device sizes
6. ✅ Handles authentication, booking, history, and profile management
7. ✅ Includes all features: single trips, round trips, hourly packages, invoice generation
8. ✅ Implements proper error handling, loading states, and empty states
9. ✅ Is production-ready and deployable to Vercel/Netlify

---

## 📞 SUPPORT & HELP

**Customer Support:** +91 9840407707  
**Website:** https://nanotaxibooking.com  
**App Name:** NANO Taxi  
**Version:** 3.0.0

---

**END OF MASTER PROMPT**

This document contains every detail needed to rebuild the NANO Taxi mobile app as a ReactJS web application. Follow each section step-by-step to create a 100% working, production-ready web app.

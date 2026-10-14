# 📱 Field Visit CRM - React Native Mobile Application

Comprehensive enterprise mobile application built with **React Native** and **Expo**, designed for field sales executives, service engineers, and branch managers. 100% feature-compatible with the Web CRM system and connects directly to the Spring Boot backend (`port 4000`).

---

## 🌟 Key Features

1. **Multi-Role Authentication & Security:**
   - One-tap Role Presets: `System Administrator`, `Branch Manager`, `Sales Executive`, `Field Service Engineer`.
   - **Workplace Geo-Security:** Captures live physical GPS coordinates using `expo-location` and checks geo-fencing policies.
   - **2-Step Verification (2FA):** Automatic OTP challenge dialog with demo code support.
   - **Dynamic Server Switcher:** Switch backend host URL on-the-fly right inside the app (`192.168.0.139:4000`, `10.0.2.2:4000`, `localhost:4000`, or Ngrok tunnel).

2. **Executive Dashboard:**
   - Live KPI Cards: Total Visits, Approved Claims, Pending Approvals, Active Pipeline (₹), Total Reimbursements.
   - Grade Fuel Rate Badge: Live rate per km based on user grade (`Grade B: ₹11.50/km`, `Grade A: ₹14/km`, etc.).
   - Quick action shortcuts.

3. **Daily Visits & Travel Claim Engine:**
   - Filter by status (`SUBMITTED`, `APPROVED`, `REJECTED`) and live search.
   - **Comprehensive Log Visit Modal:**
     - Customer organization selection.
     - Dynamic contact person selection.
     - Activity type (Maintenance, Demo, Inspection, Breakdown).
     - Machinery model selection from master data.
     - Travel route (`Place From → Place To`) and Start/End time.
     - **Automated Odometer Calculator:** Day Start KM & Day End KM → Total KM × Grade Fuel Rate + Toll Tax = Live Total Claim ₹.

4. **Managerial Approvals (Managers & Admins):**
   - Review pending visits and claims submitted by field staff.
   - View odometer readings, route, customer, and claim breakdown.
   - One-tap "Approve Claim" or "Reject Claim" with reason remarks.

5. **Sales Pipeline & Opportunities:**
   - Pipeline stages: `Prospecting`, `Qualification`, `Proposal`, `Negotiation`, `Closed Won`, `Closed Lost`.
   - Win probability (%), deal value (₹), and expected closing date.
   - Action planning: Follow-up Call, Send Quotation, WhatsApp, Online Meeting, Negotiation.

6. **Commercial Quotations:**
   - Formal quotations with Quotation Number, Customer, Dates.
   - Detail modal showing machinery line items with **locked unit rates from master**, Subtotal, 18% GST, and Grand Total.

7. **Customer & Contact Directory:**
   - Searchable directory of client organizations.
   - Expandable contact cards showing staff designations, phones, and emails.
   - "+ Add Customer" quick modal.

8. **Employee Profile & Account:**
   - Employee ID, Grade, Branch, Department, Mobile.
   - Geo-Zone and physical coordinates display.
   - In-app Server Configuration modal with Ping test.

---

## 🚀 How to Run and Test the App

### Step 1: Ensure Backend is Running
Open a terminal in the project root and start the Spring Boot backend:
```bash
cd backend-java
mvn spring-boot:run
```
*(Backend runs on `http://localhost:4000` and is accessible on LAN at `http://192.168.0.139:4000`)*

---

### Step 2: Start the Expo Development Server
In another terminal, navigate to the `mobile` folder and start Expo:
```bash
cd mobile
npm start
```
This opens the Expo interactive terminal and displays a QR code.

---

### Step 3: Run on Devices

#### Option A: Real Physical Phone (Android / iOS) - Recommended
1. Install **Expo Go** from Google Play Store (Android) or App Store (iOS).
2. Ensure your phone is connected to the **same Wi-Fi network** as your computer.
3. Open the camera or Expo Go app and **scan the QR code** shown in the terminal.
4. The app will bundle and load directly on your phone!
5. In the app login screen, the server defaults to `http://192.168.0.139:4000/api`. You can tap the ⚙️ icon at any time to test the ping.

#### Option B: Android Emulator
1. Start your Android Studio Emulator.
2. In the Expo terminal, press `a` (or run `npm run android`).
3. For Android Emulator, the server URL can be set to `http://10.0.2.2:4000/api` using the in-app ⚙️ button.

#### Option C: Web Browser Preview
1. In the Expo terminal, press `w` (or run `npm run web`).
2. The app will open in Chrome / Edge at `http://localhost:8081`.

---

## 📦 How to Build the Standalone APK

### Method 1: Cloud Build via EAS (Easiest - Generates Installable `.apk`)
1. Install the EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
2. Log in with your free Expo account:
   ```bash
   eas login
   ```
3. Run the APK build command:
   ```bash
   eas build -p android --profile preview
   ```
4. EAS will compile the Android app in the cloud and provide a **direct `.apk` download link** that you can install on any Android phone!

---

### Method 2: Local Offline Build (Android Studio)
If you want to build locally using your computer's Android SDK:
```bash
cd mobile
npx expo prebuild
cd android
./gradlew assembleRelease
```
The generated APK will be located at:
`mobile/android/app/build/outputs/apk/release/app-release.apk`

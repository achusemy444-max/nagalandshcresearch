# Soil Health Card System - Quick Start Guide

## Login Credentials

### Admin Access (Scheme Administrator)
```
Username: adminkohima123
Password: Adminkohima@123
```
Access: All district data, account management, program oversight

### Sample District Access
```
Username: kohima_user
Password: District@123
```
Access: Kohima district card generation and management

---

## Key Features Overview

### 🏠 Home Page
The landing page now displays:
1. **Soil Health Card Scheme Overview** - Introduction and benefits
2. **Benefits Section** - 6 key benefits for farmers
3. **Laboratory Information** - Facilities, parameters, and process
4. **Login Portal** - Secure access to system

### 📊 Soil Health Indicators

#### pH Scale (NEW!)
| Indicator | Range | Color | Meaning |
|-----------|-------|-------|---------|
| HIGH ACIDIC | < 5.5 | 🔴 Red | Soil is too acidic |
| NEUTRAL | 5.5 - 8.5 | 🟢 Green | Healthy pH level |
| HIGHLY ALKALINE | > 8.5 | 🔴 Red | Soil is too alkaline |

#### EC Scale (NEW!)
| Indicator | Range | Color | Meaning |
|-----------|-------|-------|---------|
| NORMAL | < 1 dS/m | 🟢 Green | Healthy salinity |
| HIGH SALINE | > 1 dS/m | 🔴 Red | Too much salt |

### 📋 Soil Health Card Components

Each card includes:
- **Test Center Information**: ID, District, Address, Testing Date
- **Card Issued To**: Survey No., Farmer Name, Village
- **Soil Sample Details**: 12 measured parameters
- **Additional Information**: Soil Texture, Moisture Context, Card ID
- **Indicator Information**: pH/EC scale indicators + status colors
- **Recommendation**: Personalized farming guidance
- **Contact Information**: Support email and phone

### 👥 Admin Dashboard Features

1. **Statistics**
   - Number of district accounts
   - Total cards generated
   - Active districts count

2. **District Account Management**
   - Create new district accounts
   - Edit existing accounts
   - Delete accounts
   - Bulk upload from CSV

3. **Nutrient Analysis by District** (NEW!)
   - View all districts
   - See total cards per district
   - Check pH status breakdown
   - Check EC status breakdown
   - Visual indicators with emoji

4. **All District Data**
   - View all generated cards
   - Inspect individual cards
   - Download cards as PDF
   - Delete cards

### 🌾 District Dashboard Features

1. **District Statistics**
   - Cards saved in district
   - District name and address
   - Number of measured parameters

2. **Generate Soil Health Card**
   - Enter soil testing data
   - All 12 parameters
   - Soil texture and moisture
   - Manual or auto-generated recommendations

3. **Card Management**
   - View saved cards
   - Preview cards before saving
   - Download as PDF
   - Delete outdated records

4. **Bulk Upload**
   - Upload multiple cards via CSV
   - Batch processing

---

## How to Use

### Creating a New Soil Health Card

1. **Login** as a district user
2. **Fill in the form**:
   - Testing date
   - Test center information
   - Survey details
   - Farmer information
   - Soil parameters (pH, EC, nutrients, etc.)
3. **Choose recommendation method**:
   - Auto-generate based on values
   - Provide manual recommendations
4. **Save and Generate** - Card is created with color-coded indicators
5. **Download PDF** - Export for printing and distribution

### Viewing Nutrient Analysis

1. **Login** as admin
2. Scroll to **"Nutrient Analysis by District"** section
3. View statistics for each district:
   - Total cards
   - pH status (Red vs Green counts)
   - EC status (Red vs Green counts)
4. Use this to identify districts needing support

### Downloading a Card as PDF

1. Select or preview a card
2. Click **"Download PDF"** button
3. Popup window opens with printable version
4. Use browser print function or save as PDF

---

## Parameter Ranges

### Macronutrients
- **Nitrogen (N)**: 280 - 560 kg/ha
- **Phosphorous (P)**: 10 - 25 kg/ha
- **Potassium (K)**: 120 - 280 kg/ha

### Secondary Nutrients
- **Sulphur (S)**: > 10 ppm

### Micronutrients
- **Zinc (Zn)**: > 0.6 ppm
- **Boron (B)**: > 0.5 ppm
- **Iron (Fe)**: > 4.5 ppm
- **Manganese (Mn)**: > 2 ppm
- **Copper (Cu)**: > 0.2 ppm

### Physical Parameters
- **pH**: 5.5 - 8.5
- **EC (Electric Conductivity)**: < 1 dS/m
- **Organic Carbon**: 0.50 - 0.75 %

---

## Status Color Meanings

| Color | Status | Meaning |
|-------|--------|---------|
| 🟢 Green | SUFFICIENT | Within optimal range |
| 🟡 Yellow | MEDIUM | Slightly off range |
| 🟠 Orange | MODERATE | Moderately off range |
| 🔴 Red | DEFICIENT | Significantly below range |
| ⚪ Grey | NOT AVAILABLE | Data not provided |

*Note: pH and EC have special meanings (see above)*

---

## CSV Format for Bulk Upload

### District Accounts CSV
```
District,Officer Name,Username,Password,Address
Dimapur,John Doe,dimapur_user,Pass@123,Test Lab Address
Tuensang,Jane Smith,tuensang_user,Pass@456,Another Address
```

### Soil Cards CSV
```
District,Testing Date,Test Center Address,Test Center ID,Survey No.,Farmer Name,Farmer Village,Soil Texture,Moisture Context,pH,EC,Organic Carbon,Nitrogen,Phosphorous,Potassium,Sulphur,Zinc,Boron,Iron,Manganese,Copper,Manual Recommendation
Kohima,2024-01-15,Lab Address,TC-001,123,Ram Kumar,Nagaland,Loamy,Moderate,7.2,0.8,0.6,350,15,200,15,0.8,0.6,5,2.5,0.3,
```

---

## Support & Contact

**Email**: SHCS&Wdirectorateteam@gmail.com  
**Phone**: 7005303701  
**Office**: Soil and Water Conservation Department, Kohima, Nagaland

---

## Data Storage

- **Local**: Browser localStorage (automatic backup)
- **Remote**: Convex backend (when configured)
- **Automatic Sync**: Falls back to local if remote unavailable

---

## Tips for Best Results

1. ✓ Always verify soil parameter values for accuracy
2. ✓ Use consistent date formats (YYYY-MM-DD)
3. ✓ Include descriptive village names for farmer records
4. ✓ Download and save PDF copies of important cards
5. ✓ Regularly review nutrient analysis by district
6. ✓ Use the auto-recommendation feature to ensure consistency
7. ✓ Backup data regularly through bulk exports

---

## Troubleshooting

**Cannot Login?**
- Check username and password spelling
- Ensure caps lock is off
- Try admin credentials if available

**Card not saving?**
- Ensure all required fields are filled
- Check internet connection for remote sync
- Card should save locally even without connection

**PDF not downloading?**
- Allow popups in browser settings
- Try a different browser
- Ensure popup blocker is disabled

**Bulk upload failing?**
- Verify CSV format matches requirements
- Check for duplicate usernames
- Ensure all required columns are present

---

Generated: 2026-05-13  
Version: 1.0 - Professional Release

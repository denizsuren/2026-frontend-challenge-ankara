# Jotform Frontend Challenge Project

## User Information
**Jotform Frontend Challenge — 2026**  
**Participant:** Deniz Süren

---
## Project Description
An investigation dashboard built for the "Missing Podo: The Ankara Case" scenario.

Podo was last seen at an event in Ankara — spotted with different people across different locations, then disappeared. This app pulls records from 5 different Jotform form sources and weaves them into a coherent investigation experience.

**What you can do:**
- Browse all suspects and see their records across 5 data sources
- Follow Podo's last known movements on a live Ankara map
- See each person's suspicion score based on high-confidence anonymous tips
- Filter records by source type (checkins, messages, sightings, notes, tips)
- Search suspects by name
- View a time-based timeline of each person's activity
- Fuzzy name matching — "Kagan" and "Kağan" are treated as the same person

---


## Tech Stack

- React + Vite
- Leaflet / React-Leaflet (map)
- Jotform API (data source)

---

## Getting Started
### 1. Clone the repository

```bash
git clone https://github.com/denizsuren/2026-frontend-challenge-ankara.git
cd 2026-frontend-challenge-ankara
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

### 4. Open in browser
http://localhost:5173


## 💡 Notlar
## Data Sources

| Source | Description |
|--------|-------------|
| Checkins | Check-in / appearance records at different locations |
| Messages | Messages exchanged between people |
| Sightings | Someone seen with someone else at a specific place |
| Personal Notes | Personal notes / comments |
| Anonymous Tips | Tips with varying reliability levels |

---

## Features

- ✅ Data fetching from 5 Jotform API endpoints
- ✅ Record linking across different data sources
- ✅ Investigation UI with suspect list and detail view
- ✅ Search and filter by person and source type
- ✅ Time-based timeline for each suspect
- ✅ Live Ankara map with color-coded markers
- ✅ Suspicion scoring based on anonymous tip confidence
- ✅ Fuzzy name matching (handles Turkish characters)
- ✅ Loading, empty, and error state handling
- ✅ Summary panels: last seen location, last seen with
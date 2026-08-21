# Weather App

A beautiful, full-stack weather application built with **FastAPI** (backend) and **vanilla HTML/CSS/JS** (frontend). No frontend frameworks — just clean, modern web standards.

---

## Features

-  **City search** with live autocomplete suggestions
-  **Geolocation** — detect your current location automatically
-  **Current conditions** — temperature, feels like, humidity, wind, UV index, pressure, sunrise/sunset
-  **Hourly forecast** — next 24 hours with rain probability
-  **7-day forecast** — min/max temps with visual temperature bars
-  **Dynamic theming** — background shifts based on weather (clear day, night, stormy, etc.)
- °C / °F **unit toggle**
-  **Fully responsive** — mobile-first design
-  **Accessible** — ARIA roles, keyboard navigation, screen-reader friendly

---

## Tech Stack

| Layer     | Tech                                      |
|-----------|-------------------------------------------|
| Backend   | FastAPI + Uvicorn (Python 3.10+)          |
| Frontend  | Vanilla HTML5 / CSS3 / ES6 JavaScript     |
| Templates | Jinja2                                    |
| Weather   | [Open-Meteo API](https://open-meteo.com) — free, no key required |
| Geocoding | Open-Meteo Geocoding API + Nominatim (reverse geocode) |

---

## Project Structure

```
weather-app/
├── main.py              # FastAPI app & API routes
├── requirements.txt     # Python dependencies
├── start.sh             # Quick-start script
├── templates/
│   └── index.html       # Main HTML template
└── static/
    ├── css/
    │   └── style.css    # Full stylesheet (CSS variables, animations)
    └── js/
        └── weather.js   # All frontend logic (ES6 module)
```

---

## Quick Start

```bash
# 1. Clone / enter the project folder
cd weather-app

# 2. (Optional) create a virtual environment
python3 -m venv .venv && source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the server
uvicorn main:app --reload

# 5. Open your browser
#    http://localhost:8000
```

Or just run:

```bash
bash start.sh
```

---

## API Endpoints

| Method | Endpoint             | Description                          |
|--------|----------------------|--------------------------------------|
| GET    | `/`                  | Serves the frontend                  |
| GET    | `/api/geocode?city=` | Search cities by name                |
| GET    | `/api/weather`       | Get weather by lat/lon               |

### Example

```
GET /api/geocode?city=Tokyo
GET /api/weather?lat=35.6895&lon=139.6917&units=celsius
```

---

## No API Key Needed

This app uses [Open-Meteo](https://open-meteo.com), a free and open-source weather API with no registration or API key required.

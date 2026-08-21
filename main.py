from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from starlette.requests import Request
import httpx
from typing import Optional

app = FastAPI(title="Weather App", version="1.0.0")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/geocode")
async def geocode(city: str = Query(..., min_length=1)):
    """Search for city coordinates by name."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(GEOCODING_URL, params={
                "name": city,
                "count": 6,
                "language": "en",
                "format": "json"
            })
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", [])
            if not results:
                raise HTTPException(status_code=404, detail="City not found")
            return {
                "results": [
                    {
                        "name": r.get("name"),
                        "country": r.get("country"),
                        "country_code": r.get("country_code", "").lower(),
                        "admin1": r.get("admin1", ""),
                        "latitude": r.get("latitude"),
                        "longitude": r.get("longitude"),
                        "timezone": r.get("timezone", "auto"),
                    }
                    for r in results
                ]
            }
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Geocoding service unavailable: {str(e)}")


@app.get("/api/weather")
async def get_weather(
    lat: float = Query(...),
    lon: float = Query(...),
    timezone: str = Query(default="auto"),
    units: str = Query(default="celsius")
):
    """Fetch full weather data for given coordinates."""
    temp_unit = "celsius" if units == "celsius" else "fahrenheit"
    wind_unit = "kmh" if units == "celsius" else "mph"

    params = {
        "latitude": lat,
        "longitude": lon,
        "timezone": timezone,
        "temperature_unit": temp_unit,
        "wind_speed_unit": wind_unit,
        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "weather_code",
            "wind_speed_10m",
            "wind_direction_10m",
            "surface_pressure",
            "visibility",
            "uv_index",
        ],
        "hourly": [
            "temperature_2m",
            "weather_code",
            "precipitation_probability",
        ],
        "daily": [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "precipitation_probability_max",
            "wind_speed_10m_max",
            "sunrise",
            "sunset",
            "uv_index_max",
        ],
        "forecast_days": 7,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(WEATHER_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            return data
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Weather service unavailable: {str(e)}")


@app.get("/api/weather/by-coords")
async def weather_by_coords(
    lat: float = Query(...),
    lon: float = Query(...),
    units: str = Query(default="celsius")
):
    """Convenience endpoint: reverse geocode + weather in one call."""
    return await get_weather(lat=lat, lon=lon, units=units)

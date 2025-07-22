from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, Dict
from recommender import recommend_similar
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.responses import JSONResponse
from bs4 import BeautifulSoup
import httpx
from fastapi import Query

app = FastAPI()

# Разрешаем запросы от фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HotelInput(BaseModel):
    name: str
    address: str
    description: str
    amenities_text: str
    reviews: Optional[Dict[str, float]] = {}


@app.post("/recommend")
def recommend(hotel: HotelInput):
    hotel_dict = hotel.dict()
    recommended = recommend_similar(hotel_dict)
    return {"recommendations": recommended}

@app.get("/hotels_data.json")
def get_hotels_data():
    return FileResponse("hotels_data.json", media_type="application/json")

# ВАЖНО: монтируем фронтенд после всех API маршрутов
app.mount("/", StaticFiles(directory="../frontend", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

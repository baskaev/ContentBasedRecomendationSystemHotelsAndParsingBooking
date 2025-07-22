import json
import numpy as np
import os
import faiss
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("paraphrase-MiniLM-L6-v2")

# Пути к данным
RAW_HOTELS_PATH = "hotels_data.json"
CLEAN_HOTELS_PATH = "clean_hotels.json"
VECTORS_PATH = "hotel_vectors.npy"
FAISS_INDEX_PATH = "hotel_index.faiss"

review_keys = [
    "Персонал", "Удобства", "Чистота",
    "Комфорт", "Соотношение цена/качество",
    "Расположение", "Бесплатный Wi-Fi"
]

def load_hotels(path=RAW_HOTELS_PATH):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def hotel_to_vector(hotel):
    # Текстовая часть
    description = hotel.get("description", "")
    address = hotel.get("address", "")
    amenities = hotel.get("amenities_text", "")
    text = f"{description} {address} {amenities}"
    text_embedding = model.encode([text])[0]

    # Отзывы
    reviews = hotel.get("reviews", {})
    review_vector = np.array([reviews.get(k, 0) for k in review_keys])

    # Финальный вектор
    return np.concatenate([text_embedding, review_vector]).astype("float32")

# --- Кэширование ---
if os.path.exists(FAISS_INDEX_PATH) and os.path.exists(CLEAN_HOTELS_PATH):
    print("[INFO] Загружаем FAISS индекс и данные отелей")
    index = faiss.read_index(FAISS_INDEX_PATH)
    with open(CLEAN_HOTELS_PATH, "r", encoding="utf-8") as f:
        hotels_data = json.load(f)
else:
    print("[INFO] Считаем эмбеддинги и строим FAISS индекс")
    hotels_data = load_hotels()
    vectors = np.array([hotel_to_vector(h) for h in hotels_data], dtype="float32")

    # Создание FAISS индекса
    dim = vectors.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(vectors)

    # Сохраняем
    faiss.write_index(index, FAISS_INDEX_PATH)
    np.save(VECTORS_PATH, vectors)
    with open(CLEAN_HOTELS_PATH, "w", encoding="utf-8") as f:
        json.dump(hotels_data, f, ensure_ascii=False)

# --- Рекомендации ---
def recommend_similar(input_hotel, top_k=5):
    input_vec = hotel_to_vector(input_hotel).reshape(1, -1)
    distances, indices = index.search(input_vec, top_k)
    return [hotels_data[i] for i in indices[0]]


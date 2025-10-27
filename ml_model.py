from fastapi import FastAPI  # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware  # pyright: ignore[reportMissingImports]
from pydantic import BaseModel  # pyright: ignore[reportMissingImports]
from textblob import TextBlob  # pyright: ignore[reportMissingImports]

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextData(BaseModel):
    text: str

# Default sentiment endpoint
@app.post("/predict")
async def predict(data: TextData):
    blob = TextBlob(data.text)
    sentiment = blob.sentiment.polarity
    if sentiment > 0.1:
        label = "Positive"
    elif sentiment < -0.1:
        label = "Negative"
    else:
        label = "Neutral"
    return {"sentiment": label, "score": sentiment}

# num model endpoint
@app.post("/predictes")
async def predictes(data: TextData):
    # Example: Anum can use custom phrases + TextBlob
    text_lower = data.text.lower().strip()
    custom_sentiments = {
        "love you": 0.95,
        "i love": 0.9,
        "hate you": -0.99,
        "i hate": -0.95,
        "amazing": 0.85,
        "terrible": -0.8
    }
    for phrase, score in custom_sentiments.items():
        if phrase in text_lower:
            label = "Very Positive" if score > 0.5 else "Very Negative"
            return {"sentiment": label, "score": score}

    # Default to TextBlob if no custom phrase matches
    blob = TextBlob(data.text)
    sentiment = blob.sentiment.polarity
    label = "Positive" if sentiment > 0.1 else "Negative" if sentiment < -0.1 else "Neutral"
    return {"sentiment": label, "score": sentiment}

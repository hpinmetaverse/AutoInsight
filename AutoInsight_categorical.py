# /// script
# requires-python = ">=3.9"
# dependencies = [
#   "pandas",
#   "seaborn",
#   "matplotlib",
#   "numpy",
#   "scipy",
#   "scikit-learn",
#   "fastapi",
#   "uvicorn",
#   "python-multipart",
#   "openpyxl",
#   "transformers",
#   "accelerate",
#   "torch",
# ]
# ///

import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import json
import base64
from io import BytesIO
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import torch

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Function to detect categorical columns
def detect_categorical(df):
    categorical = []
    for col in df.columns:
        if df[col].dtype == 'object' or df[col].nunique() < 20:
            categorical.append(col)
    return categorical

# Function to analyze categorical data
def analyze_categorical(df, categorical):
    analysis = {}
    if categorical:
        for col in categorical:
            value_counts = df[col].value_counts()
            analysis[f'{col}_counts'] = value_counts.to_dict()
    missing_values = df[categorical].isnull().sum()
    analysis['missing_values'] = missing_values.to_dict()
    return analysis

# Function to generate visualizations for categorical
def visualize_categorical(df, categorical):
    plots = {}
    for col in categorical[:3]:
        value_counts = df[col].value_counts()
        others_count = value_counts[value_counts == 1].sum()
        value_counts = value_counts[value_counts > 1]
        if others_count > 0:
            value_counts = pd.concat([value_counts, pd.Series([others_count], index=['Others'])])
        fig, ax = plt.subplots(figsize=(10, 6))
        value_counts.plot(kind='bar', ax=ax)
        ax.set_title(f'Bar Plot of {col}')
        buf = BytesIO()
        fig.savefig(buf, format='png')
        buf.seek(0)
        plots[f'bar_{col}'] = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
    return plots

# Function to generate summary using GPT-2
def generate_summary(df, analysis, categorical):
    prompt = f"Explain this categorical dataset in simple terms: {len(df)} rows, {len(categorical)} categorical columns: {categorical}. Value counts: {json.dumps(analysis)}. Missing: {sum(analysis['missing_values'].values())}. Describe key insights."
    generator = pipeline('text-generation', model='gpt2', device=-1)
    generated = generator(prompt, max_new_tokens=256, num_return_sequences=1, truncation=True)
    summary = generated[0]['generated_text']
    if summary.startswith(prompt):
        summary = summary[len(prompt):].strip()
    return summary

@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="File must be CSV or XLSX")
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file.file, encoding='ISO-8859-1')
        elif file.filename.endswith('.xlsx'):
            df = pd.read_excel(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    categorical = detect_categorical(df)
    if not categorical:
        raise HTTPException(status_code=400, detail="No categorical columns detected. Use numerical analyzer.")

    analysis = analyze_categorical(df, categorical)
    plots = visualize_categorical(df, categorical)
    summary = generate_summary(df, analysis, categorical)

    response = {
        "dataset_preview": df.head().to_dict(orient='records'),
        "column_types": {
            "categorical": categorical
        },
        "analysis": {
            "value_counts": {k: v for k, v in analysis.items() if k != 'missing_values'},
            "missing_values": analysis['missing_values']
        },
        "plots": plots,
        "summary": summary
    }

    return response

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>AutoInsight Categorical</title>
    </head>
    <body>
        <h1>AutoInsight Categorical Tool</h1>
        <p>Upload a CSV or XLSX file with categorical data for analysis.</p>
        <form action="/analyze" method="post" enctype="multipart/form-data">
            <input type="file" name="file" accept=".csv,.xlsx" required>
            <button type="submit">Analyze</button>
        </form>
    </body>
    </html>
    """

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
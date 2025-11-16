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

# Function to detect numerical columns
def detect_numerical(df):
    numerical = []
    for col in df.columns:
        if df[col].dtype in ['int64', 'float64'] or (df[col].dtype == 'object' and df[col].str.isnumeric().all()):
            numerical.append(col)
    return numerical

# Function to analyze numerical data
def analyze_numerical(df, numerical):
    analysis = {}
    if numerical:
        summary_stats = df[numerical].describe()
        analysis['summary_stats'] = summary_stats.to_html()
        corr_matrix = df[numerical].corr()
        analysis['correlation_matrix'] = corr_matrix.to_html()
    missing_values = df[numerical].isnull().sum()
    analysis['missing_values'] = missing_values.to_dict()
    return analysis, summary_stats if numerical else pd.DataFrame(), corr_matrix if numerical else pd.DataFrame()

# Function to detect outliers
def detect_outliers(df, numerical):
    if not numerical:
        return {}
    df_numeric = df[numerical]
    Q1 = df_numeric.quantile(0.25)
    Q3 = df_numeric.quantile(0.75)
    IQR = Q3 - Q1
    outliers = ((df_numeric < (Q1 - 1.5 * IQR)) | (df_numeric > (Q3 + 1.5 * IQR))).sum()
    return outliers.to_dict()

# Function to generate visualizations
def visualize_numerical(df, corr_matrix, outliers, numerical):
    plots = {}
    if not corr_matrix.empty:
        fig, ax = plt.subplots(figsize=(10, 8))
        sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', fmt=".2f", linewidths=0.5, ax=ax)
        ax.set_title('Correlation Matrix')
        buf = BytesIO()
        fig.savefig(buf, format='png')
        buf.seek(0)
        plots['correlation_matrix'] = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
    if outliers and any(outliers.values()):
        fig, ax = plt.subplots(figsize=(10, 6))
        pd.Series(outliers).plot(kind='bar', color='red', ax=ax)
        ax.set_title('Outliers Detection')
        ax.set_xlabel('Columns')
        ax.set_ylabel('Number of Outliers')
        buf = BytesIO()
        fig.savefig(buf, format='png')
        buf.seek(0)
        plots['outliers'] = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
    for col in numerical[:3]:
        fig, ax = plt.subplots(figsize=(10, 6))
        sns.histplot(df[col], kde=True, color='blue', bins=30, ax=ax)
        ax.set_title(f'Distribution of {col}')
        buf = BytesIO()
        fig.savefig(buf, format='png')
        buf.seek(0)
        plots[f'hist_{col}'] = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
        fig, ax = plt.subplots(figsize=(10, 6))
        sns.boxplot(x=df[col], ax=ax)
        ax.set_title(f'Boxplot of {col}')
        buf = BytesIO()
        fig.savefig(buf, format='png')
        buf.seek(0)
        plots[f'box_{col}'] = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
    return plots

# Function to generate summary using GPT-2
def generate_summary(df, summary_stats, missing_values, corr_matrix, outliers, numerical):
    prompt = f"Explain this numerical dataset in simple terms: {len(df)} rows, {len(numerical)} numerical columns: {numerical}. Stats: {summary_stats.to_string() if not summary_stats.empty else 'None'}. Missing: {sum(missing_values.values)}. Correlations: {corr_matrix.to_string() if not corr_matrix.empty else 'None'}. Outliers: {sum(outliers.values()) if outliers else 0}. Describe key insights."
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

    numerical = detect_numerical(df)
    if not numerical:
        raise HTTPException(status_code=400, detail="No numerical columns detected. Use categorical analyzer.")

    analysis, summary_stats, corr_matrix = analyze_numerical(df, numerical)
    outliers = detect_outliers(df, numerical)
    plots = visualize_numerical(df, corr_matrix, outliers, numerical)
    summary = generate_summary(df, summary_stats, pd.Series(analysis['missing_values']), corr_matrix, outliers, numerical)

    response = {
        "dataset_preview": df.head().to_dict(orient='records'),
        "column_types": {
            "numerical": numerical
        },
        "analysis": {
            "summary_stats": summary_stats.to_dict() if not summary_stats.empty else {},
            "missing_values": analysis['missing_values'],
            "correlation_matrix": corr_matrix.to_dict() if not corr_matrix.empty else {},
            "outliers": outliers
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
        <title>AutoInsight Numerical</title>
    </head>
    <body>
        <h1>AutoInsight Numerical Tool</h1>
        <p>Upload a CSV or XLSX file with numerical data for analysis.</p>
        <form action="/analyze" method="post" enctype="multipart/form-data">
            <input type="file" name="file" accept=".csv,.xlsx" required>
            <button type="submit">Analyze</button>
        </form>
    </body>
    </html>
    """

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
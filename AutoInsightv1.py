# /// script
# requires-python = ">=3.9"
# dependencies = [
#   "pandas",
#   "seaborn",
#   "matplotlib",
#   "numpy",
#   "scipy",
#   "openai",
#   "scikit-learn",
#   "requests",
#   "ipykernel",
#   "fastapi",
#   "uvicorn",
#   "python-multipart",
#   "openpyxl",
#   "lxml",
#   "transformers",
#   "accelerate",
#   "torch",
# ]
# ///

import os
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import requests
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

# Function to detect column types
def detect_column_types(df):
    categorical = []
    numerical = []
    for col in df.columns:
        if df[col].dtype == 'object' or df[col].nunique() < 20:
            categorical.append(col)
        else:
            numerical.append(col)
    return categorical, numerical

# Function to analyze the data
def analyze_data(df, categorical, numerical):
    analysis = {}

    # Summary statistics for numerical columns
    if numerical:
        summary_stats = df[numerical].describe()
        analysis['summary_stats'] = summary_stats.to_html()

    # Check for missing values
    missing_values = df.isnull().sum()
    analysis['missing_values'] = missing_values.to_dict()

    # Correlation matrix for numerical columns
    if numerical:
        corr_matrix = df[numerical].corr()
        analysis['correlation_matrix'] = corr_matrix.to_html()

    return analysis, summary_stats, corr_matrix

# Function to detect outliers using the IQR method
def detect_outliers(df, numerical):
    if not numerical:
        return {}
    df_numeric = df[numerical]
    Q1 = df_numeric.quantile(0.25)
    Q3 = df_numeric.quantile(0.75)
    IQR = Q3 - Q1
    outliers = ((df_numeric < (Q1 - 1.5 * IQR)) | (df_numeric > (Q3 + 1.5 * IQR))).sum()
    return outliers.to_dict()

# Function to generate visualizations and return base64 encoded images
def visualize_data(df, corr_matrix, outliers, categorical, numerical):
    plots = {}

    # Correlation heatmap
    if not corr_matrix.empty:
        fig, ax = plt.subplots(figsize=(10, 8))
        sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', fmt=".2f", linewidths=0.5, ax=ax)
        ax.set_title('Correlation Matrix')
        buf = BytesIO()
        fig.savefig(buf, format='png')
        buf.seek(0)
        plots['correlation_matrix'] = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)

    # Outliers plot
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

    # Plots for numerical columns
    for i, col in enumerate(numerical[:3]):
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

    # Plots for categorical columns
    for i, col in enumerate(categorical[:3]):
        value_counts = df[col].value_counts()
        # Group categories with count 1 into "Others"
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

# Function to generate a summary using GPT-2
def generate_summary(df, summary_stats, missing_values, corr_matrix, outliers, categorical, numerical):
    # Prepare prompt
    prompt = f"Explain this dataset in simple terms for a layman: The dataset has {len(df)} rows and {len(df.columns)} columns. "
    if categorical:
        prompt += f"Categorical columns: {', '.join(categorical)}. "
    if numerical:
        prompt += f"Numerical columns: {', '.join(numerical)}. "
        if not summary_stats.empty:
            prompt += f"Summary stats for numerical: {summary_stats.to_string()}. "
    prompt += f"Total missing values: {sum(missing_values.values)}. "
    if not corr_matrix.empty:
        prompt += f"Correlations: {corr_matrix.to_string()}. "
    if outliers:
        prompt += f"Outliers count: {sum(outliers.values())}. "
    prompt += "Describe what this dataset represents, key insights, and if there's a target column. Explain in paragraphs."

    # Use GPT-2 for generation
    generator = pipeline('text-generation', model='gpt2', device=0 if torch.cuda.is_available() else -1)
    generated = generator(prompt, max_new_tokens=256, num_return_sequences=1, truncation=True)
    summary = generated[0]['generated_text']
    # Remove the prompt from the beginning if present
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

    categorical, numerical = detect_column_types(df)

    analysis, summary_stats, corr_matrix = analyze_data(df, categorical, numerical)

    outliers = detect_outliers(df, numerical)

    plots = visualize_data(df, corr_matrix, outliers, categorical, numerical)

    summary = generate_summary(df, summary_stats, pd.Series(analysis['missing_values']), corr_matrix, outliers, categorical, numerical)

    response = {
        "dataset_preview": df.head().to_dict(orient='records'),
        "column_types": {
            "categorical": categorical,
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
        <title>AutoInsight Tool</title>
    </head>
    <body>
        <h1>AutoInsight Tool</h1>
        <p>Upload a CSV or XLSX file for instant Exploratory Data Analysis.</p>
        <form action="/analyze" method="post" enctype="multipart/form-data">
            <input type="file" name="file" accept=".csv,.xlsx" required>
            <button type="submit">Analyze</button>
        </form>
    </body>
    </html>
    """

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)






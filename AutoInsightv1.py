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

# Function to generate a simple textual story
def generate_story(df, summary_stats, missing_values, corr_matrix, outliers, categorical, numerical):
    story = f"This dataset contains {len(df)} rows and {len(df.columns)} columns.\n\n"
    
    if categorical:
        story += f"It has {len(categorical)} categorical columns: {', '.join(categorical)}.\n\n"
    else:
        story += "There are no categorical columns.\n\n"
    
    if numerical:
        story += f"It has {len(numerical)} numerical columns: {', '.join(numerical)}.\n\n"
        if not summary_stats.empty:
            story += "Summary statistics for numerical columns:\n"
            for col in numerical:
                if col in summary_stats.columns:
                    mean = summary_stats.loc['mean', col]
                    std = summary_stats.loc['std', col]
                    story += f"- {col}: mean {mean:.2f}, std {std:.2f}\n"
            story += "\n"
    else:
        story += "There are no numerical columns.\n\n"
    
    missing_count = sum(missing_values.values)
    if missing_count > 0:
        story += f"There are {missing_count} missing values in total.\n\n"
    else:
        story += "There are no missing values.\n\n"
    
    if not corr_matrix.empty and len(corr_matrix) > 1:
        story += "The correlation matrix shows relationships between numerical variables.\n"
        # Find highest correlation
        corr_unstack = corr_matrix.where(np.triu(np.ones_like(corr_matrix), k=1).astype(bool)).stack()
        if not corr_unstack.empty:
            max_corr = corr_unstack.abs().max()
            max_pair = corr_unstack.abs().idxmax()
            story += f"The highest correlation ({max_corr:.2f}) is between {max_pair[0]} and {max_pair[1]}.\n\n"
    
    outlier_count = sum(outliers.values()) if outliers else 0
    if outlier_count > 0:
        story += f"There are {outlier_count} outliers detected in the numerical columns.\n\n"
    
    story += "This analysis provides insights into the dataset's structure and key characteristics."
    
    return story

@app.post("/analyze", response_class=HTMLResponse)
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

    story = generate_story(df, summary_stats, pd.Series(analysis['missing_values']), corr_matrix, outliers, categorical, numerical)

    # Build HTML response
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>AutoInsight Analysis</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            h1, h2 {{ color: #333; }}
            table {{ border-collapse: collapse; width: 100%; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            th {{ background-color: #f2f2f2; }}
            img {{ max-width: 100%; height: auto; }}
        </style>
    </head>
    <body>
        <h1>AutoInsight Tool - Data Analysis Report</h1>
        <h2>Dataset Preview</h2>
        {df.head().to_html()}

        <h2>Column Types</h2>
        <p><strong>Categorical:</strong> {', '.join(categorical) if categorical else 'None'}</p>
        <p><strong>Numerical:</strong> {', '.join(numerical) if numerical else 'None'}</p>

        {'<h2>Summary Statistics</h2>' + analysis.get('summary_stats', '') if 'summary_stats' in analysis else ''}

        {''}

        <h2>Missing Values</h2>
        <pre>{json.dumps(analysis['missing_values'], indent=2)}</pre>

        {'<h2>Correlation Matrix</h2>' + analysis.get('correlation_matrix', '') if 'correlation_matrix' in analysis else ''}

        {'<h2>Outliers</h2><pre>' + json.dumps(outliers, indent=2) + '</pre>' if outliers else ''}

        <h2>Visualizations</h2>
        {'<h3>Correlation Matrix</h3><img src="data:image/png;base64,' + plots.get('correlation_matrix', '') + '">' if 'correlation_matrix' in plots else ''}
        {'<h3>Outliers</h3><img src="data:image/png;base64,' + plots.get('outliers', '') + '">' if 'outliers' in plots else ''}
        {'<h3>Histograms and Boxplots</h3>' + ''.join([f'<h4>{col}</h4><img src="data:image/png;base64,{plots[f"hist_{col}"]}"><img src="data:image/png;base64,{plots[f"box_{col}"]}">' for col in numerical[:3] if f'hist_{col}' in plots])}
        {'<h3>Bar Plots</h3>' + ''.join([f'<h4>{col}</h4><img src="data:image/png;base64,{plots[f"bar_{col}"]}">' for col in categorical[:3] if f'bar_{col}' in plots])}

        <h2>Data Story</h2>
        <p>{story.replace('\n', '<br>')}</p>
    </body>
    </html>
    """

    return html

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






import os
import argparse
from pathlib import Path
from typing import Dict, Tuple, Optional, List
import json

import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import requests
from scipy import stats


class DataProfiler:
    
    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.numeric_df = df.select_dtypes(include=[np.number])
        self.categorical_df = df.select_dtypes(include=['object', 'category'])
    
    def get_summary_stats(self) -> pd.DataFrame:
        """Generate summary statistics for numerical columns."""
        if self.numeric_df.empty:
            return pd.DataFrame()
        
        summary = self.numeric_df.describe()
        summary.loc['skewness'] = self.numeric_df.skew()
        summary.loc['kurtosis'] = self.numeric_df.kurtosis()
        return summary
    
    def get_missing_values(self) -> pd.Series:
        """Calculate missing values for all columns."""
        missing = self.df.isnull().sum()
        missing_pct = (missing / len(self.df)) * 100
        return pd.DataFrame({
            'count': missing,
            'percentage': missing_pct
        })
    
    def detect_outliers_iqr(self) -> pd.Series:
        """Detect outliers using IQR method for numerical columns."""
        if self.numeric_df.empty:
            return pd.Series(dtype=int)
        
        Q1 = self.numeric_df.quantile(0.25)
        Q3 = self.numeric_df.quantile(0.75)
        IQR = Q3 - Q1
        
        outlier_mask = (
            (self.numeric_df < (Q1 - 1.5 * IQR)) | 
            (self.numeric_df > (Q3 + 1.5 * IQR))
        )
        return outlier_mask.sum()
    
    def get_correlation_matrix(self) -> pd.DataFrame:
        """Calculate correlation matrix for numerical columns."""
        if self.numeric_df.empty or len(self.numeric_df.columns) < 2:
            return pd.DataFrame()
        return self.numeric_df.corr()
    
    def get_categorical_summary(self) -> Dict:
        """Get summary statistics for categorical columns."""
        if self.categorical_df.empty:
            return {}
        
        summaries = {}
        for col in self.categorical_df.columns:
            summaries[col] = {
                'unique_count': self.df[col].nunique(),
                'top_values': self.df[col].value_counts().head(5).to_dict(),
                'missing_count': self.df[col].isnull().sum()
            }
        return summaries
    
    def get_data_types_summary(self) -> Dict:
        """Get summary of data types in the dataset."""
        return {
            'total_rows': len(self.df),
            'total_columns': len(self.df.columns),
            'numeric_columns': len(self.numeric_df.columns),
            'categorical_columns': len(self.categorical_df.columns),
            'column_types': self.df.dtypes.astype(str).to_dict()
        }


class Visualizer:
    
    def __init__(self, output_dir: Path):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        sns.set_style("whitegrid")
        plt.rcParams['figure.dpi'] = 100
    
    def plot_correlation_heatmap(self, corr_matrix: pd.DataFrame) -> Optional[str]:
        """Generate correlation heatmap."""
        if corr_matrix.empty:
            return None
        
        plt.figure(figsize=(12, 10))
        mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
        sns.heatmap(
            corr_matrix, 
            annot=True, 
            cmap='RdBu_r', 
            center=0,
            fmt=".2f", 
            linewidths=0.5,
            mask=mask,
            square=True,
            cbar_kws={"shrink": 0.8}
        )
        plt.title('Correlation Matrix', fontsize=16, fontweight='bold')
        plt.tight_layout()
        
        filepath = self.output_dir / 'correlation_heatmap.png'
        plt.savefig(filepath, bbox_inches='tight')
        plt.close()
        return str(filepath)
    
    def plot_outliers(self, outliers: pd.Series) -> Optional[str]:
        """Plot outlier counts by column."""
        if outliers.empty or outliers.sum() == 0:
            return None
        
        outliers_filtered = outliers[outliers > 0].sort_values(ascending=False)
        
        plt.figure(figsize=(10, 6))
        outliers_filtered.plot(kind='barh', color='#e74c3c')
        plt.title('Outliers Detected (IQR Method)', fontsize=16, fontweight='bold')
        plt.xlabel('Number of Outliers')
        plt.ylabel('Column')
        plt.tight_layout()
        
        filepath = self.output_dir / 'outliers.png'
        plt.savefig(filepath, bbox_inches='tight')
        plt.close()
        return str(filepath)
    
    def plot_distributions(self, df: pd.DataFrame, max_plots: int = 6) -> List[str]:
        """Generate distribution plots for numerical columns."""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) == 0:
            return []
        
        cols_to_plot = numeric_cols[:max_plots]
        filepaths = []
        
        for col in cols_to_plot:
            fig, axes = plt.subplots(1, 2, figsize=(14, 5))
            
            axes[0].hist(df[col].dropna(), bins=30, color='#3498db', alpha=0.7, edgecolor='black')
            axes[0].set_title(f'{col} - Histogram', fontsize=12, fontweight='bold')
            axes[0].set_xlabel(col)
            axes[0].set_ylabel('Frequency')
            axes[0].grid(alpha=0.3)
            
            axes[1].boxplot(df[col].dropna(), vert=True, patch_artist=True,
                           boxprops=dict(facecolor='#3498db', alpha=0.7))
            axes[1].set_title(f'{col} - Boxplot', fontsize=12, fontweight='bold')
            axes[1].set_ylabel(col)
            axes[1].grid(alpha=0.3)
            
            plt.tight_layout()
            
            filepath = self.output_dir / f'distribution_{col.replace(" ", "_")}.png'
            plt.savefig(filepath, bbox_inches='tight')
            plt.close()
            filepaths.append(str(filepath))
        
        return filepaths
    
    def plot_categorical_distributions(self, df: pd.DataFrame, max_plots: int = 4) -> List[str]:
        """Generate bar plots for categorical columns."""
        cat_cols = df.select_dtypes(include=['object', 'category']).columns
        
        if len(cat_cols) == 0:
            return []
        
        filepaths = []
        cols_to_plot = cat_cols[:max_plots]
        
        for col in cols_to_plot:
            if df[col].nunique() > 20:
                continue
            
            plt.figure(figsize=(10, 6))
            value_counts = df[col].value_counts().head(10)
            value_counts.plot(kind='barh', color='#2ecc71')
            plt.title(f'{col} - Top Categories', fontsize=14, fontweight='bold')
            plt.xlabel('Count')
            plt.ylabel(col)
            plt.tight_layout()
            
            filepath = self.output_dir / f'categorical_{col.replace(" ", "_")}.png'
            plt.savefig(filepath, bbox_inches='tight')
            plt.close()
            filepaths.append(str(filepath))
        
        return filepaths
    
    def plot_missing_values(self, missing_df: pd.DataFrame) -> Optional[str]:
        """Plot missing values if any exist."""
        missing_counts = missing_df[missing_df['count'] > 0]
        
        if missing_counts.empty:
            return None
        
        plt.figure(figsize=(10, 6))
        missing_counts['count'].sort_values(ascending=False).plot(
            kind='barh', color='#e67e22'
        )
        plt.title('Missing Values by Column', fontsize=14, fontweight='bold')
        plt.xlabel('Count of Missing Values')
        plt.ylabel('Column')
        plt.tight_layout()
        
        filepath = self.output_dir / 'missing_values.png'
        plt.savefig(filepath, bbox_inches='tight')
        plt.close()
        return str(filepath)

#!/usr/bin/env python3
"""
Single model general metrics analysis for IASEAI26 project.
Analyzes general performance metrics for individual models.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
from collections import defaultdict
import re

# Set up plotting style
plt.style.use('default')
sns.set_palette("husl")

class GeneralMetricsAnalyzer:
    def __init__(self, general_metrics_path, general_summary_path, model_name="Model"):
        """
        Initialize the analyzer with paths to general metrics files

        Args:
            general_metrics_path: Path to detailed general metrics CSV
            general_summary_path: Path to general metrics summary CSV
            model_name: Name of the model for display purposes
        """
        self.general_metrics_path = general_metrics_path
        self.general_summary_path = general_summary_path
        self.model_name = model_name

        # Set up charts directory based on model name
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.charts_dir = os.path.join(script_dir, '..', '..', 'results', 'individual', f'{model_name}_general_charts')
        os.makedirs(self.charts_dir, exist_ok=True)

        # Load data
        self.detailed_df = pd.read_csv(general_metrics_path)
        self.summary_df = pd.read_csv(general_summary_path)

        # Clean and prepare data
        self._prepare_data()

    def _prepare_data(self):
        """Prepare and clean the data for analysis"""
        # Extract country and category information from prompts
        self.summary_df['country'] = self.summary_df['prompt'].apply(self._extract_country)
        self.summary_df['category'] = self.summary_df['prompt'].apply(self._extract_category)
        self.summary_df['variant'] = self.summary_df['prompt'].apply(self._extract_variant)

        # Clean step information
        self.summary_df['best_clip_step_clean'] = self.summary_df['best_step_by_clip'].str.replace('_path', '')
        self.summary_df['best_aesthetic_step_clean'] = self.summary_df['best_step_by_aesthetic'].str.replace('_path', '')

        # Extract step numbers for analysis
        self.summary_df['best_clip_step_num'] = self.summary_df['best_clip_step_clean'].str.extract('(\d+)').fillna('0').astype(int)
        self.summary_df['best_aesthetic_step_num'] = self.summary_df['best_aesthetic_step_clean'].str.extract('(\d+)').fillna('0').astype(int)

    def _extract_country(self, prompt):
        """Extract country from prompt"""
        prompt_lower = prompt.lower()
        if 'china' in prompt_lower:
            return 'China'
        elif 'korea' in prompt_lower:
            return 'Korea'
        elif 'india' in prompt_lower:
            return 'India'
        elif 'kenya' in prompt_lower:
            return 'Kenya'
        elif 'nigeria' in prompt_lower:
            return 'Nigeria'
        elif 'united states' in prompt_lower or 'america' in prompt_lower:
            return 'United_States'
        return 'Unknown'

    def _extract_category(self, prompt):
        """Extract category from prompt"""
        prompt_lower = prompt.lower()
        if any(word in prompt_lower for word in ['house', 'landmark', 'building']):
            return 'architecture'
        elif any(word in prompt_lower for word in ['dance', 'painting', 'music']):
            return 'art'
        elif any(word in prompt_lower for word in ['wedding', 'funeral', 'festival', 'game', 'sport']):
            return 'event'
        elif any(word in prompt_lower for word in ['clothing', 'accessories', 'makeup']):
            return 'fashion'
        elif any(word in prompt_lower for word in ['food', 'dessert', 'drink']):
            return 'food'
        elif any(word in prompt_lower for word in ['animal', 'wildlife']):
            return 'wildlife'
        elif any(word in prompt_lower for word in ['landscape', 'nature']):
            return 'landscape'
        return 'other'

    def _extract_variant(self, prompt):
        """Extract variant from prompt"""
        prompt_lower = prompt.lower()
        if 'traditional' in prompt_lower:
            return 'traditional'
        elif 'modern' in prompt_lower:
            return 'modern'
        elif 'national' in prompt_lower:
            return 'national'
        elif 'common' in prompt_lower:
            return 'common'
        else:
            return 'general'

    def analyze_overall_performance(self):
        """Analyze overall performance metrics"""
        print("=" * 80)
        print(f"GENERAL METRICS ANALYSIS - {self.model_name.upper()} SYSTEM")
        print("=" * 80)

        # Overall statistics
        total_evaluations = len(self.summary_df)
        countries = self.summary_df['country'].unique()
        categories = self.summary_df['category'].unique()
        variants = self.summary_df['variant'].unique()

        print(f"\nDataset Overview:")
        print(f"- Total evaluations: {total_evaluations}")
        print(f"- Countries analyzed: {len(countries)} ({', '.join(sorted(countries))})")
        print(f"- Categories: {len(categories)} ({', '.join(sorted(categories))})")
        print(f"- Variants: {len(variants)} ({', '.join(sorted(variants))})")

        # Overall performance metrics
        print(f"\nOverall Performance Metrics:")
        print(f"- Average CLIP Score: {self.summary_df['best_clip_score'].mean():.2f} ± {self.summary_df['best_clip_score'].std():.2f}")
        print(f"- CLIP Score Range: [{self.summary_df['best_clip_score'].min():.2f}, {self.summary_df['best_clip_score'].max():.2f}]")
        print(f"- Average Aesthetic Score: {self.summary_df['best_aesthetic'].mean():.2f} ± {self.summary_df['best_aesthetic'].std():.2f}")
        print(f"- Aesthetic Score Range: [{self.summary_df['best_aesthetic'].min():.2f}, {self.summary_df['best_aesthetic'].max():.2f}]")

    def analyze_country_performance(self):
        """Analyze performance by country"""
        print(f"\n" + "=" * 60)
        print("COUNTRY-SPECIFIC ANALYSIS")
        print("=" * 60)

        country_stats = self.summary_df.groupby('country').agg({
            'best_clip_score': ['mean', 'std', 'count'],
            'best_aesthetic': ['mean', 'std'],
            'best_clip_step_num': 'mean',
            'best_aesthetic_step_num': 'mean'
        }).round(3)

        # Flatten column names
        country_stats.columns = ['_'.join(col).strip() for col in country_stats.columns]

        print(f"\nPerformance by Country:")
        for country in sorted(country_stats.index):
            if country == 'Unknown':
                continue
            stats = country_stats.loc[country]
            print(f"\n{country}:")
            print(f"  Evaluations: {int(stats['best_clip_score_count'])}")
            print(f"  CLIP Score: {stats['best_clip_score_mean']:.2f} ± {stats['best_clip_score_std']:.2f}")
            print(f"  Aesthetic Score: {stats['best_aesthetic_mean']:.2f} ± {stats['best_aesthetic_std']:.2f}")
            print(f"  Avg Best CLIP Step: {stats['best_clip_step_num_mean']:.1f}")
            print(f"  Avg Best Aesthetic Step: {stats['best_aesthetic_step_num_mean']:.1f}")

    def analyze_step_performance(self):
        """Analyze which steps produce the best results"""
        print(f"\n" + "=" * 60)
        print("STEP PERFORMANCE ANALYSIS")
        print("=" * 60)

        # CLIP Score best steps
        print(f"\nBest CLIP Score by Step:")
        clip_step_counts = self.summary_df['best_clip_step_clean'].value_counts()
        for step, count in clip_step_counts.items():
            percentage = (count / len(self.summary_df)) * 100
            avg_score = self.summary_df[self.summary_df['best_clip_step_clean'] == step]['best_clip_score'].mean()
            print(f"  {step}: {count} cases ({percentage:.1f}%) - Avg Score: {avg_score:.2f}")

        # Aesthetic Score best steps
        print(f"\nBest Aesthetic Score by Step:")
        aesthetic_step_counts = self.summary_df['best_aesthetic_step_clean'].value_counts()
        for step, count in aesthetic_step_counts.items():
            percentage = (count / len(self.summary_df)) * 100
            avg_score = self.summary_df[self.summary_df['best_aesthetic_step_clean'] == step]['best_aesthetic'].mean()
            print(f"  {step}: {count} cases ({percentage:.1f}%) - Avg Score: {avg_score:.2f}")

    def analyze_category_performance(self):
        """Analyze performance by category and variant"""
        print(f"\n" + "=" * 60)
        print("CATEGORY & VARIANT ANALYSIS")
        print("=" * 60)

        # Performance by category
        category_stats = self.summary_df.groupby('category').agg({
            'best_clip_score': ['mean', 'std', 'count'],
            'best_aesthetic': ['mean', 'std']
        }).round(3)

        print(f"\nPerformance by Category:")
        for category in sorted(category_stats.index):
            if category == 'other':
                continue
            stats = category_stats.loc[category]
            print(f"\n{category.upper()}:")
            print(f"  Evaluations: {int(stats[('best_clip_score', 'count')])}")
            print(f"  CLIP Score: {stats[('best_clip_score', 'mean')]:.2f} ± {stats[('best_clip_score', 'std')]:.2f}")
            print(f"  Aesthetic Score: {stats[('best_aesthetic', 'mean')]:.2f} ± {stats[('best_aesthetic', 'std')]:.2f}")

        # Performance by variant
        variant_stats = self.summary_df.groupby('variant').agg({
            'best_clip_score': ['mean', 'std', 'count'],
            'best_aesthetic': ['mean', 'std']
        }).round(3)

        print(f"\nPerformance by Variant:")
        for variant in sorted(variant_stats.index):
            stats = variant_stats.loc[variant]
            print(f"\n{variant.upper()}:")
            print(f"  Evaluations: {int(stats[('best_clip_score', 'count')])}")
            print(f"  CLIP Score: {stats[('best_clip_score', 'mean')]:.2f} ± {stats[('best_clip_score', 'std')]:.2f}")
            print(f"  Aesthetic Score: {stats[('best_aesthetic', 'mean')]:.2f} ± {stats[('best_aesthetic', 'std')]:.2f}")

    def identify_best_worst_performers(self):
        """Identify best and worst performing combinations"""
        print(f"\n" + "=" * 60)
        print("BEST & WORST PERFORMERS")
        print("=" * 60)

        # Best performers by CLIP score
        best_clip = self.summary_df.nlargest(10, 'best_clip_score')[['prompt', 'country', 'category', 'variant', 'best_clip_score', 'best_aesthetic']]
        print(f"\nTop 10 Best Performers (by CLIP Score):")
        for idx, row in best_clip.iterrows():
            print(f"  {row['country']} - {row['category']}/{row['variant']}: CLIP={row['best_clip_score']:.2f}, Aesthetic={row['best_aesthetic']:.2f}")

        # Best performers by Aesthetic score
        best_aesthetic = self.summary_df.nlargest(10, 'best_aesthetic')[['prompt', 'country', 'category', 'variant', 'best_clip_score', 'best_aesthetic']]
        print(f"\nTop 10 Best Performers (by Aesthetic Score):")
        for idx, row in best_aesthetic.iterrows():
            print(f"  {row['country']} - {row['category']}/{row['variant']}: CLIP={row['best_clip_score']:.2f}, Aesthetic={row['best_aesthetic']:.2f}")

        # Worst performers by CLIP score
        worst_clip = self.summary_df.nsmallest(10, 'best_clip_score')[['prompt', 'country', 'category', 'variant', 'best_clip_score', 'best_aesthetic']]
        print(f"\nTop 10 Worst Performers (by CLIP Score):")
        for idx, row in worst_clip.iterrows():
            print(f"  {row['country']} - {row['category']}/{row['variant']}: CLIP={row['best_clip_score']:.2f}, Aesthetic={row['best_aesthetic']:.2f}")

    def create_visualizations(self):
        """Create comprehensive visualizations for general metrics"""
        print(f"\n" + "=" * 60)
        print("GENERATING VISUALIZATIONS")
        print("=" * 60)

        # 1. Overall Performance Distribution
        self._plot_performance_distribution()

        # 2. Country Performance Analysis
        self._plot_country_performance()

        # 3. Step Analysis
        self._plot_step_analysis()

        # 4. Category Performance
        self._plot_category_performance()

        # 5. CLIP vs Aesthetic Correlation
        self._plot_clip_vs_aesthetic()

        # 6. Advanced Heatmaps
        self._plot_advanced_heatmaps()

        print(f"\nAll visualizations saved to: {self.charts_dir}")

    def _plot_performance_distribution(self):
        """Plot overall performance distribution"""
        fig, axes = plt.subplots(1, 2, figsize=(14, 6))
        fig.suptitle(f'{self.model_name.upper()} - Performance Distribution', fontsize=16, fontweight='bold')

        # CLIP Score distribution
        axes[0].hist(self.summary_df['best_clip_score'], bins=30, alpha=0.7, color='blue', edgecolor='black')
        axes[0].axvline(self.summary_df['best_clip_score'].mean(), color='red', linestyle='--',
                       label=f'Mean: {self.summary_df["best_clip_score"].mean():.2f}')
        axes[0].set_title('CLIP Score Distribution')
        axes[0].set_xlabel('CLIP Score')
        axes[0].set_ylabel('Frequency')
        axes[0].legend()
        axes[0].grid(True, alpha=0.3)

        # Aesthetic Score distribution
        axes[1].hist(self.summary_df['best_aesthetic'], bins=30, alpha=0.7, color='green', edgecolor='black')
        axes[1].axvline(self.summary_df['best_aesthetic'].mean(), color='red', linestyle='--',
                       label=f'Mean: {self.summary_df["best_aesthetic"].mean():.2f}')
        axes[1].set_title('Aesthetic Score Distribution')
        axes[1].set_xlabel('Aesthetic Score')
        axes[1].set_ylabel('Frequency')
        axes[1].legend()
        axes[1].grid(True, alpha=0.3)

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, f"{self.model_name}_performance_distribution.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def _plot_country_performance(self):
        """Plot performance by country"""
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle(f'{self.model_name.upper()} - Country Performance Analysis', fontsize=16, fontweight='bold')

        # Filter out unknown countries
        country_data = self.summary_df[self.summary_df['country'] != 'Unknown']

        # CLIP Score by country
        sns.boxplot(data=country_data, x='country', y='best_clip_score', ax=axes[0, 0])
        axes[0, 0].set_title('CLIP Score by Country')
        axes[0, 0].set_xlabel('Country')
        axes[0, 0].set_ylabel('CLIP Score')
        axes[0, 0].tick_params(axis='x', rotation=45)

        # Aesthetic Score by country
        sns.boxplot(data=country_data, x='country', y='best_aesthetic', ax=axes[0, 1])
        axes[0, 1].set_title('Aesthetic Score by Country')
        axes[0, 1].set_xlabel('Country')
        axes[0, 1].set_ylabel('Aesthetic Score')
        axes[0, 1].tick_params(axis='x', rotation=45)

        # Best CLIP step by country
        sns.boxplot(data=country_data, x='country', y='best_clip_step_num', ax=axes[1, 0])
        axes[1, 0].set_title('Best CLIP Step by Country')
        axes[1, 0].set_xlabel('Country')
        axes[1, 0].set_ylabel('Best CLIP Step Number')
        axes[1, 0].tick_params(axis='x', rotation=45)

        # Best Aesthetic step by country
        sns.boxplot(data=country_data, x='country', y='best_aesthetic_step_num', ax=axes[1, 1])
        axes[1, 1].set_title('Best Aesthetic Step by Country')
        axes[1, 1].set_xlabel('Country')
        axes[1, 1].set_ylabel('Best Aesthetic Step Number')
        axes[1, 1].tick_params(axis='x', rotation=45)

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, f"{self.model_name}_country_performance.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def _plot_step_analysis(self):
        """Plot step analysis"""
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle(f'{self.model_name.upper()} - Step Analysis', fontsize=16, fontweight='bold')

        # CLIP step distribution
        clip_step_counts = self.summary_df['best_clip_step_clean'].value_counts()
        clip_step_counts.plot(kind='bar', ax=axes[0, 0], color='blue', alpha=0.7)
        axes[0, 0].set_title('Best CLIP Step Distribution')
        axes[0, 0].set_xlabel('Step')
        axes[0, 0].set_ylabel('Count')
        axes[0, 0].tick_params(axis='x', rotation=45)

        # Aesthetic step distribution
        aesthetic_step_counts = self.summary_df['best_aesthetic_step_clean'].value_counts()
        aesthetic_step_counts.plot(kind='bar', ax=axes[0, 1], color='green', alpha=0.7)
        axes[0, 1].set_title('Best Aesthetic Step Distribution')
        axes[0, 1].set_xlabel('Step')
        axes[0, 1].set_ylabel('Count')
        axes[0, 1].tick_params(axis='x', rotation=45)

        # Step vs Score correlation
        step_clip_scores = self.summary_df.groupby('best_clip_step_num')['best_clip_score'].mean()
        axes[1, 0].plot(step_clip_scores.index, step_clip_scores.values, 'bo-', linewidth=2, markersize=8)
        axes[1, 0].set_title('Average CLIP Score by Step')
        axes[1, 0].set_xlabel('Step Number')
        axes[1, 0].set_ylabel('Average CLIP Score')
        axes[1, 0].grid(True, alpha=0.3)

        step_aesthetic_scores = self.summary_df.groupby('best_aesthetic_step_num')['best_aesthetic'].mean()
        axes[1, 1].plot(step_aesthetic_scores.index, step_aesthetic_scores.values, 'go-', linewidth=2, markersize=8)
        axes[1, 1].set_title('Average Aesthetic Score by Step')
        axes[1, 1].set_xlabel('Step Number')
        axes[1, 1].set_ylabel('Average Aesthetic Score')
        axes[1, 1].grid(True, alpha=0.3)

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, f"{self.model_name}_step_analysis.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def _plot_category_performance(self):
        """Plot category performance"""
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle(f'{self.model_name.upper()} - Category Performance', fontsize=16, fontweight='bold')

        # Filter out 'other' category
        category_data = self.summary_df[self.summary_df['category'] != 'other']

        # CLIP Score by category
        sns.boxplot(data=category_data, x='category', y='best_clip_score', ax=axes[0, 0])
        axes[0, 0].set_title('CLIP Score by Category')
        axes[0, 0].set_xlabel('Category')
        axes[0, 0].set_ylabel('CLIP Score')
        axes[0, 0].tick_params(axis='x', rotation=45)

        # Aesthetic Score by category
        sns.boxplot(data=category_data, x='category', y='best_aesthetic', ax=axes[0, 1])
        axes[0, 1].set_title('Aesthetic Score by Category')
        axes[0, 1].set_xlabel('Category')
        axes[0, 1].set_ylabel('Aesthetic Score')
        axes[0, 1].tick_params(axis='x', rotation=45)

        # CLIP Score by variant
        sns.boxplot(data=self.summary_df, x='variant', y='best_clip_score', ax=axes[1, 0])
        axes[1, 0].set_title('CLIP Score by Variant')
        axes[1, 0].set_xlabel('Variant')
        axes[1, 0].set_ylabel('CLIP Score')
        axes[1, 0].tick_params(axis='x', rotation=45)

        # Aesthetic Score by variant
        sns.boxplot(data=self.summary_df, x='variant', y='best_aesthetic', ax=axes[1, 1])
        axes[1, 1].set_title('Aesthetic Score by Variant')
        axes[1, 1].set_xlabel('Variant')
        axes[1, 1].set_ylabel('Aesthetic Score')
        axes[1, 1].tick_params(axis='x', rotation=45)

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, f"{self.model_name}_category_performance.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def _plot_clip_vs_aesthetic(self):
        """Plot CLIP vs Aesthetic correlation"""
        fig, axes = plt.subplots(1, 2, figsize=(16, 6))
        fig.suptitle(f'{self.model_name.upper()} - CLIP vs Aesthetic Analysis', fontsize=16, fontweight='bold')

        # Overall correlation
        country_data = self.summary_df[self.summary_df['country'] != 'Unknown']
        sns.scatterplot(data=country_data, x='best_clip_score', y='best_aesthetic',
                       hue='country', alpha=0.7, ax=axes[0])
        axes[0].set_title('CLIP vs Aesthetic Score by Country')
        axes[0].set_xlabel('CLIP Score')
        axes[0].set_ylabel('Aesthetic Score')

        # Calculate correlation
        correlation = self.summary_df['best_clip_score'].corr(self.summary_df['best_aesthetic'])
        axes[0].text(0.05, 0.95, f'Correlation: {correlation:.3f}',
                    transform=axes[0].transAxes, fontsize=12,
                    bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

        # Category correlation
        category_data = self.summary_df[self.summary_df['category'] != 'other']
        sns.scatterplot(data=category_data, x='best_clip_score', y='best_aesthetic',
                       hue='category', alpha=0.7, ax=axes[1])
        axes[1].set_title('CLIP vs Aesthetic Score by Category')
        axes[1].set_xlabel('CLIP Score')
        axes[1].set_ylabel('Aesthetic Score')

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, f"{self.model_name}_clip_vs_aesthetic.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def _plot_advanced_heatmaps(self):
        """Plot advanced heatmaps"""
        fig, axes = plt.subplots(2, 2, figsize=(18, 14))
        fig.suptitle(f'{self.model_name.upper()} - Advanced Performance Heatmaps', fontsize=16, fontweight='bold')

        # Filter data
        filtered_data = self.summary_df[self.summary_df['country'] != 'Unknown']

        # CLIP Score heatmap by country and category
        clip_pivot = filtered_data.pivot_table(
            values='best_clip_score',
            index='country',
            columns='category',
            aggfunc='mean'
        )

        sns.heatmap(clip_pivot, annot=True, fmt='.1f', cmap='Blues',
                   ax=axes[0, 0], cbar_kws={'label': 'CLIP Score'})
        axes[0, 0].set_title('CLIP Score by Country & Category')
        axes[0, 0].set_xlabel('Category')
        axes[0, 0].set_ylabel('Country')

        # Aesthetic Score heatmap by country and category
        aesthetic_pivot = filtered_data.pivot_table(
            values='best_aesthetic',
            index='country',
            columns='category',
            aggfunc='mean'
        )

        sns.heatmap(aesthetic_pivot, annot=True, fmt='.1f', cmap='Greens',
                   ax=axes[0, 1], cbar_kws={'label': 'Aesthetic Score'})
        axes[0, 1].set_title('Aesthetic Score by Country & Category')
        axes[0, 1].set_xlabel('Category')
        axes[0, 1].set_ylabel('Country')

        # Best CLIP step heatmap by country and variant
        clip_step_pivot = filtered_data.pivot_table(
            values='best_clip_step_num',
            index='country',
            columns='variant',
            aggfunc='mean'
        )

        sns.heatmap(clip_step_pivot, annot=True, fmt='.1f', cmap='Reds',
                   ax=axes[1, 0], cbar_kws={'label': 'Best CLIP Step'})
        axes[1, 0].set_title('Best CLIP Step by Country & Variant')
        axes[1, 0].set_xlabel('Variant')
        axes[1, 0].set_ylabel('Country')

        # Best Aesthetic step heatmap by country and variant
        aesthetic_step_pivot = filtered_data.pivot_table(
            values='best_aesthetic_step_num',
            index='country',
            columns='variant',
            aggfunc='mean'
        )

        sns.heatmap(aesthetic_step_pivot, annot=True, fmt='.1f', cmap='Purples',
                   ax=axes[1, 1], cbar_kws={'label': 'Best Aesthetic Step'})
        axes[1, 1].set_title('Best Aesthetic Step by Country & Variant')
        axes[1, 1].set_xlabel('Variant')
        axes[1, 1].set_ylabel('Country')

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, f"{self.model_name}_advanced_heatmaps.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def generate_summary_report(self):
        """Generate comprehensive summary report"""
        print(f"\n" + "=" * 80)
        print(f"GENERAL METRICS SUMMARY REPORT - {self.model_name.upper()}")
        print("=" * 80)

        # Key findings
        overall_clip = self.summary_df['best_clip_score'].mean()
        overall_aesthetic = self.summary_df['best_aesthetic'].mean()

        country_data = self.summary_df[self.summary_df['country'] != 'Unknown']
        best_clip_country = country_data.groupby('country')['best_clip_score'].mean().idxmax()
        worst_clip_country = country_data.groupby('country')['best_clip_score'].mean().idxmin()
        best_aesthetic_country = country_data.groupby('country')['best_aesthetic'].mean().idxmax()

        category_data = self.summary_df[self.summary_df['category'] != 'other']
        best_clip_category = category_data.groupby('category')['best_clip_score'].mean().idxmax()
        best_aesthetic_category = category_data.groupby('category')['best_aesthetic'].mean().idxmax()

        print(f"\nKEY FINDINGS:")
        print(f"- Overall CLIP Score: {overall_clip:.2f}")
        print(f"- Overall Aesthetic Score: {overall_aesthetic:.2f}")
        print(f"- Best CLIP country: {best_clip_country}")
        print(f"- Worst CLIP country: {worst_clip_country}")
        print(f"- Best Aesthetic country: {best_aesthetic_country}")
        print(f"- Best CLIP category: {best_clip_category}")
        print(f"- Best Aesthetic category: {best_aesthetic_category}")

        # Step analysis
        best_clip_step = self.summary_df['best_clip_step_clean'].mode()[0]
        best_aesthetic_step = self.summary_df['best_aesthetic_step_clean'].mode()[0]

        print(f"\nSTEP ANALYSIS:")
        print(f"- Most frequent best CLIP step: {best_clip_step}")
        print(f"- Most frequent best Aesthetic step: {best_aesthetic_step}")

        # Performance distribution
        high_clip = len(self.summary_df[self.summary_df['best_clip_score'] > 30])
        high_aesthetic = len(self.summary_df[self.summary_df['best_aesthetic'] > 6])

        print(f"\nPERFORMANCE DISTRIBUTION:")
        print(f"- High CLIP performers (>30): {high_clip} ({high_clip/len(self.summary_df)*100:.1f}%)")
        print(f"- High Aesthetic performers (>6): {high_aesthetic} ({high_aesthetic/len(self.summary_df)*100:.1f}%)")

        print(f"\n" + "=" * 80)


def main(model_name):
    """Main function to run the general metrics analysis for a specific model"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_path = os.path.join(script_dir, '..', '..', 'output', model_name)

    general_metrics_path = os.path.join(base_path, 'general_metrics.csv')
    general_summary_path = os.path.join(base_path, 'general_metrics_summary.csv')

    # Check if files exist
    if not os.path.exists(general_metrics_path):
        print(f"Error: General metrics file not found at {general_metrics_path}")
        return

    if not os.path.exists(general_summary_path):
        print(f"Error: General summary file not found at {general_summary_path}")
        return

    # Initialize analyzer
    analyzer = GeneralMetricsAnalyzer(general_metrics_path, general_summary_path, model_name)

    # Run all analyses
    analyzer.analyze_overall_performance()
    analyzer.analyze_country_performance()
    analyzer.analyze_step_performance()
    analyzer.analyze_category_performance()
    analyzer.identify_best_worst_performers()
    analyzer.create_visualizations()
    analyzer.generate_summary_report()


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python single_model_general.py <model_name>")
        print("Example: python single_model_general.py flux")
        sys.exit(1)

    model_name = sys.argv[1]
    main(model_name)

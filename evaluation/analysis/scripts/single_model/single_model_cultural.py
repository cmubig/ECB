#!/usr/bin/env python3
"""
Single model cultural metrics analysis for IASEAI26 project.
Analyzes cultural performance metrics for individual models.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
from collections import defaultdict

# Set up plotting style
plt.style.use('default')
sns.set_palette("husl")

class CulturalMetricsAnalyzer:
    def __init__(self, cultural_metrics_path, cultural_summary_path, model_name="Model"):
        """
        Initialize the analyzer with paths to cultural metrics files

        Args:
            cultural_metrics_path: Path to detailed cultural metrics CSV
            cultural_summary_path: Path to cultural metrics summary CSV
            model_name: Name of the model for display purposes
        """
        self.cultural_metrics_path = cultural_metrics_path
        self.cultural_summary_path = cultural_summary_path
        self.model_name = model_name

        # Set up charts directory based on model name
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.charts_dir = os.path.join(script_dir, '..', '..', 'results', 'individual', f'{model_name}_cultural_charts')
        os.makedirs(self.charts_dir, exist_ok=True)

        # Load data
        self.detailed_df = pd.read_csv(cultural_metrics_path)
        self.summary_df = pd.read_csv(cultural_summary_path)

        # Clean and prepare data
        self._prepare_data()

    def _prepare_data(self):
        """Prepare and clean the data for analysis"""
        # Clean NaN values and ensure proper data types
        self.summary_df = self.summary_df.dropna(subset=['country', 'category', 'variant'])
        self.detailed_df = self.detailed_df.dropna(subset=['country', 'category'])

        # Ensure country names are properly formatted
        self.summary_df['country'] = self.summary_df['country'].str.title()
        self.detailed_df['country'] = self.detailed_df['country'].str.title()

        # Fill NaN values in variant column
        self.summary_df['variant'] = self.summary_df['variant'].fillna('general')

        # Create combined category labels
        self.summary_df['category_variant'] = (
            self.summary_df['category'] + '_' +
            self.summary_df['sub_category'] + '_' +
            self.summary_df['variant']
        )

        # Extract step numbers for better sorting
        self.summary_df['step_num'] = self.summary_df['step'].str.extract('(\d+)').fillna('-1').astype(int)

    def analyze_overall_performance(self):
        """Analyze overall cultural performance across all metrics"""
        print("=" * 80)
        print(f"CULTURAL METRICS ANALYSIS - {self.model_name.upper()} SYSTEM")
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
        overall_stats = self.summary_df.agg({
            'accuracy': ['mean', 'std', 'min', 'max'],
            'precision': ['mean', 'std', 'min', 'max'],
            'recall': ['mean', 'std', 'min', 'max'],
            'f1': ['mean', 'std', 'min', 'max']
        }).round(3)

        print(f"\nOverall Performance Metrics:")
        for metric in ['accuracy', 'precision', 'recall', 'f1']:
            stats = overall_stats.loc[:, metric]
            print(f"- {metric.upper()}:")
            print(f"  Mean: {stats['mean']:.3f} ± {stats['std']:.3f}")
            print(f"  Range: [{stats['min']:.3f}, {stats['max']:.3f}]")

    def analyze_country_performance(self):
        """Analyze performance by country"""
        print(f"\n" + "=" * 60)
        print("COUNTRY-SPECIFIC ANALYSIS")
        print("=" * 60)

        country_stats = self.summary_df.groupby('country').agg({
            'accuracy': ['mean', 'std', 'count'],
            'precision': ['mean', 'std'],
            'recall': ['mean', 'std'],
            'f1': ['mean', 'std'],
            'processing_time': ['mean', 'std']
        }).round(3)

        # Flatten column names
        country_stats.columns = ['_'.join(col).strip() for col in country_stats.columns]

        print(f"\nPerformance by Country:")
        for country in sorted(country_stats.index):
            stats = country_stats.loc[country]
            print(f"\n{country}:")
            print(f"  Evaluations: {int(stats['accuracy_count'])}")
            print(f"  Accuracy: {stats['accuracy_mean']:.3f} ± {stats['accuracy_std']:.3f}")
            print(f"  Precision: {stats['precision_mean']:.3f} ± {stats['precision_std']:.3f}")
            print(f"  Recall: {stats['recall_mean']:.3f} ± {stats['recall_std']:.3f}")
            print(f"  F1-Score: {stats['f1_mean']:.3f} ± {stats['f1_std']:.3f}")
            print(f"  Avg Processing Time: {stats['processing_time_mean']:.2f}s")

    def analyze_category_performance(self):
        """Analyze performance by category and variant"""
        print(f"\n" + "=" * 60)
        print("CATEGORY & VARIANT ANALYSIS")
        print("=" * 60)

        # Performance by main category
        category_stats = self.summary_df.groupby('category').agg({
            'accuracy': ['mean', 'std', 'count'],
            'f1': ['mean', 'std']
        }).round(3)

        print(f"\nPerformance by Category:")
        for category in sorted(category_stats.index):
            stats = category_stats.loc[category]
            print(f"\n{category.upper()}:")
            print(f"  Evaluations: {int(stats[('accuracy', 'count')])}")
            print(f"  Accuracy: {stats[('accuracy', 'mean')]:.3f} ± {stats[('accuracy', 'std')]:.3f}")
            print(f"  F1-Score: {stats[('f1', 'mean')]:.3f} ± {stats[('f1', 'std')]:.3f}")

        # Performance by variant (traditional, modern, general)
        variant_stats = self.summary_df.groupby('variant').agg({
            'accuracy': ['mean', 'std', 'count'],
            'f1': ['mean', 'std']
        }).round(3)

        print(f"\nPerformance by Variant:")
        for variant in sorted(variant_stats.index):
            stats = variant_stats.loc[variant]
            print(f"\n{variant.upper()}:")
            print(f"  Evaluations: {int(stats[('accuracy', 'count')])}")
            print(f"  Accuracy: {stats[('accuracy', 'mean')]:.3f} ± {stats[('accuracy', 'std')]:.3f}")
            print(f"  F1-Score: {stats[('f1', 'mean')]:.3f} ± {stats[('f1', 'std')]:.3f}")

    def analyze_step_performance(self):
        """Analyze performance across different steps"""
        print(f"\n" + "=" * 60)
        print("STEP-WISE PERFORMANCE ANALYSIS")
        print("=" * 60)

        step_stats = self.summary_df.groupby('step_num').agg({
            'accuracy': ['mean', 'std', 'count'],
            'f1': ['mean', 'std'],
            'processing_time': ['mean', 'std']
        }).round(3)

        print(f"\nPerformance by Step:")
        for step_num in sorted(step_stats.index):
            if step_num == -1:
                step_name = "step0"
            else:
                step_name = f"step{step_num}"

            stats = step_stats.loc[step_num]
            print(f"\n{step_name.upper()}:")
            print(f"  Evaluations: {int(stats[('accuracy', 'count')])}")
            print(f"  Accuracy: {stats[('accuracy', 'mean')]:.3f} ± {stats[('accuracy', 'std')]:.3f}")
            print(f"  F1-Score: {stats[('f1', 'mean')]:.3f} ± {stats[('f1', 'std')]:.3f}")
            print(f"  Processing Time: {stats[('processing_time', 'mean')]:.2f}s ± {stats[('processing_time', 'std')]:.2f}s")

    def identify_best_worst_performers(self):
        """Identify best and worst performing combinations"""
        print(f"\n" + "=" * 60)
        print("BEST & WORST PERFORMERS")
        print("=" * 60)

        # Best performers by F1 score
        best_f1 = self.summary_df.nlargest(10, 'f1')[['country', 'category', 'sub_category', 'variant', 'step', 'f1', 'accuracy']]
        print(f"\nTop 10 Best Performers (by F1-Score):")
        for idx, row in best_f1.iterrows():
            print(f"  {row['country']} - {row['category']}/{row['sub_category']}/{row['variant']} ({row['step']}): F1={row['f1']:.3f}, Acc={row['accuracy']:.3f}")

        # Worst performers by F1 score
        worst_f1 = self.summary_df.nsmallest(10, 'f1')[['country', 'category', 'sub_category', 'variant', 'step', 'f1', 'accuracy']]
        print(f"\nTop 10 Worst Performers (by F1-Score):")
        for idx, row in worst_f1.iterrows():
            print(f"  {row['country']} - {row['category']}/{row['sub_category']}/{row['variant']} ({row['step']}): F1={row['f1']:.3f}, Acc={row['accuracy']:.3f}")

    def analyze_image_quality_metrics(self):
        """Analyze actual image quality metrics (not VLM performance)"""
        print(f"\n" + "=" * 60)
        print("IMAGE QUALITY & CULTURAL REPRESENTATION ANALYSIS")
        print("=" * 60)

        # Best/Worst image analysis
        best_images = self.summary_df[self.summary_df['is_best'] == True]
        worst_images = self.summary_df[self.summary_df['is_worst'] == True]

        print(f"\nImage Quality Distribution:")
        print(f"- Total evaluations: {len(self.summary_df)}")
        print(f"- Best images: {len(best_images)} ({len(best_images)/len(self.summary_df)*100:.1f}%)")
        print(f"- Worst images: {len(worst_images)} ({len(worst_images)/len(self.summary_df)*100:.1f}%)")
        print(f"- Regular images: {len(self.summary_df) - len(best_images) - len(worst_images)} ({(len(self.summary_df) - len(best_images) - len(worst_images))/len(self.summary_df)*100:.1f}%)")

        # Cultural representative scores
        print(f"\nCultural Representative Scores:")
        cultural_stats = self.summary_df['cultural_representative'].describe()
        print(f"- Mean: {cultural_stats['mean']:.2f}")
        print(f"- Std: {cultural_stats['std']:.2f}")
        print(f"- Range: [{cultural_stats['min']:.0f}, {cultural_stats['max']:.0f}]")

        # Prompt alignment scores
        print(f"\nPrompt Alignment Scores:")
        alignment_stats = self.summary_df['prompt_alignment'].describe()
        print(f"- Mean: {alignment_stats['mean']:.2f}")
        print(f"- Std: {alignment_stats['std']:.2f}")
        print(f"- Range: [{alignment_stats['min']:.0f}, {alignment_stats['max']:.0f}]")

    def analyze_best_worst_by_country_step(self):
        """Analyze which countries and steps produce best/worst images"""
        print(f"\n" + "=" * 60)
        print("BEST/WORST IMAGES BY COUNTRY & STEP")
        print("=" * 60)

        # Best images by country
        best_by_country = self.summary_df[self.summary_df['is_best'] == True].groupby('country').agg({
            'uid': 'count',
            'cultural_representative': 'mean',
            'prompt_alignment': 'mean'
        }).round(2)
        best_by_country.columns = ['best_count', 'avg_cultural_rep', 'avg_prompt_align']

        print(f"\nBest Images by Country:")
        for country in best_by_country.index:
            stats = best_by_country.loc[country]
            total_country_images = len(self.summary_df[self.summary_df['country'] == country])
            percentage = (stats['best_count'] / total_country_images) * 100
            print(f"  {country}: {int(stats['best_count'])} best images ({percentage:.1f}% of country's images)")
            print(f"    Avg Cultural Rep: {stats['avg_cultural_rep']:.2f}")
            print(f"    Avg Prompt Alignment: {stats['avg_prompt_align']:.2f}")

        # Worst images by country
        worst_by_country = self.summary_df[self.summary_df['is_worst'] == True].groupby('country').agg({
            'uid': 'count',
            'cultural_representative': 'mean',
            'prompt_alignment': 'mean'
        }).round(2)
        worst_by_country.columns = ['worst_count', 'avg_cultural_rep', 'avg_prompt_align']

        print(f"\nWorst Images by Country:")
        for country in worst_by_country.index:
            stats = worst_by_country.loc[country]
            total_country_images = len(self.summary_df[self.summary_df['country'] == country])
            percentage = (stats['worst_count'] / total_country_images) * 100
            print(f"  {country}: {int(stats['worst_count'])} worst images ({percentage:.1f}% of country's images)")
            print(f"    Avg Cultural Rep: {stats['avg_cultural_rep']:.2f}")
            print(f"    Avg Prompt Alignment: {stats['avg_prompt_align']:.2f}")

        # Best/Worst by step
        print(f"\nBest Images by Step:")
        best_by_step = self.summary_df[self.summary_df['is_best'] == True].groupby('step').agg({
            'uid': 'count',
            'cultural_representative': 'mean',
            'prompt_alignment': 'mean'
        }).round(2)

        for step in best_by_step.index:
            stats = best_by_step.loc[step]
            total_step_images = len(self.summary_df[self.summary_df['step'] == step])
            percentage = (stats['uid'] / total_step_images) * 100
            print(f"  {step}: {int(stats['uid'])} best images ({percentage:.1f}% of step's images)")
            print(f"    Avg Cultural Rep: {stats['cultural_representative']:.2f}")
            print(f"    Avg Prompt Alignment: {stats['prompt_alignment']:.2f}")

        print(f"\nWorst Images by Step:")
        worst_by_step = self.summary_df[self.summary_df['is_worst'] == True].groupby('step').agg({
            'uid': 'count',
            'cultural_representative': 'mean',
            'prompt_alignment': 'mean'
        }).round(2)

        for step in worst_by_step.index:
            stats = worst_by_step.loc[step]
            total_step_images = len(self.summary_df[self.summary_df['step'] == step])
            percentage = (stats['uid'] / total_step_images) * 100
            print(f"  {step}: {int(stats['uid'])} worst images ({percentage:.1f}% of step's images)")
            print(f"    Avg Cultural Rep: {stats['cultural_representative']:.2f}")
            print(f"    Avg Prompt Alignment: {stats['prompt_alignment']:.2f}")

    def analyze_cultural_bias(self):
        """Analyze potential cultural bias in the model"""
        print(f"\n" + "=" * 60)
        print("CULTURAL BIAS ANALYSIS")
        print("=" * 60)

        # Compare performance across countries for same categories
        bias_analysis = []

        for category in self.summary_df['category'].unique():
            for sub_category in self.summary_df['sub_category'].unique():
                for variant in self.summary_df['variant'].unique():
                    subset = self.summary_df[
                        (self.summary_df['category'] == category) &
                        (self.summary_df['sub_category'] == sub_category) &
                        (self.summary_df['variant'] == variant)
                    ]

                    if len(subset) > 1:  # Only analyze if multiple countries have this combination
                        country_performance = subset.groupby('country')['f1'].mean()
                        if len(country_performance) > 1:
                            max_perf = country_performance.max()
                            min_perf = country_performance.min()
                            performance_gap = max_perf - min_perf

                            bias_analysis.append({
                                'category': category,
                                'sub_category': sub_category,
                                'variant': variant,
                                'performance_gap': performance_gap,
                                'best_country': country_performance.idxmax(),
                                'worst_country': country_performance.idxmin(),
                                'best_score': max_perf,
                                'worst_score': min_perf
                            })

        if bias_analysis:
            bias_df = pd.DataFrame(bias_analysis)
            bias_df = bias_df.sort_values('performance_gap', ascending=False)

            print(f"\nLargest Performance Gaps Between Countries:")
            print(f"(Indicating potential cultural bias)")

            for idx, row in bias_df.head(10).iterrows():
                print(f"\n{row['category']}/{row['sub_category']}/{row['variant']}:")
                print(f"  Gap: {row['performance_gap']:.3f}")
                print(f"  Best: {row['best_country']} (F1: {row['best_score']:.3f})")
                print(f"  Worst: {row['worst_country']} (F1: {row['worst_score']:.3f})")

    def create_visualizations(self):
        """Create comprehensive visualizations for cultural metrics"""
        print(f"\n" + "=" * 60)
        print("GENERATING VISUALIZATIONS")
        print("=" * 60)

        # 1. Country Performance Heatmap
        self._plot_country_performance_heatmap()

        # 2. Category Performance by Country
        self._plot_category_performance_by_country()

        # 3. Step Performance Analysis
        self._plot_step_performance()

        # 4. Variant Performance Comparison
        self._plot_variant_performance()

        # 5. Processing Time Analysis
        self._plot_processing_time_analysis()

        # 6. Image Quality Analysis
        self._plot_image_quality_analysis()

        # 7. Best/Worst Distribution
        self._plot_best_worst_distribution()

        # 8. Cultural Representative vs Prompt Alignment
        self._plot_cultural_vs_prompt_alignment()

        # 9. Advanced Heatmaps for Country-Step Analysis
        self._plot_advanced_country_step_heatmaps()

        # 10. Comprehensive Performance Comparison Heatmaps
        self._plot_comprehensive_performance_heatmaps()

        print(f"\nAll visualizations saved to: {self.charts_dir}")

    def _plot_country_performance_heatmap(self):
        """Create a heatmap of performance metrics by country"""
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Cultural Performance Heatmap by Country', fontsize=16, fontweight='bold')

        metrics = ['accuracy', 'precision', 'recall', 'f1']

        for idx, metric in enumerate(metrics):
            ax = axes[idx // 2, idx % 2]

            # Create pivot table for heatmap
            pivot_data = self.summary_df.pivot_table(
                values=metric,
                index='country',
                columns='category_variant',
                aggfunc='mean'
            )

            sns.heatmap(pivot_data, annot=True, fmt='.2f', cmap='RdYlBu_r',
                       ax=ax, cbar_kws={'label': metric.title()})
            ax.set_title(f'{metric.title()} by Country and Category')
            ax.set_xlabel('Category_SubCategory_Variant')
            ax.set_ylabel('Country')

            # Rotate x-axis labels for better readability
            ax.tick_params(axis='x', rotation=45)

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, "country_performance_heatmap.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def _plot_category_performance_by_country(self):
        """Plot performance by category for each country"""
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Performance by Category and Country', fontsize=16, fontweight='bold')

        metrics = ['accuracy', 'precision', 'recall', 'f1']

        for idx, metric in enumerate(metrics):
            ax = axes[idx // 2, idx % 2]

            # Create grouped bar plot
            category_country_data = self.summary_df.groupby(['category', 'country'])[metric].mean().reset_index()

            sns.barplot(data=category_country_data, x='category', y=metric, hue='country', ax=ax)
            ax.set_title(f'{metric.title()} by Category and Country')
            ax.set_xlabel('Category')
            ax.set_ylabel(metric.title())
            ax.legend(title='Country', bbox_to_anchor=(1.05, 1), loc='upper left')

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, "category_performance_by_country.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def _plot_step_performance(self):
        """Plot performance across different steps"""
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle('Performance Across Steps', fontsize=16, fontweight='bold')

        metrics = ['accuracy', 'precision', 'recall', 'f1']

        for idx, metric in enumerate(metrics):
            ax = axes[idx // 2, idx % 2]

            # Box plot showing distribution across steps
            step_data = self.summary_df[self.summary_df['step_num'] >= 0]  # Exclude step0 (-1)

            sns.boxplot(data=step_data, x='step_num', y=metric, ax=ax)
            ax.set_title(f'{metric.title()} Distribution by Step')
            ax.set_xlabel('Step Number')
            ax.set_ylabel(metric.title())

            # Add mean line
            step_means = step_data.groupby('step_num')[metric].mean()
            ax.plot(range(len(step_means)), step_means.values, 'ro-', alpha=0.7, label='Mean')
            ax.legend()

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, "step_performance.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def _plot_variant_performance(self):
        """Plot performance by variant (traditional, modern, general)"""
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        fig.suptitle('Performance by Variant Type', fontsize=16, fontweight='bold')

        metrics = ['accuracy', 'precision', 'recall', 'f1']

        for idx, metric in enumerate(metrics):
            ax = axes[idx // 2, idx % 2]

            # Violin plot showing distribution by variant
            sns.violinplot(data=self.summary_df, x='variant', y=metric, ax=ax)
            ax.set_title(f'{metric.title()} by Variant')
            ax.set_xlabel('Variant')
            ax.set_ylabel(metric.title())

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, "variant_performance.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def _plot_processing_time_analysis(self):
        """Analyze processing time patterns"""
        fig, axes = plt.subplots(1, 3, figsize=(18, 6))
        fig.suptitle('Processing Time Analysis', fontsize=16, fontweight='bold')

        # Processing time by country
        sns.boxplot(data=self.summary_df, x='country', y='processing_time', ax=axes[0])
        axes[0].set_title('Processing Time by Country')
        axes[0].set_xlabel('Country')
        axes[0].set_ylabel('Processing Time (seconds)')
        axes[0].tick_params(axis='x', rotation=45)

        # Processing time by category
        sns.boxplot(data=self.summary_df, x='category', y='processing_time', ax=axes[1])
        axes[1].set_title('Processing Time by Category')
        axes[1].set_xlabel('Category')
        axes[1].set_ylabel('Processing Time (seconds)')

        # Processing time vs F1 score
        sns.scatterplot(data=self.summary_df, x='processing_time', y='f1',
                       hue='country', alpha=0.7, ax=axes[2])
        axes[2].set_title('Processing Time vs F1 Score')
        axes[2].set_xlabel('Processing Time (seconds)')
        axes[2].set_ylabel('F1 Score')
        axes[2].legend(bbox_to_anchor=(1.05, 1), loc='upper left')

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, "processing_time_analysis.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def _plot_image_quality_analysis(self):
        """Plot image quality metrics analysis"""
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Image Quality Metrics Analysis', fontsize=16, fontweight='bold')

        # Cultural representative by country
        sns.boxplot(data=self.summary_df, x='country', y='cultural_representative', ax=axes[0, 0])
        axes[0, 0].set_title('Cultural Representative Score by Country')
        axes[0, 0].set_xlabel('Country')
        axes[0, 0].set_ylabel('Cultural Representative Score')
        axes[0, 0].tick_params(axis='x', rotation=45)

        # Prompt alignment by country
        sns.boxplot(data=self.summary_df, x='country', y='prompt_alignment', ax=axes[0, 1])
        axes[0, 1].set_title('Prompt Alignment Score by Country')
        axes[0, 1].set_xlabel('Country')
        axes[0, 1].set_ylabel('Prompt Alignment Score')
        axes[0, 1].tick_params(axis='x', rotation=45)

        # Cultural representative by category
        sns.boxplot(data=self.summary_df, x='category', y='cultural_representative', ax=axes[1, 0])
        axes[1, 0].set_title('Cultural Representative Score by Category')
        axes[1, 0].set_xlabel('Category')
        axes[1, 0].set_ylabel('Cultural Representative Score')
        axes[1, 0].tick_params(axis='x', rotation=45)

        # Prompt alignment by category
        sns.boxplot(data=self.summary_df, x='category', y='prompt_alignment', ax=axes[1, 1])
        axes[1, 1].set_title('Prompt Alignment Score by Category')
        axes[1, 1].set_xlabel('Category')
        axes[1, 1].set_ylabel('Prompt Alignment Score')
        axes[1, 1].tick_params(axis='x', rotation=45)

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, "image_quality_analysis.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def _plot_best_worst_distribution(self):
        """Plot best/worst image distribution"""
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Best/Worst Image Distribution Analysis', fontsize=16, fontweight='bold')

        # Best images by country
        best_by_country = self.summary_df[self.summary_df['is_best'] == True].groupby('country').size()
        total_by_country = self.summary_df.groupby('country').size()
        best_percentage = (best_by_country / total_by_country * 100).fillna(0)

        best_percentage.plot(kind='bar', ax=axes[0, 0], color='green', alpha=0.7)
        axes[0, 0].set_title('Best Images Percentage by Country')
        axes[0, 0].set_xlabel('Country')
        axes[0, 0].set_ylabel('Percentage of Best Images (%)')
        axes[0, 0].tick_params(axis='x', rotation=45)

        # Worst images by country
        worst_by_country = self.summary_df[self.summary_df['is_worst'] == True].groupby('country').size()
        worst_percentage = (worst_by_country / total_by_country * 100).fillna(0)

        worst_percentage.plot(kind='bar', ax=axes[0, 1], color='red', alpha=0.7)
        axes[0, 1].set_title('Worst Images Percentage by Country')
        axes[0, 1].set_xlabel('Country')
        axes[0, 1].set_ylabel('Percentage of Worst Images (%)')
        axes[0, 1].tick_params(axis='x', rotation=45)

        # Best images by step
        best_by_step = self.summary_df[self.summary_df['is_best'] == True].groupby('step').size()
        total_by_step = self.summary_df.groupby('step').size()
        best_step_percentage = (best_by_step / total_by_step * 100).fillna(0)

        best_step_percentage.plot(kind='bar', ax=axes[1, 0], color='green', alpha=0.7)
        axes[1, 0].set_title('Best Images Percentage by Step')
        axes[1, 0].set_xlabel('Step')
        axes[1, 0].set_ylabel('Percentage of Best Images (%)')
        axes[1, 0].tick_params(axis='x', rotation=45)

        # Worst images by step
        worst_by_step = self.summary_df[self.summary_df['is_worst'] == True].groupby('step').size()
        worst_step_percentage = (worst_by_step / total_by_step * 100).fillna(0)

        worst_step_percentage.plot(kind='bar', ax=axes[1, 1], color='red', alpha=0.7)
        axes[1, 1].set_title('Worst Images Percentage by Step')
        axes[1, 1].set_xlabel('Step')
        axes[1, 1].set_ylabel('Percentage of Worst Images (%)')
        axes[1, 1].tick_params(axis='x', rotation=45)

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, "best_worst_distribution.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def _plot_cultural_vs_prompt_alignment(self):
        """Plot cultural representative vs prompt alignment correlation"""
        fig, axes = plt.subplots(1, 3, figsize=(18, 6))
        fig.suptitle('Cultural Representative vs Prompt Alignment Analysis', fontsize=16, fontweight='bold')

        # Scatter plot: Cultural Rep vs Prompt Alignment
        sns.scatterplot(data=self.summary_df, x='cultural_representative', y='prompt_alignment',
                       hue='country', alpha=0.6, ax=axes[0])
        axes[0].set_title('Cultural Rep vs Prompt Alignment by Country')
        axes[0].set_xlabel('Cultural Representative Score')
        axes[0].set_ylabel('Prompt Alignment Score')

        # Best images: Cultural Rep vs Prompt Alignment
        best_images = self.summary_df[self.summary_df['is_best'] == True]
        if len(best_images) > 0:
            sns.scatterplot(data=best_images, x='cultural_representative', y='prompt_alignment',
                           hue='country', alpha=0.8, ax=axes[1], s=100)
            axes[1].set_title('Best Images: Cultural Rep vs Prompt Alignment')
            axes[1].set_xlabel('Cultural Representative Score')
            axes[1].set_ylabel('Prompt Alignment Score')

        # Worst images: Cultural Rep vs Prompt Alignment
        worst_images = self.summary_df[self.summary_df['is_worst'] == True]
        if len(worst_images) > 0:
            sns.scatterplot(data=worst_images, x='cultural_representative', y='prompt_alignment',
                           hue='country', alpha=0.8, ax=axes[2], s=100)
            axes[2].set_title('Worst Images: Cultural Rep vs Prompt Alignment')
            axes[2].set_xlabel('Cultural Representative Score')
            axes[2].set_ylabel('Prompt Alignment Score')

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, "cultural_vs_prompt_alignment.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def _plot_advanced_country_step_heatmaps(self):
        """Create advanced heatmaps focusing on country-step performance analysis"""

        # 1. Country-Step Performance Heatmap (Image Quality Metrics)
        fig, axes = plt.subplots(2, 2, figsize=(18, 14))
        fig.suptitle('Country-Step Performance Analysis (Image Quality Metrics)', fontsize=16, fontweight='bold')

        # Cultural Representative Score by Country-Step
        cultural_pivot = self.summary_df.pivot_table(
            values='cultural_representative',
            index='country',
            columns='step',
            aggfunc='mean'
        )

        sns.heatmap(cultural_pivot, annot=True, fmt='.2f', cmap='RdYlGn',
                   ax=axes[0, 0], cbar_kws={'label': 'Cultural Representative Score'})
        axes[0, 0].set_title('Cultural Representative Score by Country & Step')
        axes[0, 0].set_xlabel('Step')
        axes[0, 0].set_ylabel('Country')

        # Prompt Alignment Score by Country-Step
        alignment_pivot = self.summary_df.pivot_table(
            values='prompt_alignment',
            index='country',
            columns='step',
            aggfunc='mean'
        )

        sns.heatmap(alignment_pivot, annot=True, fmt='.2f', cmap='RdYlGn',
                   ax=axes[0, 1], cbar_kws={'label': 'Prompt Alignment Score'})
        axes[0, 1].set_title('Prompt Alignment Score by Country & Step')
        axes[0, 1].set_xlabel('Step')
        axes[0, 1].set_ylabel('Country')

        # Best Image Percentage by Country-Step
        best_pivot = self.summary_df.groupby(['country', 'step']).agg({
            'is_best': ['sum', 'count']
        })
        best_pivot.columns = ['best_count', 'total_count']
        best_pivot['best_percentage'] = (best_pivot['best_count'] / best_pivot['total_count'] * 100)
        best_percentage_pivot = best_pivot['best_percentage'].unstack(fill_value=0)

        sns.heatmap(best_percentage_pivot, annot=True, fmt='.1f', cmap='Greens',
                   ax=axes[1, 0], cbar_kws={'label': 'Best Images (%)'})
        axes[1, 0].set_title('Best Images Percentage by Country & Step')
        axes[1, 0].set_xlabel('Step')
        axes[1, 0].set_ylabel('Country')

        # Worst Image Percentage by Country-Step
        worst_pivot = self.summary_df.groupby(['country', 'step']).agg({
            'is_worst': ['sum', 'count']
        })
        worst_pivot.columns = ['worst_count', 'total_count']
        worst_pivot['worst_percentage'] = (worst_pivot['worst_count'] / worst_pivot['total_count'] * 100)
        worst_percentage_pivot = worst_pivot['worst_percentage'].unstack(fill_value=0)

        sns.heatmap(worst_percentage_pivot, annot=True, fmt='.1f', cmap='Reds',
                   ax=axes[1, 1], cbar_kws={'label': 'Worst Images (%)'})
        axes[1, 1].set_title('Worst Images Percentage by Country & Step')
        axes[1, 1].set_xlabel('Step')
        axes[1, 1].set_ylabel('Country')

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, "advanced_country_step_heatmaps.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

        # 2. Processing Time & VLM Performance by Country-Step
        fig, axes = plt.subplots(2, 2, figsize=(18, 14))
        fig.suptitle('Processing Time & VLM Performance by Country-Step', fontsize=16, fontweight='bold')

        # Processing Time by Country-Step
        time_pivot = self.summary_df.pivot_table(
            values='processing_time',
            index='country',
            columns='step',
            aggfunc='mean'
        )

        sns.heatmap(time_pivot, annot=True, fmt='.2f', cmap='YlOrRd',
                   ax=axes[0, 0], cbar_kws={'label': 'Processing Time (seconds)'})
        axes[0, 0].set_title('Average Processing Time by Country & Step')
        axes[0, 0].set_xlabel('Step')
        axes[0, 0].set_ylabel('Country')

        # F1 Score by Country-Step
        f1_pivot = self.summary_df.pivot_table(
            values='f1',
            index='country',
            columns='step',
            aggfunc='mean'
        )

        sns.heatmap(f1_pivot, annot=True, fmt='.3f', cmap='RdYlBu_r',
                   ax=axes[0, 1], cbar_kws={'label': 'F1 Score'})
        axes[0, 1].set_title('Average F1 Score by Country & Step')
        axes[0, 1].set_xlabel('Step')
        axes[0, 1].set_ylabel('Country')

        # Accuracy by Country-Step
        accuracy_pivot = self.summary_df.pivot_table(
            values='accuracy',
            index='country',
            columns='step',
            aggfunc='mean'
        )

        sns.heatmap(accuracy_pivot, annot=True, fmt='.3f', cmap='RdYlBu_r',
                   ax=axes[1, 0], cbar_kws={'label': 'Accuracy'})
        axes[1, 0].set_title('Average Accuracy by Country & Step')
        axes[1, 0].set_xlabel('Step')
        axes[1, 0].set_ylabel('Country')

        # Combined Quality Score (Cultural Rep + Prompt Alignment)
        self.summary_df['combined_quality'] = (self.summary_df['cultural_representative'] +
                                              self.summary_df['prompt_alignment']) / 2

        combined_pivot = self.summary_df.pivot_table(
            values='combined_quality',
            index='country',
            columns='step',
            aggfunc='mean'
        )

        sns.heatmap(combined_pivot, annot=True, fmt='.2f', cmap='RdYlGn',
                   ax=axes[1, 1], cbar_kws={'label': 'Combined Quality Score'})
        axes[1, 1].set_title('Combined Quality Score by Country & Step')
        axes[1, 1].set_xlabel('Step')
        axes[1, 1].set_ylabel('Country')

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, "processing_vlm_performance_heatmaps.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def _plot_comprehensive_performance_heatmaps(self):
        """Create comprehensive performance comparison heatmaps"""

        # 1. Category-Country-Step Analysis
        fig, axes = plt.subplots(2, 3, figsize=(24, 16))
        fig.suptitle('Comprehensive Performance Analysis by Category, Country & Step', fontsize=18, fontweight='bold')

        # Top categories for detailed analysis
        top_categories = ['food', 'fashion', 'event']  # Categories with most data

        for idx, category in enumerate(top_categories):
            category_data = self.summary_df[self.summary_df['category'] == category]

            # Cultural Representative by Country-Step for this category
            cat_cultural_pivot = category_data.pivot_table(
                values='cultural_representative',
                index='country',
                columns='step',
                aggfunc='mean'
            )

            sns.heatmap(cat_cultural_pivot, annot=True, fmt='.2f', cmap='RdYlGn',
                       ax=axes[0, idx], cbar_kws={'label': 'Cultural Rep Score'})
            axes[0, idx].set_title(f'{category.title()} - Cultural Representative by Country & Step')
            axes[0, idx].set_xlabel('Step')
            axes[0, idx].set_ylabel('Country')

            # F1 Score by Country-Step for this category
            cat_f1_pivot = category_data.pivot_table(
                values='f1',
                index='country',
                columns='step',
                aggfunc='mean'
            )

            sns.heatmap(cat_f1_pivot, annot=True, fmt='.2f', cmap='RdYlBu_r',
                       ax=axes[1, idx], cbar_kws={'label': 'F1 Score'})
            axes[1, idx].set_title(f'{category.title()} - F1 Score by Country & Step')
            axes[1, idx].set_xlabel('Step')
            axes[1, idx].set_ylabel('Country')

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, "comprehensive_category_analysis_heatmaps.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

        # 2. Variant Performance Comparison
        fig, axes = plt.subplots(2, 2, figsize=(20, 16))
        fig.suptitle('Variant Performance Comparison by Country & Step', fontsize=16, fontweight='bold')

        # Traditional vs Modern vs General variants
        main_variants = ['traditional', 'modern', 'general']

        for idx, variant in enumerate(main_variants):
            if idx >= 3:  # Only plot first 3 variants
                break

            variant_data = self.summary_df[self.summary_df['variant'] == variant]

            if len(variant_data) == 0:
                continue

            # Cultural Representative for this variant
            var_cultural_pivot = variant_data.pivot_table(
                values='cultural_representative',
                index='country',
                columns='step',
                aggfunc='mean'
            )

            row = idx // 2
            col = idx % 2

            sns.heatmap(var_cultural_pivot, annot=True, fmt='.2f', cmap='RdYlGn',
                       ax=axes[row, col], cbar_kws={'label': 'Cultural Rep Score'})
            axes[row, col].set_title(f'{variant.title()} Variant - Cultural Rep by Country & Step')
            axes[row, col].set_xlabel('Step')
            axes[row, col].set_ylabel('Country')

        # Performance difference heatmap (Traditional - Modern)
        if len(self.summary_df[self.summary_df['variant'] == 'traditional']) > 0 and \
           len(self.summary_df[self.summary_df['variant'] == 'modern']) > 0:

            trad_pivot = self.summary_df[self.summary_df['variant'] == 'traditional'].pivot_table(
                values='cultural_representative', index='country', columns='step', aggfunc='mean'
            )
            mod_pivot = self.summary_df[self.summary_df['variant'] == 'modern'].pivot_table(
                values='cultural_representative', index='country', columns='step', aggfunc='mean'
            )

            # Calculate difference (Traditional - Modern)
            diff_pivot = trad_pivot.subtract(mod_pivot, fill_value=0)

            sns.heatmap(diff_pivot, annot=True, fmt='.2f', cmap='RdBu_r', center=0,
                       ax=axes[1, 1], cbar_kws={'label': 'Difference (Trad - Mod)'})
            axes[1, 1].set_title('Traditional vs Modern Performance Difference')
            axes[1, 1].set_xlabel('Step')
            axes[1, 1].set_ylabel('Country')

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, "variant_performance_comparison_heatmaps.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

        # 3. Step Progression Analysis
        fig, axes = plt.subplots(1, 2, figsize=(20, 8))
        fig.suptitle('Step Progression Analysis - Quality Changes Over Steps', fontsize=16, fontweight='bold')

        # Calculate step-to-step changes in quality
        step_changes = {}
        for country in self.summary_df['country'].unique():
            country_data = self.summary_df[self.summary_df['country'] == country]
            step_means = country_data.groupby('step')['cultural_representative'].mean()

            changes = []
            steps = sorted([s for s in step_means.index if s != 'step0'])

            for i, step in enumerate(steps):
                if i == 0:
                    # Compare with step0
                    if 'step0' in step_means.index:
                        change = step_means[step] - step_means['step0']
                    else:
                        change = 0
                else:
                    # Compare with previous step
                    prev_step = steps[i-1]
                    change = step_means[step] - step_means[prev_step]
                changes.append(change)

            step_changes[country] = changes

        # Create DataFrame for heatmap
        if step_changes:
            changes_df = pd.DataFrame(step_changes, index=steps[:len(max(step_changes.values(), key=len))])
            changes_df = changes_df.T  # Transpose to have countries as rows

            sns.heatmap(changes_df, annot=True, fmt='.3f', cmap='RdBu_r', center=0,
                       ax=axes[0], cbar_kws={'label': 'Quality Change'})
            axes[0].set_title('Step-to-Step Quality Changes by Country')
            axes[0].set_xlabel('Step')
            axes[0].set_ylabel('Country')

        # Best vs Worst ratio by Country-Step
        best_worst_ratio = self.summary_df.groupby(['country', 'step']).agg({
            'is_best': 'sum',
            'is_worst': 'sum'
        })
        best_worst_ratio['ratio'] = best_worst_ratio['is_best'] / (best_worst_ratio['is_worst'] + 1)  # +1 to avoid division by zero
        ratio_pivot = best_worst_ratio['ratio'].unstack(fill_value=0)

        sns.heatmap(ratio_pivot, annot=True, fmt='.2f', cmap='RdYlGn',
                   ax=axes[1], cbar_kws={'label': 'Best/Worst Ratio'})
        axes[1].set_title('Best/Worst Image Ratio by Country & Step')
        axes[1].set_xlabel('Step')
        axes[1].set_ylabel('Country')

        plt.tight_layout()
        save_path = os.path.join(self.charts_dir, "step_progression_analysis_heatmaps.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Generated: {save_path}")

    def generate_summary_report(self):
        """Generate a comprehensive summary report"""
        print(f"\n" + "=" * 80)
        print("CULTURAL METRICS SUMMARY REPORT")
        print("=" * 80)

        # Key findings
        overall_f1 = self.summary_df['f1'].mean()
        best_country = self.summary_df.groupby('country')['f1'].mean().idxmax()
        worst_country = self.summary_df.groupby('country')['f1'].mean().idxmin()
        best_category = self.summary_df.groupby('category')['f1'].mean().idxmax()
        worst_category = self.summary_df.groupby('category')['f1'].mean().idxmin()

        print(f"\nKEY FINDINGS:")
        print(f"- Overall F1 Score: {overall_f1:.3f}")
        print(f"- Best performing country: {best_country}")
        print(f"- Worst performing country: {worst_country}")
        print(f"- Best performing category: {best_category}")
        print(f"- Worst performing category: {worst_category}")

        # Performance distribution
        high_performers = len(self.summary_df[self.summary_df['f1'] > 0.8])
        medium_performers = len(self.summary_df[(self.summary_df['f1'] >= 0.5) & (self.summary_df['f1'] <= 0.8)])
        low_performers = len(self.summary_df[self.summary_df['f1'] < 0.5])

        print(f"\nPERFORMANCE DISTRIBUTION:")
        print(f"- High performers (F1 > 0.8): {high_performers} ({high_performers/len(self.summary_df)*100:.1f}%)")
        print(f"- Medium performers (0.5 ≤ F1 ≤ 0.8): {medium_performers} ({medium_performers/len(self.summary_df)*100:.1f}%)")
        print(f"- Low performers (F1 < 0.5): {low_performers} ({low_performers/len(self.summary_df)*100:.1f}%)")

        print(f"\nRECOMMendations:")
        if low_performers > len(self.summary_df) * 0.3:
            print("- High number of low performers detected. Consider model fine-tuning.")
        if self.summary_df.groupby('country')['f1'].std().mean() > 0.2:
            print("- Significant performance variation across countries. Address cultural bias.")
        if self.summary_df.groupby('variant')['f1'].std().mean() > 0.2:
            print("- Performance varies significantly by variant. Focus on underperforming variants.")

        print(f"\n" + "=" * 80)


def main(model_name):
    """Main function to run the cultural analysis for a specific model"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_path = os.path.join(script_dir, '..', '..', 'output', model_name)

    cultural_metrics_path = os.path.join(base_path, 'cultural_metrics.csv')
    cultural_summary_path = os.path.join(base_path, 'cultural_metrics_summary.csv')

    # Check if files exist
    if not os.path.exists(cultural_metrics_path):
        print(f"Error: Cultural metrics file not found at {cultural_metrics_path}")
        return

    if not os.path.exists(cultural_summary_path):
        print(f"Error: Cultural summary file not found at {cultural_summary_path}")
        return

    # Initialize analyzer
    analyzer = CulturalMetricsAnalyzer(cultural_metrics_path, cultural_summary_path, model_name)

    # Run all analyses
    analyzer.analyze_overall_performance()
    analyzer.analyze_country_performance()
    analyzer.analyze_category_performance()
    analyzer.analyze_step_performance()
    analyzer.identify_best_worst_performers()
    analyzer.analyze_image_quality_metrics()
    analyzer.analyze_best_worst_by_country_step()
    analyzer.analyze_cultural_bias()
    analyzer.create_visualizations()
    analyzer.generate_summary_report()


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python single_model_cultural.py <model_name>")
        print("Example: python single_model_cultural.py flux")
        sys.exit(1)

    model_name = sys.argv[1]
    main(model_name)

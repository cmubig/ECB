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

# Get the directory where the script is located to build robust paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_CHARTS_DIR = os.path.join(SCRIPT_DIR, 'multi_model_general_charts')

class MultiModelGeneralAnalyzer:
    def __init__(self, model_configs):
        """
        Initialize the multi-model general analyzer
        
        Args:
            model_configs: Dict with model names as keys and config dicts as values
        """
        self.model_configs = model_configs
        self.models_data = {}
        
        # Create organized folder structure
        self._create_folder_structure()
        
        # Load data for all models
        self._load_all_models_data()
        
    def _create_folder_structure(self):
        """Create organized folder structure for charts"""
        self.folders = {
            'overview': os.path.join(BASE_CHARTS_DIR, '01_overview_comparison'),
            'country_analysis': os.path.join(BASE_CHARTS_DIR, '02_country_analysis'),
            'step_analysis': os.path.join(BASE_CHARTS_DIR, '03_step_analysis'),
            'category_analysis': os.path.join(BASE_CHARTS_DIR, '04_category_analysis'),
            'detailed_heatmaps': os.path.join(BASE_CHARTS_DIR, '05_detailed_heatmaps')
        }
        
        # Create all directories
        for folder_path in self.folders.values():
            os.makedirs(folder_path, exist_ok=True)
            
    def _load_all_models_data(self):
        """Load data for all models"""
        for model_name, config in self.model_configs.items():
            try:
                summary_df = pd.read_csv(config['general_summary_path'])
                
                # Clean and prepare data
                summary_df['country'] = summary_df['prompt'].apply(self._extract_country)
                summary_df['category'] = summary_df['prompt'].apply(self._extract_category)
                summary_df['variant'] = summary_df['prompt'].apply(self._extract_variant)
                summary_df['model'] = model_name
                
                # Clean step information
                summary_df['best_clip_step_clean'] = summary_df['best_step_by_clip'].str.replace('_path', '')
                summary_df['best_aesthetic_step_clean'] = summary_df['best_step_by_aesthetic'].str.replace('_path', '')
                summary_df['best_clip_step_num'] = summary_df['best_clip_step_clean'].str.extract('(\d+)').fillna('0').astype(int)
                summary_df['best_aesthetic_step_num'] = summary_df['best_aesthetic_step_clean'].str.extract('(\d+)').fillna('0').astype(int)
                
                self.models_data[model_name] = summary_df
                
                print(f"✅ Loaded {model_name}: {len(summary_df)} evaluations")
                
            except Exception as e:
                print(f"❌ Error loading {model_name}: {e}")
                
        # Combine all summary data for comparison
        if self.models_data:
            self.combined_summary = pd.concat([data for data in self.models_data.values()], 
                                            ignore_index=True)
            print(f"📊 Combined dataset: {len(self.combined_summary)} total evaluations")
    
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
            
    def analyze_overall_comparison(self):
        """Compare overall performance between models"""
        print("=" * 80)
        print("MULTI-MODEL GENERAL METRICS COMPARISON")
        print("=" * 80)
        
        for model_name, data in self.models_data.items():
            print(f"\n🤖 {model_name.upper()} SYSTEM:")
            print(f"- Total evaluations: {len(data)}")
            print(f"- Countries: {data['country'].nunique()}")
            print(f"- Categories: {data['category'].nunique()}")
            
            # Performance metrics
            print(f"- Avg CLIP Score: {data['best_clip_score'].mean():.2f} ± {data['best_clip_score'].std():.2f}")
            print(f"- Avg Aesthetic Score: {data['best_aesthetic'].mean():.2f} ± {data['best_aesthetic'].std():.2f}")
            print(f"- Best CLIP Step (mode): {data['best_clip_step_clean'].mode()[0]}")
            print(f"- Best Aesthetic Step (mode): {data['best_aesthetic_step_clean'].mode()[0]}")
            
    def compare_country_performance(self):
        """Compare performance by country across models"""
        print(f"\n" + "=" * 60)
        print("COUNTRY PERFORMANCE COMPARISON")
        print("=" * 60)
        
        country_comparison = self.combined_summary.groupby(['model', 'country']).agg({
            'best_clip_score': ['mean', 'std'],
            'best_aesthetic': ['mean', 'std'],
            'best_clip_step_num': 'mean',
            'best_aesthetic_step_num': 'mean'
        }).round(3)
        
        for country in sorted(self.combined_summary['country'].unique()):
            if country == 'Unknown':
                continue
            print(f"\n🌍 {country}:")
            for model_name in self.models_data.keys():
                if (model_name, country) in country_comparison.index:
                    model_data = country_comparison.loc[model_name, country]
                    print(f"  {model_name}:")
                    print(f"    CLIP: {model_data[('best_clip_score', 'mean')]:.2f} ± {model_data[('best_clip_score', 'std')]:.2f}")
                    print(f"    Aesthetic: {model_data[('best_aesthetic', 'mean')]:.2f} ± {model_data[('best_aesthetic', 'std')]:.2f}")
                    print(f"    Best CLIP Step: {model_data[('best_clip_step_num', 'mean')]:.1f}")
                    
    def compare_step_performance(self):
        """Compare step-wise performance across models"""
        print(f"\n" + "=" * 60)
        print("STEP PERFORMANCE COMPARISON")
        print("=" * 60)
        
        for model_name, data in self.models_data.items():
            print(f"\n🤖 {model_name.upper()}:")
            
            # CLIP step distribution
            clip_steps = data['best_clip_step_clean'].value_counts().head(3)
            print(f"  Top CLIP Steps:")
            for step, count in clip_steps.items():
                pct = (count / len(data)) * 100
                avg_score = data[data['best_clip_step_clean'] == step]['best_clip_score'].mean()
                print(f"    {step}: {count} ({pct:.1f}%) - Avg: {avg_score:.2f}")
            
            # Aesthetic step distribution
            aesthetic_steps = data['best_aesthetic_step_clean'].value_counts().head(3)
            print(f"  Top Aesthetic Steps:")
            for step, count in aesthetic_steps.items():
                pct = (count / len(data)) * 100
                avg_score = data[data['best_aesthetic_step_clean'] == step]['best_aesthetic'].mean()
                print(f"    {step}: {count} ({pct:.1f}%) - Avg: {avg_score:.2f}")
                
    def identify_model_strengths_weaknesses(self):
        """Identify each model's strengths and weaknesses"""
        print(f"\n" + "=" * 60)
        print("SYSTEM STRENGTHS & WEAKNESSES")
        print("=" * 60)
        
        for model_name, data in self.models_data.items():
            print(f"\n🤖 {model_name.upper()}:")
            
            # Filter out 'other' and 'Unknown'
            filtered_data = data[(data['category'] != 'other') & (data['country'] != 'Unknown')]
            
            # Best performing categories
            best_categories = filtered_data.groupby('category')['best_clip_score'].mean().nlargest(3)
            print(f"  🏆 Strongest Categories (CLIP):")
            for cat, score in best_categories.items():
                print(f"    - {cat}: {score:.2f}")
                
            # Best performing countries
            best_countries = filtered_data.groupby('country')['best_clip_score'].mean().nlargest(3)
            print(f"  🌟 Best Countries (CLIP):")
            for country, score in best_countries.items():
                print(f"    - {country}: {score:.2f}")
                
            # Best variant
            best_variant = filtered_data.groupby('variant')['best_clip_score'].mean().idxmax()
            best_variant_score = filtered_data.groupby('variant')['best_clip_score'].mean().max()
            print(f"  ⭐ Best Variant: {best_variant} ({best_variant_score:.2f})")
            
    def create_overview_visualizations(self):
        """Create overview comparison visualizations"""
        print(f"\n📊 Generating Overview Visualizations...")
        
        # 1. Overall Performance Comparison
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Multi-Model General Performance Overview', fontsize=16, fontweight='bold')
        
        # CLIP Score comparison
        sns.boxplot(data=self.combined_summary, x='model', y='best_clip_score', ax=axes[0, 0])
        axes[0, 0].set_title('CLIP Score Comparison')
        axes[0, 0].set_xlabel('Model')
        axes[0, 0].set_ylabel('CLIP Score')
        
        # Aesthetic Score comparison
        sns.boxplot(data=self.combined_summary, x='model', y='best_aesthetic', ax=axes[0, 1])
        axes[0, 1].set_title('Aesthetic Score Comparison')
        axes[0, 1].set_xlabel('Model')
        axes[0, 1].set_ylabel('Aesthetic Score')
        
        # CLIP vs Aesthetic scatter
        for model_name, data in self.models_data.items():
            axes[1, 0].scatter(data['best_clip_score'], data['best_aesthetic'], 
                             alpha=0.6, label=model_name, s=30)
        axes[1, 0].set_title('CLIP vs Aesthetic Score')
        axes[1, 0].set_xlabel('CLIP Score')
        axes[1, 0].set_ylabel('Aesthetic Score')
        axes[1, 0].legend()
        
        # Performance distribution
        for model_name, data in self.models_data.items():
            axes[1, 1].hist(data['best_clip_score'], alpha=0.6, label=model_name, bins=20)
        axes[1, 1].set_title('CLIP Score Distribution')
        axes[1, 1].set_xlabel('CLIP Score')
        axes[1, 1].set_ylabel('Frequency')
        axes[1, 1].legend()
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['overview'], "overall_performance_comparison.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
    def create_country_analysis_visualizations(self):
        """Create country-specific analysis visualizations"""
        print(f"\n🌍 Generating Country Analysis Visualizations...")
        
        # 1. Country Performance Comparison
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Country Performance Comparison', fontsize=16, fontweight='bold')
        
        # Filter out Unknown countries
        country_data = self.combined_summary[self.combined_summary['country'] != 'Unknown']
        
        # CLIP Score by country and model
        sns.boxplot(data=country_data, x='country', y='best_clip_score', hue='model', ax=axes[0, 0])
        axes[0, 0].set_title('CLIP Score by Country & Model')
        axes[0, 0].set_xlabel('Country')
        axes[0, 0].set_ylabel('CLIP Score')
        axes[0, 0].tick_params(axis='x', rotation=45)
        
        # Aesthetic Score by country and model
        sns.boxplot(data=country_data, x='country', y='best_aesthetic', hue='model', ax=axes[0, 1])
        axes[0, 1].set_title('Aesthetic Score by Country & Model')
        axes[0, 1].set_xlabel('Country')
        axes[0, 1].set_ylabel('Aesthetic Score')
        axes[0, 1].tick_params(axis='x', rotation=45)
        
        # Best CLIP step by country and model
        sns.boxplot(data=country_data, x='country', y='best_clip_step_num', hue='model', ax=axes[1, 0])
        axes[1, 0].set_title('Best CLIP Step by Country & Model')
        axes[1, 0].set_xlabel('Country')
        axes[1, 0].set_ylabel('Best CLIP Step Number')
        axes[1, 0].tick_params(axis='x', rotation=45)
        
        # Best Aesthetic step by country and model
        sns.boxplot(data=country_data, x='country', y='best_aesthetic_step_num', hue='model', ax=axes[1, 1])
        axes[1, 1].set_title('Best Aesthetic Step by Country & Model')
        axes[1, 1].set_xlabel('Country')
        axes[1, 1].set_ylabel('Best Aesthetic Step Number')
        axes[1, 1].tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['country_analysis'], "country_performance_comparison.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
    def create_step_analysis_visualizations(self):
        """Create step-wise analysis visualizations"""
        print(f"\n📈 Generating Step Analysis Visualizations...")
        
        # 1. Step Distribution Comparison
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Step Analysis Comparison', fontsize=16, fontweight='bold')
        
        # CLIP step distribution
        for model_name, data in self.models_data.items():
            step_counts = data['best_clip_step_clean'].value_counts()
            step_percentages = (step_counts / len(data) * 100)
            axes[0, 0].bar([f"{step}_{model_name}" for step in step_counts.index], 
                          step_percentages.values, alpha=0.7, label=model_name)
        axes[0, 0].set_title('Best CLIP Step Distribution')
        axes[0, 0].set_xlabel('Step_Model')
        axes[0, 0].set_ylabel('Percentage (%)')
        axes[0, 0].tick_params(axis='x', rotation=45)
        axes[0, 0].legend()
        
        # Aesthetic step distribution
        for model_name, data in self.models_data.items():
            step_counts = data['best_aesthetic_step_clean'].value_counts()
            step_percentages = (step_counts / len(data) * 100)
            axes[0, 1].bar([f"{step}_{model_name}" for step in step_counts.index], 
                          step_percentages.values, alpha=0.7, label=model_name)
        axes[0, 1].set_title('Best Aesthetic Step Distribution')
        axes[0, 1].set_xlabel('Step_Model')
        axes[0, 1].set_ylabel('Percentage (%)')
        axes[0, 1].tick_params(axis='x', rotation=45)
        axes[0, 1].legend()
        
        # Average scores by step
        for model_name, data in self.models_data.items():
            step_scores = data.groupby('best_clip_step_num')['best_clip_score'].mean()
            axes[1, 0].plot(step_scores.index, step_scores.values, 'o-', 
                           label=model_name, linewidth=2, markersize=6)
        axes[1, 0].set_title('Average CLIP Score by Step Number')
        axes[1, 0].set_xlabel('Step Number')
        axes[1, 0].set_ylabel('Average CLIP Score')
        axes[1, 0].legend()
        axes[1, 0].grid(True, alpha=0.3)
        
        for model_name, data in self.models_data.items():
            step_scores = data.groupby('best_aesthetic_step_num')['best_aesthetic'].mean()
            axes[1, 1].plot(step_scores.index, step_scores.values, 'o-', 
                           label=model_name, linewidth=2, markersize=6)
        axes[1, 1].set_title('Average Aesthetic Score by Step Number')
        axes[1, 1].set_xlabel('Step Number')
        axes[1, 1].set_ylabel('Average Aesthetic Score')
        axes[1, 1].legend()
        axes[1, 1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['step_analysis'], "step_analysis_comparison.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
    def create_category_analysis_visualizations(self):
        """Create category-specific analysis visualizations"""
        print(f"\n📂 Generating Category Analysis Visualizations...")
        
        # 1. Category Performance Comparison
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Category Performance Comparison', fontsize=16, fontweight='bold')
        
        # Filter out 'other' category
        category_data = self.combined_summary[self.combined_summary['category'] != 'other']
        
        # CLIP Score by category
        category_comparison = category_data.groupby(['model', 'category'])['best_clip_score'].mean().unstack()
        category_comparison.plot(kind='bar', ax=axes[0, 0], width=0.8)
        axes[0, 0].set_title('CLIP Score by Category')
        axes[0, 0].set_xlabel('Model')
        axes[0, 0].set_ylabel('CLIP Score')
        axes[0, 0].legend(title='Category', bbox_to_anchor=(1.05, 1), loc='upper left')
        axes[0, 0].tick_params(axis='x', rotation=45)
        
        # Aesthetic Score by category
        aesthetic_comparison = category_data.groupby(['model', 'category'])['best_aesthetic'].mean().unstack()
        aesthetic_comparison.plot(kind='bar', ax=axes[0, 1], width=0.8)
        axes[0, 1].set_title('Aesthetic Score by Category')
        axes[0, 1].set_xlabel('Model')
        axes[0, 1].set_ylabel('Aesthetic Score')
        axes[0, 1].legend(title='Category', bbox_to_anchor=(1.05, 1), loc='upper left')
        axes[0, 1].tick_params(axis='x', rotation=45)
        
        # Variant comparison
        variant_clip_comparison = self.combined_summary.groupby(['model', 'variant'])['best_clip_score'].mean().unstack()
        variant_clip_comparison.plot(kind='bar', ax=axes[1, 0], width=0.8)
        axes[1, 0].set_title('CLIP Score by Variant')
        axes[1, 0].set_xlabel('Model')
        axes[1, 0].set_ylabel('CLIP Score')
        axes[1, 0].legend(title='Variant', bbox_to_anchor=(1.05, 1), loc='upper left')
        axes[1, 0].tick_params(axis='x', rotation=45)
        
        variant_aesthetic_comparison = self.combined_summary.groupby(['model', 'variant'])['best_aesthetic'].mean().unstack()
        variant_aesthetic_comparison.plot(kind='bar', ax=axes[1, 1], width=0.8)
        axes[1, 1].set_title('Aesthetic Score by Variant')
        axes[1, 1].set_xlabel('Model')
        axes[1, 1].set_ylabel('Aesthetic Score')
        axes[1, 1].legend(title='Variant', bbox_to_anchor=(1.05, 1), loc='upper left')
        axes[1, 1].tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['category_analysis'], "category_performance_comparison.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
    def create_detailed_heatmaps(self):
        """Create detailed comparison heatmaps"""
        print(f"\n🔥 Generating Detailed Heatmaps...")
        
        # 1. Model Comparison Heatmaps
        fig, axes = plt.subplots(2, len(self.models_data), figsize=(8*len(self.models_data), 12))
        if len(self.models_data) == 1:
            axes = axes.reshape(-1, 1)
        fig.suptitle('Detailed Model Comparison Heatmaps', fontsize=16, fontweight='bold')
        
        for idx, (model_name, data) in enumerate(self.models_data.items()):
            # Filter data
            filtered_data = data[(data['category'] != 'other') & (data['country'] != 'Unknown')]
            
            # CLIP Score heatmap
            clip_pivot = filtered_data.pivot_table(
                values='best_clip_score', 
                index='country', 
                columns='category', 
                aggfunc='mean'
            )
            
            sns.heatmap(clip_pivot, annot=True, fmt='.1f', cmap='Blues', 
                       ax=axes[0, idx], cbar_kws={'label': 'CLIP Score'})
            axes[0, idx].set_title(f'{model_name.upper()} - CLIP Score by Country & Category')
            axes[0, idx].set_xlabel('Category')
            axes[0, idx].set_ylabel('Country')
            
            # Aesthetic Score heatmap
            aesthetic_pivot = filtered_data.pivot_table(
                values='best_aesthetic', 
                index='country', 
                columns='category', 
                aggfunc='mean'
            )
            
            sns.heatmap(aesthetic_pivot, annot=True, fmt='.2f', cmap='Greens', 
                       ax=axes[1, idx], cbar_kws={'label': 'Aesthetic Score'})
            axes[1, idx].set_title(f'{model_name.upper()} - Aesthetic Score by Country & Category')
            axes[1, idx].set_xlabel('Category')
            axes[1, idx].set_ylabel('Country')
            
        plt.tight_layout()
        save_path = os.path.join(self.folders['detailed_heatmaps'], "model_comparison_heatmaps.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
        # 2. Direct Comparison (if 2 models)
        if len(self.models_data) == 2:
            model_names = list(self.models_data.keys())
            model1_data = self.models_data[model_names[0]]
            model2_data = self.models_data[model_names[1]]
            
            fig, axes = plt.subplots(1, 2, figsize=(16, 8))
            fig.suptitle(f'{model_names[0].upper()} vs {model_names[1].upper()} Direct Comparison', 
                        fontsize=16, fontweight='bold')
            
            # Filter data
            model1_filtered = model1_data[(model1_data['category'] != 'other') & (model1_data['country'] != 'Unknown')]
            model2_filtered = model2_data[(model2_data['category'] != 'other') & (model2_data['country'] != 'Unknown')]
            
            # CLIP Score comparison
            model1_clip_pivot = model1_filtered.pivot_table(
                values='best_clip_score', index='country', columns='category', aggfunc='mean'
            )
            model2_clip_pivot = model2_filtered.pivot_table(
                values='best_clip_score', index='country', columns='category', aggfunc='mean'
            )
            
            # Calculate difference (Model1 - Model2)
            clip_diff_pivot = model1_clip_pivot.subtract(model2_clip_pivot, fill_value=0)
            
            sns.heatmap(clip_diff_pivot, annot=True, fmt='.2f', cmap='RdBu_r', center=0,
                       ax=axes[0], cbar_kws={'label': f'{model_names[0]} - {model_names[1]}'})
            axes[0].set_title('CLIP Score Difference')
            axes[0].set_xlabel('Category')
            axes[0].set_ylabel('Country')
            
            # Aesthetic Score comparison
            model1_aesthetic_pivot = model1_filtered.pivot_table(
                values='best_aesthetic', index='country', columns='category', aggfunc='mean'
            )
            model2_aesthetic_pivot = model2_filtered.pivot_table(
                values='best_aesthetic', index='country', columns='category', aggfunc='mean'
            )
            
            aesthetic_diff_pivot = model1_aesthetic_pivot.subtract(model2_aesthetic_pivot, fill_value=0)
            
            sns.heatmap(aesthetic_diff_pivot, annot=True, fmt='.3f', cmap='RdBu_r', center=0,
                       ax=axes[1], cbar_kws={'label': f'{model_names[0]} - {model_names[1]}'})
            axes[1].set_title('Aesthetic Score Difference')
            axes[1].set_xlabel('Category')
            axes[1].set_ylabel('Country')
            
            plt.tight_layout()
            save_path = os.path.join(self.folders['detailed_heatmaps'], "direct_model_comparison.png")
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            plt.close()
            print(f"  ✅ {save_path}")
        
    def generate_all_visualizations(self):
        """Generate all visualizations"""
        print(f"\n🎨 Starting Multi-Model General Visualization Generation...")
        print(f"📁 Charts will be saved to: {BASE_CHARTS_DIR}")
        
        self.create_overview_visualizations()
        self.create_country_analysis_visualizations()
        self.create_step_analysis_visualizations()
        self.create_category_analysis_visualizations()
        self.create_detailed_heatmaps()
        
        print(f"\n✅ All visualizations generated successfully!")
        print(f"📊 Check the organized folders in: {BASE_CHARTS_DIR}")
        
    def generate_comparison_report(self):
        """Generate comprehensive comparison report"""
        print(f"\n" + "=" * 80)
        print("MULTI-MODEL GENERAL METRICS COMPARISON SUMMARY")
        print("=" * 80)
        
        # Overall winner analysis
        overall_scores = {}
        for model_name, data in self.models_data.items():
            overall_scores[model_name] = {
                'clip_score': data['best_clip_score'].mean(),
                'aesthetic_score': data['best_aesthetic'].mean(),
                'clip_std': data['best_clip_score'].std(),
                'aesthetic_std': data['best_aesthetic'].std()
            }
        
        print(f"\n🏆 OVERALL PERFORMANCE RANKING:")
        # Rank by CLIP score
        clip_ranking = sorted(overall_scores.items(), key=lambda x: x[1]['clip_score'], reverse=True)
        for rank, (model, scores) in enumerate(clip_ranking, 1):
            print(f"{rank}. {model.upper()}: CLIP={scores['clip_score']:.2f}±{scores['clip_std']:.2f}, Aesthetic={scores['aesthetic_score']:.2f}±{scores['aesthetic_std']:.2f}")
        
        print(f"\n📊 DETAILED COMPARISON:")
        best_clip_model = max(overall_scores.items(), key=lambda x: x[1]['clip_score'])
        worst_clip_model = min(overall_scores.items(), key=lambda x: x[1]['clip_score'])
        best_aesthetic_model = max(overall_scores.items(), key=lambda x: x[1]['aesthetic_score'])
        worst_aesthetic_model = min(overall_scores.items(), key=lambda x: x[1]['aesthetic_score'])
        
        print(f"- CLIP SCORE: Best={best_clip_model[0]} ({best_clip_model[1]['clip_score']:.2f}), Worst={worst_clip_model[0]} ({worst_clip_model[1]['clip_score']:.2f})")
        print(f"- AESTHETIC SCORE: Best={best_aesthetic_model[0]} ({best_aesthetic_model[1]['aesthetic_score']:.2f}), Worst={worst_aesthetic_model[0]} ({worst_aesthetic_model[1]['aesthetic_score']:.2f})")
        
        print(f"\n🎯 RECOMMENDATIONS:")
        best_overall = clip_ranking[0][0]
        print(f"- Overall Best Model: {best_overall.upper()}")
        
        if len(clip_ranking) > 1:
            gap = clip_ranking[0][1]['clip_score'] - clip_ranking[1][1]['clip_score']
            if gap < 1.0:
                print(f"- Performance gap is small ({gap:.2f}), both models are competitive")
            else:
                print(f"- Clear performance leader with {gap:.2f} CLIP score advantage")
        
        print(f"\n" + "=" * 80)

def main():
    """Main function to run multi-model general comparison"""
    # Define model configurations
    base_path = os.path.join(SCRIPT_DIR, '..', 'output')
    
    model_configs = {
        'flux': {
            'general_summary_path': os.path.join(base_path, 'flux', 'general_metrics_summary.csv')
        },
        'hidream': {
            'general_summary_path': os.path.join(base_path, 'hidream', 'general_metrics_summary.csv')
        },
        'qwen': {
            'general_summary_path': os.path.join(base_path, 'qwen', 'general_metrics_summary.csv')
        },
        'sd35': {
            'general_summary_path': os.path.join(base_path, 'sd35', 'general_metrics_summary.csv')
        }
    }
    
    # Check if files exist
    for model_name, config in model_configs.items():
        for file_type, file_path in config.items():
            if not os.path.exists(file_path):
                print(f"❌ Error: {file_type} for {model_name} not found at {file_path}")
                return
    
    # Initialize analyzer
    analyzer = MultiModelGeneralAnalyzer(model_configs)
    
    # Run all analyses
    analyzer.analyze_overall_comparison()
    analyzer.compare_country_performance()
    analyzer.compare_step_performance()
    analyzer.identify_model_strengths_weaknesses()
    analyzer.generate_all_visualizations()
    analyzer.generate_comparison_report()

if __name__ == "__main__":
    main()

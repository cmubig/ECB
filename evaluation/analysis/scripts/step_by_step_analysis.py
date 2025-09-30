#!/usr/bin/env python3
"""
Step-by-Step Analysis - Comprehensive analysis of model performance across different steps
Focus on how each model performs at different generation steps and identify optimal steps.
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

# Get the directory where the script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_CHARTS_DIR = os.path.join(SCRIPT_DIR, '..', 'results', 'comparison', 'step_by_step_analysis')

class StepByStepAnalyzer:
    def __init__(self, model_configs):
        """
        Initialize the step-by-step analyzer
        
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
            'step_performance': os.path.join(BASE_CHARTS_DIR, '01_step_performance'),
            'step_comparison': os.path.join(BASE_CHARTS_DIR, '02_step_comparison'),
            'optimal_steps': os.path.join(BASE_CHARTS_DIR, '03_optimal_steps'),
            'step_heatmaps': os.path.join(BASE_CHARTS_DIR, '04_step_heatmaps'),
            'step_insights': os.path.join(BASE_CHARTS_DIR, '05_step_insights')
        }
        
        # Create all directories
        for folder_path in self.folders.values():
            os.makedirs(folder_path, exist_ok=True)
            
    def _load_all_models_data(self):
        """Load data for all models"""
        for model_name, config in self.model_configs.items():
            try:
                # Load cultural data
                cultural_detailed_df = pd.read_csv(config['cultural_metrics_path'])
                cultural_summary_df = pd.read_csv(config['cultural_summary_path'])
                
                # Load general data
                general_summary_df = pd.read_csv(config['general_summary_path'])
                
                # Clean and prepare cultural data
                cultural_summary_df = cultural_summary_df.dropna(subset=['country', 'category', 'variant'])
                cultural_summary_df['country'] = cultural_summary_df['country'].str.title()
                cultural_summary_df['variant'] = cultural_summary_df['variant'].fillna('general')
                cultural_summary_df['step_num'] = cultural_summary_df['step'].str.extract('(\d+)').fillna('-1').astype(int)
                cultural_summary_df['model'] = model_name
                
                # Clean and prepare general data
                general_summary_df['country'] = general_summary_df['prompt'].apply(self._extract_country)
                general_summary_df['category'] = general_summary_df['prompt'].apply(self._extract_category)
                general_summary_df['variant'] = general_summary_df['prompt'].apply(self._extract_variant)
                general_summary_df['model'] = model_name
                
                # Clean step information for general data
                general_summary_df['best_clip_step_clean'] = general_summary_df['best_step_by_clip'].str.replace('_path', '')
                general_summary_df['best_aesthetic_step_clean'] = general_summary_df['best_step_by_aesthetic'].str.replace('_path', '')
                general_summary_df['best_clip_step_num'] = general_summary_df['best_clip_step_clean'].str.extract('(\d+)').fillna('0').astype(int)
                general_summary_df['best_aesthetic_step_num'] = general_summary_df['best_aesthetic_step_clean'].str.extract('(\d+)').fillna('0').astype(int)
                
                self.models_data[model_name] = {
                    'cultural_detailed': cultural_detailed_df,
                    'cultural_summary': cultural_summary_df,
                    'general_summary': general_summary_df
                }
                
                print(f"✅ Loaded {model_name}: Cultural={len(cultural_summary_df)}, General={len(general_summary_df)}")
                
            except Exception as e:
                print(f"❌ Error loading {model_name}: {e}")
                
        # Combine all data for comparison
        if self.models_data:
            self.combined_cultural = pd.concat([data['cultural_summary'] for data in self.models_data.values()], 
                                             ignore_index=True)
            self.combined_general = pd.concat([data['general_summary'] for data in self.models_data.values()], 
                                           ignore_index=True)
            print(f"📊 Combined dataset: Cultural={len(self.combined_cultural)}, General={len(self.combined_general)}")
    
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
    
    def create_step_performance_analysis(self):
        """Create comprehensive step performance analysis"""
        print(f"\n📈 Generating Step Performance Analysis...")
        
        # 1. Cultural Metrics by Step
        fig, axes = plt.subplots(2, 2, figsize=(20, 16))
        fig.suptitle('Step-by-Step Performance Analysis: Cultural Metrics', fontsize=18, fontweight='bold')
        
        # F1 Score by Step for each model
        for model_name, data in self.models_data.items():
            cultural_data = data['cultural_summary']
            step_data = cultural_data[cultural_data['step_num'] >= 0].groupby('step_num')['f1'].mean()
            axes[0, 0].plot(step_data.index, step_data.values, 'o-', label=model_name, linewidth=2, markersize=6)
        axes[0, 0].set_title('F1 Score by Step', fontsize=14, fontweight='bold')
        axes[0, 0].set_xlabel('Step Number')
        axes[0, 0].set_ylabel('F1 Score')
        axes[0, 0].legend()
        axes[0, 0].grid(True, alpha=0.3)
        
        # Cultural Representative by Step for each model
        for model_name, data in self.models_data.items():
            cultural_data = data['cultural_summary']
            step_data = cultural_data[cultural_data['step_num'] >= 0].groupby('step_num')['cultural_representative'].mean()
            axes[0, 1].plot(step_data.index, step_data.values, 'o-', label=model_name, linewidth=2, markersize=6)
        axes[0, 1].set_title('Cultural Representative Score by Step', fontsize=14, fontweight='bold')
        axes[0, 1].set_xlabel('Step Number')
        axes[0, 1].set_ylabel('Cultural Representative Score')
        axes[0, 1].legend()
        axes[0, 1].grid(True, alpha=0.3)
        
        # Accuracy by Step for each model
        for model_name, data in self.models_data.items():
            cultural_data = data['cultural_summary']
            step_data = cultural_data[cultural_data['step_num'] >= 0].groupby('step_num')['accuracy'].mean()
            axes[1, 0].plot(step_data.index, step_data.values, 'o-', label=model_name, linewidth=2, markersize=6)
        axes[1, 0].set_title('Accuracy by Step', fontsize=14, fontweight='bold')
        axes[1, 0].set_xlabel('Step Number')
        axes[1, 0].set_ylabel('Accuracy')
        axes[1, 0].legend()
        axes[1, 0].grid(True, alpha=0.3)
        
        # Prompt Alignment by Step for each model
        for model_name, data in self.models_data.items():
            cultural_data = data['cultural_summary']
            step_data = cultural_data[cultural_data['step_num'] >= 0].groupby('step_num')['prompt_alignment'].mean()
            axes[1, 1].plot(step_data.index, step_data.values, 'o-', label=model_name, linewidth=2, markersize=6)
        axes[1, 1].set_title('Prompt Alignment by Step', fontsize=14, fontweight='bold')
        axes[1, 1].set_xlabel('Step Number')
        axes[1, 1].set_ylabel('Prompt Alignment')
        axes[1, 1].legend()
        axes[1, 1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['step_performance'], "cultural_metrics_by_step.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
        # 2. General Metrics by Step
        fig, axes = plt.subplots(1, 2, figsize=(16, 8))
        fig.suptitle('Step-by-Step Performance Analysis: General Metrics', fontsize=18, fontweight='bold')
        
        # CLIP Score by Step for each model
        for model_name, data in self.models_data.items():
            general_data = data['general_summary']
            step_data = general_data.groupby('best_clip_step_num')['best_clip_score'].mean()
            axes[0].plot(step_data.index, step_data.values, 'o-', label=model_name, linewidth=2, markersize=6)
        axes[0].set_title('CLIP Score by Step', fontsize=14, fontweight='bold')
        axes[0].set_xlabel('Step Number')
        axes[0].set_ylabel('CLIP Score')
        axes[0].legend()
        axes[0].grid(True, alpha=0.3)
        
        # Aesthetic Score by Step for each model
        for model_name, data in self.models_data.items():
            general_data = data['general_summary']
            step_data = general_data.groupby('best_aesthetic_step_num')['best_aesthetic'].mean()
            axes[1].plot(step_data.index, step_data.values, 'o-', label=model_name, linewidth=2, markersize=6)
        axes[1].set_title('Aesthetic Score by Step', fontsize=14, fontweight='bold')
        axes[1].set_xlabel('Step Number')
        axes[1].set_ylabel('Aesthetic Score')
        axes[1].legend()
        axes[1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['step_performance'], "general_metrics_by_step.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
    
    def create_step_comparison(self):
        """Create step comparison analysis"""
        print(f"\n🔄 Generating Step Comparison Analysis...")
        
        # 1. Model Performance by Step - Heatmap
        fig, axes = plt.subplots(2, 2, figsize=(20, 16))
        fig.suptitle('Model Performance by Step: Comprehensive Comparison', fontsize=18, fontweight='bold')
        
        # F1 Score Heatmap
        f1_pivot = self.combined_cultural[self.combined_cultural['step_num'] >= 0].pivot_table(
            values='f1', 
            index='model', 
            columns='step_num', 
            aggfunc='mean'
        )
        sns.heatmap(f1_pivot, annot=True, fmt='.3f', cmap='Blues', 
                   ax=axes[0, 0], cbar_kws={'label': 'F1 Score'})
        axes[0, 0].set_title('F1 Score by Model & Step', fontsize=14, fontweight='bold')
        axes[0, 0].set_xlabel('Step Number')
        axes[0, 0].set_ylabel('Model')
        
        # Cultural Representative Heatmap
        cultural_rep_pivot = self.combined_cultural[self.combined_cultural['step_num'] >= 0].pivot_table(
            values='cultural_representative', 
            index='model', 
            columns='step_num', 
            aggfunc='mean'
        )
        sns.heatmap(cultural_rep_pivot, annot=True, fmt='.2f', cmap='RdYlGn', 
                   ax=axes[0, 1], cbar_kws={'label': 'Cultural Rep Score'})
        axes[0, 1].set_title('Cultural Representative by Model & Step', fontsize=14, fontweight='bold')
        axes[0, 1].set_xlabel('Step Number')
        axes[0, 1].set_ylabel('Model')
        
        # CLIP Score Heatmap
        clip_pivot = self.combined_general.pivot_table(
            values='best_clip_score', 
            index='model', 
            columns='best_clip_step_num', 
            aggfunc='mean'
        )
        sns.heatmap(clip_pivot, annot=True, fmt='.1f', cmap='Purples', 
                   ax=axes[1, 0], cbar_kws={'label': 'CLIP Score'})
        axes[1, 0].set_title('CLIP Score by Model & Step', fontsize=14, fontweight='bold')
        axes[1, 0].set_xlabel('Step Number')
        axes[1, 0].set_ylabel('Model')
        
        # Aesthetic Score Heatmap
        aesthetic_pivot = self.combined_general.pivot_table(
            values='best_aesthetic', 
            index='model', 
            columns='best_aesthetic_step_num', 
            aggfunc='mean'
        )
        sns.heatmap(aesthetic_pivot, annot=True, fmt='.2f', cmap='Oranges', 
                   ax=axes[1, 1], cbar_kws={'label': 'Aesthetic Score'})
        axes[1, 1].set_title('Aesthetic Score by Model & Step', fontsize=14, fontweight='bold')
        axes[1, 1].set_xlabel('Step Number')
        axes[1, 1].set_ylabel('Model')
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['step_comparison'], "model_step_comparison.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
    
    def create_optimal_steps_analysis(self):
        """Create optimal steps analysis"""
        print(f"\n🎯 Generating Optimal Steps Analysis...")
        
        # 1. Optimal Steps by Model and Country
        fig, axes = plt.subplots(2, 2, figsize=(20, 16))
        fig.suptitle('Optimal Steps Analysis: Best Performance by Model & Country', fontsize=18, fontweight='bold')
        
        # Best F1 Step by Model & Country
        best_f1_steps = self.combined_cultural[self.combined_cultural['step_num'] >= 0].groupby(['model', 'country'])['f1'].idxmax()
        best_f1_data = self.combined_cultural.loc[best_f1_steps, ['model', 'country', 'step_num', 'f1']]
        best_f1_pivot = best_f1_data.pivot_table(values='step_num', index='country', columns='model', aggfunc='mean')
        
        sns.heatmap(best_f1_pivot, annot=True, fmt='.0f', cmap='Blues', 
                   ax=axes[0, 0], cbar_kws={'label': 'Best F1 Step'})
        axes[0, 0].set_title('Best F1 Step by Model & Country', fontsize=14, fontweight='bold')
        axes[0, 0].set_xlabel('Model')
        axes[0, 0].set_ylabel('Country')
        
        # Best Cultural Rep Step by Model & Country
        best_cultural_rep_steps = self.combined_cultural[self.combined_cultural['step_num'] >= 0].groupby(['model', 'country'])['cultural_representative'].idxmax()
        best_cultural_rep_data = self.combined_cultural.loc[best_cultural_rep_steps, ['model', 'country', 'step_num', 'cultural_representative']]
        best_cultural_rep_pivot = best_cultural_rep_data.pivot_table(values='step_num', index='country', columns='model', aggfunc='mean')
        
        sns.heatmap(best_cultural_rep_pivot, annot=True, fmt='.0f', cmap='RdYlGn', 
                   ax=axes[0, 1], cbar_kws={'label': 'Best Cultural Rep Step'})
        axes[0, 1].set_title('Best Cultural Rep Step by Model & Country', fontsize=14, fontweight='bold')
        axes[0, 1].set_xlabel('Model')
        axes[0, 1].set_ylabel('Country')
        
        # Best CLIP Step by Model & Country
        best_clip_steps = self.combined_general.groupby(['model', 'country'])['best_clip_score'].idxmax()
        best_clip_data = self.combined_general.loc[best_clip_steps, ['model', 'country', 'best_clip_step_num', 'best_clip_score']]
        best_clip_pivot = best_clip_data.pivot_table(values='best_clip_step_num', index='country', columns='model', aggfunc='mean')
        
        sns.heatmap(best_clip_pivot, annot=True, fmt='.0f', cmap='Purples', 
                   ax=axes[1, 0], cbar_kws={'label': 'Best CLIP Step'})
        axes[1, 0].set_title('Best CLIP Step by Model & Country', fontsize=14, fontweight='bold')
        axes[1, 0].set_xlabel('Model')
        axes[1, 0].set_ylabel('Country')
        
        # Best Aesthetic Step by Model & Country
        best_aesthetic_steps = self.combined_general.groupby(['model', 'country'])['best_aesthetic'].idxmax()
        best_aesthetic_data = self.combined_general.loc[best_aesthetic_steps, ['model', 'country', 'best_aesthetic_step_num', 'best_aesthetic']]
        best_aesthetic_pivot = best_aesthetic_data.pivot_table(values='best_aesthetic_step_num', index='country', columns='model', aggfunc='mean')
        
        sns.heatmap(best_aesthetic_pivot, annot=True, fmt='.0f', cmap='Oranges', 
                   ax=axes[1, 1], cbar_kws={'label': 'Best Aesthetic Step'})
        axes[1, 1].set_title('Best Aesthetic Step by Model & Country', fontsize=14, fontweight='bold')
        axes[1, 1].set_xlabel('Model')
        axes[1, 1].set_ylabel('Country')
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['optimal_steps'], "optimal_steps_analysis.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
    
    def create_step_heatmaps(self):
        """Create detailed step heatmaps"""
        print(f"\n🔥 Generating Detailed Step Heatmaps...")
        
        # 1. Step Performance by Country and Category
        fig, axes = plt.subplots(2, 2, figsize=(24, 20))
        fig.suptitle('Step Performance by Country and Category: Detailed Analysis', fontsize=20, fontweight='bold')
        
        # F1 Score by Country & Step
        f1_country_step = self.combined_cultural[self.combined_cultural['step_num'] >= 0].pivot_table(
            values='f1', 
            index='country', 
            columns='step_num', 
            aggfunc='mean'
        )
        sns.heatmap(f1_country_step, annot=True, fmt='.3f', cmap='Blues', 
                   ax=axes[0, 0], cbar_kws={'label': 'F1 Score'})
        axes[0, 0].set_title('F1 Score by Country & Step', fontsize=14, fontweight='bold')
        axes[0, 0].set_xlabel('Step Number')
        axes[0, 0].set_ylabel('Country')
        
        # Cultural Rep by Country & Step
        cultural_rep_country_step = self.combined_cultural[self.combined_cultural['step_num'] >= 0].pivot_table(
            values='cultural_representative', 
            index='country', 
            columns='step_num', 
            aggfunc='mean'
        )
        sns.heatmap(cultural_rep_country_step, annot=True, fmt='.2f', cmap='RdYlGn', 
                   ax=axes[0, 1], cbar_kws={'label': 'Cultural Rep Score'})
        axes[0, 1].set_title('Cultural Rep by Country & Step', fontsize=14, fontweight='bold')
        axes[0, 1].set_xlabel('Step Number')
        axes[0, 1].set_ylabel('Country')
        
        # F1 Score by Category & Step
        f1_category_step = self.combined_cultural[self.combined_cultural['step_num'] >= 0].pivot_table(
            values='f1', 
            index='category', 
            columns='step_num', 
            aggfunc='mean'
        )
        sns.heatmap(f1_category_step, annot=True, fmt='.3f', cmap='Greens', 
                   ax=axes[1, 0], cbar_kws={'label': 'F1 Score'})
        axes[1, 0].set_title('F1 Score by Category & Step', fontsize=14, fontweight='bold')
        axes[1, 0].set_xlabel('Step Number')
        axes[1, 0].set_ylabel('Category')
        
        # Cultural Rep by Category & Step
        cultural_rep_category_step = self.combined_cultural[self.combined_cultural['step_num'] >= 0].pivot_table(
            values='cultural_representative', 
            index='category', 
            columns='step_num', 
            aggfunc='mean'
        )
        sns.heatmap(cultural_rep_category_step, annot=True, fmt='.2f', cmap='Oranges', 
                   ax=axes[1, 1], cbar_kws={'label': 'Cultural Rep Score'})
        axes[1, 1].set_title('Cultural Rep by Category & Step', fontsize=14, fontweight='bold')
        axes[1, 1].set_xlabel('Step Number')
        axes[1, 1].set_ylabel('Category')
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['step_heatmaps'], "detailed_step_heatmaps.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
    
    def create_step_insights(self):
        """Create step insights and summary"""
        print(f"\n💡 Generating Step Insights...")
        
        # 1. Step Performance Summary
        step_summary = []
        
        for model_name, data in self.models_data.items():
            cultural_data = data['cultural_summary']
            general_data = data['general_summary']
            
            # Find best steps for each metric
            cultural_steps = cultural_data[cultural_data['step_num'] >= 0]
            if not cultural_steps.empty:
                best_f1_step = cultural_steps.loc[cultural_steps['f1'].idxmax(), 'step_num']
                best_cultural_rep_step = cultural_steps.loc[cultural_steps['cultural_representative'].idxmax(), 'step_num']
                best_f1_score = cultural_steps['f1'].max()
                best_cultural_rep_score = cultural_steps['cultural_representative'].max()
            else:
                best_f1_step = best_cultural_rep_step = 0
                best_f1_score = best_cultural_rep_score = 0
            
            # General metrics
            best_clip_step = general_data.loc[general_data['best_clip_score'].idxmax(), 'best_clip_step_num']
            best_aesthetic_step = general_data.loc[general_data['best_aesthetic'].idxmax(), 'best_aesthetic_step_num']
            best_clip_score = general_data['best_clip_score'].max()
            best_aesthetic_score = general_data['best_aesthetic'].max()
            
            step_summary.append({
                'Model': model_name.upper(),
                'Best F1 Step': int(best_f1_step),
                'Best F1 Score': f'{best_f1_score:.3f}',
                'Best Cultural Rep Step': int(best_cultural_rep_step),
                'Best Cultural Rep Score': f'{best_cultural_rep_score:.2f}',
                'Best CLIP Step': int(best_clip_step),
                'Best CLIP Score': f'{best_clip_score:.1f}',
                'Best Aesthetic Step': int(best_aesthetic_step),
                'Best Aesthetic Score': f'{best_aesthetic_score:.2f}'
            })
        
        # Create step summary table
        step_summary_df = pd.DataFrame(step_summary)
        
        # Save as CSV
        csv_path = os.path.join(self.folders['step_insights'], "step_performance_summary.csv")
        step_summary_df.to_csv(csv_path, index=False)
        print(f"  ✅ {csv_path}")
        
        # Create visual table
        fig, ax = plt.subplots(figsize=(24, 10))
        ax.axis('tight')
        ax.axis('off')
        
        # Create table
        table_data = []
        for _, row in step_summary_df.iterrows():
            table_data.append([
                row['Model'],
                f"Step {row['Best F1 Step']} ({row['Best F1 Score']})",
                f"Step {row['Best Cultural Rep Step']} ({row['Best Cultural Rep Score']})",
                f"Step {row['Best CLIP Step']} ({row['Best CLIP Score']})",
                f"Step {row['Best Aesthetic Step']} ({row['Best Aesthetic Score']})"
            ])
        
        table = ax.table(cellText=table_data,
                        colLabels=['Model', 'Best F1 Step (Score)', 'Best Cultural Rep Step (Score)', 
                                  'Best CLIP Step (Score)', 'Best Aesthetic Step (Score)'],
                        cellLoc='center',
                        loc='center',
                        bbox=[0, 0, 1, 1])
        
        table.auto_set_font_size(False)
        table.set_fontsize(10)
        table.scale(1, 2)
        
        # Style the table
        for i in range(len(table_data) + 1):
            for j in range(5):
                cell = table[(i, j)]
                if i == 0:  # Header
                    cell.set_facecolor('#4CAF50')
                    cell.set_text_props(weight='bold', color='white')
                else:
                    if i % 2 == 0:
                        cell.set_facecolor('#f0f0f0')
                    else:
                        cell.set_facecolor('white')
        
        plt.title('Optimal Steps Summary: Best Performance by Model', fontsize=16, fontweight='bold', pad=20)
        save_path = os.path.join(self.folders['step_insights'], "optimal_steps_summary.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
    
    def generate_all_visualizations(self):
        """Generate all step-by-step visualizations"""
        print(f"\n🎨 Starting Step-by-Step Analysis...")
        print(f"📁 Charts will be saved to: {BASE_CHARTS_DIR}")
        
        self.create_step_performance_analysis()
        self.create_step_comparison()
        self.create_optimal_steps_analysis()
        self.create_step_heatmaps()
        self.create_step_insights()
        
        print(f"\n✅ All step-by-step visualizations generated successfully!")
        print(f"📊 Check the organized folders in: {BASE_CHARTS_DIR}")
    
    def generate_step_report(self):
        """Generate comprehensive step analysis report"""
        print(f"\n" + "=" * 100)
        print("STEP-BY-STEP PERFORMANCE ANALYSIS REPORT")
        print("=" * 100)
        
        # Calculate step performance for each model
        step_analysis = {}
        
        for model_name, data in self.models_data.items():
            cultural_data = data['cultural_summary']
            general_data = data['general_summary']
            
            # Cultural metrics by step
            cultural_steps = cultural_data[cultural_data['step_num'] >= 0]
            if not cultural_steps.empty:
                step_f1 = cultural_steps.groupby('step_num')['f1'].mean()
                step_cultural_rep = cultural_steps.groupby('step_num')['cultural_representative'].mean()
                
                # Find optimal steps
                optimal_f1_step = step_f1.idxmax()
                optimal_cultural_rep_step = step_cultural_rep.idxmax()
                max_f1 = step_f1.max()
                max_cultural_rep = step_cultural_rep.max()
            else:
                optimal_f1_step = optimal_cultural_rep_step = 0
                max_f1 = max_cultural_rep = 0
            
            # General metrics
            step_clip = general_data.groupby('best_clip_step_num')['best_clip_score'].mean()
            step_aesthetic = general_data.groupby('best_aesthetic_step_num')['best_aesthetic'].mean()
            
            optimal_clip_step = step_clip.idxmax()
            optimal_aesthetic_step = step_aesthetic.idxmax()
            max_clip = step_clip.max()
            max_aesthetic = step_aesthetic.max()
            
            step_analysis[model_name] = {
                'optimal_f1_step': optimal_f1_step,
                'max_f1': max_f1,
                'optimal_cultural_rep_step': optimal_cultural_rep_step,
                'max_cultural_rep': max_cultural_rep,
                'optimal_clip_step': optimal_clip_step,
                'max_clip': max_clip,
                'optimal_aesthetic_step': optimal_aesthetic_step,
                'max_aesthetic': max_aesthetic
            }
        
        print(f"\n🎯 OPTIMAL STEPS BY MODEL:")
        print(f"{'Model':<10} {'Best F1':<15} {'Best Cultural Rep':<20} {'Best CLIP':<15} {'Best Aesthetic':<18}")
        print("-" * 90)
        
        for model_name, analysis in step_analysis.items():
            print(f"{model_name.upper():<10} "
                  f"Step {analysis['optimal_f1_step']} ({analysis['max_f1']:.3f}){'':<5} "
                  f"Step {analysis['optimal_cultural_rep_step']} ({analysis['max_cultural_rep']:.2f}){'':<5} "
                  f"Step {analysis['optimal_clip_step']} ({analysis['max_clip']:.1f}){'':<5} "
                  f"Step {analysis['optimal_aesthetic_step']} ({analysis['max_aesthetic']:.2f})")
        
        # Find patterns
        print(f"\n🔍 KEY PATTERNS:")
        
        # Most common optimal steps
        f1_steps = [analysis['optimal_f1_step'] for analysis in step_analysis.values()]
        cultural_rep_steps = [analysis['optimal_cultural_rep_step'] for analysis in step_analysis.values()]
        clip_steps = [analysis['optimal_clip_step'] for analysis in step_analysis.values()]
        aesthetic_steps = [analysis['optimal_aesthetic_step'] for analysis in step_analysis.values()]
        
        from collections import Counter
        
        print(f"- Most common optimal F1 step: {Counter(f1_steps).most_common(1)[0][0]} (appears {Counter(f1_steps).most_common(1)[0][1]} times)")
        print(f"- Most common optimal Cultural Rep step: {Counter(cultural_rep_steps).most_common(1)[0][0]} (appears {Counter(cultural_rep_steps).most_common(1)[0][1]} times)")
        print(f"- Most common optimal CLIP step: {Counter(clip_steps).most_common(1)[0][0]} (appears {Counter(clip_steps).most_common(1)[0][1]} times)")
        print(f"- Most common optimal Aesthetic step: {Counter(aesthetic_steps).most_common(1)[0][0]} (appears {Counter(aesthetic_steps).most_common(1)[0][1]} times)")
        
        # Best performing models
        best_f1_model = max(step_analysis.items(), key=lambda x: x[1]['max_f1'])
        best_cultural_rep_model = max(step_analysis.items(), key=lambda x: x[1]['max_cultural_rep'])
        best_clip_model = max(step_analysis.items(), key=lambda x: x[1]['max_clip'])
        best_aesthetic_model = max(step_analysis.items(), key=lambda x: x[1]['max_aesthetic'])
        
        print(f"\n🏆 BEST PERFORMING MODELS:")
        print(f"- Best F1 Score: {best_f1_model[0].upper()} at Step {best_f1_model[1]['optimal_f1_step']} ({best_f1_model[1]['max_f1']:.3f})")
        print(f"- Best Cultural Rep: {best_cultural_rep_model[0].upper()} at Step {best_cultural_rep_model[1]['optimal_cultural_rep_step']} ({best_cultural_rep_model[1]['max_cultural_rep']:.2f})")
        print(f"- Best CLIP Score: {best_clip_model[0].upper()} at Step {best_clip_model[1]['optimal_clip_step']} ({best_clip_model[1]['max_clip']:.1f})")
        print(f"- Best Aesthetic Score: {best_aesthetic_model[0].upper()} at Step {best_aesthetic_model[1]['optimal_aesthetic_step']} ({best_aesthetic_model[1]['max_aesthetic']:.2f})")
        
        print(f"\n" + "=" * 100)

def main():
    """Main function to run step-by-step analysis"""
    # Define model configurations
    base_path = '/Users/chan/ECB/evaluation/output'
    
    model_configs = {
        'flux': {
            'cultural_metrics_path': os.path.join(base_path, 'flux', 'cultural_metrics.csv'),
            'cultural_summary_path': os.path.join(base_path, 'flux', 'cultural_metrics_summary.csv'),
            'general_summary_path': os.path.join(base_path, 'flux', 'general_metrics_summary.csv')
        },
        'hidream': {
            'cultural_metrics_path': os.path.join(base_path, 'hidream', 'cultural_metrics.csv'),
            'cultural_summary_path': os.path.join(base_path, 'hidream', 'cultural_metrics_summary.csv'),
            'general_summary_path': os.path.join(base_path, 'hidream', 'general_metrics_summary.csv')
        },
        'nextstep': {
            'cultural_metrics_path': os.path.join(base_path, 'nextstep', 'cultural_metrics.csv'),
            'cultural_summary_path': os.path.join(base_path, 'nextstep', 'cultural_metrics_summary.csv'),
            'general_summary_path': os.path.join(base_path, 'nextstep', 'general_metrics_summary.csv')
        },
        'qwen': {
            'cultural_metrics_path': os.path.join(base_path, 'qwen', 'cultural_metrics.csv'),
            'cultural_summary_path': os.path.join(base_path, 'qwen', 'cultural_metrics_summary.csv'),
            'general_summary_path': os.path.join(base_path, 'qwen', 'general_metrics_summary.csv')
        },
        'sd35': {
            'cultural_metrics_path': os.path.join(base_path, 'sd35', 'cultural_metrics.csv'),
            'cultural_summary_path': os.path.join(base_path, 'sd35', 'cultural_metrics_summary.csv'),
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
    analyzer = StepByStepAnalyzer(model_configs)
    
    # Run all analyses
    analyzer.generate_all_visualizations()
    analyzer.generate_step_report()

if __name__ == "__main__":
    main()

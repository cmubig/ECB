#!/usr/bin/env python3
"""
Comprehensive Model Analysis - Detailed comparison of model performance
across countries with specific focus on Best/Worst, Representative, Cultural, Aesthetic, and CLIP scores.
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
BASE_CHARTS_DIR = os.path.join(SCRIPT_DIR, '..', 'results', 'comparison', 'comprehensive_model_analysis')

class ComprehensiveModelAnalyzer:
    def __init__(self, model_configs):
        """
        Initialize the comprehensive analyzer
        
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
            'model_country_performance': os.path.join(BASE_CHARTS_DIR, '01_model_country_performance'),
            'scoring_comparison': os.path.join(BASE_CHARTS_DIR, '02_scoring_comparison'),
            'best_worst_analysis': os.path.join(BASE_CHARTS_DIR, '03_best_worst_analysis'),
            'detailed_heatmaps': os.path.join(BASE_CHARTS_DIR, '04_detailed_heatmaps'),
            'performance_tables': os.path.join(BASE_CHARTS_DIR, '05_performance_tables')
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
    
    def create_model_country_performance(self):
        """Create detailed model-country performance analysis"""
        print(f"\n🌍 Generating Model-Country Performance Analysis...")
        
        # 1. Model Performance by Country - All Metrics
        fig, axes = plt.subplots(2, 3, figsize=(24, 16))
        fig.suptitle('Model Performance by Country: Comprehensive Metrics Analysis', fontsize=18, fontweight='bold')
        
        # Cultural Representative Score by Model & Country
        cultural_rep_pivot = self.combined_cultural.pivot_table(
            values='cultural_representative', 
            index='country', 
            columns='model', 
            aggfunc='mean'
        )
        sns.heatmap(cultural_rep_pivot, annot=True, fmt='.2f', cmap='RdYlGn', 
                   ax=axes[0, 0], cbar_kws={'label': 'Cultural Rep Score'})
        axes[0, 0].set_title('Cultural Representative Score\nby Model & Country', fontsize=14, fontweight='bold')
        axes[0, 0].set_xlabel('Model')
        axes[0, 0].set_ylabel('Country')
        
        # F1 Score by Model & Country
        f1_pivot = self.combined_cultural.pivot_table(
            values='f1', 
            index='country', 
            columns='model', 
            aggfunc='mean'
        )
        sns.heatmap(f1_pivot, annot=True, fmt='.3f', cmap='Blues', 
                   ax=axes[0, 1], cbar_kws={'label': 'F1 Score'})
        axes[0, 1].set_title('F1 Score\nby Model & Country', fontsize=14, fontweight='bold')
        axes[0, 1].set_xlabel('Model')
        axes[0, 1].set_ylabel('Country')
        
        # CLIP Score by Model & Country
        clip_pivot = self.combined_general.pivot_table(
            values='best_clip_score', 
            index='country', 
            columns='model', 
            aggfunc='mean'
        )
        sns.heatmap(clip_pivot, annot=True, fmt='.1f', cmap='Purples', 
                   ax=axes[0, 2], cbar_kws={'label': 'CLIP Score'})
        axes[0, 2].set_title('CLIP Score\nby Model & Country', fontsize=14, fontweight='bold')
        axes[0, 2].set_xlabel('Model')
        axes[0, 2].set_ylabel('Country')
        
        # Aesthetic Score by Model & Country
        aesthetic_pivot = self.combined_general.pivot_table(
            values='best_aesthetic', 
            index='country', 
            columns='model', 
            aggfunc='mean'
        )
        sns.heatmap(aesthetic_pivot, annot=True, fmt='.2f', cmap='Oranges', 
                   ax=axes[1, 0], cbar_kws={'label': 'Aesthetic Score'})
        axes[1, 0].set_title('Aesthetic Score\nby Model & Country', fontsize=14, fontweight='bold')
        axes[1, 0].set_xlabel('Model')
        axes[1, 0].set_ylabel('Country')
        
        # Best Images Percentage by Model & Country
        best_pivot = self.combined_cultural.pivot_table(
            values='is_best', 
            index='country', 
            columns='model', 
            aggfunc='mean'
        ) * 100
        sns.heatmap(best_pivot, annot=True, fmt='.1f', cmap='Greens', 
                   ax=axes[1, 1], cbar_kws={'label': 'Best Images (%)'})
        axes[1, 1].set_title('Best Images Percentage\nby Model & Country', fontsize=14, fontweight='bold')
        axes[1, 1].set_xlabel('Model')
        axes[1, 1].set_ylabel('Country')
        
        # Worst Images Percentage by Model & Country
        worst_pivot = self.combined_cultural.pivot_table(
            values='is_worst', 
            index='country', 
            columns='model', 
            aggfunc='mean'
        ) * 100
        sns.heatmap(worst_pivot, annot=True, fmt='.1f', cmap='Reds', 
                   ax=axes[1, 2], cbar_kws={'label': 'Worst Images (%)'})
        axes[1, 2].set_title('Worst Images Percentage\nby Model & Country', fontsize=14, fontweight='bold')
        axes[1, 2].set_xlabel('Model')
        axes[1, 2].set_ylabel('Country')
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['model_country_performance'], "comprehensive_model_country_performance.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
    
    def create_scoring_comparison(self):
        """Create detailed scoring comparison charts"""
        print(f"\n📊 Generating Scoring Comparison Analysis...")
        
        # 1. Model Performance Ranking
        fig, axes = plt.subplots(2, 2, figsize=(20, 16))
        fig.suptitle('Model Performance Ranking: All Key Metrics', fontsize=18, fontweight='bold')
        
        # Calculate average scores for each model
        model_scores = {}
        for model_name, data in self.models_data.items():
            cultural_data = data['cultural_summary']
            general_data = data['general_summary']
            
            model_scores[model_name] = {
                'Cultural Rep': cultural_data['cultural_representative'].mean(),
                'F1 Score': cultural_data['f1'].mean(),
                'CLIP Score': general_data['best_clip_score'].mean(),
                'Aesthetic Score': general_data['best_aesthetic'].mean(),
                'Best Images %': cultural_data['is_best'].mean() * 100,
                'Worst Images %': cultural_data['is_worst'].mean() * 100
            }
        
        # Create ranking dataframe
        ranking_df = pd.DataFrame(model_scores).T
        
        # Cultural Representative Score Ranking
        cultural_rep_ranking = ranking_df.sort_values('Cultural Rep', ascending=False)
        axes[0, 0].barh(cultural_rep_ranking.index, cultural_rep_ranking['Cultural Rep'], color='skyblue')
        axes[0, 0].set_title('Cultural Representative Score Ranking', fontsize=14, fontweight='bold')
        axes[0, 0].set_xlabel('Cultural Representative Score')
        for i, v in enumerate(cultural_rep_ranking['Cultural Rep']):
            axes[0, 0].text(v + 0.01, i, f'{v:.2f}', va='center')
        
        # F1 Score Ranking
        f1_ranking = ranking_df.sort_values('F1 Score', ascending=False)
        axes[0, 1].barh(f1_ranking.index, f1_ranking['F1 Score'], color='lightgreen')
        axes[0, 1].set_title('F1 Score Ranking', fontsize=14, fontweight='bold')
        axes[0, 1].set_xlabel('F1 Score')
        for i, v in enumerate(f1_ranking['F1 Score']):
            axes[0, 1].text(v + 0.001, i, f'{v:.3f}', va='center')
        
        # CLIP Score Ranking
        clip_ranking = ranking_df.sort_values('CLIP Score', ascending=False)
        axes[1, 0].barh(clip_ranking.index, clip_ranking['CLIP Score'], color='lightcoral')
        axes[1, 0].set_title('CLIP Score Ranking', fontsize=14, fontweight='bold')
        axes[1, 0].set_xlabel('CLIP Score')
        for i, v in enumerate(clip_ranking['CLIP Score']):
            axes[1, 0].text(v + 0.1, i, f'{v:.1f}', va='center')
        
        # Aesthetic Score Ranking
        aesthetic_ranking = ranking_df.sort_values('Aesthetic Score', ascending=False)
        axes[1, 1].barh(aesthetic_ranking.index, aesthetic_ranking['Aesthetic Score'], color='gold')
        axes[1, 1].set_title('Aesthetic Score Ranking', fontsize=14, fontweight='bold')
        axes[1, 1].set_xlabel('Aesthetic Score')
        for i, v in enumerate(aesthetic_ranking['Aesthetic Score']):
            axes[1, 1].text(v + 0.001, i, f'{v:.2f}', va='center')
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['scoring_comparison'], "model_performance_ranking.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
        # 2. Best/Worst Analysis
        self.create_best_worst_analysis()
    
    def create_best_worst_analysis(self):
        """Create best/worst images analysis"""
        print(f"\n🏆 Generating Best/Worst Analysis...")
        
        fig, axes = plt.subplots(2, 2, figsize=(20, 16))
        fig.suptitle('Best vs Worst Images Analysis by Model and Country', fontsize=18, fontweight='bold')
        
        # Best Images by Model
        best_by_model = self.combined_cultural.groupby('model')['is_best'].mean() * 100
        axes[0, 0].bar(best_by_model.index, best_by_model.values, color='green', alpha=0.7)
        axes[0, 0].set_title('Best Images Percentage by Model', fontsize=14, fontweight='bold')
        axes[0, 0].set_ylabel('Best Images (%)')
        axes[0, 0].tick_params(axis='x', rotation=45)
        for i, v in enumerate(best_by_model.values):
            axes[0, 0].text(i, v + 0.5, f'{v:.1f}%', ha='center', va='bottom')
        
        # Worst Images by Model
        worst_by_model = self.combined_cultural.groupby('model')['is_worst'].mean() * 100
        axes[0, 1].bar(worst_by_model.index, worst_by_model.values, color='red', alpha=0.7)
        axes[0, 1].set_title('Worst Images Percentage by Model', fontsize=14, fontweight='bold')
        axes[0, 1].set_ylabel('Worst Images (%)')
        axes[0, 1].tick_params(axis='x', rotation=45)
        for i, v in enumerate(worst_by_model.values):
            axes[0, 1].text(i, v + 0.5, f'{v:.1f}%', ha='center', va='bottom')
        
        # Best Images by Country
        best_by_country = self.combined_cultural.groupby('country')['is_best'].mean() * 100
        axes[1, 0].bar(best_by_country.index, best_by_country.values, color='lightgreen', alpha=0.7)
        axes[1, 0].set_title('Best Images Percentage by Country', fontsize=14, fontweight='bold')
        axes[1, 0].set_ylabel('Best Images (%)')
        axes[1, 0].tick_params(axis='x', rotation=45)
        for i, v in enumerate(best_by_country.values):
            axes[1, 0].text(i, v + 0.5, f'{v:.1f}%', ha='center', va='bottom')
        
        # Worst Images by Country
        worst_by_country = self.combined_cultural.groupby('country')['is_worst'].mean() * 100
        axes[1, 1].bar(worst_by_country.index, worst_by_country.values, color='lightcoral', alpha=0.7)
        axes[1, 1].set_title('Worst Images Percentage by Country', fontsize=14, fontweight='bold')
        axes[1, 1].set_ylabel('Worst Images (%)')
        axes[1, 1].tick_params(axis='x', rotation=45)
        for i, v in enumerate(worst_by_country.values):
            axes[1, 1].text(i, v + 0.5, f'{v:.1f}%', ha='center', va='bottom')
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['best_worst_analysis'], "best_worst_analysis.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
    
    def create_detailed_heatmaps(self):
        """Create detailed heatmaps for all metrics"""
        print(f"\n🔥 Generating Detailed Heatmaps...")
        
        # 1. Comprehensive Model-Country-Category Analysis
        fig, axes = plt.subplots(3, 2, figsize=(24, 20))
        fig.suptitle('Comprehensive Model Performance Analysis: All Metrics', fontsize=20, fontweight='bold')
        
        # Cultural Representative by Model & Country
        cultural_rep_pivot = self.combined_cultural.pivot_table(
            values='cultural_representative', 
            index='country', 
            columns='model', 
            aggfunc='mean'
        )
        sns.heatmap(cultural_rep_pivot, annot=True, fmt='.2f', cmap='RdYlGn', 
                   ax=axes[0, 0], cbar_kws={'label': 'Cultural Rep Score'})
        axes[0, 0].set_title('Cultural Representative Score\nby Model & Country', fontsize=14, fontweight='bold')
        axes[0, 0].set_xlabel('Model')
        axes[0, 0].set_ylabel('Country')
        
        # F1 Score by Model & Country
        f1_pivot = self.combined_cultural.pivot_table(
            values='f1', 
            index='country', 
            columns='model', 
            aggfunc='mean'
        )
        sns.heatmap(f1_pivot, annot=True, fmt='.3f', cmap='Blues', 
                   ax=axes[0, 1], cbar_kws={'label': 'F1 Score'})
        axes[0, 1].set_title('F1 Score\nby Model & Country', fontsize=14, fontweight='bold')
        axes[0, 1].set_xlabel('Model')
        axes[0, 1].set_ylabel('Country')
        
        # CLIP Score by Model & Country
        clip_pivot = self.combined_general.pivot_table(
            values='best_clip_score', 
            index='country', 
            columns='model', 
            aggfunc='mean'
        )
        sns.heatmap(clip_pivot, annot=True, fmt='.1f', cmap='Purples', 
                   ax=axes[1, 0], cbar_kws={'label': 'CLIP Score'})
        axes[1, 0].set_title('CLIP Score\nby Model & Country', fontsize=14, fontweight='bold')
        axes[1, 0].set_xlabel('Model')
        axes[1, 0].set_ylabel('Country')
        
        # Aesthetic Score by Model & Country
        aesthetic_pivot = self.combined_general.pivot_table(
            values='best_aesthetic', 
            index='country', 
            columns='model', 
            aggfunc='mean'
        )
        sns.heatmap(aesthetic_pivot, annot=True, fmt='.2f', cmap='Oranges', 
                   ax=axes[1, 1], cbar_kws={'label': 'Aesthetic Score'})
        axes[1, 1].set_title('Aesthetic Score\nby Model & Country', fontsize=14, fontweight='bold')
        axes[1, 1].set_xlabel('Model')
        axes[1, 1].set_ylabel('Country')
        
        # Best Images by Model & Country
        best_pivot = self.combined_cultural.pivot_table(
            values='is_best', 
            index='country', 
            columns='model', 
            aggfunc='mean'
        ) * 100
        sns.heatmap(best_pivot, annot=True, fmt='.1f', cmap='Greens', 
                   ax=axes[2, 0], cbar_kws={'label': 'Best Images (%)'})
        axes[2, 0].set_title('Best Images Percentage\nby Model & Country', fontsize=14, fontweight='bold')
        axes[2, 0].set_xlabel('Model')
        axes[2, 0].set_ylabel('Country')
        
        # Worst Images by Model & Country
        worst_pivot = self.combined_cultural.pivot_table(
            values='is_worst', 
            index='country', 
            columns='model', 
            aggfunc='mean'
        ) * 100
        sns.heatmap(worst_pivot, annot=True, fmt='.1f', cmap='Reds', 
                   ax=axes[2, 1], cbar_kws={'label': 'Worst Images (%)'})
        axes[2, 1].set_title('Worst Images Percentage\nby Model & Country', fontsize=14, fontweight='bold')
        axes[2, 1].set_xlabel('Model')
        axes[2, 1].set_ylabel('Country')
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['detailed_heatmaps'], "comprehensive_detailed_heatmaps.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
    
    def create_performance_tables(self):
        """Create performance summary tables"""
        print(f"\n📋 Generating Performance Tables...")
        
        # Calculate comprehensive performance metrics
        performance_data = []
        
        for model_name, data in self.models_data.items():
            cultural_data = data['cultural_summary']
            general_data = data['general_summary']
            
            # Calculate metrics
            cultural_rep = cultural_data['cultural_representative'].mean()
            f1_score = cultural_data['f1'].mean()
            accuracy = cultural_data['accuracy'].mean()
            prompt_alignment = cultural_data['prompt_alignment'].mean()
            best_pct = cultural_data['is_best'].mean() * 100
            worst_pct = cultural_data['is_worst'].mean() * 100
            
            clip_score = general_data['best_clip_score'].mean()
            aesthetic_score = general_data['best_aesthetic'].mean()
            
            performance_data.append({
                'Model': model_name.upper(),
                'Cultural Rep': f'{cultural_rep:.2f}',
                'F1 Score': f'{f1_score:.3f}',
                'Accuracy': f'{accuracy:.3f}',
                'Prompt Alignment': f'{prompt_alignment:.2f}',
                'Best Images %': f'{best_pct:.1f}%',
                'Worst Images %': f'{worst_pct:.1f}%',
                'CLIP Score': f'{clip_score:.1f}',
                'Aesthetic Score': f'{aesthetic_score:.2f}'
            })
        
        # Create performance table
        performance_df = pd.DataFrame(performance_data)
        
        # Save as CSV
        csv_path = os.path.join(self.folders['performance_tables'], "comprehensive_performance_table.csv")
        performance_df.to_csv(csv_path, index=False)
        print(f"  ✅ {csv_path}")
        
        # Create visual table
        fig, ax = plt.subplots(figsize=(20, 8))
        ax.axis('tight')
        ax.axis('off')
        
        # Create table
        table_data = []
        for _, row in performance_df.iterrows():
            table_data.append([
                row['Model'],
                row['Cultural Rep'],
                row['F1 Score'],
                row['Accuracy'],
                row['Prompt Alignment'],
                row['Best Images %'],
                row['Worst Images %'],
                row['CLIP Score'],
                row['Aesthetic Score']
            ])
        
        table = ax.table(cellText=table_data,
                        colLabels=['Model', 'Cultural Rep', 'F1 Score', 'Accuracy', 'Prompt Alignment', 
                                  'Best Images %', 'Worst Images %', 'CLIP Score', 'Aesthetic Score'],
                        cellLoc='center',
                        loc='center',
                        bbox=[0, 0, 1, 1])
        
        table.auto_set_font_size(False)
        table.set_fontsize(10)
        table.scale(1, 2)
        
        # Style the table
        for i in range(len(table_data) + 1):
            for j in range(9):
                cell = table[(i, j)]
                if i == 0:  # Header
                    cell.set_facecolor('#4CAF50')
                    cell.set_text_props(weight='bold', color='white')
                else:
                    if i % 2 == 0:
                        cell.set_facecolor('#f0f0f0')
                    else:
                        cell.set_facecolor('white')
        
        plt.title('Comprehensive Model Performance Summary', fontsize=16, fontweight='bold', pad=20)
        save_path = os.path.join(self.folders['performance_tables'], "performance_summary_table.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
    
    def generate_all_visualizations(self):
        """Generate all comprehensive visualizations"""
        print(f"\n🎨 Starting Comprehensive Model Analysis...")
        print(f"📁 Charts will be saved to: {BASE_CHARTS_DIR}")
        
        self.create_model_country_performance()
        self.create_scoring_comparison()
        self.create_detailed_heatmaps()
        self.create_performance_tables()
        
        print(f"\n✅ All comprehensive visualizations generated successfully!")
        print(f"📊 Check the organized folders in: {BASE_CHARTS_DIR}")
    
    def generate_comprehensive_report(self):
        """Generate comprehensive analysis report"""
        print(f"\n" + "=" * 100)
        print("COMPREHENSIVE MODEL PERFORMANCE ANALYSIS REPORT")
        print("=" * 100)
        
        # Calculate comprehensive metrics
        model_metrics = {}
        for model_name, data in self.models_data.items():
            cultural_data = data['cultural_summary']
            general_data = data['general_summary']
            
            model_metrics[model_name] = {
                'cultural_rep': cultural_data['cultural_representative'].mean(),
                'f1': cultural_data['f1'].mean(),
                'accuracy': cultural_data['accuracy'].mean(),
                'best_pct': cultural_data['is_best'].mean() * 100,
                'worst_pct': cultural_data['is_worst'].mean() * 100,
                'clip': general_data['best_clip_score'].mean(),
                'aesthetic': general_data['best_aesthetic'].mean()
            }
        
        # Create comprehensive ranking
        print(f"\n🏆 COMPREHENSIVE MODEL RANKING:")
        print(f"{'Model':<10} {'Cultural Rep':<12} {'F1 Score':<10} {'Best %':<8} {'CLIP':<8} {'Aesthetic':<10} {'Overall':<8}")
        print("-" * 80)
        
        # Calculate overall score (normalized)
        for model_name, metrics in model_metrics.items():
            # Normalize scores (0-1 scale)
            cultural_rep_norm = (metrics['cultural_rep'] - 1.0) / 1.0  # Assuming range 1-2
            f1_norm = metrics['f1']
            best_norm = metrics['best_pct'] / 100
            clip_norm = (metrics['clip'] - 20) / 10  # Assuming range 20-30
            aesthetic_norm = (metrics['aesthetic'] - 5.0) / 1.0  # Assuming range 5-6
            
            overall_score = (cultural_rep_norm + f1_norm + best_norm + clip_norm + aesthetic_norm) / 5
            
            print(f"{model_name.upper():<10} {metrics['cultural_rep']:<12.2f} {metrics['f1']:<10.3f} "
                  f"{metrics['best_pct']:<8.1f} {metrics['clip']:<8.1f} {metrics['aesthetic']:<10.2f} {overall_score:<8.3f}")
        
        print(f"\n🎯 KEY INSIGHTS:")
        
        # Find best performers
        best_cultural_rep = max(model_metrics.items(), key=lambda x: x[1]['cultural_rep'])
        best_f1 = max(model_metrics.items(), key=lambda x: x[1]['f1'])
        best_clip = max(model_metrics.items(), key=lambda x: x[1]['clip'])
        best_aesthetic = max(model_metrics.items(), key=lambda x: x[1]['aesthetic'])
        
        print(f"- 🏆 Best Cultural Representative: {best_cultural_rep[0].upper()} ({best_cultural_rep[1]['cultural_rep']:.2f})")
        print(f"- 🏆 Best F1 Score: {best_f1[0].upper()} ({best_f1[1]['f1']:.3f})")
        print(f"- 🏆 Best CLIP Score: {best_clip[0].upper()} ({best_clip[1]['clip']:.1f})")
        print(f"- 🏆 Best Aesthetic Score: {best_aesthetic[0].upper()} ({best_aesthetic[1]['aesthetic']:.2f})")
        
        # Country analysis
        print(f"\n🌍 COUNTRY-SPECIFIC INSIGHTS:")
        country_analysis = self.combined_cultural.groupby('country').agg({
            'cultural_representative': 'mean',
            'f1': 'mean',
            'is_best': 'mean'
        }).round(3)
        
        for country, metrics in country_analysis.iterrows():
            print(f"- {country}: Cultural Rep={metrics['cultural_representative']:.2f}, "
                  f"F1={metrics['f1']:.3f}, Best={metrics['is_best']*100:.1f}%")
        
        print(f"\n" + "=" * 100)

def main():
    """Main function to run comprehensive model analysis"""
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
    analyzer = ComprehensiveModelAnalyzer(model_configs)
    
    # Run all analyses
    analyzer.generate_all_visualizations()
    analyzer.generate_comprehensive_report()

if __name__ == "__main__":
    main()

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
from collections import defaultdict

# Set up plotting style
plt.style.use('default')
sns.set_palette("husl")

# Get the directory where the script is located to build robust paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_CHARTS_DIR = os.path.join(SCRIPT_DIR, 'multi_model_charts')

class MultiModelCulturalAnalyzer:
    def __init__(self, model_configs):
        """
        Initialize the multi-model analyzer
        
        Args:
            model_configs: Dict with model names as keys and config dicts as values
                          Each config should have 'cultural_metrics_path' and 'cultural_summary_path'
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
            'quality_metrics': os.path.join(BASE_CHARTS_DIR, '05_quality_metrics'),
            'detailed_heatmaps': os.path.join(BASE_CHARTS_DIR, '06_detailed_heatmaps')
        }
        
        # Create all directories
        for folder_path in self.folders.values():
            os.makedirs(folder_path, exist_ok=True)
            
    def _load_all_models_data(self):
        """Load data for all models"""
        for model_name, config in self.model_configs.items():
            try:
                detailed_df = pd.read_csv(config['cultural_metrics_path'])
                summary_df = pd.read_csv(config['cultural_summary_path'])
                
                # Clean and prepare data
                summary_df = summary_df.dropna(subset=['country', 'category', 'variant'])
                summary_df['country'] = summary_df['country'].str.title()
                summary_df['variant'] = summary_df['variant'].fillna('general')
                summary_df['step_num'] = summary_df['step'].str.extract('(\d+)').fillna('-1').astype(int)
                summary_df['model'] = model_name
                
                self.models_data[model_name] = {
                    'detailed': detailed_df,
                    'summary': summary_df
                }
                
                print(f"✅ Loaded {model_name}: {len(summary_df)} evaluations")
                
            except Exception as e:
                print(f"❌ Error loading {model_name}: {e}")
                
        # Combine all summary data for comparison
        if self.models_data:
            self.combined_summary = pd.concat([data['summary'] for data in self.models_data.values()], 
                                            ignore_index=True)
            print(f"📊 Combined dataset: {len(self.combined_summary)} total evaluations")
        
    def analyze_overall_comparison(self):
        """Compare overall performance between models"""
        print("=" * 80)
        print("MULTI-MODEL CULTURAL METRICS COMPARISON")
        print("=" * 80)
        
        for model_name, data in self.models_data.items():
            summary_df = data['summary']
            
            print(f"\n🤖 {model_name.upper()} SYSTEM:")
            print(f"- Total evaluations: {len(summary_df)}")
            print(f"- Countries: {summary_df['country'].nunique()}")
            print(f"- Categories: {summary_df['category'].nunique()}")
            
            # Performance metrics
            print(f"- Avg F1 Score: {summary_df['f1'].mean():.3f} ± {summary_df['f1'].std():.3f}")
            print(f"- Avg Accuracy: {summary_df['accuracy'].mean():.3f} ± {summary_df['accuracy'].std():.3f}")
            print(f"- Avg Cultural Rep: {summary_df['cultural_representative'].mean():.2f} ± {summary_df['cultural_representative'].std():.2f}")
            print(f"- Avg Prompt Alignment: {summary_df['prompt_alignment'].mean():.2f} ± {summary_df['prompt_alignment'].std():.2f}")
            print(f"- Best Images: {summary_df['is_best'].sum()} ({summary_df['is_best'].mean()*100:.1f}%)")
            print(f"- Worst Images: {summary_df['is_worst'].sum()} ({summary_df['is_worst'].mean()*100:.1f}%)")
            print(f"- Avg Processing Time: {summary_df['processing_time'].mean():.2f}s")
            
    def compare_country_performance(self):
        """Compare performance by country across models"""
        print(f"\n" + "=" * 60)
        print("COUNTRY PERFORMANCE COMPARISON")
        print("=" * 60)
        
        country_comparison = self.combined_summary.groupby(['model', 'country']).agg({
            'f1': ['mean', 'std'],
            'accuracy': ['mean', 'std'],
            'cultural_representative': ['mean', 'std'],
            'prompt_alignment': ['mean', 'std'],
            'is_best': 'mean',
            'is_worst': 'mean',
            'processing_time': 'mean'
        }).round(3)
        
        for country in sorted(self.combined_summary['country'].unique()):
            print(f"\n🌍 {country}:")
            for model_name in self.models_data.keys():
                model_data = country_comparison.loc[model_name, country] if (model_name, country) in country_comparison.index else None
                if model_data is not None:
                    print(f"  {model_name}:")
                    print(f"    F1: {model_data[('f1', 'mean')]:.3f} ± {model_data[('f1', 'std')]:.3f}")
                    print(f"    Cultural Rep: {model_data[('cultural_representative', 'mean')]:.2f}")
                    print(f"    Best Images: {model_data[('is_best', 'mean')]*100:.1f}%")
                    
    def compare_step_performance(self):
        """Compare step-wise performance across models"""
        print(f"\n" + "=" * 60)
        print("STEP PERFORMANCE COMPARISON")
        print("=" * 60)
        
        step_comparison = self.combined_summary.groupby(['model', 'step']).agg({
            'f1': 'mean',
            'cultural_representative': 'mean',
            'prompt_alignment': 'mean',
            'is_best': 'mean',
            'is_worst': 'mean'
        }).round(3)
        
        for step in sorted(self.combined_summary['step'].unique()):
            print(f"\n📈 {step}:")
            for model_name in self.models_data.keys():
                if (model_name, step) in step_comparison.index:
                    data = step_comparison.loc[model_name, step]
                    print(f"  {model_name}: F1={data['f1']:.3f}, Cultural={data['cultural_representative']:.2f}, Best={data['is_best']*100:.1f}%")
                    
    def identify_model_strengths_weaknesses(self):
        """Identify each model's strengths and weaknesses"""
        print(f"\n" + "=" * 60)
        print("SYSTEM STRENGTHS & WEAKNESSES")
        print("=" * 60)
        
        for model_name, data in self.models_data.items():
            summary_df = data['summary']
            
            print(f"\n🤖 {model_name.upper()}:")
            
            # Best performing categories
            best_categories = summary_df.groupby('category')['f1'].mean().nlargest(3)
            print(f"  🏆 Strongest Categories:")
            for cat, score in best_categories.items():
                print(f"    - {cat}: {score:.3f}")
                
            # Worst performing categories  
            worst_categories = summary_df.groupby('category')['f1'].mean().nsmallest(3)
            print(f"  ⚠️ Weakest Categories:")
            for cat, score in worst_categories.items():
                print(f"    - {cat}: {score:.3f}")
                
            # Best performing countries
            best_countries = summary_df.groupby('country')['f1'].mean().nlargest(3)
            print(f"  🌟 Best Countries:")
            for country, score in best_countries.items():
                print(f"    - {country}: {score:.3f}")
                
            # Best step
            best_step = summary_df.groupby('step')['cultural_representative'].mean().idxmax()
            best_step_score = summary_df.groupby('step')['cultural_representative'].mean().max()
            print(f"  ⭐ Best Step: {best_step} (Cultural Rep: {best_step_score:.2f})")
            
    def create_overview_visualizations(self):
        """Create overview comparison visualizations"""
        print(f"\n📊 Generating Overview Visualizations...")
        
        # 1. Overall Performance Comparison
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Multi-Model Performance Overview', fontsize=16, fontweight='bold')
        
        metrics = ['f1', 'accuracy', 'cultural_representative', 'prompt_alignment']
        metric_names = ['F1 Score', 'Accuracy', 'Cultural Representative', 'Prompt Alignment']
        
        for idx, (metric, name) in enumerate(zip(metrics, metric_names)):
            ax = axes[idx // 2, idx % 2]
            
            sns.boxplot(data=self.combined_summary, x='model', y=metric, ax=ax)
            ax.set_title(f'{name} Comparison')
            ax.set_xlabel('Model')
            ax.set_ylabel(name)
            
        plt.tight_layout()
        save_path = os.path.join(self.folders['overview'], "overall_performance_comparison.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
        # 2. Best/Worst Images Comparison
        fig, axes = plt.subplots(1, 2, figsize=(14, 6))
        fig.suptitle('Best/Worst Images Distribution by Model', fontsize=16, fontweight='bold')
        
        # Best images percentage
        best_by_model = self.combined_summary.groupby('model')['is_best'].mean() * 100
        best_by_model.plot(kind='bar', ax=axes[0], color='green', alpha=0.7)
        axes[0].set_title('Best Images Percentage')
        axes[0].set_ylabel('Percentage (%)')
        axes[0].tick_params(axis='x', rotation=45)
        
        # Worst images percentage
        worst_by_model = self.combined_summary.groupby('model')['is_worst'].mean() * 100
        worst_by_model.plot(kind='bar', ax=axes[1], color='red', alpha=0.7)
        axes[1].set_title('Worst Images Percentage')
        axes[1].set_ylabel('Percentage (%)')
        axes[1].tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['overview'], "best_worst_comparison.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
    def create_country_analysis_visualizations(self):
        """Create country-specific analysis visualizations"""
        print(f"\n🌍 Generating Country Analysis Visualizations...")
        
        # 1. Country Performance Heatmap Comparison
        fig, axes = plt.subplots(1, len(self.models_data), figsize=(8*len(self.models_data), 8))
        if len(self.models_data) == 1:
            axes = [axes]
        fig.suptitle('Cultural Representative Score by Country & Model', fontsize=16, fontweight='bold')
        
        for idx, (model_name, data) in enumerate(self.models_data.items()):
            summary_df = data['summary']
            
            # Create pivot table for heatmap
            pivot_data = summary_df.pivot_table(
                values='cultural_representative', 
                index='country', 
                columns='step', 
                aggfunc='mean'
            )
            
            sns.heatmap(pivot_data, annot=True, fmt='.2f', cmap='RdYlGn', 
                       ax=axes[idx], cbar_kws={'label': 'Cultural Rep Score'})
            axes[idx].set_title(f'{model_name.upper()} - Cultural Rep by Country & Step')
            axes[idx].set_xlabel('Step')
            axes[idx].set_ylabel('Country')
            
        plt.tight_layout()
        save_path = os.path.join(self.folders['country_analysis'], "country_step_heatmap_comparison.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
        # 2. Country Performance Radar Chart
        countries = sorted(self.combined_summary['country'].unique())
        metrics = ['f1', 'accuracy', 'cultural_representative', 'prompt_alignment']
        
        fig, axes = plt.subplots(2, 3, figsize=(18, 12), subplot_kw=dict(projection='polar'))
        fig.suptitle('Country Performance Radar Charts by Model', fontsize=16, fontweight='bold')
        
        for idx, country in enumerate(countries):
            if idx >= 6:  # Limit to 6 countries
                break
                
            ax = axes[idx // 3, idx % 3]
            
            for model_name, data in self.models_data.items():
                country_data = data['summary'][data['summary']['country'] == country]
                if len(country_data) > 0:
                    values = [country_data[metric].mean() for metric in metrics]
                    
                    # Normalize values to 0-1 scale for radar chart
                    normalized_values = []
                    for i, val in enumerate(values):
                        if metrics[i] in ['f1', 'accuracy']:
                            normalized_values.append(val)  # Already 0-1
                        else:
                            normalized_values.append(val / 5.0)  # Scale 1-5 to 0.2-1
                    
                    angles = np.linspace(0, 2 * np.pi, len(metrics), endpoint=False).tolist()
                    normalized_values += normalized_values[:1]  # Complete the circle
                    angles += angles[:1]
                    
                    ax.plot(angles, normalized_values, 'o-', linewidth=2, label=model_name)
                    ax.fill(angles, normalized_values, alpha=0.25)
            
            ax.set_xticks(angles[:-1])
            ax.set_xticklabels(metrics)
            ax.set_title(country)
            ax.legend()
            
        plt.tight_layout()
        save_path = os.path.join(self.folders['country_analysis'], "country_radar_comparison.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
    def create_step_analysis_visualizations(self):
        """Create step-wise analysis visualizations"""
        print(f"\n📈 Generating Step Analysis Visualizations...")
        
        # 1. Step Performance Progression
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Step Performance Progression Comparison', fontsize=16, fontweight='bold')
        
        metrics = ['f1', 'accuracy', 'cultural_representative', 'prompt_alignment']
        metric_names = ['F1 Score', 'Accuracy', 'Cultural Representative', 'Prompt Alignment']
        
        for idx, (metric, name) in enumerate(zip(metrics, metric_names)):
            ax = axes[idx // 2, idx % 2]
            
            for model_name, data in self.models_data.items():
                summary_df = data['summary']
                step_data = summary_df[summary_df['step_num'] >= 0].groupby('step_num')[metric].mean()
                ax.plot(step_data.index, step_data.values, 'o-', label=model_name, linewidth=2)
            
            ax.set_title(f'{name} by Step')
            ax.set_xlabel('Step Number')
            ax.set_ylabel(name)
            ax.legend()
            ax.grid(True, alpha=0.3)
            
        plt.tight_layout()
        save_path = os.path.join(self.folders['step_analysis'], "step_progression_comparison.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
        # 2. Best/Worst Images by Step
        fig, axes = plt.subplots(1, 2, figsize=(14, 6))
        fig.suptitle('Best/Worst Images Distribution by Step & Model', fontsize=16, fontweight='bold')
        
        # Best images by step
        for model_name, data in self.models_data.items():
            summary_df = data['summary']
            best_by_step = summary_df.groupby('step')['is_best'].mean() * 100
            axes[0].plot(range(len(best_by_step)), best_by_step.values, 'o-', label=model_name, linewidth=2)
        
        axes[0].set_title('Best Images Percentage by Step')
        axes[0].set_xlabel('Step')
        axes[0].set_ylabel('Best Images (%)')
        axes[0].legend()
        axes[0].grid(True, alpha=0.3)
        
        # Worst images by step
        for model_name, data in self.models_data.items():
            summary_df = data['summary']
            worst_by_step = summary_df.groupby('step')['is_worst'].mean() * 100
            axes[1].plot(range(len(worst_by_step)), worst_by_step.values, 'o-', label=model_name, linewidth=2)
        
        axes[1].set_title('Worst Images Percentage by Step')
        axes[1].set_xlabel('Step')
        axes[1].set_ylabel('Worst Images (%)')
        axes[1].legend()
        axes[1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['step_analysis'], "best_worst_by_step_comparison.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
    def create_category_analysis_visualizations(self):
        """Create category-specific analysis visualizations"""
        print(f"\n📂 Generating Category Analysis Visualizations...")
        
        # 1. Category Performance Comparison
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Category Performance Comparison', fontsize=16, fontweight='bold')
        
        metrics = ['f1', 'accuracy', 'cultural_representative', 'prompt_alignment']
        metric_names = ['F1 Score', 'Accuracy', 'Cultural Representative', 'Prompt Alignment']
        
        for idx, (metric, name) in enumerate(zip(metrics, metric_names)):
            ax = axes[idx // 2, idx % 2]
            
            category_comparison = self.combined_summary.groupby(['model', 'category'])[metric].mean().unstack()
            category_comparison.plot(kind='bar', ax=ax, width=0.8)
            ax.set_title(f'{name} by Category')
            ax.set_xlabel('Model')
            ax.set_ylabel(name)
            ax.legend(title='Category', bbox_to_anchor=(1.05, 1), loc='upper left')
            ax.tick_params(axis='x', rotation=45)
            
        plt.tight_layout()
        save_path = os.path.join(self.folders['category_analysis'], "category_performance_comparison.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
        # 2. Variant Performance Comparison
        fig, ax = plt.subplots(1, 1, figsize=(12, 8))
        fig.suptitle('Variant Performance Comparison (Cultural Representative)', fontsize=16, fontweight='bold')
        
        variant_comparison = self.combined_summary.groupby(['model', 'variant'])['cultural_representative'].mean().unstack()
        
        sns.heatmap(variant_comparison, annot=True, fmt='.2f', cmap='RdYlGn', ax=ax,
                   cbar_kws={'label': 'Cultural Representative Score'})
        ax.set_title('Cultural Representative Score by Model & Variant')
        ax.set_xlabel('Variant')
        ax.set_ylabel('Model')
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['category_analysis'], "variant_performance_heatmap.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
    def create_quality_metrics_visualizations(self):
        """Create quality metrics specific visualizations"""
        print(f"\n⭐ Generating Quality Metrics Visualizations...")
        
        # 1. Cultural Rep vs Prompt Alignment Scatter
        fig, axes = plt.subplots(1, len(self.models_data), figsize=(8*len(self.models_data), 6))
        if len(self.models_data) == 1:
            axes = [axes]
        fig.suptitle('Cultural Representative vs Prompt Alignment', fontsize=16, fontweight='bold')
        
        for idx, (model_name, data) in enumerate(self.models_data.items()):
            summary_df = data['summary']
            
            sns.scatterplot(data=summary_df, x='cultural_representative', y='prompt_alignment', 
                           hue='country', alpha=0.6, ax=axes[idx])
            axes[idx].set_title(f'{model_name.upper()}')
            axes[idx].set_xlabel('Cultural Representative Score')
            axes[idx].set_ylabel('Prompt Alignment Score')
            
        plt.tight_layout()
        save_path = os.path.join(self.folders['quality_metrics'], "cultural_vs_prompt_scatter.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
        # 2. Processing Time Comparison
        fig, axes = plt.subplots(1, 2, figsize=(14, 6))
        fig.suptitle('Processing Time Analysis', fontsize=16, fontweight='bold')
        
        # Processing time by model
        sns.boxplot(data=self.combined_summary, x='model', y='processing_time', ax=axes[0])
        axes[0].set_title('Processing Time by Model')
        axes[0].set_xlabel('Model')
        axes[0].set_ylabel('Processing Time (seconds)')
        
        # Processing time vs quality correlation
        for model_name, data in self.models_data.items():
            summary_df = data['summary']
            axes[1].scatter(summary_df['processing_time'], summary_df['cultural_representative'], 
                          alpha=0.5, label=model_name)
        
        axes[1].set_title('Processing Time vs Cultural Representative')
        axes[1].set_xlabel('Processing Time (seconds)')
        axes[1].set_ylabel('Cultural Representative Score')
        axes[1].legend()
        
        plt.tight_layout()
        save_path = os.path.join(self.folders['quality_metrics'], "processing_time_analysis.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
    def create_detailed_heatmaps(self):
        """Create detailed comparison heatmaps"""
        print(f"\n🔥 Generating Detailed Heatmaps...")
        
        # 1. Model-Country-Step 3D Comparison
        fig, axes = plt.subplots(len(self.models_data), 2, figsize=(16, 6*len(self.models_data)))
        if len(self.models_data) == 1:
            axes = axes.reshape(1, -1)
        fig.suptitle('Detailed Model-Country-Step Analysis', fontsize=16, fontweight='bold')
        
        for idx, (model_name, data) in enumerate(self.models_data.items()):
            summary_df = data['summary']
            
            # Cultural Representative heatmap
            cultural_pivot = summary_df.pivot_table(
                values='cultural_representative', 
                index='country', 
                columns='step', 
                aggfunc='mean'
            )
            
            sns.heatmap(cultural_pivot, annot=True, fmt='.2f', cmap='RdYlGn', 
                       ax=axes[idx, 0], cbar_kws={'label': 'Cultural Rep Score'})
            axes[idx, 0].set_title(f'{model_name.upper()} - Cultural Rep by Country & Step')
            axes[idx, 0].set_xlabel('Step')
            axes[idx, 0].set_ylabel('Country')
            
            # Best images percentage heatmap
            best_pivot = summary_df.groupby(['country', 'step']).agg({
                'is_best': ['sum', 'count']
            })
            best_pivot.columns = ['best_count', 'total_count']
            best_pivot['best_percentage'] = (best_pivot['best_count'] / best_pivot['total_count'] * 100)
            best_percentage_pivot = best_pivot['best_percentage'].unstack(fill_value=0)
            
            sns.heatmap(best_percentage_pivot, annot=True, fmt='.1f', cmap='Greens', 
                       ax=axes[idx, 1], cbar_kws={'label': 'Best Images (%)'})
            axes[idx, 1].set_title(f'{model_name.upper()} - Best Images % by Country & Step')
            axes[idx, 1].set_xlabel('Step')
            axes[idx, 1].set_ylabel('Country')
            
        plt.tight_layout()
        save_path = os.path.join(self.folders['detailed_heatmaps'], "model_country_step_detailed.png")
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  ✅ {save_path}")
        
        # 2. Direct Model Comparison Heatmap
        if len(self.models_data) == 2:
            model_names = list(self.models_data.keys())
            model1_data = self.models_data[model_names[0]]['summary']
            model2_data = self.models_data[model_names[1]]['summary']
            
            fig, axes = plt.subplots(1, 2, figsize=(16, 8))
            fig.suptitle(f'{model_names[0].upper()} vs {model_names[1].upper()} Direct Comparison', 
                        fontsize=16, fontweight='bold')
            
            # Cultural Representative comparison
            model1_pivot = model1_data.pivot_table(
                values='cultural_representative', index='country', columns='step', aggfunc='mean'
            )
            model2_pivot = model2_data.pivot_table(
                values='cultural_representative', index='country', columns='step', aggfunc='mean'
            )
            
            # Calculate difference (Model1 - Model2)
            diff_pivot = model1_pivot.subtract(model2_pivot, fill_value=0)
            
            sns.heatmap(diff_pivot, annot=True, fmt='.2f', cmap='RdBu_r', center=0,
                       ax=axes[0], cbar_kws={'label': f'{model_names[0]} - {model_names[1]}'})
            axes[0].set_title('Cultural Representative Score Difference')
            axes[0].set_xlabel('Step')
            axes[0].set_ylabel('Country')
            
            # F1 Score comparison
            model1_f1_pivot = model1_data.pivot_table(
                values='f1', index='country', columns='step', aggfunc='mean'
            )
            model2_f1_pivot = model2_data.pivot_table(
                values='f1', index='country', columns='step', aggfunc='mean'
            )
            
            f1_diff_pivot = model1_f1_pivot.subtract(model2_f1_pivot, fill_value=0)
            
            sns.heatmap(f1_diff_pivot, annot=True, fmt='.3f', cmap='RdBu_r', center=0,
                       ax=axes[1], cbar_kws={'label': f'{model_names[0]} - {model_names[1]}'})
            axes[1].set_title('F1 Score Difference')
            axes[1].set_xlabel('Step')
            axes[1].set_ylabel('Country')
            
            plt.tight_layout()
            save_path = os.path.join(self.folders['detailed_heatmaps'], "direct_model_comparison.png")
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            plt.close()
            print(f"  ✅ {save_path}")
        
    def generate_all_visualizations(self):
        """Generate all visualizations"""
        print(f"\n🎨 Starting Multi-Model Visualization Generation...")
        print(f"📁 Charts will be saved to: {BASE_CHARTS_DIR}")
        
        self.create_overview_visualizations()
        self.create_country_analysis_visualizations()
        self.create_step_analysis_visualizations()
        self.create_category_analysis_visualizations()
        self.create_quality_metrics_visualizations()
        self.create_detailed_heatmaps()
        
        print(f"\n✅ All visualizations generated successfully!")
        print(f"📊 Check the organized folders in: {BASE_CHARTS_DIR}")
        
    def generate_comparison_report(self):
        """Generate comprehensive comparison report"""
        print(f"\n" + "=" * 80)
        print("MULTI-MODEL COMPARISON SUMMARY REPORT")
        print("=" * 80)
        
        # Overall winner analysis
        overall_scores = {}
        for model_name, data in self.models_data.items():
            summary_df = data['summary']
            overall_scores[model_name] = {
                'f1': summary_df['f1'].mean(),
                'cultural_rep': summary_df['cultural_representative'].mean(),
                'prompt_align': summary_df['prompt_alignment'].mean(),
                'best_images_pct': summary_df['is_best'].mean() * 100,
                'processing_time': summary_df['processing_time'].mean()
            }
        
        print(f"\n🏆 OVERALL PERFORMANCE RANKING:")
        # Rank by F1 score
        f1_ranking = sorted(overall_scores.items(), key=lambda x: x[1]['f1'], reverse=True)
        for rank, (model, scores) in enumerate(f1_ranking, 1):
            print(f"{rank}. {model.upper()}: F1={scores['f1']:.3f}, Cultural={scores['cultural_rep']:.2f}, Best={scores['best_images_pct']:.1f}%")
        
        print(f"\n📊 DETAILED COMPARISON:")
        for metric in ['f1', 'cultural_rep', 'prompt_align', 'best_images_pct']:
            best_model = max(overall_scores.items(), key=lambda x: x[1][metric])
            worst_model = min(overall_scores.items(), key=lambda x: x[1][metric])
            print(f"- {metric.upper()}: Best={best_model[0]} ({best_model[1][metric]:.3f}), Worst={worst_model[0]} ({worst_model[1][metric]:.3f})")
        
        # Processing time (lower is better)
        fastest_model = min(overall_scores.items(), key=lambda x: x[1]['processing_time'])
        slowest_model = max(overall_scores.items(), key=lambda x: x[1]['processing_time'])
        print(f"- PROCESSING_TIME: Fastest={fastest_model[0]} ({fastest_model[1]['processing_time']:.2f}s), Slowest={slowest_model[0]} ({slowest_model[1]['processing_time']:.2f}s)")
        
        print(f"\n🎯 RECOMMENDATIONS:")
        best_overall = f1_ranking[0][0]
        print(f"- Overall Best Model: {best_overall.upper()}")
        
        if len(f1_ranking) > 1:
            gap = f1_ranking[0][1]['f1'] - f1_ranking[1][1]['f1']
            if gap < 0.05:
                print(f"- Performance gap is small ({gap:.3f}), consider other factors like processing time")
            else:
                print(f"- Clear performance leader with {gap:.3f} F1 score advantage")
        
        print(f"\n" + "=" * 80)

def main():
    """Main function to run multi-model comparison"""
    # Define model configurations
    base_path = os.path.join(SCRIPT_DIR, '..', 'output')
    
    model_configs = {
        'flux': {
            'cultural_metrics_path': os.path.join(base_path, 'flux', 'cultural_metrics.csv'),
            'cultural_summary_path': os.path.join(base_path, 'flux', 'cultural_metrics_summary.csv')
        },
        'hidream': {
            'cultural_metrics_path': os.path.join(base_path, 'hidream', 'cultural_metrics.csv'),
            'cultural_summary_path': os.path.join(base_path, 'hidream', 'cultural_metrics_summary.csv')
        },
        'qwen': {
            'cultural_metrics_path': os.path.join(base_path, 'qwen', 'cultural_metrics.csv'),
            'cultural_summary_path': os.path.join(base_path, 'qwen', 'cultural_metrics_summary.csv')
        }
    }
    
    # Check if files exist
    for model_name, config in model_configs.items():
        for file_type, file_path in config.items():
            if not os.path.exists(file_path):
                print(f"❌ Error: {file_type} for {model_name} not found at {file_path}")
                return
    
    # Initialize analyzer
    analyzer = MultiModelCulturalAnalyzer(model_configs)
    
    # Run all analyses
    analyzer.analyze_overall_comparison()
    analyzer.compare_country_performance()
    analyzer.compare_step_performance()
    analyzer.identify_model_strengths_weaknesses()
    analyzer.generate_all_visualizations()
    analyzer.generate_comparison_report()

if __name__ == "__main__":
    main()

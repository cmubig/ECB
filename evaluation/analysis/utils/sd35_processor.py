#!/usr/bin/env python3
"""
SD35 Model Data Processing Utilities for IASEAI26 project.
Provides utilities for processing and analyzing SD35 model outputs.
"""

import pandas as pd
import numpy as np
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class SD35Processor:
    """Utility class for processing SD35 model data"""
    
    def __init__(self, output_dir):
        """
        Initialize SD35 processor
        
        Args:
            output_dir: Path to the output directory containing SD35 data
        """
        self.output_dir = Path(output_dir)
        self.sd35_dir = self.output_dir / 'sd35'
        
        # Ensure SD35 directory exists
        if not self.sd35_dir.exists():
            raise FileNotFoundError(f"SD35 directory not found: {self.sd35_dir}")
    
    def load_sd35_data(self):
        """Load all SD35 data files"""
        data = {}
        
        # Load general metrics
        general_metrics_path = self.sd35_dir / 'general_metrics.csv'
        general_summary_path = self.sd35_dir / 'general_metrics_summary.csv'
        
        if general_metrics_path.exists():
            data['general_metrics'] = pd.read_csv(general_metrics_path)
            print(f"✅ Loaded general metrics: {len(data['general_metrics'])} records")
        else:
            print(f"⚠️ General metrics not found: {general_metrics_path}")
        
        if general_summary_path.exists():
            data['general_summary'] = pd.read_csv(general_summary_path)
            print(f"✅ Loaded general summary: {len(data['general_summary'])} records")
        else:
            print(f"⚠️ General summary not found: {general_summary_path}")
        
        # Load cultural metrics
        cultural_metrics_path = self.sd35_dir / 'cultural_metrics.csv'
        cultural_summary_path = self.sd35_dir / 'cultural_metrics_summary.csv'
        
        if cultural_metrics_path.exists():
            data['cultural_metrics'] = pd.read_csv(cultural_metrics_path)
            print(f"✅ Loaded cultural metrics: {len(data['cultural_metrics'])} records")
        else:
            print(f"⚠️ Cultural metrics not found: {cultural_metrics_path}")
        
        if cultural_summary_path.exists():
            data['cultural_summary'] = pd.read_csv(cultural_summary_path)
            print(f"✅ Loaded cultural summary: {len(data['cultural_summary'])} records")
        else:
            print(f"⚠️ Cultural summary not found: {cultural_summary_path}")
        
        return data
    
    def analyze_sd35_performance(self, data):
        """Analyze SD35 performance metrics"""
        print("\n" + "="*60)
        print("SD35 PERFORMANCE ANALYSIS")
        print("="*60)
        
        if 'general_summary' in data:
            general_df = data['general_summary']
            
            print(f"\n📊 General Metrics:")
            print(f"- Total evaluations: {len(general_df)}")
            print(f"- Avg CLIP Score: {general_df['best_clip_score'].mean():.2f} ± {general_df['best_clip_score'].std():.2f}")
            print(f"- Avg Aesthetic Score: {general_df['best_aesthetic'].mean():.2f} ± {general_df['best_aesthetic'].std():.2f}")
            
            # Country analysis
            if 'country' in general_df.columns:
                country_stats = general_df.groupby('country').agg({
                    'best_clip_score': ['mean', 'std'],
                    'best_aesthetic': ['mean', 'std']
                }).round(2)
                
                print(f"\n🌍 Performance by Country:")
                for country in country_stats.index:
                    if country != 'Unknown':
                        stats = country_stats.loc[country]
                        print(f"  {country}: CLIP={stats[('best_clip_score', 'mean')]:.2f}±{stats[('best_clip_score', 'std')]:.2f}, "
                              f"Aesthetic={stats[('best_aesthetic', 'mean')]:.2f}±{stats[('best_aesthetic', 'std')]:.2f}")
        
        if 'cultural_summary' in data:
            cultural_df = data['cultural_summary']
            
            print(f"\n📊 Cultural Metrics:")
            print(f"- Total evaluations: {len(cultural_df)}")
            print(f"- Avg F1 Score: {cultural_df['f1'].mean():.3f} ± {cultural_df['f1'].std():.3f}")
            print(f"- Avg Accuracy: {cultural_df['accuracy'].mean():.3f} ± {cultural_df['accuracy'].std():.3f}")
            print(f"- Avg Cultural Rep: {cultural_df['cultural_representative'].mean():.2f} ± {cultural_df['cultural_representative'].std():.2f}")
            print(f"- Avg Prompt Alignment: {cultural_df['prompt_alignment'].mean():.2f} ± {cultural_df['prompt_alignment'].std():.2f}")
            
            # Best/Worst images
            best_images = cultural_df['is_best'].sum()
            worst_images = cultural_df['is_worst'].sum()
            print(f"- Best images: {best_images} ({best_images/len(cultural_df)*100:.1f}%)")
            print(f"- Worst images: {worst_images} ({worst_images/len(cultural_df)*100:.1f}%)")
    
    def compare_with_other_models(self, data, other_models_data):
        """Compare SD35 with other models"""
        print("\n" + "="*60)
        print("SD35 vs OTHER MODELS COMPARISON")
        print("="*60)
        
        if 'general_summary' in data and 'general_summary' in other_models_data:
            sd35_clip = data['general_summary']['best_clip_score'].mean()
            sd35_aesthetic = data['general_summary']['best_aesthetic'].mean()
            
            print(f"\n📊 General Performance Comparison:")
            print(f"SD35: CLIP={sd35_clip:.2f}, Aesthetic={sd35_aesthetic:.2f}")
            
            for model_name, model_data in other_models_data.items():
                if 'general_summary' in model_data:
                    model_clip = model_data['general_summary']['best_clip_score'].mean()
                    model_aesthetic = model_data['general_summary']['best_aesthetic'].mean()
                    
                    clip_diff = sd35_clip - model_clip
                    aesthetic_diff = sd35_aesthetic - model_aesthetic
                    
                    print(f"{model_name.upper()}: CLIP={model_clip:.2f} ({clip_diff:+.2f}), "
                          f"Aesthetic={model_aesthetic:.2f} ({aesthetic_diff:+.2f})")
        
        if 'cultural_summary' in data and 'cultural_summary' in other_models_data:
            sd35_f1 = data['cultural_summary']['f1'].mean()
            sd35_accuracy = data['cultural_summary']['accuracy'].mean()
            
            print(f"\n📊 Cultural Performance Comparison:")
            print(f"SD35: F1={sd35_f1:.3f}, Accuracy={sd35_accuracy:.3f}")
            
            for model_name, model_data in other_models_data.items():
                if 'cultural_summary' in model_data:
                    model_f1 = model_data['cultural_summary']['f1'].mean()
                    model_accuracy = model_data['cultural_summary']['accuracy'].mean()
                    
                    f1_diff = sd35_f1 - model_f1
                    accuracy_diff = sd35_accuracy - model_accuracy
                    
                    print(f"{model_name.upper()}: F1={model_f1:.3f} ({f1_diff:+.3f}), "
                          f"Accuracy={model_accuracy:.3f} ({accuracy_diff:+.3f})")
    
    def generate_sd35_report(self, data):
        """Generate comprehensive SD35 report"""
        print("\n" + "="*80)
        print("SD35 COMPREHENSIVE REPORT")
        print("="*80)
        
        # Overall performance summary
        if 'general_summary' in data:
            general_df = data['general_summary']
            
            print(f"\n🎯 KEY FINDINGS:")
            print(f"- Overall CLIP Score: {general_df['best_clip_score'].mean():.2f}")
            print(f"- Overall Aesthetic Score: {general_df['best_aesthetic'].mean():.2f}")
            
            # Best performing country
            if 'country' in general_df.columns:
                best_country = general_df.groupby('country')['best_clip_score'].mean().idxmax()
                best_country_score = general_df.groupby('country')['best_clip_score'].mean().max()
                print(f"- Best performing country: {best_country} (CLIP: {best_country_score:.2f})")
            
            # Best performing category
            if 'category' in general_df.columns:
                best_category = general_df.groupby('category')['best_clip_score'].mean().idxmax()
                best_category_score = general_df.groupby('category')['best_clip_score'].mean().max()
                print(f"- Best performing category: {best_category} (CLIP: {best_category_score:.2f})")
        
        if 'cultural_summary' in data:
            cultural_df = data['cultural_summary']
            
            print(f"\n🎯 CULTURAL PERFORMANCE:")
            print(f"- Overall F1 Score: {cultural_df['f1'].mean():.3f}")
            print(f"- Overall Accuracy: {cultural_df['accuracy'].mean():.3f}")
            
            # Performance distribution
            high_performers = len(cultural_df[cultural_df['f1'] > 0.8])
            medium_performers = len(cultural_df[(cultural_df['f1'] >= 0.5) & (cultural_df['f1'] <= 0.8)])
            low_performers = len(cultural_df[cultural_df['f1'] < 0.5])
            
            print(f"\n📊 PERFORMANCE DISTRIBUTION:")
            print(f"- High performers (F1 > 0.8): {high_performers} ({high_performers/len(cultural_df)*100:.1f}%)")
            print(f"- Medium performers (0.5 ≤ F1 ≤ 0.8): {medium_performers} ({medium_performers/len(cultural_df)*100:.1f}%)")
            print(f"- Low performers (F1 < 0.5): {low_performers} ({low_performers/len(cultural_df)*100:.1f}%)")
            
            # Recommendations
            print(f"\n💡 RECOMMENDATIONS:")
            if low_performers > len(cultural_df) * 0.3:
                print("- High number of low performers detected. Consider model fine-tuning.")
            if cultural_df.groupby('country')['f1'].std().mean() > 0.2:
                print("- Significant performance variation across countries. Address cultural bias.")
            if cultural_df.groupby('variant')['f1'].std().mean() > 0.2:
                print("- Performance varies significantly by variant. Focus on underperforming variants.")
        
        print(f"\n" + "="*80)
    
    def export_sd35_insights(self, data, output_path):
        """Export SD35 insights to file"""
        insights = []
        
        if 'general_summary' in data:
            general_df = data['general_summary']
            insights.append(f"SD35 General Performance:")
            insights.append(f"- Avg CLIP Score: {general_df['best_clip_score'].mean():.2f}")
            insights.append(f"- Avg Aesthetic Score: {general_df['best_aesthetic'].mean():.2f}")
            insights.append(f"- Total evaluations: {len(general_df)}")
        
        if 'cultural_summary' in data:
            cultural_df = data['cultural_summary']
            insights.append(f"\nSD35 Cultural Performance:")
            insights.append(f"- Avg F1 Score: {cultural_df['f1'].mean():.3f}")
            insights.append(f"- Avg Accuracy: {cultural_df['accuracy'].mean():.3f}")
            insights.append(f"- Total evaluations: {len(cultural_df)}")
        
        with open(output_path, 'w') as f:
            f.write('\n'.join(insights))
        
        print(f"✅ SD35 insights exported to: {output_path}")


def main():
    """Main function to run SD35 processing"""
    # Get the output directory
    script_dir = Path(__file__).parent
    output_dir = script_dir.parent.parent / 'output'
    
    # Initialize processor
    processor = SD35Processor(output_dir)
    
    # Load data
    data = processor.load_sd35_data()
    
    if not data:
        print("❌ No SD35 data found!")
        return
    
    # Analyze performance
    processor.analyze_sd35_performance(data)
    
    # Generate report
    processor.generate_sd35_report(data)
    
    # Export insights
    insights_path = script_dir / 'sd35_insights.txt'
    processor.export_sd35_insights(data, insights_path)
    
    print(f"\n✅ SD35 processing completed!")


if __name__ == "__main__":
    main()

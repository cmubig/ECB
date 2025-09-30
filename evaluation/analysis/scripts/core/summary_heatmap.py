#!/usr/bin/env python3
"""
Summary heatmap generation for IASEAI26 project.
Creates comprehensive heatmaps showing model performance by country and metrics.
"""

import pandas as pd
import os
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

def get_country_from_prompt(prompt):
    """Extract country name from prompt text."""
    if "China" in prompt:
        return "China"
    if "Korea" in prompt or "South Korea" in prompt:
        return "Korea"
    if "India" in prompt:
        return "India"
    if "Kenya" in prompt:
        return "Kenya"
    if "Nigeria" in prompt:
        return "Nigeria"
    if "United States" in prompt:
        return "United States"
    return "Unknown"

def create_summary_heatmap(file_paths, output_dir):
    """Create summary heatmaps for all models."""
    all_model_data = []

    for model_name, file_path in file_paths.items():
        if not os.path.exists(file_path):
            print(f"[INFO] Skipping {model_name}: File not found at {file_path}")
            continue

        df = pd.read_csv(file_path)
        df['country'] = df['prompt'].apply(get_country_from_prompt)
        df = df[df['country'] != 'Unknown']

        # Extract step numbers
        df['best_clip_step'] = df['best_step_by_clip'].str.extract(r'(step\d+)')
        df['best_aesthetic_step'] = df['best_step_by_aesthetic'].str.extract(r'(step\d+)')

        # Calculate average scores and most frequent best step (mode)
        summary = df.groupby('country').agg(
            avg_clip_score=('best_clip_score', 'mean'),
            avg_aesthetic_score=('best_aesthetic', 'mean'),
            clip_step_mode=('best_clip_step', lambda x: x.mode()[0] if not x.mode().empty else 'N/A'),
            aesthetic_step_mode=('best_aesthetic_step', lambda x: x.mode()[0] if not x.mode().empty else 'N/A')
        ).reset_index()

        summary['model'] = model_name
        all_model_data.append(summary)

    if not all_model_data:
        print("[ERROR] No data to process. Halting heatmap generation.")
        return

    combined_df = pd.concat(all_model_data)

    # Create heatmaps
    plot_heatmap(
        df=combined_df,
        value_col='avg_clip_score',
        annot_col='clip_step_mode',
        title='Average CLIP Score by Model and Country (Color) with Best Step (Text)',
        save_path=os.path.join(output_dir, 'summary_heatmap_clip_score.png')
    )

    plot_heatmap(
        df=combined_df,
        value_col='avg_aesthetic_score',
        annot_col='aesthetic_step_mode',
        title='Average Aesthetic Score by Model and Country (Color) with Best Step (Text)',
        save_path=os.path.join(output_dir, 'summary_heatmap_aesthetic_score.png')
    )

def plot_heatmap(df, value_col, annot_col, title, save_path):
    """Helper function to plot a heatmap."""
    try:
        value_pivot = df.pivot(index='country', columns='model', values=value_col)
        annot_pivot = df.pivot(index='country', columns='model', values=annot_col)
    except Exception as e:
        print(f"[ERROR] Failed to pivot data for {title}: {e}")
        return

    plt.figure(figsize=(12, 8))
    sns.heatmap(value_pivot, annot=annot_pivot, fmt='s', cmap='viridis', linewidths=.5, cbar_kws={'label': 'Average Score'})
    plt.title(title, fontsize=16)
    plt.xlabel("Model", fontsize=12)
    plt.ylabel("Country", fontsize=12)
    plt.xticks(rotation=45)
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {save_path}")

def main():
    """Main function to create summary heatmaps."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_path = os.path.join(script_dir, '..', '..', '..', 'output')
    output_dir = os.path.join(script_dir, '..', '..', 'results', 'summary', 'charts')

    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Define model file paths
    summary_file_paths = {
        "flux": os.path.join(base_path, "flux", "general_metrics_summary.csv"),
        "hidream": os.path.join(base_path, "hidream", "general_metrics_summary.csv"),
        "nextstep": os.path.join(base_path, "nextstep", "general_metrics_summary.csv"),
        "qwen": os.path.join(base_path, "qwen", "general_metrics_summary.csv"),
        "sd35": os.path.join(base_path, "sd35", "general_metrics_summary.csv")
    }

    print("🔍 Creating summary heatmaps...")

    create_summary_heatmap(summary_file_paths, output_dir)

    print("✅ Summary heatmaps created!")
    print(f"📊 Charts saved to: {output_dir}")

if __name__ == "__main__":
    main()

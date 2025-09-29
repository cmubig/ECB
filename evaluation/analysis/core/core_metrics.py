#!/usr/bin/env python3
"""
Core metrics analysis for IASEAI26 project.
Analyzes basic performance metrics across all models.
"""

import pandas as pd
import os
import re
import matplotlib.pyplot as plt
import seaborn as sns

# Set up plotting style
plt.style.use('default')
sns.set_palette("husl")

def get_country_from_prompt(prompt):
    """Extract country name from prompt text."""
    if "China" in prompt:
        return "China"
    # Handle "Korea" and "South Korea"
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

def plot_best_step_distribution(file_paths, output_dir):
    """Plot best step distribution for each model."""
    valid_paths = {name: path for name, path in file_paths.items() if os.path.exists(path)}
    if not valid_paths:
        print("No valid summary files found for plotting best step distribution.")
        return

    num_models = len(valid_paths)
    fig, axes = plt.subplots(num_models, 2, figsize=(15, 5 * num_models), squeeze=False)
    fig.suptitle("Best Step Distribution", fontsize=16)

    for i, (model_name, file_path) in enumerate(valid_paths.items()):
        df = pd.read_csv(file_path)
        df['best_clip_step_num'] = df['best_step_by_clip'].str.extract(r'(step\d+)').fillna('step-1')
        df['best_aesthetic_step_num'] = df['best_step_by_aesthetic'].str.extract(r'(step\d+)').fillna('step-1')

        sns.countplot(ax=axes[i, 0], x='best_clip_step_num', data=df, order=[f'step{j}' for j in range(6)])
        axes[i, 0].set_title(f"{model_name.upper()} - Best CLIP Step")

        sns.countplot(ax=axes[i, 1], x='best_aesthetic_step_num', data=df, order=[f'step{j}' for j in range(6)])
        axes[i, 1].set_title(f"{model_name.upper()} - Best Aesthetic Step")

    plt.tight_layout(rect=[0, 0, 1, 0.96])
    save_path = os.path.join(output_dir, "best_step_distribution.png")
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {save_path}")

def plot_country_metrics(file_paths, output_dir):
    """Plot country-specific performance metrics."""
    all_country_metrics = []
    for model_name, file_path in file_paths.items():
        if not os.path.exists(file_path):
            continue
        df = pd.read_csv(file_path)
        df['country'] = df['prompt'].apply(get_country_from_prompt)
        country_metrics = df.groupby('country').agg({
            'best_clip_score': 'mean',
            'best_aesthetic': 'mean'
        }).reset_index()
        country_metrics['model'] = model_name
        all_country_metrics.append(country_metrics)

    if not all_country_metrics:
        print("No data available to plot country metrics.")
        return

    combined_df = pd.concat(all_country_metrics)

    fig, axes = plt.subplots(1, 2, figsize=(20, 7))
    fig.suptitle("Country-Specific Performance", fontsize=16)

    sns.barplot(ax=axes[0], x='country', y='best_clip_score', hue='model', data=combined_df)
    axes[0].set_title("Average Best CLIP Score by Country")

    sns.barplot(ax=axes[1], x='country', y='best_aesthetic', hue='model', data=combined_df)
    axes[1].set_title("Average Best Aesthetic Score by Country")

    plt.tight_layout(rect=[0, 0, 1, 0.96])
    save_path = os.path.join(output_dir, "country_performance.png")
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {save_path}")

def plot_step_by_step_progression(file_paths, output_dir):
    """Plot step-by-step score progression for each model."""
    valid_paths = {name: path for name, path in file_paths.items() if os.path.exists(path)}
    if not valid_paths:
        print("No valid detailed files found for plotting step progression.")
        return

    num_models = len(valid_paths)
    fig, axes = plt.subplots(num_models, 2, figsize=(15, 5 * num_models), sharey='row', squeeze=False)
    fig.suptitle("Step-by-Step Score Progression", fontsize=16)

    for i, (model_name, file_path) in enumerate(valid_paths.items()):
        df = pd.read_csv(file_path)
        if 'step' not in df.columns:
            print(f"'step' column not found in {file_path}. Skipping progression plot for {model_name}.")
            # Make the unused plot invisible
            axes[i, 0].set_visible(False)
            axes[i, 1].set_visible(False)
            continue
        df['step_order'] = df['step'].str.extract('(\d+)').astype(int)
        df = df.sort_values(by='step_order')

        step_analysis = df.groupby('step_order').agg({
            'clip_score_0_100': ['mean', 'std'],
            'aesthetic_score': ['mean', 'std']
        }).reset_index()
        step_analysis.columns = ['step', 'clip_mean', 'clip_std', 'aesthetic_mean', 'aesthetic_std']

        axes[i, 0].plot(step_analysis['step'], step_analysis['clip_mean'], marker='o')
        axes[i, 0].fill_between(step_analysis['step'],
                                step_analysis['clip_mean'] - step_analysis['clip_std'],
                                step_analysis['clip_mean'] + step_analysis['clip_std'], alpha=0.2)
        axes[i, 0].set_title(f"{model_name.upper()} - CLIP Score Progression")
        axes[i, 0].set_xlabel("Step")
        axes[i, 0].set_ylabel("Score")

        axes[i, 1].plot(step_analysis['step'], step_analysis['aesthetic_mean'], marker='o')
        axes[i, 1].fill_between(step_analysis['step'],
                                step_analysis['aesthetic_mean'] - step_analysis['aesthetic_std'],
                                step_analysis['aesthetic_mean'] + step_analysis['aesthetic_std'], alpha=0.2)
        axes[i, 1].set_title(f"{model_name.upper()} - Aesthetic Score Progression")
        axes[i, 1].set_xlabel("Step")

    plt.tight_layout(rect=[0, 0, 1, 0.96])
    save_path = os.path.join(output_dir, "step_progression.png")
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {save_path}")

def analyze_best_step_per_country(file_paths, output_dir):
    """Analyze and print the most frequent best step for each country and model."""
    print("\n" + "="*60)
    print("Analysis: Most Frequent Best Step per Country")
    print("="*60)

    for model_name, file_path in file_paths.items():
        if not os.path.exists(file_path):
            print(f"\n[INFO] Skipping {model_name}: File not found at {file_path}")
            continue

        print(f"\n----- Model: {model_name.upper()} ----- ")
        df = pd.read_csv(file_path)
        df['country'] = df['prompt'].apply(get_country_from_prompt)

        metrics_to_analyze = {
            "Best CLIP Step": "best_step_by_clip",
            "Best Aesthetic Step": "best_step_by_aesthetic"
        }

        for metric_name, col_name in metrics_to_analyze.items():
            if col_name not in df.columns:
                print(f"- Metric: {metric_name}: Column '{col_name}' not found.")
                continue

            print(f"- Metric: {metric_name}")
            df['step_num'] = df[col_name].str.extract(r'(step\d+)')

            analysis_df = df.dropna(subset=['step_num', 'country']).copy()
            analysis_df = analysis_df[analysis_df['country'] != 'Unknown']

            if analysis_df.empty:
                print("  - No data available for this metric.")
                continue

            best_steps = analysis_df.groupby('country')['step_num'].agg(lambda x: x.mode()[0] if not x.mode().empty else 'N/A')

            if best_steps.empty:
                print("  - Could not determine best steps for any country.")
                continue

            for country, step in best_steps.items():
                print(f"  - {country}: {step}")

def main():
    """Main function to run core metrics analysis."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_path = os.path.join(script_dir, '..', '..', 'output')
    output_dir = os.path.join(script_dir, '..', '..', 'charts')

    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Define model file paths - updated to current file structure
    summary_file_paths = {
        "flux": os.path.join(base_path, "flux", "general_metrics_summary.csv"),
        "hidream": os.path.join(base_path, "hidream", "general_metrics_summary.csv"),
        "qwen": os.path.join(base_path, "qwen", "general_metrics_summary.csv")
    }

    detailed_file_paths = {
        "flux": os.path.join(base_path, "flux", "general_metrics.csv"),
        "hidream": os.path.join(base_path, "hidream", "general_metrics.csv"),
        "qwen": os.path.join(base_path, "qwen", "general_metrics.csv")
    }

    print("🔍 Running core metrics analysis...")

    # Run plotting functions
    plot_best_step_distribution(summary_file_paths, output_dir)
    plot_country_metrics(summary_file_paths, output_dir)
    plot_step_by_step_progression(detailed_file_paths, output_dir)

    # Run analysis function
    analyze_best_step_per_country(summary_file_paths, output_dir)

    print("✅ Core metrics analysis completed!")
    print(f"📊 Charts saved to: {output_dir}")

if __name__ == "__main__":
    main()

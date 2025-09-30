#!/usr/bin/env python3
"""
Unified analysis runner for IASEAI26 project.
Provides a simple interface to run all types of analyses.
"""

import os
import sys
import subprocess
import argparse

def run_single_model_analysis(model_name, analysis_type):
    """Run analysis for a single model."""
    script_dir = os.path.dirname(os.path.abspath(__file__))

    if analysis_type == "cultural":
        script_path = os.path.join(script_dir, "single_model", "single_model_cultural.py")
        cmd = [sys.executable, script_path, model_name]
    elif analysis_type == "general":
        script_path = os.path.join(script_dir, "single_model", "single_model_general.py")
        cmd = [sys.executable, script_path, model_name]
    else:
        print(f"❌ Unknown analysis type: {analysis_type}")
        return False

    try:
        print(f"\n🔍 Running {analysis_type} analysis for {model_name.upper()}...")
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"✅ {analysis_type.title()} analysis completed for {model_name.upper()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to run {analysis_type} analysis for {model_name.upper()}: {e}")
        return False
    except FileNotFoundError:
        print(f"❌ Script not found: {script_path}")
        return False

def run_core_analysis():
    """Run core metrics analysis."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(script_dir, "core", "core_metrics.py")

    try:
        print("🔍 Running core metrics analysis...")
        result = subprocess.run([sys.executable, script_path], check=True, capture_output=True, text=True)
        print("✅ Core metrics analysis completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to run core metrics analysis: {e}")
        return False
    except FileNotFoundError:
        print(f"❌ Script not found: {script_path}")
        return False

def run_summary_analysis():
    """Run summary heatmap analysis."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(script_dir, "core", "summary_heatmap.py")

    try:
        print("🔍 Running summary heatmap analysis...")
        result = subprocess.run([sys.executable, script_path], check=True, capture_output=True, text=True)
        print("✅ Summary heatmap analysis completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to run summary heatmap analysis: {e}")
        return False
    except FileNotFoundError:
        print(f"❌ Script not found: {script_path}")
        return False

def run_multi_model_analysis(analysis_type):
    """Run multi-model comparison analysis."""
    script_dir = os.path.dirname(os.path.abspath(__file__))

    if analysis_type == "cultural":
        script_path = os.path.join(script_dir, "multi_model_cultural_analysis.py")
    elif analysis_type == "general":
        script_path = os.path.join(script_dir, "multi_model_general_analysis.py")
    else:
        print(f"❌ Unknown analysis type: {analysis_type}")
        return False

    try:
        print(f"\n🔍 Running multi-model {analysis_type} comparison...")
        result = subprocess.run([sys.executable, script_path], check=True, capture_output=True, text=True)
        print(f"✅ Multi-model {analysis_type} comparison completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to run multi-model {analysis_type} comparison: {e}")
        return False
    except FileNotFoundError:
        print(f"❌ Script not found: {script_path}")
        return False

def check_data_availability(models):
    """Check if data files exist for all models."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, '..', '..', 'output')

    missing_models = []
    for model in models:
        cultural_path = os.path.join(output_dir, model, "cultural_metrics.csv")
        general_path = os.path.join(output_dir, model, "general_metrics.csv")

        if not os.path.exists(cultural_path) or not os.path.exists(general_path):
            missing_models.append(model)

    if missing_models:
        print(f"⚠️ Warning: Missing data for models: {', '.join(missing_models)}")
        print("Please ensure all model data files exist before running analyses.")
        return False
    return True

def main():
    """Main function to run all analyses."""
    parser = argparse.ArgumentParser(description='Run IASEAI26 analysis scripts')
    parser.add_argument('--models', nargs='+', default=['flux', 'hidream', 'nextstep', 'qwen', 'sd35'],
                        help='Models to analyze (default: flux hidream nextstep qwen sd35)')
    parser.add_argument('--analysis-type', choices=['all', 'single', 'multi', 'core'],
                        default='all', help='Type of analysis to run')
    parser.add_argument('--single-type', choices=['cultural', 'general'],
                        help='Type of single model analysis (required if analysis-type is single)')

    args = parser.parse_args()

    print("🚀 Starting IASEAI26 analysis pipeline...")
    print("=" * 60)

    # Check data availability
    if not check_data_availability(args.models):
        return

    success_count = 0
    total_count = 0

    if args.analysis_type == 'all' or args.analysis_type == 'single':
        if args.analysis_type == 'single' and not args.single_type:
            print("❌ Error: --single-type is required when using --analysis-type single")
            return

        if args.analysis_type == 'all':
            # Run both cultural and general single model analyses
            for single_type in ['cultural', 'general']:
                print(f"\n📊 Running single model analyses ({single_type})...")
                for model in args.models:
                    total_count += 1
                    if run_single_model_analysis(model, single_type):
                        success_count += 1
        else:
            # Run single model analysis for specified type
            print(f"\n📊 Running single model analyses ({args.single_type})...")
            for model in args.models:
                total_count += 1
                if run_single_model_analysis(model, args.single_type):
                    success_count += 1

    if args.analysis_type == 'all' or args.analysis_type == 'core':
        print("📈 Running core analyses...")
        total_count += 1
        if run_core_analysis():
            success_count += 1

        total_count += 1
        if run_summary_analysis():
            success_count += 1

    if args.analysis_type == 'all' or args.analysis_type == 'multi':
        print("🔍 Running multi-model comparisons...")
        total_count += 1
        if run_multi_model_analysis("cultural"):
            success_count += 1

        total_count += 1
        if run_multi_model_analysis("general"):
            success_count += 1

    print("\n" + "=" * 60)
    print(f"🎉 Analysis pipeline completed! ({success_count}/{total_count} successful)")
    print("📁 Check the respective output directories for results:")
    print("   - Individual model charts: <model_name>_*_charts/")
    print("   - Multi-model comparisons: multi_model_*_charts/")
    print("   - Core analysis charts: charts/")

if __name__ == "__main__":
    main()

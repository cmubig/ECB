# 📊 IASEAI26 Analysis - Clean & Organized Structure

This directory contains comprehensive analysis tools and results for 5 image generation models (Flux, HiDream, NextStep, Qwen, SD35).

## 🗂️ Directory Structure

```
analysis/
├── 📁 scripts/                    # All analysis scripts
│   ├── 📁 core/                   # Core analysis scripts
│   │   ├── core_metrics.py        # Basic metrics analysis
│   │   └── summary_heatmap.py     # Summary heatmap generation
│   ├── 📁 single_model/           # Single model analysis scripts
│   │   ├── single_model_cultural.py    # Cultural metrics analysis
│   │   └── single_model_general.py     # General metrics analysis
│   ├── 📁 utils/                  # Utility scripts
│   ├── multi_model_cultural_analysis.py    # Multi-model cultural comparison
│   ├── multi_model_general_analysis.py     # Multi-model general comparison
│   └── run_analysis.py            # Main execution interface
├── 📁 results/                    # All analysis results
│   ├── 📁 individual/             # Individual model charts
│   │   ├── flux_cultural_charts/      # Flux cultural analysis (13 charts)
│   │   ├── flux_general_charts/       # Flux general analysis (6 charts)
│   │   ├── hidream_cultural_charts/   # HiDream cultural analysis (13 charts)
│   │   ├── hidream_general_charts/    # HiDream general analysis (6 charts)
│   │   ├── nextstep_cultural_charts/  # NextStep cultural analysis (13 charts)
│   │   ├── nextstep_general_charts/   # NextStep general analysis (6 charts)
│   │   ├── qwen_cultural_charts/      # Qwen cultural analysis (13 charts)
│   │   ├── qwen_general_charts/       # Qwen general analysis (6 charts)
│   │   ├── sd35_cultural_charts/      # SD35 cultural analysis (13 charts)
│   │   └── sd35_general_charts/       # SD35 general analysis (6 charts)
│   ├── 📁 comparison/             # Multi-model comparison charts
│   │   ├── multi_model_charts/        # Cultural comparison charts
│   │   └── multi_model_general_charts/ # General comparison charts
│   └── 📁 summary/                 # Summary charts
│       └── charts/                    # Core metrics summary (5 charts)
└── 📁 docs/                      # Documentation
    ├── README.md                      # This file
    └── README_cultural_analysis.md    # Cultural analysis guide
```

## 🚀 Quick Start

### Run All Analyses
```bash
cd /Users/chan/ECB/evaluation/analysis/scripts
python3 run_analysis.py
```

### Run Specific Analysis Types
```bash
# Individual model analysis
python3 run_analysis.py --analysis-type single --single-type cultural --models flux nextstep

# Multi-model comparison
python3 run_analysis.py --analysis-type multi

# Core summary analysis
python3 run_analysis.py --analysis-type core
```

## 📊 Analysis Types

### 1. Individual Model Analysis
- **Cultural Metrics**: Country-specific performance, cultural bias analysis
- **General Metrics**: CLIP scores, aesthetic scores, step analysis
- **Charts**: 13 cultural + 6 general charts per model

### 2. Multi-Model Comparison
- **Cultural Comparison**: Cross-model cultural performance comparison
- **General Comparison**: CLIP/aesthetic score comparison across models
- **Charts**: Organized comparison charts with detailed breakdowns

### 3. Core Summary Analysis
- **Overall Metrics**: Best steps, country performance, step progression
- **Summary Heatmaps**: Visual overview of all models
- **Charts**: 5 summary charts with key insights

## 🎯 Key Features

- **5 Models**: Flux, HiDream, NextStep, Qwen, SD35
- **6 Countries**: China, India, Kenya, Korea, Nigeria, United States
- **7 Categories**: Architecture, Art, Event, Fashion, Food, Landscape, Wildlife
- **Multiple Variants**: Traditional, Modern, General, National, Common
- **Step Analysis**: Performance across generation steps
- **Bias Detection**: Cultural bias analysis and recommendations

## 📈 Chart Categories

### Cultural Analysis Charts (13 per model)
1. Country Performance Heatmap
2. Category Performance by Country
3. Step Performance Analysis
4. Variant Performance Comparison
5. Processing Time Analysis
6. Image Quality Analysis
7. Best/Worst Distribution
8. Cultural vs Prompt Alignment
9. Advanced Country-Step Heatmaps
10. Processing VLM Performance Heatmaps
11. Comprehensive Category Analysis Heatmaps
12. Variant Performance Comparison Heatmaps
13. Step Progression Analysis Heatmaps

### General Analysis Charts (6 per model)
1. Performance Distribution
2. Country Performance
3. Step Analysis
4. Category Performance
5. CLIP vs Aesthetic Scatter
6. Advanced Heatmaps

### Multi-Model Comparison Charts
- Overview Comparison
- Country Analysis
- Step Analysis
- Category Analysis
- Quality Metrics
- Detailed Heatmaps

## 🔧 Requirements

- Python 3.8+
- pandas, matplotlib, seaborn, numpy

## 📝 Usage Examples

```bash
# Analyze specific models
python3 run_analysis.py --models flux hidream --analysis-type single --single-type cultural

# Run multi-model comparison only
python3 run_analysis.py --analysis-type multi

# Run core analysis only
python3 run_analysis.py --analysis-type core
```

## 🎉 Results

All charts are automatically saved to the organized `results/` directory structure, making it easy to:
- Compare individual model performance
- Analyze multi-model comparisons
- Access summary insights
- Navigate results by analysis type

The clean structure ensures easy navigation and maintenance! 🚀

# IASEAI26 Analysis Scripts

This directory contains scripts for analyzing the performance of various image generation models (Flux, HiDream, Qwen). It is organized in a systematic folder structure and provides an easy-to-use integrated execution interface.

## 📁 Folder Structure

```
analysis/
├── core/                    # Core analysis scripts
│   ├── core_metrics.py      # Basic metrics analysis
│   └── summary_heatmap.py   # Summary heatmap generation
├── single_model/            # Single model analysis scripts
│   ├── single_model_cultural.py    # Single model cultural analysis
│   └── single_model_general.py     # Single model general analysis
├── multi_model_cultural_analysis.py    # Multi-model cultural comparison
├── multi_model_general_analysis.py     # Multi-model general comparison
├── run_analysis.py          # Integrated execution interface
└── README.md               # This document
```

### 📂 Detailed Description

#### `core/` - Core Analysis Scripts
- **core_metrics.py**: Basic metrics analysis for all models (best steps, country-specific performance, etc.)
- **summary_heatmap.py**: Summary heatmap generation for all models

#### `single_model/` - Single Model Analysis Scripts
- **single_model_cultural.py**: Cultural metrics analysis for specific models
- **single_model_general.py**: General metrics analysis for specific models

#### Root Level Scripts
- **multi_model_*.py**: Multi-model comparison analysis
- **run_analysis.py**: Main interface for integrated execution of all analyses

## 🚀 Usage

### 1. Integrated Execution (Recommended)

```bash
# Run all analyses at once
python3 run_analysis.py

# Run specific types of analysis only
python3 run_analysis.py --analysis-type single --single-type cultural --models flux qwen
python3 run_analysis.py --analysis-type multi
python3 run_analysis.py --analysis-type core
```

### 2. Individual Script Execution

```bash
# Single model analysis
python3 single_model/single_model_cultural.py flux
python3 single_model/single_model_general.py hidream

# Core analysis
python3 core/core_metrics.py
python3 core/summary_heatmap.py

# Multi-model comparison
python3 multi_model_cultural_analysis.py
python3 multi_model_general_analysis.py
```

### 3. Command Line Options

```bash
python3 run_analysis.py --help

# Available options:
# --models: Models to analyze (default: flux hidream qwen)
# --analysis-type: Analysis type (all, single, multi, core)
# --single-type: Single model analysis type (cultural, general)
```

## 📊 Output Results

### Individual Model Analysis Results
- `<model_name>_cultural_charts/` - Cultural metrics visualization (13 charts)
- `<model_name>_general_charts/` - General metrics visualization (6 charts)

### Multi-Model Comparison Results
- `multi_model_cultural_charts/` - Cultural metrics comparison visualization
- `multi_model_general_charts/` - General metrics comparison visualization

### Summary Analysis Results
- `charts/` - Basic metrics analysis visualization

## 🔧 Requirements

- Python 3.8+
- pandas
- matplotlib
- seaborn
- numpy

## 📝 Analysis Content

### Cultural Metrics Analysis
- Country-specific performance analysis and bias detection
- Category-specific performance analysis
- Step-by-step performance analysis
- Image quality metrics (cultural representation, prompt alignment)
- Cultural bias analysis

### General Metrics Analysis
- CLIP score analysis (image-text similarity)
- Aesthetic score analysis (aesthetic quality)
- Optimal step analysis
- Category-specific performance comparison
- Country-specific performance comparison

## 🎯 Key Features

1. **Model-specific Analysis**: Identify strengths and weaknesses of each model
2. **Multi-model Comparison**: Compare relative performance between models
3. **Visualization**: Generate 20+ types of charts and heatmaps
4. **Automation**: Provide integrated execution interface
5. **Flexibility**: Easy structure for adding new models

## 📈 Analysis Results Interpretation

### Performance Metrics
- **CLIP Score**: Image-text similarity (higher is better, 0-100)
- **Aesthetic Score**: Aesthetic quality of images (higher is better, 1-10)
- **Cultural Representative**: Cultural representation score (1-5)
- **Prompt Alignment**: Alignment between prompt and image (1-5)
- **F1 Score**: Cultural classification accuracy (0-1)

### Step Analysis
- **Best Step**: Generation stage showing best performance for each metric
- **Step Progression**: Performance change trends by stage

### Bias Analysis
- **Cultural Bias**: Analysis of performance differences by country
- **Category Bias**: Analysis of performance variation by category

## 🔍 Troubleshooting

If you encounter errors during analysis:
1. Check if the model's data files exist in `../output/<model_name>/`
2. Verify that data file column names are correct (column names should start with lowercase)
3. Ensure dependency packages are installed
4. Confirm Python version is 3.8+

## 🎉 Quick Start

```bash
# 1. Run all analyses (recommended)
python3 run_analysis.py

# 2. Analyze specific models only
python3 run_analysis.py --models qwen --analysis-type single --single-type cultural

# 3. Run multi-model comparison only
python3 run_analysis.py --analysis-type multi
```

Now you can comprehensively analyze the performance of all IASEAI26 project models in a systematic and manageable structure! 📊✨

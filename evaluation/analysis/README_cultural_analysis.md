# Cultural Metrics Analysis Tool

This tool provides comprehensive analysis of cultural metrics for generated images, specifically designed for the Flux system evaluation results.

## Overview

The `cultural_analysis.py` script analyzes cultural representation and bias in generated images across different countries, categories, and variants. It provides detailed statistical analysis and visualizations to understand system performance from a cultural perspective.

## Features

### 1. Overall Performance Analysis
- Dataset overview with total evaluations, countries, categories, and variants
- Overall performance metrics (accuracy, precision, recall, F1-score)
- Statistical summaries with mean, standard deviation, and range

### 2. Country-Specific Analysis
- Performance breakdown by country
- Identifies best and worst performing countries
- Processing time analysis by country

### 3. Category & Variant Analysis
- Performance by main categories (architecture, art, event, fashion, food, wildlife)
- Performance by variants (traditional, modern, general, etc.)
- Identifies which cultural aspects are better represented

### 4. Step-wise Performance Analysis
- Performance across different generation steps
- Helps understand if iterative refinement improves cultural representation

### 5. Cultural Bias Detection
- Identifies performance gaps between countries for same categories
- Highlights potential cultural biases in the system
- Provides specific examples of biased performance

### 6. Comprehensive Visualizations
- **Country Performance Heatmap**: Shows performance metrics across countries and categories
- **Category Performance by Country**: Grouped bar charts showing how different countries perform in each category
- **Step Performance**: Box plots showing performance distribution across generation steps
- **Variant Performance**: Violin plots comparing traditional vs modern vs general variants
- **Processing Time Analysis**: Analysis of computational requirements by country and category

## Usage

### Basic Usage
```bash
cd /path/to/evaluation/analysis
python3 cultural_analysis.py
```

### Requirements
- pandas
- numpy
- matplotlib
- seaborn

### Input Files
The script expects the following files in `../output/flux/`:
- `cultural_metrics.csv`: Detailed cultural evaluation results
- `cultural_metrics_summary.csv`: Summarized cultural metrics with performance scores

### Output
- **Console Output**: Comprehensive text analysis with statistics and findings
- **Visualizations**: PNG files saved to `cultural_charts/` directory
  - `country_performance_heatmap.png`
  - `category_performance_by_country.png`
  - `step_performance.png`
  - `variant_performance.png`
  - `processing_time_analysis.png`

## Key Metrics Explained

- **Accuracy**: Overall correctness of cultural representation
- **Precision**: How many identified cultural elements are actually correct
- **Recall**: How many actual cultural elements were successfully identified
- **F1-Score**: Harmonic mean of precision and recall (balanced performance measure)

## Interpretation Guide

### Performance Levels
- **High Performers (F1 > 0.8)**: Excellent cultural representation
- **Medium Performers (0.5 ≤ F1 ≤ 0.8)**: Acceptable cultural representation
- **Low Performers (F1 < 0.5)**: Poor cultural representation, needs improvement

### Cultural Bias Indicators
- Large performance gaps between countries for the same category indicate potential bias
- Consistent underperformance of certain countries suggests systematic issues
- Variant-specific biases (e.g., poor performance on "traditional" vs "modern") indicate training data imbalances

## Example Findings

Based on the Flux system analysis:

### Strengths
- Best performing country: **Korea** (F1: 0.552)
- Best performing category: **Fashion** (F1: 0.560)
- Traditional variants generally perform better than modern variants

### Areas for Improvement
- Worst performing country: **Kenya** (F1: 0.180)
- Worst performing category: **Wildlife** (F1: 0.228)
- Modern architectural representations show significant bias
- 42.2% of evaluations are low performers (F1 < 0.5)

### Cultural Bias Concerns
- Significant performance gaps detected between countries
- Western countries (US) perform better in modern contexts
- African countries (Kenya, Nigeria) show lower overall performance
- Traditional cultural elements are better represented than modern ones

## Recommendations

1. **System Fine-tuning**: Address the high number of low performers (42.2%)
2. **Cultural Bias Mitigation**: Focus on improving representation for underperforming countries
3. **Variant Balance**: Improve modern variant performance to match traditional variant quality
4. **Data Augmentation**: Increase training data for underrepresented cultural contexts

## Customization

The script can be easily modified to:
- Analyze different systems by changing the input file paths
- Add new visualization types
- Modify performance thresholds
- Include additional metrics or analysis dimensions

## Contact

For questions or improvements to this analysis tool, please refer to the main project documentation.

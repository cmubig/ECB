# Evaluation Cultural Bias 🌍
## A Comprehensive Framework for Assessing Cultural Representation in Generative Image Models

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This repository contains the implementation and evaluation framework for **Evaluation Cultural Bias (ECB)**, a comprehensive methodology for assessing cultural representation and bias in generative image models across multiple countries and cultural contexts.

## 🎯 Project Overview

ECB introduces a **comprehensive evaluation framework** that includes:

- **Image Generation**: T2I (Text-to-Image) and I2I (Image-to-Image) pipelines for multiple models
- **Cultural Metrics**: Cultural appropriateness, representation accuracy, and contextual sensitivity
- **General Metrics**: Technical quality, prompt adherence, and perceptual fidelity

### Key Components

1. **Multi-Model Image Generation**: T2I and I2I pipelines for 5 different generative models
2. **Structured Cultural Evaluation**: Context-aware assessment using cultural knowledge bases
3. **VLM-based Evaluation**: Vision-Language Models for cultural understanding
4. **Model Comparison**: Audit across 6 countries and 8 cultural categories
5. **Human Survey Platform**: Web-based interface for collecting human evaluation data
6. **Analysis Pipeline**: Statistical analysis and visualization tools

## 📁 Repository Structure

```
ECB/
├── 📊 dataset/                    # Generated images and metadata
│   ├── flux/                      # FLUX model outputs
│   ├── hidream/                   # HiDream model outputs  
│   ├── qwen/                      # Qwen-VL model outputs
│   ├── nextstep/                  # NextStep model outputs
│   └── sd35/                      # Stable Diffusion 3.5 outputs
│
├── 🔬 evaluation/                 # Evaluation framework
│   ├── cultural_metric/           # Cultural assessment pipeline
│   │   ├── enhanced_cultural_metric_pipeline.py  # Main evaluation script
│   │   ├── build_cultural_index.py              # Knowledge base builder
│   │   └── vector_store/          # FAISS-based cultural knowledge index
│   ├── general_metric/            # Technical quality assessment
│   │   └── multi_metric_evaluation.py           # CLIP, FID, LPIPS metrics
│   ├── analysis/                  # Statistical analysis and visualization
│   │   ├── scripts/               # All analysis scripts
│   │   │   ├── core/              # Core analysis scripts
│   │   │   ├── single_model/      # Individual model analysis
│   │   │   ├── multi_model_*_analysis.py  # Cross-model comparisons
│   │   │   └── run_analysis.py     # Main execution interface
│   │   └── results/               # All analysis results
│   │       ├── individual/        # Individual model charts (5 models × 2 types)
│   │       ├── comparison/        # Multi-model comparison charts
│   │       └── summary/           # Summary charts
│   └── survey_app/                # Human evaluation interface
│       ├── app.py                 # Flask web application
│       └── responses/             # Human survey responses
│
├── 🏭 generator/                  # Image generation pipelines
│   ├── T2I/                       # Text-to-Image generation
│   │   ├── flux/                  # FLUX T2I implementation
│   │   ├── hidream/               # HiDream T2I implementation
│   │   ├── qwen/                  # Qwen-VL T2I implementation
│   │   ├── nextstep/              # NextStep T2I implementation
│   │   └── sd35/                  # Stable Diffusion 3.5 T2I
│   └── I2I/                       # Image-to-Image editing
│       ├── flux/                  # FLUX I2I implementation
│       ├── hidream/               # HiDream I2I implementation
│       ├── qwen/                  # Qwen-VL I2I implementation
│       ├── nextstep/              # NextStep I2I implementation
│       └── sd35/                  # Stable Diffusion 3.5 I2I
│
├── 🌐 ecb-human-survey/           # Next.js web application
│   ├── src/                       # React components and logic
│   ├── public/                    # Static assets
│   └── firebase.json              # Firebase configuration
│
├── 📚 external_data/              # Cultural reference documents
│   ├── China.pdf                  # Cultural knowledge sources
│   ├── India.pdf
│   └── [Other countries...]
│
├── 📄 iaseai26-paper/             # Research paper and documentation
│   └── IASEAI26.pdf               # Academic publication
│
└── 🔧 Configuration Files
    ├── requirements.txt            # Python dependencies
    └── run_*.sh                   # Execution scripts
```

## 🚀 Quick Start

### Prerequisites

```bash
# Python environment
conda create -n ecb python=3.8
conda activate ecb

# Install dependencies
pip install -r evaluation/cultural_metric/requirements.txt
pip install -r evaluation/general_metric/requirements.txt
```

### 1. Image Generation (Optional - if you want to generate new images)

```bash
# Text-to-Image generation
cd generator/T2I/flux/
python generate_t2i.py --prompts prompts.json --output ../../dataset/flux/base/

# Image-to-Image editing  
cd generator/I2I/flux/
python generate_i2i.py --base-images ../../dataset/flux/base/ --edit-prompts edit_prompts.json --output ../../dataset/flux/edit_1/
```

### 2. Cultural Knowledge Base Setup

```bash
cd evaluation/cultural_metric/
python build_cultural_index.py \
    --data-dir ../../external_data/ \
    --output-dir vector_store/
```

### 3. Run Cultural Evaluation

```bash
python enhanced_cultural_metric_pipeline.py \
    --input-csv ../../dataset/flux/prompt-img-path.csv \
    --image-root ../../dataset/flux/ \
    --summary-csv results/flux_cultural_summary.csv \
    --detail-csv results/flux_cultural_details.csv \
    --index-dir vector_store/ \
    --load-in-4bit \
    --max-samples 50
```

### 4. Run General Metrics Evaluation

```bash
cd evaluation/general_metric/
python multi_metric_evaluation.py \
    --input-csv ../../dataset/flux/prompt-img-path.csv \
    --image-root ../../dataset/flux/ \
    --output-csv results/flux_general_metrics.csv
```

### 5. Generate Analysis Reports

```bash
cd evaluation/analysis/scripts/
python3 run_analysis.py  # Run all analyses
python3 run_analysis.py --analysis-type single --single-type cultural --models flux
python3 run_analysis.py --analysis-type multi  # Cross-model comparison
python3 run_analysis.py --analysis-type core   # Summary analysis
```

## 📊 Evaluation Metrics

### Cultural Metrics

| Metric | Description | Range | Evaluator |
|--------|-------------|-------|-----------|
| **Cultural Representative** | How well the image represents cultural elements | 1-5 | Qwen2-VL |
| **Prompt Alignment** | Alignment with cultural context prompts | 1-5 | Qwen2-VL |
| **Cultural Accuracy** | Binary classification accuracy (yes/no questions) | 0-1 | LLM-generated Q&A |
| **Group Ranking** | Best/worst selection within cultural groups | Rank | Multi-image VLM |

### General Metrics

| Metric | Description | Range | Method |
|--------|-------------|-------|--------|
| **CLIP Score** | Semantic similarity to prompt | 0-1 | CLIP ViT-L/14 |
| **Aesthetic Score** | Perceptual aesthetic quality | 0-10 | LAION Aesthetic |
| **FID** | Image distribution similarity | 0-∞ | Inception features |
| **LPIPS** | Perceptual distance | 0-1 | AlexNet features |

## 🌍 Evaluation Scope

### Countries Covered
- 🇨🇳 China
- 🇮🇳 India  
- 🇰🇷 South Korea
- 🇰🇪 Kenya
- 🇳🇬 Nigeria
- 🇺🇸 United States

### Cultural Categories
- 🏛️ Architecture (Traditional/Modern Houses, Landmarks)
- 🎨 Art (Dance, Painting, Sculpture) 
- 🎉 Events (Festivals, Weddings, Funerals, Sports)
- 👗 Fashion (Clothing, Accessories, Makeup)
- 🍜 Food (Dishes, Desserts, Beverages, Staples)
- 🏞️ Landscape (Cities, Countryside, Nature)
- 👥 People (Various Professions and Roles)
- 🦁 Wildlife (Animals, Plants)

### Models Evaluated
- **FLUX**: State-of-the-art diffusion model
- **HiDream**: High-resolution generation model
- **Qwen-VL**: Vision-language multimodal model
- **NextStep**: Advanced editing-focused model  
- **Stable Diffusion 3.5**: Popular open-source model

## 🔧 Advanced Usage

### Batch Generation Pipeline

```bash
# Generate images for all models and all cultural categories
cd generator/
python batch_generation.py \
    --models flux hidream qwen nextstep sd35 \
    --countries china india korea kenya nigeria usa \
    --categories architecture art event fashion food landscape people wildlife \
    --output-dir ../dataset/
```

### Custom Image Generation

```python
from generator.T2I.flux import FluxT2IGenerator
from generator.I2I.flux import FluxI2IGenerator

# T2I Generation
t2i_gen = FluxT2IGenerator()
image = t2i_gen.generate("Traditional Chinese architecture house, photorealistic")

# I2I Editing
i2i_gen = FluxI2IGenerator()
edited_image = i2i_gen.edit(base_image, "Change to represent Korean architecture")
```

### Custom Cultural Knowledge Integration

```python
from evaluation.cultural_metric.build_cultural_index import CulturalIndexBuilder

builder = CulturalIndexBuilder()
builder.add_cultural_documents(
    country="MyCountry",
    documents=["path/to/cultural_doc.pdf"],
    categories=["architecture", "food", "art"]
)
builder.build_index("custom_vector_store/")
```

### Batch Evaluation Pipeline

```bash
# Evaluate all models with cultural and general metrics
cd evaluation/analysis/scripts/
python3 run_analysis.py  # Run complete analysis for all 5 models
python3 run_analysis.py --models flux hidream nextstep qwen sd35 --analysis-type all
```

### Human Survey Integration

```bash
cd ecb-human-survey/
npm install
npm run dev  # Start web interface on localhost:3000
```

## 📈 Results and Analysis

### Key Findings

1. **Cultural Representation Gaps**: Variations across countries and categories
2. **Model-Specific Biases**: Different models show different cultural blind spots
3. **Category-Dependent Performance**: Architecture and food show better representation than people and events
4. **Editing Consistency**: Progressive editing maintains cultural consistency differently across models

### Visualization Outputs

- **Individual Model Charts**: 13 cultural + 6 general charts per model (5 models total)
- **Multi-Model Comparison**: Cross-model performance comparison charts
- **Summary Charts**: Core metrics overview and insights
- **Organized Structure**: Clean separation of scripts and results in `evaluation/analysis/`

#### Analysis Structure
```
evaluation/analysis/
├── scripts/           # All analysis scripts
├── results/          # All generated charts
│   ├── individual/   # Individual model results (5 models × 2 types)
│   ├── comparison/   # Multi-model comparison charts
│   └── summary/      # Summary and overview charts
```

## 🤝 Contributing

Contributions welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Areas for Contribution
- Additional cultural knowledge sources
- New evaluation metrics
- Model integration
- Visualization improvements
- Survey interface enhancements

## 📚 Citation

If you use ECB in your research, please cite:

```bibtex
@inproceedings{ecb2024,
  title={Exposing Cultural Blindspots: A Structured Audit of Generative Image Models},
  author={[Author Names]},
  booktitle={Proceedings of IASEAI 2026},
  year={2024}
}
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Cultural knowledge sources from international organizations
- Open-source model providers (FLUX, Stable Diffusion, Qwen)
- Human evaluation participants
- Academic collaborators and reviewers

## 📞 Contact

For questions, issues, or collaboration:

- 📧 Email: [contact@ecb-project.org]
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/ecb/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-org/ecb/discussions)

---

**Evaluation Cultural Bias: Making Cultural Representation Visible, Measurable, and Improvable** 🌍
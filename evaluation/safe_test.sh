#!/bin/bash
# Safe Cultural Metric Runner (Memory Optimized)

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}🔧 Safe Cultural Metric Runner (Memory Optimized)${NC}"
echo ""

# Basic Settings (Memory Safe)
MODEL="${1:-hidream}"
MAX_SAMPLES="${2:-50}"
MEMORY_MODE="${3:---load-in-8bit}"

echo -e "${YELLOW}⚙️ Safe Settings:${NC}"
echo "  Model: $MODEL"
echo "  Max Samples: $MAX_SAMPLES"
echo "  Memory Mode: $MEMORY_MODE"
echo "  Enhanced Pipeline"
echo "  Checkpoint: Save every 3"
echo ""

# GPU Memory Cleanup
if command -v nvidia-smi &> /dev/null; then
    echo -e "${YELLOW}🧹 Cleaning GPU memory...${NC}"
    python3 -c "
import torch
if torch.cuda.is_available():
    torch.cuda.empty_cache()
    print(f'GPU memory cleanup completed')
"
fi

# CUDA Environment Variables (Prevent Memory Fragmentation)
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
export CUDA_LAUNCH_BLOCKING=0

# Check CSV File
CSV_FILE="$SCRIPT_DIR/../dataset/$MODEL/prompt-img-path.csv"

if [[ ! -f "$CSV_FILE" ]]; then
    echo -e "${RED}❌ CSV file not found: $CSV_FILE${NC}"
    echo ""
    echo "Available models:"
    ls "$SCRIPT_DIR/../dataset/" | grep -v ".DS_Store" || echo "  Dataset folder not found"
    exit 1
fi

# Create Output Directory
mkdir -p "$SCRIPT_DIR/outputs/$MODEL"

# Safe Execution
echo -e "${GREEN}🚀 Running in safe mode...${NC}"

cd "$SCRIPT_DIR/cultural_metric"

python3 enhanced_cultural_metric_pipeline.py \
    --input-csv "$CSV_FILE" \
    --image-root "$SCRIPT_DIR/../dataset" \
    --summary-csv "$SCRIPT_DIR/outputs/$MODEL/safe_cultural_summary.csv" \
    --detail-csv "$SCRIPT_DIR/outputs/$MODEL/safe_cultural_detail.csv" \
    --index-dir "./vector_store" \
    --debug \
    --max-questions 4 \
    --min-questions 2 \
    --save-frequency 3 \
    --batch-size 1 \
    --resume \
    --max-samples $MAX_SAMPLES \
    $MEMORY_MODE

# Check Results
echo ""
if [[ -f "$SCRIPT_DIR/outputs/$MODEL/safe_cultural_summary.csv" ]]; then
    RESULTS=$(tail -n +2 "$SCRIPT_DIR/outputs/$MODEL/safe_cultural_summary.csv" | wc -l)
    echo -e "${GREEN}✅ Success! Processed samples: $RESULTS${NC}"

    echo ""
    echo "First 5 results:"
    head -n 6 "$SCRIPT_DIR/outputs/$MODEL/safe_cultural_summary.csv" | cut -d',' -f1,3,8-11 | column -t -s ','

    echo ""
    echo -e "${BLUE}📈 F1 Score Summary:${NC}"
    tail -n +2 "$SCRIPT_DIR/outputs/$MODEL/safe_cultural_summary.csv" | cut -d',' -f11 | awk '{sum+=$1; count++} END {if(count>0) printf "Average F1: %.3f\n", sum/count}'
else
    echo -e "${RED}❌ Result file creation failed${NC}"
fi

# Cleanup (No separate CSV file creation, so nothing to clean up)

# GPU Memory Status Check
if command -v nvidia-smi &> /dev/null; then
    echo ""
    echo -e "${BLUE}🖥️ Final GPU Status:${NC}"
    nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits | awk -F, '{printf "Used: %dMB / %dMB (%.1f%%)\n", $1, $2, ($1/$2)*100}'
fi

echo ""
echo -e "${YELLOW}💡 Full execution:${NC}"
echo "  ./run_cultural_enhanced.sh -8 -m $MODEL"
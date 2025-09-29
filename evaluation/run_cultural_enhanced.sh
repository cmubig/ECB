#!/bin/bash
# Enhanced Cultural Metric Evaluation Runner
# Execute cultural metric evaluation with convenient options.

set -euo pipefail

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Icons
ROCKET="🚀"
CHECK="✅"
WARNING="⚠️"
ERROR="❌"
GEAR="⚙️"
CHART="📊"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Basic Settings
PYTHON_EXEC="${PYTHON_EXEC:-python3}"
QUESTION_MODEL="${QUESTION_MODEL:-Qwen/Qwen2.5-0.5B-Instruct}"
VLM_MODEL="${VLM_MODEL:-Qwen/Qwen2-VL-7B-Instruct}"
MODELS=""
RESUME="true"
ENHANCED="true"
DEBUG=""
FORCE=""
MEMORY_MODE=""
SAVE_FREQ="5"

# Show Usage
show_usage() {
    echo -e "${BLUE}${ROCKET} Enhanced Cultural Metric Evaluation Runner${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 [options] [models...]"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  -h, --help           Show this help message"
    echo "  -m, --models         Specify models to evaluate (flux, hidream, sd35, qwen, dalle3)"
    echo "  -d, --debug          Enable debug mode"
    echo "  -f, --force          Force recalculation ignoring existing results"
    echo "  -r, --no-resume      Disable checkpoint resume"
    echo "  -l, --legacy         Use legacy pipeline (instead of Enhanced)"
    echo "  -8, --8bit           Save memory with 8bit quantization"
    echo "  -4, --4bit           Save more memory with 4bit quantization"
    echo "  -s, --save-freq N    Save checkpoint every N samples (default: 5)"
    echo "  -q, --quick          Quick test (minimum questions)"
    echo "  --status             Check current progress"
    echo "  --clean              Delete checkpoints"
    echo "  --monitor            Real-time monitoring mode"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0                          # Evaluate all models"
    echo "  $0 -m flux hidream          # Evaluate only flux, hidream"
    echo "  $0 -d -m flux               # Debug mode for flux"
    echo "  $0 -f --no-resume           # Force restart from beginning"
    echo "  $0 -8 -s 10                 # 8bit mode, save every 10 samples"
    echo "  $0 --status                 # Check progress only"
    echo "  $0 --clean                  # Reset checkpoints"
}

# Check Progress
check_status() {
    echo -e "${BLUE}${CHART} Check Current Progress${NC}"
    
    CHECKPOINT_DIR="$SCRIPT_DIR/cultural_metric/checkpoints"
    if [[ ! -d "$CHECKPOINT_DIR" ]]; then
        echo -e "${YELLOW}${WARNING} Checkpoint directory not found: $CHECKPOINT_DIR${NC}"
        return
    fi
    
    CHECKPOINTS=$(find "$CHECKPOINT_DIR" -name "*_checkpoint.pkl" 2>/dev/null || true)
    if [[ -z "$CHECKPOINTS" ]]; then
        echo -e "${YELLOW}${WARNING} No active checkpoints.${NC}"
        echo "  All tasks completed or not yet started."
        return
    fi
    
    echo -e "${GREEN}Active checkpoints:${NC}"
    for checkpoint in $CHECKPOINTS; do
        model_name=$(basename "$checkpoint" "_checkpoint.pkl")
        echo -e "  ${CYAN}$model_name${NC}: $(ls -lh "$checkpoint" | awk '{print $5, $6, $7, $8}')"
        
        # Check checkpoint details with Python
        if command -v python3 &> /dev/null; then
            python3 -c "
import pickle
import sys
try:
    with open('$checkpoint', 'rb') as f:
        data = pickle.load(f)
    completed = len(data.completed_samples)
    total = data.total_samples
    current = getattr(data, 'current_index', completed)
    progress = (completed / total * 100) if total > 0 else 0
    print(f'    Completed: {completed}/{total} ({progress:.1f}%) | Current: {current}')
except Exception as e:
    print(f'    Status check failed: {e}')
" 2>/dev/null || echo "    Status check unavailable"
        fi
    done
}

# Clean Checkpoints
clean_checkpoints() {
    echo -e "${YELLOW}${WARNING} Cleaning checkpoints${NC}"
    
    CHECKPOINT_DIR="$SCRIPT_DIR/cultural_metric/checkpoints"
    if [[ ! -d "$CHECKPOINT_DIR" ]]; then
        echo -e "${GREEN}${CHECK} No checkpoints to clean.${NC}"
        return
    fi
    
    CHECKPOINTS=$(find "$CHECKPOINT_DIR" -name "*_checkpoint.pkl" 2>/dev/null || true)
    if [[ -z "$CHECKPOINTS" ]]; then
        echo -e "${GREEN}${CHECK} No checkpoints to clean.${NC}"
        return
    fi
    
    echo "Checkpoints to delete:"
    for checkpoint in $CHECKPOINTS; do
        echo "  - $(basename "$checkpoint")"
    done
    
    read -p "Are you sure you want to delete? [y/N]: " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        rm -f $CHECKPOINTS
        echo -e "${GREEN}${CHECK} Checkpoints deleted.${NC}"
    else
        echo -e "${YELLOW}Cancelled.${NC}"
    fi
}

# Real-time Monitoring
monitor_progress() {
    echo -e "${BLUE}${GEAR} Real-time Monitoring Mode${NC}"
    echo "Exit with Ctrl+C"
    echo ""
    
    OUTPUT_DIR="$SCRIPT_DIR/outputs"
    
    while true; do
        clear
        echo -e "${PURPLE}========================================${NC}"
        echo -e "${BLUE}${ROCKET} Cultural Metric Real-time Monitoring${NC}"
        echo -e "${PURPLE}========================================${NC}"
        echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
        
        # Checkpoint status
        check_status
        echo ""
        
        # Recent result files
        echo -e "${GREEN}Recent result files:${NC}"
        if [[ -d "$OUTPUT_DIR" ]]; then
            find "$OUTPUT_DIR" -name "*cultural_metrics*summary.csv" -newermt "1 hour ago" 2>/dev/null | head -5 | while read -r file; do
                lines=$(wc -l < "$file" 2>/dev/null || echo 0)
                size=$(ls -lh "$file" 2>/dev/null | awk '{print $5}' || echo "?")
                echo "  $(basename "$(dirname "$file")")/$(basename "$file"): $lines lines, $size"
            done
        fi
        
        echo ""
        echo -e "${YELLOW}Refresh in 5 seconds... (Exit with Ctrl+C)${NC}"
        sleep 5
    done
}

# System Check
check_system() {
    echo -e "${BLUE}${GEAR} Checking System Environment${NC}"
    
    # Check Python
    if ! command -v "$PYTHON_EXEC" &> /dev/null; then
        echo -e "${RED}${ERROR} Python not found: $PYTHON_EXEC${NC}"
        exit 1
    fi
    
    # Check GPU
    if command -v nvidia-smi &> /dev/null; then
        echo -e "${GREEN}${CHECK} GPU Status:${NC}"
        nvidia-smi --query-gpu=name,memory.total,memory.used --format=csv,noheader,nounits | head -1 | while IFS=, read -r name total used; do
            echo "  $name: ${used}MB/${total}MB in use"
        done
    else
        echo -e "${YELLOW}${WARNING} nvidia-smi not found. Will run in CPU mode.${NC}"
    fi
    
    # Check Disk Space
    AVAILABLE=$(df "$PROJECT_ROOT" | tail -1 | awk '{print $4}')
    AVAILABLE_GB=$((AVAILABLE / 1024 / 1024))
    if [[ $AVAILABLE_GB -lt 10 ]]; then
        echo -e "${RED}${ERROR} Insufficient disk space: ${AVAILABLE_GB}GB remaining${NC}"
        echo "  At least 10GB required."
        exit 1
    else
        echo -e "${GREEN}${CHECK} Disk space: ${AVAILABLE_GB}GB available${NC}"
    fi
}

# Parse Parameters
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -m|--models)
            shift
            while [[ $# -gt 0 && ! "$1" =~ ^- ]]; do
                MODELS="$MODELS $1"
                shift
            done
            ;;
        -d|--debug)
            DEBUG="1"
            shift
            ;;
        -f|--force)
            FORCE="--force"
            shift
            ;;
        -r|--no-resume)
            RESUME="false"
            shift
            ;;
        -l|--legacy)
            ENHANCED="false"
            shift
            ;;
        -8|--8bit)
            MEMORY_MODE="--load-in-8bit"
            shift
            ;;
        -4|--4bit)
            MEMORY_MODE="--load-in-4bit"
            shift
            ;;
        -s|--save-freq)
            SAVE_FREQ="$2"
            shift 2
            ;;
        -q|--quick)
            export MIN_QUESTIONS=2
            export MAX_QUESTIONS=4
            shift
            ;;
        --status)
            check_status
            exit 0
            ;;
        --clean)
            clean_checkpoints
            exit 0
            ;;
        --monitor)
            monitor_progress
            exit 0
            ;;
        *)
            # Treat as model name
            MODELS="$MODELS $1"
            shift
            ;;
    esac
done

# Main Execution
main() {
    echo -e "${BLUE}${ROCKET} Enhanced Cultural Metric Evaluation${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    # System Check
    check_system
    echo ""
    
    # Print Settings
    echo -e "${YELLOW}${GEAR} Execution Settings:${NC}"
    echo "  Project Root: $PROJECT_ROOT"
    echo "  Python: $PYTHON_EXEC"
    echo "  Question Model: $QUESTION_MODEL"
    echo "  VLM Model: $VLM_MODEL"
    echo "  Pipeline: $([ "$ENHANCED" = "true" ] && echo "Enhanced" || echo "Legacy")"
    echo "  Checkpoint Resume: $([ "$RESUME" = "true" ] && echo "Enabled" || echo "Disabled")"
    echo "  Memory Mode: ${MEMORY_MODE:-Default}"
    echo "  Save Frequency: Every ${SAVE_FREQ} samples"
    if [[ -n "$MODELS" ]]; then
        echo "  Target Models:$MODELS"
    else
        echo "  Target Models: All"
    fi
    echo ""
    
    # Set Environment Variables
    export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
    export CUDA_LAUNCH_BLOCKING=0
    
    if [[ "$DEBUG" = "1" ]]; then
        export CULTURAL_DEBUG=1
        echo -e "${YELLOW}${WARNING} Debug mode enabled${NC}"
    fi
    
    # Build Execution Command
    CMD=("$PYTHON_EXEC" "$SCRIPT_DIR/cultural_metric/enhanced_cultural_metric_pipeline.py")
    
    # Execute Each Model Individually
    DATASET_ROOT="$SCRIPT_DIR/../dataset"
    AVAILABLE_MODELS=($(find "$DATASET_ROOT" -name "prompt-img-path.csv" -exec dirname {} \; | xargs -n1 basename | sort))
    
    if [[ -n "$MODELS" ]]; then
        # Execute Specified Models Only
        for model in $MODELS; do
            if [[ ! -f "$DATASET_ROOT/$model/prompt-img-path.csv" ]]; then
                echo -e "${RED}${ERROR} CSV file for model $model not found: $DATASET_ROOT/$model/prompt-img-path.csv${NC}"
                continue
            fi

            echo -e "${GREEN}${ROCKET} Running $model model...${NC}"

            # Create Output Directory
            mkdir -p "$SCRIPT_DIR/outputs/$model"

            # Execute Each Model
            MODEL_CMD=("${CMD[@]}")
            MODEL_CMD+=("--input-csv" "$DATASET_ROOT/$model/prompt-img-path.csv")
            MODEL_CMD+=("--image-root" "$DATASET_ROOT")
            MODEL_CMD+=("--summary-csv" "$SCRIPT_DIR/outputs/$model/cultural_summary.csv")
            MODEL_CMD+=("--detail-csv" "$SCRIPT_DIR/outputs/$model/cultural_detail.csv")
            MODEL_CMD+=("--index-dir" "$SCRIPT_DIR/cultural_metric/vector_store")
            MODEL_CMD+=("--checkpoint-dir" "$SCRIPT_DIR/cultural_metric/checkpoints")
            
            # Add options
            if [[ "$RESUME" = "true" ]]; then
                MODEL_CMD+=("--resume")
            fi
            
            MODEL_CMD+=("--batch-size" "1")
            MODEL_CMD+=("--save-frequency" "$SAVE_FREQ")
            
            if [[ -n "$MEMORY_MODE" ]]; then
                MODEL_CMD+=("$MEMORY_MODE")
            fi
            
            if [[ "$DEBUG" = "1" ]]; then
                MODEL_CMD+=("--debug")
            fi
            
            # Execute
            if "${MODEL_CMD[@]}"; then
                echo -e "${GREEN}${CHECK} $model model completed${NC}"
            else
                echo -e "${RED}${ERROR} $model model failed${NC}"
            fi
            
            echo ""
        done
    else
        # Execute All Available Models
        echo -e "${BLUE}Available models: ${AVAILABLE_MODELS[*]}${NC}"

        for model in "${AVAILABLE_MODELS[@]}"; do
            echo -e "${GREEN}${ROCKET} Running $model model...${NC}"

            # Create Output Directory
            mkdir -p "$SCRIPT_DIR/outputs/$model"
            
            # Execute Each Model
            MODEL_CMD=("${CMD[@]}")
            MODEL_CMD+=("--input-csv" "$DATASET_ROOT/$model/prompt-img-path.csv")
            MODEL_CMD+=("--image-root" "$DATASET_ROOT")
            MODEL_CMD+=("--summary-csv" "$SCRIPT_DIR/outputs/$model/cultural_summary.csv")
            MODEL_CMD+=("--detail-csv" "$SCRIPT_DIR/outputs/$model/cultural_detail.csv")
            MODEL_CMD+=("--index-dir" "$SCRIPT_DIR/cultural_metric/vector_store")
            MODEL_CMD+=("--checkpoint-dir" "$SCRIPT_DIR/cultural_metric/checkpoints")
            
            # Add options
            if [[ "$RESUME" = "true" ]]; then
                MODEL_CMD+=("--resume")
            fi
            
            MODEL_CMD+=("--batch-size" "1")
            MODEL_CMD+=("--save-frequency" "$SAVE_FREQ")
            
            if [[ -n "$MEMORY_MODE" ]]; then
                MODEL_CMD+=("$MEMORY_MODE")
            fi
            
            if [[ "$DEBUG" = "1" ]]; then
                MODEL_CMD+=("--debug")
            fi
            
            # Execute
            if "${MODEL_CMD[@]}"; then
                echo -e "${GREEN}${CHECK} $model model completed${NC}"
            else
                echo -e "${RED}${ERROR} $model model failed${NC}"
            fi
            
            echo ""
        done
    fi
}

# Interrupt Handling
trap 'echo -e "\n${YELLOW}${WARNING} Evaluation interrupted. Checkpoints saved and can be resumed.${NC}"; exit 130' INT

# Main Execution
main
#!/bin/bash
# Enhanced Cultural Metric Evaluation Runner
# 편리한 옵션들과 함께 문화 메트릭 평가를 실행합니다.

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 아이콘
ROCKET="🚀"
CHECK="✅"
WARNING="⚠️"
ERROR="❌"
GEAR="⚙️"
CHART="📊"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 기본 설정
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

# 사용법 출력
show_usage() {
    echo -e "${BLUE}${ROCKET} Enhanced Cultural Metric Evaluation Runner${NC}"
    echo ""
    echo -e "${YELLOW}사용법:${NC}"
    echo "  $0 [옵션] [모델...]"
    echo ""
    echo -e "${YELLOW}옵션:${NC}"
    echo "  -h, --help           이 도움말 표시"
    echo "  -m, --models         평가할 모델 지정 (flux, hidream, sd35, qwen, dalle3)"
    echo "  -d, --debug          디버그 모드 활성화"
    echo "  -f, --force          기존 결과 무시하고 강제 재계산"
    echo "  -r, --no-resume      체크포인트 재시작 비활성화"
    echo "  -l, --legacy         기존 파이프라인 사용 (Enhanced 대신)"
    echo "  -8, --8bit           8bit 양자화로 메모리 절약"
    echo "  -4, --4bit           4bit 양자화로 더 많은 메모리 절약"
    echo "  -s, --save-freq N    N개 샘플마다 체크포인트 저장 (기본: 5)"
    echo "  -q, --quick          빠른 테스트 (최소 질문 수)"
    echo "  --status             현재 진행상황 확인"
    echo "  --clean              체크포인트 삭제"
    echo "  --monitor            실시간 모니터링 모드"
    echo ""
    echo -e "${YELLOW}예제:${NC}"
    echo "  $0                          # 모든 모델 평가"
    echo "  $0 -m flux hidream          # flux, hidream만 평가"
    echo "  $0 -d -m flux               # flux 디버그 모드"
    echo "  $0 -f --no-resume           # 처음부터 강제 재시작"
    echo "  $0 -8 -s 10                 # 8bit 모드, 10개마다 저장"
    echo "  $0 --status                 # 진행상황만 확인"
    echo "  $0 --clean                  # 체크포인트 초기화"
}

# 진행상황 확인
check_status() {
    echo -e "${BLUE}${CHART} 현재 진행상황 확인${NC}"
    
    CHECKPOINT_DIR="$SCRIPT_DIR/cultural_metric/checkpoints"
    if [[ ! -d "$CHECKPOINT_DIR" ]]; then
        echo -e "${YELLOW}${WARNING} 체크포인트 디렉토리가 없습니다: $CHECKPOINT_DIR${NC}"
        return
    fi
    
    CHECKPOINTS=$(find "$CHECKPOINT_DIR" -name "*_checkpoint.pkl" 2>/dev/null || true)
    if [[ -z "$CHECKPOINTS" ]]; then
        echo -e "${YELLOW}${WARNING} 활성 체크포인트가 없습니다.${NC}"
        echo "  모든 작업이 완료되었거나 아직 시작되지 않았습니다."
        return
    fi
    
    echo -e "${GREEN}활성 체크포인트:${NC}"
    for checkpoint in $CHECKPOINTS; do
        model_name=$(basename "$checkpoint" "_checkpoint.pkl")
        echo -e "  ${CYAN}$model_name${NC}: $(ls -lh "$checkpoint" | awk '{print $5, $6, $7, $8}')"
        
        # Python으로 체크포인트 상세 정보 확인
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
    print(f'    완료: {completed}/{total} ({progress:.1f}%) | 현재: {current}')
except Exception as e:
    print(f'    상태 확인 실패: {e}')
" 2>/dev/null || echo "    상태 확인 불가"
        fi
    done
}

# 체크포인트 정리
clean_checkpoints() {
    echo -e "${YELLOW}${WARNING} 체크포인트 정리${NC}"
    
    CHECKPOINT_DIR="$SCRIPT_DIR/cultural_metric/checkpoints"
    if [[ ! -d "$CHECKPOINT_DIR" ]]; then
        echo -e "${GREEN}${CHECK} 정리할 체크포인트가 없습니다.${NC}"
        return
    fi
    
    CHECKPOINTS=$(find "$CHECKPOINT_DIR" -name "*_checkpoint.pkl" 2>/dev/null || true)
    if [[ -z "$CHECKPOINTS" ]]; then
        echo -e "${GREEN}${CHECK} 정리할 체크포인트가 없습니다.${NC}"
        return
    fi
    
    echo "삭제할 체크포인트들:"
    for checkpoint in $CHECKPOINTS; do
        echo "  - $(basename "$checkpoint")"
    done
    
    read -p "정말 삭제하시겠습니까? [y/N]: " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        rm -f $CHECKPOINTS
        echo -e "${GREEN}${CHECK} 체크포인트가 삭제되었습니다.${NC}"
    else
        echo -e "${YELLOW}취소되었습니다.${NC}"
    fi
}

# 실시간 모니터링
monitor_progress() {
    echo -e "${BLUE}${GEAR} 실시간 모니터링 모드${NC}"
    echo "Ctrl+C로 종료"
    echo ""
    
    OUTPUT_DIR="$SCRIPT_DIR/outputs"
    
    while true; do
        clear
        echo -e "${PURPLE}========================================${NC}"
        echo -e "${BLUE}${ROCKET} Cultural Metric 실시간 모니터링${NC}"
        echo -e "${PURPLE}========================================${NC}"
        echo "시간: $(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
        
        # 체크포인트 상태
        check_status
        echo ""
        
        # 최근 결과 파일들
        echo -e "${GREEN}최근 결과 파일:${NC}"
        if [[ -d "$OUTPUT_DIR" ]]; then
            find "$OUTPUT_DIR" -name "*cultural_metrics*summary.csv" -newermt "1 hour ago" 2>/dev/null | head -5 | while read -r file; do
                lines=$(wc -l < "$file" 2>/dev/null || echo 0)
                size=$(ls -lh "$file" 2>/dev/null | awk '{print $5}' || echo "?")
                echo "  $(basename "$(dirname "$file")")/$(basename "$file"): $lines lines, $size"
            done
        fi
        
        echo ""
        echo -e "${YELLOW}5초 후 새로고침... (Ctrl+C로 종료)${NC}"
        sleep 5
    done
}

# 시스템 체크
check_system() {
    echo -e "${BLUE}${GEAR} 시스템 환경 확인${NC}"
    
    # Python 확인
    if ! command -v "$PYTHON_EXEC" &> /dev/null; then
        echo -e "${RED}${ERROR} Python을 찾을 수 없습니다: $PYTHON_EXEC${NC}"
        exit 1
    fi
    
    # GPU 확인
    if command -v nvidia-smi &> /dev/null; then
        echo -e "${GREEN}${CHECK} GPU 상태:${NC}"
        nvidia-smi --query-gpu=name,memory.total,memory.used --format=csv,noheader,nounits | head -1 | while IFS=, read -r name total used; do
            echo "  $name: ${used}MB/${total}MB 사용중"
        done
    else
        echo -e "${YELLOW}${WARNING} nvidia-smi를 찾을 수 없습니다. CPU 모드로 실행됩니다.${NC}"
    fi
    
    # 디스크 공간 확인
    AVAILABLE=$(df "$PROJECT_ROOT" | tail -1 | awk '{print $4}')
    AVAILABLE_GB=$((AVAILABLE / 1024 / 1024))
    if [[ $AVAILABLE_GB -lt 10 ]]; then
        echo -e "${RED}${ERROR} 디스크 공간 부족: ${AVAILABLE_GB}GB 남음${NC}"
        echo "  최소 10GB 이상 필요합니다."
        exit 1
    else
        echo -e "${GREEN}${CHECK} 디스크 공간: ${AVAILABLE_GB}GB 사용 가능${NC}"
    fi
}

# 매개변수 파싱
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
            # 모델명으로 취급
            MODELS="$MODELS $1"
            shift
            ;;
    esac
done

# 메인 실행
main() {
    echo -e "${BLUE}${ROCKET} Enhanced Cultural Metric Evaluation${NC}"
    echo -e "${PURPLE}========================================${NC}"
    
    # 시스템 체크
    check_system
    echo ""
    
    # 설정 출력
    echo -e "${YELLOW}${GEAR} 실행 설정:${NC}"
    echo "  프로젝트 루트: $PROJECT_ROOT"
    echo "  Python: $PYTHON_EXEC"
    echo "  질문 모델: $QUESTION_MODEL"
    echo "  VLM 모델: $VLM_MODEL"
    echo "  파이프라인: $([ "$ENHANCED" = "true" ] && echo "Enhanced" || echo "Legacy")"
    echo "  체크포인트 재시작: $([ "$RESUME" = "true" ] && echo "활성화" || echo "비활성화")"
    echo "  메모리 모드: ${MEMORY_MODE:-기본}"
    echo "  저장 빈도: ${SAVE_FREQ}개 샘플마다"
    if [[ -n "$MODELS" ]]; then
        echo "  대상 모델:$MODELS"
    else
        echo "  대상 모델: 전체"
    fi
    echo ""
    
    # 환경변수 설정
    export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
    export CUDA_LAUNCH_BLOCKING=0
    
    if [[ "$DEBUG" = "1" ]]; then
        export CULTURAL_DEBUG=1
        echo -e "${YELLOW}${WARNING} 디버그 모드 활성화${NC}"
    fi
    
    # 실행 명령 구성
    CMD=("$PYTHON_EXEC" "$SCRIPT_DIR/cultural_metric/enhanced_cultural_metric_pipeline.py")
    
    # 각 모델별로 개별 실행
    DATASET_ROOT="$SCRIPT_DIR/../dataset"
    AVAILABLE_MODELS=($(find "$DATASET_ROOT" -name "prompt-img-path.csv" -exec dirname {} \; | xargs -n1 basename | sort))
    
    if [[ -n "$MODELS" ]]; then
        # 지정된 모델들만 실행
        for model in $MODELS; do
            if [[ ! -f "$DATASET_ROOT/$model/prompt-img-path.csv" ]]; then
                echo -e "${RED}${ERROR} 모델 $model의 CSV 파일을 찾을 수 없습니다: $DATASET_ROOT/$model/prompt-img-path.csv${NC}"
                continue
            fi
            
            echo -e "${GREEN}${ROCKET} $model 모델 실행 중...${NC}"
            
            # 출력 디렉토리 생성
            mkdir -p "$SCRIPT_DIR/outputs/$model"
            
            # 각 모델별 실행
            MODEL_CMD=("${CMD[@]}")
            MODEL_CMD+=("--input-csv" "$DATASET_ROOT/$model/prompt-img-path.csv")
            MODEL_CMD+=("--image-root" "$DATASET_ROOT")
            MODEL_CMD+=("--summary-csv" "$SCRIPT_DIR/outputs/$model/cultural_summary.csv")
            MODEL_CMD+=("--detail-csv" "$SCRIPT_DIR/outputs/$model/cultural_detail.csv")
            MODEL_CMD+=("--index-dir" "$SCRIPT_DIR/cultural_metric/vector_store")
            MODEL_CMD+=("--checkpoint-dir" "$SCRIPT_DIR/cultural_metric/checkpoints")
            
            # 옵션 추가
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
            
            # 실행
            if "${MODEL_CMD[@]}"; then
                echo -e "${GREEN}${CHECK} $model 모델 완료${NC}"
            else
                echo -e "${RED}${ERROR} $model 모델 실패${NC}"
            fi
            
            echo ""
        done
    else
        # 모든 사용 가능한 모델 실행
        echo -e "${BLUE}사용 가능한 모델: ${AVAILABLE_MODELS[*]}${NC}"
        
        for model in "${AVAILABLE_MODELS[@]}"; do
            echo -e "${GREEN}${ROCKET} $model 모델 실행 중...${NC}"
            
            # 출력 디렉토리 생성
            mkdir -p "$SCRIPT_DIR/outputs/$model"
            
            # 각 모델별 실행
            MODEL_CMD=("${CMD[@]}")
            MODEL_CMD+=("--input-csv" "$DATASET_ROOT/$model/prompt-img-path.csv")
            MODEL_CMD+=("--image-root" "$DATASET_ROOT")
            MODEL_CMD+=("--summary-csv" "$SCRIPT_DIR/outputs/$model/cultural_summary.csv")
            MODEL_CMD+=("--detail-csv" "$SCRIPT_DIR/outputs/$model/cultural_detail.csv")
            MODEL_CMD+=("--index-dir" "$SCRIPT_DIR/cultural_metric/vector_store")
            MODEL_CMD+=("--checkpoint-dir" "$SCRIPT_DIR/cultural_metric/checkpoints")
            
            # 옵션 추가
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
            
            # 실행
            if "${MODEL_CMD[@]}"; then
                echo -e "${GREEN}${CHECK} $model 모델 완료${NC}"
            else
                echo -e "${RED}${ERROR} $model 모델 실패${NC}"
            fi
            
            echo ""
        done
    fi
}

# 인터럽트 처리
trap 'echo -e "\n${YELLOW}${WARNING} 평가가 중단되었습니다. 체크포인트가 저장되어 재시작 가능합니다.${NC}"; exit 130' INT

# 메인 실행
main
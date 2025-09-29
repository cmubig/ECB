#!/bin/bash
# 안전한 Cultural Metric 실행 스크립트 (메모리 최적화)

set -euo pipefail

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}🔧 Safe Cultural Metric Runner (메모리 최적화)${NC}"
echo ""

# 기본 설정 (메모리 안전)
MODEL="${1:-hidream}"
MAX_SAMPLES="${2:-50}"
MEMORY_MODE="${3:---load-in-8bit}"

echo -e "${YELLOW}⚙️ 안전 설정:${NC}"
echo "  모델: $MODEL"
echo "  최대 샘플: $MAX_SAMPLES"
echo "  메모리 모드: $MEMORY_MODE"
echo "  Enhanced 파이프라인"
echo "  체크포인트: 3개마다 저장"
echo ""

# GPU 메모리 정리
if command -v nvidia-smi &> /dev/null; then
    echo -e "${YELLOW}🧹 GPU 메모리 정리 중...${NC}"
    python3 -c "
import torch
if torch.cuda.is_available():
    torch.cuda.empty_cache()
    print(f'GPU 메모리 정리 완료')
"
fi

# CUDA 환경변수 설정 (메모리 단편화 방지)
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
export CUDA_LAUNCH_BLOCKING=0

# CSV 파일 확인
CSV_FILE="$SCRIPT_DIR/../dataset/$MODEL/prompt-img-path.csv"

if [[ ! -f "$CSV_FILE" ]]; then
    echo -e "${RED}❌ CSV 파일을 찾을 수 없습니다: $CSV_FILE${NC}"
    echo ""
    echo "사용 가능한 모델들:"
    ls "$SCRIPT_DIR/../dataset/" | grep -v ".DS_Store" || echo "  데이터셋 폴더가 없습니다"
    exit 1
fi

# 출력 디렉토리 생성
mkdir -p "$SCRIPT_DIR/outputs/$MODEL"

# 안전한 실행
echo -e "${GREEN}🚀 안전 모드로 실행...${NC}"

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

# 결과 확인
echo ""
if [[ -f "$SCRIPT_DIR/outputs/$MODEL/safe_cultural_summary.csv" ]]; then
    RESULTS=$(tail -n +2 "$SCRIPT_DIR/outputs/$MODEL/safe_cultural_summary.csv" | wc -l)
    echo -e "${GREEN}✅ 성공! 처리된 샘플: $RESULTS${NC}"
    
    echo ""
    echo "처음 5개 결과:"
    head -n 6 "$SCRIPT_DIR/outputs/$MODEL/safe_cultural_summary.csv" | cut -d',' -f1,3,8-11 | column -t -s ','
    
    echo ""
    echo -e "${BLUE}📈 F1 점수 요약:${NC}"
    tail -n +2 "$SCRIPT_DIR/outputs/$MODEL/safe_cultural_summary.csv" | cut -d',' -f11 | awk '{sum+=$1; count++} END {if(count>0) printf "평균 F1: %.3f\n", sum/count}'
else
    echo -e "${RED}❌ 결과 파일 생성 실패${NC}"
fi

# 정리 (별도 CSV 파일 생성하지 않으므로 정리할 것 없음)

# GPU 메모리 상태 확인
if command -v nvidia-smi &> /dev/null; then
    echo ""
    echo -e "${BLUE}🖥️ 최종 GPU 상태:${NC}"
    nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits | awk -F, '{printf "사용: %dMB / %dMB (%.1f%%)\n", $1, $2, ($1/$2)*100}'
fi

echo ""
echo -e "${YELLOW}💡 전체 실행:${NC}"
echo "  ./run_cultural_enhanced.sh -8 -m $MODEL"
# Cultural Metric Pipeline

이미지 생성 결과가 특정 국가 문화를 얼마나 잘 반영했는지 자동으로 평가하는 RAG 기반 지표입니다. 위키피디아 등에서 모은 PDF를 지식 베이스로 구축한 뒤, 질문 생성 LLM과 오픈소스 VLM을 조합해 예/아니오 검증 질문을 만들고 답변을 받아 점수를 계산합니다.

기본 설정으로는 한 이미지를 대상으로 6~8개의 질문을 만들고, 그 중 최소 2개는 "나타나면 안 되는 요소"를 검사하도록 강제하여 분별력을 높입니다.

## 디렉터리 구조

```
evaluation/cultural_metric/
├── build_cultural_index.py      # PDF → FAISS 지식 베이스 변환 스크립트
├── cultural_metric_pipeline.py  # RAG + VLM 평가 파이프라인
├── legacy/                      # 이전 실험 스크립트 및 결과 보관
├── requirements.txt             # 의존성 목록
├── README.md
└── vector_store/                # (생성됨) FAISS 인덱스 + 메타데이터
```

## 1. 의존성 설치

```bash
cd /Users/chan/Downloads/iaseai26/evaluation/cultural_metric
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

> GPU 서버에서 돌릴 때는 환경에 맞는 `torch` 빌드를 따로 설치하세요.

## 2. 지식 베이스 구축

```bash
python build_cultural_index.py \
  --pdf-dir /Users/chan/Downloads/iaseai26/external_data \
  --out-dir vector_store \
  --model-name sentence-transformers/all-MiniLM-L6-v2
```

`vector_store/` 아래에 `faiss.index`, `metadata.jsonl`, `index_config.json`이 생성됩니다.

## 3. 문화 지표 수동 실행 예시

```bash
python cultural_metric_pipeline.py \
  --input-csv /Users/chan/Downloads/iaseai26/evaluation/generated_csv/qwen/img_paths_standard.csv \
  --image-root /Users/chan/Downloads/iaseai26/dataset \
  --summary-csv /Users/chan/Downloads/iaseai26/evaluation/outputs/qwen/cultural_metrics_manual_summary.csv \
  --detail-csv /Users/chan/Downloads/iaseai26/evaluation/outputs/qwen/cultural_metrics_manual_detail.csv \
  --question-model Qwen/Qwen2.5-0.5B-Instruct \
  --vlm-model Qwen/Qwen2-VL-7B-Instruct \
  --max-questions 8 \
  --min-questions 6 \
  --min-negative 2 \
  --top-k 8 \
  --load-in-8bit \
  --load-in-4bit
```

생성되는 결과:
- `*_summary.csv`: 이미지별 정확도/정밀도/재현율/F1.
- `*_detail.csv`: 질문·기대 정답·VLM 응답·근거 텍스트를 포함한 세부 로그.

보통 `evaluation/run_all_metrics.py` 또는 `./run_evaluation.sh`를 실행하면 이 스크립트를 자동으로 호출해 `evaluation/outputs/<모델>/` 아래에 CSV를 저장합니다.

## 사람 평가와 비교하는 방법

1. `cultural_metrics_*_summary.csv`를 기존 CLIP/Aesthetic/DreamSim/휴먼 평가와 머지.
2. prompt 단위로 F1이 가장 높은/낮은 스텝을 골라 휴먼 Best/Worst와 일치율 계산.
3. Spearman 상관, Top-1 매칭, 오차 사례 분석 등 통계를 정리.
4. 필요 시 `*_detail.csv`에서 반복적으로 틀리는 질문을 찾아 프롬프트나 질의 템플릿을 수정.

## 참고 사항

- VLM이 `AutoProcessor.apply_chat_template`를 지원해야 합니다. 별도 API를 쓰는 모델은 `cultural_metric_pipeline.py`의 `VLMClient` 부분을 교체하세요.
- 다른 임베딩 모델을 쓰고 싶다면 `build_cultural_index.py` 실행 시 `--model-name`을 변경하고, 생성된 `index_config.json`을 함께 보관하세요.
- `legacy/` 폴더에는 0926 실험용 통합 스크립트, 분석 스크립트, 예전 결과 CSV가 보관되어 있습니다. 필요하면 참조하고, 신규 파이프라인과는 독립적으로 유지됩니다.

행복한 평가 되세요!

# IASEAI26 Analysis Scripts

이 디렉토리에는 다양한 이미지 생성 모델(Flux, HiDream, Qwen)의 성능을 분석하는 스크립트들이 포함되어 있습니다. 체계적인 폴더 구조로 관리되며, 사용하기 쉬운 통합 실행 인터페이스를 제공합니다.

## 📁 폴더 구조

```
analysis/
├── core/                    # 핵심 분석 스크립트
│   ├── core_metrics.py      # 기본 메트릭 분석
│   └── summary_heatmap.py   # 요약 히트맵 생성
├── single_model/            # 단일 모델 분석 스크립트
│   ├── single_model_cultural.py    # 단일 모델 문화적 분석
│   └── single_model_general.py     # 단일 모델 일반 분석
├── multi_model_cultural_analysis.py    # 다중 모델 문화적 비교
├── multi_model_general_analysis.py     # 다중 모델 일반 비교
├── run_analysis.py          # 통합 실행 인터페이스
└── README.md               # 이 문서
```

### 📂 상세 설명

#### `core/` - 핵심 분석 스크립트
- **core_metrics.py**: 모든 모델의 기본 메트릭 분석 (베스트 스텝, 국가별 성능 등)
- **summary_heatmap.py**: 모든 모델의 요약 히트맵 생성

#### `single_model/` - 단일 모델 분석 스크립트
- **single_model_cultural.py**: 특정 모델의 문화적 메트릭 분석
- **single_model_general.py**: 특정 모델의 일반 메트릭 분석

#### 루트 레벨 스크립트
- **multi_model_*.py**: 다중 모델 비교 분석
- **run_analysis.py**: 모든 분석을 통합 실행하는 메인 인터페이스

## 🚀 사용법

### 1. 통합 실행 (권장)

```bash
# 모든 분석을 한 번에 실행
python3 run_analysis.py

# 특정 유형의 분석만 실행
python3 run_analysis.py --analysis-type single --single-type cultural --models flux qwen
python3 run_analysis.py --analysis-type multi
python3 run_analysis.py --analysis-type core
```

### 2. 개별 스크립트 실행

```bash
# 단일 모델 분석
python3 single_model/single_model_cultural.py flux
python3 single_model/single_model_general.py hidream

# 핵심 분석
python3 core/core_metrics.py
python3 core/summary_heatmap.py

# 다중 모델 비교
python3 multi_model_cultural_analysis.py
python3 multi_model_general_analysis.py
```

### 3. 명령줄 옵션

```bash
python3 run_analysis.py --help

# 사용 가능한 옵션:
# --models: 분석할 모델들 (기본값: flux hidream qwen)
# --analysis-type: 분석 유형 (all, single, multi, core)
# --single-type: 단일 모델 분석 유형 (cultural, general)
```

## 📊 출력 결과

### 개별 모델 분석 결과
- `<model_name>_cultural_charts/` - 문화적 메트릭 시각화 (13개 차트)
- `<model_name>_general_charts/` - 일반 메트릭 시각화 (6개 차트)

### 다중 모델 비교 결과
- `multi_model_cultural_charts/` - 문화적 메트릭 비교 시각화
- `multi_model_general_charts/` - 일반 메트릭 비교 시각화

### 요약 분석 결과
- `charts/` - 기본 메트릭 분석 시각화

## 🔧 요구사항

- Python 3.8+
- pandas
- matplotlib
- seaborn
- numpy

## 📝 분석 내용

### 문화적 메트릭 분석 (Cultural Metrics)
- 국가별 성능 분석 및 편향 검출
- 카테고리별 성능 분석
- 단계별 성능 분석
- 이미지 품질 메트릭 (문화적 대표성, 프롬프트 정렬도)
- 문화적 편향 분석

### 일반 메트릭 분석 (General Metrics)
- CLIP 스코어 분석 (이미지-텍스트 유사도)
- Aesthetic 스코어 분석 (미적 품질)
- 최적 스텝 분석
- 카테고리별 성능 비교
- 국가별 성능 비교

## 🎯 주요 기능

1. **모델별 분석**: 각 모델의 강점과 약점 파악
2. **다중 모델 비교**: 모델 간 상대적 성능 비교
3. **시각화**: 20+ 종류의 차트와 히트맵 생성
4. **자동화**: 통합 실행 인터페이스 제공
5. **유연성**: 새로운 모델 추가가 용이한 구조

## 📈 분석 결과 해석

### 성능 메트릭
- **CLIP Score**: 이미지와 텍스트 간 유사도 (높을수록 좋음, 0-100)
- **Aesthetic Score**: 이미지의 미적 품질 (높을수록 좋음, 1-10)
- **Cultural Representative**: 문화적 대표성 점수 (1-5)
- **Prompt Alignment**: 프롬프트와 이미지 간 정렬도 (1-5)
- **F1 Score**: 문화적 분류 정확도 (0-1)

### 스텝 분석
- **Best Step**: 각 메트릭에서 최고 성능을 보이는 생성 단계
- **Step Progression**: 단계별 성능 변화 추이

### 편향 분석
- **Cultural Bias**: 국가별 성능 차이 분석
- **Category Bias**: 카테고리별 성능 편차 분석

## 🔍 문제 해결

분석 중 오류가 발생하면:
1. 해당 모델의 데이터 파일이 `../output/<model_name>/`에 있는지 확인
2. 데이터 파일의 컬럼명이 올바른지 확인 (컬럼명은 소문자로 시작해야 함)
3. 의존성 패키지가 설치되어 있는지 확인
4. Python 버전이 3.8+인지 확인

## 🎉 빠른 시작

```bash
# 1. 모든 분석 실행 (권장)
python3 run_analysis.py

# 2. 특정 모델만 분석
python3 run_analysis.py --models qwen --analysis-type single --single-type cultural

# 3. 다중 모델 비교만 실행
python3 run_analysis.py --analysis-type multi
```

이제 체계적이고 관리하기 쉬운 구조로 IASEAI26 프로젝트의 모든 모델 성능을 종합적으로 분석할 수 있습니다! 📊✨

"""Unified evaluation runner for general metrics (CLIP/Aesthetic/DreamSim)
AND cultural RAG-based scoring across all available models.

Usage (default configuration):
    python run_all_metrics.py

Key behaviours:
    * Discovers model folders under ``dataset/`` automatically.
    * Builds a standardised CSV with absolute image paths for each model.
    * Runs the general metric evaluator (CLIP/Aesthetic/DreamSim).
    * Runs the cultural metric pipeline with RAG + VLM.
    * Stores artefacts under ``evaluation/generated_csv/<model>/`` and
      ``evaluation/outputs/<model>/``.
"""

from __future__ import annotations

import argparse
import csv
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence

import pandas as pd


def find_column(columns: Iterable[str], *candidates: str) -> Optional[str]:
    lookup: Dict[str, str] = {col.lower().strip(): col for col in columns}
    for cand in candidates:
        key = cand.lower().strip()
        if key in lookup:
            return lookup[key]
    return None


def resolve_path(base_dir: Path, value: str) -> str:
    value = value.strip()
    if not value:
        return ""
    path = Path(value)
    if not path.is_absolute():
        path = (base_dir / value).resolve()
    return str(path)


def standardise_model_csv(model_name: str, model_dir: Path, output_csv: Path) -> int:
    source_csv = model_dir / "prompt-img-path.csv"
    if not source_csv.exists():
        raise FileNotFoundError(f"Missing prompt-img-path.csv for model '{model_name}' at {source_csv}")

    df = pd.read_csv(source_csv)
    if df.empty:
        raise ValueError(f"No rows found in {source_csv}")

    prompt_col = find_column(df.columns, "prompt", "t2i prompt", "text", "text_prompt")
    editing_col = find_column(df.columns, "editing_prompt", "i2i prompt", "instruction")

    if not prompt_col:
        raise ValueError(f"Unable to locate prompt column in {source_csv}")

    # Map step columns
    step_columns: Dict[int, str] = {}
    step0_col = find_column(df.columns, "step0", "step0_path", "base", "base_path")
    if step0_col:
        step_columns[0] = step0_col

    for idx in range(1, 10):  # Support up to 9 edited versions
        col = find_column(
            df.columns,
            f"step{idx}",
            f"step{idx}_path",
            f"edit_{idx}",
            f"edit_{idx}_path",
            f"edit{idx}",
            f"edit{idx}_path",
        )
        if col:
            step_columns[idx] = col

    if not step_columns:
        raise ValueError(f"No step columns found in {source_csv}")

    max_step = max(step_columns)
    fieldnames = ["prompt", "editing_prompt"] + [f"step{idx}_path" for idx in range(max_step + 1)]

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    with output_csv.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for _, row in df.iterrows():
            record = {
                "prompt": str(row[prompt_col]).strip(),
                "editing_prompt": str(row[editing_col]).strip() if editing_col and pd.notna(row[editing_col]) else "",
            }
            for idx in range(max_step + 1):
                src_col = step_columns.get(idx)
                path_val = ""
                if src_col and pd.notna(row[src_col]):
                    path_val = resolve_path(model_dir, str(row[src_col]))
                record[f"step{idx}_path"] = path_val
            writer.writerow(record)
    return max_step


def run_subprocess(cmd: List[str], cwd: Optional[Path] = None) -> None:
    printable = " ".join(cmd)
    print(f"  -> {printable}")
    subprocess.run(cmd, check=True, cwd=str(cwd) if cwd else None)


def ensure_cultural_index(cultural_dir: Path, pdf_dir: Path, out_dir: Path, rebuild: bool, python_exec: str) -> None:
    faiss_path = out_dir / "faiss.index"
    if rebuild or not faiss_path.exists():
        print("[Index] Building cultural knowledge FAISS index...")
        run_subprocess(
            [
                python_exec,
                str(cultural_dir / "build_cultural_index.py"),
                "--pdf-dir",
                str(pdf_dir),
                "--out-dir",
                str(out_dir),
            ]
        )
    else:
        print("[Index] Existing FAISS index found – skipping rebuild.")


def run_general_metrics(general_metric_dir: Path, csv_path: Path, out_path: Path, clip_model: str, dreamsim_type: str, use_editing_prompt: bool, python_exec: str) -> None:
    print(f"[General] Running CLIP/Aesthetic/DreamSim on {csv_path.name}")
    cmd = [
        python_exec,
        str(general_metric_dir / "multi_metric_evaluation.py"),
        "--csv",
        str(csv_path),
        "--out",
        str(out_path),
        "--clip-model",
        clip_model,
        "--dreamsim-type",
        dreamsim_type,
    ]
    if use_editing_prompt:
        cmd.append("--use-editing-prompt")
    run_subprocess(cmd)


def summarize_best_worst(summary_csv: Path, output_csv: Path) -> None:
    df = pd.read_csv(summary_csv)
    if df.empty or 'group_id' not in df.columns:
        return
    numeric_cols = ['accuracy', 'precision', 'recall', 'f1']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    df['num_questions'] = pd.to_numeric(df.get('num_questions'), errors='coerce')
    best_idx = df.groupby('group_id')['f1'].idxmax().dropna()
    worst_idx = df.groupby('group_id')['f1'].idxmin().dropna()
    best = df.loc[best_idx]
    worst = df.loc[worst_idx]
    best = best.add_prefix('best_')
    worst = worst.add_prefix('worst_')
    combined = best.merge(worst, left_on='best_group_id', right_on='worst_group_id', how='outer', suffixes=('', ''))
    combined.rename(columns={'best_group_id': 'group_id'}, inplace=True)
    if 'worst_group_id' in combined.columns:
        combined.drop(columns=['worst_group_id'], inplace=True)
    combined.to_csv(output_csv, index=False)

def run_cultural_metric(
    cultural_dir: Path,
    csv_path: Path,
    dataset_root: Path,
    summary_path: Path,
    detail_path: Path,
    index_dir: Path,
    question_model: str,
    vlm_model: str,
    max_questions: int,
    min_questions: int,
    min_negative: int,
    top_k: int,
    image_columns: Sequence[str],
    load_in_8bit: bool,
    load_in_4bit: bool,
    debug: bool,
    require_question_min: bool,
    enable_rating: bool,
    enable_vlm_selection: bool,
    python_exec: str,
    use_enhanced: bool = True,
    resume: bool = True,
) -> None:
    print(f"[Cultural] Running {'Enhanced' if use_enhanced else 'Standard'} RAG cultural metric on {csv_path.name}")
    
    # Choose pipeline script
    if use_enhanced:
        script_path = cultural_dir / "enhanced_cultural_metric_pipeline.py"
    else:
        script_path = cultural_dir / "cultural_metric_pipeline.py"
    
    cmd = [
        python_exec,
        str(script_path),
        "--input-csv",
        str(csv_path),
        "--image-root",
        str(dataset_root),
        "--summary-csv",
        str(summary_path),
        "--detail-csv",
        str(detail_path),
        "--index-dir",
        str(index_dir),
        "--question-model",
        question_model,
        "--vlm-model",
        vlm_model,
        "--max-questions",
        str(max_questions),
        "--min-questions",
        str(min_questions),
        "--min-negative",
        str(min_negative),
        "--top-k",
        str(top_k),
    ]
    
    # Enhanced pipeline specific options
    if use_enhanced:
        if resume:
            cmd.append("--resume")
        cmd.extend(["--batch-size", "1"])
        cmd.extend(["--save-frequency", "5"])
        cmd.extend(["--checkpoint-dir", str(cultural_dir / "checkpoints")])
    else:
        # Legacy options
        if image_columns:
            cmd.append("--image-columns")
            cmd.extend(list(image_columns))
        if require_question_min:
            cmd.append("--require-question-minimum")
        if enable_rating:
            cmd.append("--enable-rating")
        if enable_vlm_selection:
            cmd.append("--enable-vlm-selection")
    
    # Common options
    if load_in_8bit:
        cmd.append("--load-in-8bit")
    if load_in_4bit:
        cmd.append("--load-in-4bit")
    if debug:
        cmd.append("--debug")
    
    run_subprocess(cmd)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run all evaluation metrics across models.")
    repo_root = Path(__file__).resolve().parent.parent
    parser.add_argument("--dataset-root", type=Path, default=repo_root / "dataset")
    parser.add_argument("--external-data", type=Path, default=repo_root / "external_data")
    parser.add_argument("--outputs-dir", type=Path, default=Path(__file__).resolve().parent / "outputs")
    parser.add_argument("--generated-csv-dir", type=Path, default=Path(__file__).resolve().parent / "generated_csv")
    parser.add_argument("--models", nargs="*", help="Subset of model folder names to evaluate")
    parser.add_argument("--skip-general", action="store_true", help="Skip CLIP/Aesthetic/DreamSim evaluation")
    parser.add_argument("--skip-cultural", action="store_true", help="Skip cultural metric evaluation")
    parser.add_argument("--clip-model", default="ViT-L/14")
    parser.add_argument("--dreamsim-type", default="ensemble")
    parser.add_argument("--disable-editing-prompt", action="store_true", help="Use base prompt instead of editing prompt for CLIP")
    parser.add_argument("--question-model", default="Qwen/Qwen2.5-0.5B-Instruct")
    parser.add_argument("--vlm-model", default="Qwen/Qwen2-VL-7B-Instruct")
    parser.add_argument("--max-questions", type=int, default=8)
    parser.add_argument("--min-questions", type=int, default=4)
    parser.add_argument("--min-negative", type=int, default=0)
    parser.add_argument("--top-k", type=int, default=8)
    parser.add_argument("--load-in-8bit", action="store_true")
    parser.add_argument("--load-in-4bit", action="store_true")
    parser.add_argument("--cultural-debug", action="store_true", help="Print cultural metric debugging info.")
    parser.add_argument("--cultural-strict-question-min", action="store_true", help="Enforce question minimums for cultural metric.")
    parser.add_argument("--cultural-rating", action="store_true", help="Request cultural representation and prompt alignment scores (1-5).")
    parser.add_argument("--cultural-vlm-selection", action="store_true", help="Ask the VLM to choose best/worst image per group.")
    parser.add_argument("--reuse-latest-general", action="store_true", help="Reuse existing general metrics if present.")
    parser.add_argument("--rebuild-index", action="store_true")
    parser.add_argument("--force", action="store_true", help="Recompute even if outputs already exist")
    parser.add_argument("--use-enhanced-cultural", action="store_true", default=True, help="Use enhanced cultural metric pipeline")
    parser.add_argument("--no-resume", action="store_true", help="Disable checkpoint resumption")
    args = parser.parse_args()

    dataset_root = args.dataset_root
    if not dataset_root.exists():
        raise FileNotFoundError(f"Dataset root not found: {dataset_root}")

    outputs_dir = args.outputs_dir
    csv_dir = args.generated_csv_dir
    outputs_dir.mkdir(parents=True, exist_ok=True)
    csv_dir.mkdir(parents=True, exist_ok=True)

    python_exec = sys.executable
    evaluation_dir = Path(__file__).resolve().parent
    cultural_dir = evaluation_dir / "cultural_metric"
    general_metric_dir = evaluation_dir / "general_metric"

    use_editing_prompt = not args.disable_editing_prompt

    if not args.skip_cultural:
        index_dir = cultural_dir / "vector_store"
        ensure_cultural_index(cultural_dir, args.external_data, index_dir, args.rebuild_index, python_exec)
    else:
        index_dir = cultural_dir / "vector_store"

    model_dirs = sorted(p for p in dataset_root.iterdir() if p.is_dir())
    if args.models:
        filter_set = set(args.models)
        model_dirs = [p for p in model_dirs if p.name in filter_set]
        missing = filter_set - {p.name for p in model_dirs}
        if missing:
            raise ValueError(f"Requested models not found: {', '.join(sorted(missing))}")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    model_infos = []
    for model_dir in model_dirs:
        model_name = model_dir.name
        print(f"\n=== Preparing model: {model_name} ===")
        model_csv_path = csv_dir / model_name / "img_paths_standard.csv"
        max_step = standardise_model_csv(model_name, model_dir, model_csv_path)
        print(f"[CSV] Standardised CSV written ({max_step + 1} steps): {model_csv_path}")

        model_output_dir = outputs_dir / model_name
        model_output_dir.mkdir(parents=True, exist_ok=True)

        model_infos.append(
            {
                "name": model_name,
                "csv_path": model_csv_path,
                "max_step": max_step,
                "output_dir": model_output_dir,
                "image_columns": [f"step{idx}_path" for idx in range(max_step + 1)],
            }
        )

    if not args.skip_general:
        print("\n--- Running general metrics for all models ---")
        for info in model_infos:
            existing_generals = sorted(
                p
                for p in info["output_dir"].glob("general_metrics_*.csv")
                if not p.name.endswith("_summary.csv")
            )
            reuse_existing = (
                args.reuse_latest_general and not args.force and bool(existing_generals)
            )
            if reuse_existing:
                general_out = existing_generals[-1]
                summary_out = general_out.with_name(general_out.stem + "_summary.csv")
                print(f"[General] Processing model: {info['name']} (reuse {general_out.name})")
                if summary_out.exists():
                    print("  Existing general metrics found; skipping recompute.")
                    continue
                print("  Summary file missing; recomputing to regenerate summary.")
            else:
                general_out = info["output_dir"] / f"general_metrics_{timestamp}.csv"
                summary_out = general_out.with_name(general_out.stem + "_summary.csv")
                print(f"[General] Processing model: {info['name']}")
                if general_out.exists() and not args.force:
                    print(f"  Existing metrics found ({general_out}); skip (use --force to recompute).")
                    continue

            run_general_metrics(
                general_metric_dir,
                info["csv_path"],
                general_out,
                args.clip_model,
                args.dreamsim_type,
                use_editing_prompt,
                python_exec,
            )
            if summary_out.exists():
                print(f"  Summary saved to {summary_out}")

    if not args.skip_cultural:
        print("\n--- Running cultural metrics for all models ---")
        for info in model_infos:
            cultural_summary = info["output_dir"] / f"cultural_metrics_{timestamp}_summary.csv"
            cultural_detail = info["output_dir"] / f"cultural_metrics_{timestamp}_detail.csv"
            cultural_best_worst = info["output_dir"] / f"cultural_best_worst_{timestamp}.csv"
            print(f"[Cultural] Processing model: {info['name']}")
            if cultural_summary.exists() and not args.force:
                print(f"  Existing metrics found ({cultural_summary}); skip (use --force to recompute).")
                continue
            run_cultural_metric(
                cultural_dir,
                info["csv_path"],
                dataset_root,
                cultural_summary,
                cultural_detail,
                index_dir,
                args.question_model,
                args.vlm_model,
                args.max_questions,
                args.min_questions,
                args.min_negative,
                args.top_k,
                info["image_columns"],
                args.load_in_8bit,
                args.load_in_4bit,
                args.cultural_debug,
                args.cultural_strict_question_min,
                args.cultural_rating,
                args.cultural_vlm_selection,
                python_exec,
                use_enhanced=args.use_enhanced_cultural,
                resume=not args.no_resume,
            )
            summarize_best_worst(cultural_summary, cultural_best_worst)
            print(f"  Summary saved to {cultural_summary}")
            print(f"  Detail saved to {cultural_detail}")
            print(f"  Best/Worst saved to {cultural_best_worst}")
            if args.cultural_vlm_selection:
                vlm_best = cultural_summary.with_name(cultural_summary.stem + "_vlm_best_worst.csv")
                if vlm_best.exists():
                    print(f"  VLM Best/Worst saved to {vlm_best}")
    print("\nAll evaluations completed.")


if __name__ == "__main__":
    main()

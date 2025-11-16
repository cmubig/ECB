from diffusers import StableDiffusion3Img2ImgPipeline
from pathlib import Path
from PIL import Image
import torch
import re

INPUT_DIR = Path("/home/yzhou8/sd35_t2i_output") 
OUT_DIR   = Path("/home/yzhou8/sd35_i2i_output")
MODEL_DIR = Path("/scratch/yzhou8/stable-diffusion-3.5-medium")

NUM_STEPS       = 40
GUIDANCE_SCALE  = 4.5
STRENGTH        = 0.6
ITERATIONS      = 5       

ALLOWED_VARIANTS = {"traditional", "modern", "general", "national", "common"}
ALLOWED_COUNTRIES = {"china","korea", "united_states", "kenya", "nigeria", "india"}
CATEGORY_TO_SUB = {
    "architecture": {"landmark", "house"},
    "art": {"painting", "sculpture", "dance"},
    "event": {"sport", "game", "religious_ritual", "festival", "wedding", "funeral"},
    "fashion": {"clothing", "makeup", "accessories"},
    "food": {"staple_food", "main_dish", "snack", "dessert", "beverage"},
    "landscape": {"city", "countryside", "nature"},
    "people": {"daily_life", "chef", "celebrity", "model", "athlete", "student", "teacher", "bride_and_groom", "president", "farmer", "soldier", "doctor"}, 
    "wildlife": {"plant", "animal"}
}


NAME_RE = re.compile(r"^(sd35)_([a-z0-9_]+)_([a-z0-9_]+)_([a-z0-9_]+)_([a-z0-9_]+)\.png$")

def build_prompt(country: str, category: str, subcategory: str, variant: str) -> str:
    if category == "people" or variant == "general":
        return f"Change the image to represent {subcategory} in {country}."
    return f"Change the image to represent {variant} {subcategory} in {country}."

def valid_seed_image(p: Path):
    m = NAME_RE.match(p.name)
    if not m:
        return None
    model, country, category, subcategory, variant = m.groups()

    if model != "sd35":
        return None
    if ALLOWED_COUNTRIES and country not in ALLOWED_COUNTRIES:
        return None
    if ALLOWED_VARIANTS and variant not in ALLOWED_VARIANTS:
        return None

    allowed_subs = CATEGORY_TO_SUB.get(category)
    if not allowed_subs or subcategory not in allowed_subs:
        return None

    return model, country, category, subcategory, variant

def ensure_mode(img: Image.Image) -> Image.Image:
    return img.convert("RGB")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    pipe = StableDiffusion3Img2ImgPipeline.from_pretrained(
        MODEL_DIR,
        torch_dtype=torch.bfloat16,
    ).to("cuda")

    for img_path in sorted(INPUT_DIR.glob("*.png")):
        meta = valid_seed_image(img_path)
        if not meta:
            continue 
        model, country, category, subcategory, variant = meta

        prompt = build_prompt(country, category, subcategory, variant)

        current_image = ensure_mode(Image.open(img_path))

        for i in range(1, ITERATIONS + 1):
            if category == "people":
                out_name = f"{model}_{country}_{category}_{subcategory}_{i}.png"

            else:
                out_name = f"{model}_{country}_{category}_{subcategory}_{variant}_{i}.png"
            out_path = OUT_DIR / out_name

            if out_path.exists():
                current_image = ensure_mode(Image.open(out_path))
                continue

            result = pipe(
                prompt=prompt,
                image=current_image,
                strength=STRENGTH,
                guidance_scale=GUIDANCE_SCALE,
                num_inference_steps=NUM_STEPS,
            ).images[0]

            result.save(out_path)
            current_image = result

            print(f"Saved: {out_path} | Prompt: {prompt}")

if __name__ == "__main__":
    main()
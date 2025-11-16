from diffusers import StableDiffusion3Pipeline
import pandas as pd
import torch
from pathlib import Path
from tqdm import tqdm

CSV_PATH = "/home/yzhou8/prompt_india.csv"
OUT_DIR = "/home/yzhou8/test"
MODEL_DIR = "/scratch/yzhou8/stable-diffusion-3.5-medium"

pipe = StableDiffusion3Pipeline.from_pretrained(
    MODEL_DIR,
    torch_dtype=torch.bfloat16,
)
pipe = pipe.to("cuda")

def generate_and_save(prompt: str, out_path: Path, num_inference_steps=40, guidance_scale=4.5):
    """Run inference and save image"""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    image = pipe(
        prompt,
        num_inference_steps=num_inference_steps,
        guidance_scale=guidance_scale,
    ).images[0]
    image.save(f"{out_path}.png")


def main():
    try:
        df = pd.read_csv(CSV_PATH) 
        print('✅ Load CSV file')
    except FileNotFoundError:
        print('❌ Error')
        exit()
    current_category = ""
    current_subcategory = ""
    for index, row in tqdm(df.iterrows(), total=df.shape[0], desc='Generating images from CSV'):
        if pd.notna(row['Category']):
            current_category = row['Category']
        if pd.notna(row['Subcategory']):
            current_subcategory = row['Subcategory']
        country = row['Country']
        
        if pd.isna(country):
            continue
        
        country_str = str(country).replace(" ", "_").lower()
        category_str = str(current_category).replace(" ", "_").lower()
        subcategory_str = str(current_subcategory).replace(" ", "_").lower() 
        if country_str == "no_country":
            country_str = "nocountry"
                
        for prompt_type in ['Traditional Prompt', 'Modern Prompt', 'General Prompt']:
            prompt_text = row[prompt_type]
            
            if isinstance(prompt_text, str) and prompt_text.strip():
                variant_name = prompt_type.replace(" Prompt", "").lower()
                
                out_path = Path(OUT_DIR) / f"sd35_{country_str}_{category_str}_{subcategory_str}_{variant_name}"
                
                print(f"Country: {country}, Category: {current_category}, Sub-category: {current_subcategory}, Variant: {variant_name}")
                print(f"Prompt: {prompt_text}")
                
                generate_and_save(prompt_text, out_path)

if __name__ == "__main__":
    main()
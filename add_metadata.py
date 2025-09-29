import csv
import os
import re
import sys

def parse_filename(filename):
    filename_without_ext, _ = os.path.splitext(filename)
    
    step_match = re.search(r'_(\d+)$', filename_without_ext)
    if step_match:
        filename_without_ext = filename_without_ext[:step_match.start()]

    parts = filename_without_ext.split('_')
    
    model = parts.pop(0) if parts else ''
    
    country = ''
    if parts:
        if parts[0] == 'united' and len(parts) > 1 and parts[1] == 'states':
            country = 'united_states'
            parts = parts[2:]
        else:
            country = parts.pop(0)

    category = parts.pop(0) if parts else ''
    
    variants = ['general', 'modern', 'traditional', 'common', 'national']
    variant = ''
    if parts and parts[-1] in variants:
        variant = parts.pop(-1)

    sub_category = '_'.join(parts)
    
    return [model, country, category, sub_category, variant]

def add_columns_to_csv(input_file_path, output_file_path):
    print(f"Processing {input_file_path}...")

    with open(input_file_path, 'r', encoding='utf-8') as infile, \
         open(output_file_path, 'w', newline='', encoding='utf-8') as outfile:

        reader = csv.reader(infile)
        writer = csv.writer(outfile)

        header = next(reader)
        new_columns = ['model', 'country', 'category', 'sub_category', 'variant']
        writer.writerow(new_columns + header)

        try:
            base_col_idx = header.index('base')
        except ValueError:
            print(f"Error: 'base' column not found in {input_file_path}. Using column 3 as fallback.")
            base_col_idx = 2

        for row in reader:
            if base_col_idx >= len(row) or not row[base_col_idx]:
                writer.writerow(row) 
                continue

            base_path = row[base_col_idx]
            filename = os.path.basename(base_path)
            
            if not filename:
                writer.writerow(row)
                continue

            parsed_data = parse_filename(filename)
            writer.writerow(parsed_data + row)

    print(f"Processing complete. Output saved to {output_file_path}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python add_metadata.py <path_to_input_csv>")
        sys.exit(1)
    
    input_csv = sys.argv[1]
    
    dirname = os.path.dirname(input_csv)
    output_csv = os.path.join(dirname, "prompt-img-path_extended.csv")
    
    add_columns_to_csv(input_csv, output_csv)
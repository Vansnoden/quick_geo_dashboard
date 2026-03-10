
from typing import Optional
import os
from database.utils import yaml_to_dashboard_js


yaml_text = """
geo-dashboard:
  name: "My Sales Dashboard"
  template: side_content
  stats:
    - type: bar
      title: "Sales by Region"
      x: region
      y:
        column: sales
        aggregation: sum
    - type: line
      title: "Sales by Region"
      x: region
      y:
        column: sales
        aggregation: sum
    - type: pie
      title: "Sales by Region"
      x: region
      y:
        column: sales
        aggregation: sum
  map:
    lat: latitude
    lon: longitude
  menus:
    about: "## About"
    stats: "Summary"
    map: "Map"
"""


def extract_first_n_lines(
    csv_path: str, 
    n: int = 100, 
    output_filename: Optional[str] = None,
    include_header: bool = True,
    encoding: str = 'utf-8'
) -> str:
    """
    Extract first N lines from CSV with advanced options.
    
    Args:
        csv_path: Path to input CSV
        n: Number of lines to extract
        output_filename: Custom output filename
        include_header: Whether to include header row
        encoding: File encoding
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Input file not found: {csv_path}")
    
    if n < 1:
        raise ValueError("Number of lines to extract must be at least 1")
    
    parent_folder = os.path.dirname(csv_path)
    
    if output_filename is None:
        base_name = os.path.splitext(os.path.basename(csv_path))[0]
        suffix = "with_header" if include_header else "no_header"
        output_filename = f"{base_name}_first_{n}_{suffix}.csv"
    
    output_path = os.path.join(parent_folder, output_filename)
    
    try:
        with open(csv_path, 'r', encoding=encoding) as infile, \
             open(output_path, 'w', encoding=encoding, newline='') as outfile:
            
            lines_to_write = []
            line_count = 0
            
            # Read and process lines
            for i, line in enumerate(infile):
                if i == 0 and not include_header:
                    continue  # Skip header
                    
                if line_count < n:
                    lines_to_write.append(line)
                    line_count += 1
                else:
                    break
            
            # Write to output
            outfile.writelines(lines_to_write)
        
        print(f"Successfully extracted {line_count} lines to: {output_path}")
        return output_path
        
    except Exception as e:
        raise Exception(f"Error processing file: {str(e)}")


# Quick one-liner function for simple cases
def quick_extract(csv_path: str, n: int = 100) -> str:
    """Quick one-liner to extract first N lines."""
    return extract_first_n_lines(csv_path, n)


def test_yaml_conversion():
    js = yaml_to_dashboard_js(yaml_text)
    print(js)


if __name__ == "__main__":
    # test_yaml_conversion()

    extract_first_n_lines(
        "/mnt/monadworld/projects/honeybee_dashboard/data/bee_plant_data.csv", 
        n=100000, 
        include_header=True,
        encoding='utf-8'
    )
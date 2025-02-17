import os
import re
from bs4 import BeautifulSoup
from ruamel.yaml import YAML

yaml = YAML()
yaml.preserve_quotes = True  # Retains formatting
yaml.default_flow_style = False

def process_html(html_content):
    """
    Parses the given HTML content and removes all <div> and <span> tags
    while keeping their child elements.
    """
    soup = BeautifulSoup(html_content, "html.parser")
    
    # Unwrap <div> tags (remove them but keep their children)
    for div in soup.find_all("div"):
        div.unwrap()
    
    # Unwrap <span> tags (remove them but keep their content)
    for span in soup.find_all("span"):
        span.unwrap()
    
    return str(soup)

def update_yaml_content(file_path):
    """Preserves key order and updates only the content section."""
    with open(file_path, 'r', encoding='utf-8') as file:
        data = yaml.load(file)
    
    if "pages" in data and isinstance(data["pages"], list) and data["pages"]:
        page = data["pages"][0]
        if "text" in page and "content" in page["text"]:
            page["text"]["content"] = process_html(page["text"]["content"])
    
    with open(file_path, 'w', encoding='utf-8') as file:
        yaml.dump(data, file)

def process_directory(directory):
    """Goes through all YAML files in the given directory and processes them."""
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".yml") or file.endswith(".yaml"):
                file_path = os.path.join(root, file)
                print(f"Processing: {file_path}")
                update_yaml_content(file_path)
                print(f"Updated: {file_path}")
                print("=" * 50)

if __name__ == "__main__":
    directory = "./src/packs/rules"
    if os.path.isdir(directory):
        process_directory(directory)
    else:
        print("Invalid directory path!")

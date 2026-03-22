import os

# Update this path if your gallery.md is inside a specific folder like 'docs/gallery.md'
FILE_PATH = "gallery.md"

def add_watchface():
    print("--- Add New Watchface to Gallery ---")
    name = input("Enter Watchface Name (e.g., Lumira Core): ").strip()
    url = input("Enter Store URL: ").strip()
    img = input("Enter Image URL (e.g., Postimg .gif): ").strip()

    if not name or not url or not img:
        print("Error: All fields are required. Aborting.")
        return

    # Formats the exact Markdown/HTML block needed
    new_entry = f"""
<div style="width: 150px;" markdown="1">
<a href="{url}" target="_blank">![]({img})</a>
**{name}**
</div>
"""

    if not os.path.exists(FILE_PATH):
        print(f"Error: Could not find '{FILE_PATH}'. Check the path.")
        return

    with open(FILE_PATH, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    # The exact string of your main flex container
    target_line = '<div style="display: flex; flex-wrap: wrap; justify-content: center; column-gap: 40px; row-gap: 5px; text-align: center;" markdown="1">'

    inserted = False
    for i, line in enumerate(lines):
        if target_line in line:
            # Insert the new block immediately after the container opening tag
            lines.insert(i + 1, new_entry)
            inserted = True
            break

    if inserted:
        with open(FILE_PATH, 'w', encoding='utf-8') as file:
            file.writelines(lines)
        print(f"\nSuccess! '{name}' has been added to the top of your gallery.")
    else:
        print("\nError: Could not find the main flex container div in the file. Make sure the HTML hasn't changed.")

if __name__ == "__main__":
    add_watchface()
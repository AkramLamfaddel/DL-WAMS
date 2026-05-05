"""
Convert Rapport_Technique_WAMS_2025.md → professional HTML report.
Open the HTML in a browser and use Ctrl+P → Save as PDF.
"""
import sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import markdown

MD_PATH = os.path.join(os.path.dirname(__file__), 'Rapport_Technique_WAMS_2025.md')
HTML_PATH = os.path.join(os.path.dirname(__file__), 'Rapport_Technique_WAMS_2025.html')

with open(MD_PATH, 'r', encoding='utf-8') as f:
    md_content = f.read()

html_body = markdown.markdown(
    md_content,
    extensions=['tables', 'fenced_code', 'codehilite', 'toc'],
    extension_configs={'codehilite': {'css_class': 'highlight'}},
)

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&family=JetBrains+Mono:wght@400;600&display=swap');

@page {
  size: A4;
  margin: 2cm;
}

* { box-sizing: border-box; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 11pt;
  line-height: 1.7;
  color: #1a1a2e;
  background: #fff;
  max-width: 210mm;
  margin: 0 auto;
  padding: 2cm;
}

h1 {
  font-size: 26pt;
  font-weight: 900;
  color: #0d1b2a;
  border-bottom: 4px solid #1b4965;
  padding-bottom: 12px;
  margin-top: 40px;
  margin-bottom: 20px;
  letter-spacing: -0.5px;
}

h2 {
  font-size: 16pt;
  font-weight: 700;
  color: #1b4965;
  border-bottom: 2px solid #e0e7ef;
  padding-bottom: 8px;
  margin-top: 36px;
  margin-bottom: 16px;
  page-break-after: avoid;
}

h3 {
  font-size: 12pt;
  font-weight: 700;
  color: #2d6a8e;
  margin-top: 24px;
  margin-bottom: 10px;
  page-break-after: avoid;
}

h4 {
  font-size: 11pt;
  font-weight: 600;
  color: #415a77;
}

p { margin: 8px 0; }

strong { font-weight: 700; color: #0d1b2a; }

a { color: #1b4965; text-decoration: none; }

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 10pt;
  page-break-inside: avoid;
}

thead th {
  background: #1b4965;
  color: #fff;
  font-weight: 700;
  text-align: left;
  padding: 10px 14px;
  font-size: 9pt;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

tbody td {
  padding: 8px 14px;
  border-bottom: 1px solid #e0e7ef;
}

tbody tr:nth-child(even) { background: #f8fafc; }
tbody tr:hover { background: #eef4fa; }

/* Code blocks */
pre {
  background: #0d1b2a;
  color: #e0e7ef;
  padding: 16px 20px;
  border-radius: 8px;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 9pt;
  line-height: 1.5;
  overflow-x: auto;
  page-break-inside: avoid;
  margin: 12px 0;
  border-left: 4px solid #1b4965;
}

code {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 9pt;
  background: #eef4fa;
  padding: 2px 6px;
  border-radius: 4px;
  color: #1b4965;
}

pre code {
  background: none;
  padding: 0;
  color: inherit;
}

/* Lists */
ul, ol {
  padding-left: 24px;
  margin: 8px 0;
}

li { margin: 4px 0; }

/* Horizontal rules */
hr {
  border: none;
  height: 2px;
  background: linear-gradient(to right, #1b4965, #e0e7ef);
  margin: 30px 0;
}

/* Status badges in tables */
td:last-child {
  white-space: nowrap;
}

/* Print-specific */
@media print {
  body { padding: 0; max-width: 100%; }
  h1, h2 { page-break-after: avoid; }
  table, pre { page-break-inside: avoid; }
}

/* Cover section styling - first heading */
body > h1:first-child {
  text-align: center;
  font-size: 30pt;
  border-bottom: none;
  margin-bottom: 0;
}

body > h2:first-of-type {
  text-align: center;
  font-size: 13pt;
  color: #415a77;
  border-bottom: none;
  font-weight: 400;
  margin-bottom: 30px;
}

/* TOC styling */
.toc {
  background: #f8fafc;
  border: 1px solid #e0e7ef;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.toc ul { list-style: none; padding-left: 16px; }
.toc > ul { padding-left: 0; }
.toc li { margin: 4px 0; }
.toc a { color: #1b4965; font-weight: 500; }
"""

html_full = f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport Technique — Projet WAMS 2025</title>
  <style>{CSS}</style>
</head>
<body>
{html_body}
</body>
</html>
"""

with open(HTML_PATH, 'w', encoding='utf-8') as f:
    f.write(html_full)

print(f"✅ Report generated: {HTML_PATH}")
print("→ Open in browser and press Ctrl+P → Save as PDF")

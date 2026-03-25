import pathlib
import sys
import re

f = pathlib.Path(r'c:\Users\User\Desktop\smc-2026-master\thong-ke.html')
try:
    c = f.read_bytes().decode('utf-8', errors='replace')
except:
    print("Cannot read file")
    sys.exit(1)

# The HTML block starts with <!-- BÁO CÁO AUTOMATION -->
# Let's extract everything from that line up to the line right before <script>
block_match = re.search(r'(\s*<!-- BÁO CÁO AUTOMATION -->.*?)(?=<script>)', c, flags=re.DOTALL)

if block_match:
    report_html = block_match.group(1)
    
    # Check if the extracted block actually contains <div id="report-section"
    if 'id="report-section"' in report_html:
        # Remove it from its current position
        c = c.replace(report_html, '\n')
        
        # We need to insert it right before: <div id="dashboard-grid"
        # Wait, if we just split by '<div id="dashboard-grid"', we can insert it.
        # But wait! The `report-section` has some `</div>` trailing or leading depending on the extraction.
        # Let's look at `report_html` exactly:
        # It starts with `    <!-- BÁO CÁO AUTOMATION -->`
        # It ends with some whitespace before `<script>`
        # In thong-ke.html, there's a big </div> that closes the container before the scripts.
        # Let's check how many </div> are inside `report_html` vs `<div>`.
        # Because my regex might have chewed up the closing tags of the main layout container if they were right before <script>!
        # Ah!! In thong-ke.html, the very end was:
        # </div>
        # </div>
        # <script>
        # Before I injected the report, there were closing divs.
        # If I extract everything to `<script>`, I might break the layout!
        pass
else:
    print("Could not find the block via regex.")

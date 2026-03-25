import pathlib

f = pathlib.Path(r'c:\Users\User\Desktop\smc-2026-master\thong-ke.html')
c = f.read_bytes().decode('utf-8', errors='replace')

# 1. Update loadData() fetch block to include renderReport(d)
old_fetch = 'fetch(API_PRIMARY_URL + "?mode=history").then(r => r.json()).then(d => { block10Data = d; try { renderBlock10Chart(d); } catch (e2) { console.error("[Block10]", e2); } }).catch(() => { try { renderBlock10Chart(globalData); } catch (e3) { } });'
new_fetch = 'fetch(API_PRIMARY_URL + "?mode=history").then(r => r.json()).then(d => { block10Data = d; try { renderBlock10Chart(d); } catch (e2) { console.error("[Block10]", e2); } try { renderReport(d); } catch (e4) { console.error("[Report]", e4); } }).catch(() => { try { renderBlock10Chart(globalData); } catch (e3) { } try { renderReport(globalData); } catch (e5) { } });'

if old_fetch in c:
    c = c.replace(old_fetch, new_fetch, 1)
    print("Replaced fetch API_PRIMARY_URL")
else:
    print("Could not find old_fetch")

# 2. Update resetAndRender() to use block10Data instead of d (which is filtered)
old_reset = 'try{renderReport(d);}catch(e){}'
new_reset = 'try{renderReport(block10Data && block10Data.length ? block10Data : d);}catch(e){}'

if old_reset in c:
    c = c.replace(old_reset, new_reset, 1)
    print("Replaced resetAndRender call")
else:
    import re
    c, n = re.subn(r'try\{renderReport\(d\);\}catch\(e\)\{\}', new_reset, c)
    if n > 0:
        print("Replaced resetAndRender call using regex")

# 3. Remove the renderReport call injected previously that uses lastFilteredData (line 958)
# try { renderReport(lastFilteredData.length ? lastFilteredData : globalData); } catch(e) { console.error("[Report]", e); }
old_old_report = 'try { renderReport(lastFilteredData.length ? lastFilteredData : globalData); } catch(e) { console.error("[Report]", e); }'
if old_old_report in c:
    c = c.replace(old_old_report, '', 1)
    print("Removed old renderReport call")
else:
    import re
    c, n = re.subn(r'try\s*\{\s*renderReport\(lastFilteredData\.length\s*\?\s*lastFilteredData\s*:\s*globalData\);\s*\}\s*catch\(e\)\s*\{\s*console\.error\("\[Report\]",\s*e\);\s*\}', '', c)
    if n > 0:
        print("Removed old renderReport call using regex")
    
f.write_bytes(c.encode('utf-8'))

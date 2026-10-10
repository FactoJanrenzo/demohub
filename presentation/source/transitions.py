import sys, json, zipfile, re, shutil
src = sys.argv[1]; dividers = set(json.load(open(sys.argv[2])))
tmp = src + ".tmp"
with zipfile.ZipFile(src) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        m = re.fullmatch(r"ppt/slides/slide(\d+)\.xml", item.filename)
        if m:
            n = int(m.group(1)); x = data.decode("utf8")
            tr = '<p:transition spd="slow"><p:push dir="u"/></p:transition>' if n in dividers else '<p:transition spd="med"><p:fade/></p:transition>'
            assert "</p:clrMapOvr>" in x and "<p:transition" not in x
            x = x.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + tr, 1)
            data = x.encode("utf8")
        zout.writestr(item, data)
shutil.move(tmp, src)
print("transitions added")

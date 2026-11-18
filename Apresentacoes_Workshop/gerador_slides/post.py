"""Rezip the pptx without directory entries, then make 2x2 contact grids of rendered slides."""
import sys, zipfile, glob, os, shutil
from PIL import Image

deck, render = sys.argv[1], sys.argv[2]
tmp = deck + ".tmp"
with zipfile.ZipFile(deck) as zi, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zo:
    for it in zi.infolist():
        if it.filename.endswith("/"):
            continue
        zo.writestr(it, zi.read(it.filename))
shutil.move(tmp, deck)

if os.path.isdir(render):
    fs = sorted(glob.glob(os.path.join(render, "s*.png")))
    for g in range(0, len(fs), 4):
        im = Image.new("RGB", (1610, 910), "gray")
        for k, f in enumerate(fs[g:g + 4]):
            im.paste(Image.open(f).resize((800, 450)), ((k % 2) * 810, (k // 2) * 460))
        im.save(os.path.join(render, f"grid{g // 4 + 1}.png"))
print("ok")

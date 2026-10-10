"""Add slide transitions and fast entrance animations to the built deck.

usage: finalize.py deck.pptx meta.json
meta.json: {"dividers": [slideNo,...], "anim": {slideNo: [{"names": [...], "trigger": "auto"|"click", "effect": "fade"|"float"|"zoom"}]}}
"""
import sys, json, zipfile, re, shutil
from lxml import etree

NS = {"p": "http://schemas.openxmlformats.org/presentationml/2006/main",
      "a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
DUR = {"fade": 300, "float": 350, "zoom": 350}
STAGGER = 220  # ms between automatic steps
PRESET = {"fade": ("10", "0"), "float": ("42", "0"), "zoom": ("53", "16")}


class Ids:
    def __init__(self): self.n = 2
    def __call__(self): self.n += 1; return self.n


def tgt(s): return f'<p:tgtEl><p:spTgt spid="{s}"/></p:tgtEl>'


def effect(kind, spid, node_type, nid):
    d = DUR[kind]
    preset, sub = PRESET[kind]
    outer = nid()
    parts = [f'<p:set><p:cBhvr><p:cTn id="{nid()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>{tgt(spid)}'
             f'<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>']

    def anim(attr, frm, to):
        return (f'<p:anim calcmode="lin" valueType="num"><p:cBhvr additive="base"><p:cTn id="{nid()}" dur="{d}" fill="hold"/>{tgt(spid)}'
                f'<p:attrNameLst><p:attrName>{attr}</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst>'
                f'<p:tav tm="0"><p:val><p:strVal val="{frm}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="{to}"/></p:val></p:tav></p:tavLst></p:anim>')
    fade = f'<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="{{}}" dur="{d}"/>{tgt(spid)}</p:cBhvr></p:animEffect>'
    if kind == "fade":
        parts.append(fade.format(nid()))
    elif kind == "float":
        parts.append(fade.format(nid()))
        parts.append(anim("ppt_x", "#ppt_x", "#ppt_x"))
        parts.append(anim("ppt_y", "#ppt_y+.06", "#ppt_y"))
    elif kind == "zoom":
        parts.append(anim("ppt_w", "0", "#ppt_w"))
        parts.append(anim("ppt_h", "0", "#ppt_h"))
        parts.append(fade.format(nid()))
    return (f'<p:par><p:cTn id="{outer}" presetID="{preset}" presetClass="entr" presetSubtype="{sub}" fill="hold" grpId="0" nodeType="{node_type}">'
            f'<p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>{"".join(parts)}</p:childTnLst></p:cTn></p:par>')


def timing(steps, shapes):
    nid = Ids()
    seq, built = [], []
    autos = [s for s in steps if s["trigger"] == "auto"]
    clicks = [s for s in steps if s["trigger"] == "click"]
    assert steps == autos + clicks, "automatic steps must come before click steps"

    def ids_for(step):
        out = []
        for n in step["names"]:
            assert n in shapes, f"no shape named {n!r}"
            out.append(shapes[n])
        return out

    def inner(step, delay, first_type, rest_type):
        cid = nid()
        effs = []
        for i, (spid, tag) in enumerate(ids_for(step)):
            effs.append(effect(step["effect"], spid, first_type if i == 0 else rest_type, nid))
            if tag == "sp" and spid not in built: built.append(spid)
        return f'<p:par><p:cTn id="{cid}" fill="hold"><p:stCondLst><p:cond delay="{delay}"/></p:stCondLst><p:childTnLst>{"".join(effs)}</p:childTnLst></p:cTn></p:par>'

    if autos:
        oid = nid()
        pars = "".join(inner(s, i * STAGGER, "afterEffect", "withEffect") for i, s in enumerate(autos))
        seq.append(f'<p:par><p:cTn id="{oid}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>{pars}</p:childTnLst></p:cTn></p:par>')
    for s in clicks:
        oid = nid()
        seq.append(f'<p:par><p:cTn id="{oid}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst>{inner(s, 0, "clickEffect", "withEffect")}</p:childTnLst></p:cTn></p:par>')

    bld = "".join(f'<p:bldP spid="{s}" grpId="0" animBg="1"/>' for s in built)
    return ('<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
            '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
            + "".join(seq) +
            '</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
            '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
            '</p:childTnLst></p:cTn></p:par></p:tnLst>'
            + (f'<p:bldLst>{bld}</p:bldLst>' if bld else "") + '</p:timing>')


def shape_map(xml):
    root = etree.fromstring(xml)
    out = {}
    for el in root.iter("{%s}cNvPr" % NS["p"]):
        tag = etree.QName(el.getparent().getparent()).localname  # sp / pic
        name = el.get("name")
        assert name not in out, f"duplicate shape name {name!r}"
        out[name] = (el.get("id"), tag)
    return out


src, meta = sys.argv[1], json.load(open(sys.argv[2]))
dividers, anims = set(meta["dividers"]), {int(k): v for k, v in meta["anim"].items()}
tmp = src + ".tmp"
n_anim = 0
with zipfile.ZipFile(src) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        m = re.fullmatch(r"ppt/slides/slide(\d+)\.xml", item.filename)
        if m:
            n = int(m.group(1)); x = data.decode("utf8")
            tr = ('<p:transition spd="med"><p:push dir="u"/></p:transition>' if n in dividers
                  else '<p:transition spd="fast"><p:fade/></p:transition>')
            if n in anims:
                tr += timing(anims[n], shape_map(data)); n_anim += 1
            assert "</p:clrMapOvr>" in x and "<p:transition" not in x and "<p:timing" not in x
            x = x.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + tr, 1)
            data = x.encode("utf8")
        zout.writestr(item, data)
shutil.move(tmp, src)
print(f"transitions on all slides; animations on {n_anim} slides")

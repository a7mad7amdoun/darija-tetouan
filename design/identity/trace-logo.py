"""How assets/brand/*.svg were made from Ahmed's emerald logo, so it can be redone.

The alpha channel of the reference PNG is traced with potrace into one-colour
vector paths; nothing is sampled for colour. The colour is the identity's
primary, #0B5A3A, applied afterwards. Authoring-time only - the site needs none
of this to run.

    python3 -m venv venv && venv/bin/pip install potracer numpy pillow
    venv/bin/python design/identity/trace-logo.py
"""
import numpy as np, potrace, json, os
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__))
SRC=os.path.join(HERE,"tetoutalk-emerald-logo-reference.png")
OUT=os.path.join(HERE,"..","..","assets","brand")+os.sep
a=np.array(Image.open(SRC).convert("RGBA"))[:,:,3]
plist=potrace.Bitmap(a>=128).trace(turdsize=40, alphamax=1.0, opticurve=True, opttolerance=0.2)
OX,OY,K=72,92,0.25
def f(v,o): s=('%.1f'%((v-o)*K)).rstrip('0').rstrip('.'); return '0' if s in('-0','') else s
def P(p): return f(p.x,OX)+' '+f(p.y,OY)
mark=[];word=[]
for c in plist:
    pts=[c.start_point]+[s.end_point for s in c.segments]
    x0=min(p.x for p in pts); x1=max(p.x for p in pts); y0=min(p.y for p in pts)
    if x0<=1 and y0<=1 and x1>=2170: continue       # potracer's frame, not artwork
    d='M'+P(c.start_point)
    for s in c.segments:
        d+=('L'+P(s.c)+'L'+P(s.end_point)) if s.is_corner else ('C'+P(s.c1)+' '+P(s.c2)+' '+P(s.end_point))
    d+='Z'
    (mark if x1<560 else word).append(d)
M=''.join(mark); W=''.join(word)
VW,VH=(2076-OX)*K,(628-OY)*K; MW=(523-OX)*K
def svg(vb,body,fill,title):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s" role="img" aria-labelledby="t"><title id="t">%s</title>'
            '<g fill="%s" fill-rule="evenodd">%s</g></svg>\n')%(vb,title,fill,body)
lock='<path d="%s"/><path d="%s"/>'%(M,W)
open(OUT+'tetoutalk-logo.svg','w').write(svg('0 0 %g %g'%(VW,VH),lock,'#0B5A3A','TetouTalk'))
open(OUT+'tetoutalk-logo-reversed.svg','w').write(svg('0 0 %g %g'%(VW,VH),lock,'#FFFFFF','TetouTalk'))
open(OUT+'tetoutalk-mark.svg','w').write(svg('0 0 %g %g'%(MW,VH),'<path d="%s"/>'%M,'#0B5A3A','TetouTalk'))
print('mark chars',len(M),'word chars',len(W),'viewbox',VW,VH,'mark w',MW)

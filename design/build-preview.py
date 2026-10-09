"""Regenerate preview.html from index.html, so the preview always renders the
real shell, the real script list and the real stylesheet. Run after any change
to index.html."""
import re, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
idx = open(os.path.join(root, 'index.html')).read()
shell = idx[idx.index('<div class="shell">'):idx.index('</body>')]
shell = re.sub(r'<script[^>]*src="[^"]*"[^>]*></script>\s*', '', shell)
scripts = [s for s in re.findall(r'<script src="([^"?]+)', idx) if not s.endswith('app.js')]
head_preload = '\n'.join(re.findall(r'<link rel="preload"[^>]*>', idx))
prev = open(os.path.join(root, 'preview.html')).read()
iso = prev[prev.index('<script>\n/* DESIGN PREVIEW.'):prev.index('</script>', prev.index('/* DESIGN PREVIEW.')) + 9]
page = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<title>Design preview</title>\n' + head_preload + '\n'
        '<link rel="stylesheet" href="assets/styles.css?v=preview">\n' + iso + '\n</head>\n'
        '<body data-role="student" data-signed-role="teacher">\n' + shell + '\n' +
        '\n'.join('<script src="%s"></script>' % s for s in scripts) +
        '\n<script src="design/seed.js"></script>\n<script src="design/measure.js"></script>\n</body>\n</html>\n')
open(os.path.join(root, 'preview.html'), 'w').write(page)
print('preview.html rebuilt:', len(scripts), 'scripts')

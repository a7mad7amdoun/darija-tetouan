/* preview-only: report every element whose box runs past the viewport */
(function () {
  if (!/measure=1/.test(location.search)) return;
  var vw = document.documentElement.clientWidth, out = [];
  document.querySelectorAll('body *').forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.width && r.right > vw + 1) {
      var cs = getComputedStyle(el);
      out.push({ right: Math.round(r.right), w: Math.round(r.width),
        sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
             (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''),
        minw: cs.minWidth, ws: cs.whiteSpace, flex: cs.flexShrink });
    }
  });
  out.sort(function (a, b) { return b.right - a.right; });
  var pre = document.createElement('pre'); pre.id = 'MEASURE';
  pre.textContent = 'viewport ' + vw + ' / scrollWidth ' + document.documentElement.scrollWidth + '\n' +
    out.slice(0, 18).map(function (o) { return o.right + '  w' + o.w + '  ' + o.sel + '  min-width:' + o.minw + ' ws:' + o.ws; }).join('\n');
  document.body.appendChild(pre);
})();

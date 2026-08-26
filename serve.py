#!/usr/bin/env python3
"""Local dev server that refuses to let the browser cache anything.

Plain `python3 -m http.server` lets the browser reuse stale CSS/JS, which makes
edits look like they never happened. This sends no-store on every response.
"""
import http.server, socketserver, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def send_response(self, *a, **kw):          # drop Last-Modified revalidation
        super().send_response(*a, **kw)

    def log_message(self, fmt, *args):
        pass                                     # quiet

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), NoCache) as httpd:
    print("serving http://localhost:%d  (no-cache)" % PORT)
    httpd.serve_forever()

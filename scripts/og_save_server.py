"""
Local helper for exporting the link-preview JPGs (dev only, never deployed).

  python scripts/og_save_server.py
  then open  http://localhost:4700/scripts/og-export.html

Serves the repo like `python -m http.server`, plus one extra endpoint the
export page uses: POST /save?name=<page>.jpg writes the image into
assets/img/og/. It only accepts plain file names ending in .jpg, and only
listens on localhost.
"""
import http.server, os, re, socketserver, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img", "og")
PORT = 4700


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        name = urllib.parse.parse_qs(u.query).get("name", [""])[0]
        if u.path != "/save" or not re.fullmatch(r"[a-z0-9-]+\.jpg", name):
            self.send_error(400, "bad request")
            return
        data = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        with open(os.path.join(OUT, name), "wb") as f:
            f.write(data)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"saved")
        print("saved", name, len(data), "bytes")


if __name__ == "__main__":
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print("export page: http://localhost:%d/scripts/og-export.html" % PORT)
        httpd.serve_forever()

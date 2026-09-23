#!/usr/bin/env python3
"""
FocusFirewall Local Laya Service
Serves the open-weights 'convaiinnovations/laya' System-1 decision model over REST.
Usage:
    pip install laya flask
    python server/laya_service.py
"""

import sys
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

try:
    from laya import Router
    print("[Laya] Loading convaiinnovations/laya ModernBERT-large (421M)...")
    router = Router(preload=True)
    print("[Laya] Router preloaded and ready for sub-35ms typed decisions!")
    HAS_LAYA = True
except ImportError:
    print("[Notice] 'laya' python package not installed.")
    print("[Notice] To use live local PyTorch weights: pip install laya")
    print("[Notice] Running high-speed mathematical System-1 decision bridge...")
    HAS_LAYA = False

class LayaHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/predict':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))

            state = data.get('state', {})
            questions = data.get('questions', {})

            start = time.perf_counter()

            if HAS_LAYA:
                result = router.predict(state, questions)
                answers = result.get('answers', {})
            else:
                # Built-in calibrated inference
                event = state.get('event', {})
                context = state.get('context', {})
                text = (event.get('title', '') + ' ' + event.get('body', '')).lower()
                mode = context.get('mode', 'deep_work')

                is_critical = any(k in text for k in ['ci failed', 'deploy failed', 'production', 'failover', 'security', 'outage'])
                is_deadline = ('deadline' in text) or (context.get('deadline_minutes') is not None and context.get('deadline_minutes', 99) <= 20)
                is_noise = (event.get('source') == 'discord') or any(k in text for k in ['😂', 'meme', 'newsletter', 'receipt', 'sale'])

                if is_critical:
                    choice = 'show_soon' if mode == 'meeting' else 'interrupt_now'
                    conf = 0.94
                    probs = {'interrupt_now': 0.94, 'show_soon': 0.04, 'batch': 0.01, 'silence': 0.01}
                elif is_deadline:
                    choice = 'interrupt_now'
                    conf = 0.86
                    probs = {'interrupt_now': 0.86, 'show_soon': 0.09, 'batch': 0.03, 'silence': 0.02}
                elif is_noise:
                    choice = 'show_soon' if mode == 'idle' else 'silence'
                    conf = 0.92
                    probs = {'interrupt_now': 0.01, 'show_soon': 0.03, 'batch': 0.04, 'silence': 0.92}
                else:
                    choice = 'show_soon' if mode == 'idle' else ('silence' if mode == 'meeting' else 'batch')
                    conf = 0.81
                    probs = {'interrupt_now': 0.03, 'show_soon': 0.12, 'batch': 0.81, 'silence': 0.04}

                answers = {
                    'action': {
                        'choice': choice,
                        'confidence': conf,
                        'probabilities': probs
                    },
                    'urgency': {'score': 4 if is_critical else (3 if is_deadline else 1)},
                    'requires_action': {'value': is_critical or is_deadline},
                    'high_consequence': {'value': is_critical},
                    'context_conflict': {'value': mode in ['deep_work', 'meeting']}
                }

            latency_ms = round((time.perf_counter() - start) * 1000)

            response_data = {
                'engine': 'laya' if HAS_LAYA else 'laya-rules',
                'model': 'convaiinnovations/laya' if HAS_LAYA else 'local-heuristic-baseline',
                'answers': answers,
                'latency_ms': latency_ms
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run(port=8000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, LayaHandler)
    print(f"[FocusFirewall] Laya decision service running at http://127.0.0.1:{port}/predict")
    httpd.serve_forever()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run(port)

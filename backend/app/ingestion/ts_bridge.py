import json
import subprocess
import os

TS_PARSER_DIR = os.path.join(os.path.dirname(__file__), "ts_parser")


class TSNode:
    def __init__(self, d):
        self.id = d["id"]
        self.type = d["type"]
        self.name = d["name"]
        self.file_path = d["file_path"]
        self.line_number = d["line_number"]
        self.docstring = d.get("docstring")


class TSEdge:
    def __init__(self, d):
        self.source_id = d["source_id"]
        self.target_name = d["target_name"]
        self.type = d["type"]


def parse_ts_repo(repo_root):
    script_path = os.path.join(TS_PARSER_DIR, "parse.js")
    result = subprocess.run(
        ["node", script_path, repo_root],
        capture_output=True,
        text=True,
        cwd=TS_PARSER_DIR,
    )

    if result.returncode != 0:
        raise RuntimeError(f"TS parser failed: {result.stderr}")

    data = json.loads(result.stdout)
    nodes = [TSNode(n) for n in data["nodes"]]
    edges = [TSEdge(e) for e in data["edges"]]
    return nodes, edges
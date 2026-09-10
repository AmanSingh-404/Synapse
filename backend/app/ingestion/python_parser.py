import ast
import os
import hashlib


def make_node_id(repo_id: str, file_path: str, name: str, node_type: str) -> str:
    raw = f"{repo_id}:{file_path}:{node_type}:{name}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


class ParsedNode:
    def __init__(self, node_id, node_type, name, file_path, line_number, docstring=None):
        self.id = node_id
        self.type = node_type  # "file", "function", "class"
        self.name = name
        self.file_path = file_path
        self.line_number = line_number
        self.docstring = docstring


class ParsedEdge:
    def __init__(self, source_id, target_name, edge_type):
        self.source_id = source_id
        self.target_name = target_name  # resolved to an id later, in the loader
        self.type = edge_type  # "calls", "imports", "inherits"


def parse_python_file(file_path, repo_root, repo_id):
    """Parse a single .py file, returning (nodes, edges)."""
    nodes = []
    edges = []

    relative_path = os.path.relpath(file_path, repo_root)

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        source = f.read()

    try:
        tree = ast.parse(source, filename=relative_path)
    except SyntaxError:
        return nodes, edges  # skip unparseable files

    file_node_id = make_node_id(repo_id, relative_path, relative_path, "file")
    nodes.append(ParsedNode(
        node_id=file_node_id,
        node_type="file",
        name=relative_path,
        file_path=relative_path,
        line_number=0,
        docstring=ast.get_docstring(tree),
    ))

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
            func_id = make_node_id(repo_id, relative_path, node.name, "function")
            nodes.append(ParsedNode(
                node_id=func_id,
                node_type="function",
                name=node.name,
                file_path=relative_path,
                line_number=node.lineno,
                docstring=ast.get_docstring(node),
            ))
            # Function calls within this function's body
            for sub in ast.walk(node):
                if isinstance(sub, ast.Call) and isinstance(sub.func, ast.Name):
                    edges.append(ParsedEdge(func_id, sub.func.id, "calls"))

        elif isinstance(node, ast.ClassDef):
            class_id = make_node_id(repo_id, relative_path, node.name, "class")
            nodes.append(ParsedNode(
                node_id=class_id,
                node_type="class",
                name=node.name,
                file_path=relative_path,
                line_number=node.lineno,
                docstring=ast.get_docstring(node),
            ))
            # Inheritance
            for base in node.bases:
                if isinstance(base, ast.Name):
                    edges.append(ParsedEdge(class_id, base.id, "inherits"))

        elif isinstance(node, ast.Import):
            for alias in node.names:
                edges.append(ParsedEdge(file_node_id, alias.name, "imports"))

        elif isinstance(node, ast.ImportFrom):
            if node.module:
                edges.append(ParsedEdge(file_node_id, node.module, "imports"))

    return nodes, edges


def parse_repo(repo_root, repo_id):
    """Walk all .py files in the repo, return combined (nodes, edges)."""
    all_nodes = []
    all_edges = []

    for dirpath, dirnames, filenames in os.walk(repo_root):
        # Skip common noise directories
        dirnames[:] = [d for d in dirnames if d not in (".git", "venv", ".venv", "__pycache__", "node_modules")]

        for filename in filenames:
            if filename.endswith(".py"):
                file_path = os.path.join(dirpath, filename)
                nodes, edges = parse_python_file(file_path, repo_root, repo_id)
                all_nodes.extend(nodes)
                all_edges.extend(edges)

    return all_nodes, all_edges
def extract_chunks(nodes):
    """
    Turn parsed nodes (functions, classes, files) into text chunks
    suitable for embedding — one chunk per node that has a docstring.
    """
    chunks = []
    for node in nodes:
        if node.docstring:
            text = f"{node.type} {node.name} in {node.file_path}:\n{node.docstring}"
            chunks.append({
                "node_id": node.id,
                "text": text,
                "file_path": node.file_path,
                "name": node.name,
                "type": node.type,
            })
    return chunks
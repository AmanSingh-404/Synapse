from neo4j import GraphDatabase

NEO4J_URI = "bolt://127.0.0.1:7688"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "synapse123"


class Neo4jLoader:
    def __init__(self):
        self.driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

    def close(self):
        self.driver.close()

    def load_repo(self, repo_id: str, nodes, edges):
        with self.driver.session() as session:
            # Upsert nodes
            for node in nodes:
                session.run(
                    """
                    MERGE (n:CodeNode {id: $id})
                    SET n.type = $type,
                        n.name = $name,
                        n.file_path = $file_path,
                        n.line_number = $line_number,
                        n.docstring = $docstring,
                        n.repo_id = $repo_id
                    """,
                    id=node.id,
                    type=node.type,
                    name=node.name,
                    file_path=node.file_path,
                    line_number=node.line_number,
                    docstring=node.docstring or "",
                    repo_id=repo_id,
                )

            # Build a name->id lookup for resolving edges within this repo
            name_to_id = {}
            for n in nodes:
                name_to_id[n.name] = n.id
                if n.type == "file" and n.file_path.endswith(".py"):
                    module_path = n.file_path[:-3].replace("\\", "/").replace("/", ".")
                    name_to_id[module_path] = n.id

            # Upsert edges — only where we can resolve the target within this repo
            for edge in edges:
                target_id = name_to_id.get(edge.target_name)
                if target_id is None:
                    continue  # external import/call (e.g. "flask") — not a graph node, skip for now

                rel_type = edge.type.upper()  # CALLS, IMPORTS, INHERITS
                session.run(
                    f"""
                    MATCH (a:CodeNode {{id: $source_id}})
                    MATCH (b:CodeNode {{id: $target_id}})
                    MERGE (a)-[r:{rel_type}]->(b)
                    """,
                    source_id=edge.source_id,
                    target_id=target_id,
                )
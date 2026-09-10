from neo4j import GraphDatabase
from sentence_transformers import SentenceTransformer
import weaviate

NEO4J_URI = "bolt://127.0.0.1:7688"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "synapse123"

_embed_model = None


def get_embed_model():
    global _embed_model
    if _embed_model is None:
        _embed_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embed_model


def graph_query(repo_id: str, node_name: str, direction: str = "callers") -> list[dict]:
    """
    Query the code graph for structural relationships.
    direction: 'callers' (who calls this), 'callees' (what this calls),
               'importers' (what imports this file)
    """
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    results = []

    with driver.session() as session:
        if direction == "callers":
            query = """
                MATCH (caller)-[:CALLS]->(target {name: $name, repo_id: $repo_id})
                RETURN caller.name AS name, caller.file_path AS file_path, caller.type AS type
            """
        elif direction == "callees":
            query = """
                MATCH (source {name: $name, repo_id: $repo_id})-[:CALLS]->(callee)
                RETURN callee.name AS name, callee.file_path AS file_path, callee.type AS type
            """
        elif direction == "importers":
            query = """
                MATCH (importer)-[:IMPORTS]->(target {name: $name, repo_id: $repo_id})
                RETURN importer.name AS name, importer.file_path AS file_path, importer.type AS type
            """
        else:
            driver.close()
            return []

        result = session.run(query, name=node_name, repo_id=repo_id)
        for record in result:
            results.append(dict(record))

    driver.close()
    return results


def vector_search(repo_id: str, query: str, limit: int = 5) -> list[dict]:
    """
    Semantic search over docstring chunks for this repo.
    """
    model = get_embed_model()
    query_vector = model.encode(query).tolist()

    client = weaviate.connect_to_local(port=8081, grpc_port=50052)
    collection = client.collections.get("CodeChunk")

    from weaviate.classes.query import Filter
    results = collection.query.near_vector(
        near_vector=query_vector,
        limit=limit,
        filters=Filter.by_property("repo_id").equal(repo_id),
    )

    output = []
    for obj in results.objects:
        output.append({
            "name": obj.properties["name"],
            "type": obj.properties["type"],
            "file_path": obj.properties["file_path"],
            "text": obj.properties["text"],
        })

    client.close()
    return output
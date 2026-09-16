# from neo4j import GraphDatabase
# pyrefly: ignore [missing-import]
from sentence_transformers import SentenceTransformer
# import weaviate


# pyrefly: ignore [missing-import]
from app.db_clients import get_neo4j_driver, get_weaviate_client
# pyrefly: ignore [missing-import]
from app.embeddings import embed_text


def graph_query(repo_id: str, node_name: str, direction: str = "callers") -> list[dict]:
    """
    Query the code graph for structural relationships.
    direction: 'callers' (who calls this), 'callees' (what this calls),
               'importers' (what imports this file)
    """
    driver = get_neo4j_driver()
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
    query_vector = embed_text(query)

    client = get_weaviate_client()
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
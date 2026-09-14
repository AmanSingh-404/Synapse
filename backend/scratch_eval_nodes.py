from neo4j import GraphDatabase

NEO4J_URI = "bolt://127.0.0.1:7688"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "synapse123"
REPO_ID = "f9db6f53-a15a-4fa2-ac60-80fc95df0510"

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

with driver.session() as session:
    print("=== Classes ===")
    for r in session.run("MATCH (n {repo_id: $r, type: 'class'}) RETURN n.name AS name, n.file_path AS fp, n.docstring AS doc", r=REPO_ID):
        print(f"{r['name']:25} {r['fp']:40} doc={'yes' if r['doc'] else 'no'}")

    print("\n=== Functions with >=2 callers (good 'who calls X' candidates) ===")
    result = session.run("""
        MATCH (caller)-[:CALLS]->(target {repo_id: $r})
        WITH target, count(caller) AS caller_count
        WHERE caller_count >= 2
        RETURN target.name AS name, target.file_path AS fp, caller_count
        ORDER BY caller_count DESC
    """, r=REPO_ID)
    for r in result:
        print(f"{r['name']:25} {r['fp']:40} callers={r['caller_count']}")

    print("\n=== Functions/classes with docstrings (good 'what does X do' candidates) ===")
    result = session.run("""
        MATCH (n {repo_id: $r})
        WHERE n.docstring IS NOT NULL AND n.docstring <> '' AND n.type <> 'file'
        RETURN n.name AS name, n.type AS type, n.file_path AS fp
        ORDER BY n.file_path
    """, r=REPO_ID)
    for r in result:
        print(f"{r['type']:10} {r['name']:25} {r['fp']}")

driver.close()
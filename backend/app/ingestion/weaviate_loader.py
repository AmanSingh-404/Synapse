import weaviate
# pyrefly: ignore [missing-import]
from sentence_transformers import SentenceTransformer
from weaviate.util import generate_uuid5
# pyrefly: ignore [missing-import]
from app.db_clients import get_weaviate_client
# pyrefly: ignore [missing-import]
from app.embeddings import embed_text


class WeaviateLoader:
    def __init__(self):
        self.client = get_weaviate_client()
        self._ensure_collection()

    def _ensure_collection(self):
        if not self.client.collections.exists("CodeChunk"):
            self.client.collections.create(
                name="CodeChunk",
                properties=[
                    weaviate.classes.config.Property(name="node_id", data_type=weaviate.classes.config.DataType.TEXT),
                    weaviate.classes.config.Property(name="text", data_type=weaviate.classes.config.DataType.TEXT),
                    weaviate.classes.config.Property(name="file_path", data_type=weaviate.classes.config.DataType.TEXT),
                    weaviate.classes.config.Property(name="name", data_type=weaviate.classes.config.DataType.TEXT),
                    weaviate.classes.config.Property(name="type", data_type=weaviate.classes.config.DataType.TEXT),
                    weaviate.classes.config.Property(name="repo_id", data_type=weaviate.classes.config.DataType.TEXT),
                ],
                vectorizer_config=weaviate.classes.config.Configure.Vectorizer.none(),
            )

    def load_chunks(self, repo_id: str, chunks: list):
        collection = self.client.collections.get("CodeChunk")

        with collection.batch.dynamic() as batch:
            for chunk in chunks:
                vector = embed_text(chunk["text"])
                batch.add_object(
                    uuid=generate_uuid5(chunk["node_id"]),
                    properties={
                        "node_id": chunk["node_id"],
                        "text": chunk["text"],
                        "file_path": chunk["file_path"],
                        "name": chunk["name"],
                        "type": chunk["type"],
                        "repo_id": repo_id,
                    },
                    vector=vector,
                )

    def close(self):
        self.client.close()
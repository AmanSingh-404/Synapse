import weaviate
from sentence_transformers import SentenceTransformer

WEAVIATE_URL = "http://127.0.0.1:8081"

_model = None


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


class WeaviateLoader:
    def __init__(self):
        self.client = weaviate.connect_to_local(port=8081, grpc_port=50052)
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
        model = get_model()
        collection = self.client.collections.get("CodeChunk")

        with collection.batch.dynamic() as batch:
            for chunk in chunks:
                vector = model.encode(chunk["text"]).tolist()
                batch.add_object(
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
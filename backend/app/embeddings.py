from app.config import settings

_local_model = None


def embed_text(text: str) -> list[float]:
    if settings.hf_api_token:
        from huggingface_hub import InferenceClient
        client = InferenceClient(token=settings.hf_api_token)
        result = client.feature_extraction(text, model="sentence-transformers/all-MiniLM-L6-v2")
        vec = list(result)
        # Some HF paths return token-level embeddings (a list of vectors) instead of
        # one pooled sentence vector — mean-pool if so.
        if vec and isinstance(vec[0], (list, tuple)):
            length = len(vec)
            dim = len(vec[0])
            pooled = [sum(row[i] for row in vec) / length for i in range(dim)]
            return pooled
        return vec
    else:
        global _local_model
        if _local_model is None:
            from sentence_transformers import SentenceTransformer
            _local_model = SentenceTransformer("all-MiniLM-L6-v2")
        return _local_model.encode(text).tolist()
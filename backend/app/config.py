from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    github_client_id: str
    github_client_secret: str
    fernet_key: str = ""
    groq_api_key: str = ""
    hf_api_token: str = ""

    database_url: str = "postgresql+psycopg2://synapse:synapse@127.0.0.1:5434/synapse"

    neo4j_uri: str = "bolt://127.0.0.1:7688"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "synapse123"

    weaviate_url: str = ""       # empty = use local connect_to_local
    weaviate_api_key: str = ""

    jwt_private_key: str = ""    # PEM contents directly, for production
    jwt_public_key: str = ""

    frontend_url: str = "http://127.0.0.1:3001"
    backend_url: str = "http://127.0.0.1:8001"

    environment: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
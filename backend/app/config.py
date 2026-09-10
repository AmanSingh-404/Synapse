from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    github_client_id: str
    github_client_secret: str
    fernet_key: str = ""
    groq_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
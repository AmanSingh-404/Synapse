from neo4j import GraphDatabase
import weaviate
from weaviate.classes.init import Auth

from app.config import settings


def get_neo4j_driver():
    return GraphDatabase.driver(settings.neo4j_uri, auth=(settings.neo4j_user, settings.neo4j_password))


def get_weaviate_client():
    if settings.weaviate_url:
        return weaviate.connect_to_weaviate_cloud(
            cluster_url=settings.weaviate_url,
            auth_credentials=Auth.api_key(settings.weaviate_api_key),
        )
    return weaviate.connect_to_local(port=8081, grpc_port=50052)
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Supabase URL and KEY must be set in environment variables")

supabase: Client = create_client(url, key)

def get_similar_products(embedding, limit=10, threshold=0.7):
    try:
        result = supabase.rpc(
            'match_products',
            {
                'query_embedding': embedding,
                'match_threshold': threshold,
                'match_count': limit
            }
        ).execute()
        
        return result.data
    except Exception as e:
        print(f"Error querying Supabase: {e}")
        return []
import httpx
from typing import List, Dict
from app.core.config import settings

class OllamaService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.embedding_model = settings.OLLAMA_EMBEDDING_MODEL

    async def generate(self, prompt: str, system: str = None, temperature: float = 0.7, format: str = None) -> str:
        """Generate text using Ollama"""
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                payload = {
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": 2000  # Allow longer responses
                    }
                }
                
                if system:
                    payload["system"] = system
                
                # Force JSON output if requested (Ollama 0.1.16+)
                if format == "json":
                    payload["format"] = "json"

                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload
                )
                response.raise_for_status()
                return response.json().get("response", "")
        except Exception as e:
            print(f"Ollama generation error: {str(e)}")
            return ""

    async def embed(self, text: str) -> List[float]:
        """Generate embeddings using Ollama"""
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/embeddings",
                    json={
                        "model": self.embedding_model,
                        "prompt": text
                    }
                )
                response.raise_for_status()
                return response.json().get("embedding", [])
        except Exception as e:
            print(f"Ollama embedding error: {str(e)}")
            return []

    async def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7) -> str:
        """Chat with Ollama"""
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": False,
                        "options": {
                            "temperature": temperature
                        }
                    }
                )
                response.raise_for_status()
                return response.json().get("message", {}).get("content", "")
        except Exception as e:
            print(f"Ollama chat error: {str(e)}")
            return ""

ollama_service = OllamaService()

import os
import faiss
import numpy as np
import pickle
from typing import List, Dict, Tuple
from pathlib import Path
from pypdf import PdfReader
from docx import Document

from app.core.config import settings
from app.services.ollama_service import ollama_service
from app.services.moderation_service import moderation_service

class RAGService:
    def __init__(self):
        self.vector_store_path = Path(settings.VECTOR_STORE_PATH)
        self.vector_store_path.mkdir(exist_ok=True)
        self.chunk_size = settings.CHUNK_SIZE
        self.chunk_overlap = settings.CHUNK_OVERLAP

    def extract_text_from_file(self, file_path: str) -> str:
        """Extract text from PDF, DOCX, or TXT files"""
        file_extension = Path(file_path).suffix.lower()
        
        try:
            if file_extension == '.pdf':
                reader = PdfReader(file_path)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                return text
            
            elif file_extension == '.docx':
                doc = Document(file_path)
                text = ""
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\n"
                return text
            
            elif file_extension == '.txt':
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            
            else:
                return ""
        except Exception as e:
            print(f"Error extracting text from {file_path}: {str(e)}")
            return ""

    def chunk_text(self, text: str) -> List[str]:
        """Split text into chunks with overlap"""
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + self.chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += self.chunk_size - self.chunk_overlap
        
        return chunks

    async def create_vector_store(self, course_id: int, file_path: str, material_title: str) -> str:
        """Create FAISS vector store from document"""
        # Extract text
        text = self.extract_text_from_file(file_path)
        if not text:
            raise ValueError("Could not extract text from file")
        
        # Chunk text
        chunks = self.chunk_text(text)
        
        # Generate embeddings
        embeddings = []
        for chunk in chunks:
            embedding = await ollama_service.embed(chunk)
            if embedding:
                embeddings.append(embedding)
        
        if not embeddings:
            raise ValueError("Could not generate embeddings")
        
        # Create FAISS index
        dimension = len(embeddings[0])
        index = faiss.IndexFlatL2(dimension)
        embeddings_array = np.array(embeddings).astype('float32')
        index.add(embeddings_array)
        
        # Save index and metadata
        vector_store_id = f"course_{course_id}_{material_title.replace(' ', '_')}"
        index_path = self.vector_store_path / f"{vector_store_id}.index"
        metadata_path = self.vector_store_path / f"{vector_store_id}_metadata.pkl"
        
        faiss.write_index(index, str(index_path))
        
        metadata = {
            "chunks": chunks,
            "course_id": course_id,
            "material_title": material_title
        }
        with open(metadata_path, 'wb') as f:
            pickle.dump(metadata, f)
        
        return vector_store_id

    async def search_vector_store(self, course_id: int, query: str, top_k: int = 3, material_ids: List[int] = None) -> List[Dict]:
        """Search vector store for relevant documents, optionally filtered by material_ids"""
        from app.core.database import SessionLocal
        from app.models.course import CourseMaterial
        
        # If material_ids provided, get their vector_store_ids
        allowed_store_ids = None
        if material_ids:
            db = SessionLocal()
            try:
                materials = db.query(CourseMaterial).filter(
                    CourseMaterial.id.in_(material_ids),
                    CourseMaterial.course_id == course_id
                ).all()
                allowed_store_ids = {m.vector_store_id for m in materials if m.vector_store_id}
                print(f"Filtering by material_ids: {material_ids}")
                print(f"Allowed vector_store_ids: {allowed_store_ids}")
            finally:
                db.close()
        
        # Find all vector stores for this course
        course_stores = list(self.vector_store_path.glob(f"course_{course_id}_*.index"))
        print(f"Found {len(course_stores)} vector stores for course {course_id}")
        
        if not course_stores:
            print("No vector stores found!")
            return []
        
        all_results = []
        
        for store_path in course_stores:
            # Extract the full store ID from filename (everything after "course_{course_id}_")
            store_filename = store_path.stem  # e.g., "course_1_abc123.index"
            store_id = store_filename.replace(f"course_{course_id}_", "").replace(".index", "")
            
            print(f"Checking store: {store_filename}, extracted ID: {store_id}")
            
            # If material filtering is enabled, check if this store is allowed
            if allowed_store_ids is not None and store_id not in allowed_store_ids:
                print(f"Store {store_id} not in allowed list, skipping")
                continue
            
            print(f"Processing store: {store_id}")
                
            try:
                # Load index and metadata
                index = faiss.read_index(str(store_path))
                metadata_path = store_path.with_suffix('.pkl').with_name(
                    store_path.stem.replace('.index', '') + '_metadata.pkl'
                )
                
                with open(metadata_path, 'rb') as f:
                    metadata = pickle.load(f)
                
                # Generate query embedding
                query_embedding = await ollama_service.embed(query)
                if not query_embedding:
                    continue
                
                # Search
                query_vector = np.array([query_embedding]).astype('float32')
                distances, indices = index.search(query_vector, min(top_k, len(metadata["chunks"])))
                
                # Collect results
                for i, idx in enumerate(indices[0]):
                    if idx < len(metadata["chunks"]):
                        all_results.append({
                            "content": metadata["chunks"][idx],
                            "score": float(1 / (1 + distances[0][i])),  # Convert distance to similarity
                            "metadata": {
                                "material": metadata["material_title"],
                                "course_id": metadata["course_id"]
                            }
                        })
            except Exception as e:
                print(f"Error searching vector store {store_path}: {str(e)}")
                continue
        
        # Sort by score and return top k
        all_results.sort(key=lambda x: x["score"], reverse=True)
        return all_results[:top_k]

    async def query(self, query: str, course_id: int, conversation_history: List[Dict] = None, material_ids: List[int] = None) -> Dict:
        """Query the RAG system with optional material filtering"""
        # Moderate the query
        moderation_result = await moderation_service.moderate_content(query)
        if not moderation_result["passed"]:
            return {
                "answer": "I cannot respond to this query as it violates our content policy.",
                "sources": [],
                "confidence": 0.0,
                "moderation_passed": False,
                "moderation_warnings": moderation_result["warnings"]
            }
        
        # Search for relevant documents - only from selected materials if provided
        relevant_docs = await self.search_vector_store(course_id, query, top_k=3, material_ids=material_ids)
        
        if not relevant_docs:
            return {
                "answer": "I don't have enough information in the course materials to answer this question. Please ask your teacher to upload relevant materials.",
                "sources": [],
                "confidence": 0.0,
                "moderation_passed": True,
                "moderation_warnings": []
            }
        
        # Build context from relevant documents
        context = "\n\n".join([doc["content"] for doc in relevant_docs])
        
        # Build conversation history
        messages = []
        if conversation_history:
            messages.extend(conversation_history[-5:])  # Last 5 messages for context
        
        # Create prompt
        system_prompt = """You are a helpful AI Co-Instructor. Your role is to:
1. Answer questions based on the provided course materials
2. Be clear, concise, and educational
3. Cite sources when possible
4. Admit when you don't know something
5. Encourage critical thinking

Use the following context to answer the student's question:"""
        
        user_prompt = f"""{system_prompt}

Context from course materials:
{context}

Student Question: {query}

Please provide a helpful, accurate answer based on the course materials."""
        
        messages.append({"role": "user", "content": user_prompt})
        
        # Generate response
        answer = await ollama_service.chat(messages)
        
        # Moderate the response
        response_moderation = await moderation_service.moderate_content(answer)
        
        # Calculate confidence based on relevance scores
        avg_confidence = sum(doc["score"] for doc in relevant_docs) / len(relevant_docs)
        
        return {
            "answer": answer,
            "sources": [
                {
                    "content": doc["content"][:200] + "...",  # Truncate for display
                    "score": doc["score"],
                    "metadata": doc["metadata"]
                }
                for doc in relevant_docs
            ],
            "confidence": avg_confidence,
            "moderation_passed": response_moderation["passed"],
            "moderation_warnings": response_moderation["warnings"]
        }

rag_service = RAGService()

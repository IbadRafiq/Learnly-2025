from typing import List, Dict
import json
from app.services.ollama_service import ollama_service
from app.services.rag_service import rag_service

class QuizService:
    
    async def generate_quiz(
        self,
        course_id: int,
        topic: str = None,
        difficulty: str = "medium",
        num_questions: int = 5,
        material_ids: List[int] = None
    ) -> Dict:
        """Generate adaptive quiz using AI from specific materials"""
        
        # Get course context
        if topic:
            context_query = f"Provide information about {topic}"
        else:
            context_query = "Provide a summary of the main topics in this course"
        
        # Search course materials - only from selected materials if provided
        print(f"Searching for quiz content with material_ids: {material_ids}")
        relevant_docs = await rag_service.search_vector_store(
            course_id, 
            context_query, 
            top_k=5,
            material_ids=material_ids
        )
        
        print(f"Found {len(relevant_docs)} relevant documents")
        
        if not relevant_docs:
            # If no results with material filtering, try without filtering as fallback
            if material_ids:
                print("No results with material filtering, trying without filter...")
                relevant_docs = await rag_service.search_vector_store(
                    course_id, 
                    context_query, 
                    top_k=5,
                    material_ids=None
                )
                
            if not relevant_docs:
                return {
                    "error": "No course materials found to generate quiz. Please ensure materials are uploaded and vector stores are created. Check backend logs for details."
                }
        
        # Build context
        context = "\n\n".join([doc["content"] for doc in relevant_docs])
        
        # Create prompt for quiz generation
        prompt = f"""You are an expert educator. Generate EXACTLY {num_questions} quiz questions based on the following course material.

Course Material:
{context}

Instructions:
- Difficulty level: {difficulty}
- Topic focus: {topic if topic else "Cover main concepts from the material"}
- Create multiple choice questions with 4 options each
- Make sure ALL questions are directly based on the material above
- Each correct answer must be factually accurate based on the material
- Write clear, specific questions

IMPORTANT: You MUST respond with ONLY valid JSON in this exact format (no other text):

{{
    "questions": [
        {{
            "question_text": "What is the main concept of...?",
            "question_type": "multiple_choice",
            "options": ["First option", "Second option", "Third option", "Fourth option"],
            "correct_answer": "First option",
            "explanation": "Brief explanation based on the material",
            "difficulty": "{difficulty}"
        }}
    ]
}}

Generate {num_questions} questions now as JSON only:"""
        
        # Generate quiz with JSON format enforced
        print("Sending prompt to AI with JSON format...")
        response = await ollama_service.generate(prompt, temperature=0.7, format="json")
        print(f"Received response (first 500 chars): {response[:500]}")
        
        try:
            # Clean the response aggressively
            original_response = response
            response = response.strip()
            
            # Remove markdown code blocks
            if "```json" in response:
                response = response.split("```json")[1]
            elif "```" in response:
                parts = response.split("```")
                if len(parts) >= 2:
                    response = parts[1]
            
            if "```" in response:
                response = response.split("```")[0]
            
            response = response.strip()
            
            # Try to find JSON if response contains extra text
            if not response.startswith("{"):
                # Look for first {
                start = response.find("{")
                if start != -1:
                    response = response[start:]
            
            if not response.endswith("}"):
                # Look for last }
                end = response.rfind("}")
                if end != -1:
                    response = response[:end+1]
            
            print(f"Cleaned response: {response[:300]}...")
            
            # Parse JSON
            quiz_data = json.loads(response)
            
            # Validate structure
            if "questions" not in quiz_data or not isinstance(quiz_data["questions"], list):
                raise ValueError("Invalid quiz structure")
            
            if len(quiz_data["questions"]) == 0:
                raise ValueError("No questions generated")
            
            print(f"Successfully parsed {len(quiz_data['questions'])} questions")
            return quiz_data
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"JSON parsing failed: {str(e)}")
            print(f"Original response: {original_response[:1000]}")
            
            # Return error instead of fake questions
            return {
                "error": f"Failed to generate quiz. AI response was not valid JSON. Please try again or check if Ollama is working correctly. Error: {str(e)}"
            }

    def calculate_adaptive_difficulty(self, student_history: List[Dict]) -> str:
        """Calculate adaptive difficulty based on student performance"""
        if not student_history:
            return "medium"
        
        recent_scores = [attempt["percentage"] for attempt in student_history[-5:]]
        avg_score = sum(recent_scores) / len(recent_scores)
        
        if avg_score >= 80:
            return "hard"
        elif avg_score >= 60:
            return "medium"
        else:
            return "easy"

    def grade_quiz(self, questions: List[Dict], answers: List[Dict]) -> Dict:
        """Grade a quiz attempt"""
        total_points = 0
        earned_points = 0
        results = []
        
        # Create answer lookup
        answer_lookup = {ans["question_id"]: ans["student_answer"] for ans in answers}
        
        for question in questions:
            total_points += question.get("points", 1)
            student_answer = answer_lookup.get(question["id"], "")
            correct_answer = question["correct_answer"]
            
            is_correct = self._check_answer(
                student_answer,
                correct_answer,
                question["question_type"]
            )
            
            points_earned = question.get("points", 1) if is_correct else 0
            earned_points += points_earned
            
            results.append({
                "question_id": question["id"],
                "student_answer": student_answer,
                "correct_answer": correct_answer,
                "is_correct": is_correct,
                "points_earned": points_earned,
                "explanation": question.get("explanation", "")
            })
        
        percentage = (earned_points / total_points * 100) if total_points > 0 else 0
        
        return {
            "total_points": total_points,
            "earned_points": earned_points,
            "percentage": percentage,
            "results": results
        }

    def _check_answer(self, student_answer: str, correct_answer: str, question_type: str) -> bool:
        """Check if student answer is correct"""
        student_answer = student_answer.strip().lower()
        correct_answer = correct_answer.strip().lower()
        
        if question_type == "multiple_choice":
            return student_answer == correct_answer
        elif question_type == "true_false":
            return student_answer == correct_answer
        elif question_type == "short_answer":
            # Simple substring matching for short answer
            return correct_answer in student_answer or student_answer in correct_answer
        else:
            return student_answer == correct_answer

quiz_service = QuizService()

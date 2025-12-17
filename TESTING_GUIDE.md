# Material Indexing Bug Fix - Testing Guide

## Problem Fixed
The AI chat and quiz generation features were not finding uploaded materials due to a bug in the vector store ID extraction logic.

## What Was Changed
**File**: `backend/app/services/rag_service.py`

### Key Changes:
1. **Line 141**: Changed from extracting partial ID to using full vector_store_id
   - **Before**: `store_id = store_filename.replace(f"course_{course_id}_", "").replace(".index", "")`
   - **After**: `vector_store_id = store_path.stem`
   
2. **Added Better Error Logging**:
   - Shows the search path and pattern when no stores are found
   - Prints each store file being processed
   - Shows the extracted vector_store_id
   - Prints traceback for debugging errors
   - Confirms when metadata file is found/not found
   - Shows number of results found from each store

3. **Fixed Metadata Path Construction**:
   - **Before**: Complex path manipulation that could fail
   - **After**: Simple direct path construction using vector_store_id

## How to Test

### Step 1: Restart the Backend
```bash
cd backend
# Stop the backend if running
# Then restart it
python -m uvicorn app.main:app --reload
```

### Step 2: Upload a Test Material
1. Login as a teacher
2. Go to a course
3. Upload a PDF, DOCX, or TXT file
4. Check the backend console for these messages:
   ```
   Creating vector store for course...
   Vector store created: course_{id}_{title}
   ```

### Step 3: Test AI Chat
1. Login as a student enrolled in the course
2. Go to the AI Chat for that course
3. Ask a question about the material
4. Check backend console for:
   ```
   Found X vector stores for course {id}
   Processing store file: course_{id}_{title}.index
   Extracted vector_store_id: course_{id}_{title}
   Found Y results from course_{id}_{title}
   Returning Z total results
   ```

### Step 4: Test Quiz Generation
1. Login as a teacher
2. Go to the course
3. Try to generate a quiz
4. Select the uploaded materials
5. Check if quiz questions are generated successfully

## Expected Behavior After Fix

### ✅ Successful Material Upload
```
Material uploaded successfully
Vector store created: course_1_Introduction_to_Python
```

### ✅ Successful AI Chat Query
Backend console should show:
```
Found 1 vector stores for course 1
Processing store file: course_1_Introduction_to_Python.index
Extracted vector_store_id: course_1_Introduction_to_Python
Found 3 results from course_1_Introduction_to_Python
Returning 3 total results
```

Frontend should display:
- AI response based on the material
- Source citations showing the material title
- Confidence score

### ✅ Successful Quiz Generation
- Quiz questions should be generated based on selected materials
- Questions should be relevant to the material content

## Troubleshooting

### If Materials Still Not Found:

1. **Check Vector Store Directory**:
   ```bash
   ls -la backend/vector_stores/
   ```
   Should show files like:
   - `course_1_Material_Title.index`
   - `course_1_Material_Title_metadata.pkl`

2. **Check Database**:
   Query the `course_materials` table to see if `vector_store_id` is set:
   ```sql
   SELECT id, title, vector_store_id FROM course_materials;
   ```
   The `vector_store_id` should match the filename (without .index extension)

3. **Re-upload Materials**:
   If you uploaded materials before the fix, they might have incorrect vector_store_ids.
   - Delete the old materials
   - Re-upload them
   - The new uploads will have correct vector_store_ids

4. **Check Ollama Service**:
   Make sure Ollama is running:
   ```bash
   ollama list
   ```
   Should show the embedding model (e.g., `llama3.2`)

5. **Check Backend Logs**:
   Look for error messages in the backend console when:
   - Uploading materials
   - Querying AI chat
   - Generating quizzes

## Additional Notes

### Material Upload Process:
1. File is saved to `uploads/course_{id}/`
2. Text is extracted from the file
3. Text is chunked into smaller pieces
4. Embeddings are generated for each chunk using Ollama
5. FAISS index is created and saved
6. Metadata (chunks, course_id, material_title) is saved
7. Material record is saved to database with `vector_store_id`

### AI Chat Query Process:
1. Query is moderated for safety
2. Vector stores for the course are found
3. Query embedding is generated
4. Similar chunks are found using FAISS
5. Context is built from relevant chunks
6. LLM generates response using context
7. Response is moderated
8. Response with sources is returned

### Common Issues:
- **"No vector stores found"**: Materials not uploaded or upload failed
- **"Could not generate embeddings"**: Ollama service not running
- **"Failed to create vector store"**: File extraction or embedding generation failed
- **Empty AI responses**: No relevant chunks found or LLM issue

## Verification Checklist
- [ ] Backend restarts without errors
- [ ] Can upload materials successfully
- [ ] Vector store files are created in `vector_stores/` directory
- [ ] Database has correct `vector_store_id` values
- [ ] AI chat returns relevant answers
- [ ] Source citations are shown
- [ ] Quiz generation works with selected materials
- [ ] Backend logs show successful vector store searches

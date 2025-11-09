# Debugging Quiz Generation Issues

## Current Issue
Quiz generation fails with "materials need to be indexed and uploaded" even though materials are uploaded.

## ✅ Fixes Applied

### 1. Added Comprehensive Logging
- Backend now logs material IDs being requested
- Shows which materials are found in database
- Displays vector_store_id for each material
- Shows vector stores found on filesystem
- Logs filtering decisions

### 2. Added Vector Store Validation
- Checks if materials have vector_store_id before generating quiz
- Returns clear error message if materials aren't indexed
- Lists which materials are missing vector stores

### 3. Added Fallback Mechanism
- If filtered search returns no results, tries without filter
- Helps identify if issue is with filtering or indexing

## 🔍 How to Debug

### Step 1: Check Backend Logs

**Restart backend with logging:**
```bash
cd backend
uvicorn app.main:app --reload
```

**Try to generate quiz and watch for these logs:**

```
Requested material_ids: [1, 2, 3]
Found 3 materials
  Material 1: Python Basics.pdf, vector_store_id: abc123
  Material 2: Advanced Python.pdf, vector_store_id: def456
  Material 3: Algorithms.pdf, vector_store_id: None  # ❌ PROBLEM!

Searching for quiz content with material_ids: [1, 2, 3]
Filtering by material_ids: [1, 2, 3]
Allowed vector_store_ids: {'abc123', 'def456'}
Found 5 vector stores for course 1
Checking store: course_1_abc123.index, extracted ID: abc123
Processing store: abc123
Checking store: course_1_def456.index, extracted ID: def456  
Processing store: def456
Found 10 relevant documents
```

### Step 2: Identify the Problem

**A. Materials Missing Vector Stores**

If you see:
```
Materials without vector stores: ['Algorithms.pdf']
```

**Cause:** Material uploaded but vector store creation failed

**Solution:**
1. Check if Ollama is running: `ollama list`
2. Re-upload the material
3. Check for errors during upload
4. Ensure file is PDF, DOCX, or TXT

**B. No Vector Stores Found**

If you see:
```
Found 0 vector stores for course 1
```

**Cause:** Vector stores were never created

**Solution:**
1. Delete and re-upload ALL materials
2. Check `backend/vector_stores/` folder exists
3. Check permissions on folder

**C. Vector Store ID Mismatch**

If you see:
```
Filtering by material_ids: [1, 2]
Allowed vector_store_ids: {'abc123', 'def456'}
Found 2 vector stores for course 1
Checking store: course_1_xyz789, extracted ID: xyz789
Store xyz789 not in allowed list, skipping
Found 0 relevant documents
```

**Cause:** Vector store IDs don't match database

**Solution:**
1. Check database: `SELECT id, title, vector_store_id FROM course_materials WHERE course_id = 1;`
2. Check filesystem: List files in `backend/vector_stores/`
3. IDs should match

### Step 3: Quick Fixes

**Fix 1: Clear and Re-upload**
```bash
# Stop backend
# Delete vector stores
rm -rf backend/vector_stores/*

# Delete uploads
rm -rf backend/uploads/*

# Restart backend
uvicorn app.main:app --reload

# Re-upload all materials through UI
```

**Fix 2: Check Ollama**
```bash
# Check if running
ollama list

# If not installed/running
ollama serve

# Pull required model
ollama pull llama2
```

**Fix 3: Manual Vector Store Creation**
```python
# In backend folder
python
>>> from app.services.rag_service import rag_service
>>> import asyncio
>>> 
>>> async def test():
...     result = await rag_service.create_vector_store(
...         course_id=1,
...         file_path="uploads/course_1/test.pdf",
...         material_title="Test Material"
...     )
...     print(f"Vector store created: {result}")
>>> 
>>> asyncio.run(test())
```

## 🧪 Testing Checklist

### Before Generating Quiz:

1. **Check Materials Are Uploaded:**
   ```sql
   SELECT id, title, file_path, vector_store_id 
   FROM course_materials 
   WHERE course_id = 1;
   ```
   - ✅ All materials have `vector_store_id` (not NULL)

2. **Check Vector Store Files Exist:**
   ```bash
   ls -la backend/vector_stores/
   ```
   - ✅ Files like `course_1_abc123.index` exist
   - ✅ Files like `course_1_abc123_metadata.pkl` exist

3. **Check Ollama:**
   ```bash
   ollama list
   ```
   - ✅ At least one model is available

4. **Check Backend Running:**
   - ✅ No errors in backend terminal
   - ✅ Backend responding to requests

### During Quiz Generation:

1. **Watch Backend Logs:**
   - ✅ "Requested material_ids" appears
   - ✅ All materials found
   - ✅ All materials have vector_store_id
   - ✅ Vector stores found
   - ✅ Documents found

2. **Check Frontend Console:**
   ```javascript
   // Should see:
   Uploading material: {...}
   Upload successful: {...}
   ```

## 🐛 Common Errors & Solutions

### Error: "Some materials are not indexed yet"

**What it means:** Materials uploaded but no vector stores

**Fix:**
1. Wait 30 seconds after upload (indexing takes time)
2. Re-upload materials
3. Check Ollama is running

### Error: "No course materials found to generate quiz"

**What it means:** Search returned empty

**Debug:**
1. Check logs for "Found X relevant documents"
2. If 0 documents:
   - Check vector stores exist
   - Check material_ids are correct
   - Check Ollama embeddings working

### Error: "One or more material IDs are invalid"

**What it means:** Selected materials don't exist or belong to different course

**Fix:**
1. Refresh page
2. Check you're in correct course
3. Check materials haven't been deleted

## 📊 Database Queries for Debugging

### Check Material Status:
```sql
SELECT 
    cm.id,
    cm.title,
    cm.file_type,
    cm.vector_store_id,
    cm.uploaded_at,
    c.title as course_title
FROM course_materials cm
JOIN courses c ON cm.course_id = c.id
WHERE cm.course_id = 1;
```

### Check if Vector Stores Match:
```sql
SELECT 
    id,
    title,
    vector_store_id,
    CASE 
        WHEN vector_store_id IS NULL THEN 'MISSING'
        ELSE 'OK'
    END as status
FROM course_materials
WHERE course_id = 1;
```

## 🔄 Complete Reset Procedure

If nothing works, do a complete reset:

### 1. Stop Backend
```bash
# Press Ctrl+C in backend terminal
```

### 2. Clean Everything
```bash
cd backend

# Delete vector stores
rm -rf vector_stores/*

# Delete uploads
rm -rf uploads/*

# Clean database
python
>>> from app.core.database import SessionLocal
>>> from app.models.course import CourseMaterial
>>> db = SessionLocal()
>>> db.query(CourseMaterial).filter(CourseMaterial.course_id == 1).delete()
>>> db.commit()
>>> exit()
```

### 3. Restart Backend
```bash
uvicorn app.main:app --reload
```

### 4. Re-upload Materials
- Upload 1-2 simple PDF or TXT files
- Wait for "Upload successful" message
- Check backend logs for vector store creation

### 5. Test Quiz Generation
- Select uploaded materials
- Generate quiz
- Check logs

## 💡 Prevention Tips

### For Successful Uploads:

1. **Use Simple Files First:**
   - Start with .txt files
   - Then try .pdf
   - Avoid corrupted files

2. **One at a Time:**
   - Upload one material
   - Wait for success
   - Then upload next

3. **Check After Each Upload:**
   ```bash
   # In backend terminal, you should see:
   Creating vector store for: Material Name
   Vector store created successfully: abc123
   ```

4. **Keep Ollama Running:**
   - Start Ollama before backend
   - Don't stop during uploads

## 📞 Still Having Issues?

If quiz generation still fails:

1. **Provide these logs:**
   - Backend terminal output during quiz generation
   - Frontend console output
   - Result of: `ls -la backend/vector_stores/`
   - Result of database query above

2. **Try the test script:**
   ```python
   # test_quiz.py
   import asyncio
   from app.services.rag_service import rag_service
   
   async def test():
       docs = await rag_service.search_vector_store(
           course_id=1,
           query="test",
           top_k=5,
           material_ids=[1, 2]
       )
       print(f"Found {len(docs)} documents")
       for doc in docs:
           print(f"  - {doc['metadata']['material']}: {doc['content'][:100]}...")
   
   asyncio.run(test())
   ```

3. **Check these locations:**
   - `backend/uploads/course_1/` - files exist?
   - `backend/vector_stores/` - .index and .pkl files exist?
   - Database - vector_store_id populated?

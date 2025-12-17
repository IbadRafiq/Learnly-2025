# RAG Service Bug Fix

## Problem
The material indexing system has a bug where materials are uploaded and indexed, but the AI chat cannot find them. This is due to a mismatch in how vector_store_ids are created vs. how they're searched.

## Root Cause
In `rag_service.py`, line 140:
```python
store_id = store_filename.replace(f"course_{course_id}_", "").replace(".index", "")
```

The problem:
1. `store_path.stem` already removes the `.index` extension
2. So `store_filename` is like `"course_1_Material_Title"`
3. Calling `.replace(".index", "")` does nothing
4. But the actual `vector_store_id` stored in the database is the FULL filename stem: `"course_1_Material_Title"`
5. The code tries to extract just `"Material_Title"` part, which doesn't match the database

## Solution
Change line 140 to:
```python
vector_store_id = store_filename  # This is the full ID stored in database
```

And update the comparison logic to use the full vector_store_id.

## Files to Fix
1. `backend/app/services/rag_service.py` - Lines 137-149

## Additional Improvements
1. Add better error logging to show what vector stores are found
2. Add logging to show the vector_store_path being searched
3. Add traceback printing for debugging
4. Verify metadata file exists before trying to load it

# Quiz Questions Generation Fix

## ❌ Problem
Quiz was generating fake/sample questions like:
- "Sample question based on course materials?"
- Options: "Option A", "Option B", "Option C", "Option D"

## ✅ Root Cause
The AI (Ollama) was not returning valid JSON, so the fallback mechanism was triggered, creating those sample questions.

## 🔧 Fixes Applied

### 1. Improved Prompt
**Before:** Generic prompt that didn't enforce JSON
**After:** 
- Clear instruction to return ONLY JSON
- Explicit format requirements
- Better context from materials
- Specific instructions to base questions on material

### 2. Enhanced JSON Parsing
**Added:**
- Aggressive cleaning of AI response
- Removes markdown code blocks
- Extracts JSON from surrounding text
- Better error messages showing what went wrong
- Logging to see actual AI responses

### 3. Force JSON Format
**Added:**
- `format="json"` parameter to Ollama API
- Works with Ollama 0.1.16+ to guarantee JSON output
- Increased token limit for longer quizzes
- Lower temperature (0.7 instead of 0.8) for more consistent output

### 4. Better Error Handling
**Before:** Returns fake sample questions
**After:** Returns error message explaining what went wrong

## 🧪 Testing the Fix

### Step 1: Restart Backend
```bash
cd backend
uvicorn app.main:app --reload
```

### Step 2: Check Ollama Version
```bash
ollama --version
```
Should be 0.1.16 or higher for JSON format support

### Step 3: Generate Quiz
1. Upload a material (PDF or TXT with actual content)
2. Wait for "Upload successful"
3. Select the material in quiz generation
4. Click "Generate Quiz"
5. **Watch backend terminal**

### Step 4: Check Logs

**You should see:**
```
Sending prompt to AI with JSON format...
Received response (first 500 chars): {"questions": [{"question_text": "What is...
Cleaned response: {"questions": [{"question_text":...
Successfully parsed 5 questions
```

**If you see:**
```
JSON parsing failed: ...
Original response: Here are some questions...
```
Then AI didn't return JSON (see troubleshooting below)

## 🐛 Troubleshooting

### Issue 1: Still Getting Sample Questions

**Symptom:** Questions still show "Sample question based on course materials?"

**Cause:** JSON parsing is still failing

**Debug:**
1. Check backend logs for "JSON parsing failed"
2. Look at "Original response" in logs
3. See what AI actually returned

**Fix:**
- Update Ollama: `ollama pull llama2`
- Try different model: Change `OLLAMA_MODEL` in .env
- Check if Ollama is running: `ollama list`

### Issue 2: AI Returns Non-JSON Text

**Symptom:** Backend logs show AI returning text instead of JSON

**Example:**
```
Here are 5 questions based on the material:

1. What is Python?
...
```

**Fix Options:**

**Option A: Update Ollama**
```bash
# Update to latest version
curl -fsSL https://ollama.com/install.sh | sh

# Pull a better model for JSON
ollama pull mistral
```

**Option B: Use Different Model**
Edit `.env`:
```
OLLAMA_MODEL=mistral  # Better at JSON than llama2
```

**Option C: Manual JSON Extraction**
If AI keeps returning text, we can add a text-to-JSON converter (more complex)

### Issue 3: Questions Not Based on Material

**Symptom:** Questions are generic, not specific to uploaded content

**Cause:** 
1. Vector stores not working
2. Wrong materials selected
3. Material content is too generic

**Fix:**
1. Check vector stores created: `ls backend/vector_stores/`
2. Verify material has good content (not just images/tables)
3. Upload materials with clear text content

### Issue 4: Error "Failed to generate quiz"

**Symptom:** Frontend shows error message

**Check Backend Logs For:**
```
Error: Failed to generate quiz. AI response was not valid JSON...
```

**Solutions:**
1. Check Ollama is running: `curl http://localhost:11434/api/version`
2. Test Ollama directly:
   ```bash
   curl http://localhost:11434/api/generate -d '{
     "model": "llama2",
     "prompt": "Say hello in JSON format: {\"message\": \"hello\"}",
     "format": "json",
     "stream": false
   }'
   ```
3. If Ollama responds, check model is downloaded: `ollama list`

## 📋 Expected Behavior Now

### Good Quiz Output:
```json
{
  "questions": [
    {
      "question_text": "What is the primary purpose of variables in Python?",
      "question_type": "multiple_choice",
      "options": [
        "To store data values",
        "To create loops",
        "To define functions",
        "To import modules"
      ],
      "correct_answer": "To store data values",
      "explanation": "Variables in Python are used to store data values that can be referenced and manipulated throughout the program.",
      "difficulty": "medium"
    }
  ]
}
```

### What Students See:
- Real, specific questions based on material
- Meaningful options (not "Option A, B, C, D")
- Questions test understanding of uploaded content
- Each question has explanation

## 🎯 Best Practices for Good Quizzes

### 1. Upload Quality Materials
- ✅ Clear, well-formatted PDFs
- ✅ Text files with structured content
- ✅ DOCX with actual content (not just images)
- ❌ Scanned PDFs with no text
- ❌ Image-only files
- ❌ Empty or very short files

### 2. Select Relevant Materials
- Choose materials covering the topic
- Don't select unrelated materials
- 2-3 materials per quiz works best

### 3. Use Appropriate Difficulty
- **Easy:** Basic definitions, simple facts
- **Medium:** Application of concepts
- **Hard:** Complex scenarios, analysis

### 4. Specify Topic (Optional)
- Leaving blank = quiz covers everything
- Specific topic = focused questions
- Example: "Variables and Data Types" vs blank

## 🔍 Verify Fix is Working

### Quick Test:

1. **Create simple test file:**
   ```
   test.txt content:
   Python is a programming language.
   Variables store data.
   Functions are reusable code blocks.
   ```

2. **Upload to course**

3. **Generate 3-question quiz** from it

4. **Expected questions:**
   - "What is Python?"
   - "What do variables do?"
   - "What are functions?"

5. **NOT expected:**
   - "Sample question based on course materials?"
   - Generic Option A, B, C, D

## 📞 If Still Not Working

### Provide These Details:

1. **Backend Terminal Output:**
   - Full output when generating quiz
   - Especially "Received response" and "JSON parsing" lines

2. **Ollama Version:**
   ```bash
   ollama --version
   ```

3. **Ollama Model:**
   ```bash
   ollama list
   ```

4. **Test Ollama JSON:**
   ```bash
   curl http://localhost:11434/api/generate -d '{
     "model": "llama2",
     "prompt": "Return JSON: {\"test\": \"value\"}",
     "format": "json",
     "stream": false
   }'
   ```

5. **Material Content:**
   - What type of file?
   - How much content?
   - Is text extractable?

## 🎉 Success Criteria

Quiz generation is working when:
- ✅ Questions are specific to your material
- ✅ Options are meaningful (not generic A, B, C, D)
- ✅ Correct answers make sense
- ✅ Explanations reference the material
- ✅ Number of questions matches request
- ✅ No "Sample question" text appears

The fix should make all of this work! Try it now and check the backend logs.

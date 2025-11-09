# Competency Score Update Fix

## ❌ Problem
Student's competency score was not updating in their profile after taking quizzes, even though they scored well or poorly.

## ✅ Root Cause
The competency score WAS being updated in the database, but the frontend was displaying cached user data from the auth store. The auth store wasn't refreshing after quiz submission.

## 🔧 Fixes Applied

### 1. Backend - Added Detailed Logging
**File:** `backend/app/api/quiz.py`

**Added:**
- Logs showing old vs new competency score
- Shows each quiz attempt and its weight in calculation
- Displays weighted average performance
- Confirms when competency is successfully updated

**You'll now see in backend logs:**
```
Updating competency for student 5
  Current competency: 50
  Quiz score: 80.0%
  Recent attempts: 3
    Attempt 1: 80.0% (weight: 1.00)
    Attempt 2: 60.0% (weight: 0.50)
    Attempt 3: 70.0% (weight: 0.33)
  Weighted average: 72.73%
  New competency: 59
Competency updated successfully: 50 -> 59
```

### 2. Frontend - Auto-Refresh User Data
**File:** `frontend/src/pages/student/Quiz.jsx`

**Changes:**
- After quiz submission, fetch fresh user data from backend
- Update auth store with new competency score
- This ensures profile page shows updated score

**Flow:**
1. Student submits quiz ✅
2. Backend calculates score and updates competency ✅
3. Frontend receives quiz result ✅
4. **NEW:** Frontend fetches fresh user data ✅
5. **NEW:** Auth store updated with new competency ✅
6. Profile page shows updated score ✅

## 📊 How Competency Score is Calculated

### Algorithm:
```
1. Get student's last 5 quiz attempts
2. Weight recent attempts higher:
   - Most recent: weight = 1.0
   - Second: weight = 0.5
   - Third: weight = 0.33
   - Fourth: weight = 0.25
   - Fifth: weight = 0.20

3. Calculate weighted average of quiz scores

4. Update competency:
   New = (60% × Old Competency) + (40% × Weighted Average)

5. Clamp between 0 and 100
```

### Example:
**Student starts with competency: 50**

**Takes 3 quizzes:**
- Quiz 1: 80% (most recent)
- Quiz 2: 60%
- Quiz 3: 70%

**Weighted Average:**
```
(80 × 1.0) + (60 × 0.5) + (70 × 0.33) / (1.0 + 0.5 + 0.33)
= 72.73%
```

**New Competency:**
```
(0.6 × 50) + (0.4 × 72.73)
= 30 + 29.09
= 59
```

**Result: Competency updated from 50 → 59**

## 🧪 Testing the Fix

### Step 1: Check Current Competency
1. Login as student
2. Go to Profile page
3. Note current competency score (e.g., 50/100)

### Step 2: Take a Quiz
1. Go to a course
2. Take a quiz in "Quizzes" tab
3. Submit answers
4. **Watch backend terminal** for logs

### Step 3: Verify Backend Update
Backend logs should show:
```
Updating competency for student X
  Current competency: 50
  Quiz score: 80%
  New competency: 59
Competency updated successfully: 50 -> 59
```

### Step 4: Check Profile
1. Wait for quiz result screen (3 seconds)
2. Go to Profile page
3. **Competency should be updated!** (e.g., now 59/100)

### Step 5: See Progress Bar
- Bar should move to reflect new score
- Level should update (Beginner/Intermediate/Advanced)

## 📈 Competency Levels

- **0-39:** Beginner 🌱
- **40-69:** Intermediate 📚
- **70-100:** Advanced 🚀

## 🐛 Troubleshooting

### Issue 1: Competency Still Not Updating

**Check Backend Logs:**

If you DON'T see:
```
Updating competency for student X
```

**Possible causes:**
1. User is not a student (only students have competency)
2. Quiz submission failed
3. Backend error

**Fix:**
- Ensure logged in as student role
- Check for backend errors
- Restart backend

### Issue 2: Backend Updates But Profile Doesn't

**Check Browser Console:**

Should see:
```
User data updated with new competency score: 59
```

If you DON'T see this:
1. Hard refresh page (Ctrl + Shift + R)
2. Clear browser cache
3. Check for console errors

### Issue 3: Score Changes Too Slowly

**This is by design!**

Competency changes gradually:
- 60% old score + 40% new performance
- Prevents wild swings from one quiz
- Rewards consistent performance

**Example:**
- Starting: 50
- One 100% quiz: → 70 (not 100)
- Need multiple high scores to reach 90+

### Issue 4: Score Decreases After Good Performance

**Check the weighted average:**

If you score 90% but competency goes down, it means:
- Your previous attempts were even better
- Weighted average of last 5 is lower than current

**Example:**
- Current competency: 80
- Last 5 quizzes: 95%, 92%, 88%, 90%, 93%
- Weighted avg: ~92%
- New score: 70%
- New weighted avg drops
- Competency decreases slightly

This is normal! It reflects recent performance.

## 🎯 Best Practices

### For Students:

1. **Take Multiple Quizzes:**
   - Score stabilizes after 5 quizzes
   - One quiz doesn't define you

2. **Consistent Performance:**
   - Better to score 75% consistently
   - Than 50% then 100%

3. **Recent Performance Matters:**
   - Latest quiz has most weight
   - Older scores fade in importance

4. **Check Profile Regularly:**
   - See progress over time
   - Understand your level

### For Teachers:

1. **Create Appropriate Quizzes:**
   - Match difficulty to material
   - Fair scoring builds accurate competency

2. **Multiple Assessment Points:**
   - More quizzes = better competency accuracy
   - Single quiz shouldn't determine level

## 📊 Profile Page Display

### What Students See:

```
Competency Score
[Progress Bar: 59%]
59/100 | Intermediate
```

**Progress Bar Colors:**
- Gradient from blue to purple
- Fills based on score percentage

**Level Labels:**
- 0-39: Beginner
- 40-69: Intermediate
- 70-100: Advanced

## 🔄 Data Flow

### Complete Flow:

1. **Student takes quiz** in Quiz.jsx
2. **Answers submitted** to `/quiz/attempt`
3. **Backend grades quiz** (quiz_service)
4. **Backend updates competency:**
   - Gets last 5 attempts
   - Calculates weighted average
   - Updates user.competency_score
   - Commits to database
5. **Frontend gets quiz result**
6. **Frontend fetches fresh user data** from `/auth/me`
7. **Auth store updated** with new competency
8. **Profile page shows new score** (next render)

## ✅ Success Indicators

Competency is working when:
- ✅ Backend logs show updates after each quiz
- ✅ New competency calculated correctly
- ✅ Profile page shows updated score
- ✅ Progress bar moves appropriately
- ✅ Level label updates when crossing thresholds

## 📝 Additional Notes

### Why This Approach:

**Backend calculation + Frontend refresh:**
- ✅ Secure (server-side logic)
- ✅ Accurate (one source of truth)
- ✅ Reliable (not dependent on client)
- ✅ Fast (updates immediately)

### Alternative Considered:

**Return new competency in quiz response:**
- ❌ Would require modifying quiz response schema
- ❌ Tightly couples quiz and user data
- ❌ Less flexible

**Current approach is better:**
- Separate concerns
- Reusable (any endpoint can refresh user)
- Cleaner architecture

## 🎉 Expected Behavior

After taking a quiz:
1. See your score on result screen ✅
2. Backend logs show competency update ✅
3. Console shows "User data updated" ✅
4. Redirect to results tab ✅
5. Go to Profile → See new competency! ✅

The competency score should now update properly after every quiz! 🚀

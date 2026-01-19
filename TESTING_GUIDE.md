# AI Log Analyzer Agent - Testing Guide

## 🎯 Complete Pipeline Test (End-to-End)

### **Full RAG Pipeline Flow**
1. **Upload** → Upload a log file
2. **Parse** → Verify events are extracted
3. **Embed** → Check embeddings are created
4. **Index** → Confirm FAISS indexing works
5. **Search** → Test semantic search
6. **Chat** → Test RAG-based Q&A
7. **Dashboard** → View anomalies and timeline

**Test Steps:**
```
1. Go to /upload
2. Upload: samples/scada_system.log
3. Wait for success message (should show event count)
4. Go to /search
5. Search for: "connection timeout"
6. Verify results show highlighted matches
7. Go to /chat
8. Ask: "What connection errors occurred?"
9. Go to /dashboard
10. Check anomalies and timeline are populated
```

---

## 📤 **Upload Section Tests**

### **Developer Tests:**
- [ ] Upload `.log` file → Check `backend/uploads/` directory
- [ ] Upload `.txt` file → Verify parsing works
- [ ] Check database: `backend/data/metadata.db` → `files` table has entry
- [ ] Check database: `events` table populated with parsed events
- [ ] Verify FAISS index: `backend/data/faiss.index` file size increases
- [ ] Check metadata DB: `backend/data/metadata.db` → `vectors` table has entries
- [ ] Upload empty file → Should handle gracefully
- [ ] Upload very large file (1000+ lines) → Check performance
- [ ] Upload file with invalid characters → Should parse what it can
- [ ] Upload multiple files sequentially → All should process

### **User Tests:**
- [ ] Drag and drop a file → Should show upload area highlight
- [ ] Click to select file → File picker opens
- [ ] Upload valid log file → See success message with event count
- [ ] Upload invalid file type → Should show error or reject
- [ ] Upload progress → Should show "Uploading..." state
- [ ] Multiple file upload → Each processes independently

### **Edge Cases:**
- [ ] File with no timestamps → Should still parse
- [ ] File with mixed log formats → Should handle multiple regex patterns
- [ ] File with special characters → Should not crash
- [ ] Very long log lines → Should truncate or handle gracefully
- [ ] File with only whitespace → Should skip empty lines

---

## 🔍 **Search Section Tests**

### **Developer Tests:**
- [ ] Search query → Check `/api/search` endpoint returns results
- [ ] Verify embeddings: Query is converted to vector
- [ ] Check FAISS search: Returns top-k similar vectors
- [ ] Verify metadata retrieval: Results include event details
- [ ] Test with no results → Should return empty array gracefully
- [ ] Test with empty index → Should handle gracefully
- [ ] Check search performance: Should be fast (<1 second)
- [ ] Verify distance scores: Lower = more similar

### **User Tests:**
- [ ] Search "error" → Should highlight "error" in all matching rows
- [ ] Search "connection timeout" → Should find relevant logs
- [ ] Search "motor" → Should find motor-related events
- [ ] Search with multiple words → All words should be highlighted
- [ ] Search with special characters → Should not break
- [ ] Empty search → Should show validation message
- [ ] Search while loading → Should show "Searching..." state
- [ ] Results table → Should show: Level, Timestamp, Source, Message, Asset
- [ ] Click result → (If implemented) Should show details

### **Semantic Search Tests:**
- [ ] "connection failed" → Should find "connection timeout", "lost connection"
- [ ] "high temperature" → Should find "temperature warning", "overheating"
- [ ] "device problem" → Should find "device error", "device failure"
- [ ] "network issue" → Should find "packet loss", "latency", "connection"

### **Edge Cases:**
- [ ] Search before uploading files → Should show "No results" or empty state
- [ ] Very long search query → Should still work
- [ ] Search with only numbers → Should find numeric matches
- [ ] Search with SQL injection attempt → Should be safe (no DB injection)

---

## 💬 **Chat Section Tests**

### **Developer Tests:**
- [ ] Ask question → Check `/api/ask` endpoint
- [ ] Verify RAG flow: Search → Retrieve context → LLM call
- [ ] Check prompt construction: Context + question formatted correctly
- [ ] Test OpenAI API: Verify API key works
- [ ] Test timeout: Should fail gracefully after 30-60 seconds
- [ ] Check error handling: Invalid API key shows clear error
- [ ] Verify evidence: Results include source log entries
- [ ] Test with no context: Empty search results → Should handle

### **User Tests:**
- [ ] Ask: "What errors occurred?" → Should list errors from logs
- [ ] Ask: "Show me connection issues" → Should summarize connection problems
- [ ] Ask: "What devices had problems?" → Should identify devices
- [ ] Ask: "What was the root cause?" → Should analyze and suggest causes
- [ ] Ask: "When did the system fail?" → Should provide timeline
- [ ] Ask: "How many warnings were there?" → Should count warnings
- [ ] Ask complex question → Should provide detailed answer
- [ ] Check evidence section → Should show source log entries
- [ ] Loading state → Should show "Asking..." while processing
- [ ] Error state → Should show clear error message

### **RAG Quality Tests:**
- [ ] Ask about specific event → Answer should reference that event
- [ ] Ask about pattern → Should identify patterns across logs
- [ ] Ask "why" question → Should provide analysis, not just facts
- [ ] Ask comparison question → Should compare different events
- [ ] Verify answer accuracy → Check if answer matches log content

### **Edge Cases:**
- [ ] Ask before uploading files → Should handle gracefully
- [ ] Ask with empty query → Should show validation
- [ ] Ask very long question → Should still process
- [ ] Network timeout → Should show timeout error
- [ ] Invalid API key → Should show authentication error

---

## 📊 **Dashboard Section Tests**

### **Developer Tests:**
- [ ] Check `/api/anomalies` → Returns ERROR/CRITICAL/WARN events
- [ ] Check `/api/timeline` → Returns events ordered by timestamp
- [ ] Verify database queries: Should be efficient
- [ ] Check data format: All fields present (level, ts, source, message)
- [ ] Test with no data → Should show empty state
- [ ] Test with large dataset → Should limit results appropriately

### **User Tests:**
- [ ] View anomalies → Should show error/warning count cards
- [ ] Check anomaly table → Should list all errors and warnings
- [ ] View timeline → Should show events chronologically
- [ ] Timeline scrolling → Should handle many events
- [ ] Color coding → Errors red, warnings yellow, info blue
- [ ] Click anomaly → (If implemented) Should show details
- [ ] Refresh dashboard → Should update with latest data

### **Data Visualization Tests:**
- [ ] Anomaly count matches actual errors → Verify accuracy
- [ ] Timeline shows correct order → Check chronological sorting
- [ ] Level badges → Should show correct colors
- [ ] Timestamp display → Should be readable format
- [ ] Source information → Should show which component logged it

### **Edge Cases:**
- [ ] Dashboard with no uploaded files → Should show empty state
- [ ] Dashboard with only INFO logs → Should show 0 anomalies
- [ ] Dashboard with many events → Should paginate or limit

---

## 🔧 **Developer-Specific Checks**

### **Performance Tests:**
- [ ] Upload 1000-line file → Should complete in <30 seconds
- [ ] Search response time → Should be <1 second
- [ ] Chat response time → Should be <60 seconds (depends on OpenAI)
- [ ] Dashboard load time → Should be <2 seconds
- [ ] Multiple concurrent uploads → Should handle gracefully

### **Data Integrity Tests:**
- [ ] Upload same file twice → Should create separate entries
- [ ] Check event IDs → Should be unique UUIDs
- [ ] Verify timestamps → Should be parsed correctly
- [ ] Check asset extraction → Should find deviceId/asset patterns
- [ ] Verify FAISS index → Vector count matches event count

### **Error Handling Tests:**
- [ ] Invalid file format → Should show error message
- [ ] Database locked → Should handle gracefully
- [ ] FAISS index corrupted → Should recreate or handle error
- [ ] OpenAI API down → Should show clear error
- [ ] Network issues → Should timeout gracefully

### **Security Tests:**
- [ ] SQL injection in search → Should be safe
- [ ] File upload path traversal → Should be prevented
- [ ] XSS in search results → Should be escaped
- [ ] API key exposure → Should not be in frontend
- [ ] CORS configuration → Should allow frontend origin

---

## 🎮 **Real-World Use Cases**

### **Use Case 1: Production Incident Investigation**
```
Scenario: System went down, need to find root cause
1. Upload production logs from incident time
2. Search for "error" and "critical"
3. Ask chat: "What caused the system failure?"
4. Review dashboard anomalies
5. Ask follow-up: "What was the sequence of events?"
```

### **Use Case 2: Daily Log Monitoring**
```
Scenario: Check for issues in daily logs
1. Upload today's log file
2. Go to dashboard → Check anomaly count
3. Review timeline for unusual patterns
4. Search for specific component: "NetworkManager"
5. Ask: "Are there any recurring issues?"
```

### **Use Case 3: Device Troubleshooting**
```
Scenario: Specific device having problems
1. Upload logs containing device events
2. Search for device ID: "PLC_002"
3. Ask: "What problems did PLC_002 experience?"
4. Review timeline for that device
5. Ask: "What should I check to fix PLC_002?"
```

### **Use Case 4: Pattern Detection**
```
Scenario: Find recurring issues
1. Upload multiple log files
2. Search for: "timeout" or "connection"
3. Ask: "What patterns do you see in connection issues?"
4. Review dashboard for frequency
5. Ask: "What's the most common error type?"
```

### **Use Case 5: Compliance Audit**
```
Scenario: Review all errors for audit
1. Upload all relevant log files
2. Go to dashboard → Export anomaly list
3. Search for specific error codes
4. Ask: "Summarize all security-related events"
5. Review timeline for audit period
```

---

## 🐛 **Bug Hunting Checklist**

### **Common Issues to Test:**
- [ ] Upload fails silently → Should show error
- [ ] Search returns wrong results → Check embeddings
- [ ] Highlighting breaks on special chars → Should escape properly
- [ ] Chat hangs indefinitely → Should timeout
- [ ] Dashboard shows stale data → Should refresh
- [ ] Multiple file uploads conflict → Should queue or handle
- [ ] FAISS index gets corrupted → Should handle gracefully
- [ ] Database grows too large → Should consider cleanup
- [ ] Frontend API calls fail → Should show error
- [ ] Backend crashes on invalid input → Should validate

---

## 📝 **Test Data Recommendations**

### **Good Test Files:**
1. **samples/scada_system.log** - Has errors, warnings, info
2. **samples/field_operations.txt** - Different format, various issues
3. **samples/industrial_control.log** - Security events, alarms

### **Create Custom Test Files:**
- File with only errors
- File with only warnings
- File with mixed formats
- File with very long lines
- File with special characters
- File with no timestamps
- File with duplicate events

---

## ✅ **Quick Smoke Test (5 minutes)**

1. Upload `samples/scada_system.log`
2. Search for "error"
3. Ask chat: "What errors occurred?"
4. Check dashboard anomalies
5. Verify all sections work

If all 5 pass → App is working! 🎉

---

## 🚀 **Next Steps After Testing**

1. **Fix any bugs found**
2. **Optimize slow operations**
3. **Add missing error handling**
4. **Improve user experience**
5. **Add more features based on testing**

Happy testing! 🧪

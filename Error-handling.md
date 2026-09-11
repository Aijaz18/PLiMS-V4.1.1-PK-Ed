# PLiMS V4.1.1 PK edition Error Handling & Fault Tolerance Guide
**Pakistan Library Management System (PLiMS V4.1.1 PK edition)**

---

## 1. Overview & Resilience Strategy

PLiMS is designed to remain operational and functional even in the event of network disruptions, API key misconfigurations, rate limits, or invalid patron inputs. This guide outlines the comprehensive error handling framework implemented across client components and server endpoints.

---

## 2. Client-Side Error Boundaries & Fallback UIs

- **React Component Error Boundaries**: Critical application modules (Dashboard, Cataloguing, Circulation, OPAC) are wrapped in fallback UI boundaries to catch runtime rendering errors without crashing the entire SPA interface.
- **Graceful Degradation**: If an individual widget or module encounters an error, a user-friendly alert card appears with a "Retry Module" button, allowing other modules to remain fully interactive.

---

## 3. Gemini API & Network Error Handling

### 3.1 Server-Side Proxy Protection
```typescript
try {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return response.text;
} catch (error: any) {
  console.error('[Gemini API Error]:', error.message);
  // Fallback to local heuristic parsing
  return fallbackLocalParser(query);
}
```

### 3.2 Key Error Scenarios & Fallback Behaviors

| Error Type | Trigger Cause | System Fallback Action |
| :--- | :--- | :--- |
| **Missing API Key** | `GEMINI_API_KEY` not set in environment | Gracefully falls back to local regex keyword search in OPAC. Notifies admin in developer logs. |
| **Rate Limit (429)** | Exceeded Gemini API quota limits | Displays temporary warning banner: *"AI copilot busy, switching to instant keyword search."* |
| **Network Timeout** | Slow mobile/wifi connection (>10s) | Aborts API request, returns instant local search results from indexed LocalStorage holdings. |
| **Malformed JSON** | Unexpected response format from AI model | Triggers fallback JSON repair parser to extract structured fields. |

---

## 4. Input Validation & Form Error Messaging

1. **Duplicate ISBN / Accession Number**:
   - *Detection*: Checked against existing `BookRecord` array during cataloguing or copy creation.
   - *User Feedback*: Displays inline red error toast: *"Accession Number ACC-88219 already registered to another copy."*

2. **Borrowing Limit Exceeded**:
   - *Detection*: Enforced in `CirculationModule` when checking out an item to a patron.
   - *User Feedback*: Rejects issue transaction with alert: *"Patron borrowing limit reached (Max 5 items). Outstanding items must be returned first."*

3. **Overdue Item Hold Restriction**:
   - *Detection*: Prevents new item holds if patron has unpaid fines exceeding configured policy threshold (e.g., > 500 PKR).
   - *User Feedback*: Directs patron to Circulation Desk for fine settlement.

---

## 5. Offline Recovery & Local Storage Fallback

- **Offline Detection**: The system listens to `window.addEventListener('offline')` and `window.addEventListener('online')` events.
- **Offline Mode Indicator**: Displays a subtle status badge (`OFFLINE CACHE ACTIVE`) when network connection is severed.
- **State Preservation**: All circulation desk transactions and catalog edits conducted offline are saved to LocalStorage and queued for automatic server sync upon network restoration.

---

## 6. Diagnostic Logging & Audit Trail

- **Console Telemetry**: Diagnostic messages are formatted with module tags (e.g. `[PLiMS:Circulation] Item CPY-9012 checked out to USR-101`).
- **Error Log Inspector**: Administrators can review recent system warnings directly in `SettingsModule` under the System Diagnostics tab.

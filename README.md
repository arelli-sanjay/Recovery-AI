## AI Recovery Agent

Recovery AI uses Gemini AI to analyze each recovery case and recommend the most appropriate recovery action based on transaction context, customer information, payment history, risk level, and revenue at risk.

The AI does not directly control payment execution. Its recommendation is passed through a deterministic policy layer before any recovery action is taken.

### AI Decision Flow

```text
Recovery Case
     ↓
Transaction + Customer Context
     ↓
Gemini AI Analysis
     ↓
Structured Recommendation
     ↓
Deterministic Policy Engine
     ↓
┌──────────┬──────────────┬──────────┐
│  ALLOW   │   ESCALATE   │   STOP   │
└────┬─────┴──────┬───────┴────┬─────┘
     ↓            ↓             ↓
 Recovery      Human         No Action
 Action        Approval

 ```

## Safety & Policy Controls

The recovery agent operates within predefined boundaries to prevent uncontrolled payment actions.

| Control | Limit |
|---|---:|
| Maximum payment amount | **₹10,000** |
| Maximum recovery attempts | **3** |
| Minimum AI confidence | **70%** |
| Automatically allowed risk levels | **LOW / MEDIUM** |
| High-risk cases | **Human approval** |
| Failed AI analysis | **Recovery stopped** |

These controls ensure that **AI recommends, policy controls, and Razorpay executes**.

## Human Escalation

When a recovery case does not satisfy the automatic recovery policy, the system routes it for human approval instead of executing the payment action automatically.

```text
AI Recommendation
       ↓
Policy Evaluation
       ↓
Escalation Required
       ↓
Human Review
    ↙       ↘
Approve    Reject
   ↓          ↓
Recover     Stop
```

## Audit Trail

Every important recovery decision and action is recorded for traceability.

The audit trail captures events such as:

- Case detection
- AI analysis
- Policy decisions
- Payment Link creation
- Payment success or failure
- Human approval or rejection
- Recovery outcome

This makes it possible to understand **why a recovery action happened, what the system did, and what the final outcome was**.

## Failure Handling

Recovery AI is designed to stop safely when recovery cannot be performed within defined boundaries.

Examples include:

- Gemini AI analysis failure
- Low AI confidence
- Unsupported risk level
- Recovery amount exceeding the allowed limit
- Maximum recovery attempts reached
- Duplicate recovery attempt
- Payment failure

Instead of continuing blindly, the system records the failure and moves the case into an appropriate stopped or failed state.

## Technology Stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **AI:** Gemini API
- **Payments:** Razorpay Test Mode
- **API Communication:** REST APIs
- **Payment Events:** Razorpay Webhooks

## Key API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/recovery/cases` | Get recovery cases |
| POST | `/api/agent/analyze/:id` | Analyze case with AI |
| POST | `/api/recovery/:id/execute` | Execute approved recovery |
| GET | `/api/escalations` | Get escalation cases |
| POST | `/api/escalations/:id/approve` | Approve recovery |
| POST | `/api/escalations/:id/reject` | Reject recovery |
| GET | `/api/audit` | View audit events |
| GET | `/api/dashboard/summary` | Dashboard metrics |

## What Makes Recovery AI Different

Recovery AI is not just a dashboard that identifies failed payments.

It connects the complete recovery lifecycle:

**Detect → Diagnose → Decide → Act → Confirm → Measure → Audit**

The system combines **AI reasoning with deterministic controls**, allowing automation while keeping recovery actions bounded, explainable, and auditable.

## Demo

A complete end-to-end recovery has been successfully tested in Razorpay Test Mode, resulting in **₹2,499 of recovered revenue**.

**5-Minute Demo:**

_video link _

## What Broke & How It Was Solved

During development, the system encountered issues across AI processing, payment execution, webhook handling, and deployment.

The major challenges and their solutions are documented here:

- Gemini AI timeout and failure handling
- Recovery state management
- Razorpay Payment Link execution
- Webhook-based payment confirmation
- Preventing duplicate recovery attempts
- Enforcing recovery limits and stopping rules

The final implementation successfully completed the recovery loop from **at-risk transaction to confirmed payment and audit event**.

## Future Improvements

- Personalized recovery messaging based on customer behavior
- Multiple recovery strategies beyond Payment Links
- Recovery performance optimization using historical outcomes
- Automated recovery prioritization based on expected revenue
- Production-grade authentication and role-based access control

## License

This project was built as part of the **Razorpay AI Builder Internship 2026 — Track 03: AI Revenue Recovery**.

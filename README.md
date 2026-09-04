# Recovery AI

### AI-Powered Revenue Recovery Agent

Recovery AI is an AI-driven revenue recovery system built for **Razorpay AI Builder Internship 2026 — Track 03: AI Revenue Recovery**.

It detects revenue at risk, diagnoses the likely cause using Gemini AI, determines an appropriate recovery strategy, and executes a bounded recovery workflow using Razorpay Payment Links.

Instead of simply reporting failed or abandoned transactions, Recovery AI closes the loop:

**Detection → AI Diagnosis → Policy Decision → Recovery Action → Payment Confirmation → Audit**

The system combines AI reasoning with deterministic policy controls, human escalation, stopping rules, and measurable recovery outcomes.

---

## Problem

Revenue loss rarely happens in one clean step.

A customer may:

- Abandon checkout
- Experience a payment failure
- Choose an unsuccessful payment method
- Fail to complete a transaction
- Require another opportunity to complete payment

Traditional payment dashboards can identify these events, but identifying the problem is only the first step.

The real challenge is:

> **How can a system identify revenue at risk, understand the reason, choose the right intervention, execute it safely, and verify whether the money was actually recovered?**

Recovery AI addresses this by combining AI-powered decision-making with deterministic recovery policies and Razorpay payment infrastructure.

---

## Solution

Recovery AI acts as an AI revenue recovery agent that takes a recovery case from detection to resolution.

The system:

1. Detects transactions with revenue at risk.
2. Calculates risk and recovery context.
3. Sends relevant transaction information to Gemini AI.
4. Generates a structured recovery recommendation.
5. Validates the AI decision against deterministic policy rules.
6. Either:
   - Executes a bounded recovery action,
   - Requests human approval,
   - Or stops the recovery workflow.
7. Creates a Razorpay Payment Link when recovery is allowed.
8. Receives Razorpay webhook events after payment.
9. Confirms the recovery when the payment succeeds.
10. Records the decision and outcome in the audit trail.

---

## Proven End-to-End Recovery

Recovery AI has been tested end-to-end using **Razorpay Test Mode**.

| Metric | Result |
|---|---:|
| Revenue recovered | **₹2,499** |
| Recovery cases simulated | **74** |
| Maximum recovery attempts | **3** |
| Maximum recovery amount | **₹10,000** |
| Minimum AI confidence | **70%** |

### Successful Recovery Flow

```text
At-risk transaction
        ↓
AI analysis
        ↓
Policy validation
        ↓
Razorpay Payment Link
        ↓
Customer payment
        ↓
Razorpay webhook
        ↓
Recovery marked successful
        ↓
₹2,499 recorded as recovered
        ↓
Audit event created

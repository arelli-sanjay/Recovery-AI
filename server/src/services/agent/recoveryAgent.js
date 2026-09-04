import ai from "../../config/gemini.js";

//AI DECISION SCHEMA
const recoveryDecisionSchema = {
  type: "object",

  properties: {
    decision: {
      type: "string",
      enum: [
        "CREATE_PAYMENT_LINK",
        "ESCALATE",
        "STOP",
      ],
    },

    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
    },

    riskLevel: {
      type: "string",
      enum: ["LOW", "MEDIUM", "HIGH"],
    },

    rootCause: {
      type: "string",
    },

    reason: {
      type: "string",
    },

    requiresApproval: {
      type: "boolean",
    },

    action: {
      type: "object",

      properties: {
        type: {
          type: "string",
          enum: [
            "CREATE_PAYMENT_LINK",
            "ESCALATE",
            "STOP",
          ],
        },
      },

      required: ["type"],
    },
  },

  required: [
    "decision",
    "confidence",
    "riskLevel",
    "rootCause",
    "reason",
    "requiresApproval",
    "action",
  ],
};

  // BUILD AI PROMPT
const buildRecoveryPrompt = ({
  transaction,
  customer,
  recoveryCase,
}) => {
  return `
You are the AI decision engine for an AI Revenue Recovery system.

Your job is to analyze a failed, abandoned, or pending transaction
and recommend the safest possible recovery action.

You DO NOT execute payments.

You DO NOT access payment credentials.

You ONLY provide a structured decision.

The backend policy engine will independently decide whether
your recommendation is allowed.

==================================================
ALLOWED DECISIONS
==================================================

1. CREATE_PAYMENT_LINK

Use this when:
- The transaction appears recoverable.
- A new payment request is reasonable.
- There is no obvious fraud or dangerous situation.
- The customer appears suitable for another payment attempt.

2. ESCALATE

Use this when:
- Human intervention is safer.
- The situation is uncertain.
- The transaction is high risk.
- The customer context is insufficient.

3. STOP

Use this when:
- Recovery should not continue.
- There is a clear reason to stop.
- Further automated attempts could be harmful.

==================================================
SAFETY RULES
==================================================

- Never execute a payment.
- Never request payment credentials.
- Never invent customer information.
- Never invent transaction information.
- Never recommend actions outside the allowed decisions.
- If uncertain, choose ESCALATE.
- Keep the reason concise and explainable.
- Return ONLY valid JSON matching the provided schema.

==================================================
TRANSACTION
==================================================

${JSON.stringify(transaction, null, 2)}

==================================================
CUSTOMER
==================================================

${JSON.stringify(customer, null, 2)}

==================================================
RECOVERY CASE
==================================================

${JSON.stringify(recoveryCase, null, 2)}

==================================================
ANALYSIS
==================================================

Determine:

1. The likely root cause.
2. The safest recovery decision.
3. Confidence between 0 and 1.
4. Risk level.
5. Whether human approval is required.
6. A short explanation.
7. The corresponding action type.

Return ONLY structured JSON.
`;
};

//  TIMEOUT HELPER
const withTimeout = (promise, timeoutMs) => {
  return Promise.race([
    promise,

    new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Gemini request timed out after ${timeoutMs / 1000} seconds`
          )
        );
      }, timeoutMs);
    }),
  ]);
};

//ANALYZE RECOVERY CASE
export const analyzeRecoveryCase = async ({
  transaction,
  customer,
  recoveryCase,
}) => {
  console.log("GEMINI RECOVERY AGENT");

  try {

      // VALIDATE INPUT
  
    if (!transaction) {
      throw new Error(
        "Transaction data is missing"
      );
    }

    if (!customer) {
      throw new Error(
        "Customer data is missing"
      );
    }

    if (!recoveryCase) {
      throw new Error(
        "Recovery case data is missing"
      );
    }

    console.log(
      "Case ID:",
      recoveryCase._id?.toString()
    );

    console.log(
      "Customer:",
      customer.name
    );

    console.log(
      "Transaction amount:",
      transaction.amount
    );

    console.log(
      "Transaction status:",
      transaction.status
    );

    //BUILD PROMPT
    const prompt = buildRecoveryPrompt({
      transaction,
      customer,
      recoveryCase,
    });

    console.log(
      "Prompt generated"
    );

    console.log(
      "Sending request to Gemini..."
    );

    // GEMINI REQUEST
    const geminiRequest =
      ai.models.generateContent({
        model: "gemini-3.6-flash",

        contents: prompt,

        config: {
          temperature: 0.2,

          responseMimeType:
            "application/json",

          responseSchema:
            recoveryDecisionSchema,
        },
      });

    //30 SECOND TIMEOUT
    const response = await withTimeout(
      geminiRequest,
      60000
    );

    console.log(
      "Gemini response received"
    );

      //CHECK RESPONSE
    if (!response) {
      throw new Error(
        "Gemini returned no response"
      );
    }

    console.log(
      "Response object received"
    );

    console.log(
      "Response text:",
      response.text
    );

    if (!response.text) {
      throw new Error(
        "Gemini returned an empty response"
      );
    }

    //PARSE JSON
    let decision;

    try {
      decision = JSON.parse(
        response.text
      );
    } catch (parseError) {
      console.error(
        "JSON parsing failed"
      );

      console.error(
        "Raw Gemini response:",
        response.text
      );

      throw new Error(
        "Gemini returned invalid structured JSON"
      );
    }

    console.log(
      "JSON parsed successfully"
    );

    console.log(
      "AI Decision:",
      JSON.stringify(
        decision,
        null,
        2
      )
    );

       //BASIC VALIDATION
    if (!decision.decision) {
      throw new Error(
        "AI decision is missing"
      );
    }

    if (
      ![
        "CREATE_PAYMENT_LINK",
        "ESCALATE",
        "STOP",
      ].includes(decision.decision)
    ) {
      throw new Error(
        `Invalid AI decision: ${decision.decision}`
      );
    }

    if (
      typeof decision.confidence !==
      "number"
    ) {
      throw new Error(
        "AI confidence is missing or invalid"
      );
    }

    if (!decision.riskLevel) {
      throw new Error(
        "AI risk level is missing"
      );
    }

    if (!decision.rootCause) {
      throw new Error(
        "AI root cause is missing"
      );
    }

    if (!decision.reason) {
      throw new Error(
        "AI reason is missing"
      );
    }

    if (
      typeof decision.requiresApproval !==
      "boolean"
    ) {
      throw new Error(
        "AI approval requirement is missing"
      );
    }

    if (!decision.action?.type) {
      throw new Error(
        "AI action type is missing"
      );
    }

    console.log(
      "AI decision passed validation"
    );

    console.log("GEMINI ANALYSIS COMPLETE");

    return decision;

  } catch (error) {
    console.error("GEMINI RECOVERY AGENT FAILED");

    console.error(
      "Error:",
      error
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Stack:",
      error.stack
    );

    console.error("\n");

    throw new Error(
      `Gemini AI analysis failed: ${error.message}`
    );
  }
};
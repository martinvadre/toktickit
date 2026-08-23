export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  isValid: boolean;
  fieldErrors: FieldError[];
  sanitizedData?: T;
}

export interface CreateTicketInput {
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export function validateTicketInput(input: any): ValidationResult<CreateTicketInput> {
  const fieldErrors: FieldError[] = [];

  // 1. Requester ID
  const requesterId = Number(input?.requesterId);
  if (!input?.requesterId || isNaN(requesterId) || requesterId <= 0) {
    fieldErrors.push({
      field: "requesterId",
      message: "A valid Requester ID is required.",
    });
  }

  // 2. Category ID
  const categoryId = Number(input?.categoryId);
  if (!input?.categoryId || isNaN(categoryId) || categoryId <= 0) {
    fieldErrors.push({
      field: "categoryId",
      message: "Please select a valid Category.",
    });
  }

  // 3. Related System ID
  const relatedSystemId = Number(input?.relatedSystemId);
  if (!input?.relatedSystemId || isNaN(relatedSystemId) || relatedSystemId <= 0) {
    fieldErrors.push({
      field: "relatedSystemId",
      message: "Please select a valid Related System.",
    });
  }

  // 4. Summary
  const rawSummary = typeof input?.summary === "string" ? input.summary.trim() : "";
  if (!rawSummary) {
    fieldErrors.push({
      field: "summary",
      message: "Summary is required (min 5 characters).",
    });
  } else if (rawSummary.length < 5) {
    fieldErrors.push({
      field: "summary",
      message: "Summary must be between 5 and 150 characters.",
    });
  } else if (rawSummary.length > 150) {
    fieldErrors.push({
      field: "summary",
      message: "Summary must be between 5 and 150 characters.",
    });
  }

  // 5. Description
  const rawDesc = typeof input?.description === "string" ? input.description.trim() : "";
  if (!rawDesc) {
    fieldErrors.push({
      field: "description",
      message: "Description is required (min 10 characters).",
    });
  } else if (rawDesc.length < 10) {
    fieldErrors.push({
      field: "description",
      message: "Description must be between 10 and 3000 characters.",
    });
  } else if (rawDesc.length > 3000) {
    fieldErrors.push({
      field: "description",
      message: "Description must be between 10 and 3000 characters.",
    });
  }

  // 6. Requested Priority
  const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM";
  if (input?.requestedPriority) {
    const rawPriority = String(input.requestedPriority).toUpperCase();
    if (allowedPriorities.includes(rawPriority)) {
      priority = rawPriority as "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    } else {
      fieldErrors.push({
        field: "requestedPriority",
        message: "Priority must be one of: LOW, MEDIUM, HIGH, URGENT.",
      });
    }
  }

  if (fieldErrors.length > 0) {
    return {
      isValid: false,
      fieldErrors,
    };
  }

  return {
    isValid: true,
    fieldErrors: [],
    sanitizedData: {
      requesterId,
      categoryId,
      relatedSystemId,
      summary: rawSummary,
      description: rawDesc,
      requestedPriority: priority,
    },
  };
}

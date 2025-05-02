export const runFraudChecks = async (
    extractedText: string,
    category: string,
    confidence: number
  ): Promise<{ status: "verified" | "suspicious" | "rejected"; reason?: string }> => {
    const textLower = extractedText.toLowerCase();
  
    // 1. Very short OCR text
    if (extractedText.length < 100) {
      return { status: "rejected", reason: "Text too short to be legitimate" };
    }
  
    // 2. Obvious fake content
    if (textLower.includes("dummy") || textLower.includes("test document")) {
      return { status: "rejected", reason: "Contains known fake phrases" };
    }
  
    // 3. Missing required patterns for specific types
    if (category === "id-card" && !/\d{12}/.test(textLower)) {
      return { status: "suspicious", reason: "Missing valid ID pattern" };
    }
  
    // 4. Low classification confidence
    if (confidence < 0.4) {
      return { status: "suspicious", reason: "Low classification confidence" };
    }
  
    // If all good
    return { status: "verified" };
  };
  
// A/B Testing Framework

type ABTest = {
  id: string;
  name: string;
  variants: Array<{
    id: string;
    name: string;
    weight: number;
  }>;
};

type ABTestResult = {
  testId: string;
  variantId: string;
  userId: string;
  timestamp: number;
};

const activeTests: ABTest[] = [];
const testResults: ABTestResult[] = [];

export function createABTest(test: ABTest): void {
  activeTests.push(test);
}

export function getABTestVariant(testId: string, userId: string): string | null {
  const test = activeTests.find((t) => t.id === testId);
  if (!test) return null;

  // Check if user already has a variant assigned
  const existingResult = testResults.find((r) => r.testId === testId && r.userId === userId);
  if (existingResult) return existingResult.variantId;

  // Assign variant based on weights
  const random = Math.random() * 100;
  let cumulativeWeight = 0;
  let selectedVariant = test.variants[0]?.id || null;

  for (const variant of test.variants) {
    cumulativeWeight += variant.weight;
    if (random <= cumulativeWeight) {
      selectedVariant = variant.id;
      break;
    }
  }

  // Record result
  testResults.push({
    testId,
    variantId: selectedVariant!,
    userId,
    timestamp: Date.now(),
  });

  return selectedVariant;
}

export function trackABTestConversion(testId: string, userId: string, conversion: boolean): void {
  const result = testResults.find((r) => r.testId === testId && r.userId === userId);
  if (result) {
    // In a real app, send this to your analytics backend
    console.log("A/B Test Conversion:", {
      testId,
      variantId: result.variantId,
      userId,
      conversion,
      timestamp: Date.now(),
    });
  }
}

export function getABTestResults(testId: string): Array<ABTestResult & { conversion?: boolean }> {
  return testResults.filter((r) => r.testId === testId);
}

// React hook for A/B testing
import { useState, useEffect } from "react";

export function useABTest(testId: string) {
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    // Get or create user ID
    let userId = localStorage.getItem("ab_test_user_id");
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("ab_test_user_id", userId);
    }

    const assignedVariant = getABTestVariant(testId, userId);
    setVariant(assignedVariant);
  }, [testId]);

  const trackConversion = (conversion: boolean) => {
    const userId = localStorage.getItem("ab_test_user_id");
    if (userId) {
      trackABTestConversion(testId, userId, conversion);
    }
  };

  return { variant, trackConversion };
}

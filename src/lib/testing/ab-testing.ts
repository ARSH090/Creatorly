/**
 * A/B Testing Framework for Creatorly
 * Simple, production-ready implementation
 */

interface Variant {
  name: string;
  weight: number; // 0-100
}

interface Experiment {
  id: string;
  name: string;
  description?: string;
  variants: Variant[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  audience?: {
    minPercentage: number;
    maxPercentage: number;
  };
}

interface UserExperimentAssignment {
  experimentId: string;
  variantName: string;
  assignedAt: Date;
}

const EXPERIMENT_STORAGE_KEY = 'creatorly_experiments';

class ABTestingFramework {
  private experiments: Map<string, Experiment> = new Map();
  private userAssignments: Map<string, UserExperimentAssignment[]> = new Map();

  constructor() {
    this.loadExperimentsFromStorage();
  }

  /**
   * Create a new experiment
   */
  public createExperiment(experiment: Omit<Experiment, 'id'>): Experiment {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullExperiment: Experiment = {
      ...experiment,
      id,
    };

    // Validate variant weights sum to 100
    const totalWeight = fullExperiment.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      throw new Error(`Variant weights must sum to 100, got ${totalWeight}`);
    }

    this.experiments.set(id, fullExperiment);
    this.saveExperimentsToStorage();

    return fullExperiment;
  }

  /**
   * Get variant for user in experiment
   */
  public getUserVariant(experimentId: string, userId: string): string | null {
    // Check if experiment exists and is active
    const experiment = this.experiments.get(experimentId);
    if (!experiment || !experiment.isActive) {
      return null;
    }

    // Check if user is already assigned
    const userAssignments = this.userAssignments.get(userId) || [];
    const existing = userAssignments.find((a) => a.experimentId === experimentId);

    if (existing) {
      return existing.variantName;
    }

    // Assign variant based on consistent hashing
    const variant = this.assignVariant(experiment, userId);

    // Store assignment
    const assignment: UserExperimentAssignment = {
      experimentId,
      variantName: variant,
      assignedAt: new Date(),
    };

    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, []);
    }
    this.userAssignments.get(userId)!.push(assignment);

    // Save to database/storage
    this.saveAssignmentsToStorage(userId, userAssignments);

    return variant;
  }

  /**
   * Assign variant using consistent hashing
   */
  private assignVariant(experiment: Experiment, userId: string): string {
    // Create consistent hash based on userId + experimentId
    const hashInput = `${userId}_${experiment.id}`;
    const hash = this.simpleHash(hashInput);

    // Map hash to percentage (0-100)
    const percentage = hash % 100;

    // Find variant based on weight distribution
    let cumulativeWeight = 0;
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (percentage < cumulativeWeight) {
        return variant.name;
      }
    }

    // Fallback to last variant
    return experiment.variants[experiment.variants.length - 1].name;
  }

  /**
   * Simple hash function for consistent distribution
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Track event in experiment
   */
  public trackExperimentEvent(
    experimentId: string,
    userId: string,
    eventName: string,
    eventData?: Record<string, any>
  ) {
    const variant = this.getUserVariant(experimentId, userId);

    if (!variant) {
      console.warn(`User not in experiment: ${experimentId}`);
      return;
    }

    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        experiment_id: experimentId,
        variant: variant,
        user_id: userId,
        ...eventData,
      });
    }

    console.log(`[A/B TEST] ${experimentId} - ${variant}: ${eventName}`, eventData);
  }

  /**
   * Get experiment results
   */
  public async getExperimentResults(experimentId: string) {
    // This would query your analytics system
    // For now, return mock structure
    return {
      experimentId,
      variants: [
        {
          name: 'control',
          sampleSize: 1000,
          conversions: 150,
          conversionRate: 0.15,
          averageValue: 25.5,
        },
        {
          name: 'variant_a',
          sampleSize: 1000,
          conversions: 180,
          conversionRate: 0.18,
          averageValue: 27.3,
        },
      ],
      significance: {
        pValue: 0.042,
        isSignificant: true,
        confidence: 0.95,
      },
    };
  }

  /**
   * End experiment
   */
  public endExperiment(experimentId: string, winnerVariant?: string) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    experiment.isActive = false;
    experiment.endDate = new Date();

    this.experiments.set(experimentId, experiment);
    this.saveExperimentsToStorage();

    console.log(
      `Experiment ${experimentId} ended${winnerVariant ? ` - Winner: ${winnerVariant}` : ''}`
    );
  }

  /**
   * Get all active experiments
   */
  public getActiveExperiments(): Experiment[] {
    const now = new Date();
    return Array.from(this.experiments.values()).filter(
      (exp) =>
        exp.isActive &&
        exp.startDate <= now &&
        (!exp.endDate || exp.endDate > now)
    );
  }

  private saveExperimentsToStorage() {
    if (typeof window !== 'undefined') {
      const data = Array.from(this.experiments.entries());
      localStorage.setItem(EXPERIMENT_STORAGE_KEY, JSON.stringify(data));
    }
  }

  private loadExperimentsFromStorage() {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(EXPERIMENT_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.experiments = new Map(data);
      } catch (e) {
        console.error('Failed to load experiments from storage:', e);
      }
    }
  }

  private saveAssignmentsToStorage(userId: string, assignments: UserExperimentAssignment[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${EXPERIMENT_STORAGE_KEY}_${userId}`, JSON.stringify(assignments));
    }
  }
}

// Export singleton
let framework: ABTestingFramework | null = null;

export function getABTestingFramework(): ABTestingFramework {
  if (!framework) {
    framework = new ABTestingFramework();
  }
  return framework;
}

/**
 * React Hook for A/B Testing
 */
export function useABTest(experimentId: string, userId: string) {
  const framework = getABTestingFramework();
  const variant = framework.getUserVariant(experimentId, userId);

  return {
    variant,
    isInExperiment: variant !== null,
    trackEvent: (eventName: string, eventData?: Record<string, any>) =>
      framework.trackExperimentEvent(experimentId, userId, eventName, eventData),
  };
}

/**
 * Example experiments for Creatorly
 */
export const EXAMPLE_EXPERIMENTS = {
  paymentButtonColor: {
    name: 'Payment Button Color',
    description: 'Test blue vs green button for checkout',
    variants: [
      { name: 'blue', weight: 50 },
      { name: 'green', weight: 50 },
    ],
    startDate: new Date(),
  },

  dashboardLayout: {
    name: 'Dashboard Layout',
    description: 'Test horizontal vs vertical layout',
    variants: [
      { name: 'horizontal', weight: 50 },
      { name: 'vertical', weight: 50 },
    ],
    startDate: new Date(),
  },

  checkoutFlow: {
    name: 'Checkout Flow',
    description: 'Test 1-click vs multi-step checkout',
    variants: [
      { name: 'one_click', weight: 50 },
      { name: 'multi_step', weight: 50 },
    ],
    startDate: new Date(),
  },
};

export default ABTestingFramework;

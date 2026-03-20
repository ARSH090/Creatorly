import CircuitBreaker from 'opossum';

const options = {
    timeout: 3000, // If our function takes longer than 3 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
    resetTimeout: 30000, // After 30 seconds, try again
};

/**
 * Wraps any async function with a circuit breaker
 * Prevents cascading failures when external APIs (Razorpay, Stripe) are down
 */
export function createCircuitBreaker<T>(asyncFunction: (...args: any[]) => Promise<T>) {
    const breaker = new CircuitBreaker(asyncFunction, options);
    
    breaker.on('open', () => console.warn(`[CircuitBreaker] Circuit for ${asyncFunction.name} is OPEN`));
    breaker.on('halfOpen', () => console.log(`[CircuitBreaker] Circuit for ${asyncFunction.name} is HALF_OPEN`));
    breaker.on('close', () => console.log(`[CircuitBreaker] Circuit for ${asyncFunction.name} is CLOSED`));
    
    return breaker;
}

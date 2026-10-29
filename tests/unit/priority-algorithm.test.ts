import { describe, it, expect } from 'vitest';
import { calculatePriorityScore } from '../../server/src/modules/waiting-list/waiting-list.service.js';

describe('Intelligent Waiting List Priority Algorithm Tests', () => {
  it('should calculate priority score correctly for low SOC (high urgency)', () => {
    const soc = 15; // 15% SOC
    const now = new Date('2026-10-30T14:45:00Z');
    const waitingSince = new Date('2026-10-30T14:00:00Z'); // 45 minutes ago
    const reliability = 0.95;

    const result = calculatePriorityScore(soc, waitingSince, reliability, now);

    // Expected:
    // Urgency = 1 - 0.15 = 0.85 -> 0.50 * 0.85 = 0.425
    // Waiting = 45 / 60 = 0.75 -> 0.30 * 0.75 = 0.225
    // Reliability = 0.95 -> 0.20 * 0.95 = 0.190
    // Total = 0.425 + 0.225 + 0.190 = 0.840
    expect(result.urgencyU).toBeCloseTo(0.85, 2);
    expect(result.waitingT).toBeCloseTo(0.75, 2);
    expect(result.reliabilityR).toBeCloseTo(0.95, 2);
    expect(result.priorityScore).toBeCloseTo(0.84, 2);
    expect(result.waitingMinutes).toBe(45);
  });

  it('should calculate priority score correctly for high SOC (lower urgency)', () => {
    const soc = 70; // 70% SOC
    const now = new Date('2026-10-30T14:30:00Z');
    const waitingSince = new Date('2026-10-30T14:10:00Z'); // 20 minutes ago
    const reliability = 0.90;

    const result = calculatePriorityScore(soc, waitingSince, reliability, now);

    // Urgency = 1 - 0.70 = 0.30 -> 0.50 * 0.30 = 0.150
    // Waiting = 20 / 60 = 0.3333 -> 0.30 * 0.3333 = 0.100
    // Reliability = 0.90 -> 0.20 * 0.90 = 0.180
    // Total = 0.150 + 0.100 + 0.180 = 0.430
    expect(result.urgencyU).toBeCloseTo(0.30, 2);
    expect(result.waitingT).toBeCloseTo(0.333, 2);
    expect(result.priorityScore).toBeCloseTo(0.43, 2);
  });

  it('should cap waiting time component at 1.0 when wait time exceeds maximum configured window', () => {
    const soc = 50;
    const now = new Date('2026-10-30T16:00:00Z');
    const waitingSince = new Date('2026-10-30T14:00:00Z'); // 120 minutes ago (> 60 max)
    const reliability = 1.0;

    const result = calculatePriorityScore(soc, waitingSince, reliability, now);

    expect(result.waitingMinutes).toBe(120);
    expect(result.waitingT).toBe(1.0); // Capped at 1.0
  });

  it('should normalize invalid or out-of-range SOC percentages', () => {
    const now = new Date();
    const resultNegative = calculatePriorityScore(-20, now, 0.8, now);
    expect(resultNegative.urgencyU).toBe(1.0); // Clamped to 0% SOC

    const resultOver100 = calculatePriorityScore(150, now, 0.8, now);
    expect(resultOver100.urgencyU).toBe(0.0); // Clamped to 100% SOC
  });

  it('should ensure weights sum to 1.0', () => {
    const result = calculatePriorityScore(20, new Date(), 0.9, new Date());
    expect(result.alpha + result.beta + result.gamma).toBeCloseTo(1.0, 5);
  });
});


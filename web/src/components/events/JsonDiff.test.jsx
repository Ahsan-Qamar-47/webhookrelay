import { describe, it, expect } from 'vitest';
import { computeJsonDiff } from './JsonDiff';

describe('JSON Diff Computation Engine', () => {
  it('identifies identical JSON objects with zero differences', () => {
    const payloadA = { event: 'invoice.paid', amount: 5000, currency: 'usd' };
    const payloadB = { event: 'invoice.paid', amount: 5000, currency: 'usd' };

    const result = computeJsonDiff(payloadA, payloadB);

    expect(result.isIdentical).toBe(true);
    expect(result.additions).toBe(0);
    expect(result.deletions).toBe(0);
  });

  it('detects added fields (green highlight flag)', () => {
    const payloadA = { event: 'invoice.paid', amount: 5000 };
    const payloadB = { event: 'invoice.paid', amount: 5000, tax: 500 };

    const result = computeJsonDiff(payloadA, payloadB);

    expect(result.isIdentical).toBe(false);
    expect(result.additions).toBeGreaterThan(0);
    const addedLine = result.lines.find((line) => line.type === 'added');
    expect(addedLine).toBeDefined();
    expect(addedLine.text).toContain('tax');
  });

  it('detects removed fields (red highlight flag)', () => {
    const payloadA = { event: 'invoice.paid', amount: 5000, legacy_flag: true };
    const payloadB = { event: 'invoice.paid', amount: 5000 };

    const result = computeJsonDiff(payloadA, payloadB);

    expect(result.isIdentical).toBe(false);
    expect(result.deletions).toBeGreaterThan(0);
    const removedLine = result.lines.find((line) => line.type === 'removed');
    expect(removedLine).toBeDefined();
    expect(removedLine.text).toContain('legacy_flag');
  });

  it('detects modified values (yellow highlight / combined diff)', () => {
    const payloadA = { status: 'pending', amount: 1000 };
    const payloadB = { status: 'completed', amount: 1000 };

    const result = computeJsonDiff(payloadA, payloadB);

    expect(result.isIdentical).toBe(false);
    expect(result.additions).toBeGreaterThan(0);
    expect(result.deletions).toBeGreaterThan(0);
    const removedLine = result.lines.find((line) => line.type === 'removed' && line.text.includes('pending'));
    const addedLine = result.lines.find((line) => line.type === 'added' && line.text.includes('completed'));
    expect(removedLine).toBeDefined();
    expect(addedLine).toBeDefined();
  });
});

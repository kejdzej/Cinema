import { describe, test, expect } from '@jest/globals';
import {
  calculateNumericPrice,
  detectHallType,
  calculateTotalPrice,
  calculateSeatPrice,
  isSeatCouch,
  getPriceBreakdown,
} from '../../utils/pricingCalculator.js';

describe('PricingCalculator - Unit Tests', () => {
  describe('calculateNumericPrice', () => {
    test('should convert string price to number', () => {
      expect(calculateNumericPrice('25.50')).toBe(25.5);
    });

    test('should handle numeric input', () => {
      expect(calculateNumericPrice(30)).toBe(30);
    });

    test('should return 0 for invalid input', () => {
      expect(calculateNumericPrice('invalid')).toBe(0);
      expect(calculateNumericPrice(null)).toBe(0);
      expect(calculateNumericPrice(undefined)).toBe(0);
    });

    test('should clean currency symbols', () => {
      expect(calculateNumericPrice('$25.50')).toBe(25.5);
      expect(calculateNumericPrice('25.50 PLN')).toBe(25.5);
    });
  });

  describe('detectHallType', () => {
    test('should detect VIP hall by name', () => {
      expect(detectHallType('VIP Sala 1', '')).toBe('vip');
      expect(detectHallType('Sala VIP Premium', '')).toBe('vip');
    });

    test('should detect VIP hall by description', () => {
      expect(detectHallType('Sala 4', 'Ekskluzywna sala VIP')).toBe('vip');
    });

    test('should detect mixed hall (Sala 3)', () => {
      expect(detectHallType('Sala 3', '')).toBe('mixed');
      expect(detectHallType('SALA 3 Premium', '')).toBe('mixed');
    });

    test('should return standard for normal halls', () => {
      expect(detectHallType('Sala 1', 'Standardowa sala kinowa')).toBe('standard');
      expect(detectHallType('Sala 2', '')).toBe('standard');
      expect(detectHallType('Main Hall', '')).toBe('standard');
    });

    test('should handle null/undefined inputs', () => {
      expect(detectHallType(null, null)).toBe('standard');
      expect(detectHallType(undefined, undefined)).toBe('standard');
    });
  });

  describe('isSeatCouch', () => {
    test('should detect couch seats in VIP hall (rows F, G)', () => {
      expect(isSeatCouch('F1', 'vip', 'Sala VIP', 40)).toBe(true);
      expect(isSeatCouch('G5', 'vip', 'Sala VIP', 40)).toBe(true);
    });

    test('should detect normal seats in VIP hall', () => {
      expect(isSeatCouch('A1', 'vip', 'Sala VIP', 40)).toBe(false);
      expect(isSeatCouch('E5', 'vip', 'Sala VIP', 40)).toBe(false);
    });

    test('should detect couch seats in mixed hall (rows I, J)', () => {
      expect(isSeatCouch('I1', 'mixed', 'Sala 3', 40)).toBe(true);
      expect(isSeatCouch('J5', 'mixed', 'Sala 3', 40)).toBe(true);
    });

    test('should detect normal seats in mixed hall', () => {
      expect(isSeatCouch('A1', 'mixed', 'Sala 3', 40)).toBe(false);
      expect(isSeatCouch('H5', 'mixed', 'Sala 3', 40)).toBe(false);
    });

    test('should detect couches in standard hall based on capacity', () => {
      // Sala 1 (72 capacity) - rows H onwards
      expect(isSeatCouch('H1', 'standard', 'Sala 1', 72)).toBe(true);

      // Sala 2 (50 capacity) - rows D, E
      expect(isSeatCouch('D1', 'standard', 'Sala 2', 50)).toBe(true);
      expect(isSeatCouch('E1', 'standard', 'Sala 2', 50)).toBe(true);
    });
  });

  describe('calculateSeatPrice', () => {
    test('should calculate normal seat price (1x base)', () => {
      const hallInfo = { type: 'standard', name: 'Sala 1', capacity: 40 };
      const sessionPrice = 25;

      expect(calculateSeatPrice('A1', hallInfo, sessionPrice)).toBe(25);
    });

    test('should calculate couch seat price (2x base)', () => {
      const hallInfo = { type: 'vip', name: 'VIP Sala', capacity: 40 };
      const sessionPrice = 25;

      expect(calculateSeatPrice('F1', hallInfo, sessionPrice)).toBe(50); // Couch in VIP
    });

    test('should handle different session prices', () => {
      const hallInfo = { type: 'vip', name: 'VIP Sala', capacity: 40 };

      expect(calculateSeatPrice('A1', hallInfo, 30)).toBe(30); // Normal
      expect(calculateSeatPrice('F1', hallInfo, 30)).toBe(60); // Couch
    });
  });

  describe('calculateTotalPrice', () => {
    test('should calculate price for normal seats only', () => {
      const seats = ['A1', 'A2', 'A3'];
      const hallInfo = { type: 'standard', name: 'Sala 1', capacity: 40 };
      const sessionPrice = 25;

      const total = calculateTotalPrice(seats, hallInfo, sessionPrice);
      expect(total).toBe(75); // 3 × 25
    });

    test('should calculate price with mix of normal and couch seats', () => {
      const seats = ['A1', 'F1']; // A1 normal, F1 couch in VIP
      const hallInfo = { type: 'vip', name: 'VIP Sala', capacity: 40 };
      const sessionPrice = 20;

      const total = calculateTotalPrice(seats, hallInfo, sessionPrice);
      expect(total).toBe(60); // 20 + 40
    });

    test('should calculate price for all couch seats', () => {
      const seats = ['F1', 'F2', 'G1']; // All couches in VIP
      const hallInfo = { type: 'vip', name: 'VIP Sala', capacity: 40 };
      const sessionPrice = 30;

      const total = calculateTotalPrice(seats, hallInfo, sessionPrice);
      expect(total).toBe(180); // 3 × 60
    });

    test('should handle empty seats array', () => {
      const seats = [];
      const hallInfo = { type: 'standard', name: 'Sala 1', capacity: 40 };
      const sessionPrice = 25;

      const total = calculateTotalPrice(seats, hallInfo, sessionPrice);
      expect(total).toBe(0);
    });

    test('should handle invalid session price', () => {
      const seats = ['A1'];
      const hallInfo = { type: 'standard', name: 'Sala 1', capacity: 40 };
      const sessionPrice = 0;

      const total = calculateTotalPrice(seats, hallInfo, sessionPrice);
      expect(total).toBe(0);
    });

    test('should detect hall type from name if type not provided', () => {
      const seats = ['F1', 'F2']; // Couches in VIP
      const hallInfo = { name: 'VIP Premium', capacity: 20 };
      const sessionPrice = 30;

      // Type will be detected as 'vip' from name
      const total = calculateTotalPrice(seats, hallInfo, sessionPrice);
      expect(total).toBe(120); // 2 × 60 (couch price)
    });
  });

  describe('getPriceBreakdown', () => {
    test('should provide detailed price breakdown', () => {
      const seats = ['A1', 'A2', 'F1', 'F2']; // 2 normal, 2 couches
      const hallInfo = { type: 'vip', name: 'VIP Sala', capacity: 40 };
      const sessionPrice = 25;

      const breakdown = getPriceBreakdown(seats, hallInfo, sessionPrice);

      expect(breakdown.normalSeats).toEqual(['A1', 'A2']);
      expect(breakdown.couchSeats).toEqual(['F1', 'F2']);
      expect(breakdown.normalPrice).toBe(25);
      expect(breakdown.couchPrice).toBe(50);
      expect(breakdown.normalSubtotal).toBe(50); // 2 × 25
      expect(breakdown.couchSubtotal).toBe(100); // 2 × 50
      expect(breakdown.total).toBe(150);
    });

    test('should handle only normal seats', () => {
      const seats = ['A1', 'B1'];
      const hallInfo = { type: 'standard', name: 'Sala 1', capacity: 40 };
      const sessionPrice = 20;

      const breakdown = getPriceBreakdown(seats, hallInfo, sessionPrice);

      expect(breakdown.normalSeats.length).toBe(2);
      expect(breakdown.couchSeats.length).toBe(0);
      expect(breakdown.total).toBe(40);
    });

    test('should handle only couch seats', () => {
      const seats = ['F1', 'G1'];
      const hallInfo = { type: 'vip', name: 'VIP Sala', capacity: 40 };
      const sessionPrice = 30;

      const breakdown = getPriceBreakdown(seats, hallInfo, sessionPrice);

      expect(breakdown.normalSeats.length).toBe(0);
      expect(breakdown.couchSeats.length).toBe(2);
      expect(breakdown.total).toBe(120); // 2 × 60
    });
  });
});

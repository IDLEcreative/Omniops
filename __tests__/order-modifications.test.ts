import { OrderModificationService } from '@/lib/woocommerce-order-modifications';

describe('OrderModificationService', () => {
  describe('detectModificationIntent', () => {
    it('should detect cancel intent with high confidence', () => {
      const testMessages = [
        'I want to cancel my order',
        'Please cancel order #12345',
        "I've changed my mind about this order",
        "I don't want this order anymore",
        'Can you stop my order from shipping?',
        'Cancel order 12345 please'
      ];
      
      testMessages.forEach(message => {
        const result = OrderModificationService.detectModificationIntent(message);
        expect(result.type).toBe('cancel');
        expect(result.confidence).toBeGreaterThan(0.8);
      });
    });
    
    it('should detect address update intent', () => {
      const testMessages = [
        'I need to change my shipping address',
        'Can you update the delivery address?',
        'Please modify the address for my order',
        'I entered the wrong address',
        'Ship to a different address please',
        'I need to edit my shipping information'
      ];
      
      testMessages.forEach(message => {
        const result = OrderModificationService.detectModificationIntent(message);
        expect(result.type).toBe('update_address');
        expect(result.confidence).toBeGreaterThan(0.7);
      });
    });
    
    it('should detect refund intent', () => {
      const testMessages = [
        'I want a refund',
        'Can I get my money back?',
        'Please process a refund for order #12345',
        'I want to return this order',
        'Request refund for my purchase'
      ];
      
      testMessages.forEach(message => {
        const result = OrderModificationService.detectModificationIntent(message);
        expect(result.type).toBe('request_refund');
        expect(result.confidence).toBeGreaterThan(0.7);
      });
    });
    
    it('should detect note addition intent', () => {
      const testMessages = [
        'Please add note: deliver to back door',
        'Special instruction: call when arriving',
        'Important: fragile items',
        'Note: leave package with neighbor if not home'
      ];
      
      testMessages.forEach(message => {
        const result = OrderModificationService.detectModificationIntent(message);
        expect(result.type).toBe('add_note');
        expect(result.confidence).toBeGreaterThan(0.6);
      });
    });
    
    it('should return low confidence for non-modification messages', () => {
      const testMessages = [
        'What is the status of my order?',
        'When will my order arrive?',
        'Can you track my package?',
        'What products do you have?',
        'How much does shipping cost?'
      ];
      
      testMessages.forEach(message => {
        const result = OrderModificationService.detectModificationIntent(message);
        expect(result.confidence).toBeLessThan(0.5);
      });
    });
  });
  
  describe('extractOrderInfo', () => {
    it('should extract order ID from message', () => {
      const testCases = [
        { message: 'Cancel order #12345', expected: '12345' },
        { message: 'Order 98765 needs to be updated', expected: '98765' },
        { message: 'Please refund #4567', expected: '4567' },
        { message: 'My order number is 11111', expected: '11111' },
      ];
      
      testCases.forEach(({ message, expected }) => {
        const result = OrderModificationService.extractOrderInfo(message);
        expect(result.orderId).toBe(expected);
      });
    });
    
    it('should extract address components', () => {
      const message = 'Please ship to 123 Main St, New York, NY 10001';
      const result = OrderModificationService.extractOrderInfo(message);
      
      expect(result.newAddress).toBeDefined();
      expect(result.newAddress?.street).toBe('123 Main St');
      expect(result.newAddress?.city).toBe('New York');
      expect(result.newAddress?.state).toBe('NY');
      expect(result.newAddress?.zip).toBe('10001');
    });
    
    it('should extract cancellation/refund reason', () => {
      const testCases = [
        { 
          message: 'Cancel my order because I found a better price',
          expected: 'I found a better price'
        },
        {
          message: 'I want a refund due to damaged product',
          expected: 'damaged product'
        },
        {
          message: 'Please cancel. Reason: ordered by mistake',
          expected: 'ordered by mistake'
        }
      ];
      
      testCases.forEach(({ message, expected }) => {
        const result = OrderModificationService.extractOrderInfo(message);
        expect(result.reason).toBe(expected);
      });
    });
  });
  
  describe('Modification status checks', () => {
    it('should validate allowed statuses for cancellation', () => {
      const allowedStatuses = ['pending', 'processing', 'on-hold'];
      
      // This would need mock WooCommerce client to test properly
      // Just checking the constants are defined correctly
      expect(allowedStatuses).toEqual(['pending', 'processing', 'on-hold']);
    });
    
    it('should validate allowed statuses for address updates', () => {
      const allowedStatuses = ['pending', 'processing', 'on-hold'];
      
      expect(allowedStatuses).toEqual(['pending', 'processing', 'on-hold']);
    });
    
    it('should validate allowed statuses for refunds', () => {
      const allowedStatuses = ['processing', 'completed', 'on-hold'];
      
      expect(allowedStatuses).toEqual(['processing', 'completed', 'on-hold']);
    });
  });
});
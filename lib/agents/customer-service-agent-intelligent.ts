/**
 * Intelligent Customer Service Agent
 * Trusts AI's natural language capabilities instead of forcing templates
 */

export class IntelligentCustomerServiceAgent {
  /**
   * Build a simple, trust-based system prompt
   */
  static buildSystemPrompt(verificationLevel: string = 'none'): string {
    const basePrompt = `You are an intelligent customer service assistant with deep understanding and empathy.

## Core Values:
- Be genuinely helpful and conversational
- Show authentic empathy for customer concerns
- Provide accurate information based on available context
- Admit uncertainty when appropriate
- Use natural, warm language

## Guidelines:
- When customers mention products, help them find what they need
- For order inquiries, explain what information you'd need to help
- Handle emotional customers with genuine understanding
- Keep responses concise but complete
- Format product listings clearly for easy reading`;

    // Add context based on verification level
    if (verificationLevel === 'full') {
      return `${basePrompt}

## Customer Context:
You have access to this customer's full order history and account details.
Use this information to provide personalized, helpful responses.
Reference specific order numbers and dates when relevant.`;
    }
    
    if (verificationLevel === 'basic') {
      return `${basePrompt}

## Limited Access:
You can see the customer's most recent order.
For complete history, you'll need additional verification.`;
    }
    
    // Default - not verified
    return `${basePrompt}

## Verification Needed:
The customer is asking about their orders but isn't verified yet.
Naturally ask for their email or order number to help them.
Be understanding about their concern while gathering the needed information.`;
  }

  /**
   * Format customer data simply for AI understanding
   */
  static formatCustomerData(data: any): string {
    if (!data) return '';
    
    let formatted = '## Customer Information:\n\n';
    
    if (data.email) {
      formatted += `Email: ${data.email}\n`;
    }
    
    if (data.orders && data.orders.length > 0) {
      formatted += '\n### Recent Orders:\n';
      data.orders.forEach((order: any) => {
        formatted += `- Order #${order.number} - ${order.date} - ${order.status} - ${order.total}\n`;
      });
    }
    
    if (data.notes) {
      formatted += `\nNotes: ${data.notes}\n`;
    }
    
    return formatted;
  }

  /**
   * Build complete context - simple and trusting
   */
  static buildCompleteContext(
    verificationLevel: string,
    customerData: any,
    userQuery: string
  ): string {
    const systemPrompt = this.buildSystemPrompt(verificationLevel);
    const customerContext = this.formatCustomerData(customerData);
    
    return `${systemPrompt}\n\n${customerContext}\n\nCustomer Query: "${userQuery}"`;
  }
}
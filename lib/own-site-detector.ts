import { parse } from 'url';
import * as dns from 'dns/promises';
import * as os from 'os';

export class OwnSiteDetector {
  private static ownDomains: Set<string> = new Set();
  private static serverIps: Set<string> = new Set();
  
  // Initialize with known owned domains
  static async initialize(ownedDomains?: string[]) {
    // Add manually specified domains
    if (ownedDomains) {
      ownedDomains.forEach(domain => this.ownDomains.add(domain.toLowerCase()));
    }
    
    // Get server's IP addresses
    try {
      const interfaces = os.networkInterfaces();
      for (const [name, nets] of Object.entries(interfaces)) {
        if (nets) {
          for (const net of nets) {
            if (net.address) {
              this.serverIps.add(net.address);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to get server IPs:', error);
    }
  }
  
  // Check if a URL belongs to an owned domain
  static async isOwnSite(url: string): Promise<boolean> {
    try {
      const parsed = parse(url);
      if (!parsed.hostname) return false;
      
      const hostname = parsed.hostname.toLowerCase();
      
      // 1. Check against known owned domains
      if (this.ownDomains.has(hostname)) {
        return true;
      }
      
      // Check if any owned domain is a parent domain
      for (const ownDomain of this.ownDomains) {
        if (hostname.endsWith('.' + ownDomain) || hostname === ownDomain) {
          return true;
        }
      }
      
      // 2. Check if URL points to localhost/local network
      if (this.isLocalUrl(hostname)) {
        return true;
      }
      
      // 3. Check if domain resolves to server's IP (optional, slower)
      if (this.serverIps.size > 0) {
        try {
          const addresses = await dns.resolve4(hostname);
          for (const address of addresses) {
            if (this.serverIps.has(address)) {
              return true;
            }
          }
        } catch {
          // DNS resolution failed, assume not own site
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking if own site:', error);
      return false;
    }
  }
  
  // Check if URL is local
  private static isLocalUrl(hostname: string): boolean {
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.match(/^192\.168\.\d+\.\d+$/) !== null ||
      hostname.match(/^10\.\d+\.\d+\.\d+$/) !== null ||
      hostname.match(/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/) !== null
    );
  }
  
  // Add a domain as owned
  static addOwnedDomain(domain: string) {
    this.ownDomains.add(domain.toLowerCase());
  }
  
  // Remove a domain from owned list
  static removeOwnedDomain(domain: string) {
    this.ownDomains.delete(domain.toLowerCase());
  }
  
  // Get all owned domains
  static getOwnedDomains(): string[] {
    return Array.from(this.ownDomains);
  }
  
  // Load owned domains from environment or config
  static loadFromEnvironment() {
    // Check for environment variable with comma-separated domains
    const envDomains = process.env.OWNED_DOMAINS || process.env.OWN_DOMAINS;
    if (envDomains) {
      const domains = envDomains.split(',').map(d => d.trim()).filter(Boolean);
      domains.forEach(domain => this.addOwnedDomain(domain));
    }
    
    // Check for company domain
    const companyDomain = process.env.COMPANY_DOMAIN;
    if (companyDomain) {
      this.addOwnedDomain(companyDomain);
    }
  }
}
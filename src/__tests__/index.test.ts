import { describe, it, expect } from '@jest/globals';
import { parseSubscription, shadowsocksParser, vmessParser } from '../parsers/index.js';
import { generateSubscription, clashGenerator } from '../generators/index.js';
import { ConversionConfig, Subscription } from '../types/index.js';
import * as E from 'fp-ts/Either';

describe('Subscription Parser', () => {
  describe('Shadowsocks Parser', () => {
    it('should parse valid Shadowsocks URL', () => {
      const ssUrl = 'ss://YWVzLTI1Ni1nY206dGVzdA==@example.com:8388#Test%20Server';
      const result = parseSubscription(ssUrl);
      
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right.proxies).toHaveLength(1);
        expect(result.right.proxies[0]?.type).toBe('ss');
        expect(result.right.proxies[0]?.server).toBe('example.com');
        expect(result.right.proxies[0]?.port).toBe(8388);
      }
    });

    it('should handle invalid Shadowsocks URL', () => {
      const invalidUrl = 'ss://invalid-base64@example.com:8388';
      const result = parseSubscription(invalidUrl);
      
      expect(E.isLeft(result)).toBe(true);
    });
  });

  describe('VMess Parser', () => {
    it('should parse valid VMess URL', () => {
      const vmessConfig = {
        v: '2',
        ps: 'Test VMess',
        add: 'example.com',
        port: 443,
        id: '12345678-1234-1234-1234-123456789abc',
        aid: 0,
        net: 'ws',
        type: 'none',
        host: 'example.com',
        path: '/path',
        tls: 'tls'
      };
      
      const vmessUrl = 'vmess://' + Buffer.from(JSON.stringify(vmessConfig)).toString('base64');
      const result = parseSubscription(vmessUrl);
      
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right.proxies).toHaveLength(1);
        expect(result.right.proxies[0]?.type).toBe('vmess');
        expect(result.right.proxies[0]?.server).toBe('example.com');
        expect(result.right.proxies[0]?.port).toBe(443);
      }
    });
  });

  describe('Base64 Subscription Parser', () => {
    it('should parse base64 encoded subscription', () => {
      const ssUrl = 'ss://YWVzLTI1Ni1nY206dGVzdA==@example.com:8388#Test%20Server';
      const base64Content = Buffer.from(ssUrl).toString('base64');
      const result = parseSubscription(base64Content);
      
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right.proxies).toHaveLength(1);
        expect(result.right.proxies[0]?.type).toBe('ss');
      }
    });
  });
});

describe('Subscription Generator', () => {
  const mockSubscription: Subscription = {
    url: 'test://example.com',
    proxies: [
      {
        type: 'ss',
        name: 'Test SS',
        server: 'example.com',
        port: 8388,
        cipher: 'aes-256-gcm',
        password: 'test'
      },
      {
        type: 'vmess',
        name: 'Test VMess',
        server: 'example.com',
        port: 443,
        uuid: '12345678-1234-1234-1234-123456789abc',
        alterId: 0,
        cipher: 'auto',
        network: 'ws',
        path: '/path',
        tls: true
      }
    ],
    proxyGroups: [],
    rules: [
      {
        type: 'DOMAIN-SUFFIX',
        payload: 'google.com',
        proxy: 'PROXY'
      },
      {
        type: 'FINAL',
        payload: '',
        proxy: 'DIRECT'
      }
    ]
  };

  describe('Clash Generator', () => {
    it('should generate valid Clash configuration', () => {
      const config: ConversionConfig = {
        target: 'clash',
        enableRuleGenerator: true
      };
      
      const result = generateSubscription(mockSubscription, config);
      
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right.contentType).toBe('application/yaml');
        expect(result.right.content).toContain('proxies:');
        expect(result.right.content).toContain('proxy-groups:');
        expect(result.right.content).toContain('rules:');
      }
    });
  });

  describe('Surge Generator', () => {
    it('should generate valid Surge configuration', () => {
      const config: ConversionConfig = {
        target: 'surge'
      };
      
      const result = generateSubscription(mockSubscription, config);
      
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right.contentType).toBe('text/plain');
        expect(result.right.content).toContain('[General]');
        expect(result.right.content).toContain('[Proxy]');
        expect(result.right.content).toContain('[Proxy Group]');
        expect(result.right.content).toContain('[Rule]');
      }
    });
  });

  describe('V2Ray Generator', () => {
    it('should generate valid V2Ray configuration', () => {
      const config: ConversionConfig = {
        target: 'v2ray'
      };
      
      const result = generateSubscription(mockSubscription, config);
      
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right.contentType).toBe('application/json');
        const v2rayConfig = JSON.parse(result.right.content);
        expect(v2rayConfig).toHaveProperty('inbounds');
        expect(v2rayConfig).toHaveProperty('outbounds');
        expect(v2rayConfig).toHaveProperty('routing');
      }
    });
  });

  describe('Simple List Generators', () => {
    it('should generate SS URL list', () => {
      const config: ConversionConfig = {
        target: 'ss'
      };
      
      const result = generateSubscription(mockSubscription, config);
      
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right.contentType).toBe('text/plain');
        expect(result.right.content).toContain('ss://');
      }
    });

    it('should generate base64 encoded SS subscription', () => {
      const config: ConversionConfig = {
        target: 'sssub'
      };
      
      const result = generateSubscription(mockSubscription, config);
      
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right.contentType).toBe('text/plain');
        // Content should be base64 encoded
        expect(() => Buffer.from(result.right.content, 'base64').toString()).not.toThrow();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported target format', () => {
      const config: ConversionConfig = {
        target: 'unsupported' as any
      };
      
      const result = generateSubscription(mockSubscription, config);
      
      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left).toContain('Unsupported target');
      }
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete subscription conversion flow', () => {
    const ssUrl = 'ss://YWVzLTI1Ni1nY206dGVzdA==@example.com:8388#Test%20Server';
    
    // Parse subscription
    const parseResult = parseSubscription(ssUrl);
    expect(E.isRight(parseResult)).toBe(true);
    
    if (E.isRight(parseResult)) {
      // Generate different formats
      const targets: Array<ConversionConfig['target']> = ['clash', 'surge', 'v2ray', 'ss'];
      
      targets.forEach(target => {
        const config: ConversionConfig = { target };
        const generateResult = generateSubscription(parseResult.right, config);
        
        expect(E.isRight(generateResult)).toBe(true);
        if (E.isRight(generateResult)) {
          expect(generateResult.right.content).toBeTruthy();
          expect(generateResult.right.contentType).toBeTruthy();
        }
      });
    }
  });
});

describe('Functional Programming Principles', () => {
  it('should maintain immutability in parsing', () => {
    const originalContent = 'ss://YWVzLTI1Ni1nY206dGVzdA==@example.com:8388#Test%20Server';
    const result = parseSubscription(originalContent);
    
    // Original content should remain unchanged
    expect(originalContent).toBe('ss://YWVzLTI1Ni1nY206dGVzdA==@example.com:8388#Test%20Server');
    
    if (E.isRight(result)) {
      // Result should be immutable
      expect(() => {
        (result.right as any).proxies = [];
      }).toThrow();
    }
  });

  it('should be pure functions (same input = same output)', () => {
    const ssUrl = 'ss://YWVzLTI1Ni1nY206dGVzdA==@example.com:8388#Test%20Server';
    
    const result1 = parseSubscription(ssUrl);
    const result2 = parseSubscription(ssUrl);
    
    expect(result1).toEqual(result2);
  });

  it('should compose functions properly', () => {
    const ssUrl = 'ss://YWVzLTI1Ni1nY206dGVzdA==@example.com:8388#Test%20Server';
    const config: ConversionConfig = { target: 'clash' };
    
    // Compose parse and generate
    const result = E.chain((subscription: Subscription) => 
      generateSubscription(subscription, config)
    )(parseSubscription(ssUrl));
    
    expect(E.isRight(result)).toBe(true);
  });
});
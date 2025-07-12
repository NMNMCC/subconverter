import * as E from 'fp-ts/lib/Either.js';
import YAML from 'yaml';
import { 
  ProxyConfig, 
  Rule, 
  Subscription, 
  ConversionTarget, 
  ConversionResult,
  ConversionConfig 
} from '../types/index.js';
import { 
  encodeBase64
} from '../utils/index.js';

// Base generator interface
export interface SubscriptionGenerator {
  readonly generate: (subscription: Subscription, config: ConversionConfig) => E.Either<string, ConversionResult>;
  readonly target: ConversionTarget;
}

// Clash generator
export const clashGenerator: SubscriptionGenerator = {
  target: 'clash',
  
  generate: (subscription: Subscription, config: ConversionConfig): E.Either<string, ConversionResult> => {
    try {
      const clashConfig = {
        port: 7890,
        'socks-port': 7891,
        'redir-port': 7892,
        'mixed-port': 7893,
        'allow-lan': false,
        mode: 'rule',
        'log-level': 'info',
        'external-controller': '127.0.0.1:9090',
        dns: {
          enable: true,
          ipv6: false,
          'default-nameserver': ['223.5.5.5', '119.29.29.29'],
          'enhanced-mode': 'fake-ip',
          'fake-ip-range': '198.18.0.1/16',
          'use-hosts': true,
          nameserver: ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query'],
          fallback: ['https://doh.dns.sb/dns-query', 'https://dns.cloudflare.com/dns-query']
        },
        proxies: subscription.proxies.map(proxyToClash),
        'proxy-groups': generateClashProxyGroups(subscription, config),
        rules: subscription.rules.map(ruleToClash)
      };

      const yamlContent = YAML.stringify(clashConfig);
      
      return E.right({
        content: yamlContent,
        contentType: 'application/yaml',
        filename: config.filename || 'clash.yaml'
      });
    } catch (error) {
      return E.left(`Failed to generate Clash config: ${String(error)}`);
    }
  }
};

// Convert proxy to Clash format
const proxyToClash = (proxy: ProxyConfig): Record<string, unknown> => {
  const base = {
    name: proxy.name,
    server: proxy.server,
    port: proxy.port,
    type: proxy.type
  };

  switch (proxy.type) {
    case 'ss':
      return {
        ...base,
        cipher: proxy.cipher,
        password: proxy.password,
        udp: true
      };
    
    case 'ssr':
      return {
        ...base,
        cipher: proxy.cipher,
        password: proxy.password,
        protocol: proxy.protocol,
        obfs: proxy.obfs,
        'protocol-param': proxy.protocolParam || '',
        'obfs-param': proxy.obfsParam || '',
        udp: true
      };
    
    case 'vmess':
      return {
        ...base,
        uuid: proxy.uuid,
        alterId: proxy.alterId || 0,
        cipher: proxy.cipher || 'auto',
        network: proxy.network || 'tcp',
        tls: proxy.tls || false,
        'skip-cert-verify': proxy.skipCertVerify || false,
        'server-name': proxy.serverName || '',
        ...(proxy.network === 'ws' && {
          'ws-opts': {
            path: proxy.path || '/',
            headers: proxy.headers || {}
          }
        }),
        ...(proxy.network === 'h2' && {
          'h2-opts': {
            host: proxy.host ? [proxy.host] : [],
            path: proxy.path || '/'
          }
        })
      };
    
    case 'trojan':
      return {
        ...base,
        password: proxy.password,
        'skip-cert-verify': proxy.skipCertVerify || false,
        'server-name': proxy.serverName || '',
        udp: true
      };
    
    default:
      return base;
  }
};

// Generate Clash proxy groups
const generateClashProxyGroups = (subscription: Subscription, config: ConversionConfig): readonly Record<string, unknown>[] => {
  const proxyNames = subscription.proxies.map(p => p.name);
  
  const defaultGroups = [
    {
      name: 'PROXY',
      type: 'select',
      proxies: ['♻️ 自动选择', '🚀 手动切换', '🔒 故障转移', '🔃 负载均衡', '🎯 全球直连']
    },
    {
      name: '♻️ 自动选择',
      type: 'url-test',
      proxies: proxyNames,
      url: 'http://www.gstatic.com/generate_204',
      interval: 300
    },
    {
      name: '🚀 手动切换',
      type: 'select',
      proxies: proxyNames
    },
    {
      name: '🔒 故障转移',
      type: 'fallback',
      proxies: proxyNames,
      url: 'http://www.gstatic.com/generate_204',
      interval: 300
    },
    {
      name: '🔃 负载均衡',
      type: 'load-balance',
      proxies: proxyNames,
      url: 'http://www.gstatic.com/generate_204',
      interval: 300,
      strategy: 'consistent-hashing'
    },
    {
      name: '🎯 全球直连',
      type: 'select',
      proxies: ['DIRECT']
    }
  ];

  // Add custom proxy groups if provided
  const customGroups = config.customProxyGroups?.map(group => ({
    name: group.name,
    type: group.type,
    proxies: group.proxies,
    ...(group.url && { url: group.url }),
    ...(group.interval && { interval: group.interval })
  })) || [];

  return [...defaultGroups, ...customGroups];
};

// Convert rule to Clash format
const ruleToClash = (rule: Rule): string => {
  const parts = [rule.type, rule.payload, rule.proxy];
  if (rule.noResolve) {
    parts.push('no-resolve');
  }
  return parts.join(',');
};

// Surge generator
export const surgeGenerator: SubscriptionGenerator = {
  target: 'surge',
  
  generate: (subscription: Subscription, config: ConversionConfig): E.Either<string, ConversionResult> => {
    try {
      const surgeConfig = [
        '[General]',
        'bypass-system = true',
        'skip-proxy = 127.0.0.1, 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, 100.64.0.0/10, localhost, *.local',
        'dns-server = system, 223.5.5.5, 119.29.29.29',
        'loglevel = notify',
        'replica = false',
        'tun-excluded-routes = 10.0.0.0/8, 100.64.0.0/10, 127.0.0.0/8, 169.254.0.0/16, 172.16.0.0/12, 192.0.0.0/24, 192.0.2.0/24, 192.88.99.0/24, 192.168.0.0/16, 198.51.100.0/24, 203.0.113.0/24, 224.0.0.0/4, 255.255.255.255/32',
        '',
        '[Proxy]',
        ...subscription.proxies.map(proxyToSurge),
        '',
        '[Proxy Group]',
        ...generateSurgeProxyGroups(subscription),
        '',
        '[Rule]',
        ...subscription.rules.map(ruleToSurge)
      ];

      return E.right({
        content: surgeConfig.join('\n'),
        contentType: 'text/plain',
        filename: config.filename || 'surge.conf'
      });
    } catch (error) {
      return E.left(`Failed to generate Surge config: ${String(error)}`);
    }
  }
};

// Convert proxy to Surge format
const proxyToSurge = (proxy: ProxyConfig): string => {
  const base = `${proxy.name} = ${proxy.type}, ${proxy.server}, ${proxy.port}`;
  
  switch (proxy.type) {
    case 'ss':
      return `${base}, encrypt-method=${proxy.cipher}, password=${proxy.password}`;
    
    case 'vmess':
      return `${base}, username=${proxy.uuid}, skip-cert-verify=${proxy.skipCertVerify || false}`;
    
    case 'trojan':
      return `${base}, password=${proxy.password}, skip-cert-verify=${proxy.skipCertVerify || false}`;
    
    default:
      return base;
  }
};

// Generate Surge proxy groups
const generateSurgeProxyGroups = (subscription: Subscription): readonly string[] => {
  const proxyNames = subscription.proxies.map(p => p.name);
  
  return [
    `PROXY = select, ${proxyNames.join(', ')}`,
    `AUTO = url-test, ${proxyNames.join(', ')}, url = http://www.gstatic.com/generate_204, interval = 300`,
    'DIRECT = direct',
    'REJECT = reject'
  ];
};

// Convert rule to Surge format
const ruleToSurge = (rule: Rule): string => {
  return `${rule.type},${rule.payload},${rule.proxy}`;
};

// Quantumult X generator
export const quantumultXGenerator: SubscriptionGenerator = {
  target: 'quanx',
  
  generate: (subscription: Subscription, config: ConversionConfig): E.Either<string, ConversionResult> => {
    try {
      const quanxConfig = [
        '[general]',
        'dns_exclusion_list = *.cmpassport.com, *.jegotrip.com.cn, *.icitymobile.mobi, id6.me',
        'geo_location_checker = http://ip-api.com/json/?lang=zh-CN, https://github.com/KOP-XIAO/QuantumultX/raw/master/Scripts/IP_API.js',
        'resource_parser_url = https://raw.githubusercontent.com/KOP-XIAO/QuantumultX/master/Scripts/resource-parser.js',
        'server_check_url = http://www.gstatic.com/generate_204',
        'profile_img_url = https://github.com/KOP-XIAO/QuantumultX/blob/master/img/dragonball/1.PNG?raw=true',
        '',
        '[dns]',
        'server = 223.5.5.5',
        'server = 119.29.29.29',
        'server = 8.8.8.8',
        '',
        '[policy]',
        ...generateQuantumultXPolicyGroups(subscription),
        '',
        '[server_remote]',
        '',
        '[filter_remote]',
        '',
        '[rewrite_remote]',
        '',
        '[server_local]',
        ...subscription.proxies.map(proxyToQuantumultX),
        '',
        '[filter_local]',
        ...subscription.rules.map(ruleToQuantumultX),
        '',
        '[rewrite_local]',
        '',
        '[mitm]'
      ];

      return E.right({
        content: quanxConfig.join('\n'),
        contentType: 'text/plain',
        filename: config.filename || 'quantumult-x.conf'
      });
    } catch (error) {
      return E.left(`Failed to generate Quantumult X config: ${String(error)}`);
    }
  }
};

// Convert proxy to Quantumult X format
const proxyToQuantumultX = (proxy: ProxyConfig): string => {
  const base = `${proxy.type}=${proxy.server}:${proxy.port}`;
  
  switch (proxy.type) {
    case 'ss':
      return `${base}, method=${proxy.cipher}, password=${proxy.password}, tag=${proxy.name}`;
    
    case 'vmess':
      return `${base}, method=none, password=${proxy.uuid}, tag=${proxy.name}`;
    
    case 'trojan':
      return `${base}, password=${proxy.password}, tag=${proxy.name}`;
    
    default:
      return `${base}, tag=${proxy.name}`;
  }
};

// Generate Quantumult X policy groups
const generateQuantumultXPolicyGroups = (subscription: Subscription): readonly string[] => {
  const proxyNames = subscription.proxies.map(p => p.name);
  
  return [
    `static=PROXY, ${proxyNames.join(', ')}, direct, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Proxy.png`,
    `available=AUTO, ${proxyNames.join(', ')}, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Auto.png`
  ];
};

// Convert rule to Quantumult X format
const ruleToQuantumultX = (rule: Rule): string => {
  return `${rule.type}, ${rule.payload}, ${rule.proxy}`;
};

// V2Ray generator
export const v2rayGenerator: SubscriptionGenerator = {
  target: 'v2ray',
  
  generate: (subscription: Subscription, config: ConversionConfig): E.Either<string, ConversionResult> => {
    try {
      const v2rayConfig = {
        log: {
          loglevel: 'warning'
        },
        inbounds: [
          {
            tag: 'proxy',
            port: 10808,
            listen: '127.0.0.1',
            protocol: 'socks',
            settings: {
              udp: true
            }
          }
        ],
        outbounds: [
          {
            tag: 'proxy',
            protocol: 'vmess',
            settings: {
              vnext: subscription.proxies.filter(p => p.type === 'vmess').map(proxyToV2Ray)
            }
          },
          {
            tag: 'direct',
            protocol: 'freedom'
          },
          {
            tag: 'block',
            protocol: 'blackhole'
          }
        ],
        routing: {
          rules: subscription.rules.map(ruleToV2Ray)
        }
      };

      return E.right({
        content: JSON.stringify(v2rayConfig, null, 2),
        contentType: 'application/json',
        filename: config.filename || 'v2ray.json'
      });
    } catch (error) {
      return E.left(`Failed to generate V2Ray config: ${String(error)}`);
    }
  }
};

// Convert proxy to V2Ray format
const proxyToV2Ray = (proxy: ProxyConfig): Record<string, unknown> => {
  return {
    address: proxy.server,
    port: proxy.port,
    users: [
      {
        id: proxy.uuid,
        alterId: proxy.alterId || 0,
        security: proxy.cipher || 'auto'
      }
    ]
  };
};

// Convert rule to V2Ray format
const ruleToV2Ray = (rule: Rule): Record<string, unknown> => {
  return {
    type: 'field',
    [rule.type.toLowerCase()]: [rule.payload],
    outboundTag: rule.proxy
  };
};

// Main generator function
export const generateSubscription = (
  subscription: Subscription, 
  config: ConversionConfig
): E.Either<string, ConversionResult> => {
  const generators: Record<ConversionTarget, SubscriptionGenerator> = {
    clash: clashGenerator,
    clashr: clashGenerator, // ClashR uses same format as Clash
    surge: surgeGenerator,
    quanx: quantumultXGenerator,
    v2ray: v2rayGenerator,
    // Add more generators as needed
    quan: quantumultXGenerator,
    loon: surgeGenerator, // Loon uses Surge-like format
    ss: { 
      target: 'ss', 
      generate: (sub, cfg) => generateSimpleList(sub, cfg, 'ss')
    },
    sssub: { 
      target: 'sssub', 
      generate: (sub, cfg) => generateSimpleList(sub, cfg, 'sssub')
    },
    ssd: { 
      target: 'ssd', 
      generate: (sub, cfg) => generateSimpleList(sub, cfg, 'ss')
    },
    ssr: { 
      target: 'ssr', 
      generate: (sub, cfg) => generateSimpleList(sub, cfg, 'ssr')
    },
    surfboard: surgeGenerator,
    mixed: { 
      target: 'mixed', 
      generate: (sub, cfg) => generateSimpleList(sub, cfg, 'mixed')
    },
    auto: clashGenerator
  };

  const generator = generators[config.target];
  if (!generator) {
    return E.left(`Unsupported target: ${config.target}`);
  }

  return generator.generate(subscription, config);
};

// Generate simple proxy list (for SS/SSR formats)
const generateSimpleList = (
  subscription: Subscription, 
  config: ConversionConfig,
  type: 'ss' | 'ssr' | 'sssub' | 'mixed'
): E.Either<string, ConversionResult> => {
  try {
    const filteredProxies = subscription.proxies.filter(proxy => {
      if (type === 'mixed' || type === 'sssub') return true;
      return proxy.type === type;
    });

    const urls = filteredProxies.map(proxy => {
      switch (proxy.type) {
        case 'ss':
          const ssAuth = encodeBase64(`${proxy.cipher}:${proxy.password}`);
          return `ss://${ssAuth}@${proxy.server}:${proxy.port}#${encodeURIComponent(proxy.name)}`;
        
        case 'ssr':
          const ssrConfig = `${proxy.server}:${proxy.port}:${proxy.protocol || ''}:${proxy.cipher}:${proxy.obfs || ''}:${encodeBase64(proxy.password || '')}`;
          return `ssr://${encodeBase64(ssrConfig)}`;
        
        default:
          return `# Unsupported proxy type: ${proxy.type}`;
      }
    });

    const content = type === 'sssub' ? encodeBase64(urls.join('\n')) : urls.join('\n');

    return E.right({
      content,
      contentType: 'text/plain',
      filename: config.filename || `${type}.txt`
    });
  } catch (error) {
    return E.left(`Failed to generate ${type} list: ${String(error)}`);
  }
};
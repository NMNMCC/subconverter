// Core proxy configuration types
export interface ProxyConfig {
  readonly type: ProxyType;
  readonly name: string;
  readonly server: string;
  readonly port: number;
  readonly cipher?: string;
  readonly password?: string;
  readonly uuid?: string;
  readonly alterId?: number;
  readonly network?: string;
  readonly host?: string;
  readonly path?: string;
  readonly tls?: boolean;
  readonly skipCertVerify?: boolean;
  readonly serverName?: string;
  readonly alpn?: readonly string[];
  readonly fingerprint?: string;
  readonly publicKey?: string;
  readonly shortId?: string;
  readonly spiderX?: string;
  readonly flow?: string;
  readonly seed?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly wsHeaders?: Readonly<Record<string, string>>;
  readonly wsPath?: string;
  readonly plugin?: string;
  readonly pluginOpts?: Readonly<Record<string, unknown>>;
  // SSR specific fields
  readonly protocol?: string;
  readonly obfs?: string;
  readonly protocolParam?: string;
  readonly obfsParam?: string;
}

export type ProxyType = 
  | 'ss'
  | 'ssr'
  | 'vmess'
  | 'vless'
  | 'trojan'
  | 'hysteria'
  | 'hysteria2'
  | 'tuic'
  | 'naive'
  | 'http'
  | 'https'
  | 'socks5';

export interface ProxyGroup {
  readonly name: string;
  readonly type: ProxyGroupType;
  readonly proxies: readonly string[];
  readonly url?: string;
  readonly interval?: number;
  readonly lazy?: boolean;
  readonly disableUDP?: boolean;
  readonly filter?: string;
  readonly excludeFilter?: string;
  readonly tolerance?: number;
  readonly timeout?: number;
  readonly strategy?: string;
  readonly use?: readonly string[];
  readonly icon?: string;
}

export type ProxyGroupType = 
  | 'select'
  | 'url-test'
  | 'fallback'
  | 'load-balance'
  | 'relay';

export interface Rule {
  readonly type: RuleType;
  readonly payload: string;
  readonly proxy: string;
  readonly policyPath?: string;
  readonly noResolve?: boolean;
}

export type RuleType = 
  | 'DOMAIN'
  | 'DOMAIN-SUFFIX'
  | 'DOMAIN-KEYWORD'
  | 'IP-CIDR'
  | 'IP-CIDR6'
  | 'IP-ASN'
  | 'GEOIP'
  | 'GEOSITE'
  | 'MATCH'
  | 'FINAL'
  | 'PROCESS-NAME'
  | 'PROCESS-PATH'
  | 'RULE-SET'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'SCRIPT';

export interface Subscription {
  readonly url: string;
  readonly proxies: readonly ProxyConfig[];
  readonly proxyGroups: readonly ProxyGroup[];
  readonly rules: readonly Rule[];
  readonly userInfo?: UserInfo;
  readonly headers?: Readonly<Record<string, string>>;
}

export interface UserInfo {
  readonly upload?: number;
  readonly download?: number;
  readonly total?: number;
  readonly expire?: number;
}

export interface ConversionConfig {
  readonly target: ConversionTarget;
  readonly url?: string;
  readonly enableRuleGenerator?: boolean;
  readonly enableTfo?: boolean;
  readonly enableMptcp?: boolean;
  readonly enableUdp?: boolean;
  readonly enableSort?: boolean;
  readonly enableFdn?: boolean;
  readonly enableClashMode?: boolean;
  readonly enableInsert?: boolean;
  readonly appendType?: boolean;
  readonly appendInfo?: boolean;
  readonly sort?: boolean;
  readonly filterDeprecated?: boolean;
  readonly fdn?: boolean;
  readonly emoji?: boolean;
  readonly rename?: string;
  readonly ruleSet?: readonly string[];
  readonly customProxyGroups?: readonly ProxyGroup[];
  readonly customRules?: readonly Rule[];
  readonly includeRemarks?: readonly string[];
  readonly excludeRemarks?: readonly string[];
  readonly template?: string;
  readonly filename?: string;
  readonly config?: string;
  readonly scv?: boolean;
  readonly udp?: boolean;
  readonly tfo?: boolean;
  readonly mptcp?: boolean;
  readonly expand?: boolean;
  readonly dev?: boolean;
  readonly strict?: boolean;
  readonly interval?: number;
  readonly timeout?: number;
  readonly new_name?: boolean;
}

export type ConversionTarget = 
  | 'clash'
  | 'clashr'
  | 'quan'
  | 'quanx'
  | 'loon'
  | 'ss'
  | 'sssub'
  | 'ssd'
  | 'ssr'
  | 'surfboard'
  | 'surge'
  | 'v2ray'
  | 'mixed'
  | 'auto';

export interface ConversionResult {
  readonly content: string;
  readonly contentType: string;
  readonly filename?: string;
  readonly headers?: Readonly<Record<string, string>>;
}

export interface ConversionError {
  readonly message: string;
  readonly code: string;
  readonly details?: unknown;
}

export interface ServerConfig {
  readonly port: number;
  readonly host?: string;
  readonly apiPath?: string;
  readonly maxConcurrency?: number;
  readonly timeout?: number;
  readonly cors?: boolean;
  readonly helmet?: boolean;
  readonly rateLimit?: {
    readonly windowMs: number;
    readonly max: number;
  };
}

export interface LogConfig {
  readonly level: 'error' | 'warn' | 'info' | 'debug';
  readonly enableFile?: boolean;
  readonly filePath?: string;
  readonly maxSize?: number;
  readonly maxFiles?: number;
}
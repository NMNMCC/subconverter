import { pipe } from 'fp-ts/lib/function.js';
import * as E from 'fp-ts/lib/Either.js';
import * as O from 'fp-ts/lib/Option.js';
import { Base64 } from 'js-base64';

// Type-safe URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Safe URL parsing with Either
export const parseUrl = (url: string): E.Either<string, URL> => {
  try {
    return E.right(new URL(url));
  } catch (error) {
    return E.left(`Invalid URL: ${String(error)}`);
  }
};

// Base64 encode/decode with error handling
export const encodeBase64 = (input: string): string => {
  try {
    return Base64.encode(input);
  } catch {
    return '';
  }
};

export const decodeBase64 = (input: string): E.Either<string, string> => {
  try {
    const decoded = Base64.decode(input);
    return E.right(decoded);
  } catch (error) {
    return E.left(`Base64 decode error: ${String(error)}`);
  }
};

// Safe string splitting
export const safeSplit = (separator: string) => (input: string): readonly string[] => {
  return input.split(separator).filter(Boolean);
};

// Safe array access
export const safeArrayAccess = <T>(index: number) => (array: readonly T[]): O.Option<T> => {
  return index >= 0 && index < array.length ? O.some(array[index]!) : O.none;
};

// Safe object property access
export const safeProp = <T>(key: string) => (obj: Record<string, T>): O.Option<T> => {
  return obj[key] !== undefined ? O.some(obj[key]!) : O.none;
};

// String utilities
export const trim = (str: string): string => str.trim();
export const toLowerCase = (str: string): string => str.toLowerCase();
export const toUpperCase = (str: string): string => str.toUpperCase();
export const isEmpty = (str: string): boolean => str.length === 0;
export const isNotEmpty = (str: string): boolean => str.length > 0;

// Safe number parsing
export const parseNumber = (str: string): O.Option<number> => {
  const num = Number(str);
  return isNaN(num) ? O.none : O.some(num);
};

export const parseInt = (str: string): O.Option<number> => {
  const num = Number.parseInt(str, 10);
  return isNaN(num) ? O.none : O.some(num);
};

// Safe boolean parsing
export const parseBoolean = (str: string): boolean => {
  const lower = str.toLowerCase();
  return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on';
};

// Array utilities with functional approach
export const filterEmpty = <T>(array: readonly (T | null | undefined)[]): readonly T[] => {
  return array.filter((item): item is T => item !== null && item !== undefined);
};

export const unique = <T>(array: readonly T[]): readonly T[] => {
  return Array.from(new Set(array));
};

export const groupBy = <T, K extends string | number | symbol>(
  keyFn: (item: T) => K
) => (array: readonly T[]): Record<K, readonly T[]> => {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    return {
      ...acc,
      [key]: [...(acc[key] || []), item]
    };
  }, {} as Record<K, readonly T[]>);
};

// Object utilities
export const deepFreeze = <T>(obj: T): T => {
  Object.freeze(obj);
  Object.values(obj as Record<string, unknown>).forEach(value => {
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value);
    }
  });
  return obj;
};

export const omit = <T, K extends keyof T>(keys: readonly K[]) => (obj: T): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

export const pick = <T extends object, K extends keyof T>(keys: readonly K[]) => (obj: T): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

// Regex utilities
export const createRegex = (pattern: string, flags?: string): E.Either<string, RegExp> => {
  try {
    return E.right(new RegExp(pattern, flags));
  } catch (error) {
    return E.left(`Invalid regex pattern: ${String(error)}`);
  }
};

export const testRegex = (regex: RegExp) => (input: string): boolean => {
  return regex.test(input);
};

export const matchRegex = (regex: RegExp) => (input: string): O.Option<RegExpMatchArray> => {
  const match = input.match(regex);
  return match ? O.some(match) : O.none;
};

// URL utilities
export const getUrlParams = (url: string): E.Either<string, Record<string, string>> => {
  return pipe(
    parseUrl(url),
    E.map(urlObj => {
      const params: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      return params;
    })
  );
};

export const addUrlParams = (params: Record<string, string>) => (url: string): E.Either<string, string> => {
  return pipe(
    parseUrl(url),
    E.map(urlObj => {
      Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.set(key, value);
      });
      return urlObj.toString();
    })
  );
};

// Validation utilities
export const isValidPort = (port: number): boolean => {
  return Number.isInteger(port) && port > 0 && port <= 65535;
};

export const isValidIPv4 = (ip: string): boolean => {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipv4Regex);
  if (!match) return false;
  
  return match.slice(1, 5).every(octet => {
    const num = Number.parseInt(octet, 10);
    return num >= 0 && num <= 255;
  });
};

export const isValidIPv6 = (ip: string): boolean => {
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(ip);
};

export const isValidDomain = (domain: string): boolean => {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain);
};

// Async utilities
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const timeout = <T>(ms: number) => (promise: Promise<T>): Promise<T> => {
  return Promise.race([
    promise,
    delay(ms).then(() => Promise.reject(new Error(`Operation timed out after ${ms}ms`)))
  ]);
};

// Compose utilities for functional programming
export const compose = <T>(...fns: readonly ((arg: T) => T)[]): ((arg: T) => T) => {
  return (arg: T) => fns.reduceRight((acc, fn) => fn(acc), arg);
};

export const pipe2 = <A, B, C>(fn1: (arg: A) => B, fn2: (arg: B) => C) => (arg: A): C => {
  return fn2(fn1(arg));
};

// Error handling utilities
export const tryCatch = <T, E = Error>(fn: () => T): E.Either<E, T> => {
  try {
    return E.right(fn());
  } catch (error) {
    return E.left(error as E);
  }
};

export const tryCatchAsync = async <T, E = Error>(fn: () => Promise<T>): Promise<E.Either<E, T>> => {
  try {
    const result = await fn();
    return E.right(result);
  } catch (error) {
    return E.left(error as E);
  }
};

// Memoization utility
export const memoize = <T extends readonly unknown[], R>(
  fn: (...args: T) => R,
  keyFn: (...args: T) => string = (...args) => JSON.stringify(args)
): (...args: T) => R => {
  const cache = new Map<string, R>();
  
  return (...args: T): R => {
    const key = keyFn(...args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};
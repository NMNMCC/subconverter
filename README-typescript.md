# Subconverter - TypeScript Edition

A modern TypeScript + Node.js implementation of subconverter, following functional programming paradigms. This utility converts between various proxy subscription formats with a focus on type safety, immutability, and functional composition.

## Features

- 🚀 **Modern TypeScript**: Built with TypeScript 5.3+ for maximum type safety
- 🔧 **Functional Programming**: Pure functions, immutable data structures, and functional composition
- 📦 **Multiple Format Support**: Clash, Surge, Quantumult X, V2Ray, Shadowsocks, and more
- 🌐 **RESTful API**: Clean HTTP API with comprehensive error handling
- 🔒 **Security First**: Built-in rate limiting, CORS, and security headers
- ⚡ **High Performance**: Efficient parsing and generation with minimal memory footprint
- 🧪 **Well Tested**: Comprehensive test suite with functional programming principles
- 📖 **Type Documentation**: Full TypeScript interfaces and documentation

## Supported Formats

| Format | Input | Output | Description |
|--------|-------|--------|-------------|
| Clash | ✅ | ✅ | Clash for Windows/Android |
| ClashR | ✅ | ✅ | ClashR with SSR support |
| Surge | ✅ | ✅ | Surge for iOS/macOS |
| Quantumult | ✅ | ✅ | Quantumult for iOS |
| Quantumult X | ✅ | ✅ | Quantumult X for iOS |
| Loon | ✅ | ✅ | Loon for iOS |
| V2Ray | ✅ | ✅ | V2Ray core format |
| Shadowsocks | ✅ | ✅ | SS URL format |
| ShadowsocksR | ✅ | ✅ | SSR URL format |
| Surfboard | ✅ | ✅ | Surfboard for Android |

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/NMNMCC/subconverter.git
cd subconverter

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

### Docker (Recommended)

```bash
# Build Docker image
docker build -t subconverter-ts .

# Run container
docker run -p 25500:25500 subconverter-ts
```

### Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Usage

### Basic Conversion

```bash
# Convert to Clash format
curl "http://localhost:25500/sub?target=clash&url=<encoded_subscription_url>"

# Convert to Surge format
curl "http://localhost:25500/sub?target=surge&url=<encoded_subscription_url>"

# Convert to V2Ray format
curl "http://localhost:25500/sub?target=v2ray&url=<encoded_subscription_url>"
```

### API Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/sub` | GET/POST | Main conversion endpoint |
| `/health` | GET | Health check |
| `/version` | GET | Version information |
| `/api/sub` | GET/POST | API versioned endpoint |
| `/{format}` | GET | Direct format conversion |

### Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `target` | ✅ | Target format | `clash`, `surge`, `v2ray` |
| `url` | ✅ | Subscription URL (URL encoded) | `https%3A%2F%2Fexample.com%2Fsub` |
| `config` | ❌ | External config URL | `https%3A%2F%2Fconfig.example.com` |
| `emoji` | ❌ | Add emoji to names | `true`, `false` |
| `rename` | ❌ | Rename pattern | `prefix@suffix` |
| `include` | ❌ | Include filter | `HK\|US\|SG` |
| `exclude` | ❌ | Exclude filter | `expire\|流量` |
| `sort` | ❌ | Sort proxies | `true`, `false` |
| `udp` | ❌ | Enable UDP | `true`, `false` |
| `tfo` | ❌ | Enable TCP Fast Open | `true`, `false` |
| `filename` | ❌ | Custom filename | `my-config.yaml` |

### Examples

```bash
# Basic Clash conversion
curl "http://localhost:25500/sub?target=clash&url=https%3A%2F%2Fexample.com%2Fsubscription"

# Surge with custom options
curl "http://localhost:25500/sub?target=surge&url=https%3A%2F%2Fexample.com%2Fsubscription&emoji=true&sort=true"

# V2Ray with filters
curl "http://localhost:25500/sub?target=v2ray&url=https%3A%2F%2Fexample.com%2Fsubscription&include=HK%7CUS&exclude=expire"

# Multiple subscriptions (separated by |)
curl "http://localhost:25500/sub?target=clash&url=https%3A%2F%2Fsub1.com%7Chttps%3A%2F%2Fsub2.com"
```

## Architecture

### Functional Programming Principles

This implementation follows strict functional programming principles:

- **Pure Functions**: All parsing and generation functions are pure
- **Immutability**: Data structures are deeply frozen and immutable
- **Function Composition**: Complex operations built from simple function composition
- **Error Handling**: Monadic error handling with Either types from fp-ts
- **Type Safety**: Comprehensive TypeScript types for all data structures

### Project Structure

```
src/
├── types/           # TypeScript type definitions
├── utils/           # Pure utility functions
├── parsers/         # Subscription parsing functions
├── generators/      # Configuration generation functions
├── handlers/        # HTTP request handlers
├── server/          # Express server setup
├── __tests__/       # Test suites
└── index.ts         # Application entry point
```

### Core Types

```typescript
// Proxy configuration
interface ProxyConfig {
  readonly type: ProxyType;
  readonly name: string;
  readonly server: string;
  readonly port: number;
  // ... additional type-safe properties
}

// Subscription data
interface Subscription {
  readonly url: string;
  readonly proxies: readonly ProxyConfig[];
  readonly proxyGroups: readonly ProxyGroup[];
  readonly rules: readonly Rule[];
}

// Conversion configuration
interface ConversionConfig {
  readonly target: ConversionTarget;
  readonly enableRuleGenerator?: boolean;
  // ... additional options
}
```

## Configuration

### Environment Variables

```bash
# Server settings
PORT=25500
HOST=0.0.0.0
API_PATH=/api

# Security
CORS=true
HELMET=true
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# Performance
MAX_CONCURRENCY=10
TIMEOUT=30000

# Logging
LOG_LEVEL=info
NODE_ENV=production
```

### Command Line Options

```bash
npm start -- --port 3000 --host localhost --cors false
```

## Testing

The project includes comprehensive tests following functional programming principles:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- parsers
```

### Test Categories

- **Unit Tests**: Individual function testing
- **Integration Tests**: End-to-end conversion flows
- **Functional Tests**: Pure function behavior
- **Type Tests**: TypeScript type safety verification

## Performance

- **Memory Efficient**: Immutable data structures with structural sharing
- **CPU Optimized**: Pure functions enable better optimization
- **Concurrent Safe**: Stateless design allows high concurrency
- **Caching**: Memoization for expensive operations

## Security

- **Input Validation**: Comprehensive input validation and sanitization
- **Rate Limiting**: Configurable rate limiting per IP
- **CORS Protection**: Configurable CORS policies
- **Security Headers**: Helmet.js for security headers
- **Error Handling**: Safe error messages without information leakage

## Migration from C++

This TypeScript implementation maintains API compatibility with the original C++ version while providing:

- **Better Type Safety**: Compile-time error checking
- **Improved Maintainability**: Functional programming principles
- **Enhanced Performance**: Modern V8 optimizations
- **Cloud Native**: Better container and deployment support
- **Developer Experience**: Better tooling and debugging

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Follow functional programming principles
4. Add comprehensive tests
5. Ensure type safety
6. Submit a pull request

### Code Standards

- Use pure functions wherever possible
- Maintain immutability with readonly types
- Follow functional composition patterns
- Add comprehensive TypeScript types
- Write tests for all new functionality
- Use fp-ts for monadic operations

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original C++ subconverter project
- fp-ts library for functional programming utilities
- TypeScript team for excellent type system
- Node.js community for excellent ecosystem
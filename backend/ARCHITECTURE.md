# Clean Architecture Overview

## Layered Architecture

```
┌─────────────────────────────────────────────────────┐
│                    HTTP Requests                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              Express Middleware Stack                │
├─────────────────────────────────────────────────────┤
│ • Body Parser                                       │
│ • Cookie Parser                                      │
│ • CORS                                              │
│ • Rate Limiting                                      │
│ • Logging                                            │
│ • Container Injection (req.container)               │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              Route Handlers                          │
│            (Express Router Layer)                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│             Controllers Layer                        │
├─────────────────────────────────────────────────────┤
│ • authController.js                                 │
│ • aiController.js                                   │
│ • sessionController.js                              │
│ • userController.js                                 │
│ • etc.                                              │
│                                                      │
│ Responsibility:                                      │
│  - Parse HTTP requests                              │
│  - Call services via req.container                  │
│  - Format HTTP responses                            │
│  - Throw errors (caught by error handler)           │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│             Services Layer                          │
├─────────────────────────────────────────────────────┤
│ • AuthService - registration, login, password reset │
│ • AIService - Claude API interactions               │
│ • EmailService - email sending, validation          │
│ • CacheService - Redis caching wrapper              │
│                                                      │
│ Responsibility:                                      │
│  - Business logic                                   │
│  - Orchestration                                    │
│  - Validation                                       │
│  - Error throwing                                   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│          Repositories Layer                          │
├─────────────────────────────────────────────────────┤
│ • UserRepository - user CRUD operations             │
│ • SessionRepository - session queries               │
│ • ProblemRepository - problem queries               │
│ • PerformanceRepository - evaluation stats          │
│ • BaseRepository - common operations                │
│                                                      │
│ Responsibility:                                      │
│  - Database abstraction                             │
│  - Query logic                                      │
│  - Data access only                                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│          Data Layer (External)                       │
├─────────────────────────────────────────────────────┤
│ • Prisma ORM → PostgreSQL                           │
│ • Redis Cache                                       │
│ • Brevo Email API                                   │
│ • Anthropic Claude API                              │
└─────────────────────────────────────────────────────┘
```

---

## Dependency Injection Flow

```
Application Bootstrap
        │
        ▼
    index.js
        │
        ├─ connectDB()
        ├─ connectRedis()
        │
        ▼
  ServiceContainer (IoC)
        │
        ├─ Register Repositories
        │   ├─ UserRepository(prisma)
        │   ├─ SessionRepository(prisma)
        │   └─ ...
        │
        ├─ Register Services
        │   ├─ AuthService(userRepo, emailService, config, logger)
        │   ├─ AIService(config, cache, logger)
        │   └─ ...
        │
        ├─ Register Core Services
        │   ├─ Logger
        │   ├─ Config
        │   └─ CacheService(redis, logger)
        │
        ▼
     Express App
        │
        ├─ containerMiddleware(container)
        │   └─ Injects into req.container
        │
        ├─ routes
        │   └─ controllers
        │       └─ Services via req.container
        │
        └─ errorHandler
            └─ Catches all errors
```

---

## Request-Response Cycle

```
HTTP Request
    │
    ▼
Express Middleware Chain
    │
    ├─ bodyParser() - Parse JSON
    ├─ cookieParser() - Parse cookies
    ├─ cors() - Handle CORS
    ├─ logger - Log request
    ├─ globalLimiter - Rate limiting
    └─ containerMiddleware - Inject services
    │
    ▼
Route Handler
    │
    ▼
Controller Function
    │
    ├─ Extract: const { authService, userRepository } = req.container
    ├─ Call: const result = await authService.login(...)
    │
    ├─ Success → ApiResponse.success(res, data, message)
    │
    └─ Error → throw new ValidationError(...) or other custom error
        │
        ▼
    Global Error Handler
        │
        ├─ Catch custom errors (AppError, ValidationError, etc.)
        ├─ Log error with context
        ├─ Format response
        │
        ▼
    HTTP Response
```

---

## Service Dependencies

```
AuthService
├─ UserRepository
│   └─ Prisma (database access)
├─ EmailService
│   ├─ Axios (HTTP client)
│   └─ DNS Resolver
├─ Config
└─ Logger

AIService
├─ Config
├─ CacheService
│   └─ Redis
└─ Logger
    └─ Anthropic SDK

SessionService
├─ SessionRepository
│   └─ Prisma
├─ Logger
└─ (Add as needed)

EmailService
├─ Config
├─ Axios
└─ Logger
```

---

## Error Handling Flow

```
Controller
    │
    ▼
Service throws error
    │
    ├─ throw new ValidationError("Invalid email")
    ├─ throw new AuthError("Wrong password")
    ├─ throw new NotFoundError("User")
    │
    ▼
asyncHandler catches (wraps in Promise.resolve)
    │
    ▼
Express error middleware
    │
    ▼
Global errorHandler
    │
    ├─ instanceof AppError?
    │   ├─ YES: ApiResponse.error(res, err.message, err.statusCode)
    │   └─ NO: Check Zod/Prisma errors
    │
    ├─ Log error with full context
    │
    ▼
HTTP Response with status code & message
    │
    ▼
Client receives structured error
    {
      "success": false,
      "message": "Email already registered",
      "statusCode": 409,
      "timestamp": "2026-08-29T...",
      "errorCode": "CONFLICT"
    }
```

---

## Data Flow Example: User Registration

```
1. Client sends POST /auth/register
   {
     "name": "John",
     "username": "john123",
     "email": "john@example.com",
     "password": "secret123"
   }

2. Container Middleware injects services

3. authController.register()
   ├─ Gets authService from req.container
   ├─ Calls authService.register(body, cacheService)

4. AuthService.register()
   ├─ Validates email domain (EmailService.validateEmailDomain)
   ├─ Checks if email exists (UserRepository.findByEmailWithoutThrow)
   ├─ Checks if username exists (UserRepository.findByUsernameWithoutThrow)
   ├─ Hashes password
   ├─ Stores pending registration in cache (CacheService.set)
   ├─ Sends verification email (EmailService.sendVerificationEmail)
   └─ Returns { email, message }

5. Controller formats response
   └─ ApiResponse.created(res, { email }, "Registration successful...")

6. Client receives
   {
     "success": true,
     "data": { "email": "john@example.com" },
     "message": "Registration successful. Please check your email...",
     "timestamp": "2026-08-29T..."
   }
```

---

## Test Structure Example

```javascript
// authService.test.js
describe('AuthService', () => {
  let authService, mockUserRepo, mockEmailService, mockLogger

  beforeEach(() => {
    // Mock dependencies
    mockUserRepo = {
      findByEmailWithoutThrow: jest.fn(),
      findByUsernameWithoutThrow: jest.fn(),
      create: jest.fn(),
    }

    mockEmailService = {
      validateEmailDomain: jest.fn().mockResolvedValue(true),
      sendVerificationEmail: jest.fn(),
    }

    mockLogger = { child: () => mockLogger, info: jest.fn(), error: jest.fn() }

    // Create service with mocked dependencies
    authService = new AuthService(
      mockUserRepo,
      mockEmailService,
      { NODE_ENV: 'test' },
      mockLogger
    )
  })

  test('should register user successfully', async () => {
    mockUserRepo.findByEmailWithoutThrow.mockResolvedValue(null)
    mockUserRepo.findByUsernameWithoutThrow.mockResolvedValue(null)

    const result = await authService.register({
      name: 'Test',
      email: 'test@example.com',
      username: 'test123',
      password: 'password123'
    }, mockCache)

    expect(mockUserRepo.findByEmailWithoutThrow).toHaveBeenCalledWith('test@example.com')
    expect(result.email).toBe('test@example.com')
  })
})
```

---

## Configuration & Environment

```javascript
// config/config.js
module.exports = {
  PORT: 3000,
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://...',
  JWT_SECRET: 'secret',
  ANTHROPIC_API_KEY: 'sk-ant-...',
  REDIS_URL: 'redis://localhost:6379',
  BREVO_API_KEY: '...',
  EMAIL_FROM: '...',
  FRONTEND_URL: 'http://localhost:5173'
}
```

All services receive config via constructor injection, not direct requires.

---

## Summary of Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Testability** | Hard (tight coupling) | Easy (DI + mocking) |
| **Error Handling** | Generic Errors | Custom typed errors |
| **Logging** | console.log everywhere | Structured Logger service |
| **Database Access** | Prisma in controllers | Repositories layer |
| **Service Registration** | Hardcoded requires | Container managed |
| **Code Reuse** | Duplicated | Centralized services |
| **Maintainability** | Scattered logic | Clear separation of concerns |
| **Scalability** | Hard to extend | Easy to add new services |
| **Database Switching** | Requires code changes everywhere | Change only repositories |
| **Code Organization** | Chaotic | Clean layered architecture |

---

## SOLID Principles Applied

✅ **S** - Single Responsibility
- Controllers: Handle HTTP only
- Services: Business logic only
- Repositories: Database access only
- Errors: Define error types

✅ **O** - Open/Closed
- Easy to add new services (open for extension)
- Existing code unchanged (closed for modification)

✅ **L** - Liskov Substitution
- Can swap repositories without breaking code
- Services depend on abstractions

✅ **I** - Interface Segregation
- Each service has focused methods
- Controllers don't know about internal service details

✅ **D** - Dependency Inversion
- Depend on abstractions (ServiceContainer)
- Not on concrete implementations
- DI container manages dependencies

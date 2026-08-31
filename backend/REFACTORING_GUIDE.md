# Backend Refactoring Guide - OOP & Design Patterns

## Overview

This guide documents the comprehensive refactoring of the backend codebase to follow SOLID principles, clean architecture, and industry-standard design patterns.

## What Was Done

### 1. **Custom Error Classes** (NEW)
**Location:** `core/errors/`

**Custom Error Hierarchy:**
```
AppError (base class)
├── AuthError
├── ValidationError
├── NotFoundError
├── ConflictError
├── ForbiddenError
├── BadRequestError
└── InternalServerError
```

**Benefits:**
- Type-safe error handling
- Consistent error responses
- Better error context tracking
- Easier error recovery

**Usage:**
```javascript
const { AuthError, ValidationError, NotFoundError } = require('../core/errors')

// Instead of: throw new Error('Not found')
throw new NotFoundError('User')

// Instead of: throw new Error('Invalid email')
throw new ValidationError('Email is invalid', { field: 'email' })
```

### 2. **Logger Service** (NEW)
**Location:** `core/logger/Logger.js`

Replaces scattered `console.log` statements with structured logging.

**Features:**
- Structured logging with context
- Log levels: info, debug, warn, error, success, fail
- Child loggers for namespacing
- Ready for Sentry/DataDog integration

**Usage:**
```javascript
const Logger = require('../core/logger/Logger')
const logger = new Logger('MyService')

logger.info('User registered', { email })
logger.error('Database error', error, { userId })
logger.debug('Cache hit for key', { key })
logger.success('Server started')
```

### 3. **Service Container (IoC)** (NEW)
**Location:** `core/container/`

Implements dependency injection for decoupled architecture.

**Features:**
- Singleton pattern for services
- Service registration and resolution
- Automatic dependency graph management

**Bootstrap File:** `core/container/bootstrap.js`
- All services registered in one place
- Clear dependency declarations
- Easy to test and mock

### 4. **Repository Pattern** (NEW)
**Location:** `repositories/`

Abstracts database access from business logic.

**Files:**
- `BaseRepository.js` - Common CRUD operations
- `UserRepository.js` - User-specific queries
- `SessionRepository.js` - Session queries
- `ProblemRepository.js` - Problem queries
- `PerformanceRepository.js` - Evaluation/stats queries

**Benefits:**
- Single Responsibility: Repositories only handle DB access
- Easier testing (mock repositories instead of database)
- Database switching possible without touching business logic
- Centralized query logic

**Example:**
```javascript
// BEFORE: scattered Prisma calls in controllers
const user = await prisma.user.findUnique({ where: { email } })

// AFTER: clean repository interface
const user = await userRepository.findByEmail(email)
```

### 5. **Service Layer Refactoring** (IMPROVED)

#### CacheService (Refactored)
- **Location:** `services/cacheService.js`
- **Pattern:** Class-based with DI
- **Features:** 
  - Graceful error handling
  - TTL constants grouped
  - Remember pattern (get-or-compute)
  - Pattern-based deletion
  - Backwards compatible with old functional API

**Usage:**
```javascript
// New OOP way (in services/bootstrap.js)
const cacheService = new CacheService(redis, logger)
await cacheService.set('key', value, cacheService.TTL.LONG)

// Old way still works
const { get, set } = require('./cacheService')
await set('key', value, TTL.QUESTIONS)
```

#### EmailService (Refactored)
- **Location:** `services/emailService.js`
- **Pattern:** Class-based with DI
- **Features:**
  - Dependency injection of config and logger
  - Encapsulated email templates
  - Better error handling
  - Domain validation

**Usage:**
```javascript
const emailService = new EmailService(config, logger)
await emailService.sendVerificationEmail(email, name, token)
await emailService.validateEmailDomain(email)
```

#### AuthService (NEW)
- **Location:** `services/AuthService.js`
- **Pattern:** Class-based with DI
- **Features:**
  - All auth logic in one place
  - Dependency injection for repositories and services
  - Clear method signatures
  - Business logic separated from HTTP concerns

**Methods:**
```javascript
const authService = new AuthService(
  userRepository,
  emailService,
  config,
  logger
)

// All auth operations
await authService.register(registerDTO, cache)
await authService.verifyEmail(token, cache)
await authService.login(loginDTO)
await authService.forgotPassword(email)
await authService.resetPassword(resetDTO)
await authService.changePassword(userId, changePasswordDTO)
```

#### AIService (Refactored)
- **Location:** `services/aiService.js`
- **Pattern:** Class-based with DI
- **Features:**
  - Encapsulated Claude API calls
  - Centralized prompt management
  - Integrated caching
  - Structured logging

**Methods:**
```javascript
const aiService = new AIService(config, cacheService, logger)

await aiService.generateInterviewQuestions(role, level, topic, count)
await aiService.evaluateAnswer(question, answer, role, level)
await aiService.streamInterviewerResponse(history, role, level, res)
```

---

## Migration Path

### Phase 1: Foundation (DONE ✓)
- [x] Error classes created
- [x] Logger service created
- [x] Service container created
- [x] Repositories created
- [x] Core services refactored

### Phase 2: Controllers (NEXT)
Update all controllers to use services via DI instead of direct repository calls.

**Pattern to follow:**
```javascript
// BEFORE
const authController = (req, res) => {
  const user = await prisma.user.findUnique({ where: { email } })
  // ...
}

// AFTER
const authController = asyncHandler(async (req, res) => {
  const { authService } = req.container // from middleware
  const result = await authService.login({ email, password })
  ApiResponse.success(res, result.user, 'Logged in')
})
```

**Controllers to update:**
- `authController.js` - Use AuthService
- `aiController.js` - Use AIService
- `sessionController.js` - Use SessionRepository
- `problemController.js` - Use ProblemRepository
- `performanceController.js` - Use PerformanceRepository
- `userController.js` - Fix PrismaClient duplication, use UserRepository

### Phase 3: Middleware (NEXT)
- Update `errorHandler.js` to use new error classes
- Create `container.js` middleware to inject container into requests
- Update `auth.js` to use repositories and error classes

### Phase 4: Routes (FINAL)
- No changes needed, controllers will call services instead

---

## Key Design Patterns Used

### 1. **Dependency Injection**
Services receive dependencies through constructor, not requiring them directly.

### 2. **Repository Pattern**
Database access abstracted into repositories, separating data access from business logic.

### 3. **Service Layer**
Business logic encapsulated in services, controllers just orchestrate HTTP concerns.

### 4. **Singleton Pattern**
Services and repositories instantiated once via container.

### 5. **Custom Exceptions**
Type-safe error handling with custom error classes.

### 6. **Middleware Chain**
Composition of middleware for cross-cutting concerns.

---

## Benefits Achieved

| Aspect | Before | After |
|--------|--------|-------|
| **Testability** | Hard to test (tightly coupled) | Easy to mock and test |
| **Maintainability** | Logic scattered across files | Centralized, organized |
| **Reusability** | Code duplication | Services reused across controllers |
| **Error Handling** | Generic errors | Type-safe custom errors |
| **Database Switching** | Hard (Prisma everywhere) | Easy (swap repository impl) |
| **Dependency Management** | Implicit, hardcoded | Explicit, injected |
| **Logging** | Scattered console.log | Centralized, structured |

---

## Breaking Changes

None! All refactored services maintain backwards-compatible function exports for gradual migration.

---

## Next Steps

1. **Update error handler middleware** to use new error classes
2. **Create container middleware** to inject container into requests
3. **Refactor controllers** one by one using services via DI
4. **Update middleware** to use error classes
5. **Write tests** for services using mocked repositories
6. **Clean up** old code once fully migrated

---

## File Structure

```
backend/
├── core/
│   ├── errors/                 # Error classes
│   │   ├── AppError.js
│   │   ├── AuthError.js
│   │   ├── ValidationError.js
│   │   └── index.js
│   ├── logger/                 # Logger service
│   │   └── Logger.js
│   └── container/              # Service container
│       ├── ServiceContainer.js
│       └── bootstrap.js        # Service registration
├── repositories/               # Repository pattern
│   ├── BaseRepository.js
│   ├── UserRepository.js
│   ├── SessionRepository.js
│   ├── ProblemRepository.js
│   └── PerformanceRepository.js
├── services/                   # Services (refactored)
│   ├── AuthService.js
│   ├── AIService.js
│   ├── CacheService.js
│   ├── EmailService.js
│   └── ...
├── controllers/                # Controllers (to be refactored)
├── middleware/                 # Middleware
├── routes/                      # Routes
└── config/                      # Configuration
```

---

## Testing Example

```javascript
// userService.test.js
const UserRepository = require('../repositories/UserRepository')
const AuthService = require('../services/AuthService')

describe('AuthService', () => {
  let authService, mockUserRepo, mockEmailService

  beforeEach(() => {
    mockUserRepo = {
      findByEmailWithoutThrow: jest.fn(),
      create: jest.fn(),
    }
    mockEmailService = {
      validateEmailDomain: jest.fn().mockResolvedValue(true),
      sendVerificationEmail: jest.fn(),
    }

    authService = new AuthService(
      mockUserRepo,
      mockEmailService,
      { NODE_ENV: 'test' },
      mockLogger
    )
  })

  test('should register user with valid data', async () => {
    mockUserRepo.findByEmailWithoutThrow.mockResolvedValue(null)
    
    const result = await authService.register(
      { name: 'Test', email: 'test@example.com', ... },
      mockCache
    )

    expect(mockUserRepo.findByEmailWithoutThrow).toHaveBeenCalled()
    expect(result.email).toBe('test@example.com')
  })
})
```

---

## Questions?

This refactoring follows SOLID principles and clean code practices. Each layer has a single responsibility, making the codebase more maintainable, testable, and scalable.

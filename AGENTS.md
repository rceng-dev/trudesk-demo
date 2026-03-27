# AGENTS.md — Trudesk Codebase Guide

Trudesk is a self-hosted IT help desk / ticket management system built on Node.js + Express + MongoDB, with a React/Redux SPA frontend and Socket.IO for real-time features.

---

## Build, Lint & Test Commands

**Package manager:** Yarn 3.x (`yarn`, not `npm`, for all installs)

### Development
```bash
yarn start              # Start the server (node ./app)
yarn webpackdev         # Build frontend JS/CSS bundle (development)
yarn webpackwatch       # Watch and rebuild frontend on changes
yarn build              # Full Grunt build (SASS, CSS minification, etc.)
```

### Production
```bash
yarn webpackdist        # Production frontend build (minified, gzipped)
```

### Lint & Format
```bash
yarn lint               # ESLint via standard (piped through snazzy)
yarn format             # prettier-standard across all .js/.jsx files
```

Prettier config: **single quotes**, **120-char line width**. Standard JS: **no semicolons**.

Pre-commit hooks (husky + lint-staged) run `prettier-standard` automatically on staged `*.js` files.

### Tests
```bash
yarn test               # Run all tests: mocha --recursive
```

**Run a single test file:**
```bash
npx mocha test/api/api.js
npx mocha test/models/ticket.js
npx mocha test/controllers/ticketsController.js
```

**Run with coverage:**
```bash
npm run coverage        # nyc --reporter=lcovonly + mocha --recursive
```

Test layout:
```
test/
  0_database.js          # Global setup/teardown (execution order by filename prefix)
  1_sessions.js
  source/                # Unit tests: permissions, mailer, helpers
  models/                # Model-level tests
  controllers/           # Controller-level tests
  api/                   # Integration tests via supertest
```

Tests use **Mocha + Chai (`expect` style) + Supertest**. The `0_database.js` file starts a live MongoDB instance and seeds data — all tests share this global state. Use `this.timeout(15000)` for hooks with I/O.

---

## Code Style Guidelines

### General
- **Quotes:** single quotes `'` everywhere
- **Semicolons:** none (Standard JS) — except a leading `;` before IIFEs: `;(async () => { ... })()`
- **Indentation:** 2 spaces
- **Line length:** max 120 characters
- **Max cyclomatic complexity:** 20 (ESLint enforced)
- `console.log` is allowed but prefer **Winston** (`winston.warn`, `winston.info`) for all server-side logging

### Imports

**Server-side (Node.js):** `require()` only — no ES `import`
```js
// 1. External npm packages
const async = require('async')
const _ = require('lodash')
// 2. Internal modules
const winston = require('../logger')
const ticketSchema = require('../models/ticket')
const permissions = require('../permissions')
```
Some `require()` calls are intentionally deferred inside function bodies to avoid circular dependency issues.

**Client-side (React/JSX):** ES `import` only — no `require()`
```js
// 1. Third-party (React, Redux, MobX, lodash)
import React from 'react'
import { connect } from 'react-redux'
// 2. Internal utilities / logger
import Log from '../../logger'
// 3. Redux actions
import { fetchTickets } from 'actions/tickets'
// 4. Components (webpack-aliased, no relative paths needed)
import PageTitle from 'components/PageTitle'
import Table from 'components/Table'
```

### Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Variables & functions | `camelCase` | `postData`, `handleError`, `getTicketByUid` |
| Constants | `UPPER_SNAKE_CASE` | `const COLLECTION = 'tickets'` |
| Server controller files | `camelCase.js` | `tickets.js`, `backuprestore.js` |
| Model files | `camelCase.js` | `ticket.js`, `ticketStatus.js` |
| React container files | `PascalCase.jsx` | `TicketsContainer.jsx` |
| React component dirs | `PascalCase/index.jsx` | `components/PageTitle/index.jsx` |
| React modal files | `VerbNounModal.jsx` | `CreateTicketModal.jsx` |
| Mongoose schema vars | `entitySchema` | `ticketSchema`, `userSchema` |

### Controller Pattern (server-side)
Controllers are **plain objects**, not classes:
```js
const ticketsController = {}

ticketsController.getActive = function (req, res) {
  // ...
}

module.exports = ticketsController
```

### Model Pattern (Mongoose)
```js
const COLLECTION = 'tickets'           // UPPER_SNAKE_CASE collection name

/**
 * @class Ticket
 */
const ticketSchema = mongoose.Schema({ ... })

ticketSchema.pre('save', function (next) { ... })
ticketSchema.virtual('...')
ticketSchema.methods.setStatus = function (...) { ... }  // const self = this at top
ticketSchema.statics.getTicketById = function (...) { ... }

module.exports = mongoose.model(COLLECTION, ticketSchema)
```

---

## Async Patterns

Three patterns coexist — match the surrounding code when editing existing files; use `async/await` for new code.

### 1. Callback + `async` library (legacy — most controllers and models)
```js
async.waterfall([
  function (next) { User.findById(id, next) },
  function (user, next) { processUser(user, next) }
], function (err, result) {
  if (err) return handleError(res, err)
  res.json(result)
})

async.parallel([taskA, taskB], function (err, results) { ... })
async.each(items, function (item, cb) { ... }, done)
```

### 2. Dual callback + Promise (transitional — model statics/methods)
```js
ticketSchema.statics.getTickets = function (query, callback) {
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        const results = await Model.find(query).exec()
        if (typeof callback === 'function') return callback(null, results)
        return resolve(results)
      } catch (e) {
        if (typeof callback === 'function') return callback(e)
        return reject(e)
      }
    })()
  })
}
```

### 3. Pure `async/await` (new code — v2 API controllers)
```js
apiName.create = async (req, res) => {
  try {
    const item = await Model.create(req.body)
    return res.json(item)
  } catch (error) {
    return apiUtil.sendApiError(res, 500, error.message)
  }
}
```

---

## Error Handling

### Page controllers — local `handleError` helper
```js
function handleError (res, err) {
  if (err) {
    winston.warn(err)
    res.status = err.status || 500
    return res.render('error', { layout: false, error: err, message: err.message })
  }
}

// Usage — always early-return:
getTicketByUid(uid, function (err, ticket) {
  if (err) return handleError(res, err)
  // ...
})
```

### API v1 controllers — `apiUtil` helpers
```js
const apiUtil = require('../apiUtils')

if (!req.user) return apiUtil.sendApiError(res, 500, 'Invalid User')
if (!req.body) return apiUtil.sendApiError_InvalidPostData(res)
```

### API v2 controllers — `try/catch` + `apiUtil`
```js
try {
  // await calls
} catch (error) {
  return apiUtil.sendApiError(res, 500, error.message)
}
```

### Model error strings — include class and method name
```js
if (_.isUndefined(uid)) return callback('Invalid Uid - TicketSchema.GetTicketByUid()', null)
```

---

## React / Frontend Conventions

- **Class-based components** with MobX `@observer` decorator — **do not use hooks** (existing codebase predates hooks adoption)
- **Redux + Redux-Saga** for global state and async side effects
- **MobX** used for local observable state in some containers
- Component `propTypes` are required on every component
- Webpack aliases allow non-relative imports: `import Foo from 'components/Foo'`
- Client module exports use ES default exports; server uses `module.exports`

---

## Commit Convention

Commits are enforced by **commitlint** with `@commitlint/config-conventional`:
```
feat: add ticket bulk-assign endpoint
fix: correct overdue ticket query
refactor: migrate accounts controller to async/await
docs: update API v2 endpoint reference
```

# Optimization Philosophy

**Type:** Guide  
**Status:** Active  
**Last Updated:** 2025-11-22  
**Purpose:** Code minimalism, future-proofing, and performance principles

---

## Core Principles

**Every decision should prioritize efficiency and scalability:**

- **Minimize Everything** - Every line of code must justify its existence
- **Think Scale First** - Design for 10x growth from day one
- **Performance is a Feature** - Not an afterthought
- **Simplicity Over Cleverness** - Simple code is easier to optimize

---

## Code Minimalism

**Less code = fewer bugs, faster execution, easier maintenance**

```typescript
// ❌ Over-engineered
class UserDataTransformerFactory {
  private static instance: UserDataTransformerFactory;
  // ... 50 lines of abstraction
}

// ✅ Minimal and efficient
function transformUserData(user: User): TransformedUser {
  return { id: user.id, name: user.name };
}
```

**Guidelines:**
- No premature abstractions - wait for 3+ use cases
- Delete dead code immediately
- Prefer functions over classes when state isn't needed
- Use native JS/TS over libraries when possible

---

## Future-Proofing Strategies

**Build for tomorrow's scale today:**

1. **Database** - Index from day one, use pagination everywhere
2. **API** - Rate limit all endpoints, cursor-based pagination
3. **Frontend** - Lazy load, virtual scrolling, minimize bundle
4. **Resources** - Batch operations, cache aggressively

---

## Performance Guidelines

**Avoid O(n²) - aim for O(n) or O(n log n):**

```typescript
// ❌ O(n²) - Nested loops
for (const item of items) {
  for (const other of items) {
    if (item.id === other.parentId) { /* ... */ }
  }
}

// ✅ O(n) - Use Map/Set
const itemMap = new Map(items.map(i => [i.id, i]));
for (const item of items) {
  const parent = itemMap.get(item.parentId); // O(1)
}
```

**Async and Parallel:**
```typescript
// ❌ Sequential
const a = await fetchA();
const b = await fetchB();

// ✅ Parallel
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

---

## Resource Efficiency

```typescript
// ❌ Wasteful
const users = await db.select('*').from('users');
const filtered = users.filter(u => u.active);

// ✅ Efficient
const users = await db
  .select(['id', 'name', 'email'])
  .from('users')
  .where('active', true);
```

**Optimization Checklist:**
- [ ] Batch database operations
- [ ] Use connection pooling
- [ ] Implement request deduplication
- [ ] Cache computed values
- [ ] Stream large datasets
- [ ] Use background jobs

---

## Decision Framework

Before writing any code, ask:

1. **Is this necessary?** - Can we achieve the goal without it?
2. **Is there a simpler way?** - What's the minimal solution?
3. **Will this scale?** - What happens at 10x load?
4. **What's the performance impact?** - CPU, memory, network?
5. **Can this be async/deferred?** - Does the user need to wait?
6. **Is there a native solution?** - Before adding dependencies?
7. **Can we reuse existing code?** - Before creating new abstractions?

---

## Anti-Patterns

- **Gold plating** - Adding features "just in case"
- **Dependency bloat** - Package for every small utility
- **Synchronous everything** - Not utilizing async
- **Unbounded operations** - Queries/loops without limits
- **Memory leaks** - Not cleaning up listeners
- **Premature optimization** - Optimizing without profiling
- **But also** - Ignoring obvious inefficiencies

---

**Remember:** The best code is no code. The second best is minimal, efficient code that does exactly what's needed and nothing more.

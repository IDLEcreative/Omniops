**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Performance Tests Directory

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 1 minutes


**Purpose:** Performance benchmarking and load testing for critical application components.

**Test Type:** Performance | Load Testing

**Last Updated:** 2025-10-30

**Coverage:** Response time benchmarks, throughput testing, memory profiling, and scalability validation.

## Overview

Performance tests validate that the application meets speed and efficiency requirements under various load conditions.

## Running Tests

```bash
# Run performance tests
npm test -- __tests__/performance/

# Run with performance profiling
node --prof npm test -- __tests__/performance/
```

## Key Test Areas

- API response time benchmarks
- Database query performance
- Embedding generation speed
- Memory usage patterns
- Concurrent request handling

## Related Documentation

- [Main Tests README](/Users/jamesguy/Omniops/__tests__/README.md)
- [Performance Optimization Guide](/Users/jamesguy/Omniops/docs/07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)

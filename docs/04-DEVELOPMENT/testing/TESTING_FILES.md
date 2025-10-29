# Root Test Files Documentation

This document describes the test files located in the project root directory and their purposes.

## Overview

The project root contains two JavaScript test files that serve as validation and demonstration scripts for the queue system functionality. These are standalone test files that can be run independently to verify system components.

## Test Files

### `test-queue-import.js`

**Purpose**: Basic smoke test to verify queue system file structure and imports

**Type**: Smoke Test / Validation Script

**Description**: 
This script provides a simple verification that all queue system files have been created correctly and can be imported without errors. It's primarily used as a post-installation verification tool.

**Features**:
- ✅ Validates queue system file structure
- ✅ Lists all created queue management files
- ✅ Documents available API endpoints
- ✅ Shows supported job types and features
- ✅ Provides usage examples and next steps

**Usage**:
```bash
node test-queue-import.js
```

**When to Run**:
- After initial queue system setup
- During deployment verification
- When troubleshooting import issues
- As part of system health checks

**Expected Output**:
- List of successfully created queue files
- Available API endpoints
- Feature summary
- Usage instructions

**Dependencies**:
- None (standalone script)
- Does not require Redis or external services

---

### `test-queue-system.js`

**Purpose**: Comprehensive functional test and demonstration of the complete queue management system

**Type**: Integration Test / Demo Script

**Description**:
This is a comprehensive test script that demonstrates and validates all queue system functionality. It creates various types of jobs, tests priorities, deduplication, scheduling, and monitoring features.

**Features Tested**:
- ✅ **Job Creation**: Single page, full crawl, and refresh jobs
- ✅ **Priority Handling**: High priority for new customers
- ✅ **Deduplication**: Prevents duplicate job creation
- ✅ **Batch Operations**: Multiple jobs with staggered delays
- ✅ **Scheduled Jobs**: Delayed job execution
- ✅ **Recurring Jobs**: Cron-based recurring tasks
- ✅ **Queue Monitoring**: Statistics and health checks
- ✅ **Customer Filtering**: Jobs filtered by customer ID
- ✅ **Performance Metrics**: Processing statistics
- ✅ **Maintenance Operations**: Queue cleanup and management

**Usage**:
```bash
node test-queue-system.js
```

**Prerequisites**:
- Redis server must be running
- Queue system components must be properly configured
- Environment variables should be set

**Test Scenarios**:

1. **Single Page Jobs with Priorities**:
   - Creates jobs for different customers
   - Tests new customer priority handling
   - Validates job metadata

2. **Deduplication Testing**:
   - Creates duplicate jobs
   - Verifies deduplication logic
   - Checks deduplication statistics

3. **Full Crawl Jobs**:
   - Tests website crawling configuration
   - Validates depth and page limits
   - Checks subdomain handling

4. **Refresh Jobs**:
   - Tests content refresh functionality
   - Validates force refresh options
   - Checks selective refresh settings

5. **Batch Job Creation**:
   - Creates multiple jobs simultaneously
   - Tests staggered execution delays
   - Validates batch processing

6. **Scheduled Jobs**:
   - Creates jobs scheduled for future execution
   - Tests delay mechanisms
   - Validates scheduling accuracy

7. **Recurring Jobs**:
   - Creates cron-based recurring tasks
   - Tests recurring patterns
   - Validates job repetition

8. **Queue Monitoring**:
   - Tests queue statistics retrieval
   - Validates health check functionality
   - Checks performance metrics

9. **Customer-Based Operations**:
   - Filters jobs by customer ID
   - Tests customer-specific statistics
   - Validates customer isolation

10. **Maintenance Operations**:
    - Tests queue cleanup procedures
    - Validates maintenance task execution
    - Checks system optimization

**Expected Output**:
```
🚀 Starting Queue Management System Test...

✅ Queue Manager and Processor initialized

📝 Test 1: Creating single page jobs with priorities...
  - Created job abc123 for https://example.com/page1 (deduplicated: false)
  - Created job def456 for https://example.com/page2 (deduplicated: false)
  - Created job ghi789 for https://example.com/page3 (deduplicated: false)

🔄 Test 2: Testing deduplication...
  - Duplicate job result: Deduplicated ✅

[... additional test output ...]

✅ All tests completed successfully!
```

**API Examples**:
The script also demonstrates API usage patterns:
- Creating different job types via POST requests
- Retrieving job status via GET requests
- Managing queue operations
- Performing maintenance tasks

**Error Handling**:
The script includes comprehensive error handling and will report:
- Connection failures to Redis
- Import/require errors
- Job creation failures
- Queue operation errors

## Integration with Main Test Suite

### Relationship to Jest Tests

These root-level test files complement the Jest-based test suite:

- **Root test files**: End-to-end functionality validation
- **Jest tests**: Unit and integration testing with mocking

### When to Use Each

**Use `test-queue-import.js` when**:
- Validating deployment
- Quick system health check
- Troubleshooting import issues
- Documenting available features

**Use `test-queue-system.js` when**:
- Full functionality testing
- Demonstrating system capabilities
- Validating queue operations
- Performance testing
- Integration testing with live services

**Use Jest tests when**:
- Unit testing individual functions
- Testing with mocked dependencies
- Automated CI/CD testing
- Code coverage requirements

## Running in Different Environments

### Local Development
```bash
# Start Redis first
npm run redis:start

# Run the tests
node test-queue-import.js
node test-queue-system.js
```

### Docker Environment
```bash
# Start services
npm run docker:up:detached

# Run tests
docker-compose -f docker-compose.dev.yml exec app node test-queue-import.js
docker-compose -f docker-compose.dev.yml exec app node test-queue-system.js
```

### CI/CD Pipeline
```bash
# These can be incorporated into CI pipeline as smoke tests
npm run redis:start &
sleep 5  # Wait for Redis to start
node test-queue-import.js
node test-queue-system.js
```

## Troubleshooting

### Common Issues

#### Redis Connection Error
```
Error: Redis connection failed
```
**Solution**:
```bash
npm run redis:start
```

#### Import/Module Errors
```
Error: Cannot find module './lib/queue/queue-manager.ts'
```
**Solution**:
- Ensure all queue system files are created
- Check file paths and TypeScript compilation
- Verify project build status

#### Job Creation Failures
```
Error: Failed to create job
```
**Solution**:
- Check Redis connectivity
- Verify queue manager initialization
- Review job parameters and validation

### Debugging Tips

1. **Enable Verbose Output**:
   - Add console.log statements
   - Use Redis monitoring: `npm run redis:monitor`

2. **Check Prerequisites**:
   - Verify Redis is running
   - Ensure environment variables are set
   - Check file permissions

3. **Incremental Testing**:
   - Run `test-queue-import.js` first
   - Only run `test-queue-system.js` if imports succeed
   - Test individual components separately

## Extending the Test Files

### Adding New Test Scenarios

To add new test scenarios to `test-queue-system.js`:

1. **Follow the existing pattern**:
   ```javascript
   // Test N: Description
   console.log('\n📋 Test N: Description...');
   
   try {
     // Test implementation
     console.log('  - Test result: Success ✅');
   } catch (error) {
     console.log('  - Test result: Failed ❌', error.message);
   }
   ```

2. **Add to summary**:
   ```javascript
   console.log('   - ✅ New test scenario');
   ```

3. **Include in API examples** if relevant

### Creating New Test Files

For new standalone test files:

1. **Follow naming convention**: `test-[component]-[purpose].js`
2. **Include comprehensive documentation**
3. **Add error handling and clear output**
4. **Document in this file**

## Best Practices

### Test File Organization

1. **Clear structure**: Arrange, Act, Assert pattern
2. **Descriptive output**: Clear success/failure indicators
3. **Error handling**: Graceful failure with helpful messages
4. **Documentation**: Self-documenting code with comments

### Maintenance

1. **Keep tests current**: Update when queue system changes
2. **Verify functionality**: Regular execution as part of development
3. **Performance monitoring**: Track test execution time
4. **Dependencies**: Minimize external dependencies

### Security

1. **No sensitive data**: Avoid real credentials or data
2. **Safe operations**: Use test data and safe operations
3. **Environment isolation**: Use test-specific configurations
4. **Clean up**: Remove test data after execution

## Future Enhancements

### Potential Improvements

1. **Configuration-driven tests**: Externalize test parameters
2. **Performance benchmarking**: Add timing and performance metrics
3. **Automated assertions**: Convert manual verification to automated checks
4. **Test data management**: Structured test data generation
5. **Parallel execution**: Run tests concurrently for speed
6. **Integration with CI**: Automated execution in deployment pipeline

### Migration to Formal Test Framework

Consider migrating these tests to Jest for:
- Better assertion libraries
- Automatic test discovery
- Coverage reporting
- Integration with development workflow
- Mocking capabilities

## Summary

These root-level test files serve as important validation and demonstration tools for the queue system. They complement the formal Jest test suite by providing:

- **End-to-end validation** of complete system functionality
- **Documentation** through executable examples
- **Debugging tools** for development and troubleshooting
- **Integration testing** with live services

Regular execution of these tests helps ensure system reliability and provides confidence in queue system operations.
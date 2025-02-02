# Test Collection Documentation

## Overview
This test collection covers all critical functionality of the trading platform, including:
- Authentication & Authorization
- MetaTrader Account Integration
- Trading Journal Features
- Community Features
- Economic Calendar

## Prerequisites
- Postman or compatible API testing tool
- Valid Supabase credentials
- Valid MetaAPI token
- Test trading account credentials

## Setup Instructions
1. Import the collection JSON file into Postman
2. Import the environment JSON file
3. Update environment variables with your credentials
4. Run the authentication requests first to get valid tokens

## Test Categories

### 1. Authentication Tests
- Sign up flow
- Sign in flow
- Token validation
- Error handling

### 2. MetaTrader Integration Tests
- Account connection
- Server validation
- Risk settings management
- Error scenarios

### 3. Trading Journal Tests
- Trade recording
- Note management
- Statistics calculation
- Data validation

### 4. Community Tests
- Post creation/editing
- Interaction features
- Content moderation
- Real-time updates

### 5. Economic Calendar Tests
- Event retrieval
- Filtering
- Data formatting
- Update frequency

## Running Tests
1. Start with authentication tests
2. Run integration tests sequentially
3. Verify response codes and data
4. Check test scripts for assertions

## Environment Variables
Required variables:
- BASE_URL
- SUPABASE_ANON_KEY
- META_API_TOKEN

## Test Data
The collection includes sample test data for:
- User accounts
- Trading accounts
- Community posts
- Calendar events

## Error Handling
Tests cover various error scenarios:
- Invalid credentials
- Network failures
- Rate limiting
- Data validation

## Maintenance
- Update test data regularly
- Verify API endpoints
- Check for deprecated features
- Update assertions as needed
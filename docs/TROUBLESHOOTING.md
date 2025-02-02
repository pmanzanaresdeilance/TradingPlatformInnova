# Broker Selection Modal Troubleshooting Guide

## Current Implementation

The broker selection modal is implemented using the following components:

- `MTConnectionWizard`: Main modal component for connecting MT accounts
- `MTBrokerSearch`: Component for searching and selecting brokers
- `MTServerSelector`: Component for selecting broker servers

## Framework & Libraries

- React 18.3.1
- TypeScript 5.5.3
- Tailwind CSS for styling
- Lucide React for icons
- MetaAPI SDK (metaapi.cloud-sdk) for broker integration

## Common Issues & Solutions

### 1. Broker Search Not Working

**Symptoms:**
- Search input doesn't show results
- No error messages displayed
- Console shows network errors

**Potential Causes:**
- MetaAPI token not configured
- Network connectivity issues
- Rate limiting from the API

**Solutions:**

1. Verify MetaAPI token:
```typescript
// Check .env file
VITE_META_API_TOKEN=your_token_here

// Verify token is loaded in MTBrokerSearch
const client = MetaApiClient.getInstance(import.meta.env.VITE_META_API_TOKEN);
```

2. Add error handling in search function:
```typescript
const searchBrokers = async (query: string) => {
  try {
    setLoading(true);
    setError(null);
    
    const servers = await ServerDiscovery.getBrokerServers(
      query.toLowerCase(),
      platform,
      region
    );

    setResults(servers);
  } catch (err) {
    setError('Failed to fetch brokers. Please try again.');
    console.error('Broker search failed:', err);
  } finally {
    setLoading(false);
  }
};
```

### 2. Server Selection Not Updating

**Symptoms:**
- Server dropdown doesn't update when broker is selected
- Selected server not being saved

**Solutions:**

1. Verify state updates:
```typescript
const handleSelectServer = (broker: BrokerInfo, server: string) => {
  // Log state changes
  console.log('Selected broker:', broker);
  console.log('Selected server:', server);
  
  // Update parent component
  onSelect(broker, server);
  
  // Close dropdown
  setShowDropdown(false);
};
```

2. Add validation before selection:
```typescript
if (!broker?.name || !server) {
  logger.warn('Invalid broker or server selection', { broker, server });
  return;
}
```

### 3. Modal Not Closing

**Symptoms:**
- Modal stays open after successful connection
- Background overlay remains

**Solutions:**

1. Verify cleanup in useEffect:
```typescript
useEffect(() => {
  return () => {
    // Clean up any subscriptions
    setShowDropdown(false);
    setResults([]);
    setError(null);
  };
}, []);
```

2. Add proper modal close handling:
```typescript
const handleClose = () => {
  // Clean up state
  setFormData({
    brokerName: '',
    accountNumber: '',
    server: '',
    platform: 'mt5',
    password: ''
  });
  
  // Close modal
  onClose();
};
```

### 4. Form Validation Issues

**Symptoms:**
- Form submits with invalid data
- No validation feedback
- Console errors about missing fields

**Solutions:**

1. Add form validation:
```typescript
const validateForm = () => {
  const errors: string[] = [];
  
  if (!formData.accountNumber) {
    errors.push('Account number is required');
  }
  
  if (!formData.server) {
    errors.push('Server is required');
  }
  
  if (!formData.password) {
    errors.push('Password is required');
  }
  
  return errors;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const validationErrors = validateForm();
  if (validationErrors.length > 0) {
    setError(validationErrors.join('\n'));
    return;
  }
  
  // Continue with form submission...
};
```

### 5. Performance Issues

**Symptoms:**
- Slow broker search
- Laggy dropdown
- UI freezes

**Solutions:**

1. Add debouncing to search:
```typescript
const debouncedSearch = useCallback(
  debounce((query: string) => {
    searchBrokers(query);
  }, 300),
  []
);
```

2. Optimize rendering with memo:
```typescript
export const MTBrokerSearch = React.memo(function MTBrokerSearch({
  platform,
  onSelect,
  selectedBroker,
  selectedServer,
  region
}: MTBrokerSearchProps) {
  // Component code...
});
```

## Testing Steps

1. Clear browser cache and local storage
2. Verify environment variables are set correctly
3. Check browser console for errors
4. Test broker search with different queries
5. Verify server selection updates correctly
6. Test form submission with valid/invalid data
7. Verify modal closes properly after success
8. Check network requests in browser dev tools

## Additional Resources

- [MetaAPI Documentation](https://metaapi.cloud/docs/client/)
- [React Modal Best Practices](https://react.dev/reference/react-dom/createPortal)
- [TypeScript Form Validation](https://www.typescriptlang.org/docs/handbook/2/classes.html)
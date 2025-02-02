# LINQ Usage Guide with Supabase

## Overview
This guide demonstrates how to effectively use LINQ expressions with Supabase in C#, focusing on best practices and common patterns.

## Query Examples

### Basic Query Structure
```csharp
// Example 1: Select specific columns with filtering and ordering
var movies = await _repository.QueryAsync(
    selects: new Expression<Func<Movie, object>>[] {
        x => x.Id,
        x => x.Name,
        x => x.Tags,
        x => x.ReleaseDate
    },
    where: x => x.Tags.Contains("Action") || x.Tags.Contains("Adventure"),
    orderBy: x => x.ReleaseDate,
    ascending: false
);

// Example 2: Complex filtering with multiple conditions
var recentMovies = await _repository.QueryAsync(
    where: x => x.ReleaseDate >= DateTime.UtcNow.AddDays(-30) &&
                x.Rating >= 4.0m,
    orderBy: x => x.ReleaseDate
);
```

## Best Practices

### 1. Column Selection
- Always specify required columns explicitly
- Avoid selecting unnecessary data
- Use projection when needed

```csharp
// Good: Select specific columns
var result = await QueryAsync(
    selects: new[] { 
        x => x.Id, 
        x => x.Title 
    }
);

// Bad: Select all columns
var result = await QueryAsync();
```

### 2. Filtering
- Use type-safe expressions
- Combine conditions logically
- Handle null values appropriately

```csharp
// Good: Type-safe filtering
var result = await QueryAsync(
    where: x => x.Status == "active" && x.Rating > 4.0m
);

// Better: Handle nulls
var result = await QueryAsync(
    where: x => x.Status == "active" && 
               (x.Rating ?? 0) > 4.0m
);
```

### 3. Ordering
- Always specify order for predictable results
- Consider performance impact
- Use composite ordering when needed

```csharp
// Single ordering
var result = await QueryAsync(
    orderBy: x => x.CreatedAt
);

// Composite ordering (implemented in repository)
var result = await _repository.QueryAsync(
    orderBy: new[] {
        (x => x.Priority, true),
        (x => x.CreatedAt, false)
    }
);
```

### 4. DateTime Handling
- Always use UTC for timestamps
- Consider time zones in queries
- Use appropriate date comparisons

```csharp
// Good: Use UTC timestamps
var result = await QueryAsync(
    where: x => x.CreatedAt >= DateTime.UtcNow.AddDays(-7)
);

// Bad: Use local time
var result = await QueryAsync(
    where: x => x.CreatedAt >= DateTime.Now.AddDays(-7)
);
```

## Performance Considerations

1. **Selective Column Loading**
   - Only select needed columns
   - Use projections for complex objects
   - Consider lazy loading for related data

2. **Efficient Filtering**
   - Use indexed columns in where clauses
   - Avoid complex computations in filters
   - Consider pagination for large datasets

3. **Query Optimization**
   - Use appropriate operators
   - Leverage database indexes
   - Monitor query performance

## Common Patterns

### 1. Pagination
```csharp
public async Task<PaginatedResult<T>> GetPaginatedAsync(
    Expression<Func<T, bool>> filter = null,
    int page = 1,
    int pageSize = 10)
{
    var query = _client.From<T>(_tableName);
    
    if (filter != null)
        query = ApplyWhereClause(query, filter);
        
    var count = await query.Count(Constants.CountType.Exact);
    var items = await query
        .Range((page - 1) * pageSize, (page * pageSize) - 1)
        .Get();
        
    return new PaginatedResult<T>
    {
        Items = items.Models,
        TotalCount = count.Count,
        Page = page,
        PageSize = pageSize
    };
}
```

### 2. Complex Filtering
```csharp
public async Task<IEnumerable<T>> GetWithComplexFilter<TProperty>(
    Expression<Func<T, TProperty>> property,
    TProperty[] values)
{
    var query = _client.From<T>(_tableName);
    var propertyName = GetPropertyName(property.Body);
    
    return (await query
        .Filter(propertyName, Constants.Operator.In, values)
        .Get())
        .Models;
}
```

### 3. Relationship Handling
```csharp
public async Task<IEnumerable<T>> GetWithRelated<TRelated>(
    Expression<Func<T, TRelated>> related)
{
    var query = _client.From<T>(_tableName);
    var propertyName = GetPropertyName(related.Body);
    
    return (await query
        .Select($"*, {propertyName}(*)")
        .Get())
        .Models;
}
```

## Error Handling

```csharp
try
{
    var result = await QueryAsync(
        where: x => x.Status == "active",
        orderBy: x => x.CreatedAt
    );
}
catch (PostgrestException ex)
{
    // Handle Postgrest-specific errors
    Log.Error(ex, "Database query failed");
    throw;
}
catch (Exception ex)
{
    // Handle general errors
    Log.Error(ex, "Unexpected error during query");
    throw;
}
```

## Tips and Tricks

1. **Use Expression Trees for Dynamic Queries**
```csharp
public static Expression<Func<T, bool>> BuildFilterExpression<T>(
    string propertyName,
    object value)
{
    var parameter = Expression.Parameter(typeof(T), "x");
    var property = Expression.Property(parameter, propertyName);
    var constant = Expression.Constant(value);
    var equals = Expression.Equal(property, constant);
    return Expression.Lambda<Func<T, bool>>(equals, parameter);
}
```

2. **Combine Multiple Filters**
```csharp
public static Expression<Func<T, bool>> And<T>(
    this Expression<Func<T, bool>> first,
    Expression<Func<T, bool>> second)
{
    var parameter = first.Parameters[0];
    var body = Expression.AndAlso(first.Body, second.Body);
    return Expression.Lambda<Func<T, bool>>(body, parameter);
}
```

3. **Handle Null Values**
```csharp
public static Expression<Func<T, bool>> SafeEquals<T, TProperty>(
    Expression<Func<T, TProperty>> property,
    TProperty value)
{
    var parameter = Expression.Parameter(typeof(T), "x");
    var propertyAccess = Expression.Invoke(property, parameter);
    var constant = Expression.Constant(value, typeof(TProperty));
    var equals = Expression.Equal(propertyAccess, constant);
    var nullCheck = Expression.NotEqual(propertyAccess, Expression.Constant(null, typeof(TProperty)));
    var body = Expression.AndAlso(nullCheck, equals);
    return Expression.Lambda<Func<T, bool>>(body, parameter);
}
```
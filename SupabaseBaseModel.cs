using Supabase;
using Supabase.Postgrest;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;

namespace TradingPlatform.Models
{
    /// <summary>
    /// Base class for all Supabase models providing common CRUD operations
    /// </summary>
    /// <typeparam name="T">The model type that inherits from this class</typeparam>
    public abstract class SupabaseModel<T> where T : class
    {
        protected readonly Supabase.Client _supabase;
        protected readonly string _tableName;

        /// <summary>
        /// Initializes a new instance of the SupabaseModel class
        /// </summary>
        /// <param name="supabase">The Supabase client instance</param>
        /// <param name="tableName">The name of the database table</param>
        protected SupabaseModel(Supabase.Client supabase, string tableName)
        {
            _supabase = supabase ?? throw new ArgumentNullException(nameof(supabase));
            _tableName = tableName ?? throw new ArgumentNullException(nameof(tableName));
        }

        /// <summary>
        /// Creates a new record in the database
        /// </summary>
        /// <param name="model">The model to create</param>
        /// <returns>The created model with its ID</returns>
        public virtual async Task<T> CreateAsync(T model)
        {
            try
            {
                var response = await _supabase
                    .From<T>(_tableName)
                    .Insert(model);

                return response.Models.FirstOrDefault();
            }
            catch (Exception ex)
            {
                throw new SupabaseException($"Error creating {typeof(T).Name}: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Retrieves a record by its ID
        /// </summary>
        /// <param name="id">The ID of the record to retrieve</param>
        /// <returns>The found model or null</returns>
        public virtual async Task<T> GetByIdAsync(Guid id)
        {
            try
            {
                var response = await _supabase
                    .From<T>(_tableName)
                    .Filter("id", Constants.Operator.Equals, id)
                    .Get();

                return response.Models.FirstOrDefault();
            }
            catch (Exception ex)
            {
                throw new SupabaseException($"Error retrieving {typeof(T).Name} with ID {id}: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Updates an existing record
        /// </summary>
        /// <param name="id">The ID of the record to update</param>
        /// <param name="model">The model with updated values</param>
        /// <returns>The updated model</returns>
        public virtual async Task<T> UpdateAsync(Guid id, T model)
        {
            try
            {
                var response = await _supabase
                    .From<T>(_tableName)
                    .Filter("id", Constants.Operator.Equals, id)
                    .Update(model);

                return response.Models.FirstOrDefault();
            }
            catch (Exception ex)
            {
                throw new SupabaseException($"Error updating {typeof(T).Name} with ID {id}: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Deletes a record from the database
        /// </summary>
        /// <param name="id">The ID of the record to delete</param>
        public virtual async Task DeleteAsync(Guid id)
        {
            try
            {
                await _supabase
                    .From<T>(_tableName)
                    .Filter("id", Constants.Operator.Equals, id)
                    .Delete();
            }
            catch (Exception ex)
            {
                throw new SupabaseException($"Error deleting {typeof(T).Name} with ID {id}: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Retrieves all records with pagination
        /// </summary>
        /// <param name="page">The page number (1-based)</param>
        /// <param name="pageSize">The number of records per page</param>
        /// <returns>A paginated list of records</returns>
        public virtual async Task<PaginatedResult<T>> GetPaginatedAsync(int page = 1, int pageSize = 10)
        {
            try
            {
                var response = await _supabase
                    .From<T>(_tableName)
                    .Range((page - 1) * pageSize, (page * pageSize) - 1)
                    .Get();

                var totalCount = await GetTotalCountAsync();

                return new PaginatedResult<T>
                {
                    Items = response.Models,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                };
            }
            catch (Exception ex)
            {
                throw new SupabaseException($"Error retrieving paginated {typeof(T).Name}s: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Retrieves records with filtering and sorting
        /// </summary>
        /// <param name="filters">Dictionary of field names and values to filter by</param>
        /// <param name="orderBy">The field to sort by</param>
        /// <param name="ascending">Whether to sort in ascending order</param>
        /// <returns>A filtered and sorted list of records</returns>
        public virtual async Task<IEnumerable<T>> GetFilteredAsync(
            Dictionary<string, object> filters,
            string orderBy = null,
            bool ascending = true)
        {
            try
            {
                var query = _supabase.From<T>(_tableName);

                // Apply filters
                foreach (var filter in filters)
                {
                    query = query.Filter(filter.Key, Constants.Operator.Equals, filter.Value);
                }

                // Apply ordering
                if (!string.IsNullOrEmpty(orderBy))
                {
                    query = ascending
                        ? query.Order(orderBy, Constants.Ordering.Ascending)
                        : query.Order(orderBy, Constants.Ordering.Descending);
                }

                var response = await query.Get();
                return response.Models;
            }
            catch (Exception ex)
            {
                throw new SupabaseException($"Error retrieving filtered {typeof(T).Name}s: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets the total count of records in the table
        /// </summary>
        protected virtual async Task<int> GetTotalCountAsync()
        {
            try
            {
                var response = await _supabase
                    .From<T>(_tableName)
                    .Count(Constants.CountType.Exact);

                return response.Count;
            }
            catch (Exception ex)
            {
                throw new SupabaseException($"Error getting total count of {typeof(T).Name}s: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Validates a model before saving
        /// </summary>
        /// <param name="model">The model to validate</param>
        /// <returns>A list of validation errors, empty if valid</returns>
        protected virtual IEnumerable<string> Validate(T model)
        {
            var errors = new List<string>();

            if (model == null)
            {
                errors.Add($"{typeof(T).Name} cannot be null");
                return errors;
            }

            // Add common validation logic here
            // Derived classes should override this method to add specific validation

            return errors;
        }
    }

    /// <summary>
    /// Represents a paginated result set
    /// </summary>
    /// <typeparam name="T">The type of items in the result</typeparam>
    public class PaginatedResult<T>
    {
        public IEnumerable<T> Items { get; set; }
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage => Page < TotalPages;
        public bool HasPreviousPage => Page > 1;
    }

    /// <summary>
    /// Custom exception for Supabase operations
    /// </summary>
    public class SupabaseException : Exception
    {
        public SupabaseException(string message) : base(message) { }
        public SupabaseException(string message, Exception innerException) : base(message, innerException) { }
    }
}
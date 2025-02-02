using Supabase;
using Supabase.Postgrest.Attributes;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace TradingPlatform.Models
{
    /// <summary>
    /// Represents a MetaAPI trading account
    /// </summary>
    [Table("meta_api_accounts")]
    public class MetaApiAccount : SupabaseModel
    {
        [PrimaryKey("id")]
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("user_id")]
        public Guid UserId { get; set; }

        [JsonPropertyName("meta_api_account_id")]
        public string MetaApiAccountId { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("login")]
        public string Login { get; set; }

        [JsonPropertyName("server")]
        public string Server { get; set; }

        [JsonPropertyName("platform")]
        public string Platform { get; set; }

        [JsonPropertyName("state")]
        public string State { get; set; }

        [JsonPropertyName("connection_status")]
        public string ConnectionStatus { get; set; }

        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }

        [JsonPropertyName("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // Relaciones
        [JsonPropertyName("risk_settings")]
        public RiskSettings RiskSettings { get; set; }

        [JsonPropertyName("trades")]
        public List<Trade> Trades { get; set; }
    }

    /// <summary>
    /// Represents risk management settings for a trading account
    /// </summary>
    [Table("meta_api_risk_settings")]
    public class RiskSettings : SupabaseModel
    {
        [PrimaryKey("id")]
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("account_id")]
        public Guid AccountId { get; set; }

        [JsonPropertyName("max_drawdown")]
        public decimal MaxDrawdown { get; set; }

        [JsonPropertyName("max_exposure_per_pair")]
        public decimal MaxExposurePerPair { get; set; }

        [JsonPropertyName("min_equity")]
        public decimal MinEquity { get; set; }

        [JsonPropertyName("margin_call_level")]
        public decimal MarginCallLevel { get; set; }

        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }

        [JsonPropertyName("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // Relación
        [JsonPropertyName("account")]
        public MetaApiAccount Account { get; set; }
    }

    /// <summary>
    /// Represents a trading operation
    /// </summary>
    [Table("trades")]
    public class Trade : SupabaseModel
    {
        [PrimaryKey("id")]
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("account_id")]
        public Guid AccountId { get; set; }

        [JsonPropertyName("ticket_number")]
        public long TicketNumber { get; set; }

        [JsonPropertyName("symbol")]
        public string Symbol { get; set; }

        [JsonPropertyName("order_type")]
        public string OrderType { get; set; }

        [JsonPropertyName("lot_size")]
        public decimal LotSize { get; set; }

        [JsonPropertyName("entry_price")]
        public decimal EntryPrice { get; set; }

        [JsonPropertyName("exit_price")]
        public decimal? ExitPrice { get; set; }

        [JsonPropertyName("stop_loss")]
        public decimal? StopLoss { get; set; }

        [JsonPropertyName("take_profit")]
        public decimal? TakeProfit { get; set; }

        [JsonPropertyName("profit_loss")]
        public decimal? ProfitLoss { get; set; }

        [JsonPropertyName("commission")]
        public decimal Commission { get; set; }

        [JsonPropertyName("swap")]
        public decimal Swap { get; set; }

        [JsonPropertyName("open_time")]
        public DateTime OpenTime { get; set; }

        [JsonPropertyName("close_time")]
        public DateTime? CloseTime { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; }

        // Relaciones
        [JsonPropertyName("metrics")]
        public TradeMetrics Metrics { get; set; }

        [JsonPropertyName("notes")]
        public List<TradeNote> Notes { get; set; }

        [JsonPropertyName("tags")]
        public List<TradeTag> Tags { get; set; }
    }

    /// <summary>
    /// Represents metrics calculated for a trade
    /// </summary>
    [Table("trade_metrics")]
    public class TradeMetrics : SupabaseModel
    {
        [PrimaryKey("id")]
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("trade_id")]
        public Guid TradeId { get; set; }

        [JsonPropertyName("risk_amount")]
        public decimal RiskAmount { get; set; }

        [JsonPropertyName("reward_amount")]
        public decimal RewardAmount { get; set; }

        [JsonPropertyName("risk_reward_ratio")]
        public decimal RiskRewardRatio { get; set; }

        [JsonPropertyName("win_loss")]
        public string WinLoss { get; set; }

        // Relación
        [JsonPropertyName("trade")]
        public Trade Trade { get; set; }
    }

    /// <summary>
    /// Represents a note attached to a trade
    /// </summary>
    [Table("trade_notes")]
    public class TradeNote : SupabaseModel
    {
        [PrimaryKey("id")]
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("trade_id")]
        public Guid TradeId { get; set; }

        [JsonPropertyName("user_id")]
        public Guid UserId { get; set; }

        [JsonPropertyName("note_type")]
        public string NoteType { get; set; }

        [JsonPropertyName("content")]
        public string Content { get; set; }

        [JsonPropertyName("screenshot_url")]
        public string ScreenshotUrl { get; set; }

        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }

        // Relaciones
        [JsonPropertyName("trade")]
        public Trade Trade { get; set; }

        [JsonPropertyName("user")]
        public User User { get; set; }
    }

    /// <summary>
    /// Represents a tag associated with a trade
    /// </summary>
    [Table("trade_tags")]
    public class TradeTag : SupabaseModel
    {
        [PrimaryKey("id")]
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("trade_id")]
        public Guid TradeId { get; set; }

        [JsonPropertyName("tag")]
        public string Tag { get; set; }

        // Relación
        [JsonPropertyName("trade")]
        public Trade Trade { get; set; }
    }

    /// <summary>
    /// Represents a community post
    /// </summary>
    [Table("community_posts")]
    public class CommunityPost : SupabaseModel
    {
        [PrimaryKey("id")]
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("user_id")]
        public Guid UserId { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("content")]
        public string Content { get; set; }

        [JsonPropertyName("category")]
        public string Category { get; set; }

        [JsonPropertyName("trading_pair")]
        public string TradingPair { get; set; }

        [JsonPropertyName("timeframe")]
        public string Timeframe { get; set; }

        [JsonPropertyName("image_url")]
        public string ImageUrl { get; set; }

        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }

        [JsonPropertyName("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // Relaciones
        [JsonPropertyName("user")]
        public User User { get; set; }

        [JsonPropertyName("comments")]
        public List<PostComment> Comments { get; set; }

        [JsonPropertyName("likes")]
        public List<PostLike> Likes { get; set; }

        [JsonPropertyName("tags")]
        public List<PostTag> Tags { get; set; }
    }

    /// <summary>
    /// Represents a comment on a community post
    /// </summary>
    [Table("post_comments")]
    public class PostComment : SupabaseModel
    {
        [PrimaryKey("id")]
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("post_id")]
        public Guid PostId { get; set; }

        [JsonPropertyName("user_id")]
        public Guid UserId { get; set; }

        [JsonPropertyName("content")]
        public string Content { get; set; }

        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }

        [JsonPropertyName("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // Relaciones
        [JsonPropertyName("post")]
        public CommunityPost Post { get; set; }

        [JsonPropertyName("user")]
        public User User { get; set; }
    }

    /// <summary>
    /// Represents a like on a community post
    /// </summary>
    [Table("post_likes")]
    public class PostLike : SupabaseModel
    {
        [PrimaryKey("id")]
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("post_id")]
        public Guid PostId { get; set; }

        [JsonPropertyName("user_id")]
        public Guid UserId { get; set; }

        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }

        // Relaciones
        [JsonPropertyName("post")]
        public CommunityPost Post { get; set; }

        [JsonPropertyName("user")]
        public User User { get; set; }
    }

    /// <summary>
    /// Represents a tag on a community post
    /// </summary>
    [Table("post_tags")]
    public class PostTag : SupabaseModel
    {
        [PrimaryKey("id")]
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("post_id")]
        public Guid PostId { get; set; }

        [JsonPropertyName("tag")]
        public string Tag { get; set; }

        // Relación
        [JsonPropertyName("post")]
        public CommunityPost Post { get; set; }
    }

    /// <summary>
    /// Represents a user in the system
    /// </summary>
    [Table("users", Schema = "auth")]
    public class User : SupabaseModel
    {
        [PrimaryKey("id")]
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("email")]
        public string Email { get; set; }

        [JsonPropertyName("raw_user_meta_data")]
        public string RawUserMetaData { get; set; }

        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }

        [JsonPropertyName("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // Relaciones
        [JsonPropertyName("meta_api_accounts")]
        public List<MetaApiAccount> MetaApiAccounts { get; set; }

        [JsonPropertyName("posts")]
        public List<CommunityPost> Posts { get; set; }

        [JsonPropertyName("comments")]
        public List<PostComment> Comments { get; set; }

        [JsonPropertyName("likes")]
        public List<PostLike> Likes { get; set; }

        [JsonPropertyName("trade_notes")]
        public List<TradeNote> TradeNotes { get; set; }
    }
}
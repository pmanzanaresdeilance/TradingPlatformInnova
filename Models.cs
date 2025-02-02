using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TradingPlatform.Models
{
    /// <summary>
    /// Represents a MetaAPI trading account
    /// </summary>
    [Table("meta_api_accounts")]
    public class MetaApiAccount
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        [ForeignKey("User")]
        public Guid UserId { get; set; }

        [Required]
        [Column("meta_api_account_id")]
        public string MetaApiAccountId { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; }

        [Required]
        [MaxLength(50)]
        public string Login { get; set; }

        [Required]
        [MaxLength(255)]
        public string Server { get; set; }

        [Required]
        [MaxLength(10)]
        public string Platform { get; set; }

        [Required]
        [MaxLength(50)]
        public string State { get; set; }

        [Required]
        [Column("connection_status")]
        [MaxLength(50)]
        public string ConnectionStatus { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public virtual User User { get; set; }
        public virtual RiskSettings RiskSettings { get; set; }
        public virtual ICollection<Trade> Trades { get; set; }
    }

    /// <summary>
    /// Represents risk management settings for a trading account
    /// </summary>
    [Table("meta_api_risk_settings")]
    public class RiskSettings
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        [ForeignKey("Account")]
        [Column("account_id")]
        public Guid AccountId { get; set; }

        [Required]
        [Column("max_drawdown")]
        public decimal MaxDrawdown { get; set; }

        [Required]
        [Column("max_exposure_per_pair")]
        public decimal MaxExposurePerPair { get; set; }

        [Required]
        [Column("min_equity")]
        public decimal MinEquity { get; set; }

        [Required]
        [Column("margin_call_level")]
        public decimal MarginCallLevel { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // Navigation property
        public virtual MetaApiAccount Account { get; set; }
    }

    /// <summary>
    /// Represents a trading operation
    /// </summary>
    [Table("trades")]
    public class Trade
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        [ForeignKey("Account")]
        [Column("account_id")]
        public Guid AccountId { get; set; }

        [Required]
        [Column("ticket_number")]
        public long TicketNumber { get; set; }

        [Required]
        [MaxLength(20)]
        public string Symbol { get; set; }

        [Required]
        [Column("order_type")]
        [MaxLength(10)]
        public string OrderType { get; set; }

        [Required]
        [Column("lot_size")]
        public decimal LotSize { get; set; }

        [Required]
        [Column("entry_price")]
        public decimal EntryPrice { get; set; }

        [Column("exit_price")]
        public decimal? ExitPrice { get; set; }

        [Column("stop_loss")]
        public decimal? StopLoss { get; set; }

        [Column("take_profit")]
        public decimal? TakeProfit { get; set; }

        [Column("profit_loss")]
        public decimal? ProfitLoss { get; set; }

        [Required]
        public decimal Commission { get; set; }

        [Required]
        public decimal Swap { get; set; }

        [Required]
        [Column("open_time")]
        public DateTime OpenTime { get; set; }

        [Column("close_time")]
        public DateTime? CloseTime { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; }

        // Navigation properties
        public virtual MetaApiAccount Account { get; set; }
        public virtual TradeMetrics Metrics { get; set; }
        public virtual ICollection<TradeNote> Notes { get; set; }
        public virtual ICollection<TradeTag> Tags { get; set; }
    }

    /// <summary>
    /// Represents metrics calculated for a trade
    /// </summary>
    [Table("trade_metrics")]
    public class TradeMetrics
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        [ForeignKey("Trade")]
        [Column("trade_id")]
        public Guid TradeId { get; set; }

        [Required]
        [Column("risk_amount")]
        public decimal RiskAmount { get; set; }

        [Required]
        [Column("reward_amount")]
        public decimal RewardAmount { get; set; }

        [Required]
        [Column("risk_reward_ratio")]
        public decimal RiskRewardRatio { get; set; }

        [Required]
        [Column("win_loss")]
        [MaxLength(10)]
        public string WinLoss { get; set; }

        // Navigation property
        public virtual Trade Trade { get; set; }
    }

    /// <summary>
    /// Represents a note attached to a trade
    /// </summary>
    [Table("trade_notes")]
    public class TradeNote
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        [ForeignKey("Trade")]
        [Column("trade_id")]
        public Guid TradeId { get; set; }

        [Required]
        [ForeignKey("User")]
        [Column("user_id")]
        public Guid UserId { get; set; }

        [Required]
        [Column("note_type")]
        [MaxLength(20)]
        public string NoteType { get; set; }

        [Required]
        public string Content { get; set; }

        [Column("screenshot_url")]
        public string ScreenshotUrl { get; set; }

        [Required]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public virtual Trade Trade { get; set; }
        public virtual User User { get; set; }
    }

    /// <summary>
    /// Represents a tag associated with a trade
    /// </summary>
    [Table("trade_tags")]
    public class TradeTag
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        [ForeignKey("Trade")]
        [Column("trade_id")]
        public Guid TradeId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Tag { get; set; }

        // Navigation property
        public virtual Trade Trade { get; set; }
    }

    /// <summary>
    /// Represents a community post
    /// </summary>
    [Table("community_posts")]
    public class CommunityPost
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        [ForeignKey("User")]
        [Column("user_id")]
        public Guid UserId { get; set; }

        [Required]
        [MaxLength(255)]
        public string Title { get; set; }

        [Required]
        public string Content { get; set; }

        [Required]
        [MaxLength(50)]
        public string Category { get; set; }

        [MaxLength(20)]
        [Column("trading_pair")]
        public string TradingPair { get; set; }

        [MaxLength(10)]
        public string Timeframe { get; set; }

        [Column("image_url")]
        public string ImageUrl { get; set; }

        [Required]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public virtual User User { get; set; }
        public virtual ICollection<PostComment> Comments { get; set; }
        public virtual ICollection<PostLike> Likes { get; set; }
        public virtual ICollection<PostTag> Tags { get; set; }
    }

    /// <summary>
    /// Represents a comment on a community post
    /// </summary>
    [Table("post_comments")]
    public class PostComment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        [ForeignKey("Post")]
        [Column("post_id")]
        public Guid PostId { get; set; }

        [Required]
        [ForeignKey("User")]
        [Column("user_id")]
        public Guid UserId { get; set; }

        [Required]
        public string Content { get; set; }

        [Required]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public virtual CommunityPost Post { get; set; }
        public virtual User User { get; set; }
    }

    /// <summary>
    /// Represents a like on a community post
    /// </summary>
    [Table("post_likes")]
    public class PostLike
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        [ForeignKey("Post")]
        [Column("post_id")]
        public Guid PostId { get; set; }

        [Required]
        [ForeignKey("User")]
        [Column("user_id")]
        public Guid UserId { get; set; }

        [Required]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public virtual CommunityPost Post { get; set; }
        public virtual User User { get; set; }
    }

    /// <summary>
    /// Represents a tag on a community post
    /// </summary>
    [Table("post_tags")]
    public class PostTag
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        [ForeignKey("Post")]
        [Column("post_id")]
        public Guid PostId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Tag { get; set; }

        // Navigation property
        public virtual CommunityPost Post { get; set; }
    }

    /// <summary>
    /// Represents a user in the system
    /// </summary>
    [Table("users", Schema = "auth")]
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [Column("raw_user_meta_data", TypeName = "jsonb")]
        public string RawUserMetaData { get; set; }

        [Required]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<MetaApiAccount> MetaApiAccounts { get; set; }
        public virtual ICollection<CommunityPost> Posts { get; set; }
        public virtual ICollection<PostComment> Comments { get; set; }
        public virtual ICollection<PostLike> Likes { get; set; }
        public virtual ICollection<TradeNote> TradeNotes { get; set; }
    }
}
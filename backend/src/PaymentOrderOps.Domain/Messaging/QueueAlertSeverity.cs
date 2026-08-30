namespace PaymentOrderOps.Domain.Messaging;

/// <summary>Ordered so a numeric sort surfaces the worst problems first.</summary>
public enum QueueAlertSeverity
{
    Info = 0,
    Warning = 1,
    Critical = 2,
}

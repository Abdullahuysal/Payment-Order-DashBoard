namespace PaymentOrderOps.Domain.TestRuns;

public enum TestScenarioKind
{
    Retail,
    Merchant,
    Generic,
}

public enum TestStepKind
{
    HttpRequest,
    SoapRequest,
    Poll,
    DbQuery,
    Extract,
    Assert,
    Delay,
}

public enum TestRunStatus
{
    Queued,
    Running,
    Passed,
    Failed,
    Cancelled,
}

public enum TestRunStepStatus
{
    Pending,
    Running,
    Passed,
    Failed,
    Skipped,
}

public enum InputFieldType
{
    String,
    Number,
    Boolean,
    Select,
    Secret,
}

public enum AssertionOp
{
    Equals,
    NotEquals,
    Contains,
    Exists,
    Gt,
    Lt,
}

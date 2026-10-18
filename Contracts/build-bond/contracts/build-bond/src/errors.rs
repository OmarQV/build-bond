use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    // 100s: configuration
    AlreadyInitialized = 100,
    InvalidConfig = 101,
    TokenNotAllowed = 102,
    OrganizerNotAllowed = 103,

    // 200s: event
    EventNotFound = 200,
    EventCancelled = 201,
    EntriesPaused = 202,
    OutsideWindow = 203,
    CapacityReached = 204,

    // 300s: admission
    NotAdmitted = 300,
    AdmissionExpired = 301,
    AdmissionConsumed = 302,
    AlreadyJoined = 303,
    RulesMismatch = 304,

    // 400s: position
    BondNotFound = 400,
    OwnerMismatch = 401,
    InvalidState = 402,
    NotReleaseable = 403,
    AlreadyClaimed = 404,

    // 500s: submission / decision
    SubmissionMissing = 500,
    SubmissionClosed = 501,
    ReviewClosed = 502,
    AlreadyDecided = 503,

    // 600s: appeal
    AppealNotAllowed = 600,
    AppealClosed = 601,
    ResolutionClosed = 602,

    // 700s: recovery
    InvalidRecoveryTarget = 700,
    RecoveryAlreadyLinked = 701,
    RecoveryNotEligible = 702,
    BatchTooLarge = 703,
    DuplicateId = 704,

    // 800s: arithmetic / accounting
    InvalidAmount = 800,
    ArithmeticOverflow = 801,
    LiabilityMismatch = 802,
}

use soroban_sdk::{contracttype, Address, BytesN, Vec};

/// Hard cap on how many bond ids one call (recovery link or claim) may touch at once.
/// Mirrors `max_batch` in the maestro spec (section 3.1 / C-14): no unbounded loops.
pub const MAX_BATCH: u32 = 10;

#[contracttype]
#[derive(Clone)]
pub struct ProgramConfig {
    pub governance: Address,
    pub paused_new_entries: bool,
    pub schema_version: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct EventConfig {
    pub id: u64,
    pub organizer: Address,
    pub reviewer: Address,
    pub arbiter: Address,
    pub token: Address,
    pub amount: i128,
    pub rules_hash: BytesN<32>,
    pub capacity: u32,
    pub recovery_enabled: bool,
    /// When true, `join` skips the per-address `Admission` check — any
    /// address may deposit directly. For public demo/testnet events only;
    /// a real hackathon keeps this `false` so the organizer controls who
    /// confirmed a reviewed application.
    pub open_admission: bool,
    pub join_opens_at: u64,
    pub join_closes_at: u64,
    pub cancel_until: u64,
    pub starts_at: u64,
    pub submission_deadline: u64,
    pub review_deadline: u64,
    pub appeal_window_sec: u64,
    pub resolution_window_sec: u64,
    pub safety_exit_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct EventRuntime {
    pub cancelled: bool,
    pub confirmed_count: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct Admission {
    pub expires_at: u64,
    pub consumed: bool,
}

#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum BondState {
    Locked,
    Releaseable,
    Frozen,
    Linked,
    Claimed,
}

// NOTE: soroban-sdk's `#[contracttype]` derive only emits reference-based
// `ScVal` conversions for custom enums/structs, which `Option<T>` cannot use
// for a non-builtin `T` (only `Option<u64>` and other builtin-wrapped
// options work). So instead of `Option<ReleaseReason>` / `Option<SubmissionReceipt>`,
// this contract uses an explicit sentinel variant / flag — see `NotReleased`
// below and `Participation::has_submission`.
#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum ReleaseReason {
    NotReleased,
    Completion,
    RecoveredVia(u64),
    UserCancellation,
    EventCancellation,
    EmergencyException,
    InfrastructureTimeout,
    SafetyExit,
}

#[contracttype]
#[derive(Clone)]
pub struct Bond {
    pub id: u64,
    pub event_id: u64,
    pub owner: Address,
    pub token: Address,
    pub amount: i128,
    pub state: BondState,
    pub linked_to: Option<u64>,
    pub release_reason: ReleaseReason,
}

#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum DecisionState {
    Pending,
    Approved,
    Rejected,
    Appealed,
    FinalRejected,
    InfraRefund,
    Cancelled,
    SafetyRefund,
}

#[contracttype]
#[derive(Clone)]
pub struct Participation {
    pub bond_id: u64,
    pub has_submission: bool,
    pub manifest_hash: BytesN<32>,
    pub submitted_at: u64,
    pub decision: DecisionState,
    pub decision_at: Option<u64>,
    pub appeal_until: Option<u64>,
    pub appeal_resolve_until: Option<u64>,
    pub completion_final: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct JoinResult {
    pub bond_id: u64,
    pub linked: Vec<u64>,
}

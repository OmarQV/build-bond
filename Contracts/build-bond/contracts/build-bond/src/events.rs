use soroban_sdk::{contractevent, Address, BytesN};

#[contractevent]
pub struct EventCreated {
    #[topic]
    pub event_id: u64,
    pub organizer: Address,
    pub token: Address,
    pub amount: i128,
}

#[contractevent]
pub struct AdmissionGranted {
    #[topic]
    pub event_id: u64,
    #[topic]
    pub owner: Address,
    pub expires_at: u64,
}

#[contractevent]
pub struct BondLocked {
    #[topic]
    pub bond_id: u64,
    #[topic]
    pub owner: Address,
    pub event_id: u64,
    pub token: Address,
    pub amount: i128,
}

#[contractevent]
pub struct SubmissionAnchored {
    #[topic]
    pub bond_id: u64,
    pub manifest_hash: BytesN<32>,
    pub submitted_at: u64,
}

#[contractevent]
pub struct ParticipationReviewed {
    #[topic]
    pub bond_id: u64,
    pub approved: bool,
}

#[contractevent]
pub struct AppealOpened {
    #[topic]
    pub bond_id: u64,
}

#[contractevent]
pub struct AppealResolved {
    #[topic]
    pub bond_id: u64,
    pub approved: bool,
}

#[contractevent]
pub struct BondFrozen {
    #[topic]
    pub bond_id: u64,
}

#[contractevent]
pub struct RecoveryLinked {
    #[topic]
    pub old_bond_id: u64,
    #[topic]
    pub target_bond_id: u64,
}

#[contractevent]
pub struct RecoveryUnlinked {
    #[topic]
    pub old_bond_id: u64,
}

#[contractevent]
pub struct BondReleased {
    #[topic]
    pub bond_id: u64,
}

#[contractevent]
pub struct BondClaimed {
    #[topic]
    pub bond_id: u64,
    #[topic]
    pub owner: Address,
    pub token: Address,
    pub amount: i128,
}

#[contractevent]
pub struct EventCancelled {
    #[topic]
    pub event_id: u64,
}

#[contractevent]
pub struct SafetyExitEnabled {
    #[topic]
    pub bond_id: u64,
}

#[contractevent]
pub struct NewEntriesPaused {
    pub paused: bool,
}

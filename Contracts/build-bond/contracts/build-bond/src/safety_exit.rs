use soroban_sdk::Env;

use crate::decisions::normalize;
use crate::errors::Error;
use crate::events::{BondReleased, SafetyExitEnabled};
use crate::storage;
use crate::types::{BondState, ReleaseReason};

/// contrato.md 6.2: anyone may call this once `safety_exit_at` has passed,
/// to protect the owner's principal if the program/operator has vanished.
/// Never grants `completion_final`; a prior historical decision is kept.
pub fn activate_safety_exit(env: &Env, bond_id: u64) -> Result<(), Error> {
    let bond = normalize(env, bond_id)?;
    if bond.state == BondState::Claimed {
        return Err(Error::AlreadyClaimed);
    }
    if bond.state == BondState::Releaseable {
        return Ok(());
    }

    let event = storage::read_event(env, bond.event_id).ok_or(Error::EventNotFound)?;
    let now = env.ledger().timestamp();
    if now < event.safety_exit_at {
        return Err(Error::OutsideWindow);
    }

    let mut bond = bond;
    bond.state = BondState::Releaseable;
    bond.release_reason = ReleaseReason::SafetyExit;
    bond.linked_to = None;
    storage::write_bond(env, &bond);

    SafetyExitEnabled { bond_id }.publish(env);
    BondReleased { bond_id }.publish(env);
    Ok(())
}

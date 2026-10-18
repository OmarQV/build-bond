use soroban_sdk::{Address, Env, Vec};

use crate::decisions::normalize;
use crate::errors::Error;
use crate::events::{BondFrozen, BondReleased, RecoveryLinked, RecoveryUnlinked};
use crate::storage;
use crate::types::{Bond, BondState, MAX_BATCH, ReleaseReason};

pub(crate) fn check_batch(ids: &Vec<u64>) -> Result<(), Error> {
    if ids.is_empty() || ids.len() > MAX_BATCH {
        return Err(Error::BatchTooLarge);
    }
    for i in 0..ids.len() {
        for j in (i + 1)..ids.len() {
            if ids.get(i) == ids.get(j) {
                return Err(Error::DuplicateId);
            }
        }
    }
    Ok(())
}

/// Eligibility test from contrato.md section 8.2. `old` must already be the
/// normalized bond (caller derives time-based Frozen first).
pub(crate) fn eligible(env: &Env, old: &Bond, target: &Bond) -> Result<(), Error> {
    if old.owner != target.owner {
        return Err(Error::InvalidRecoveryTarget);
    }
    if old.id == target.id || old.event_id == target.event_id {
        return Err(Error::InvalidRecoveryTarget);
    }
    if old.state != BondState::Frozen {
        return Err(Error::RecoveryNotEligible);
    }
    if old.linked_to.is_some() {
        return Err(Error::RecoveryAlreadyLinked);
    }
    if target.state != BondState::Locked {
        return Err(Error::RecoveryNotEligible);
    }

    let old_event = storage::read_event(env, old.event_id).ok_or(Error::EventNotFound)?;
    let target_event = storage::read_event(env, target.event_id).ok_or(Error::EventNotFound)?;
    if !target_event.recovery_enabled {
        return Err(Error::RecoveryNotEligible);
    }
    let now = env.ledger().timestamp();
    if !(old_event.submission_deadline < now && now < target_event.starts_at) {
        return Err(Error::RecoveryNotEligible);
    }
    Ok(())
}

pub fn link_recovery(
    env: &Env,
    target_bond_id: u64,
    old_bond_ids: Vec<u64>,
) -> Result<(), Error> {
    check_batch(&old_bond_ids)?;
    let target = storage::read_bond(env, target_bond_id).ok_or(Error::BondNotFound)?;
    target.owner.require_auth();

    for old_id in old_bond_ids.iter() {
        let mut old = normalize(env, old_id)?;
        eligible(env, &old, &target)?;
        old.linked_to = Some(target_bond_id);
        old.state = BondState::Linked;
        storage::write_bond(env, &old);
        RecoveryLinked {
            old_bond_id: old_id,
            target_bond_id,
        }
        .publish(env);
    }
    Ok(())
}

pub fn unlink_recovery(env: &Env, old_bond_ids: Vec<u64>) -> Result<(), Error> {
    check_batch(&old_bond_ids)?;

    for old_id in old_bond_ids.iter() {
        let mut old = storage::read_bond(env, old_id).ok_or(Error::BondNotFound)?;
        old.owner.require_auth();
        let target_id = old.linked_to.ok_or(Error::InvalidRecoveryTarget)?;
        let target_event = {
            let target = storage::read_bond(env, target_id).ok_or(Error::BondNotFound)?;
            storage::read_event(env, target.event_id).ok_or(Error::EventNotFound)?
        };
        let now = env.ledger().timestamp();
        if now >= target_event.starts_at {
            let target = normalize(env, target_id)?;
            if target.state != BondState::Frozen {
                return Err(Error::InvalidRecoveryTarget);
            }
        }
        old.linked_to = None;
        if old.state == BondState::Linked {
            old.state = BondState::Frozen;
        }
        storage::write_bond(env, &old);
        RecoveryUnlinked { old_bond_id: old_id }.publish(env);
    }
    Ok(())
}

/// Public maintenance call: resolves every pending link once its target
/// participation has a terminal result. Silently skips links whose target
/// is still open instead of erroring the whole batch.
pub fn sync_recovery(env: &Env, old_bond_ids: Vec<u64>) -> Result<(), Error> {
    check_batch(&old_bond_ids)?;

    for old_id in old_bond_ids.iter() {
        let mut old = storage::read_bond(env, old_id).ok_or(Error::BondNotFound)?;
        let target_id = match old.linked_to {
            Some(id) => id,
            None => continue,
        };
        if old.state != BondState::Linked {
            continue;
        }

        let target = normalize(env, target_id)?;
        let finalized = matches!(target.state, BondState::Releaseable | BondState::Claimed);
        if !finalized {
            continue;
        }

        let target_participation =
            storage::read_participation(env, target_id).ok_or(Error::BondNotFound)?;

        if target_participation.completion_final {
            old.state = BondState::Releaseable;
            old.release_reason = ReleaseReason::RecoveredVia(target_id);
            storage::write_bond(env, &old);
            BondReleased { bond_id: old_id }.publish(env);
        } else {
            old.state = BondState::Frozen;
            old.linked_to = None;
            storage::write_bond(env, &old);
            BondFrozen { bond_id: old_id }.publish(env);
        }
    }
    Ok(())
}

#[allow(dead_code)]
pub fn owner_of(env: &Env, bond_id: u64) -> Result<Address, Error> {
    Ok(storage::read_bond(env, bond_id).ok_or(Error::BondNotFound)?.owner)
}

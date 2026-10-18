use soroban_sdk::{BytesN, Env};

use crate::errors::Error;
use crate::events::{BondFrozen, BondReleased, ParticipationReviewed};
use crate::storage;
use crate::types::{Bond, BondState, DecisionState, ReleaseReason};

/// Single source of truth for time-derived transitions (contrato.md 6.1 / 7.4).
/// Called by `finalize`, `claims::claim`, `recovery::sync_recovery` and
/// `safety_exit` so no two modules can disagree about a bond's real state.
/// Never downgrades `Claimed` or `Releaseable` — only ever derives forward.
pub fn normalize(env: &Env, bond_id: u64) -> Result<Bond, Error> {
    let mut bond = storage::read_bond(env, bond_id).ok_or(Error::BondNotFound)?;
    if bond.state == BondState::Claimed || bond.state == BondState::Releaseable {
        return Ok(bond);
    }
    // `Linked` is only ever resolved by recovery::sync_recovery.
    if bond.state == BondState::Linked {
        return Ok(bond);
    }

    let event = storage::read_event(env, bond.event_id).ok_or(Error::EventNotFound)?;
    let mut participation =
        storage::read_participation(env, bond_id).ok_or(Error::BondNotFound)?;
    let now = env.ledger().timestamp();
    let mut changed = false;

    match participation.decision {
        DecisionState::Pending => {
            if !participation.has_submission && now >= event.submission_deadline {
                participation.decision = DecisionState::FinalRejected;
                bond.state = BondState::Frozen;
                changed = true;
            } else if participation.has_submission && now >= event.review_deadline {
                participation.decision = DecisionState::InfraRefund;
                bond.state = BondState::Releaseable;
                bond.release_reason = ReleaseReason::InfrastructureTimeout;
                changed = true;
            }
        }
        DecisionState::Rejected => {
            if let Some(appeal_until) = participation.appeal_until {
                if now >= appeal_until {
                    participation.decision = DecisionState::FinalRejected;
                    bond.state = BondState::Frozen;
                    changed = true;
                }
            }
        }
        DecisionState::Appealed => {
            if let Some(resolve_until) = participation.appeal_resolve_until {
                if now >= resolve_until {
                    participation.decision = DecisionState::InfraRefund;
                    bond.state = BondState::Releaseable;
                    bond.release_reason = ReleaseReason::InfrastructureTimeout;
                    changed = true;
                }
            }
        }
        _ => {}
    }

    if changed {
        storage::write_participation(env, &participation);
        storage::write_bond(env, &bond);
        if bond.state == BondState::Frozen {
            BondFrozen { bond_id }.publish(env);
        } else if bond.state == BondState::Releaseable {
            BondReleased { bond_id }.publish(env);
        }
    }

    Ok(bond)
}

pub fn finalize(env: &Env, bond_id: u64) -> Result<(), Error> {
    normalize(env, bond_id)?;
    Ok(())
}

pub fn review(
    env: &Env,
    bond_id: u64,
    approve: bool,
    _evidence_hash: BytesN<32>,
) -> Result<(), Error> {
    let mut bond = storage::read_bond(env, bond_id).ok_or(Error::BondNotFound)?;
    let event = storage::read_event(env, bond.event_id).ok_or(Error::EventNotFound)?;
    event.reviewer.require_auth();

    if bond.state != BondState::Locked {
        return Err(Error::InvalidState);
    }
    let mut participation =
        storage::read_participation(env, bond_id).ok_or(Error::BondNotFound)?;
    if participation.decision != DecisionState::Pending {
        return Err(Error::AlreadyDecided);
    }
    if !participation.has_submission {
        return Err(Error::SubmissionMissing);
    }
    let now = env.ledger().timestamp();
    if now >= event.review_deadline {
        return Err(Error::ReviewClosed);
    }

    participation.decision_at = Some(now);
    if approve {
        participation.decision = DecisionState::Approved;
        participation.completion_final = true;
        bond.state = BondState::Releaseable;
        bond.release_reason = ReleaseReason::Completion;
        BondReleased { bond_id }.publish(env);
    } else {
        participation.decision = DecisionState::Rejected;
        participation.appeal_until = Some(now + event.appeal_window_sec);
    }

    storage::write_participation(env, &participation);
    storage::write_bond(env, &bond);
    ParticipationReviewed { bond_id, approved: approve }.publish(env);
    Ok(())
}

pub fn resolve(
    env: &Env,
    bond_id: u64,
    approve: bool,
    _evidence_hash: BytesN<32>,
) -> Result<(), Error> {
    let mut bond = storage::read_bond(env, bond_id).ok_or(Error::BondNotFound)?;
    let event = storage::read_event(env, bond.event_id).ok_or(Error::EventNotFound)?;
    event.arbiter.require_auth();

    let mut participation =
        storage::read_participation(env, bond_id).ok_or(Error::BondNotFound)?;
    if participation.decision != DecisionState::Appealed {
        return Err(Error::AppealNotAllowed);
    }
    let now = env.ledger().timestamp();
    if let Some(resolve_until) = participation.appeal_resolve_until {
        if now >= resolve_until {
            return Err(Error::ResolutionClosed);
        }
    }

    if approve {
        participation.decision = DecisionState::Approved;
        participation.completion_final = true;
        bond.state = BondState::Releaseable;
        bond.release_reason = ReleaseReason::Completion;
        BondReleased { bond_id }.publish(env);
    } else {
        participation.decision = DecisionState::FinalRejected;
        bond.state = BondState::Frozen;
        BondFrozen { bond_id }.publish(env);
    }

    storage::write_participation(env, &participation);
    storage::write_bond(env, &bond);
    crate::events::AppealResolved { bond_id, approved: approve }.publish(env);
    Ok(())
}

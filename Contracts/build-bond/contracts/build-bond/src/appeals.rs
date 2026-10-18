use soroban_sdk::{BytesN, Env};

use crate::errors::Error;
use crate::events::{AppealOpened, BondReleased};
use crate::storage;
use crate::types::{BondState, DecisionState, ReleaseReason};

pub fn dispute(env: &Env, bond_id: u64, _evidence_hash: BytesN<32>) -> Result<(), Error> {
    let bond = storage::read_bond(env, bond_id).ok_or(Error::BondNotFound)?;
    bond.owner.require_auth();

    let event = storage::read_event(env, bond.event_id).ok_or(Error::EventNotFound)?;
    let mut participation =
        storage::read_participation(env, bond_id).ok_or(Error::BondNotFound)?;

    if participation.decision != DecisionState::Rejected {
        return Err(Error::AppealNotAllowed);
    }
    let now = env.ledger().timestamp();
    let appeal_until = participation.appeal_until.ok_or(Error::AppealNotAllowed)?;
    if now >= appeal_until {
        return Err(Error::AppealClosed);
    }

    participation.decision = DecisionState::Appealed;
    participation.appeal_resolve_until = Some(now + event.resolution_window_sec);
    storage::write_participation(env, &participation);

    AppealOpened { bond_id }.publish(env);
    Ok(())
}

/// Administrative exception (contrato.md 7.3 / 7.4#3): habilita el principal
/// aun congelado/vinculado sin certificar cumplimiento ni tocar el historial
/// de la decisión. No actúa sobre bonds ya `Releaseable` o `Claimed`.
pub fn grant_exception(env: &Env, bond_id: u64, _reason_hash: BytesN<32>) -> Result<(), Error> {
    let mut bond = storage::read_bond(env, bond_id).ok_or(Error::BondNotFound)?;
    let event = storage::read_event(env, bond.event_id).ok_or(Error::EventNotFound)?;
    event.arbiter.require_auth();

    if bond.state == BondState::Claimed || bond.state == BondState::Releaseable {
        return Err(Error::InvalidState);
    }

    bond.state = BondState::Releaseable;
    bond.release_reason = ReleaseReason::EmergencyException;
    bond.linked_to = None;
    storage::write_bond(env, &bond);

    BondReleased { bond_id }.publish(env);
    Ok(())
}

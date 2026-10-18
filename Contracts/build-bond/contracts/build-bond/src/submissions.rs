use soroban_sdk::{BytesN, Env};

use crate::errors::Error;
use crate::events::SubmissionAnchored;
use crate::storage;
use crate::types::BondState;

pub fn submit(env: &Env, bond_id: u64, manifest_hash: BytesN<32>) -> Result<(), Error> {
    let bond = storage::read_bond(env, bond_id).ok_or(Error::BondNotFound)?;
    bond.owner.require_auth();

    if bond.state != BondState::Locked {
        return Err(Error::InvalidState);
    }
    let event = storage::read_event(env, bond.event_id).ok_or(Error::EventNotFound)?;
    let now = env.ledger().timestamp();
    if now < event.starts_at || now >= event.submission_deadline {
        return Err(Error::SubmissionClosed);
    }

    let mut participation =
        storage::read_participation(env, bond_id).ok_or(Error::BondNotFound)?;
    let submitted_at = now;
    participation.has_submission = true;
    participation.manifest_hash = manifest_hash.clone();
    participation.submitted_at = submitted_at;
    storage::write_participation(env, &participation);

    SubmissionAnchored {
        bond_id,
        manifest_hash,
        submitted_at,
    }
    .publish(env);
    Ok(())
}

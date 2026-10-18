use soroban_sdk::{Address, Env};

use crate::errors::Error;
use crate::events::AdmissionGranted;
use crate::storage;
use crate::types::Admission;

pub fn authorize_participant(
    env: &Env,
    event_id: u64,
    owner: Address,
    expires_at: u64,
) -> Result<(), Error> {
    let event = storage::read_event(env, event_id).ok_or(Error::EventNotFound)?;
    event.organizer.require_auth();

    if expires_at > event.join_closes_at {
        return Err(Error::InvalidConfig);
    }
    if storage::has_bond_for_event_owner(env, event_id, &owner) {
        return Err(Error::AlreadyJoined);
    }

    storage::write_admission(
        env,
        event_id,
        &owner,
        &Admission {
            expires_at,
            consumed: false,
        },
    );

    AdmissionGranted {
        event_id,
        owner,
        expires_at,
    }
    .publish(env);
    Ok(())
}

pub fn revoke_admission(env: &Env, event_id: u64, owner: Address) -> Result<(), Error> {
    let event = storage::read_event(env, event_id).ok_or(Error::EventNotFound)?;
    event.organizer.require_auth();

    let admission = storage::read_admission(env, event_id, &owner).ok_or(Error::NotAdmitted)?;
    if admission.consumed {
        return Err(Error::AdmissionConsumed);
    }
    storage::write_admission(
        env,
        event_id,
        &owner,
        &Admission {
            expires_at: admission.expires_at,
            consumed: true,
        },
    );
    Ok(())
}

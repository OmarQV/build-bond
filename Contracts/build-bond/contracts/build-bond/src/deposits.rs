use soroban_sdk::{token::TokenClient, Address, BytesN, Env, Vec};

use crate::admin::entries_paused;
use crate::decisions::normalize;
use crate::errors::Error;
use crate::events::{BondLocked, RecoveryLinked};
use crate::recovery;
use crate::storage;
use crate::types::{Admission, Bond, BondState, DecisionState, JoinResult, Participation};

pub fn join(
    env: &Env,
    event_id: u64,
    owner: Address,
    rules_hash: BytesN<32>,
    old_bond_ids: Vec<u64>,
) -> Result<JoinResult, Error> {
    owner.require_auth();

    if entries_paused(env) {
        return Err(Error::EntriesPaused);
    }

    let event = storage::read_event(env, event_id).ok_or(Error::EventNotFound)?;
    let runtime = storage::read_runtime(env, event_id);
    if runtime.cancelled {
        return Err(Error::EventCancelled);
    }

    let now = env.ledger().timestamp();
    if now < event.join_opens_at || now >= event.join_closes_at {
        return Err(Error::OutsideWindow);
    }
    if rules_hash != event.rules_hash {
        return Err(Error::RulesMismatch);
    }
    if storage::has_bond_for_event_owner(env, event_id, &owner) {
        return Err(Error::AlreadyJoined);
    }

    if event.open_admission {
        // Public demo events: no per-address admission to consume.
    } else {
        let admission =
            storage::read_admission(env, event_id, &owner).ok_or(Error::NotAdmitted)?;
        if admission.consumed {
            return Err(Error::AdmissionConsumed);
        }
        if now >= admission.expires_at {
            return Err(Error::AdmissionExpired);
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
    }
    if runtime.confirmed_count >= event.capacity {
        return Err(Error::CapacityReached);
    }
    if !old_bond_ids.is_empty() {
        recovery::check_batch(&old_bond_ids)?;
    }

    let bond_id = storage::next_bond_id(env);
    let bond = Bond {
        id: bond_id,
        event_id,
        owner: owner.clone(),
        token: event.token.clone(),
        amount: event.amount,
        state: BondState::Locked,
        linked_to: None,
        release_reason: crate::types::ReleaseReason::NotReleased,
    };
    storage::write_bond(env, &bond);
    storage::set_bond_for_event_owner(env, event_id, &owner, bond_id);
    storage::push_owner_index(env, &owner, bond_id);

    storage::write_participation(
        env,
        &Participation {
            bond_id,
            has_submission: false,
            manifest_hash: BytesN::from_array(env, &[0u8; 32]),
            submitted_at: 0,
            decision: DecisionState::Pending,
            decision_at: None,
            appeal_until: None,
            appeal_resolve_until: None,
            completion_final: false,
        },
    );

    let mut runtime = runtime;
    runtime.confirmed_count += 1;
    storage::write_runtime(env, event_id, &runtime);

    let liability = storage::read_liability(env, &event.token)
        .checked_add(event.amount)
        .ok_or(Error::ArithmeticOverflow)?;
    storage::write_liability(env, &event.token, liability);

    let token_client = TokenClient::new(env, &event.token);
    token_client.transfer(&owner, &env.current_contract_address(), &event.amount);

    for old_id in old_bond_ids.iter() {
        let mut old = normalize(env, old_id)?;
        recovery::eligible(env, &old, &bond)?;
        old.linked_to = Some(bond_id);
        old.state = BondState::Linked;
        storage::write_bond(env, &old);
        RecoveryLinked {
            old_bond_id: old_id,
            target_bond_id: bond_id,
        }
        .publish(env);
    }

    BondLocked {
        bond_id,
        owner,
        event_id,
        token: event.token,
        amount: event.amount,
    }
    .publish(env);

    Ok(JoinResult {
        bond_id,
        linked: old_bond_ids,
    })
}

pub fn cancel(env: &Env, bond_id: u64) -> Result<(), Error> {
    let mut bond = storage::read_bond(env, bond_id).ok_or(Error::BondNotFound)?;
    bond.owner.require_auth();

    if bond.state != BondState::Locked {
        return Err(Error::InvalidState);
    }
    let event = storage::read_event(env, bond.event_id).ok_or(Error::EventNotFound)?;
    let now = env.ledger().timestamp();
    if now >= event.cancel_until {
        return Err(Error::OutsideWindow);
    }

    let mut participation =
        storage::read_participation(env, bond_id).ok_or(Error::BondNotFound)?;
    participation.decision = DecisionState::Cancelled;
    storage::write_participation(env, &participation);

    bond.state = BondState::Releaseable;
    bond.release_reason = crate::types::ReleaseReason::UserCancellation;
    storage::write_bond(env, &bond);

    let mut runtime = storage::read_runtime(env, bond.event_id);
    runtime.confirmed_count = runtime.confirmed_count.saturating_sub(1);
    storage::write_runtime(env, bond.event_id, &runtime);

    crate::events::BondReleased { bond_id }.publish(env);
    Ok(())
}

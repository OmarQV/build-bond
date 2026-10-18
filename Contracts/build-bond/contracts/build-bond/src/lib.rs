#![no_std]

mod admin;
mod admissions;
mod appeals;
mod claims;
mod decisions;
mod deposits;
mod errors;
mod event_registry;
mod events;
mod recovery;
mod safety_exit;
mod storage;
mod submissions;
mod types;

use soroban_sdk::{contract, contractimpl, Address, BytesN, Env, Vec};

pub use errors::Error;
pub use types::{
    Bond, BondState, DecisionState, EventConfig, EventRuntime, JoinResult, Participation,
    ProgramConfig, ReleaseReason,
};

#[contract]
pub struct BuildBond;

#[contractimpl]
impl BuildBond {
    // ---- 7.1 Initialization, configuration and admission ----

    pub fn __constructor(env: Env, governance: Address) -> Result<(), Error> {
        admin::init(&env, governance)
    }

    pub fn allow_organizer(env: Env, address: Address, enabled: bool) -> Result<(), Error> {
        admin::allow_organizer(&env, address, enabled)
    }

    pub fn allow_token(env: Env, token: Address, enabled: bool) -> Result<(), Error> {
        admin::allow_token(&env, token, enabled)
    }

    pub fn create_event(env: Env, config: EventConfig) -> Result<u64, Error> {
        event_registry::create(&env, config)
    }

    pub fn authorize_participant(
        env: Env,
        event_id: u64,
        owner: Address,
        expires_at: u64,
    ) -> Result<(), Error> {
        admissions::authorize_participant(&env, event_id, owner, expires_at)
    }

    pub fn revoke_admission(env: Env, event_id: u64, owner: Address) -> Result<(), Error> {
        admissions::revoke_admission(&env, event_id, owner)
    }

    pub fn pause_new_entries(env: Env, paused: bool) -> Result<(), Error> {
        admin::pause_new_entries(&env, paused)
    }

    // ---- 7.2 Participant operations ----

    pub fn join(
        env: Env,
        event_id: u64,
        owner: Address,
        rules_hash: BytesN<32>,
        old_bond_ids: Vec<u64>,
    ) -> Result<JoinResult, Error> {
        deposits::join(&env, event_id, owner, rules_hash, old_bond_ids)
    }

    pub fn link_recovery(
        env: Env,
        target_bond_id: u64,
        old_bond_ids: Vec<u64>,
    ) -> Result<(), Error> {
        recovery::link_recovery(&env, target_bond_id, old_bond_ids)
    }

    pub fn unlink_recovery(env: Env, old_bond_ids: Vec<u64>) -> Result<(), Error> {
        recovery::unlink_recovery(&env, old_bond_ids)
    }

    pub fn submit(env: Env, bond_id: u64, manifest_hash: BytesN<32>) -> Result<(), Error> {
        submissions::submit(&env, bond_id, manifest_hash)
    }

    pub fn cancel(env: Env, bond_id: u64) -> Result<(), Error> {
        deposits::cancel(&env, bond_id)
    }

    pub fn dispute(env: Env, bond_id: u64, evidence_hash: BytesN<32>) -> Result<(), Error> {
        appeals::dispute(&env, bond_id, evidence_hash)
    }

    pub fn claim(env: Env, owner: Address, bond_ids: Vec<u64>) -> Result<(), Error> {
        claims::claim(&env, owner, bond_ids)
    }

    // ---- 7.3 Operation, review and reads ----

    pub fn review(
        env: Env,
        bond_id: u64,
        approve: bool,
        evidence_hash: BytesN<32>,
    ) -> Result<(), Error> {
        decisions::review(&env, bond_id, approve, evidence_hash)
    }

    pub fn resolve(
        env: Env,
        bond_id: u64,
        approve: bool,
        evidence_hash: BytesN<32>,
    ) -> Result<(), Error> {
        decisions::resolve(&env, bond_id, approve, evidence_hash)
    }

    pub fn grant_exception(env: Env, bond_id: u64, reason_hash: BytesN<32>) -> Result<(), Error> {
        appeals::grant_exception(&env, bond_id, reason_hash)
    }

    pub fn finalize(env: Env, bond_id: u64) -> Result<(), Error> {
        decisions::finalize(&env, bond_id)
    }

    pub fn sync_recovery(env: Env, old_bond_ids: Vec<u64>) -> Result<(), Error> {
        recovery::sync_recovery(&env, old_bond_ids)
    }

    pub fn cancel_event(env: Env, event_id: u64) -> Result<(), Error> {
        event_registry::cancel(&env, event_id)
    }

    pub fn activate_safety_exit(env: Env, bond_id: u64) -> Result<(), Error> {
        safety_exit::activate_safety_exit(&env, bond_id)
    }

    pub fn get_bond(env: Env, id: u64) -> Option<Bond> {
        storage::read_bond(&env, id)
    }

    pub fn get_participation(env: Env, bond_id: u64) -> Option<Participation> {
        storage::read_participation(&env, bond_id)
    }

    pub fn get_event(env: Env, id: u64) -> Option<EventConfig> {
        storage::read_event(&env, id)
    }

    pub fn get_liability(env: Env, token: Address) -> i128 {
        storage::read_liability(&env, &token)
    }

    pub fn list_owner_bonds(env: Env, owner: Address) -> Vec<u64> {
        storage::read_owner_index(&env, &owner)
    }
}

mod test;

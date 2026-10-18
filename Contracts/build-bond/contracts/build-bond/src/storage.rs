use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::{Admission, Bond, EventConfig, EventRuntime, Participation, ProgramConfig};

pub const DAY_IN_LEDGERS: u32 = 17280;
pub const BUMP_THRESHOLD: u32 = 30 * DAY_IN_LEDGERS;
pub const BUMP_TO: u32 = 120 * DAY_IN_LEDGERS;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Config,
    Organizer(Address),
    Token(Address),
    Event(u64),
    EventRuntime(u64),
    Admission(u64, Address),
    Bond(u64),
    Participation(u64),
    BondByEventOwner(u64, Address),
    OwnerIndex(Address),
    Liability(Address),
    EventCounter,
    BondCounter,
}

fn bump_persistent(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, BUMP_THRESHOLD, BUMP_TO);
}

// ---- Config ----

pub fn read_config(env: &Env) -> Option<ProgramConfig> {
    env.storage().instance().get(&DataKey::Config)
}

pub fn write_config(env: &Env, cfg: &ProgramConfig) {
    env.storage().instance().set(&DataKey::Config, cfg);
    env.storage()
        .instance()
        .extend_ttl(BUMP_THRESHOLD, BUMP_TO);
}

// ---- Organizer / token allow-lists ----

pub fn is_organizer_allowed(env: &Env, addr: &Address) -> bool {
    env.storage()
        .persistent()
        .get(&DataKey::Organizer(addr.clone()))
        .unwrap_or(false)
}

pub fn set_organizer_allowed(env: &Env, addr: &Address, enabled: bool) {
    let key = DataKey::Organizer(addr.clone());
    env.storage().persistent().set(&key, &enabled);
    bump_persistent(env, &key);
}

pub fn is_token_allowed(env: &Env, token: &Address) -> bool {
    env.storage()
        .persistent()
        .get(&DataKey::Token(token.clone()))
        .unwrap_or(false)
}

pub fn set_token_allowed(env: &Env, token: &Address, enabled: bool) {
    let key = DataKey::Token(token.clone());
    env.storage().persistent().set(&key, &enabled);
    bump_persistent(env, &key);
}

// ---- Event / EventRuntime ----

pub fn read_event(env: &Env, event_id: u64) -> Option<EventConfig> {
    env.storage().persistent().get(&DataKey::Event(event_id))
}

pub fn write_event(env: &Env, event: &EventConfig) {
    let key = DataKey::Event(event.id);
    env.storage().persistent().set(&key, event);
    bump_persistent(env, &key);
}

pub fn read_runtime(env: &Env, event_id: u64) -> EventRuntime {
    env.storage()
        .persistent()
        .get(&DataKey::EventRuntime(event_id))
        .unwrap_or(EventRuntime {
            cancelled: false,
            confirmed_count: 0,
        })
}

pub fn write_runtime(env: &Env, event_id: u64, runtime: &EventRuntime) {
    let key = DataKey::EventRuntime(event_id);
    env.storage().persistent().set(&key, runtime);
    bump_persistent(env, &key);
}

// ---- Admission ----

pub fn read_admission(env: &Env, event_id: u64, owner: &Address) -> Option<Admission> {
    env.storage()
        .persistent()
        .get(&DataKey::Admission(event_id, owner.clone()))
}

pub fn write_admission(env: &Env, event_id: u64, owner: &Address, admission: &Admission) {
    let key = DataKey::Admission(event_id, owner.clone());
    env.storage().persistent().set(&key, admission);
    bump_persistent(env, &key);
}

// ---- Bond / Participation ----

pub fn next_event_id(env: &Env) -> u64 {
    let id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::EventCounter)
        .unwrap_or(0);
    let next = id + 1;
    env.storage().instance().set(&DataKey::EventCounter, &next);
    next
}

pub fn next_bond_id(env: &Env) -> u64 {
    let id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::BondCounter)
        .unwrap_or(0);
    let next = id + 1;
    env.storage().instance().set(&DataKey::BondCounter, &next);
    next
}

pub fn read_bond(env: &Env, bond_id: u64) -> Option<Bond> {
    env.storage().persistent().get(&DataKey::Bond(bond_id))
}

pub fn write_bond(env: &Env, bond: &Bond) {
    let key = DataKey::Bond(bond.id);
    env.storage().persistent().set(&key, bond);
    bump_persistent(env, &key);
}

pub fn read_participation(env: &Env, bond_id: u64) -> Option<Participation> {
    env.storage()
        .persistent()
        .get(&DataKey::Participation(bond_id))
}

pub fn write_participation(env: &Env, participation: &Participation) {
    let key = DataKey::Participation(participation.bond_id);
    env.storage().persistent().set(&key, participation);
    bump_persistent(env, &key);
}

pub fn has_bond_for_event_owner(env: &Env, event_id: u64, owner: &Address) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::BondByEventOwner(event_id, owner.clone()))
}

pub fn set_bond_for_event_owner(env: &Env, event_id: u64, owner: &Address, bond_id: u64) {
    let key = DataKey::BondByEventOwner(event_id, owner.clone());
    env.storage().persistent().set(&key, &bond_id);
    bump_persistent(env, &key);
}

// ---- Owner index (simplified: one Vec<u64> per owner; fine at demo/pilot scale) ----

pub fn read_owner_index(env: &Env, owner: &Address) -> Vec<u64> {
    env.storage()
        .persistent()
        .get(&DataKey::OwnerIndex(owner.clone()))
        .unwrap_or(Vec::new(env))
}

pub fn push_owner_index(env: &Env, owner: &Address, bond_id: u64) {
    let mut ids = read_owner_index(env, owner);
    ids.push_back(bond_id);
    let key = DataKey::OwnerIndex(owner.clone());
    env.storage().persistent().set(&key, &ids);
    bump_persistent(env, &key);
}

// ---- Liability (total principal owed per token) ----

pub fn read_liability(env: &Env, token: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Liability(token.clone()))
        .unwrap_or(0)
}

pub fn write_liability(env: &Env, token: &Address, amount: i128) {
    let key = DataKey::Liability(token.clone());
    env.storage().persistent().set(&key, &amount);
    bump_persistent(env, &key);
}

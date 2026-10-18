use soroban_sdk::{Address, Env};

use crate::errors::Error;
use crate::events::NewEntriesPaused;
use crate::storage;
use crate::types::ProgramConfig;

pub fn init(env: &Env, governance: Address) -> Result<(), Error> {
    if storage::read_config(env).is_some() {
        return Err(Error::AlreadyInitialized);
    }
    storage::write_config(
        env,
        &ProgramConfig {
            governance,
            paused_new_entries: false,
            schema_version: 1,
        },
    );
    Ok(())
}

pub fn require_governance(env: &Env) -> Result<ProgramConfig, Error> {
    let cfg = storage::read_config(env).ok_or(Error::InvalidConfig)?;
    cfg.governance.require_auth();
    Ok(cfg)
}

pub fn allow_organizer(env: &Env, addr: Address, enabled: bool) -> Result<(), Error> {
    require_governance(env)?;
    storage::set_organizer_allowed(env, &addr, enabled);
    Ok(())
}

pub fn allow_token(env: &Env, token: Address, enabled: bool) -> Result<(), Error> {
    require_governance(env)?;
    storage::set_token_allowed(env, &token, enabled);
    Ok(())
}

pub fn pause_new_entries(env: &Env, paused: bool) -> Result<(), Error> {
    let mut cfg = require_governance(env)?;
    cfg.paused_new_entries = paused;
    storage::write_config(env, &cfg);
    NewEntriesPaused { paused }.publish(env);
    Ok(())
}

pub fn entries_paused(env: &Env) -> bool {
    storage::read_config(env)
        .map(|c| c.paused_new_entries)
        .unwrap_or(false)
}

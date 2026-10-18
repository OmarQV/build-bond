use soroban_sdk::Env;

use crate::errors::Error;
use crate::events::EventCreated;
use crate::storage;
use crate::types::{EventConfig, EventRuntime};

/// Validates the temporal and economic invariants from contrato.md section 6
/// before an event becomes immutable. `event.id` is ignored on input; the
/// contract always assigns the real id.
fn validate(cfg: &EventConfig) -> Result<(), Error> {
    if cfg.amount <= 0 || cfg.capacity == 0 {
        return Err(Error::InvalidConfig);
    }
    if cfg.reviewer == cfg.arbiter {
        return Err(Error::InvalidConfig);
    }
    if !(cfg.join_opens_at < cfg.join_closes_at
        && cfg.join_closes_at <= cfg.starts_at
        && cfg.starts_at < cfg.submission_deadline)
    {
        return Err(Error::InvalidConfig);
    }
    if !(cfg.join_opens_at <= cfg.cancel_until && cfg.cancel_until <= cfg.starts_at) {
        return Err(Error::InvalidConfig);
    }
    if cfg.submission_deadline >= cfg.review_deadline {
        return Err(Error::InvalidConfig);
    }
    if cfg.appeal_window_sec == 0 || cfg.resolution_window_sec == 0 {
        return Err(Error::InvalidConfig);
    }
    let after_resolution = cfg
        .review_deadline
        .checked_add(cfg.appeal_window_sec)
        .and_then(|v| v.checked_add(cfg.resolution_window_sec))
        .ok_or(Error::ArithmeticOverflow)?;
    if after_resolution >= cfg.safety_exit_at {
        return Err(Error::InvalidConfig);
    }
    Ok(())
}

pub fn create(env: &Env, mut config: EventConfig) -> Result<u64, Error> {
    config.organizer.require_auth();

    if !storage::is_organizer_allowed(env, &config.organizer) {
        return Err(Error::OrganizerNotAllowed);
    }
    if !storage::is_token_allowed(env, &config.token) {
        return Err(Error::TokenNotAllowed);
    }

    validate(&config)?;

    let id = storage::next_event_id(env);
    config.id = id;

    storage::write_event(env, &config);
    storage::write_runtime(
        env,
        id,
        &EventRuntime {
            cancelled: false,
            confirmed_count: 0,
        },
    );

    EventCreated {
        event_id: id,
        organizer: config.organizer.clone(),
        token: config.token.clone(),
        amount: config.amount,
    }
    .publish(env);

    Ok(id)
}

pub fn cancel(env: &Env, event_id: u64) -> Result<(), Error> {
    let event = storage::read_event(env, event_id).ok_or(Error::EventNotFound)?;
    event.organizer.require_auth();

    let mut runtime = storage::read_runtime(env, event_id);
    if runtime.cancelled {
        return Err(Error::EventCancelled);
    }
    runtime.cancelled = true;
    storage::write_runtime(env, event_id, &runtime);

    crate::events::EventCancelled { event_id }.publish(env);
    Ok(())
}

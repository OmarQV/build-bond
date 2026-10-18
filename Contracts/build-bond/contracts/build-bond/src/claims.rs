use soroban_sdk::{token::TokenClient, Address, Env, Vec};

use crate::decisions::normalize;
use crate::errors::Error;
use crate::events::BondClaimed;
use crate::recovery::check_batch;
use crate::storage;
use crate::types::BondState;

/// Algorithm 8.3: validate every id first (so a single bad id reverts the
/// whole call via `Err`, matching invariant I-07), then group by token and
/// transfer once per token before marking positions `Claimed`.
pub fn claim(env: &Env, owner: Address, bond_ids: Vec<u64>) -> Result<(), Error> {
    owner.require_auth();
    check_batch(&bond_ids)?;

    let mut totals: Vec<(Address, i128)> = Vec::new(env);
    let mut bonds = Vec::new(env);

    for id in bond_ids.iter() {
        let bond = normalize(env, id)?;
        if bond.owner != owner {
            return Err(Error::OwnerMismatch);
        }
        if bond.state != BondState::Releaseable {
            return Err(Error::NotReleaseable);
        }

        let mut found = false;
        let mut updated: Vec<(Address, i128)> = Vec::new(env);
        for (token, amount) in totals.iter() {
            if token == bond.token {
                updated.push_back((
                    token.clone(),
                    amount.checked_add(bond.amount).ok_or(Error::ArithmeticOverflow)?,
                ));
                found = true;
            } else {
                updated.push_back((token.clone(), amount));
            }
        }
        if !found {
            updated.push_back((bond.token.clone(), bond.amount));
        }
        totals = updated;
        bonds.push_back(bond);
    }

    for (token, amount) in totals.iter() {
        let liability = storage::read_liability(env, &token)
            .checked_sub(amount)
            .ok_or(Error::LiabilityMismatch)?;
        storage::write_liability(env, &token, liability);

        let token_client = TokenClient::new(env, &token);
        token_client.transfer(&env.current_contract_address(), &owner, &amount);
    }

    for mut bond in bonds.iter() {
        bond.state = BondState::Claimed;
        storage::write_bond(env, &bond);
        BondClaimed {
            bond_id: bond.id,
            owner: owner.clone(),
            token: bond.token.clone(),
            amount: bond.amount,
        }
        .publish(env);
    }

    Ok(())
}

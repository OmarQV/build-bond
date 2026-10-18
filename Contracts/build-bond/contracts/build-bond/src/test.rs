#![cfg(test)]
extern crate std;

use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    vec, Address, BytesN, Env,
};

use crate::types::{BondState, EventConfig};
use crate::{BuildBond, BuildBondClient};

fn make_token<'a>(env: &'a Env, admin: &Address) -> (Address, soroban_sdk::token::StellarAssetClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let address = sac.address();
    let asset_client = soroban_sdk::token::StellarAssetClient::new(env, &address);
    (address, asset_client)
}

fn base_config(
    env: &Env,
    organizer: &Address,
    reviewer: &Address,
    arbiter: &Address,
    token: &Address,
) -> EventConfig {
    EventConfig {
        id: 0,
        organizer: organizer.clone(),
        reviewer: reviewer.clone(),
        arbiter: arbiter.clone(),
        token: token.clone(),
        amount: 20_0000000,
        rules_hash: BytesN::from_array(env, &[7u8; 32]),
        capacity: 10,
        recovery_enabled: true,
        open_admission: false,
        join_opens_at: 0,
        join_closes_at: 100,
        cancel_until: 50,
        starts_at: 100,
        submission_deadline: 1_000,
        review_deadline: 2_000,
        appeal_window_sec: 500,
        resolution_window_sec: 500,
        safety_exit_at: 100_000,
    }
}

#[allow(dead_code)]
struct World<'a> {
    env: Env,
    client: BuildBondClient<'a>,
    governance: Address,
    organizer: Address,
    reviewer: Address,
    arbiter: Address,
    token: Address,
}

fn setup() -> World<'static> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1);

    let governance = Address::generate(&env);
    let organizer = Address::generate(&env);
    let reviewer = Address::generate(&env);
    let arbiter = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let contract_id = env.register(BuildBond, (governance.clone(),));
    let client = BuildBondClient::new(&env, &contract_id);

    let (token, asset_client) = make_token(&env, &token_admin);

    client.allow_organizer(&organizer, &true);
    client.allow_token(&token, &true);
    let _ = asset_client;

    World {
        env,
        client,
        governance,
        organizer,
        reviewer,
        arbiter,
        token,
    }
}

impl<'a> World<'a> {
    fn mint(&self, to: &Address, amount: i128) {
        let token_admin_client =
            soroban_sdk::token::StellarAssetClient::new(&self.env, &self.token);
        token_admin_client.mint(to, &amount);
    }

    fn balance(&self, who: &Address) -> i128 {
        soroban_sdk::token::TokenClient::new(&self.env, &self.token).balance(who)
    }
}

#[test]
fn create_event_requires_allowed_organizer() {
    let w = setup();
    let outsider = Address::generate(&w.env);
    let cfg = base_config(&w.env, &outsider, &w.reviewer, &w.arbiter, &w.token);
    let res = w.client.try_create_event(&cfg);
    assert!(res.is_err());
}

#[test]
fn happy_path_join_submit_approve_claim() {
    let w = setup();
    let cfg = base_config(&w.env, &w.organizer, &w.reviewer, &w.arbiter, &w.token);
    let event_id = w.client.create_event(&cfg);

    let hacker = Address::generate(&w.env);
    w.mint(&hacker, 100_0000000);

    w.client.authorize_participant(&event_id, &hacker, &90);
    let join = w
        .client
        .join(&event_id, &hacker, &cfg.rules_hash, &vec![&w.env]);

    assert_eq!(w.balance(&hacker), 80_0000000);
    assert_eq!(w.client.get_liability(&w.token), 20_0000000);

    w.env.ledger().set_timestamp(150);
    w.client.submit(&join.bond_id, &BytesN::from_array(&w.env, &[1u8; 32]));

    w.client
        .review(&join.bond_id, &true, &BytesN::from_array(&w.env, &[2u8; 32]));

    let bond = w.client.get_bond(&join.bond_id).unwrap();
    assert_eq!(bond.state, BondState::Releaseable);

    w.client.claim(&hacker, &vec![&w.env, join.bond_id]);
    assert_eq!(w.balance(&hacker), 100_0000000);
    assert_eq!(w.client.get_liability(&w.token), 0);

    let bond = w.client.get_bond(&join.bond_id).unwrap();
    assert_eq!(bond.state, BondState::Claimed);

    // Claiming twice must fail and must not pay again.
    let res = w.client.try_claim(&hacker, &vec![&w.env, join.bond_id]);
    assert!(res.is_err());
    assert_eq!(w.balance(&hacker), 100_0000000);
}

#[test]
fn no_submission_freezes_principal() {
    let w = setup();
    let cfg = base_config(&w.env, &w.organizer, &w.reviewer, &w.arbiter, &w.token);
    let event_id = w.client.create_event(&cfg);

    let hacker = Address::generate(&w.env);
    w.mint(&hacker, 50_0000000);
    w.client.authorize_participant(&event_id, &hacker, &90);
    let join = w
        .client
        .join(&event_id, &hacker, &cfg.rules_hash, &vec![&w.env]);

    // Past the submission deadline, nothing was submitted.
    w.env.ledger().set_timestamp(1_001);
    w.client.finalize(&join.bond_id);

    let bond = w.client.get_bond(&join.bond_id).unwrap();
    assert_eq!(bond.state, BondState::Frozen);
    assert_eq!(w.balance(&hacker), 30_0000000);
    assert_eq!(w.client.get_liability(&w.token), 20_0000000);
}

#[test]
fn cross_event_recovery_releases_both_principals() {
    let w = setup();

    // --- Event A: hacker joins, never submits -> frozen ---
    let cfg_a = base_config(&w.env, &w.organizer, &w.reviewer, &w.arbiter, &w.token);
    let event_a = w.client.create_event(&cfg_a);

    let hacker = Address::generate(&w.env);
    w.mint(&hacker, 100_0000000);
    w.client.authorize_participant(&event_a, &hacker, &90);
    let bond_a = w
        .client
        .join(&event_a, &hacker, &cfg_a.rules_hash, &vec![&w.env])
        .bond_id;

    w.env.ledger().set_timestamp(1_001);
    w.client.finalize(&bond_a);
    assert_eq!(w.client.get_bond(&bond_a).unwrap().state, BondState::Frozen);

    // --- Event B: starts after A's submission deadline; hacker joins
    // linking A, submits and gets approved ---
    let mut cfg_b = base_config(&w.env, &w.organizer, &w.reviewer, &w.arbiter, &w.token);
    cfg_b.join_opens_at = 1_010;
    cfg_b.join_closes_at = 1_100;
    cfg_b.cancel_until = 1_050;
    cfg_b.starts_at = 1_100;
    cfg_b.submission_deadline = 2_000;
    cfg_b.review_deadline = 3_000;
    cfg_b.safety_exit_at = 200_000;
    let event_b = w.client.create_event(&cfg_b);

    w.env.ledger().set_timestamp(1_020);
    w.client.authorize_participant(&event_b, &hacker, &1_090);
    let join_b = w
        .client
        .join(&event_b, &hacker, &cfg_b.rules_hash, &vec![&w.env, bond_a]);
    let bond_b = join_b.bond_id;

    assert_eq!(
        w.client.get_bond(&bond_a).unwrap().state,
        BondState::Linked
    );
    // 100 - 20 (A) - 20 (B) = 60 left in the wallet while both are locked/frozen-linked.
    assert_eq!(w.balance(&hacker), 60_0000000);

    w.env.ledger().set_timestamp(1_150);
    w.client
        .submit(&bond_b, &BytesN::from_array(&w.env, &[3u8; 32]));
    w.client
        .review(&bond_b, &true, &BytesN::from_array(&w.env, &[4u8; 32]));

    w.client.sync_recovery(&vec![&w.env, bond_a]);
    assert_eq!(
        w.client.get_bond(&bond_a).unwrap().state,
        BondState::Releaseable
    );

    w.client.claim(&hacker, &vec![&w.env, bond_a, bond_b]);
    assert_eq!(w.balance(&hacker), 100_0000000);
    assert_eq!(w.client.get_liability(&w.token), 0);
}

#[test]
fn open_admission_lets_anyone_join_without_authorization() {
    let w = setup();
    let mut cfg = base_config(&w.env, &w.organizer, &w.reviewer, &w.arbiter, &w.token);
    cfg.open_admission = true;
    let event_id = w.client.create_event(&cfg);

    let visitor = Address::generate(&w.env);
    w.mint(&visitor, 50_0000000);

    // No authorize_participant call for `visitor` — this is the whole point.
    let join = w
        .client
        .join(&event_id, &visitor, &cfg.rules_hash, &vec![&w.env]);

    assert_eq!(w.balance(&visitor), 30_0000000);
    let bond = w.client.get_bond(&join.bond_id).unwrap();
    assert_eq!(bond.state, BondState::Locked);
}

#[test]
fn safety_exit_unlocks_abandoned_bond() {
    let w = setup();
    let cfg = base_config(&w.env, &w.organizer, &w.reviewer, &w.arbiter, &w.token);
    let event_id = w.client.create_event(&cfg);

    let hacker = Address::generate(&w.env);
    w.mint(&hacker, 30_0000000);
    w.client.authorize_participant(&event_id, &hacker, &90);
    let bond_id = w
        .client
        .join(&event_id, &hacker, &cfg.rules_hash, &vec![&w.env])
        .bond_id;

    w.env.ledger().set_timestamp(1_001);
    w.client.finalize(&bond_id);
    assert_eq!(w.client.get_bond(&bond_id).unwrap().state, BondState::Frozen);

    // Before the safety window, the owner still cannot force a release.
    let res = w.client.try_activate_safety_exit(&bond_id);
    assert!(res.is_err());

    w.env.ledger().set_timestamp(cfg.safety_exit_at + 1);
    w.client.activate_safety_exit(&bond_id);
    assert_eq!(
        w.client.get_bond(&bond_id).unwrap().state,
        BondState::Releaseable
    );

    w.client.claim(&hacker, &vec![&w.env, bond_id]);
    assert_eq!(w.balance(&hacker), 30_0000000);
}

/* tslint:disable */
/* eslint-disable */

/**
 * Derive the compact 32-byte Quip account id from serialized H4 public bytes.
 */
export function accountIdFromPublic(public_hex: string): string;

/**
 * Derive serialized H4 public key bytes from a 32-byte H4 seed.
 */
export function publicFromSeed(seed_hex: string): string;

/**
 * Derive the 32-byte H4 master seed from a limited secret URI.
 *
 * Accepts a `0x`-prefixed 64-digit hex seed, or an English BIP39 phrase
 * optionally followed by `///<password>`. Derivation junctions (`//`, `/`) are
 * rejected. The returned seed hex can be passed to [`public_from_seed`] and
 * [`sign_payload_from_seed`].
 */
export function seedFromMnemonic(secret_uri: string): string;

/**
 * Sign SCALE-encoded transaction payload bytes and return a SCALE-encoded
 * `HybridTxSignature` envelope.
 *
 * The payload hex is signed **exactly as given**: no hashing, no length check.
 * The H4 domain prefix (`0x01 || "hybrid-sr25519-falcon512-v1\0" || ...`) is
 * applied intrinsically by the scheme, so callers must not pre-apply it.
 * Substrate's `SignedPayload` rule — `blake2_256(payload)` when the encoded
 * payload exceeds 256 bytes — is an extrinsic convention and the caller's
 * responsibility; the higher-level `QuipSigner` (`signRaw`) applies it, so
 * callers using that path get it for free.
 */
export function signPayloadFromSeed(seed_hex: string, payload_hex: string): string;

/**
 * Verify a SCALE-encoded `HybridTxSignature` envelope for the given payload
 * and compact account id.
 */
export function verifyEnvelope(payload_hex: string, envelope_hex: string, account_id_hex: string): boolean;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly accountIdFromPublic: (a: number, b: number) => [number, number, number, number];
    readonly publicFromSeed: (a: number, b: number) => [number, number, number, number];
    readonly seedFromMnemonic: (a: number, b: number) => [number, number, number, number];
    readonly signPayloadFromSeed: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly verifyEnvelope: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

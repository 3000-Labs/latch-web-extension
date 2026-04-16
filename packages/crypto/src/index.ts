/**
 * @latch/crypto
 * Key derivation, mnemonic handling, and vault encryption.
 *
 * Allowed only in: background service worker.
 * Never import this package from popup or content scripts.
 *
 * Primitives (to be installed):
 *   @scure/bip39         — mnemonic generation / validation
 *   @noble/curves        — Ed25519 key derivation for Stellar
 *   @metamask/browser-passworder — AES-GCM vault encryption
 */

// TODO: generateMnemonic(): string
// TODO: mnemonicToKeypair(mnemonic: string): { publicKey: string; privateKey: Uint8Array }
// TODO: encryptVault(data: unknown, password: string): Promise<string>
// TODO: decryptVault(cipher: string, password: string): Promise<unknown>

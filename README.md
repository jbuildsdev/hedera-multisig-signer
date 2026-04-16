# Hedera Multisig Signer

Sign a pending Hedera multisig transaction using your private key.

Your private key never leaves your machine. This script makes no network calls and spends no HBAR.

---

## One-time setup

**1. Install Node.js** if you don't have it: https://nodejs.org (download the LTS version)

**2. Clone this repo and install dependencies**

```bash
git clone <repo-url>
cd hedera-multisig-signer
npm install
```

**3. Create your `.env` file**

```bash
cp .env.example .env
```

Open `.env` in any text editor and fill in your Hedera private key:

```
MY_PRIVATE_KEY=your-private-key-here
```

Find your private key in Hashpack under Settings → Account → Private Key.

> **Keep your `.env` file private. Never share it, commit it, or send it to anyone.**

---

## Every time you need to sign

**1. Get the transaction file**

The initiator will send you a file called `frozen-tx.json`.
Replace the existing `frozen-tx.json` in this folder with the one they sent you.

**2. Run the signing script**

```bash
npm run sign
```

The script will show you exactly what you are signing. Read it carefully.

**3. Send back your signature file**

After running, you'll find your signature file at:

```
my-signature.json
```

Send that file back to the initiator. That's all you need to do.

---

## What gets sent to the network?

Nothing — not by you. The initiator collects everyone's signature files and executes the transaction once enough signatures are collected. You will never directly interact with the Hedera network.

## Is my private key safe?

Yes. Your private key is read from `.env`, used locally to sign the transaction body bytes, and never written anywhere or sent over the network. The signature file you send back contains only your **public key** and your **signature** — neither of which can be used to derive your private key.

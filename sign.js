require("dotenv").config();
const fs   = require("node:fs");
const path = require("node:path");
const { PrivateKey, Transaction } = require("@hashgraph/sdk");

const FROZEN_FILE = path.join(__dirname, "frozen-tx.json");

async function main() {
  const myPrivateKey = process.env.MY_PRIVATE_KEY?.trim();

  if (!myPrivateKey) {
    console.error("ERROR: MY_PRIVATE_KEY is not set in .env");
    process.exit(1);
  }

  if (!fs.existsSync(FROZEN_FILE)) {
    console.error("ERROR: frozen-tx.json not found — drop the file sent to you into this folder.");
    process.exit(1);
  }

  const frozen = JSON.parse(fs.readFileSync(FROZEN_FILE, "utf8"));

  if (frozen._placeholder) {
    console.error("ERROR: frozen-tx.json is still the placeholder — replace it with the file sent to you.");
    process.exit(1);
  }
  if (!frozen.txBase64) {
    console.error("ERROR: frozen-tx.json is missing txBase64 — this file is invalid.");
    process.exit(1);
  }

  console.log(`\nTransaction details`);
  if (frozen.description)    console.log(`  ${frozen.description}`);
  if (frozen.memo)           console.log(`  Memo : ${frozen.memo}`);
  if (frozen.multisigAccount) console.log(`  From : ${frozen.multisigAccount}`);
  if (frozen.transactionId)  console.log(`  ID   : ${frozen.transactionId}`);
  console.log();

  const txBytes    = Buffer.from(frozen.txBase64, "base64");
  const tx         = Transaction.fromBytes(txBytes);
  const privateKey = PrivateKey.fromStringECDSA(myPrivateKey);
  const bodyBytes  = tx._signedTransactions.get(0).bodyBytes;
  const sigBytes   = privateKey.sign(bodyBytes);

  // Name the file after the first 8 chars of the raw public key — unique per signer,
  // no coordination needed, operator can cross-reference against state.json.
  const keyPrefix = privateKey.publicKey.toStringRaw().slice(0, 8);
  const sigFile   = path.join(__dirname, `sig-${keyPrefix}.json`);

  fs.writeFileSync(sigFile, JSON.stringify({
    publicKey: privateKey.publicKey.toString(),
    signature: Buffer.from(sigBytes).toString("base64"),
  }, null, 2));

  console.log(`Signed. Send this file to the initiator:`);
  console.log(`  sig-${keyPrefix}.json\n`);
}

main().catch((err) => {
  console.error("ERROR:", err.message ?? err);
  process.exit(1);
});

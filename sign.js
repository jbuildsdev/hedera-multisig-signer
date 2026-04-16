require("dotenv").config();
const fs       = require("node:fs");
const path     = require("node:path");
const readline = require("node:readline");
const { PrivateKey, Transaction, TransferTransaction } = require("@hashgraph/sdk");

const FROZEN_FILE = path.join(__dirname, "frozen-tx.json");

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

function decode(tx) {
  const lines = [
    `  Type : ${tx.constructor.name}`,
    `  ID   : ${tx.transactionId}`,
    ...(tx.transactionMemo ? [`  Memo : ${tx.transactionMemo}`] : []),
    ...(tx instanceof TransferTransaction && tx.hbarTransfers.size > 0
      ? [`  Transfers:`, ...[...tx.hbarTransfers].map(([accountId, amount]) =>
          `    ${accountId}  ${amount.toTinybars() > 0n ? "+" : ""}${amount}`
        )]
      : []),
  ];
  return lines.join("\n");
}

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

  const txBytes = Buffer.from(frozen.txBase64, "base64");
  const tx      = Transaction.fromBytes(txBytes);

  console.log(`\n${decode(tx)}\n`);

  const answer = await prompt("Sign this transaction? (y/n): ");
  if (answer.trim().toLowerCase() !== "y") {
    console.log("\nAborted. Nothing was signed.");
    process.exit(0);
  }

  const privateKey = PrivateKey.fromStringECDSA(myPrivateKey);
  const bodyBytes  = tx._signedTransactions.get(0).bodyBytes;
  const sigBytes   = privateKey.sign(bodyBytes);

  const keyPrefix = privateKey.publicKey.toStringRaw().slice(0, 8);
  const sigFile   = path.join(__dirname, `sig-${keyPrefix}.json`);

  fs.writeFileSync(sigFile, JSON.stringify({
    publicKey: privateKey.publicKey.toString(),
    signature: Buffer.from(sigBytes).toString("base64"),
  }, null, 2));

  console.log(`\nSigned. Send this file to the initiator:`);
  console.log(`  sig-${keyPrefix}.json\n`);
}

main().catch((err) => {
  console.error("ERROR:", err.message ?? err);
  process.exit(1);
});

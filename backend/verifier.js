// backend/verifier.js  ·  Framework-agnostic Iden3 verifier for the EligibilitySDK.
// Express example. Exposes the three routes the EligibilityWidget expects:
//   POST /auth-request      -> { request, sessionId }
//   POST /callback          -> the wallet posts the ZK proof token; fullVerify
//   GET  /status/:sessionId -> { status, proof?, error? }   (widget polls this)
//
// Prereqs:
//   npm install express @iden3/js-iden3-auth
//   Download the Iden3 trusted-setup circuit keys into ./keys
//   Env: ALLOWED_ISSUER_DID, PORT
const express = require("express");
const { auth, resolver, core } = require("@iden3/js-iden3-auth");

const app = express();
app.use(express.json());

// 1) Register the Receptor DID method for Redbelly testnet (chain 153) + mainnet (151).
core.registerDidMethodNetwork({ method: "receptor", methodByte: 0b10000011, blockchain: "redbelly", network: "testnet", networkFlag: 0b10000011, chainId: 153 });
core.registerDidMethodNetwork({ method: "receptor", methodByte: 0b01010111, blockchain: "redbelly", network: "mainnet", networkFlag: 0b01010111, chainId: 151 });

// 2) State resolvers (testnet shown). Mainnet: governors.mainnet.redbelly.network / 0x1cc7261e1777D69505Cb6413a91bb27ca9eb1456.
const resolvers = {
  ["redbelly:testnet"]: new resolver.EthStateResolver(
    "https://governors.testnet.redbelly.network",
    "0x69376715FB5E2B924a33e9C27302F52DEa178CDC"
  ),
};

// 3) Scope is SERVER-SIDE policy. Never read it from req.body. Map a flow id to it.
const ELIGIBILITY_SCOPE = [{
  id: 1,
  circuitId: "credentialAtomicQuerySigV2",
  query: {
    allowedIssuers: [process.env.ALLOWED_ISSUER_DID], // a specific DID, never "*"
    type: "AMLCTFCredential",
    context: "https://raw.githubusercontent.com/redbellynetwork/receptor-schema/refs/heads/main/schemas/json-ld/AMLCTFCredential.jsonld",
    credentialSubject: { amlCheckStatus: { $eq: "passed" } },
  },
}];

const KEY_DIR = "./keys";
const sessions = new Map(); // sessionId -> { request, status, proof?, error? }
let verifier;
(async () => {
  verifier = await auth.Verifier.newVerifier({
    stateResolver: resolvers,
    circuitsDir: KEY_DIR,
    ipfsGatewayURL: "https://ipfs.io",
  });
})();

// POST /auth-request
app.post("/auth-request", async (req, res) => {
  const callbackUri = `${process.env.PUBLIC_URL || ""}/callback`;
  const request = auth.createAuthorizationRequest("eligibility", process.env.SENDER_DID, callbackUri);
  request.body.scope = ELIGIBILITY_SCOPE;
  const sessionId = request.thid || crypto.randomUUID();
  sessions.set(sessionId, { request, status: "idle" });
  res.json({ request, sessionId });
});

// POST /callback  (wallet posts the proof token)
app.post("/callback", express.raw({ type: "*/*" }), async (req, res) => {
  const sessionId = req.query.sessionId;
  const entry = sessions.get(sessionId);
  if (!entry) return res.status(400).send("Invalid session ID");
  entry.status = "verifying";
  try {
    const token = req.body.toString();
    const authResponse = await verifier.fullVerify(token, entry.request, {
      AcceptedStateTransitionDelay: 5 * 60 * 1000,
    });
    entry.status = "success";
    entry.proof = authResponse;
    res.status(200).send("OK");
  } catch (err) {
    entry.status = "failed";
    entry.error = err.message;
    res.status(500).send(err.message);
  }
});

// GET /status/:sessionId  (widget polls)
app.get("/status/:sessionId", (req, res) => {
  const entry = sessions.get(req.params.sessionId);
  if (!entry) return res.status(400).json({ status: "failed", error: "Invalid session ID" });
  res.json({ status: entry.status, proof: entry.proof, error: entry.error });
});

app.listen(process.env.PORT || 3001, () => console.log("verifier up"));

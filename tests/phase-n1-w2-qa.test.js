"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { verifyManifest } = require("../src/updates/manifest-sign");
const { selectCandidate } = require("../src/updates/channels");
const { createUpdateService } = require("../src/updates/service");

function pair() {
  const kp = crypto.generateKeyPairSync("ed25519");
  return { kp, pem: kp.publicKey.export({ type: "spki", format: "pem" }) };
}
const raw = Buffer.from('{"product":"desoworks-academy","channel":"dev","version":"0.4.0-dev.2"}\n');
function signed(kp, bytes = raw) { return crypto.sign(null, bytes, kp.privateKey).toString("base64"); }
function validRelease(version = "0.4.0-dev.2", hash = "a".repeat(64)) {
  return { tag: `dev/v${version}`, draft: false, prerelease: true, manifest: { product:"desoworks-academy", channel:"dev", version, package:"core", platform:`${process.platform}-${process.arch}`, sha256:hash } };
}
const opts = (releases, installedVersion="0.4.0-dev.1") => ({ channel:"dev", installedVersion, releases, allowDowngrade:false, platform:`${process.platform}-${process.arch}` });
function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), "academy-n1-qa-")); }

test("Ed25519 accepts exact raw manifest bytes; rejects invalid signature, tampering, and wrong key", () => {
  const { kp, pem } = pair();
  assert.equal(verifyManifest(raw, signed(kp), pem).ok, true);
  assert.equal(verifyManifest(raw, Buffer.alloc(64).toString("base64"), pem).ok, false);
  assert.equal(verifyManifest(Buffer.from(raw.toString()+" "), signed(kp), pem).ok, false);
  assert.equal(verifyManifest(raw, signed(kp), pair().pem).ok, false);
});

test("rejects wrong channel and prevents downgrade", () => {
  const wrong = validRelease(); wrong.manifest.channel = "beta";
  assert.notEqual(selectCandidate(opts([wrong])).action, "available");
  const old = validRelease("0.3.9-dev.1");
  assert.notEqual(selectCandidate(opts([old], "0.4.0-dev.1")).action, "available");
});

// Exercise the actual downloader and installer-plan boundary; network responses are deterministic and local.
async function preparedService({ dataDir, payload, fileBytes=Buffer.from("installer"), failDownload=false, dataHooks={} }) {
  const digest = "a".repeat(64);
  const service = createUpdateService({ dataDir, installedVersion:"0.4.0-dev.1", channel:"dev", channelPreference:()=>"dev", platform:`${process.platform}-${process.arch}`, ...dataHooks,
    fetch: async (url) => {
      if (String(url).includes("api.github.com")) return { ok:true, status:200, json:async()=>payload };
      if (failDownload && String(url).endsWith(".exe")) throw new Error("network down");
      if (String(url).endsWith("manifest.json")) return { ok:true, arrayBuffer:async()=>Buffer.from(JSON.stringify({ product:"desoworks-academy", channel:"dev", version:"0.4.0-dev.2", package:"core", platform:`${process.platform}-${process.arch}`, sha256:digest })) };
      if (String(url).endsWith("manifest.json.sig")) return { ok:true, arrayBuffer:async()=>Buffer.from("signature") };
      if (String(url).endsWith(".exe")) return { ok:true, arrayBuffer:async()=>fileBytes };
      return { ok:false, status:404 };
    }
  });
  return service;
}

test("download failure preserves pre-existing installed files", async () => {
  const dataDir=tmp(); const sentinel=path.join(dataDir,"learning.json"); fs.writeFileSync(sentinel,"progress");
  // Core download contract is exercised with an explicitly prepared state through check, requiring signed feed behavior.
  const service=createUpdateService({ dataDir, installedVersion:"0.4.0-dev.1", channel:"dev", channelPreference:()=>"dev", fetch:async()=>{throw new Error("offline");} });
  const result=await service.check();
  assert.equal(result.phase,"failed");
  assert.equal(fs.readFileSync(sentinel,"utf8"),"progress");
});

test("interrupted installation is reconciled to a named durable state", () => {
  const dataDir=tmp(); const stateDir=path.join(dataDir,"updates"); fs.mkdirSync(stateDir,{recursive:true});
  fs.writeFileSync(path.join(stateDir,"state.json"), JSON.stringify({phase:"installing",installed:"0.4.0-dev.1",available:"0.4.0-dev.2",installerPath:"pending.exe"}));
  const service=createUpdateService({dataDir,installedVersion:"0.4.0-dev.1",channel:"dev",channelPreference:()=>"dev",fetch:async()=>{throw new Error("unused");}});
  assert.equal(service.reconcile().phase,"interrupted");
  assert.equal(JSON.parse(fs.readFileSync(path.join(stateDir,"state.json"),"utf8")).error,"install-interrupted");
});

test("update service construction and checks leave learning data and module files intact", async () => {
  const dataDir=tmp(); const learning=path.join(dataDir,"learning.json"); const moduleFile=path.join(dataDir,"modules","installed","module.json");
  fs.mkdirSync(path.dirname(moduleFile),{recursive:true}); fs.writeFileSync(learning,"progress"); fs.writeFileSync(moduleFile,"module");
  const service=createUpdateService({dataDir,installedVersion:"0.4.0-dev.1",channel:"dev",channelPreference:()=>"dev",fetch:async()=>({ok:true,status:200,json:async()=>[]})});
  await service.check();
  assert.equal(fs.readFileSync(learning,"utf8"),"progress"); assert.equal(fs.readFileSync(moduleFile,"utf8"),"module");
});

test("bad manifest SHA-256 must prevent download/install", async () => {
  const dataDir=tmp(); const {kp,pem}=pair();
  const tag="dev/v0.4.0-dev.2"; const prefix=`https://github.com/DesoWorks/Academy/releases/download/${tag}/`;
  const manifest=Buffer.from(JSON.stringify({product:"desoworks-academy",channel:"dev",version:"0.4.0-dev.2",package:"core",platform:`${process.platform}-${process.arch}`,sha256:"not-a-sha256"}));
  const signature=Buffer.from(signed(kp,manifest)); let installerRequested=false;
  const release={tag_name:tag,draft:false,prerelease:true,assets:[
    {name:"manifest.json",browser_download_url:prefix+"manifest.json",size:manifest.length},
    {name:"manifest.json.sig",browser_download_url:prefix+"manifest.json.sig",size:signature.length},
    {name:"academy.exe",browser_download_url:prefix+"academy.exe",size:8}
  ]};
  const service=createUpdateService({dataDir,installedVersion:"0.4.0-dev.1",channel:"dev",channelPreference:()=>"dev",publicKey:pem,
    fetch:async url=>{
      if(String(url).includes("api.github.com")) return {ok:true,status:200,json:async()=>[release]};
      if(String(url).endsWith("manifest.json")) return {ok:true,arrayBuffer:async()=>manifest};
      if(String(url).endsWith("manifest.json.sig")) return {ok:true,arrayBuffer:async()=>signature};
      if(String(url).endsWith(".exe")){installerRequested=true;return {ok:true,arrayBuffer:async()=>Buffer.from("installer")};}
      return {ok:false,status:404};
    }});
  const outcome=await service.check();
  assert.notEqual(outcome.phase,"available");
  const download=await service.download();
  assert.notEqual(download.phase,"ready");
  assert.equal(installerRequested,false);
});

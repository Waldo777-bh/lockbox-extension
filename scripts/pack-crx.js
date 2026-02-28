// Pack the dist/ folder into a .crx file (CRX3 format)
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { resolve, relative, join, dirname } from "path";
import { execSync } from "child_process";
import { createHash, createSign } from "crypto";
import { fileURLToPath } from "url";
import { deflateSync } from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "../dist");
const pemPath = resolve(__dirname, "../extension.pem");
const outPath = resolve(__dirname, "../lockbox-extension.crx");

// Create a zip of dist/ in memory
function createZipBuffer(dir) {
  // Use PowerShell to create the zip, then read it
  const tmpZip = resolve(__dirname, "../.tmp-crx.zip");
  execSync(
    `powershell -Command "Compress-Archive -Path '${dir}\\*' -DestinationPath '${tmpZip}' -Force"`,
  );
  const buf = readFileSync(tmpZip);
  execSync(`del "${tmpZip}"`);
  return buf;
}

// CRX3 format:
// - Magic: "Cr24" (4 bytes)
// - Version: 3 (4 bytes LE)
// - Header length (4 bytes LE)
// - Header (protobuf-encoded CrxFileHeader)
// - ZIP data

const zipData = createZipBuffer(distDir);
const privateKey = readFileSync(pemPath, "utf-8");

// Sign the zip data
// CRX3 signs: "CRX3 SignedData\x00" + length(signed_header_data) + signed_header_data + zip
// For simplicity, we use the older CRX2-compatible approach that Chrome still supports

// Actually, let's use CRX3 format properly
// The signed data protobuf contains the crx_id
// For now, build a simplified but valid CRX3

// Get the public key in DER format
const tmpPubKey = resolve(__dirname, "../.tmp-pub.der");
execSync(
  `openssl rsa -in "${pemPath}" -pubout -outform DER -out "${tmpPubKey}" 2>nul`,
);
const publicKeyDer = readFileSync(tmpPubKey);
execSync(`del "${tmpPubKey}"`);

// CRX ID is first 16 bytes of SHA-256 of the public key
const crxIdHash = createHash("sha256").update(publicKeyDer).digest();
const crxId = crxIdHash.subarray(0, 16);

// Build the signed_header_data protobuf (just contains crx_id)
// Field 1 (crx_id): bytes
function encodeVarint(val) {
  const bytes = [];
  while (val > 0x7f) {
    bytes.push((val & 0x7f) | 0x80);
    val >>>= 7;
  }
  bytes.push(val & 0x7f);
  return Buffer.from(bytes);
}

function encodeBytes(fieldNum, data) {
  const tag = (fieldNum << 3) | 2; // wire type 2 = length-delimited
  return Buffer.concat([encodeVarint(tag), encodeVarint(data.length), data]);
}

const signedHeaderData = encodeBytes(1, crxId);

// Build the data to sign
// "CRX3 SignedData\x00" + uint32le(signedHeaderData.length) + signedHeaderData + zip
const prefix = Buffer.from("CRX3 SignedData\x00");
const lenBuf = Buffer.alloc(4);
lenBuf.writeUInt32LE(signedHeaderData.length, 0);
const signedPayload = Buffer.concat([prefix, lenBuf, signedHeaderData, zipData]);

// Sign with RSA-SHA256
const sign = createSign("SHA256");
sign.update(signedPayload);
const signature = sign.sign(privateKey);

// Build AsymmetricKeyProof protobuf
// Field 1 (public_key): bytes
// Field 2 (signature): bytes
const asymKeyProof = Buffer.concat([
  encodeBytes(1, publicKeyDer),
  encodeBytes(2, signature),
]);

// Build SignedData protobuf
// Field 1 (algorithm): varint (1 = RSA)
// Actually CRX3 header format:
// CrxFileHeader {
//   sha256_with_rsa: repeated AsymmetricKeyProof (field 2)
//   signed_header_data: bytes (field 10000)
// }
const crxFileHeader = Buffer.concat([
  encodeBytes(2, asymKeyProof),
  encodeBytes(10000, signedHeaderData),
]);

// Build final CRX3 file
const magic = Buffer.from("Cr24");
const version = Buffer.alloc(4);
version.writeUInt32LE(3, 0);
const headerLen = Buffer.alloc(4);
headerLen.writeUInt32LE(crxFileHeader.length, 0);

const crxFile = Buffer.concat([
  magic,
  version,
  headerLen,
  crxFileHeader,
  zipData,
]);

writeFileSync(outPath, crxFile);
console.log(`Created ${outPath} (${crxFile.length} bytes)`);

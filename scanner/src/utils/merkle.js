/**
 * Merkle proof verification (matches Solidity _verifyMerkle).
 * Leaf = keccak256(abi.encodePacked(tokenId, owner, eventId))
 */
import { ethers } from 'ethers'

/**
 * Compute a leaf hash matching the contract:
 * keccak256(abi.encodePacked(tokenId, owner, eventId))
 */
export function computeLeaf(tokenId, owner, eventId) {
  return ethers.keccak256(
    ethers.concat([
      ethers.zeroPadValue(ethers.toBeHex(tokenId), 32),
      ethers.zeroPadValue(owner, 32),
      ethers.zeroPadValue(ethers.toBeHex(eventId), 32),
    ])
  )
}

/**
 * Verify a Merkle proof (matching Solidity _verifyMerkle).
 */
export function verifyMerkleProof(leaf, proof, root) {
  let computed = leaf
  for (const proofEl of proof) {
    const a = BigInt(computed)
    const b = BigInt(proofEl)
    if (a <= b) {
      computed = ethers.keccak256(ethers.concat([computed, proofEl]))
    } else {
      computed = ethers.keccak256(ethers.concat([proofEl, computed]))
    }
  }
  return computed.toLowerCase() === root.toLowerCase()
}

/**
 * Build a Merkle tree from an array of leaves.
 * Returns { root, tree } where tree[i] = level array.
 */
export function buildMerkleTree(leaves) {
  if (leaves.length === 0) return { root: ethers.ZeroHash, tree: [] }

  let level = leaves.map(l => l)

  // Pad to even if needed
  if (level.length % 2 !== 0) {
    level.push(level[level.length - 1])
  }

  const tree = [level]

  while (level.length > 1) {
    const next = []
    for (let i = 0; i < level.length; i += 2) {
      const a = level[i]
      const b = level[i + 1] || level[i]
      const a_bn = BigInt(a)
      const b_bn = BigInt(b)
      if (a_bn <= b_bn) {
        next.push(ethers.keccak256(ethers.concat([a, b])))
      } else {
        next.push(ethers.keccak256(ethers.concat([b, a])))
      }
    }
    tree.push(next)
    level = next
  }

  return { root: level[0], tree }
}

/**
 * Generate a proof for a leaf at given index in the tree.
 */
export function generateProof(tree, leafIndex) {
  const proof = []
  let idx = leafIndex

  for (let i = 0; i < tree.length - 1; i++) {
    const level = tree[i]
    const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1
    if (siblingIdx < level.length) {
      proof.push(level[siblingIdx])
    }
    idx = Math.floor(idx / 2)
  }

  return proof
}

/**
 * Verify a QR payload signature (ticket holder signed the QR).
 * Matches contract checkIn signature verification.
 */
export function verifyQRSignature(tokenId, owner, eventId, nonce, expiration, signature) {
  try {
    const msgHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'address', 'uint256', 'bytes32', 'uint256'],
        [tokenId, owner, eventId, nonce, expiration]
      )
    )
    const recovered = ethers.recoverAddress(
      ethers.hashMessage(ethers.getBytes(msgHash)),
      signature
    )
    return recovered.toLowerCase() === owner.toLowerCase()
  } catch {
    return false
  }
}

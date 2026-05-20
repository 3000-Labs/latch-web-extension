import { Asset, Address, xdr } from '@stellar/stellar-sdk'

const PASSPHRASE = 'Test SDF Network ; September 2015'
const RPC = 'https://soroban-testnet.stellar.org'
const nativeSac = Asset.native().contractId(PASSPHRASE)

function scValB64(val) {
  const bytes = new Uint8Array(val.toXDR())
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

async function rpc(method, params) {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  return res.json()
}

const transferSym = scValB64(xdr.ScVal.scvSymbol('transfer'))
const latest = (await rpc('getLatestLedger', {})).result.sequence
function decodeTopics(e) {
  return (e.topic ?? []).map((t) => {
    const v = xdr.ScVal.fromXDR(t, 'base64')
    if (v.switch() === xdr.ScValType.scvSymbol()) return v.sym().toString()
    if (v.switch() === xdr.ScValType.scvAddress()) return Address.fromScAddress(v.address()).toString()
    return v.switch().name
  })
}

// Paginate contract events and count transfer vs fee
let cursor = undefined
let transferCount = 0
let feeCount = 0
let transferSample = null
const start = latest - 20000
for (let page = 0; page < 10; page++) {
  const params = {
    startLedger: start,
    filters: [{ type: 'contract', contractIds: [nativeSac] }],
    pagination: { limit: 200, cursor },
  }
  const body = await rpc('getEvents', params)
  const events = body.result?.events ?? []
  if (events.length === 0) break
  for (const e of events) {
    const topics = decodeTopics(e)
    if (topics[0] === 'transfer') {
      transferCount++
      if (!transferSample) transferSample = { topics, tx: e.txHash }
    } else if (topics[0] === 'fee') feeCount++
  }
  cursor = body.result?.cursor
  if (!cursor) break
}
console.log({ transferCount, feeCount, transferSample })

const toAddr = transferSample?.topics[2]
const toVal = toAddr ? scValB64(new Address(toAddr).toScVal()) : null
for (const [name, topics] of [
  ['3t', [[transferSym], ['*'], ['*']]],
  ['4t', [[transferSym], ['*'], ['*'], ['*']]],
  ...(toVal ? [['4t_in_to', [[transferSym], ['*'], [toVal], ['*']]]] : []),
]) {
  const body = await rpc('getEvents', {
    startLedger: start,
    filters: [{ type: 'contract', contractIds: [nativeSac], topics }],
    pagination: { limit: 5 },
  })
  console.log(name, body.result?.events?.length ?? 0, body.error?.message?.slice(0, 80) ?? '')
}

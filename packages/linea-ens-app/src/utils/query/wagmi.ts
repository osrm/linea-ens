import { FallbackTransport, HttpTransport } from 'viem'
import { createConfig, createStorage, fallback, http } from 'wagmi'
import { localhost } from 'wagmi/chains'

import { lineaMainnetWithEns, lineaSepoliaWithEns, localhostWithEns } from '@app/constants/chains'
import { lineaMainnet } from '@app/constants/lineaMainnet'
import { lineaSepolia } from '@app/constants/lineaSepolia'

import { WC_PROJECT_ID } from '../constants'
import { getDefaultWallets } from '../getDefaultWallets'

const isLocalProvider = !!process.env.NEXT_PUBLIC_PROVIDER

const connectors = getDefaultWallets({
  appName: 'Linea ENS',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || WC_PROJECT_ID,
})

const infuraKey = process.env.NEXT_PUBLIC_INFURA_KEY || 'cfa6ae2501cc4354a74e20432507317c'
const tenderlyKey = process.env.NEXT_PUBLIC_TENDERLY_KEY || '4imxc4hQfRjxrVB2kWKvTo'

const infuraUrl = (chainName: string) => `https://${chainName}.infura.io/v3/${infuraKey}`
const cloudflareUrl = (chainName: string) => `https://web3.ens.domains/v1/${chainName}`
const tenderlyUrl = (chainName: string) => `https://${chainName}.gateway.tenderly.co/${tenderlyKey}`

type SupportedUrlFunc = typeof infuraUrl | typeof cloudflareUrl | typeof tenderlyUrl

const initialiseTransports = <const UrlFuncArray extends SupportedUrlFunc[]>(
  chainName: string,
  urlFuncArray: UrlFuncArray,
) => {
  const transportArray: HttpTransport[] = []

  for (const urlFunc of urlFuncArray) {
    // eslint-disable-next-line no-continue
    if (urlFunc === infuraUrl && process.env.NEXT_PUBLIC_IPFS) continue
    transportArray.push(http(urlFunc(chainName)))
  }

  return fallback(transportArray)
}

const prefix = 'wagmi'

const localStorageWithInvertMiddleware = (): Storage | undefined => {
  if (typeof window === 'undefined') return undefined
  const storage = window.localStorage
  const isMatchingKey = (key: string) => {
    if (!key.startsWith(prefix)) return false
    if (!key.endsWith('.disconnected')) return false
    return true
  }
  return {
    ...storage,
    getItem: (key_) => {
      if (!isMatchingKey(key_)) return storage.getItem(key_)

      const key = key_.replace('.disconnected', '.connected')
      const connectedStatus = storage.getItem(key)
      return connectedStatus ? null : 'true'
    },
    removeItem: (key_) => {
      if (!isMatchingKey(key_)) return storage.removeItem(key_)

      const key = key_.replace('.disconnected', '.connected')
      storage.setItem(key, 'true')
    },
    setItem: (key_, value) => {
      if (!isMatchingKey(key_)) return storage.setItem(key_, value)

      const key = key_.replace('.disconnected', '.connected')
      storage.removeItem(key)
    },
  }
}

const chains = [
  ...(isLocalProvider ? ([localhostWithEns] as const) : ([] as const)),
  lineaMainnetWithEns,
  lineaSepoliaWithEns,
] as const

const wagmiConfig_ = createConfig({
  connectors,
  ssr: true,
  multiInjectedProviderDiscovery: true,
  batch: {
    multicall: {
      batchSize: 8196,
      wait: 50,
    },
  },
  storage: createStorage({ storage: localStorageWithInvertMiddleware(), key: prefix }),
  chains,
  transports: {
    ...(isLocalProvider
      ? ({
          [localhost.id]: http(process.env.NEXT_PUBLIC_PROVIDER!) as unknown as FallbackTransport,
        } as const)
      : ({} as unknown as {
          // this is a hack to make the types happy, dont remove pls
          [localhost.id]: HttpTransport
        })),

    [lineaMainnet.id]: initialiseTransports('linea-mainnet', [infuraUrl]),
    [lineaSepolia.id]: initialiseTransports('linea-sepolia', [infuraUrl]),
  },
})

const isSupportedChain = (chainId: number): chainId is (typeof chains)[number]['id'] =>
  chains.some((c) => c.id === chainId)

// hotfix for wagmi bug
wagmiConfig_.subscribe(
  ({ connections, current }) => (current ? connections.get(current)?.chainId : undefined),
  (chainId_) => {
    const chainId = chainId_ || chains[0].id
    // If chain is not configured, then don't switch over to it.
    const isChainConfigured = isSupportedChain(chainId)
    if (!isChainConfigured) return

    return wagmiConfig_.setState((x) => ({
      ...x,
      chainId: chainId ?? x.chainId,
    }))
  },
)

export const wagmiConfig = wagmiConfig_ as typeof wagmiConfig_ & {
  _isEns: true
}

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}

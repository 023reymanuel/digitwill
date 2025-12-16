import { createConfig, http } from 'wagmi';
import { sepolia, hardhat } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';

export const config = createConfig({
  chains: [sepolia, hardhat],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
  connectors: [metaMask()],
});
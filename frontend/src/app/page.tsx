'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">
                  🏛️ Digital Will Vault
                </h1>
              </div>
            </div>
            <ConnectButton />
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
            Secure Your Digital Legacy
          </h1>
          <p className="text-lg leading-8 text-gray-600 mb-8">
            Appoint trusted guardians to release your encrypted documents and passwords
            when you're no longer able to. Built on Ethereum for maximum security.
          </p>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Test Wallet Connection</h2>
            <p className="mb-6 text-gray-600">
              Click the Connect Wallet button above to test if your Web3 setup is working.
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
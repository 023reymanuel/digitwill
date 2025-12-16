// Remove the problematic import - just use what you need
import { describe, it } from "node:test";
import { expect } from "chai";
import { network } from "hardhat";

// Connect to network
const { viem, networkHelpers } = await network.connect();

describe("WillVaultOZ", function () {
    async function deployWillVaultFixture() {
        const [owner, guardian1, guardian2, guardian3, nonGuardian] = 
            await viem.getWalletClients();
        
        const willVault = await viem.deployContract("WillVaultOZ", [
            [guardian1.account.address, guardian2.account.address, guardian3.account.address],
            2n
        ]);
        
        return {
            willVault,
            owner: owner.account,
            guardian1: guardian1.account,
            guardian2: guardian2.account,
            guardian3: guardian3.account,
            nonGuardian: nonGuardian.account,
        };
    }
    
    // SIMPLE TEST FIRST
    it("Should deploy successfully", async function () {
        const { willVault } = await networkHelpers.loadFixture(deployWillVaultFixture);
        expect(willVault.address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
});
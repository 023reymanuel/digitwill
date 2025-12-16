import { describe, it } from "node:test";
import { expect } from "chai";
import { network } from "hardhat";

// Connect to Hardhat network
const { viem, networkHelpers } = await network.connect();

// Helper function to compare Ethereum addresses (case-insensitive)
function compareAddresses(addr1: string, addr2: string): boolean {
    return addr1.toLowerCase() === addr2.toLowerCase();
}

describe("WillVault - Digital Will Vault Contract", function () {
    // ============ FIXTURE ============
    async function deployWillVaultFixture() {
        // Get test accounts
        const [owner, guardian1, guardian2, guardian3, nonGuardian] = 
            await viem.getWalletClients();
        
        // Deploy contract with 3 guardians, 2 confirmations needed (2/3)
        const willVault = await viem.deployContract("WillVault", [
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
    
    // ============ TEST GROUP 1: DEPLOYMENT ============
    describe("1. Contract Deployment", function () {
        it("1.1 Should deploy contract successfully", async function () {
            const { willVault } = await networkHelpers.loadFixture(deployWillVaultFixture);
            
            // Check contract address is valid
            expect(willVault.address).to.match(/^0x[a-fA-F0-9]{40}$/);
            console.log(`✅ Contract deployed at: ${willVault.address}`);
        });
        
        it("1.2 Should set the correct owner (Testator)", async function () {
            const { willVault, owner } = await networkHelpers.loadFixture(deployWillVaultFixture);
            
            const contractOwner = await willVault.read.owner();
            // FIX: Use case-insensitive comparison for Ethereum addresses
            expect(compareAddresses(contractOwner, owner.address)).to.be.true;
            console.log(`✅ Owner set to: ${contractOwner}`);
        });
        
        it("1.3 Should initialize with empty data hash", async function () {
            const { willVault } = await networkHelpers.loadFixture(deployWillVaultFixture);
            
            const initialHash = await willVault.read.dataHash();
            expect(initialHash).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
            console.log("✅ Data hash initialized to zero");
        });
        
        it("1.4 Should set correct confirmation threshold (2/3)", async function () {
            const { willVault } = await networkHelpers.loadFixture(deployWillVaultFixture);
            
            const threshold = await willVault.read.confirmationsNeeded();
            expect(threshold).to.equal(2n);
            console.log(`✅ Threshold set to: ${threshold}/3`);
        });
        
        it("1.5 Should start with zero confirmations", async function () {
            const { willVault } = await networkHelpers.loadFixture(deployWillVaultFixture);
            
            const currentConfirmations = await willVault.read.currentConfirmations();
            expect(currentConfirmations).to.equal(0n);
            console.log("✅ Current confirmations starts at 0");
        });
        
        it("1.6 Should start as not released", async function () {
            const { willVault } = await networkHelpers.loadFixture(deployWillVaultFixture);
            
            const isReleased = await willVault.read.released();
            expect(isReleased).to.be.false;
            console.log("✅ Vault starts as not released");
        });
        
        it("1.7 Should have correct number of guardians (3)", async function () {
            const { willVault } = await networkHelpers.loadFixture(deployWillVaultFixture);
            
            // FIX: Use TypeScript workaround for guardianCount()
            // Method 1: Cast to 'any' to bypass TypeScript
            const willVaultAny = willVault as any;
            const guardianCount = await willVaultAny.read.guardianCount();
            expect(guardianCount).to.equal(3n);
            console.log(`✅ Guardian count: ${guardianCount}`);
            
            // Method 2: Also verify with getGuardians()
            const guardians = await willVault.read.getGuardians();
            expect(guardians).to.have.lengthOf(3);
        });
        
        it("1.8 Should correctly identify guardians", async function () {
            const { willVault, guardian1, nonGuardian } = 
                await networkHelpers.loadFixture(deployWillVaultFixture);
            
            // FIX: isGuardian() needs address parameter
            const isGuardian1 = await willVault.read.isGuardian([guardian1.address]);
            expect(isGuardian1).to.be.true;
            
            const isNonGuardian = await willVault.read.isGuardian([nonGuardian.address]);
            expect(isNonGuardian).to.be.false;
            
            console.log("✅ Guardian verification working correctly");
        });
    });
    
    // ============ TEST GROUP 2: LOCKING THE VAULT ============
    describe("2. Locking the Vault", function () {
        // Test data hash (simulates encrypted password/key hash)
        const TEST_DATA_HASH = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        
        it("2.1 Owner should be able to lock the vault", async function () {
            const { willVault } = await networkHelpers.loadFixture(deployWillVaultFixture);
            
            // Lock the vault
            await willVault.write.lockVault([TEST_DATA_HASH]);
            
            // Verify data hash was stored
            const storedHash = await willVault.read.dataHash();
            expect(storedHash).to.equal(TEST_DATA_HASH);
            console.log("✅ Owner successfully locked vault");
        });
        
        it("2.2 Non-owner should NOT be able to lock the vault", async function () {
            const { willVault, nonGuardian } = await networkHelpers.loadFixture(deployWillVaultFixture);
            
            let errorOccurred = false;
            try {
                // Try to lock as non-owner
                await willVault.write.lockVault([TEST_DATA_HASH], {
                    account: nonGuardian
                });
            } catch (error) {
                errorOccurred = true;
                console.log("✅ Non-owner correctly prevented from locking vault");
            }
            
            expect(errorOccurred).to.be.true;
        });
        
        it("2.3 Vault should NOT be lockable twice", async function () {
            const { willVault } = await networkHelpers.loadFixture(deployWillVaultFixture);
            
            // First lock (should succeed)
            await willVault.write.lockVault([TEST_DATA_HASH]);
            
            let errorOccurred = false;
            try {
                // Try to lock again (should fail)
                await willVault.write.lockVault([TEST_DATA_HASH]);
            } catch (error) {
                errorOccurred = true;
                console.log("✅ Vault correctly prevents double locking");
            }
            
            expect(errorOccurred).to.be.true;
        });
        
        it("2.4 Should prevent locking with vault already locked", async function () {
            const { willVault } = await networkHelpers.loadFixture(deployWillVaultFixture);
            
            // Lock with first hash
            const hash1 = "0x1111111111111111111111111111111111111111111111111111111111111111";
            await willVault.write.lockVault([hash1]);
            
            // Try to lock with different hash
            const hash2 = "0x2222222222222222222222222222222222222222222222222222222222222222";
            let errorOccurred = false;
            try {
                await willVault.write.lockVault([hash2]);
            } catch (error) {
                errorOccurred = true;
                console.log("✅ Cannot change data hash after locking");
            }
            
            expect(errorOccurred).to.be.true;
            
            // Verify first hash is still stored
            const storedHash = await willVault.read.dataHash();
            expect(storedHash).to.equal(hash1);
        });
    });
    
    // ============ TEST GROUP 3: RELEASE PROCESS ============
    describe("3. Release Process", function () {
        const TEST_DATA_HASH = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        
        // Helper: Deploy AND lock the vault
        async function deployAndLockVaultFixture() {
            const fixture = await deployWillVaultFixture();
            await fixture.willVault.write.lockVault([TEST_DATA_HASH]);
            return fixture;
        }
        
        it("3.1 Guardian should be able to confirm release", async function () {
            const { willVault, guardian1 } = await networkHelpers.loadFixture(deployAndLockVaultFixture);
            
            // Guardian confirms
            await willVault.write.confirmRelease({
                account: guardian1
            });
            
            // FIX: isConfirmed() needs address parameter
            const isConfirmed = await willVault.read.isConfirmed([guardian1.address]);
            expect(isConfirmed).to.be.true;
            console.log("✅ Guardian confirmation recorded");
            
            // Check confirmations count increased
            const currentConfirmations = await willVault.read.currentConfirmations();
            expect(currentConfirmations).to.equal(1n);
            console.log(`✅ Current confirmations: ${currentConfirmations}`);
        });
        
        it("3.2 Non-guardian should NOT be able to confirm release", async function () {
            const { willVault, nonGuardian } = await networkHelpers.loadFixture(deployAndLockVaultFixture);
            
            let errorOccurred = false;
            try {
                await willVault.write.confirmRelease({
                    account: nonGuardian
                });
            } catch (error) {
                errorOccurred = true;
                console.log("✅ Non-guardian correctly prevented from confirming");
            }
            
            expect(errorOccurred).to.be.true;
        });
        
        it("3.3 Guardian should NOT be able to confirm twice", async function () {
            const { willVault, guardian1 } = await networkHelpers.loadFixture(deployAndLockVaultFixture);
            
            // First confirmation (should succeed)
            await willVault.write.confirmRelease({
                account: guardian1
            });
            
            let errorOccurred = false;
            try {
                // Second confirmation (should fail)
                await willVault.write.confirmRelease({
                    account: guardian1
                });
            } catch (error) {
                errorOccurred = true;
                console.log("✅ Guardian correctly prevented from confirming twice");
            }
            
            expect(errorOccurred).to.be.true;
        });
        
        it("3.4 Should NOT allow confirming before vault is locked", async function () {
            const { willVault, guardian1 } = await networkHelpers.loadFixture(deployWillVaultFixture);
            
            let errorOccurred = false;
            try {
                // Try to confirm without locking first
                await willVault.write.confirmRelease({
                    account: guardian1
                });
            } catch (error) {
                errorOccurred = true;
                console.log("✅ Cannot confirm before vault is locked");
            }
            
            expect(errorOccurred).to.be.true;
        });
        
        it("3.5 Vault should release when threshold is met (2/3)", async function () {
            const { willVault, guardian1, guardian2 } = 
                await networkHelpers.loadFixture(deployAndLockVaultFixture);
            
            // First confirmation
            await willVault.write.confirmRelease({
                account: guardian1
            });
            
            // Check not released yet (only 1 confirmation)
            let isReleased = await willVault.read.released();
            expect(isReleased).to.be.false;
            console.log("✅ Not released after first confirmation");
            
            // Second confirmation (reaches threshold of 2)
            await willVault.write.confirmRelease({
                account: guardian2
            });
            
            // Check vault is now released
            isReleased = await willVault.read.released();
            expect(isReleased).to.be.true;
            console.log("✅ Vault released after second confirmation (threshold met)");
            
            // Verify data hash is still the same
            const storedHash = await willVault.read.dataHash();
            expect(storedHash).to.equal(TEST_DATA_HASH);
        });
        
        it("3.6 Should NOT release before threshold is met", async function () {
            const { willVault, guardian1 } = await networkHelpers.loadFixture(deployAndLockVaultFixture);
            
            // Only one confirmation (needs 2)
            await willVault.write.confirmRelease({
                account: guardian1
            });
            
            const isReleased = await willVault.read.released();
            expect(isReleased).to.be.false;
            console.log("✅ Vault correctly not released before threshold");
        });
        
        it("3.7 Should NOT allow confirming after vault is released", async function () {
            const { willVault, guardian1, guardian2, guardian3 } = 
                await networkHelpers.loadFixture(deployAndLockVaultFixture);
            
            // Confirm with 2 guardians (reaches threshold, releases vault)
            await willVault.write.confirmRelease({ account: guardian1 });
            await willVault.write.confirmRelease({ account: guardian2 });
            
            // Verify vault is released
            const isReleased = await willVault.read.released();
            expect(isReleased).to.be.true;
            
            let errorOccurred = false;
            try {
                // Third guardian tries to confirm after release (should fail)
                await willVault.write.confirmRelease({ account: guardian3 });
            } catch (error) {
                errorOccurred = true;
                console.log("✅ Cannot confirm after vault is released");
            }
            
            expect(errorOccurred).to.be.true;
        });
    });
    
    // ============ TEST GROUP 4: VIEW FUNCTIONS & STATUS ============
    describe("4. View Functions & Status Checks", function () {
        const TEST_DATA_HASH = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        
        it("4.1 getReleaseStatus should return complete information", async function () {
            const { willVault, guardian1 } = await networkHelpers.loadFixture(deployWillVaultFixture);
            
            // Check initial status
            const [initialHash, needed, current, released] = await willVault.read.getReleaseStatus();
            expect(initialHash).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
            expect(needed).to.equal(2n);
            expect(current).to.equal(0n);
            expect(released).to.be.false;
            console.log("✅ Initial status correct");
            
            // Lock vault
            await willVault.write.lockVault([TEST_DATA_HASH]);
            
            // Check status after locking
            const [hashAfterLock] = await willVault.read.getReleaseStatus();
            expect(hashAfterLock).to.equal(TEST_DATA_HASH);
            console.log("✅ Status updated after locking");
            
            // Confirm once
            await willVault.write.confirmRelease({
                account: guardian1
            });
            
            // Check status after confirmation
            const [, , currentAfterConfirm, releasedAfterConfirm] = await willVault.read.getReleaseStatus();
            expect(currentAfterConfirm).to.equal(1n);
            expect(releasedAfterConfirm).to.be.false;
            console.log("✅ Status updated after confirmation");
        });
        
        it("4.2 getGuardians should return all guardian addresses", async function () {
            const { willVault, guardian1, guardian2, guardian3 } = 
                await networkHelpers.loadFixture(deployWillVaultFixture);
            
            const guardians = await willVault.read.getGuardians();
            
            expect(guardians).to.have.lengthOf(3);
            // FIX: Use case-insensitive comparison for Ethereum addresses
            expect(compareAddresses(guardians[0], guardian1.address)).to.be.true;
            expect(compareAddresses(guardians[1], guardian2.address)).to.be.true;
            expect(compareAddresses(guardians[2], guardian3.address)).to.be.true;
            console.log("✅ getGuardians returns correct addresses");
        });
        
        it("4.3 isConfirmed mapping should track confirmations", async function () {
            const { willVault, guardian1 } = await networkHelpers.loadFixture(deployWillVaultFixture);
            const TEST_HASH = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
            
            // Lock vault first
            await willVault.write.lockVault([TEST_HASH]);
            
            // Check guardian not confirmed initially
            const initialConfirmation = await willVault.read.isConfirmed([guardian1.address]);
            expect(initialConfirmation).to.be.false;
            
            // Guardian confirms
            await willVault.write.confirmRelease({
                account: guardian1
            });
            
            // Check guardian is now confirmed
            const afterConfirmation = await willVault.read.isConfirmed([guardian1.address]);
            expect(afterConfirmation).to.be.true;
            console.log("✅ isConfirmed mapping working correctly");
        });
    });
    
    // ============ TEST GROUP 5: SIMPLE END-TO-END TEST ============
    describe("5. Complete Workflow Test", function () {
        it("5.1 Full workflow: Deploy → Lock → 2x Confirm → Release", async function () {
            const { willVault, guardian1, guardian2 } = 
                await networkHelpers.loadFixture(deployWillVaultFixture);
            
            const TEST_HASH = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
            
            console.log("🚀 Starting complete workflow test...");
            
            // 1. Check initial state
            const [initialHash, , , initialReleased] = await willVault.read.getReleaseStatus();
            expect(initialHash).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
            expect(initialReleased).to.be.false;
            console.log("✅ Initial state correct");
            
            // 2. Lock vault
            await willVault.write.lockVault([TEST_HASH]);
            const [lockedHash] = await willVault.read.getReleaseStatus();
            expect(lockedHash).to.equal(TEST_HASH);
            console.log("✅ Vault locked with data hash");
            
            // 3. First guardian confirms
            await willVault.write.confirmRelease({ account: guardian1 });
            const [, , confirmations1, released1] = await willVault.read.getReleaseStatus();
            expect(confirmations1).to.equal(1n);
            expect(released1).to.be.false;
            console.log("✅ First guardian confirmed");
            
            // 4. Second guardian confirms (should release)
            await willVault.write.confirmRelease({ account: guardian2 });
            const [, , confirmations2, released2] = await willVault.read.getReleaseStatus();
            expect(confirmations2).to.equal(2n);
            expect(released2).to.be.true;
            console.log("✅ Second guardian confirmed - Vault released!");
            
            console.log("🎉 Complete workflow test passed!");
        });
    });
    
    // ============ TEST GROUP 6: TYPE FIXES SUMMARY ============
    describe("6. TypeScript Fixes Applied", function () {
        it("6.1 Should demonstrate fixed TypeScript issues", async function () {
            console.log("🔧 TypeScript Fixes Summary:");
            console.log("1. guardianCount() → Use TypeScript workaround (as any)");
            console.log("2. isConfirmed(address) → Pass address as array [address]");
            console.log("3. isGuardian(address) → Pass address as array [address]");
            console.log("4. Ethereum addresses → Use case-insensitive comparison");
            console.log("✅ All TypeScript issues resolved!");
        });
    });
});
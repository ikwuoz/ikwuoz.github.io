---
title: "A Guide to Extending ERC-2535 Diamonds"
description: "An introduction to the EIP-2535 Diamond Standard for upgradeable smart contracts and a walkthrough of extending it to support deterministic upgrade rollbacks."
pubDate: 2023-03-22
tags:
  - solidity
  - erc2535
  - upgradeability
  - smartcontracts
draft: false
---

In this article, I introduce the Diamond standard for writing upgradeable smart contracts and walk through how it can be extended to add support for rollback upgrades.

## Prerequisites

- Understanding of Ethereum and smart contracts.
- Experience with Solidity.
- Basic terminal skills, plus Hardhat and [Foundry](https://book.getfoundry.sh/getting-started/installation) installed.

## Brief Introduction to Diamonds

[EIP-2535](https://eips.ethereum.org/EIPS/eip-2535) defines the Diamond standard as:

> A modular smart contract system that can be upgraded/extended after deployment, and has virtually no size limit. More technically, a diamond is a contract with external functions that are supplied by contracts called facets. Facets are separate, independent contracts that can share internal functions, libraries, and state variables.

What makes the Diamond standard shine is the clear separation of concerns baked into it from the ground up. This is made possible through **facets**—smart contracts that group related logic together. The default Diamond implementation used in this article includes three core facets:

1. `DiamondCutFacet` — Primarily concerned with performing upgrade-related logic on the Diamond.
2. `DiamondLoupeFacet` — Primarily concerned with introspection into the Diamond.
3. `OwnershipFacet` — Primarily concerned with ownership, admin, and access-control logic on the Diamond.

Onto the most important component: **the Diamond** itself—the proxy smart contract that holds the state of the entire system and exposes the methods of its facets via [`delegatecall`](https://docs.soliditylang.org/en/v0.8.19/introduction-to-smart-contracts.html#delegatecall-and-libraries).

To follow along in your preferred IDE, clone the [Diamond-With-Rollback repository](https://github.com/nuel-ikwuoma/Diamond-With-Rollback) and follow the README to install the dependencies.

## Tracking the State of the Diamond

The Diamond in this demonstration uses the **diamond storage** pattern, declaring the Diamond's state inside a [storage struct](https://github.com/nuel-ikwuoma/Diamond-With-Rollback/blob/main/contracts/libraries/LibDiamond.sol#L44). A Solidity library function returns a storage pointer to that struct ([`diamondStorage()`](https://github.com/nuel-ikwuoma/Diamond-With-Rollback/blob/main/contracts/libraries/LibDiamond.sol#L61)):

```solidity
function diamondStorage() internal pure returns (DiamondStorage storage ds) {
    bytes32 position = DIAMOND_STORAGE_POSITION;
    assembly {
        ds.slot := position
    }
}
```

This struct is anchored in storage at the hash of a [unique string](https://github.com/nuel-ikwuoma/Diamond-With-Rollback/blob/main/contracts/libraries/LibDiamond.sol#L24), effectively preventing storage slot collisions. [`LibDiamond`](https://github.com/nuel-ikwuoma/Diamond-With-Rollback/blob/main/contracts/libraries/LibDiamond.sol) defines the core data structures and logic shared among facets, upholding the principle that facets can share internal functions and libraries.

### How Upgrades Are Accomplished

In Diamond terminology, an upgrade is synonymous with a **cut**. [`DiamondCutFacet`](https://github.com/nuel-ikwuoma/Diamond-With-Rollback/blob/main/contracts/facets/DiamondCutFacet.sol) implements `diamondCut` to execute cuts, while the [`FacetCut`](https://github.com/nuel-ikwuoma/Diamond-With-Rollback/blob/main/contracts/interfaces/IDiamondCut.sol#L13) struct models the parameters of each upgrade:

```solidity
struct FacetCut {
    address facetAddress;
    FacetCutAction action;
    bytes4[] functionSelectors;
}
```

### How Can We Roll Back an Upgrade?

First, we define a custom [`RollBackCuts`](https://github.com/nuel-ikwuoma/Diamond-With-Rollback/blob/main/contracts/libraries/LibDiamond.sol#L38) struct to record the inverse operation needed to undo a cut:

```solidity
struct RollBackCuts {
    address[] facetAddress;
    IDiamondCut.FacetCutAction action;
    bytes4[] functionSelectors;
}
```

Next, we append a `RollBackCuts[]` array to `DiamondStorage` and push an entry on every upgrade to the Diamond—specifically when adding, replacing, or removing function selectors ([add](https://github.com/nuel-ikwuoma/Diamond-With-Rollback/blob/main/contracts/libraries/LibDiamond.sol#L132), [replace](https://github.com/nuel-ikwuoma/Diamond-With-Rollback/blob/main/contracts/libraries/LibDiamond.sol#L168), and [remove](https://github.com/nuel-ikwuoma/Diamond-With-Rollback/blob/main/contracts/libraries/LibDiamond.sol#L197)):

```solidity
struct DiamondStorage {
    // maps function selector to the facet address and
    // the position of the selector in the facetFunctionSelectors.selectors array
    mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition;
    // maps facet addresses to function selectors
    mapping(address => FacetFunctionSelectors) facetFunctionSelectors;
    // facet addresses
    address[] facetAddresses;
    // Used to query if a contract implements an interface.
    // Used to implement ERC-165.
    mapping(bytes4 => bool) supportedInterfaces;
    // owner of the contract
    address contractOwner;
    // history for rollback
    RollBackCuts[] rollbackCuts;
}
```

We also define a sentinel constant address, `ROLLBACK_ADDRESS`, inside `LibDiamond`:

```solidity
address constant ROLLBACK_ADDRESS = 0x000000000000000000000000000000000000bEEF;
```

This constant distinguishes a rollback execution from a normal upgrade, preventing duplicate rollback entries from accumulating on repeated rollbacks. Additionally, [`ROLLBACK_ADDRESS`](https://github.com/nuel-ikwuoma/Diamond-With-Rollback/blob/main/contracts/libraries/LibDiamond.sol#L259) suppresses initializer execution during a rollback.

With storage tracking in place, we implement `rollback()` on `DiamondCutFacet`:

```solidity
function rollback() external override {
    // enforce is contract owner
    LibDiamond.enforceIsContractOwner();
    LibDiamond.RollBackCuts[] storage rollbackCuts = LibDiamond.diamondStorage().rollbackCuts;
    uint256 rollbackCutsLength = rollbackCuts.length;
    if (rollbackCutsLength == 0) {
        revert NoRollBackAction();
    }
    LibDiamond.RollBackCuts memory rollbackCut = rollbackCuts[rollbackCutsLength - 1];
    // remove last rollback action
    rollbackCuts.pop();
    uint256 cutLength = rollbackCut.facetAddress.length;
    IDiamondCut.FacetCut[] memory facetCut = new IDiamondCut.FacetCut[](
        cutLength
    );
    for (uint i = 0; i < cutLength; ++i) {
        bytes4[] memory rollbackSelector = new bytes4[](1);
        rollbackSelector[0] = rollbackCut.functionSelectors[i];

        facetCut[i] = IDiamondCut.FacetCut(
            rollbackCut.facetAddress[i],
            rollbackCut.action,
            rollbackSelector
        );
    }
    LibDiamond.diamondCut(
        facetCut,
        LibDiamond.ROLLBACK_ADDRESS,
        ""
    );
}
```

`rollback()` verifies contract ownership, checks that a recorded rollback entry exists, pops the latest `RollBackCuts` entry, reconstructs the inverse `FacetCut[]` array, and applies it via `LibDiamond.diamondCut` with `LibDiamond.ROLLBACK_ADDRESS`.

## Extending the Diamond Constructor

Next, we update the `Diamond` constructor to register the `rollback` selector alongside `diamondCut` ([`Diamond.sol#L29`](https://github.com/nuel-ikwuoma/Diamond-With-Rollback/blob/main/contracts/Diamond.sol#L29)):

```solidity
constructor(address _contractOwner, address _diamondCutFacet) payable {
    LibDiamond.setContractOwner(_contractOwner);

    // Add the diamondCut external function from the diamondCutFacet
    IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
    bytes4[] memory functionSelectors = new bytes4[](2);
    functionSelectors[0] = IDiamondCut.diamondCut.selector;
    // Add the rollback external function from the diamondCutFacet
    functionSelectors[1] = IDiamondCut.rollback.selector;

    cut[0] = IDiamondCut.FacetCut({
        facetAddress: _diamondCutFacet,
        action: IDiamondCut.FacetCutAction.Add,
        functionSelectors: functionSelectors
    });

    LibDiamond.diamondCut(cut, address(0), "");
}
```

## Testing and Verification

With the core changes in place, we validate the behavior in [`testRollback.t.sol`](https://github.com/nuel-ikwuoma/Diamond-With-Rollback/blob/main/test/testRollback.t.sol). Compile and run the test suite from your terminal:

```bash
npx hardhat compile
```

```bash
forge test
```

The test suite deploys the Diamond, performs an upgrade, executes a rollback, and verifies that selectors and state revert cleanly—extending an ERC-2535 Diamond with deterministic rollback support.

Explore the full implementation in the [Diamond-With-Rollback repository](https://github.com/nuel-ikwuoma/Diamond-With-Rollback). Originally published on [DEV](https://dev.to/nuel_ikwuoma/a-guide-to-extending-erc2535-diamonds-37a4).

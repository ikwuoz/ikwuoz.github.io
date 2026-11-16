---
title: "Using Clones to Build and Cheaply Deploy Contracts on CELO at Scale"
description: "This tutorial introduces the clones (minimal proxy) approach, which is a gas-efficient alternative to the more expensive basic factory pattern for deploying contracts on CELO."
pubDate: 2023-04-24
tags:
  - solidity
  - celo
  - ERC20
  - advanced
  - celosage
draft: false
---

## Introduction

The cost of deploying smart contracts on the blockchain is mostly proportional to the size of the runtime bytecode that ends up being stored on-chain. This is detailed in the Ethereum Yellow Paper and is true for all EVM-compatible blockchains, for which CELO is no exception.

In this article, I present a practical approach for deploying contracts on-chain with minimal runtime bytecode, reducing deployment cost significantly. To drive the point home, I will compare the gas cost of this approach with the commonly used Factory pattern so we can verify the results directly. Remember: don't trust, verify!

## Prerequisites

In order to fully grasp the lessons from this tutorial, you should possess:

- A good understanding of Solidity and how libraries work.
- Familiarity navigating the Remix IDE.

## The Clones Factory

1. The Clones Factory is also referred to in certain contexts as a **Minimal Proxy**. First, an implementation contract is defined, stripped of its constructor, and deployed to an address. The primary responsibility of this implementation contract is to define the bytecode containing the logic to be shared by the clones via `delegatecall`.
2. The clone contracts are then deployed with the address of the implementation contract embedded in their bytecode. Calls to each clone are delegated to that implementation contract. By crafting clone bytecode containing only the implementation address and the minimal instruction set that prepares and executes `delegatecall`, the deployed bytecode is drastically smaller—making clones cheap to deploy.

## Graphical Illustration on Clones

![Clones pattern illustration](/blog/celo-clones/clone.png "Clones pattern illustration")

Two things to note from the diagram above:

1. The dotted lines indicate that each clone is linked to an implementation contract by specifying the implementation's address in its bytecode.
2. The arrow lines indicate that calls to the clones are delegated to this implementation. There can be as many clones as needed—there is no limit here.

## Code Walkthrough

We will make use of the Remix IDE for this session. Open Remix in a separate tab and create a new directory—you can name it anything you like, I called mine `clones`.

Next, we will leverage the modern ERC20 contract from this [Maple repository](https://github.com/maple-labs/erc20/blob/main/contracts/ERC20.sol). Create a file in your new Remix folder named `ERC20.sol` and copy over the contract from this [gist](https://gist.github.com/nuel-ikwuoma/36f8eef7dfc9aecc21a2bf4fd4ff1d50), which I slightly modified for this tutorial. Rename the contract to `MyToken` and update the import on Line 4 to point to the absolute URL below:

```solidity
import "https://github.com/maple-labs/erc20/blob/main/contracts/interfaces/IERC20.sol";
```

This URL points to the interface our contract implements. At this stage, our token contract is ERC20-compatible and has a constructor that looks like this:

```solidity
constructor(string memory name_, string memory symbol_, uint8 decimals_) {
   name     = name_;
   symbol   = symbol_;
   decimals = decimals_;
}
```

The constructor is the most important part to adapt when making a contract compatible with clones (minimal proxies). Since clones delegate calls to the `MyToken` implementation, we cannot rely on a constructor—it executes only once when the implementation itself is deployed. However, each clone maintains its own independent state and needs a way to initialize that state upon deployment.

To achieve this, we replace the constructor with an `initialize` function that is called immediately after deploying each clone:

```solidity
function initialize(string memory name_, string memory symbol_, uint8 decimals_) external {
   name     = name_;
   symbol   = symbol_;
   decimals = decimals_;
}
```

Now we proceed to define our clones factory contract. Create a new file named `TokenClone.sol` and populate it with the following:

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.14;


import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/proxy/Clones.sol";


import "./ERC20.sol";


contract MinimalClone {
   using Clones for address;


   MyToken implementation;

   address[] myTokens;


   constructor() {
       implementation = new MyToken();
   }


   function cloneToken(string memory _name, string memory _symbol, uint8 _decimals) external {
       address myToken = address(implementation).clone();
       MyToken(myToken).initialize(_name, _symbol, _decimals);
       myTokens.push(myToken);
   }


   function getToken(uint256 _tokenId) external view returns(string memory name, string memory symbol) {
       name = MyToken(myTokens[_tokenId]).name();
       symbol = MyToken(myTokens[_tokenId]).symbol();
   }
}
```

Here we use the [OpenZeppelin Clones library](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/proxy/Clones.sol) to create and deploy minimal proxy instances. Each cloned token maintains independent storage just as if it had been deployed by a standard factory.

We attach the `Clones` library functions to Solidity's `address` type with:

```solidity
using Clones for address;
```

In the constructor, we deploy the `MyToken` implementation contract and store its reference in `implementation`. Then `cloneToken` takes the token metadata arguments, creates a minimal proxy via `address(implementation).clone()`, invokes `initialize(...)` on the newly deployed clone, and records its address in `myTokens`.

Compile the contract using `Ctrl/Cmd + S` and deploy `MinimalClone`:

![Clones deployment](/blog/celo-clones/deploy-clone.png "Clones deployment")

Under the deployed contract section, call `cloneToken` to deploy a new token clone:

![Calling cloned contracts](/blog/celo-clones/clone-call.png "Calling cloned contracts")

Inspecting the transaction gas cost:

![Clones gas cost](/blog/celo-clones/clone-gas.png "Clones gas cost")

The transaction costs roughly **185K gas** to deploy a token clone contract. In the next section we will compare this directly with a basic factory pattern.

Verify the deployed token by calling `getToken` with `_tokenId` set to `0`:

![Verify cloned contract call](/blog/celo-clones/clone-verify.png "Verify cloned contract call")

You can call `cloneToken` multiple times with different arguments and query `getToken` for each index to confirm every clone maintains its own isolated state.

## Gas Cost Comparison: Clones vs. Basic Factory

To demonstrate how much cheaper clone deployments are compared to standard factories, I created `TokenFactory.sol` (adapted from the CeloSage factory pattern guide). Because a basic factory relies on `new MyToken(...)` directly, `MyToken` is reverted back to using its original `constructor`:

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.14;


import "./ERC20.sol";


contract TokenFactory {
   MyToken[] public tokens;


   function createToken(string memory _name, string memory _symbol, uint8 _decimals) external {
       tokens.push(new MyToken(_name, _symbol, _decimals));
   }


   function getToken(uint256 _tokenId) external view returns(string memory name, string memory symbol) {
       name = tokens[_tokenId].name();
       symbol = tokens[_tokenId].symbol();
   }
}
```

Deploy `TokenFactory` and invoke `createToken` to measure the gas cost:

![Basic factory gas cost](/blog/celo-clones/factory-gas.png "Basic factory gas cost")

Deploying through the basic factory costs around **1.2 million gas**—making the minimal clones approach roughly **7x cheaper** per deployment, with savings compounding across every additional token deployed.

| Minimal Clones | Basic Factory |
|---|---|
| ~185k gas | ~1.2 million gas |

## Use Cases

Clones can be applied anywhere the Factory pattern is used at scale, including:

1. Deploying exchange token pairs on a decentralized exchange.
2. Creating custom ERC20 or ERC721 tokens on demand for large numbers of users.

Reducing per-instance deployment cost directly lowers onboarding and interaction costs for users.

## Optimization

Eagle-eyed readers might have noticed that deploying `MyToken` inside the `MinimalClone` constructor can be skipped altogether if a verified implementation contract already exists on-chain—simply point `implementation` to that pre-deployed address to save deployment gas on the factory itself.

## Conclusion

Whenever multiple instances of the same contract need to be deployed at scale, the clones (minimal proxy) pattern is the right tool—drastically cutting deployment gas costs across your protocol.

## Resources

- [EIP-1167 — Minimal Proxy Contract](https://eips.ethereum.org/EIPS/eip-1167)
- [Contract Deployment with Factory Pattern](https://docs.celo.org/blog/tutorials/how-to-build-and-deploy-factory-contracts-on-celo#factory-contract-use-cases)
- [Maple-labs Modern ERC20](https://github.com/maple-labs/erc20/blob/main/contracts/ERC20.sol)
- [Source Code](https://github.com/nuel-ikwuoma/minimal-proxies)
- Originally published to [Celo Docs (PR #975)](https://github.com/celo-org/docs/pull/975)

---
title: "A Guide to Building and Deploying Upgradeable Contracts on CELO with Diamond Standard"
description: "This tutorial introduces the diamond standard for writing modular and upgradeable smart contracts, and gives a brief walkthrough of how to build an upgradeable ERC20 token compatible contract, deploy to CELO, and perform an upgrade to this contract."
pubDate: 2023-05-01
tags:
  - solidity
  - celo
  - ERC20
  - advanced
  - celosage
draft: false
---

The Diamond Standard was articulated in [EIP-2535](https://eips.ethereum.org/EIPS/eip-2535) and clearly defines a pathway for deploying multi-facet smart contracts that are modular, extensible, and upgradeable.

## Introduction

In this tutorial, I introduce the diamond standard for writing modular and upgradeable smart contracts, and give a brief walkthrough of how to build an upgradeable ERC20 token compatible contract, deploy to CELO, and perform an upgrade to the contract on-chain.

## Prerequisites

This tutorial is quite advanced and assumes a good understanding of the Solidity language, the ERC-20 standard, and some familiarity with the JavaScript language. You should also be comfortable with using a Terminal application.

## Requirements

The following tooling should be pre-installed for the code walkthrough:

- Make sure to have NodeJS >=12.0.1+ installed and optionally yarn.
- You need to install [Foundry](https://book.getfoundry.sh/getting-started/installation).

## Getting Started

I would like to introduce some key terminologies we might encounter often in this tutorial.

1. **Upgradeable smart contracts:** These are contracts generally split into proxy contracts (which house the state of the contract) and implementation contracts (which define the logic of the contract). These contracts are often upgraded by adding new state to the system or deploying new implementation contracts.
2. **Diamond Standard:** This is a standard for writing upgradeable and modular contracts, as defined by [EIP-2535](https://eips.ethereum.org/EIPS/eip-2535). Upgradeable contracts conforming to this specification comprise a Diamond (which is a proxy contract holding the data of the system) and facets (which are contracts that define the implementation logic). It is worth knowing that the Diamond performs calls to these facets using the low-level EVM `delegatecall`.

## Setup

For this code demo, we are going to be using this [template](https://github.com/Timidan/Foundry-Hardhat-Diamonds), which is purpose-built for Diamond contracts and also has some nice helpers for tests and deployment. Another useful feature of this template is the built-in mix for Foundry and Hardhat support in the same codebase.

To get started with the template, simply follow the instructions on the README and run the following commands in your preferred terminal of choice:

```bash
> git clone https://github.com/Timidan/Foundry-Hardhat-Diamonds ERC20-Diamond
> yarn
> forge update
```

> Do not type the **>** in your terminal—I have used it to represent your prompt symbol, which could vary depending on which Terminal program you use.

Optionally, you might have to run this command for the `ds-test` library from dapphub if you encounter an error during testing:

```bash
> forge install dapphub/ds-test
```

Now you should have an `ERC20-Diamond` directory created. `cd` into this directory and open it in your preferred editor.

## Code Walkthrough

![Diamond setup](/blog/celo-diamond/diamond-imp.png "Diamond setup")

As you already know by now, this template ships with a pre-built implementation of the Diamond standard from which we can build on. Below are some of the files that are important for this walkthrough:

- `DiamondCutFacet`: This contract houses the logic to perform upgrades on the Diamond.
- `DiamondTokenFacet`: As you might have guessed from the name, this is the contract where we define our ERC20 token implementation logic.
- `LibAppStorage`: This initializes and defines the storage structure necessary for the ERC20 implementation.
- `LibERC20`: This library houses helper logic related to ERC20 operations called from the `DiamondTokenFacet` above.
- `DiamondInit`: This is where any necessary initialization procedure is performed when deploying the Diamond.
- `Diamond`: This is the main proxy contract that enshrines all the data of our contract system and delegates calls to our implementation facets.

With that out of the way, let us proceed to writing our ERC20 token implementation that is upgradeable.

## Code Implementation

We proceed with the implementation in a series of steps, gradually building out our ERC20 token contract to conform to the [EIP-20](https://eips.ethereum.org/EIPS/eip-20) token standard.

First we define `LibAppStorage.sol` in the libraries folder, which holds our storage struct using the AppStorage pattern of Diamonds. This struct holds the necessary data related to an ERC20 token implementation. A nice feature of using the AppStorage pattern is that it allows state to be shared easily between facets. You can read more about this pattern [here](https://dev.to/mudgen/appstorage-pattern-for-state-variables-in-solidity-3lki).

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct TokenStorage {
   uint256 initialized;
   uint256 totalSupply;
   mapping(address => uint256) balances;
   mapping(address => mapping(address => uint256)) allowances;
}

library LibAppStorage {
   function tokenStorage() internal pure returns(TokenStorage storage ts) {
       assembly {
           ts.slot := 0
       }
   }
}
```

We then proceed to define the library `LibERC20.sol`, which hosts the methods for `approve` and `transfer` logic, performing the necessary state changes on the `TokenStorage` struct previously defined in the `LibAppStorage.sol` library.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {TokenStorage} from "./LibAppStorage.sol";

library LibERC20 {
   error InvalidAddress();
   error InsufficientBalance();

   event Transfer(address indexed _from, address indexed _to, uint256 _value);
   event Approval(address indexed _owner, address indexed _spender, uint256 _value);

   function transfer(TokenStorage storage ts, address _from, address _to, uint256 _value) internal {
       if(_from == address(0)) revert InvalidAddress();
       if(_to == address(0)) revert InvalidAddress();
       if(ts.balances[_from] < _value) revert InsufficientBalance();

       unchecked {
           ts.balances[_from] -= _value;
           ts.balances[_to] += _value;
       }

       emit Transfer(_from, _to, _value);
   }


   function approve(TokenStorage storage ts, address _owner, address _spender, uint256 _value) internal {
       if(_owner == address(0)) revert InvalidAddress();
       if(_spender == address(0)) revert InvalidAddress();

       ts.allowances[_owner][_spender] += _value;

       emit Approval(_owner, _spender, _value);
   }
}
```

Moving on, we now implement the main facet that conforms with the EIP20 token standard, defining all the necessary functionalities required for this standard. We name this facet `DiamondTokenFacet.sol`. Below is the implementation:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {TokenStorage} from "../libraries/LibAppStorage.sol";
import {LibERC20} from "../libraries/LibERC20.sol";

import "../interfaces/IERC20.sol";

error InsufficientAllowance();
contract DiamondTokenFacet is IERC20 {
   TokenStorage s;

   /// @notice returns the name of the token.
   function name() external pure override returns(string memory) {
       return "Diamond Token";
   }

   /// @notice returns the symbol of the token.
   function symbol() external pure override returns(string memory) {
       return "DTKN";
   }

   /// @notice returns the token decimals.
   function decimals() external pure override returns(uint8) {
       return 18;
   }

   /// @notice returns the token total supply.
   function totalSupply() external view override returns(uint256) {
       return s.totalSupply;
   }

   /// @notice returns the balance of an address.
   function balanceOf(address _owner) external view override returns (uint256 balance) {
       balance = s.balances[_owner];
   }

   /// @notice transfers `_value` token from `caller` to `_to`.
   function transfer(address _to, uint256 _value) external override returns (bool success) {
       LibERC20.transfer(s, msg.sender, _to, _value);
       success = true;
   }

   /// @notice transfers `_value` tokens, from `_from` to `_to`.
   /// @dev   `caller` must be initially approved.
   function transferFrom(address _from, address _to, uint256 _value) external override returns (bool success) {

       uint256 _allowance = s.allowances[_from][msg.sender];
       if(_allowance < _value) revert InsufficientAllowance();

       LibERC20.transfer(s, _from, _to, _value);
       unchecked {
           s.allowances[_from][msg.sender] -= _value;
       }

       success = true;
   }

   /// @notice approves `_spender` for `_value` tokens, owned by caller.
   function approve(address _spender, uint256 _value) external override returns (bool success) {
       LibERC20.approve(s, msg.sender, _spender, _value);
       success = true;
   }

   /// @notice gets the allowance for spender `_spender` by the owner `_owner`
   function allowance(address _owner, address _spender) external override view returns (uint256 remaining) {
       remaining = s.allowances[_owner][_spender];
   }
}
```

Most of the functions defined here should be familiar to you if you have encountered an ERC20 token implementation before in the wild, or built one yourself. Here we can see how this facet utilizes the functions in the library `LibERC20` and the `TokenStorage` struct. It is important to note that the `TokenStorage` struct must be the first storage slot for facets using this storage pattern—this was agreed from the `LibAppStorage` implementation, and failure to do so might lead to storage clashes. Other than that, we are good to go.

All that is left for this initial version, which we will call v1 moving forward, is the initialization logic for the token. We would like to perform initialization when deploying the token, like setting the total supply. Thankfully the `DiamondInit.sol` contract was built into the standard specifically for this, so we proceed to this file which lives inside the `upgradeInitializers` folder and add customizations to the `init` function.

First we import the `TokenStorage` struct, which is stored in the first slot since we are using the AppStorage pattern:

```solidity
import {LibDiamond} from "../libraries/LibDiamond.sol";
import {TokenStorage} from "../libraries/LibAppStorage.sol";
import { IDiamondLoupe } from "../interfaces/IDiamondLoupe.sol";
import { IDiamondCut } from "../interfaces/IDiamondCut.sol";
import { IERC173 } from "../interfaces/IERC173.sol";
import { IERC165 } from "../interfaces/IERC165.sol";
```

Next, we define a custom error on L22 to guard multiple initialization calls, then add the logic for our initialization starting from L38:

```solidity
error AlreadyInitialized();


contract DiamondInit {
   TokenStorage s;

   // You can add parameters to this function in order to pass in
   // data to set your own state variables
   function init() external {
       // adding ERC165 data
       LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
       ds.supportedInterfaces[type(IERC165).interfaceId] = true;
       ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
       ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
       ds.supportedInterfaces[type(IERC173).interfaceId] = true;


       // initialize the token contract
       if(s.initialized == 1) revert AlreadyInitialized();
       s.totalSupply = 1_000_000e18;
       s.initialized = 1;
   }
}
```

Now that we have everything necessary for v1 of our contract, we can proceed to write tests for it.

We rename the default file in the test directory to `testDiamondToken` and write the tests. First we add our imports for the `DiamondTokenFacet` and `DiamondInit` contracts:

```solidity
import "../contracts/facets/OwnershipFacet.sol";
import "../contracts/facets/DiamondTokenFacet.sol";
import "../contracts/upgradeInitializers/DiamondInit.sol";
import "../contracts/Diamond.sol";


import "forge-std/Test.sol";
```

Next we add the definitions for both `DiamondTokenFacet` and `DiamondInit` contracts:

```solidity
contract DiamondDeployer is Test, IDiamondCut {
   //contract types of facets to be deployed
   Diamond diamond;
   DiamondCutFacet dCutFacet;
   DiamondLoupeFacet dLoupe;
   OwnershipFacet ownerF;
   DiamondTokenFacet tokenF;
   DiamondInit dInit;
```

Now we define the `setUp` function, which initializes and deploys all the facets and contracts defined previously, including the Diamond. Inside `setUp`, we also define the `FacetCut` adding `DiamondTokenFacet` where the logic of our ERC20 Token implementation lives. Eagle-eyed readers might notice the `generateSelectors` internal function, which computes the `bytes4` selector IDs of functions defined in the contracts passed to it as an argument.

```solidity
function setUp() public {
       //deploy facets
       dCutFacet = new DiamondCutFacet();
       diamond = new Diamond(address(this), address(dCutFacet));
       dLoupe = new DiamondLoupeFacet();
       ownerF = new OwnershipFacet();
       tokenF = new DiamondTokenFacet();
       dInit = new DiamondInit();

       //upgrade diamond with facets

       //build cut struct
       FacetCut[] memory cut = new FacetCut[](4);

       cut[0] = (
           FacetCut({
               facetAddress: address(dLoupe),
               action: FacetCutAction.Add,
               functionSelectors: generateSelectors("DiamondLoupeFacet")
           })
       );

       cut[1] = (
           FacetCut({
               facetAddress: address(ownerF),
               action: FacetCutAction.Add,
               functionSelectors: generateSelectors("OwnershipFacet")
           })
       );

       cut[2] = (
           FacetCut({
               facetAddress: address(tokenF),
               action: FacetCutAction.Add,
               functionSelectors: generateSelectors("DiamondTokenFacet")
           })
       );

       cut[3] = (
           FacetCut({
               facetAddress: address(dInit),
               action: FacetCutAction.Add,
               functionSelectors: generateSelectors("DiamondInit")
           })
       );

       //upgrade diamond
       IDiamondCut(address(diamond)).diamondCut(cut, address(0x0), "");

       //Initialization
       DiamondInit(address(diamond)).init();
   }
```

With setup out of the way, we now write the test for our ERC20 token implementation:

```solidity
function testDiamondToken() public {
       string memory name = DiamondTokenFacet(address(diamond)).name();
       string memory symbol = DiamondTokenFacet(address(diamond)).symbol();
       uint256 totalSupply = DiamondTokenFacet(address(diamond)).totalSupply();


       assertEq(name, "Diamond Token");
       assertEq(symbol, "DTKN");
       assertEq(totalSupply, 1_000_000e18);
   }


   // multiple initialization should fail
   function testMultipleInitialize() public {
       vm.expectRevert(AlreadyInitialized.selector);
       DiamondInit(address(diamond)).init();
   }
```

Here we wrap our Diamond's address in `DiamondTokenFacet`, call `name`, `symbol`, and `totalSupply`, and assert that we get the expected results. We run the test from our terminal with:

```bash
> forge test --match-test testDiamondToken
```

Sample test output below shows that our test passes:

![Initial test output](/blog/celo-diamond/image-1.png "Initial test")

We have just built an upgradeable smart contract using the Diamond standard and verified that it works as expected. Now let us upgrade these contracts and verify the upgrade works on-chain.

First we define the upgrade we intend to accomplish, which for this guide is changing the `name` and `symbol` of our contract.

> Fun fact: The CELO Token was initially deployed under the name `Celo Gold`. Since the re-branding of the platform, the name "Celo" has been generally adopted for this native token contract. However, calling the contract on chain still returns the old name `Celo Gold`.

Our goal here is to upgrade the name and symbol for our contract to `"Diamond Token V2"` and `"DTKN V2"` respectively.

### Defining and Testing the Upgrade

First, we define `NameFacet` in the facets directory containing the logic for this upgrade:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract NameFacet {
   function name() external pure returns(string memory) {
       return "Diamond Token V2";
   }


   function symbol() external pure returns(string memory) {
       return "DTKN V2";
   }
}
```

Next we head to our test file to write and test the upgrade logic, importing the facet contract file:

```solidity
import "../contracts/facets/NameFacet.sol";
```

Then declaring this facet in the deployer contract:

```solidity
contract DiamondDeployer is Test, IDiamondCut {
   //contract types of facets to be deployed
   Diamond diamond;
   DiamondCutFacet dCutFacet;
   DiamondLoupeFacet dLoupe;
   OwnershipFacet ownerF;
   DiamondTokenFacet tokenF;
   DiamondInit dInit;


   // NameFacet used for upgrade.
   NameFacet nameF;
```

```solidity
function testNameFacetUpgrade() public {
       address _diamond = address(diamond);
       nameF = new NameFacet();


       FacetCut[] memory cut = new FacetCut[](1);
       cut[0] = (
           FacetCut({
               facetAddress: address(nameF),
               action: FacetCutAction.Replace,
               functionSelectors: generateSelectors("NameFacet")
           })
       );
       // replace function selectors
       IDiamondCut(_diamond).diamondCut(cut, address(0), "");
       string memory name = DiamondTokenFacet(_diamond).name();
       string memory symbol = DiamondTokenFacet(_diamond).symbol();


       assertEq(name, "Diamond Token V2");
       assertEq(symbol, "DTKN V2");
   }
```

In `testNameFacetUpgrade`, we instantiate `NameFacet`, define a `FacetCut` using `FacetCutAction.Replace`, cut (upgrade) the Diamond, and verify `name` and `symbol` return the updated values. Run the test with:

```bash
> forge test --match-test testNameFacetUpgrade
```

From the test output below, the test passes with our expected results:

![NameFacet upgrade test output](/blog/celo-diamond/image-2.png "NameFacet upgrade")

## Deploying and Upgrading on CELO

Now let us deploy the Diamond to the CELO blockchain using the Alfajores testnet (similar configuration works for mainnet as well).

We first write our deployment logic in `scripts/deploy/00_deploy_diamond_token.js`:

```javascript
const hre = require('hardhat')
const fs = require('fs')
const path = require('path')
const { getSelectors, FacetCutAction } = require('../libraries/diamond.js')
const { ethers } = require('hardhat')


async function deployDiamond() {
 const accounts = await ethers.getSigners()
 const contractOwner = accounts[0]


 // deploy DiamondCutFacet
 const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
 const diamondCutFacet = await DiamondCutFacet.deploy()
 await diamondCutFacet.deployed()
 console.log('DiamondCutFacet deployed:', diamondCutFacet.address)


 // deploy Diamond
 const Diamond = await ethers.getContractFactory('Diamond')
 const diamond = await Diamond.deploy(
   contractOwner.address,
   diamondCutFacet.address,
 )
 await diamond.deployed()
 const diamondAddress = diamond.address
 console.log('Diamond deployed:', diamondAddress)
 const file = path.join(__dirname, '../deploymentAddresses.json' )
 const addresses = JSON.parse(fs.readFileSync(file))
 fs.writeFileSync(file, JSON.stringify({...addresses, [hre.network.name]: diamondAddress }))

 const DiamondInit = await ethers.getContractFactory('DiamondInit')
 const diamondInit = await DiamondInit.deploy()
 await diamondInit.deployed()
 console.log('DiamondInit deployed:', diamondInit.address)


 // deploy facets
 console.log('')
 console.log('Deploying facets')
 const FacetNames = ['DiamondLoupeFacet', 'OwnershipFacet', 'DiamondTokenFacet']
 const cut = []
 for (const FacetName of FacetNames) {
   const Facet = await ethers.getContractFactory(FacetName)
   const facet = await Facet.deploy()
   await facet.deployed()
   console.log(`${FacetName} deployed: ${facet.address}`)
   cut.push({
     facetAddress: facet.address,
     action: FacetCutAction.Add,
     functionSelectors: getSelectors(facet),
   })
 }


 // upgrade diamond with facets
 console.log('')
 console.log('Diamond Cut:', cut)
 const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress)
 let tx
 let receipt
 // call to init function
 let functionCall = diamondInit.interface.encodeFunctionData('init')
 tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall)
 console.log('Diamond cut tx: ', tx.hash)
 receipt = await tx.wait()
 if (!receipt.status) {
   throw Error(`Diamond upgrade failed: ${tx.hash}`)
 }
 console.log('Completed diamond cut')
 return diamondAddress
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
 deployDiamond()
   .then(() => process.exit(0))
   .catch((error) => {
     console.error(error)
     process.exit(1)
   })
}

exports.deployDiamond = deployDiamond
```

Now update `hardhat.config.js` in the root directory:

```javascript
require("@nomiclabs/hardhat-waffle");
require('dotenv').config({path: '.env'});
require('hardhat-deploy');

// Prints the Celo accounts associated with the mnemonic in .env
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
 const accounts = await hre.ethers.getSigners();


 for (const account of accounts) {
   console.log(account.address);
 }
});


/**
* @type import('hardhat/config').HardhatUserConfig
*/
require('@nomiclabs/hardhat-ethers')
module.exports = {
 defaultNetwork: "alfajores",
 networks: {
   hardhat: {
   },
   localhost: {
       url: "http://127.0.0.1:8545"
   },
   alfajores: {
     url: "https://alfajores-forno.celo-testnet.org",
     accounts: {
       mnemonic: process.env.MNEMONIC,
       path: "m/44'/52752'/0'/0"
     },
     chainId: 44787
   },
   celo: {
     url: "https://forno.celo.org",
     accounts: {
       mnemonic: process.env.MNEMONIC,
       path: "m/44'/52752'/0'/0"
     },
     chainId: 42220
   },
 },
 solidity: '0.8.4',
}
```

This configuration covers both Alfajores and CELO mainnet deployment. Before deploying, create a `.env` file in the project root with your `MNEMONIC` key-value pair, and make sure `.env` is listed in `.gitignore` so your seed phrase is never committed.

I also created `deploymentAddresses.json` in the `scripts` directory to track current deployment addresses across networks (for production projects, consider [hardhat-deploy](https://github.com/wighawag/hardhat-deploy/), which supports Diamond deployments out of the box). Install `dotenv` if needed:

```bash
yarn add dotenv
```

Deploy to the Alfajores testnet:

```bash
> npx hardhat run scripts/deploy/00_deploy_diamond_token.js --network alfajores
```

![Deploy output 1](/blog/celo-diamond/image-3.png "Sample deploy output")
![Deploy output 2](/blog/celo-diamond/image-4.png "Sample deploy output")

The deployment transaction succeeded, and the Diamond was deployed at **`0xa34118b22b675e8Ceb00eb2c96a0AE02DD6719bE`** and recorded in `deploymentAddresses.json`.

We can now query our deployed Diamond Token contract on-chain with `scripts/callTokenFunctions.js`:

```javascript
const fs = require('fs')
const path = require('path')


async function main() {
   const network = hre.network.name
   const file = path.join(__dirname, 'deploymentAddresses.json')
   const diamondAddress = JSON.parse(fs.readFileSync(file))[network]

   const token = await hre.ethers.getContractAt("DiamondTokenFacet", diamondAddress);

   const name = await token.name();
   const symbol = await token.symbol();
   const totalSupply = await token.totalSupply();

   console.log("Token name:", name);
   console.log("Token symbol:", symbol);
   console.log("Token total supply:", totalSupply);
}

main()
   .then(() => process.exit(0))
   .catch((error) => {
       console.error(error);
       process.exit(1);
   });
```

Run it from the terminal:

```bash
> npx hardhat run scripts/callTokenFunctions.js --network alfajores
```

![Diamond call output](/blog/celo-diamond/image-5.png "Sample output of call to Diamond")

Our contract is now live on-chain with the initial name and symbol.

Next, upgrade this contract to the new name and symbol using `scripts/upgradeToken.js`:

```javascript
const fs = require('fs')
const path = require('path')
const { getSelectors, FacetCutAction } = require("./libraries/diamond")
const { ethers } = require('hardhat')


async function upgradeToken() {
   const zeroAddress = ethers.constants.AddressZero
   const accounts = await ethers.getSigners()
   const contractOwner = accounts[0]

   const network = hre.network.name
   const file = path.join(__dirname, 'deploymentAddresses.json')
   const diamondAddress = JSON.parse(fs.readFileSync(file))[network]
   const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
   diamondCutFacet.connect(contractOwner)

   const facetName = 'NameFacet'
   const NameFacet = await ethers.getContractFactory(facetName)
   const nameFacet = await NameFacet.deploy()
   await nameFacet.deployed()

   console.log(`${facetName} deployed at: ${nameFacet.address}`)

   const cut = [{
       facetAddress: nameFacet.address,
       action: FacetCutAction.Replace,
       functionSelectors: getSelectors(nameFacet),
   }]

   let tx = await diamondCutFacet.diamondCut(cut, zeroAddress, [])
   let receipt = await tx.wait()
   if (!receipt.status) {
       throw Error(`Diamond upgrade failed: ${tx.hash}`)
     }
   console.log('Completed diamond upgrade')
}


if (require.main === module) {
   upgradeToken()
     .then(() => process.exit(0))
     .catch((error) => {
       console.error(error)
       process.exit(1)
     })
 }
  exports.upgradeToken = upgradeToken
```

Run the upgrade script:

```bash
> npx hardhat run scripts/upgradeToken.js --network alfajores
```

![Upgrade Diamond output](/blog/celo-diamond/image-6.png "Diamond upgrade output")

Now verify the upgrade on-chain by re-running `callTokenFunctions.js`:

![Call to upgraded Diamond output](/blog/celo-diamond/image-7.png "Call to upgraded Diamond")

## Conclusion

Congratulations on making it to the end of this article—this should give you a solid foundation for using the Diamond standard in your next smart contract project.

## Next Steps

You can extend this project by adding more facets—for example, a facet for mint and burn logic, batch transfers and approvals, or custom governance hooks. Find the code repository [here](https://github.com/nuel-ikwuoma/ERC20-Diamond).


Originally published to [Celo Docs (PR #865)](https://github.com/celo-org/docs/pull/865).

## References

- [EIP-2535](https://eips.ethereum.org/EIPS/eip-2535)
- [Diamond Substack](https://eip2535diamonds.substack.com/)

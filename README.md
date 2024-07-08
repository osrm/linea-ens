# Linea ENS

This repository contains smart contracts and a Node.js Gateway server that allow storing ENS names on Linea using [EIP 3668](https://eips.ethereum.org/EIPS/eip-3668) and [ENSIP 10](https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution).
They have been adapted from ENS's [EVM gateway](https://github.com/ensdomains/evmgateway) and [ENS crosschain resolver](https://github.com/ensdomains/ens-evmgateway/tree/master/crosschain-resolver)

It also contain a frontend adapted from [ENS's frontend](https://github.com/ensdomains/ens-app-v3) to interact with the deployed contract, to create and manage domains on Linea.

Thanks to ccip-read the domains created on Linea can also be resolved on Ethereum.

## CCIPRead process

![alt text](./media/LineaENSCCIPRead.png?raw=true)

This schema describes how a client application can resolve a domain name stored on Linea L2 from Ethereum L1 using CCIP Read.

## Generic Usage

This repository focuses on the ENS use case but the gateway and Verifier contracts are generic, this means that they can be reused for any other use cases
that need to fetch data stored on Linea from Ethereum in a trustless way.

The same Fetcher, Verifier contracts and gateway can be used without redeploying them.

To implement your own contract you simply need to:

1.  Have your own contract extend `EVMFetcher` (In the Linea ENS case this is the L1Resolver contract).
2.  In a view/pure context, use `EVMFetcher` to fetch the value of slots from another contract stored on Linea. Calling `EVMFetcher.fetch()` terminates execution and generates a callback to the same contract on a function you specify.
3.  In the callback function, use the information from the relevant slots as you see fit.

## Example

The example below fetches another contract's storage value `testUint`.

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { EVMFetcher } from '@ensdomains/evm-verifier/contracts/EVMFetcher.sol';
import { EVMFetchTarget } from '@ensdomains/evm-verifier/contracts/EVMFetchTarget.sol';
import { IEVMVerifier } from '@ensdomains/evm-verifier/contracts/IEVMVerifier.sol';

contract TestL2 {
    uint256 testUint; // Slot 0

    constructor() {
        testUint = 42;
    }
}

contract TestL1 is EVMFetchTarget {
    using EVMFetcher for EVMFetcher.EVMFetchRequest;

    IEVMVerifier verifier;
    address target;

    constructor(IEVMVerifier _verifier, address _target) {
        verifier = _verifier;
        target = _target;
    }

    function getTestUint() public view returns(uint256) {
        EVMFetcher.newFetchRequest(verifier, target)
            .getStatic(0)
            .fetch(this.getSingleStorageSlotCallback.selector, "");
    }

    function getSingleStorageSlotCallback(bytes[] memory values, bytes memory) public pure returns(uint256) {
        return uint256(bytes32(values[0]));
    }
}
```

## Requirements

- NodeJs v18.x.
- pnpm v9.x
- yarn for the linea-ens-contracts package only

## Packages

### linea-ens-resolver

The linea-ens-resolver contract intented to be deployed on L1 that is built on top of [linea-state-verifier](./packages/packages/linea-state-verifier) and verifies Linea ENS data (domain names, metadata etc).

More documentation available in [linea-ens-resolver/README.md](./packages/linea-ens-resolver/README.md)

### linea-ens-contracts

The linea-ens-contracts contracts intented to be deployed on L2 (Linea) stores and returns the data necessary to resolve a domain name and more data related to ENS.

More documentation available in [linea-ens-contracts/README.md](./packages/linea-ens-contracts/README.md)

### linea-ccip-gateway

A node-based gateway server that answers queries from L1 Gateway function calls relating to Linea-based L2 contracts.

### linea-ens-app

The Linea ENS frontend adapted from [ens-app-v3](https://github.com/ensdomains/ens-app-v3)

### linea-ens-subgraph

The Linea ENS subgrah consumed by the frontend, adapted from [ens-subgraph](https://github.com/ensdomains/ens-subgraph)

### linea-state-verifier

The linea state verifier contracts are responsible for checking values using sparse merkle proofs returned by the linea-ccip-gateway for specific slots values stored on Linea, adapted from [evm-verifier](https://github.com/ensdomains/evmgateway/tree/main/evm-verifier)

### poh-signer-api

A NestJS API responsible for signing a message aknowledging an address has passed the POH process, the signature created is then checked by the PohVerifier contract in the linea-ens-contracts.

## Deployed contracts

Check the deployment folders in [./packages/linea-ens-resolver/deployments](./packages/linea-ens-resolver/deployments) and [./packages/linea-ens-contracts/deployments](./packages/linea-ens-contracts/deployments)

For detailed information about each package, please check their own Readme file.

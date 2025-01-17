"use client";
import { useNetwork } from 'wagmi'

import { Constants } from "@/shared/constants";
import { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  useContractEvent,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";
import Button from "../ui/Button";
import { useRouter } from "next/navigation";
import { formatEther } from "viem";
import Link from "next/link";
import { useAxiomCircuit } from '@axiom-crypto/react';

import { getContract } from 'viem'

export default function DegenMembershipClient({
  membershipAbi,
}: {
  membershipAbi: any[],
}) {
  // const [{ data, error, loading }, switchNetwork] = useNetwork()

  const { address } = useAccount();
  const router = useRouter();
  const { axiom, builtQuery, payment } = useAxiomCircuit();
  const [showExplorerLink, setShowExplorerLink] = useState(false);

  const axiomQueryAbi = axiom.getAxiomQueryAbi();
  const axiomQueryAddress = "0xBd5307B0Bf573E3F2864Af960167b24Aa346952b";//axiom.getAxiomQueryAddress();

  const claimParams = [
    builtQuery?.sourceChainId,
    builtQuery?.dataQueryHash,
    builtQuery?.computeQuery,
    builtQuery?.callback,
    builtQuery?.userSalt,
    builtQuery?.maxFeePerGas,
    builtQuery?.callbackGasLimit,
    address,
    builtQuery?.dataQuery
  ];

  // Prepare hook for the sendQuery transaction
  // const axiomContract = getContract({
  //   abi: axiomQueryAbi,
  //   address: axiomQueryAddress as `0x${string}`,
    
  // })

  const { config } = usePrepareContractWrite({
    address: axiomQueryAddress as `0x${string}`,
    abi: axiomQueryAbi,
    functionName: 'sendQuery',
    args: claimParams,
    value: BigInt(payment ?? 0),
  });
  
  const { data, isLoading, isSuccess, isError, write } = useContractWrite(config);

  console.log('write', write)

  // TODO listen to an event checking hyperlan cross chain success or not


  // Check that the user has not claimed the airdrop yet
  /* const { data: hasClaimed, isLoading: hasClaimedLoading } = useContractRead({
    address: Constants.GOERLI_MEMBERSHIP_ADDR as `0x${string}`,
    abi: membershipAbi,
    functionName: 'hasClaimed',
    args: [address],
  });
  console.log("hasClaimed?", hasClaimed); */

  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        setShowExplorerLink(true);
      }, 30000);
    }
  }, [isSuccess, setShowExplorerLink]);

  const proofGeneratedAction = useCallback(() => {
    router.push(`/success/?address=${address}`);
  }, [router, address]);

  const proofValidationFailedAction = useCallback(() => {
    if (isError) {
      // router.push(`fail/?address=${address}`);
    }
  }, [isError, router, address]);

  // Monitor contract for `ClaimAirdrop` or `ClaimAirdropError` events
  // useContractEvent({
  //   address: Constants.GOERLI_MEMBERSHIP_ADDR as `0x${string}`,
  //   abi: membershipAbi,
  //   eventName: 'ClaimAirdrop',
  //   listener(log) {
  //     proofGeneratedAction();
  //   },
  // });

  // useContractEvent({
  //   address: Constants.AUTO_AIRDROP_ADDR as `0x${string}`,
  //   abi: abi,
  //   eventName: 'ClaimAirdropError',
  //   listener(log) {
  //     console.log("Claim airdrop error");
  //     console.log(log);
  //     proofValidationFailedAction();
  //   },
  // });

  const renderButtonText = () => {
    /* if (isSuccess) {z
      return "Waiting for callback...";
    }
    if (isLoading) {
      return "Confrm transaction in wallet...";
    }
    if (!!hasClaimed) {
      return "Airdrop already claimed"
    } */
    return "Degen";
  }

  // const renderClaimProofText = () => {
  //   return `Generating the proof for the claim costs ${formatEther(BigInt(payment ?? 0)).toString()}ETH`;
  // }

  const renderExplorerLink = () => {
    if (!showExplorerLink) {
      return null;
    }
    return (
      <Link href={`https://explorer.axiom.xyz/v2/goerli/mock`} target="_blank">
        View status on Axiom Explorer
      </Link>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        disabled={isLoading || isSuccess || !write }
        onClick={() => {
          if (!write) return;
          write()
          router.push(`/success/?address=${address}`);
        }}
      >
        {'Open Credit Account'}
      </Button>
      <div className="flex flex-col items-center text-sm gap-2">
        <div>
          {isSuccess ?? "Proof generation may take up to 3 minutes"}
        </div>
        {renderExplorerLink()}
      </div>
    </div>
  )
}

"use client";
import { TbCopy } from "react-icons/tb";
import { useAccount, useChainId } from "wagmi";
import { FiLogOut } from "react-icons/fi";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { fadeIn } from "@/utils/anim";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { formatUnits, parseUnits } from "viem";
import getWalletTokens from "./walletTokens";
import { TokenBalances } from "@/lib/interface";

const PortfolioData = () => {
  const { open, close } = useWeb3Modal();
  const chainId = useChainId();
  const { address, disconnect } = useAccount();
  const [toggleHistory, setToggleHistory] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<TokenBalances[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyAddr = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  }, [address]);

  const handleLogout = useCallback(() => {
    disconnect?.();
  }, [disconnect]);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!address || !chainId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const balances = await getWalletTokens(chainId, address);
        setTokenBalances(balances);
      } catch (err) {
        setError('Failed to fetch token balances');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [chainId, address]);

  return (
    <motion.section
      initial={fadeIn.initial}
      animate={fadeIn.animate}
      transition={fadeIn.transition}
      className="pt-[115px] md:min-w-[300px] max-w-[1000px] mx-auto mb-[50px]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full border" />
          <div>
            <h3 className="font-light">My Account</h3>
            <div className="flex items-center gap-2">
              <p className="font-bold text-xl">
                {address ? `${address.slice(0, 4)}...${address.slice(-6)}` : '-'}
              </p>
              <TbCopy
                onClick={copyAddr}
                className="active:text-mainFG text-xl cursor-pointer"
              />
            </div>
          </div>
        </div>

        <FiLogOut 
          onClick={handleLogout}
          className="text-2xl cursor-pointer lg:hover:text-mainFG" 
        />
      </div>

      <nav className="mt-4 md:mt-6 mb-4">
        <div className="flex items-center">
          <TabButton 
            active={!toggleHistory} 
            onClick={() => setToggleHistory(false)}
            label="Portfolio"
          />
          <TabButton 
            active={toggleHistory} 
            onClick={() => setToggleHistory(true)}
            label="History"
          />
        </div>
      </nav>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : toggleHistory ? (
        <History />
      ) : (
        <WalletTokens tokenBalances={tokenBalances} />
      )}
    </motion.section>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

const TabButton = ({ active, onClick, label }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-1 border-b-2 ${
      active ? "border-white" : "border-transparent"
    }`}
  >
    {label}
  </button>
);

interface WalletTokensProps {
  tokenBalances: TokenBalances[];
}

const WalletTokens = ({ tokenBalances }: WalletTokensProps) => (
  <main className="bg-mainLight mb-[50px] rounded-[16px] md:rounded-[20px] p-4 md:p-8">
    <header className="flex items-center justify-between border-b pb-3 mb-3 md:mb-5">
      <p>Assets</p>
      <p className="hidden md:block">Price</p>
      <p>Balance</p>
    </header>

    <ul className="flex-1 overflow-auto rounded-b-[30px]">
      {tokenBalances.map((token, index) => (
        <WalletToken 
          key={token.address || index} 
          token={token} 
        />
      ))}
    </ul>
  </main>
);

interface WalletTokenProps {
  token: TokenBalances;
}

const WalletToken = ({ token }: WalletTokenProps) => {
  if (!token.bal) return null;

  const formattedBalance = token.bal > parseUnits("0.001", token.decimals)
    ? Number(formatUnits(token.bal, token.decimals)).toFixed(3)
    : "< 0.001";

  return (
    <li className="h-[60px] cursor-default items-center grid grid-cols-2 md:grid-cols-3 overflow-hidden">
      <span className="flex items-center md:gap-2">
        {token.icon ? (
          <Image
            src={token.icon}
            alt={token.name}
            width={32}
            height={32}
            className="h-8 w-8"
          />
        ) : (
          <div className="h-8 w-8 rounded-full border-[0.5px] border-mainFG" />
        )}
        <div className="ml-2 md:ml-0">
          <h1>{token.ticker}</h1>
          <p className="text-[12px] text-slate-400 font-semibold">
            {token.name}
          </p>
        </div>
      </span>
      <p className="hidden md:block text-center">
        {token.price || "-"}
      </p>
      <p className="text-right truncate">
        {`${formattedBalance} ${token.ticker}`}
      </p>
    </li>
  );
};

const History = () => (
  <main className="bg-mainLight rounded-[16px] md:rounded-[20px] p-4 md:p-8">
    <h2 className="text-xl font-bold mb-4">Transaction History</h2>
    <p className="text-center text-gray-400">No transactions yet</p>
  </main>
);

export default PortfolioData;

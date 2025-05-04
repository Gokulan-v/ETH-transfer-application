// App.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Wallet, Send, Loader2 } from "lucide-react";
import ABI from "./contractJson/EtherTransaction.json";
import './App.css';
import React from "react";

function App () {
  const initialState = {
    windowEthereum: false,
    contractAddress: "Enter your contract address",// do before running the program 
    walletAddress: null,
    contractAbi: ABI.abi,
    provider: null, 
    signer: null,
    readContract: null,
    writeContract: null,
    isLoading: true,
    balance: "0",
    errorMessage: ""
  };

  const [state, setState] = useState(initialState);
  const [receiverAddress, setReceiverAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isTransacting, setIsTransacting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    initializeWallet();
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  const handleAccountsChanged = () => window.location.reload();
  const handleChainChanged = () => window.location.reload();

  const initializeWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const walletAddress = await signer.getAddress();

        const readContract = new ethers.Contract(
          initialState.contractAddress,
          initialState.contractAbi,
          provider
        );

        const writeContract = new ethers.Contract(
          initialState.contractAddress,
          initialState.contractAbi,
          signer
        );

        const balanceInWei = await provider.getBalance(walletAddress);
        const balance = ethers.utils.formatEther(balanceInWei);

        setState(prev => ({
          ...prev,
          windowEthereum: true,
          provider,
          signer,
          walletAddress,
          readContract,
          writeContract,
          balance,
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          errorMessage: "Please install MetaMask.",
          isLoading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error.message,
        isLoading: false,
      }));
    }
  };

  const handleSend = async () => {
    if (!receiverAddress || !amount) return;
    setIsTransacting(true);
    try {
      const tx = await state.signer.sendTransaction({
        to: receiverAddress,
        value: ethers.utils.parseEther(amount),
      });
      await tx.wait();
      setToastMsg("Transaction Successful ✅");
      setAmount("");
      setReceiverAddress("");
      initializeWallet();
    } catch (error) {
      setToastMsg("Transaction Failed ❌");
    } finally {
      setIsTransacting(false);
      setTimeout(() => setToastMsg(""), 4000);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <Wallet size={28} strokeWidth={2.5} />
          <h1>ETH Wallet</h1>
        </div>
        <div className="wallet-info">
          <div className="address">Address: {state.walletAddress?.slice(0, 6)}...{state.walletAddress?.slice(-4)}</div>
          <div className="balance">Balance: Ξ {Number(state.balance).toFixed(4)}</div>
        </div>
      </header>

      <main className="main-content">
        <div className="card">
          <h2>Send Ethereum</h2>
          <input
            type="text"
            placeholder="Receiver Address"
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount in ETH"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={handleSend} disabled={isTransacting}>
            {isTransacting ? <Loader2 className="spinner" /> : <><Send size={16} /> Send</>}
          </button>
          {toastMsg && <div className="toast">{toastMsg}</div>}
        </div>
      </main>
    </div>
  );
}

export default App;
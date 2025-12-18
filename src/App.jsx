import { useState } from 'react';
import { ethers } from 'ethers';
import './App.css';

function App() {
  // --- STATE MANAGEMENT ---
  const [password, setPassword] = useState("");         // Stores the actual password
  const [inputVal, setInputVal] = useState("");         // Stores what user is typing right now
  const [isAccountCreated, setIsAccountCreated] = useState(false); // Do we have an account?
  const [isUnlocked, setIsUnlocked] = useState(false);  // Are we currently logged in?
  const [error, setError] = useState("");

  const [mnemonic, setMnemonic] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [walletCount, setWalletCount] = useState(0);

  // --- ACTIONS ---

  // 1. Create Account (First Time)
  const createAccount = () => {
    if (inputVal.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    setPassword(inputVal);
    setIsAccountCreated(true);
    setIsUnlocked(true); // Auto login after creating
    setInputVal("");
    setError("");
  };

  // 2. Login (Going Forward)
  const login = () => {
    if (inputVal === password) {
      setIsUnlocked(true);
      setInputVal("");
      setError("");
    } else {
      setError("Incorrect Password");
    }
  };

  // 3. Lock Wallet (Going Back)
  const lockWallet = () => {
    setIsUnlocked(false);
  };

  // 4. Reset Everything (Delete All)
  const resetWallet = () => {
    const confirm = window.confirm("Are you sure? This will delete all wallets permanently.");
    if (confirm) {
      setPassword("");
      setIsAccountCreated(false);
      setIsUnlocked(false);
      setMnemonic(null);
      setWallets([]);
      setWalletCount(0);
    }
  };

  // 5. Wallet Logic
  const generateMnemonic = () => {
    const randomWallet = ethers.Wallet.createRandom();
    setMnemonic(randomWallet.mnemonic.phrase);
    setWallets([]); 
    setWalletCount(0);
  };

  const addWallet = () => {
    if (!mnemonic) return;
    const path = `m/44'/60'/0'/0/${walletCount}`;
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, path);
    setWallets([...wallets, {
      address: wallet.address,
      privateKey: wallet.privateKey,
      path: path,
      id: crypto.randomUUID()
    }]);
    setWalletCount(walletCount + 1);
  };

  const deleteWallet = (id) => {
    setWallets(wallets.filter(w => w.id !== id));
  };


  // --- VIEW 1: AUTHENTICATION SCREEN (Login or Signup) ---
  if (!isUnlocked) {
    return (
      <div className="container" style={{height: "100vh", display: "flex", alignItems: "center"}}>
        <div className="password-setup">
          <h1>{isAccountCreated ? "👋 Welcome Back" : "🔐 Setup Vault"}</h1>
          <p style={{color: "#94a3b8"}}>
            {isAccountCreated ? "Enter your password to unlock wallets." : "Create a password to secure your wallets."}
          </p>
          
          <input 
            type="password" 
            className="input-field"
            placeholder={isAccountCreated ? "Enter Password" : "Create Password"}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
          
          {error && <p style={{color: "red", fontSize: "0.9rem"}}>{error}</p>}

          <button 
            className="btn btn-primary" 
            onClick={isAccountCreated ? login : createAccount}
          >
            {isAccountCreated ? "Unlock Wallet" : "Create & Enter"}
          </button>

          {/* Option to reset if they forgot password */}
          {isAccountCreated && (
            <div style={{marginTop: "20px"}}>
               <button 
                 onClick={resetWallet}
                 style={{background: "none", border: "none", color: "gray", cursor: "pointer", textDecoration: "underline"}}
               >
                 Forgot Password? Reset Wallet
               </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- VIEW 2: DASHBOARD (Logged In) ---
  return (
    <div style={{minHeight: "100vh", width: "100%"}}>
      
      {/* NEW: Navigation Bar */}
      <nav className="navbar">
        <div className="nav-logo">🔐 Web3 Vault</div>
        <div className="nav-buttons">
          <button className="btn-small btn-lock" onClick={lockWallet}>
            🔒 Lock
          </button>
          <button className="btn-small btn-reset" onClick={resetWallet}>
            ⚠️ Reset
          </button>
        </div>
      </nav>

      <div className="container" style={{paddingTop: "0"}}>
        <button className="btn btn-primary" onClick={generateMnemonic}>
          {mnemonic ? "Regenerate Seed Phrase" : "Create Seed Phrase"}
        </button>

        {mnemonic && (
          <div className="mnemonic-container">
            <p style={{ color: "#94a3b8", marginBottom: "10px" }}>Master Key:</p>
            <div className="mnemonic-grid">
              {mnemonic.split(" ").map((word, index) => (
                <div key={index} className="word-chip">
                  <span style={{color: "gray", marginRight: "5px"}}>{index + 1}.</span> 
                  {word}
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={addWallet} style={{ width: "100%", marginTop: "20px" }}>
              Add Wallet ➕
            </button>
          </div>
        )}

        <div className="wallet-list">
          {wallets.map((wallet) => (
            <WalletCard 
              key={wallet.id} 
              wallet={wallet} 
              globalPassword={password} 
              onDelete={() => deleteWallet(wallet.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Sub-component for individual cards (same as before)
function WalletCard({ wallet, globalPassword, onDelete }) {
  const [showInput, setShowInput] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");

  const handleUnlock = () => {
    if (inputVal === globalPassword) {
      setIsUnlocked(true);
      setShowInput(false);
      setInputVal("");
      setError("");
    } else {
      setError("Incorrect Password");
    }
  };

  const maskPrivateKey = (key) => {
    return key.substring(0, 6) + "..." + key.substring(key.length - 4);
  };

  return (
    <div className="wallet-card">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <span className="wallet-label">Wallet {wallet.path.split("/").pop()}</span>
          <button className="btn-delete" onClick={onDelete} title="Delete">🗑️</button>
      </div>
      
      <p className="wallet-address">{wallet.address}</p>

      <div className="private-key-section">
        <p className="warning-text">PRIVATE KEY</p>
        {!isUnlocked && !showInput && (
           <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
             <span className="blur-text">{maskPrivateKey(wallet.privateKey)}</span>
             <button 
               className="btn" 
               style={{padding: "5px 10px", fontSize: "0.8rem", background: "#334155", color: "white"}}
               onClick={() => setShowInput(true)}
             >
               Show
             </button>
           </div>
        )}
        {showInput && (
          <div style={{display: "flex", gap: "10px"}}>
             <input 
               type="password" 
               className="input-field" 
               style={{margin: 0, padding: "5px"}}
               placeholder="Confirm Password"
               value={inputVal}
               onChange={(e) => setInputVal(e.target.value)}
             />
             <button 
                className="btn" 
                style={{padding: "5px 10px", fontSize: "0.8rem", background: "green", color: "white"}}
                onClick={handleUnlock}
             >
               Unlock
             </button>
          </div>
        )}
        {error && <p style={{color: "red", fontSize: "0.8rem"}}>{error}</p>}
        {isUnlocked && (
          <div style={{background: "#330000", padding: "10px", borderRadius: "5px", border: "1px solid red"}}>
             <p style={{fontFamily: "monospace", wordBreak: "break-all", margin: 0, color: "#ff9999"}}>
               {wallet.privateKey}
             </p>
             <button onClick={() => setIsUnlocked(false)} style={{marginTop: "5px", background: "none", border: "none", color: "gray", cursor: "pointer"}}>
               Hide Key
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
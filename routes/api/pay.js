const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// const { getIo } = require('../../socketManager');

const Transaction = require("../../models/Transaction");
const User = require("../../models/User");
const Bet = require("../../models/Bet");
const Bigp = require("../../models/Bigp");


router.post("/bank_deposit_return",auth, async (req, res) => {
    try {

        console.log(res);
    }
    catch(ex)
    {
console.log(ex);
    }
});



router.post("/deposit", auth, async (req, res) => {
    try {

        //console.log(req.body);
        console.log("bigpay bank deposit function called..");
        const user = await User.findById(req.user.id).select("-password");
        //console.log(user.name);

        //--BIGPAY BANK METHOD PARAMS

        const MerchantCode = process.env.MerchantCode;
        const ReturnURL="http://148.113.3.153:3000/";
        const FailedReturnURL="http://148.113.3.153:3000/error";
        const HTTPPostURL="http://148.113.3.153:5000/api/pay/bank_deposit_return";
        const Amount="50.00";
        const Currency="THB";
        const ItemID=require('crypto').randomBytes(6).toString('hex');
        const ItemDescription="bank payment";
        const PlayerId=user.phone.toString();
        const DEPOSIT_URL = `https://payin-api.bigpayz.net/payin/depositv2`;
        const HASH = MerchantCode + ItemID + Currency + Amount;
        const BankCode="KSKB";
        
        //-- BIGPAY QR CODE METHOD PARAMS

        // const merchant_code = process.env.MerchantCode;
        // const ref_id = require('crypto').randomBytes(6).toString('hex');;
        // const player_username =user.phone.toString();
        // const player_ip = process.env.PLAYER_IP;
        // const currency_code = process.env.Currency;
        // const amount = req.body.amount;
        // const lang = process.env.LANGUAGE;
        // const client_url = process.env.CLient_url;
        // const view = process.env.VIEW;



        // const DEPOSIT_URL = `https://promptpay-api.bigpayz.net/BankBot/QRScanDeposit`;
        // const HASH = merchant_code + ref_id + player_username + player_ip + currency_code + amount + client_url;




        const hashh = require('crypto').createHmac('sha256', "f1t0urr4LXprTuQuiDuHbsUBu7eTSD+vqxuvh16+IfY=").update(HASH).digest('hex');


        await axios
            .post(
                DEPOSIT_URL,
                {
                    MerchantCode: MerchantCode,
                    ReturnURL: ReturnURL,
                    FailedReturnURL: FailedReturnURL,
                    HTTPPostURL: HTTPPostURL,
                    Amount: Amount,
                    Currency: Currency,
                    ItemID: ItemID,
                    ItemDescription: ItemDescription,
                    PlayerId: PlayerId,
                    BankCode:BankCode,
                    Hash: hashh,

                    // merchant_code: merchant_code,
                    // ref_id: ref_id,
                    // player_username: player_username,
                    // player_ip: player_ip,
                    // currency_code: currency_code,
                    // amount: amount,
                    // lang: lang,
                    // client_url: client_url,
                    // view: view,
                    // hash: hashh,


                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        // "authorization": HASH,


                        //"api-key": _key,
                        //"time": current_time
                        Authorization: `Basic ${process.env.BIGPAY_KEY}`,
                    },
                }
            )
            .then(function (resonse) {
                console.log("response..." + resonse.data);
                const resp=resonse.data;
                console.log(resp);
                
                if (resp.error_code == 0) {
console.log(req.user.id);

                     try {
                    let transaction = new Transaction({
                        userid: req.user.id,
                        clientCode: '',
                        payAmount: req.body.amount,
                        trxNo: resp.invoice_number,
                        token: resp.token,
                        status: 'initiated',
                        type: "deposit",
                        platform: 'bigpayz',
                     });
                    transaction.save();

                    User.findById(req.user.id)
                        .then((user) => {
                            user.balance =
                                Number(user.balance) +
                                Number(req.body.amount);
                            user.save();
                            console.log("user balance updated");
                        })
                    .catch((err) => {
                        console.log(
                            "/user balance update error user",
                            err
                        );
                    });
                      } catch (ex) {
                    console.log("/deposit error", ex);
                     }

                    //   res.send({ payUrl: resp.payUrl });



                    // res.json({ status: "0000"});
                    
                    console.log("resulttt----->" + resp.redirect_to);
                    res.send({ payUrl: resp.redirect_to });
                } else {
                    console.log("Error calling bigpay deposit function");
                    if(res.error_code==1)
                    {
                        res.send({error:"Parameters Error",error_code:resp.error_code,payUrl:""});
                    }
                    else{
                        res.send({error:resp.error_message+"*",error_code:resp.error_code,payUrl:""});
                    }
                    

                }
            });
    }
    catch (ex) {
        console.log(ex);
    }

});

router.post("/deposit_old",auth, async (req, res) => {
    try {

        console.log("deposit function called..");
        const { amount, currency, platform } = req.body;
        const bill_no=require('crypto').randomBytes(10).toString('hex');
        const  brand_id= process.env.BRAND_ID;
        
        //console.log(bill_no);
        console.log("before user"+req.body);
     // const phn=  window.localStorage.setItem("phn", response.data.user_phn);
     // console.log("Phnnnn"+phn);
        const user = await User.findById(req.user.id).select("-password");
        
        const brand_uid= user.name;
        const dct_key=process.env.KEY_ID;
        const HASH = brand_id+brand_uid+dct_key;
        const hashh = require('crypto').createHash('md5').update(HASH).digest('hex').toString().toUpperCase();
        const DEPOSIT_URL = `${process.env.PMG_BASE_URL}/api/v1/Payment/Deposit`;
        const DEPOSIT_URL_DCT = `${process.env.DCT_BASE_URL}/dct/credit`;

        await axios
            .post(
                DEPOSIT_URL_DCT,
                {
                    // --- BANK API PARAMS ---
                    // clientCode: process.env.CLIENT_CODE,
                    // memberFlag: user.name,
                    // amount: amount,

                    // --- DCT CREDIT API PARAMS ---
                    brand_id: process.env.BRAND_ID,
                    sign: hashh,
                    brand_uid: user.name,
                    amount: amount,
                    bill_no: bill_no,
                    currency: "THB",
                    country_code: "TH",
                    hrefbackUrl:process.env.CALLBACK_URL
                       
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        // "authorization": HASH,

                        //"Accept": "application/json",
                       

                       // Authorization: `Bearer ${process.env.TESLLA_PAY_TOKEN}`,
                    },
                }
            )
            .then(function (response) {
                const resp=response.data;
                console.log(resp.data.code);
                if (resp.data.code == 1000) {
                   console.log("success");

                    try {
                        let transaction = new Transaction({
                           // userid: req.user.id,
                          //  clientCode: "",//process.env.CLIENT_CODE,
                          //  payAmount: resp.requestAmount,
                          //  trxNo: resp.orderNo,
                           // sign: resp.sign,
                           // status: resp.status,
                           // type: "deposit",
                           // platform: "DCT",
                        });
                       // transaction.save();

                        User.findById(req.user.id)
                            .then((user) => {
                                user.balance =
                                    Number(user.balance) +
                                    Number(req.amount);
                                user.save();
                                console.log("user balance updated");
                            })
                            .catch((err) => {
                                console.log(
                                    "/user balance update error user",
                                    err
                                );
                            });
                    } catch (ex) {
                        //console.log("/deposit error", ex);
                    }

                  //  res.send({ payUrl: resp.payUrl });



                    // res.json({ status: "0000"});
                } else {
                    console.log("errrrorororoor");
                }
            });
    } catch (ex) {
        console.log("Error Exception On Deposit" + ex);
    }
});

router.post("/withdraw", auth, async (req, res) => {
    try {

        const { amount, platform } = req.body;
        console.log(req.body);
        const user = await User.findById(req.user.id).select("-password");
        const WITHDRAW_URL = `${process.env.PMG_BASE_URL}/api/v1/Payout/Withdraw`;

        if (Number(user.balance) < Number(amount)) {
            res.send({
                success: false,
                message: "Not Enough Balance!",
            });

            return;
        }

        // Start Check turnover
        // check playing amount should be over withdrawal amount.
        console.log("user data>" + user);

        console.log("user data not empty");
        const result = await Bet.aggregate([
            {

                $match: {

                    userId: user.name,
                    // action: { $in: ["bet", "betNSettle"] }, // Filters documents to include only those where action is either 'bet' or 'betNSettle'
                },
            },
            {
                $group: {
                    _id: null, // Grouping by null means aggregating all documents together
                    totalBetAmountt: { $sum: "$turnover" }, // Sums up all betAmount values
                },
            },
        ]);
        console.log("resuuulttt" + result);
        console.log("result length" + result.length);

        // console.log("resultt value...>"+resultt);

        let totalBetAmount = 0;
        if (result.length > 0) {
            console.log("Total Bet Amount:", result[0].totalBetAmountt);
            totalBetAmount = result[0].totalBetAmountt;
        } else {
            console.log("No bets found or sum is zero");
        }

        if (amount > totalBetAmount) {
            res.send({
                success: false,
                message: "Not Enough Turnover!",
            });

            return;
        }
        // End Check turnover

        await axios
            .post(
                WITHDRAW_URL,
                {
                    clientCode: process.env.CLIENT_CODE,
                    memberFlag: user.name,
                    bankCardNumber: user.bban,
                    bankUserName: user.bbun,
                    bankName: user.bbn,
                    amount: amount,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.TESLLA_PAY_TOKEN}`,
                    },
                }
            )
            .then(function (response) {
                console.log(response.data);
                /*
                {
                    success: true,
                    httpCode: 200,
                    data: {
                    orderNo: 'PYXLMVI0000042',
                    requestAmount: 100,
                    status: 'PAYING',
                    sign: '02443457e4fae3201168a7f03359adc8'
                    }
                }
                */
                if (response.data.success) {
                    const { orderNo, requestAmount, status, sign } =
                        response.data.data;
                    try {
                        let transaction = new Transaction({
                            userid: req.user.id,
                            clientCode: process.env.CLIENT_CODE,
                            payAmount: requestAmount,
                            trxNo: orderNo,
                            sign: sign,
                            status: status,
                            type: "withdraw",
                            platform: platform,
                        });
                        transaction.save();

                        User.findById(req.user.id)
                            .then((user) => {
                                user.balance =
                                    Number(user.balance) -
                                    Number(requestAmount);
                                user.save();
                            })
                            .catch((err) => {
                                console.log(
                                    "/withdrawal_callback error user",
                                    err
                                );
                            });
                    } catch (ex) {
                        console.log("/withdraw error", ex);
                    }
                }
                res.send(response.data);
            });
    } catch (ex) {
        console.log("Error Exception On Deposit", ex);
    }
});
router.post("/deposit_bigpay_callback", async (req, res) => {
    console.log("call back function called...."+req.body);
    const {
        clientCode,
        sign,
        status,
        payAmount,
        chainName,
        clientNo,
        coinUnit,
    } = req.body;
    const filter = { trxNo: clientNo }; // Find a document with this condition
    console.log("deposit_callback");

    console.log(req.body);
    if (status == "PAID") {
        // + balance of the user
        let trx = await Transaction.findOne(filter);

        User.findById(trx.userid)
            .then((user) => {
                user.balance = Number(user.balance) + Number(payAmount);
                user.save();
            })
            .catch((err) => {
                console.log("/deposit_callback error user", err);
            });

        const update = {
            clientCode,
            status,
            chainName,
            coinUnit,
        };

        Transaction.findOneAndUpdate(filter, update, { new: true })
            .then((updatedDocument) => {
                if (updatedDocument) {
                    console.log(
                        `Successfully updated document: ${updatedDocument}.`
                    );
                } else {
                    console.log("No document matches the provided query.");
                }
            })
            .catch((err) =>
                console.error(`Failed to find and update document: ${err}`)
            );
    } else if (status == "CANCEL") {
        const update = {
            status,
        };

        Transaction.findOneAndUpdate(filter, update, { new: true })
            .then((updatedDocument) => {
                if (updatedDocument) {
                    console.log(
                        `Successfully updated document: ${updatedDocument}.`
                    );
                } else {
                    console.log("No document matches the provided query.");
                }
            })
            .catch((err) =>
                console.error(`Failed to find and update document: ${err}`)
            );
    }

    res.json({ status: "0000" });

    console.log("deposit_callback is called");
    console.log(req.body);
});

router.post("/deposit_callback_OLD", async (req, res) => {
    const {
        clientCode,
        sign,
        status,
        payAmount,
        chainName,
        clientNo,
        coinUnit,
    } = req.body;
    const filter = { trxNo: clientNo }; // Find a document with this condition
    console.log("deposit_callback");

    console.log(req.body);
    if (status == "PAID") {
        // + balance of the user
        let trx = await Transaction.findOne(filter);

        User.findById(trx.userid)
            .then((user) => {
                user.balance = Number(user.balance) + Number(payAmount);
                user.save();
            })
            .catch((err) => {
                console.log("/deposit_callback error user", err);
            });

        const update = {
            clientCode,
            status,
            chainName,
            coinUnit,
        };

        Transaction.findOneAndUpdate(filter, update, { new: true })
            .then((updatedDocument) => {
                if (updatedDocument) {
                    console.log(
                        `Successfully updated document: ${updatedDocument}.`
                    );
                } else {
                    console.log("No document matches the provided query.");
                }
            })
            .catch((err) =>
                console.error(`Failed to find and update document: ${err}`)
            );
    } else if (status == "CANCEL") {
        const update = {
            status,
        };

        Transaction.findOneAndUpdate(filter, update, { new: true })
            .then((updatedDocument) => {
                if (updatedDocument) {
                    console.log(
                        `Successfully updated document: ${updatedDocument}.`
                    );
                } else {
                    console.log("No document matches the provided query.");
                }
            })
            .catch((err) =>
                console.error(`Failed to find and update document: ${err}`)
            );
    }

    res.json({ status: "0000" });

    console.log("deposit_callback is called");
    console.log(req.body);
});

router.post("/withdraw_callback", async (req, res) => {
    const { clientCode, status, payAmount, orderNo, txId } = req.body;
    console.log("withdraw_callback");
    console.log(req.body);
    const filter = { trxNo: orderNo }; // Find a document with this condition

    if (status == "PAID") {
        let trx = await Transaction.findOne(filter);

        // User.findById(trx.userid)
        //     .then((user) => {
        //         user.balance = Number(user.balance) - Number(payAmount);
        //         user.save();
        //     })
        //     .catch((err) => {
        //         console.log("/deposit_callback error user", err);
        //     });

        const update = {
            clientCode,
            status,
        };

        Transaction.findOneAndUpdate(filter, update, { new: true })
            .then((updatedDocument) => {
                if (updatedDocument) {
                    console.log(
                        `Successfully updated document: ${updatedDocument}.`
                    );
                } else {
                    console.log("No document matches the provided query.");
                }
            })
            .catch((err) =>
                console.error(`Failed to find and update document: ${err}`)
            );
    } else if (status == "CANCEL") {
        const update = {
            status,
        };

        User.findById(trx.userid)
            .then((user) => {
                user.balance = Number(user.balance) + Number(payAmount);
                user.save();
            })
            .catch((err) => {
                console.log("/withdraw_callback error user", err);
            });

        Transaction.findOneAndUpdate(filter, update, { new: true })
            .then((updatedDocument) => {
                if (updatedDocument) {
                    console.log(
                        `Successfully updated document: ${updatedDocument}.`
                    );
                } else {
                    console.log("No document matches the provided query.");
                }
            })
            .catch((err) =>
                console.error(`Failed to find and update document: ${err}`)
            );
    }

    res.json({ status: "0000" });
});

router.post("/balance", auth, async (req, res) => {
    let balance = 0;
    let result = null;
    let resultTrans = null;
    console.log("usser id...." + req.user.id);
    const user = await User.findById(req.user.id);
    const trans = await Transaction.findById(req.user.id);
    console.log("user data..." + user);
    console.log("transactin data..." + trans);
    if (user) {
        balance = user.balance ? user.balance : 0;
        console.log("balance amaountttt...." + balance);

        console.log("user id..." + user._id);
        result = await Bet.aggregate([
            {
                $match: {
                    userId: user.name,
                    // action: { $in: ["bet", "betNSettle"] }, // Filters documents to include only those where action is either 'bet' or 'betNSettle'
                },
            },
            {
                $group: {
                    _id: null, // Grouping by null means aggregating all documents together
                    totalBetAmount: { $sum: "$turnover" }, // Sums up all betAmount values
                },
            },
        ]);

        resultTrans = await Transaction.aggregate([
            {
                $match: {
                    userid: user._id,
                    action: { $in: ["type", "deposit"] }, // Filters documents to include only those where action is either 'bet' or 'betNSettle'
                },
            },
            {
                $group: {
                    _id: null, // Grouping by null means aggregating all documents together
                    totalTransAmount: { $sum: "$payAmount" }, // Sums up all betAmount values
                },
            },
        ]);
    }

    let totalBetAmount = 0;
    console.log("bet total result.." + result);
    console.log("transaction amount..deposit.." + resultTrans);

    if (result.length > 0) {
        console.log("Total Bet Amount:", result[0].totalBetAmount);
        totalBetAmount = result[0].totalBetAmount;
    } else {
        console.log("No bets found or sum is zero");
    }

    res.json({ balance, totalBetAmount });
});

// playing balance
router.post("/wager", auth, async (req, res) => {
    try {
        const result = await Bet.aggregate([
            {
                $match: {
                    userId: req.user.name.toLowerCase(),
                    // action: { $in: ["bet", "betNSettle"] }, // Filters documents to include only those where action is either 'bet' or 'betNSettle'
                },
            },
            {
                $group: {
                    _id: null, // Grouping by null means aggregating all documents together
                    totalBetAmount: { $sum: "$turnover" }, // Sums up all betAmount values
                },
            },
        ]);

        let totalBetAmount = 0;
        if (result.length > 0) {
            console.log("Total Bet Amount:", result[0].totalBetAmount);
            totalBetAmount = result[0].totalBetAmount;
        } else {
            console.log("No bets found or sum is zero");
        }

        res.json({ totalBetAmount });
    } catch (err) {
        console.error("Error running aggregation:", err);
    }
});

// Total balance
router.post("/total_balance", async (req, res) => {
    // {{BASE_URL}}/api/v1/Payout/CheckBalance?clientCode=S001812kAWFX
    // GET Method
    console.log("total_balance from api called...");
    const CHECKOUT_BALANCE_URL = `${process.env.PMG_BASE_URL}/api/v1/Payout/CheckBalance?clientCode=${process.env.CLIENT_CODE}`;

    await axios
        .post(
            CHECKOUT_BALANCE_URL,
            {},
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.TESLLA_PAY_TOKEN}`,
                },
            }
        )
        .then(function (response) {
            if (response.data.httpCode == 200) {
                let balance = response.data.data.balance;
console.log("balance from api.."+balance);
                res.json({ balance });
            }
        });
});

const getPhoneNumber = (txnUserId) => {
    // Check if txnUserId1 contains only numbers
    var isOnlyNumbers = /^\d+$/.test(txnUserId);

    return isOnlyNumbers ? txnUserId : txnUserId.substring(3);
};

// AWC HOOK FUNCTION
router.post("/awc_hook", async (req, res) => {
    console.log("AWC CALLBACK awc_hook", req.body.message);
    let req_val = JSON.parse(req.body.message);
    // "key": "SWGH308iLalAafVOdgDD",
    // "message": "{\"action\":\"getBalance\",\"userId\":\"swuserid\"}"

    // SAVE BET HISTORY
    if (req_val["action"] != "getBalance") {
        // If the action is not getBalance, must save all bet history
        req_val["txns"].map((txn, key) => {
            const bet = new Bet(txn);
            bet.action = req_val["action"];
            bet.save()
                .then((savedBet) => {
                    // Handle success, e.g., logging or sending a response
                })
                .catch((error) => {
                    // Handle error, e.g., logging or sending an error response
                    console.log(error);
                });
        });
    }

    let response = {};

    if (req_val["action"] == "getBalance") {
        const user = await User.findOne({
            phone: getPhoneNumber(req_val["userId"]),
        });
        // console.log("User balance", user.balance);
        if (user != null) {
            response = {
                status: "0000",
                desc: req_val["userId"] + "baht User Balance",
                balance: user.balance,
                balanceTs: new Date().toISOString(),
                userId: req_val["userId"],
            };
        }
    } else if (req_val["action"] == "betNSettle") {
        // Update user balances
        await Promise.all(
            req_val["txns"].map(async (txn) => {
                try {
                    const user = await User.findOne({
                        phone: getPhoneNumber(txn["userId"]),
                    });
                    user.balance =
                        Number(user.balance) - Number(txn["betAmount"]);
                    user.balance =
                        Number(user.balance) + Number(txn["winAmount"]);
                    await user.save();
                } catch (error) {
                    console.error(
                        `Error updating user balance for phone ${txn["userId"]}:`,
                        error
                    );
                    // Handle error appropriately
                }
            })
        );

        // Assuming there's only one user being updated
        const updatedUser = await User.findOne({
            phone: getPhoneNumber(req_val["txns"][0]["userId"]),
        });

        // Construct response
        response = {
            status: "0000",
            balance: Number(updatedUser.balance),
            balanceTs: new Date().toISOString(),
        };
        // Send response
        // res.json(response); // Uncomment and use appropriate response method
    } else if (req_val["action"] == "cancelBetNSettle") {
        // Cancel Bet and Settle
        const txnUserId = req_val["txns"][0]["userId"];

        const user = await User.findOne({
            phone: getPhoneNumber(txnUserId),
        });

        if (!user) {
            // Handle the case where the user is not found
            console.error(`User not found for phone ${txnUserId}`);
            response = {
                status: "0001",
                desc: "User not found",
                balance: null,
                balanceTs: new Date().toISOString(),
            };
            return;
        }

        response = {
            status: "0000",
            desc: "Cancel betNSettle",
            balance: Number(user.balance),
            balanceTs: new Date().toISOString(),
        };
        // Perform any necessary operations before saving, if needed
        // For demonstration, we're just saving the user as is
        // await user.save();
    } else if (req_val["action"] == "bet") {
        await Promise.all(
            req_val["txns"].map(async (txn) => {
                try {
                    const user = await User.findOne({
                        phone: getPhoneNumber(txn["userId"]),
                    });
                    user.balance =
                        Number(user.balance) - Number(txn["betAmount"]);
                    await user.save();
                    console.log("User balance", user.balance);
                } catch (error) {
                    console.error(
                        `Error updating user balance for phone ${txn["userId"]}:`,
                        error
                    );
                    // Handle error appropriately
                }
            })
        );

        const updatedUser = await User.findOne({
            phone: getPhoneNumber(req_val["txns"][0]["userId"]),
        });

        response = {
            status: "0000",
            balance: updatedUser.balance,
            balanceTs: new Date().toISOString(),
        };
    } else if (req_val["action"] == "cancelBet") {
        const txn = req_val["txns"][0];
        const user = await User.findOne({
            phone: getPhoneNumber(txn["userId"]),
        });
        try {
            console.log("user balance----------->", user.balance);
            const bet = await Bet.findOne({
                platform: txn["platform"],
                platformTxId: txn["platformTxId"],
                roundId: txn["roundId"],
                action: "bet",
            });

            if (bet) {
                user.balance = Number(user.balance) + Number(bet.betAmount);
                await user.save();
            }
        } catch (ex) {
            console.log(ex);
        }

        response = {
            status: "0000",
            balance: user.balance,
            balanceTs: new Date().toISOString(),
        };
    } else if (req_val["action"] == "settle") {
        const user = await User.findOne({
            phone: getPhoneNumber(req_val["txns"][0]["userId"]),
        });

        user.balance =
            Number(user.balance) + Number(req_val["txns"][0]["winAmount"]);
        await user.save();
        console.log("User balance", user.balance);

        response = {
            status: "0000",
        };
    } else if (req_val["action"] == "unsettle") {
        // from settle to bet!
        const bet = await Bet.findOne({
            platformTxId: req_val["txns"][0]["platformTxId"],
            platform: req_val["txns"][0]["platform"],
            action: "settle",
        });

        const user = await User.findOne({
            phone: getPhoneNumber(req_val["txns"][0]["userId"]),
        });
        user.balance = Number(user.balance) - Number(bet.winAmount);

        await user.save();
        // -winAmount
        response = {
            status: "0000",
        };
    } else if (req_val["action"] == "voidSettle") {
        response = {
            status: "0000",
            desc: "Void Settle",
        };
    } else if (req_val["action"] == "unvoidSettle") {
        response = {
            status: "0000",
            desc: "Unvoid Settle",
        };
    } else if (req_val["action"] == "freeSpin") {
        await Promise.all(
            req_val["txns"].map(async (txn, key) => {
                const user = await User.findOne({
                    phone: getPhoneNumber(txn["userId"]),
                });
                user.balance = user.balance - txn.betAmount + txn.winAmount;
                await user.save();
            })
        );

        response = {
            status: "0000",
            desc: "Free Spin",
        };
    } else if (req_val["action"] == "give") {
        await Promise.all(
            req_val["txns"].map(async (txn, key) => {
                const user = await User.findOne({
                    phone: getPhoneNumber(txn["userId"]),
                });
                user.balance = user.balance + txn.amount;
                await user.save();
            })
        );

        response = {
            status: "0000",
            desc: "Give",
        };
    } else if (req_val["action"] == "resettle") {
        response = {
            status: "0000",
            desc: "Resettle",
        };
    }

    res.json(response);
});

// SBO HOOK FUNCTION
router.post("/sbo_hook/:hook_type", async (req, res) => {
    const hook_type = req.params.hook_type;

    console.log(req.params.hook_type);
    console.log(req.body);

    switch (hook_type) {
        case "GetBalance":
            break;
        case "Deduct":
            break;
        case "Settle":
            break;
        case "Rollback":
            break;
        case "Cancel":
            break;
        case "Bonus":
            break;
        case "ReturnStake":
            break;
        case "GetBetStatus":
            break;
    }
});

module.exports = router;

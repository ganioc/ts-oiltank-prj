// eos.transaction({
//         actions: [
//             {
//                 account: "eosio.token",
//                 name: "transfer",
//                 authorization: [
//                     {
//                         actor: "user1",
//                         permission: "active"
//                     }
//                 ],
//                 data: {
//                     from: "user1",
//                     to: "user2",
//                     quantity: `5.0000 TOK`,
//                     memo: "some description of the transaction"
//                 }
//             }
//         ]
//     })
//     .then(result => {
//         // Check token balances again.  You'll now see 5 TOK in user2’s
//         // account and 95 TOK in user1’s account
//     });

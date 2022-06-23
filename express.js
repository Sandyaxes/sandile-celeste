require('dotenv').config()
const express = require('express');
const axios = require('axios').default;
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const crypto = require('crypto');
const app = express();
const port = 3000;

app.use(express.json());


let menu = [
    {
    id: 0,
    meal:"Glazed oysters with zucchini pearls and sevruga caviar",
    wine: "Wine pairing: kleine zalze brut rose"
    },
    {
    id: 1,
    meal:"Seared anhi tuna with provincial vegetables and tapenade croutons",
    wine: "Wine pairing: bizoe semillon"
    },
    {
    id: 2,
    meal:"Bream with asparagus, tempura mussels and a lime velouté",
    wine: "Wine pairing:  red city blend"
    },
    {
    id: 3,
    meal:"Aged gouda with espresso, hazelnut and onion",
    wine: "Wine pairing: thelema early harvest"
    },
    {
    id: 4,
    meal:"Dark chocolate panna cotta with a rhubarb and cherry compote",
    wine: "Wine pairing: clarington sauvignon blanc"
    },
  ];

let price = 'R100';
const clientId = "2020122653946739963336";
// const userId = "21661000000446291765";
const base_url = "https://vodapay-gateway.sandbox.vfs.africa"

// app.get('/launch', (req, res) => {
//   const launchData = {
//     menu,
//     price,
//     tableNo: Math.floor(Math.random(1,100) * 100) 
//   }
//   res.send(launchData)
//   });
  
  app.get('/menu',(req, res)=>{
    res.send(menu);  
})

// app.get('/menu/:id',(req, res)=>{
//     const {id} = req.params;
//     const item = menu.find((item) => item.id === id);
//     if (item) res.status(201).send(item);
//     else res.status(404).send('Not Found');
// })

// app.post('/menu',(req, res)=>{
//     const addMenu = req.body;
//     menu.push(addMenu);
//     console.log(menu);
//     res.send(menu);
// })

const moment = require('moment');

const getRequestTime = () => {
    const now = moment();
    const time = now.format('yyyy-MM-DDTHH:mm:ssZ')

    return time;
}

const requestTime = getRequestTime();
app.post('/auth', async (req, res)=>{



  const body = {
    "grantType": "AUTHORIZATION_CODE",
    "authCode": req.body.authCode
  }
 
   const unSignedContent = `POST /v2/authorizations/applyTokenSigned\n${clientId}.${requestTime}.${JSON.stringify(body)}`;
   const headers = {
    'Content-Type': 'application/json; charset=UTF-8',
    'client-id': clientId,
    'request-time': requestTime,
    'signature': `algorithm=RSA256, keyVersion=1, signature=${createSignature(unSignedContent)}`,
  };

  const accessTokenOptions = {
    method: 'POST',
    url: base_url+'/v2/authorizations/applyTokenSigned',
    headers: headers,
   data: body
  };


    let response = await axios(accessTokenOptions);
    let infoToken = response.data.accessToken;

    const userInfoBody = {
      'accessToken': infoToken
    };

    const options = {
      method: 'POST',
      url: base_url+'/v2/customers/user/inquiryUserInfo',
      headers: headers,
      data: userInfoBody
    };

    response = await axios(options);

    let userInfo = {
        UserName: response.data.userInfo.nickName,
        Email: response.data.userInfo.contactInfos[0].contactNo,
        Phone: response.data.userInfo.contactInfos[1].contactNo
      }
  
    const accessToken = jwt.sign({userInfo}, process.env.ACCESS_TOKEN_SECRET)

    let data = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
    res.send({data:data.userInfo});
    console.log(data.userInfo)
})

app.post('/payment', async (req, res)=>{

  const body = {
    productCode: "CASHIER_PAYMENT",
    salesCode: "51051000101000000011",
    paymentRequestId: uuidv4(),
    paymentNotifyUrl:"https://www.merchant.com/paymentNotification",
    paymentRedirectUrl:"https://www.merchant.com/Notification",
    paymentExpiryTime:"2023-02-22T17:49:31+08:00",
    paymentAmount:{
        currency:"ZAR",
        value:"6234"
    },
    order:{
      goods:{
          referenceGoodsId:"goods123",
          goodsUnitAmount:{
              currency:"ZAR",
              value:"6234"
          },
          goodsName:"mobile1"
      },
      env:{
          terminalType:"MINI_APP"
      },
      orderDescription:"Car",
      buyer:{
          referenceBuyerId:'216610000000446291765'
      }
  }
  }

  const unSignedContent = `POST /v2/authorizations/applyTokenSigned\n${clientId}.${requestTime}.${JSON.stringify(body)}`;
  const headers = {
   'Content-Type': 'application/json; charset=UTF-8',
   'client-id': clientId,
   'request-time': requestTime,
   'signature': `algorithm=RSA256, keyVersion=1, signature=${createSignature(unSignedContent)}`,
 };

  let options = {
    method: 'Post',
    url: base_url+'/v2/payments/pay',
    headers: headers,
    data: body
  }

  let payment = await axios(options).catch(function (error){console.log(error)});
  console.log(payment.data);
  res.send(payment.data);

});

function createSignature(unSignedContent){
  const privateKey = fs.readFileSync("rsa_private_key.pem", "utf8");
  const key = crypto.createPrivateKey(privateKey);
  const sign = crypto.createSign("RSA-SHA256");
  sign.write(unSignedContent);
  sign.end();
  const signature = sign.sign(key, "base64");
  return signature

}

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
});

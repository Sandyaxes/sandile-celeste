require('dotenv').config()
const express = require('express');
const axios = require('axios').default;
const atob = require('atob')
const { DateTime } = require("luxon");
const app = express();
const port = 3000;

app.use(express.json());
const jwt = require('jsonwebtoken')

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
const userId = "21661000000446291765";
const base_url = "https://vodapay-gateway.sandbox.vfs.africa"

app.get('/launch', (req, res) => {
  const launchData = {
    menu,
    price,
    tableNo: Math.floor(Math.random(1,100) * 100) 
  }
  res.send(launchData)
  });
  
  app.get('/menu',(req, res)=>{
    res.send(menu);  
})

app.get('/menu/:id',(req, res)=>{
    const {id} = req.params;
    const item = menu.find((item) => item.id === id);
    if (item) res.status(201).send(item);
    else res.status(404).send('Not Found');
})

app.post('/menu',(req, res)=>{
    const addMenu = req.body;
    menu.push(addMenu);
    console.log(menu);
    res.send(menu);
})

const moment = require('moment');

const getRequestTime = () => {
    const now = moment();
    const time = now.format('yyyy-MM-DDTHH:mm:ssZ')

    return time;
}

app.post('/getToken', async (req, res)=>{

  const body = {
    "grantType": "AUTHORIZATION_CODE",
    "authCode": req.body.authCode
  }


  const options = {
    method: 'POST',
    url: 'https://vodapay-gateway.sandbox.vfs.africa/v2/authorizations/applyToken',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'client-id': clientId,
      'request-time': getRequestTime(),
      'signature': 'algorithm=RSA256, keyVersion=1, signature=testing_signatur',
    },
   data: body
  };

    let response;
    try{
      response = await axios(options);
      console.log(response.data)
    } catch(err){
      console.log('FAILED');
      console.log(err.message);
    }

    res.send(response.data);
})

// app.post('/getUserInfo', async (req, res)=>{
//   const userInfoBody = {
//     'accessToken': req.body.accessToken
//   };

//   const options = {
//     method: 'POST',
//     url: 'https://vodapay-gateway.sandbox.vfs.africa/v2/customers/user/inquiryUserInfo',
//     headers: {
//       'Content-Type': 'application/json; charset=UTF-8',
//       'client-id': clientId,
//       'request-time': getRequestTime(),
//       'signature': 'algorithm=RSA256, keyVersion=1, signature=testing_signatur',
//     },
//     data: userInfoBody
//   };

//   let  response = await axios(options);
    
//   let userInfo = {
//       UserName: response.data.userInfo.nickName,
//       Email: response.data.userInfo.contactInfos[0].contactNo,
//       Phone: response.data.userInfo.contactInfos[1].contactNo
//     }

//   console.log(userInfo)
//   res.send(userInfo);
// })

app.post('/getUserToken', async (req, res)=>{
  const userInfoBody = {
    'accessToken': req.body.Token
  };

  const options = {
    method: 'POST',
    url: 'https://vodapay-gateway.sandbox.vfs.africa/v2/customers/user/inquiryUserInfo',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'client-id': clientId,
      'request-time': getRequestTime(),
      'signature': 'algorithm=RSA256, keyVersion=1, signature=testing_signatur',
    },
    data: userInfoBody
  };

  let  response = await axios(options);
    
  let userInfo = {
      UserName: response.data.userInfo.nickName,
      Email: response.data.userInfo.contactInfos[0].contactNo,
      Phone: response.data.userInfo.contactInfos[1].contactNo
    }

  // const username = userInfo.UserName
  // const user = {name: username}
  const accessToken = jwt.sign({userInfo}, process.env.ACCESS_TOKEN_SECRET)
  res.json({accessToken: accessToken})
  console.log(accessToken)
})

app.post('/getUserInfo', authToken, (req, res) => {
  let data = jwt.verify(req.Token, process.env.ACCESS_TOKEN_SECRET)
  res.send(data)
  console.log(data)
});

function authToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if(typeof authHeader !== 'undefined'){
    const token = authHeader.split(' ')[1]
    req.Token = token;
    next();
  } else {
    res.sendStatus(403);
  }

}


app.patch('/menu/:id',(req, res)=>{
  const id = +req.params.id;
  const body = req.body;
  const index = menu.findIndex((item) => item.id === id);
  const updatedMenu = {id: id, ...body};
  menu[index] = updatedMenu;
  res.send(updatedMenu);
})

app.delete("/menu/:id", (req, res)=>{
  const id = +req.params.id;
  const index = menu.findIndex((item) => item.id === id);
  let deletedMenu = menu.splice(index, 1);
  res.send(deletedMenu)
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
});
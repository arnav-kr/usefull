const fetch = require("node-fetch");
const express = require('express');
const rateLimit = require('express-rate-limit');
const app = express();
const bodyParser = require('body-parser');
const apiRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minute
  max: 2, // limit each IP to 2 requests per windowMs
  handler: function(req, res, /*next*/) {
    return res.status(429).json({
      error: 'You have been Rate Limited! Please try after sometime!',
      code: 429
    })
  }
})
app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static('public'))
app.use(
  express.urlencoded({
    extended: true
  })
);

app.get('/', (req, res) => {
  res.send('Hello Express app!')
});

app.post('/', (req, res) => {
  if(req.headers["content-type"] !== "application/json"){
    return res.status(400).json({
      error: "Not A valid Request! Content-Type should be 'application/json'",
      code: 400
    });
  }
  var link = req.body.link;
  if (!link || !req.body || typeof(link) !== "string") {
    return res.status(400).json({
      error: "Not A valid Request!",
      code: 400
    });
  }
  else {
    try {
      fetch(`https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${process.env.KEY}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          "suffix": {
             "option": "SHORT"
          },
          "dynamicLinkInfo": {
             "domainUriPrefix": "https://usefull.page.link",
             "link": link,
           }
        }),
      })
        .then(res => res.json())
        .catch((e) => {
          return res.status(400).json({
            error: "An Error Occured while shortening the link!",
            code: 400
          });
        })
        .then(json =>{
          if(json.error){
            return res.status(400).json({
            error: "An Error Occured while shortening the link!",
              code: 400
          });
          }
          if(json.shortLink){
            return res.status(200).json({
            link: json.shortLink,
            code: 200
            });
          }
          return res.status(400).json({
            error: "An Error Occured while shortening the link!",
            code: 400
          });
           console.log(json);
        });
    }
    catch (err) {
      return res.status(400).json({
        error: "An Error Occured while shortening the link!",
        code: 400
      });
    }
  }
});

app.post('/shorten', (req, res) => {
  if(req.headers["content-type"] !== "application/json"){
    return res.status(400).json({
      error: "Not A valid Request! Content-Type should be 'application/json'",
      code: 400
    });
  }
  var link = req.body.link;
  if (!link || !req.body || typeof(link) !== "string") {
    return res.status(400).json({
      error: "Not A valid Request!",
      code: 400
    });
  }
  else {
    try {
      fetch(`https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${process.env.KEY}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          "suffix": {
             "option": "SHORT"
          },
          "dynamicLinkInfo": {
             "domainUriPrefix": "https://usefull.page.link",
             "link": link,
           }
        }),
      })
        .then(res => res.json())
        .catch((e) => {
          return res.status(400).json({
            error: "An Error Occured while shortening the link!",
            code: 400
          });
        })
        .then(json =>{
          if(json.error){
            return res.status(400).json({
            error: "An Error Occured while shortening the link!",
              code: 400
          });
          }
          if(json.shortLink){
            return res.status(200).json({
              link: json.shortLink,
              code: 200
          });
          }
          return res.status(400).json({
            error: "An Error Occured while shortening the link!",
            code: 400
          });
           console.log(json);
        });
    }
    catch (err) {
      return res.status(400).json({
        error: "An Error Occured while shortening the link!",
        code: 400
      });
    }
  }
});

app.get("/shorten", (req, res) => {
  var link = req.query.link;
  if (!link || !req.query || typeof(link) !== "string") {
    return res.status(400).json({
      error: "Not A valid Request!",
      code: 400
    });
  }
  else {
    link = encodeURI(link);
    try {
      fetch(`https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${process.env.KEY}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          "suffix": {
             "option": "SHORT"
          },
          "dynamicLinkInfo": {
             "domainUriPrefix": "https://usefull.page.link",
             "link": link,
           }
        }),
      })
        .then(res => res.json())
        .catch((e) => {
          return res.status(400).json({
            error: "An Error Occured while shortening the link!",
            code: 400
          });
        })
        .then(json =>{
          if(json.error){
            return res.status(400).json({
            error: "An Error Occured while shortening the link!",
              code: 400
          });
          }
          if(json.shortLink){
            return res.status(200).json({
              link: json.shortLink,
              code: 200
          });
          }
          return res.status(400).json({
            error: "An Error Occured while shortening the link!",
            code: 400
          });
           console.log(json);
        });
    }
    catch (err) {
      return res.status(400).json({
        error: "An Error Occured while shortening the link!",
        code: 400
      });
    }
  }
});

app.listen(3000, () => {
  console.log('UseFull ready to be Useful!');
});
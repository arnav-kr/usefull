const fetch = require("node-fetch");
const express = require('express');
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const app = express();
const bodyParser = require('body-parser');
var admin = require("firebase-admin");
const apiRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minute
  max: 2, // limit each IP to 2 requests per windowMs
  handler: function (req, res, /*next*/) {
    return res.status(429).json({
      error: 'You have been Rate Limited! Please try after sometime!',
      code: 429
    })
  }
});
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

const serviceAccount = JSON.parse(process.env.ADMIN_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL,
  databaseAuthVariableOverride: {
    uid: process.env.SECRET_DATABASE_UID
  }
});

const root = admin.database();
const usefull = root.ref('usefull');

var aliases = {};

usefull.on('child_added', snap => {
  var link = snap.val();
  aliases[snap.key] = link;
  console.log("New Alias Added");
});
usefull.on('child_removed', snap => {
  delete aliases[snap.key];
  console.log("New Alias Deleted");
});
usefull.on('child_changed', snap => {
  var link = snap.val();
  aliases[snap.key] = link;
  console.log("New Alias Changed!");
});

app.post('/', (req, res) => {
  if (req.headers["content-type"] !== "application/json") {
    return res.status(400).sendFile(__dirname + "/public/400.html");
  }
  var link = req.body.link || undefined;
  if (!link || !req.body || typeof (link) !== "string") {
    return res.status(400).sendFile(__dirname + "/public/400.html");
  }
  else {
    link = decodeURI(link);
    shorten(link, res);
  }
});

app.get("/:link", (req, res) => {
  var link = req.params.link || undefined;
  if (!link || !req.query || typeof (link) !== "string") {
    return res.status(400).sendFile(__dirname + "/public/400.html");
  }
  else {
    link = decodeURI(link);
    if (aliases[link]) {
      res.redirect(aliases[link]);
    }
    else {
      res.status(404).sendFile(__dirname + "/public/404.html");
    }
  }
});

app.post('/api/shorten', (req, res) => {
  if (req.headers["content-type"] !== "application/json") {
    return res.status(400).sendFile(__dirname + "/public/400.html");
  }
  var link = req.body.link || undefined;
  if (!link || !req.body || typeof (link) !== "string") {
    return res.status(400).sendFile(__dirname + "/public/400.html");
  }
  else {
    link = decodeURI(link);
    shorten(link, res);
  }
});

app.get("/api/shorten", (req, res) => {
  var link = req.query.link || undefined;
  if (!link || !req.query || typeof (link) !== "string") {
    return res.status(400).sendFile(__dirname + "/public/400.html");
  }
  else {
    link = decodeURI(link);
    shorten(link, res, true);
  }
});

app.listen(3000, () => {
  console.log('UseFull ready to be Useful!');
});

function shorten(link, res, isGET) {
  try {
    fetch(process.env.ENDPOINT, {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        "suffix": {
          "option": "SHORT"
        },
        "dynamicLinkInfo": {
          "domainUriPrefix": process.env.URL_PREFIX,
          "link": link,
        }
      }),
    })
      .then(response => response.json())
      .catch((e) => {
        console.log(e);
        if (isGET) {
          return res.status(400).sendFile(__dirname + "/public/400.html");
        }
        else {
          return res.status(400).json({
            error: 'Bad Request!',
            code: 400
          });
        }
      })
      .then(json => {
        console.log(json);
        if (json.error) {
          if (isGET) {
            return res.status(400).sendFile(__dirname + "/public/400.html");
          }
          else {
            return res.status(400).json({
              error: 'Bad Request!',
              code: 400
            });
          }
        }
        if (json.shortLink) {
          root.ref('usefull/' + json.shortLink).set(link);
          return res.status(200).json({
            link: json.shortLink,
            code: 200
          });
        }
        if (isGET) {
          return res.status(400).sendFile(__dirname + "/public/400.html");
        }
        else {
          return res.status(400).json({
            error: 'Bad Request!',
            code: 400
          });
        }
      });
  }
  catch (err) {
    if (isGET) {
      return res.status(400).sendFile(__dirname + "/public/400.html");
    }
    else {
      return res.status(400).json({
        error: 'Bad Request!',
        code: 400
      });
    }
  }
}
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
app.use("/", express.static(__dirname + '/public'))
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
  var slug = snap.val();
  aliases[snap.key] = slug;
  console.log("New Alias Added", { slug: snap.key, url: snap.val() });
});
usefull.on('child_removed', snap => {
  delete aliases[snap.key];
  console.log("New Alias Deleted", { slug: snap.key, url: snap.val() });
});
usefull.on('child_changed', snap => {
  var slug = snap.val();
  aliases[snap.key] = slug;
  console.log("New Alias Changed!", { slug: snap.key, url: snap.val() });
});

app.post('/', (req, res) => {
  if (req.headers["content-type"] !== "application/json") {
    return res.status(400).sendFile(__dirname + "/public/400.html");
  }
  var slug = req.body.slug || undefined;
  if (!slug || !req.body || typeof (slug) !== "string") {
    return res.status(400).sendFile(__dirname + "/public/400.html");
  }
  else {
    slug = decodeURI(slug);
    shorten(slug, res);
  }
});

app.get("/:slug", (req, res) => {
  var slug = req.params.slug || undefined;
  console.log("Request Payload:", req);
  if (!slug || !req.query || typeof (slug) !== "string") {
    return res.status(400).sendFile(__dirname + "/public/400.html");
  }
  else {
    slug = decodeURI(slug);
    console.log(slug, aliases[slug], aliases);
    if (aliases[slug]) {
      res.redirect(aliases[slug]);
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
  var slug = req.body.slug || undefined;
  if (!slug || !req.body || typeof (slug) !== "string") {
    return res.status(400).sendFile(__dirname + "/public/400.html");
  }
  else {
    slug = decodeURI(slug);
    shorten(slug, res);
  }
});

app.get("/api/shorten", (req, res) => {
  var slug = req.query.slug || undefined;
  if (!slug || !req.query || typeof (slug) !== "string") {
    return res.status(400).sendFile(__dirname + "/public/400.html");
  }
  else {
    slug = decodeURI(slug);
    shorten(slug, res, true);
  }
});

app.listen(3000, () => {
  console.log('UseFull ready to be Useful!');
});


function shorten(slug, res, isGET) {
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
          "slug": slug,
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
          let slug = new URL(json.shortLink).pathname.split('/').pop();
          root.ref('usefull/' + slug).set(slug);
          return res.status(200).json({
            slug: json.shortLink,
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
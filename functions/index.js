/* eslint-disable no-console */
//const firebase = require("firebase");
const functions = require("firebase-functions");
// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin");
// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD4NJMwURNNCDqOHSdPH8d4txGwbnUyqSc",
  authDomain: "fir-app-fd1be.firebaseapp.com",
  projectId: "fir-app-fd1be",
  storageBucket: "fir-app-fd1be.appspot.com",
  messagingSenderId: "836857438453",
  appId: "1:836857438453:web:ea990037f0f0ac2e9fa5bc",
  measurementId: "G-758QRPPRX8"
};
admin.initializeApp(firebaseConfig);
const cors = require('cors')({origin: true});
const fetch = require('node-fetch');

const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();
const express = require('express');
const app = express();

/**
 * Create the user details with email and password
 * `email` and `password` values are expected in the body of the request.
 * If signup fails return a 401 response.
 */
exports.signup = functions.https.onRequest((req, res) => {
   
  functions.logger.info("Signup", {structuredData: true});
  console.log("name"+req.query.name);
  /*
  firebase.auth().createUserWithEmailAndPassword(email, password)
  .then((userCredential) => {
    // Signed in 
    var user = userCredential.user;
    response.send(user);
  })
  .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    response.send(errorMessage);
  });*/

  admin
  .auth()
  .createUser({
    email: req.query.email,
    emailVerified: true,
    phoneNumber: req.query.phone,
    password: req.query.password,
    displayName: req.query.name,
    photoURL: req.query.photoURL,
    disabled: false,
  })
  .then((data) => {
    return res
      .status(201)
      .json({ message: `user ${data.uid} signed up successfully`, data:data });
  })
  .catch((err) => {
    console.error(err);
    return res.status(500).json({ error: err.code });
  });
 
});
/*
 * Verify user token
 *
*/
exports.verifyToken = functions.https.onRequest( async (req, res) => {
  console.log("verifytoken...");
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    res.status(403).send('Unauthorized');
    return;
  }
  
  const idToken = req.headers.authorization.split('Bearer ')[1];
  console.log("veryfying...",idToken);
  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    console.log("decoded token",decodedIdToken);
    //req.user = decodedIdToken;
    res.send(decodedIdToken);
    //next();
    return;
  } catch(e) {
    console.log("error",e);
    res.status(403).send('Unauthorized');
    return;
  }
});



exports.callSignUp = functions.https.onCall((data, context) => {
  functions.logger.info("Test message", {structuredData: true});
  return "This is message from callable function";
});


/*
const authenticate = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    res.status(403).send('Unauthorized');
    return;
  }
  const idToken = req.headers.authorization.split('Bearer ')[1];
  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedIdToken;
    next();
    return;
  } catch(e) {
    res.status(403).send('Unauthorized');
    return;
  }
};

app.use(authenticate);
*/

/**
 * Authenticate the provided credentials returning a Firebase custom auth token.
 * `username` and `password` values are expected in the body of the request.
 * If authentication fails return a 401 response.
 * If the request is badly formed return a 400 response.
 * If the request method is unsupported (not POST) return a 403 response.
 * If an error occurs log the details and return a 500 response.
 */
exports.auth =  functions.https.onRequest((req, res) => {
  let username=req.body.username;
  let password = req.body.password;

  console.log("username",username);
  const handleError = (username, error) => {
    console.log("error",error);
    functions.logger.error({ User: username }, error);
    res.sendStatus(500);
    return;
  };

  const handleResponse = (username, status, body) => {
    console.log("handleResponse",status);
    functions.logger.log(
      { User: username },
      {
        Response: {
          Status: status,
          Body: body,
        },
      }
    );
    if (body) {
      return res.status(200).json(body);
    }
    return res.sendStatus(status);
  };

  //username = '';
  try {
   
    console.log("cors run..");
    return cors(req, res, async () => {
      console.log("cors execute..");
      // Authentication requests are POSTed, other requests are forbidden
      if (req.method !== 'POST') {
        return handleResponse(username, 403);
      }
      username = req.body.username;
      if (!username) {
        return handleResponse(username, 400);
      }
      const password = req.body.password;
      if (!password) {
        return handleResponse(username, 400);
      }
      console.log("start authenticate..");
      // TODO(DEVELOPER): In production you'll need to update the `authenticate` function so that it authenticates with your own credentials system.
      const valid = await authenticate(username, password)
      if (!valid) {
        return handleResponse(username, 401); // Invalid username/password
      }

      // On success return the Firebase Custom Auth Token.
      const firebaseToken = await admin.auth().createCustomToken(username);
      return handleResponse(username, 200, { token: firebaseToken });
    });
  } catch (error) {
    console.log("error",error);
    return handleError(username, error);
  }
});

/**
 * Authenticate the provided credentials.
 * TODO(DEVELOPER): In production you'll need to update this function so that it authenticates with your own credentials system.
 * @returns {Promise<boolean>} success or failure.
 */
async function authenticate(username, password) {
  // For the purpose of this example use httpbin (https://httpbin.org) and send a basic authentication request.
  // (Only a password of `Testing123` will succeed)
  console.log("authendicate user....");
  //const authEndpoint = `https://httpbin.org/basic-auth/${username}/Testing123`;
  const authEndpoint = 'http://127.0.0.1:4000/auth';
  const response = await fetch(authEndpoint, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(username + ":" + password).toString('base64')
    }
  });
  console.log("response",response);
  if (response.status === 200) {
    return true;
  } else if (response.status === 401) {
    return false
  } else {
    throw new Error(`invalid response returned from ${authEndpoint} status code ${response.status}`)
  }
}


exports.signIn = functions.https.onRequest((req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  admin.auth().signInWithEmailAndPassword(email, password)
    .then(user => {
      return user.getIdToken().then(idToken => {
        res.status(200).json({idToken: idToken});
      })
    })
    .catch(error => {
      res.status(400).json(error.toJSON());
    });
});


// POST /api/messages
app.post('/api/messages', async (req, res) => {
  const message = req.body.message;

  functions.logger.log(`ANALYZING MESSAGE: "${message}"`);

  try {
    const results = await client.analyzeSentiment({
      document: { content: message, type: 'PLAIN_TEXT' }
    });

    const category = categorizeScore(results[0].documentSentiment.score);
    const data = {message: message, sentiment: results[0], category: category};

    // @ts-ignore
    const uid = req.user.uid;
    await admin.database().ref(`/users/${uid}/messages`).push(data);

    res.status(201).json({message, category});
  } catch(error) {
    functions.logger.log(
      'Error detecting sentiment or saving message',
      // @ts-ignore
      error.message
    );
    res.sendStatus(500);
  }
});

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });



exports.test = functions.https.onRequest((request, response) => {
    functions.logger.info("Test message", {structuredData: true});
    response.send("This is test message");
  });
 


exports.addMessage = functions.https.onRequest(async (req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into Firestore using the Firebase Admin SDK.
  const writeResult = await admin.firestore().collection('messages').add({original: original});
  // Send back a message that we've successfully written the message
  res.json({result: `Message with ID: ${writeResult.id} added.`});
});

// Expose the API as a function
exports.api = functions.https.onRequest(app);
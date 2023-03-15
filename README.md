# cloud-authentication

Installation steps:
===================

  npm install -g firebase-tools
  npm install firebase-functions@latest firebase-admin@latest --save

  To Run:
  =======
   firebase emulators:start

  In PostMan:
  ==========

    Signup/Register User:
    ---------------------
  
        URL: POST
            http://127.0.0.1:5001/fir-app-fd1be/us-central1/signup?email=tamil.selvan@angkas.com&password=password&name=Tamil  

    Verify Token:
    --------------
        URL: POST
            http://127.0.0.1:5001/fir-app-fd1be/us-central1/verifyToken

    Authorization: BearerToken <token>     

    Also verify the Token in JWT:
    ------------------------------
            https://jwt.io/
          
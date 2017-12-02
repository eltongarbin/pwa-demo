var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({ origin: true });
var webpush = require('web-push');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
var serviceAccount = require("./pwagram-fb-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwagram-90631.firebaseio.com"
});

exports.storePostData = functions.https.onRequest(function (request, response) {
  cors(request, response, function () {
    admin.database().ref('posts').push({
      id: request.body.id,
      title: request.body.title,
      location: request.body.location,
      image: request.body.image
    }).then(function () {
      webpush.setVapidDetails(
        'mailto:eltongarbin@gmail.com',
        'BCuZb0tS92J8RjwA284G5TAnQiEoopIz12cP5AZd0IcIvdfcxOypgdaxWlepR7absd7S1ulaomSkBRFi8IBe9yA',
        'Zl1kNvrh5Bu0Kh1D7eqpvrdbMNacvFXDDy2k9m788ZY'
      );

      return admin.database().ref('subscriptions').once('value');
    }).then(function (subscriptions) {
      subscriptions.forEach(function (sub) {
        var pushConfig = {
          endpoint: sub.val().endpoint,
          keys: {
            auth: sub.val().keys.auth,
            p256dh: sub.val().keys.p256dh
          }
        }

        webpush.sendNotification(pushConfig, JSON.stringify({
          title: 'New Post',
          content: 'New Post added!',
          openUrl: '/help'
        })).catch(function (err) {
          console.log(err);
        });
      });

      response.status(201).json({
        message: 'Data stored',
        id: request.body.id
      });
    }).catch(function (err) {
      response.status(500).json({ error: err });
    });
  });
});
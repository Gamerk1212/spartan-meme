// TODO: user accounts, meme creation, image upload
// --- OAuth ---
const oauthConfig = {
  "web":{
    "client_id":"466051148675-92biqfqrua5a1i7euj2f4npucvveek9v.apps.googleusercontent.com",
    "project_id":"spartan-meme-images",
    "auth_uri":"https://accounts.google.com/o/oauth2/auth",
    "token_uri":"https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs",
    "client_secret":"iNF7qm4dPY7wznlgOLO4drNO",
    "javascript_origins":["https://Memes-thing--simonkagle.repl.co"]
  }
}

// --- Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyBohhQsfMalxnuSv_mntFHW-pOEnaI2Vu4",
  authDomain: "spartan-meme-images.firebaseapp.com",
  databaseURL: "https://spartan-meme-images.firebaseio.com",
  projectId: "spartan-meme-images",
  storageBucket: "gs://spartan-meme-images.appspot.com/",
  messagingSenderId: "466051148675",
  appId: "1:466051148675:web:7a3d1d768e2f3bba"
};

// initialize firestore and firebase storage
firebase.initializeApp(firebaseConfig);

var database = firebase.firestore();
var meme_imgs = database.collection("meme_images").doc("images");

var storage = firebase.storage().ref();

// --- Image Panels ---

var posts = [];

const FLAG_IMAGE_SRC = "https://docs.google.com/drawings/d/e/2PACX-1vR8J24vQAuteUxFuVt-CVCvIJu9446_cnzCm65nHOOArAKMb26zaIj184RTggTNsreDPhN3n6avP0BC/pub?w=960&amp;h=720";

const UPVOTE_IMAGE_SRC = "https://docs.google.com/drawings/d/e/2PACX-1vTusdj9whfrVyuTLYyvlVg5m1cIIPSsfLnpWgeSSq0Shr-2eLDnRDDjseUkxNwiO49LGazuHN2CprA9/pub?w=288&h=288";

var is_paused = false;

class ImagePanel {
  constructor(id, img, upvotes, flagged=false){
    this.img_source = img;
    this.upvotes = upvotes;
    this.name = id;
    this.upvoted = false;
    this.flagged = false;

    // Setup image container div and image in div
    this.container = document.createElement("div");
    this.container.className = "img_container";

    this.image = document.createElement("img");
    this.image.src = img;
    this.image.width = 100;

    this.image_div = document.createElement("div");
    this.image_div.appendChild(this.image);

    this.container.appendChild(this.image_div);

    // button container
    this.button_container = document.createElement("div");
    this.button_container.className = "button_container";
    this.container.appendChild(this.button_container);

    // Add flag button
    this.flag_button = document.createElement("div");

    var flag_image = document.createElement("img");
    flag_image.src = FLAG_IMAGE_SRC;
    flag_image.width = 12;
    flag_image.height = 12;

    this.flag_button.appendChild(flag_image);
    this.flag_button.className = "ic_button";
    this.button_container.appendChild(this.flag_button);

    // Add upvote button
    this.upvote_button = document.createElement("div");

    var upvote_image = document.createElement("img");
    upvote_image.src = UPVOTE_IMAGE_SRC;
    upvote_image.width = 12;
    upvote_image.height = 12;

    this.upvote_button.appendChild(upvote_image);
    this.upvote_button.className = "ic_button";
    this.button_container.appendChild(this.upvote_button);
    
    // Add upvote counter
    this.upvote_counter = document.createElement("div");
    this.upvote_counter.innerText = "" + this.upvotes;
    this.upvote_counter.className = "upvote_count";
    this.upvote_button.appendChild(this.upvote_counter);

    // Button events
    var self = this;
    this.upvote_button.addEventListener("click", function (event){
      if (is_paused){
        return;
      }
      database.runTransaction(function(transaction){
        return transaction.get(meme_imgs).then(function(doc){
          if (!doc.exists) throw "Document does not exist";

          var trdata = {}
          trdata[self.name] = doc.data()[self.name];
          self.toggleUpvoted();
          self.updateUpvotes();
          trdata[self.name]["upvotes"] = self.upvotes;

          transaction.update(meme_imgs, trdata);
        });
      }).catch(i => console.log(i));
    });

    // Create a confirmation popup and delete if user says yes
    this.flag_button.addEventListener("click", function(event){
      if (is_paused){
        return;
      }
      var popup = document.createElement("div");
      popup.classList.add("flag_popup", "unblurred");
      document.body.appendChild(popup);

      var alert_text = document.createElement("div");
      alert_text.innerHTML = "\
      <h3>Are you sure you want to flag this?</h3> \
      <p>Content can be flagged for:</p> \
      <ul> \
        <li>Explicit content</li> \
        <li>Demeaning language</li> \
        <li>etc.</li>";
      
      var yes_button = document.createElement("div");
      yes_button.className = "text_button";
      yes_button.innerText = "Yes";
      yes_button.addEventListener("click", function(event){
        self.doFlagged();
        $("div").css("filter", "None");
        is_paused = false;
        document.body.removeChild(popup);
      });

      var no_button = document.createElement("div");
      no_button.className = "text_button";
      no_button.innerText = "Cancel";
      no_button.addEventListener("click", function(event){
        $("div").css("filter", "None");
        is_paused = false;
        document.body.removeChild(popup);
      });

      var flag_button_container = document.createElement("div");
      flag_button_container.className = "unblurred";

      popup.appendChild(alert_text);
      alert_text.appendChild(flag_button_container);
      flag_button_container.appendChild(yes_button);
      flag_button_container.appendChild(no_button);
      $('div').not(".unblurred").css("filter", "blur(3px)");
      $('.unblurred > *').css("filter", "None");
      is_paused = true;
    });

  }

  // Add panel to document
  show(){
    document.getElementById("main_content").appendChild(this.container);
  }

  // Remove panel from document
  hide(){
    document.getElementById("main_content").removeChild(this.container);
  }

  // Update the upvote counter next to the upvote button
  updateUpvotes(){
    this.upvote_counter.innerText = "" + this.upvotes;
  }

  // Toggle whether or not the user has upvoted a post
  toggleUpvoted(){
    this.upvotes += this.upvoted ? -1 : 1;
    this.upvoted = !this.upvoted;
  }

  getContainer(){
    return this.container;
  }

  getImageSource(){
    return this.img_source;
  }

  // Mark this panel as flagged
  doFlagged(){
    var self = this;
    this.flagged = true;
    database.runTransaction(function(transaction){
      return transaction.get(meme_imgs).then(function(doc){
        if (!doc.exists) throw "Document does not exist";

        var trdata = {}
        trdata[self.name] = doc.data()[self.name];
        trdata[self.name]["flagged"] = true;

        transaction.update(meme_imgs, trdata);
      });
    }).catch(i => console.log(i));
    this.hide();
  }

}

// Get images and display them
function get_posts(){
  posts.map(i => i.hide());
  posts = []
  meme_imgs.get()
  .then(function(doc){

    Object.keys(doc.data()).forEach(function(el){
      storage.child(doc.data()[el]["loc"]).getDownloadURL()
      .then(function(url){
        if (!doc.data()[el]["flagged"]) {
          posts.push(new ImagePanel(el, url, doc.data()[el]["upvotes"]));
        }
      })
      .then(function(){
        display_posts();
      })
      .catch(function(error){

        console.log(error);

      });

    });
  })
  .catch(function(error){
    console.log(error);
  });
}

// Function for after images load
function display_posts(){
  posts.sort(function(a, b){
    return b.upvotes - a.upvotes;
  });
  posts.map(i => i.show());
}

// User sign in
function onSignIn(user){
  var profile = user.getBasicProfile();
  console.log(profile);
}

get_posts();

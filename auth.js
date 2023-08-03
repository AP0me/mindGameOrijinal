const passport = require("passport");
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

const GOOGLE_CLIENT_ID = '398681020313-c19a25lj7vqrv8tp9mqfjbf77c4g7rf6.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(null, profile);
    // });
  }
));

passport.serializeUser(function(user,done){
  done(null, user);
});
passport.deserializeUser(function(user,done){
  done(null, user);
});
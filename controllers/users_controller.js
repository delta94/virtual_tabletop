const jwt = require('jsonwebtoken'); 
const bcrypt = require('bcryptjs'); 
const keys = require('../config/keys'); 
const User = require('../models/User'); 
const validateLoginInput = require('../validations/login');
const validateRegisterInput = require('../validations/register');


exports.login = function(req, res)  { 
 const { errors, isValid } = validateLoginInput(req.body);

  if (!isValid) { 
    return res.status(400).json(errors); 
  }
  const email = req.body.email;  // pull email from body of request 
  const password = req.body.password; //pull password 
  
  User.findOne({ email }) //find user object by email 
    .then(user => {      //returns a result 
      if (!user) {       //if no user adds email: erro to errors object 
        errors.email = 'User not found';
        return res.status(404).json(errors);
      }
  
      bcrypt.compare(password, user.password) // returns boolean 
        .then(isMatch => {
          if (isMatch) {
            const payload = { 
              id: user.id, 
              displayName: user.displayName, 
              profilePicture: user.profilePicture, 
              subcribedGames: user.gameSubscriptions
            }; //payload to be sent to redux store with jwt
  
            jwt.sign(
              payload,
              keys.secretOrKey,
              //there was something on the font end calling .exp
              { expiresIn: '14 days' }, //from zeit documentation should be same as ms('14 days')
              (err, token) => { //token is generated by combinding payload and header
                res.json({
                  success: true,
                  token: 'Bearer' + token
                });
              }
            )
          } else {
            errors.password = 'Incorrect password' 
            return res.status(400).json(errors);
          }
        })
    })
  
}

exports.register = function(req, res)  { 
 const {errors, isValid} = validateRegisterInput(req.body);

  if (!isValid) { 
    return res.status(400).json(errors)
  }
  
  User.findOne({ email: req.body.email })
    .then(user => {
      if (user) {
        // Throw a 400 error if the email address already exists
        errors.email = 'Email already exists'; 
        return res.status(400).json(errors); 
      } else {
        // Otherwise create a new user
        const newUser = new User({
          displayName: req.body.displayName,
          email: req.body.email,
          password: req.body.password
        })
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser.save()
              .then(user => {
                  const payload = { 
                    id: user.id,
                    displayName: user.displayName, 
                    profilePicture: user.profilePicture, 
                    subcribedGames: user.gameSubscriptions
                  }; //payload to be sent to redux store with jwt
                  jwt.sign(   
                      payload, 
                      keys.secretOrKey, 
                      //there was something on the font end calling .exp
                      {expiresIn: '14 days'}, 
                      (err, token) => { 
                        res.json({
                          success: true, 
                          token: 'Bearer' + token
                        });
                      }
                  )
                  })
              .catch(err => console.log(err));
          })
        })
      }
    })
}
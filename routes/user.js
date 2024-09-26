const router = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const {authenticateToken} = require("./userAuth");

//sign up

router.post("/sign-up", async function(req,res){
    try{
      const{username, email, password, address }= req.body;
      //console.log('Received data:', req.body);


      //check username length is more than 3
       if(username.length < 4){
        return res
        .status(400)
        .json({message: "username length should be greater than 3"})
       }

       //check username already exixst
       const existingUsername = await User.findOne({username: username});
       if(existingUsername){
        return res.status(400).json({message:"username already exists"})
       }

       //check email already exixst
       const existingEmail = await User.findOne({email: email});
       if(existingEmail){
        return res.status(400).json({message:"Email already exists"})
       }

       //check password's length
       if(password.length<= 5){
        return res
        .status(400)
        .json({message: "passwords length should be greater than 5"})
       }
       const hashpass = await bcrypt.hash(password, 10);

       const newUser = new User({
        username:username,
        email:email,
        password:hashpass,
        address:address,
    });
    await newUser.save();
    res.status(200).json({message: "SignUp successfully"});



    }catch(error){
        res.status(500).json({message: "Internal server error"});
    }
});

//sign in 
router.post("/sign-in", async function(req,res){
    try{
      const {username, password} = req.body;
       
      const existingUser = await User.findOne({username});
      if(!existingUser) {
        res.status(500).json({message: "Invalid credentials"});
      }

      await bcrypt.compare(password, existingUser.password, (err,data)=>{
       if(data){
        const authclaims = [
            {name: existingUser.username},
            {role: existingUser.role}
        ]
        const token = jwt.sign({authclaims}, "bookStore123",{
            expiresIn: "30d"
        });
        res.status(200)
        .json({
            id: existingUser.id, 
            role:existingUser.role,
             token: token,
        });
       }
       else{
        res.status(400).json({message: "Invalid credentials"});
       }
      });

    }catch(error){
        res.status(500).json({message: "Internal server error"});
    }
});

//get-user-information
router.get("/get-user-information", authenticateToken, async(req,res)=>{
    try{
     const {id} = req.headers;
     const data = await User.findById(id).select("-password");
     return res.status(200).json(data);
     

    }
    catch(error){
        res.status(500).json({message: "Internal server error"})

    }
});

//update address
router.put("/update-address", authenticateToken, async (req,res)=>{
    try{
     const {id} = req.headers;
     const {address} = req.body;
     await User.findByIdAndUpdate(id,{address:address });
     return res.status(200).json({message: "Address updated successfully"});
    }catch(error){
        res.status(500).json({message: "Internal server error"})
    }
})




module.exports = router;
import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcryptjs from 'bcryptjs'

export const signup = async (req,res)=>{
    const {fullName,email,password} = req.body;
    try{
        if(!fullName || !email || !password){
            return res.status(400).json({message:"All fields are required"})
        }

        //hash password
        if(password.length < 6){
            return res.status(400).json({message:"Password must be at least 6 characters"})
        }

        const user = await User.findOne({email})

        if(user) return res.status(400).json({message:"Email already exists"});

        const salt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash(password,salt)

        const newUser = new User(
            {
                fullName:fullName,
                email:email,//email:email and writing only email are same to be written inside the object
                password:hashedPassword
            }
        )

        if(newUser) {
            //generate jwt token here
            generateToken(newUser._id,res)
            await newUser.save();

            res.status(201).json({
                _id:newUser._id,
                fullName:newUser.fullName,
                email:newUser.email,
                profilePic:newUser.profilePic,
            })

        }else{
            res.status(400).json({message:"Invalid user data"});
        }
        
    }catch(error){
        console.log(`error in signup controller`,error.message)
        res.status(500).json({message:"Internal Server Error"})

    }
}

export const login =async (req,res)=>{
    const {email,password} = req.body;
    try{
        const user = await User.findOne({email})

        if(!user){
            return res.status(400).json({message:"Invalid Credentials"})
        }

        const isPasswordCorrect = await bcryptjs.compare(password,user.password)
        if(!isPasswordCorrect){
            return res.status(400).json({message:"Invalid Credentials"})
        }

        generateToken(user._id,res)
        res.status(200).json({
            _id:user._id,
            fullName:user.fullName,
            email:user.email,
            profilePic:user.profilePic
        })
    }catch(error){
        console.log("Error in login controller",error.message);
        return res.status(500).json({message:"Internal server error"})

    }
}
export const logout = (req,res)=>{
    try{
        res.cookie("jwt","",{maxAge:0})
        res.status(200).json({message:"Logged Out successfully"});
    } catch(error){
        console.log("Error in logout controller",error.message);
        return res.status(500).json({message:"Internal server error"})
    }
}


export const updateProfile = async (req,res)=> {
    try{
        const {profilePic}  = req.body;
        //req.user is added when the req passes through the protectedRoute middleware
        const userId = req.user._id;

        if(!profilePic){
            return res.status(400).json({message:"Profile pic is required"})
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic)

        //secure_url is a field that cloudinary gives you back for your photos
        const updatedUser = await User.findByIdAndUpdate(userId,{profilePic:uploadResponse.secure_url},{new:true})

        res.status(200).json(updatedUser);

    }catch(error){
        console.log("error in update profile",error);
        return res.status(500).json({message:"Internal server error"})
    }
}

export const checkAuth = (req,res)=>{
    try{
        res.status(200).json(req.user);
    }catch(error){
        console.log("Error in checkAuth controller:",error.message)
        return res.status(500).json({message:"Internal server error"})
    }
}
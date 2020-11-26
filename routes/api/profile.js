const { compare } = require('bcryptjs');
const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route     GET api/profile/me
// @desc      Get current users profile
// @access    Private
router.get('/me',auth, async (req,res)=> {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user',['name','avatar']);
        
        if(!profile){
            return res.status(400).json({msg:"Profile does not exist"});
        }

        res.json(profile);

    } catch(err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});


// @route     POST api/profile
// @desc      Create update user profile
// @access    Private

router.post('/',[auth,[
    check('status','Status is Required').not().isEmpty(),
    check('skills','Status is Required').not().isEmpty()
]], async (req,res) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const { 
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        twitter,
        linkedin,
        facebook,
        instagram
    } = req.body;

    // Build Profile Object
    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(bio) profileFields.bio = bio;
    if(location) profileFields.location = location;
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills){
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // Build Social object
    profileFields.social = {};
    if(youtube) profileFields.social.youtube = youtube;
    if(twitter) profileFields.social.twitter = twitter;
    if(facebook) profileFields.social.facebook = facebook;
    if(linkedin) profileFields.social.linkedin = linkedin;
    if(instagram) profileFields.social.instagram = instagram;

    try {
        let profile = await Profile.findOne({ user: req.user.id });

        if(profile){
            //Update
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                {$set: profileFields},
                {new: true}
            );

            return res.json(profile);
        }

        //Create
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);

    } catch(err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});



// @route     GET api/profile
// @desc      Get all profiles
// @access    Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user',['name','avatar']);
        res.json(profiles);        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");        
    }
});

// @route     GET api/profile/user/:user_id
// @desc      Get profile by user_id
// @access    Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user:req.params.user_id }).populate('user',['name','avatar']);

        if(!profile) return res.status(400).json({ msg: "Profile not found" });

        res.json(profile);        
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({ msg: "Profile not found" });
        }
        res.status(500).send("Server Error");        
    }
});



// @route     DELETE api/profile
// @desc      Delete user profile & posts
// @access    Private
router.delete('/', auth, async (req, res) => {
    try {
        await Profile.findOneAndRemove({ user: req.user.id });
        await User.findOneAndRemove({ _id: req.user.id });
        res.json({ msg: "User Deleted" });        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");        
    }
});


// @route     PUT api/profile/experience
// @desc      Add profile experience
// @access    Private
router.put('/experience', [auth,[
    check('title','Title is required').not().isEmpty(),
    check('company','Company is required').not().isEmpty(),
    check('from','From date is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    };

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");        
    }
});


// @route     DELETE api/profile/experience/:exp_id
// @desc      Delete experience from profile
// @access    Private
router.delete('/experience/:exp_id',auth,async (req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //Get Remove Index
        const removeIndex = profile.experience.map(exp => exp.id).indexOf(req.params.exp_id);

        if(removeIndex == -1){
            return res.json({ msg: "Experience does not exist in database" });
        }

        profile.experience.splice(removeIndex,1);
        await profile.save();

        res.json(profile);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");        
    }

});


// @route     PUT api/profile/education
// @desc      Add profile education
// @access    Private
router.put('/education', [auth,[
    check('school','School/College is required').not().isEmpty(),
    check('degree','Degree is required').not().isEmpty(),
    check('from','From date is required').not().isEmpty(),
    check('fieldofstudy','Field of study is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    };

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");        
    }
});


// @route     DELETE api/profile/education/:edu_id
// @desc      Delete education from profile
// @access    Private
router.delete('/education/:edu_id',auth,async (req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //Get Remove Index
        const removeIndex = profile.education.map(edu => edu.id).indexOf(req.params.edu_id);
        
        if(removeIndex == -1){
            return res.json({ msg: "Education does not exist in database" });
        }

        profile.education.splice(removeIndex,1);
        await profile.save();

        res.json(profile);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");        
    }

});


// @route     GET api/profile/github/:username
// @desc      Get user repos from Github
// @access    Public
router.get('/github/:username',(req,res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecrete')}`,
            method: 'GET',
            headers: {'user-agent': 'node.js'}
        };

        request(options,(error,response,body)=>{
            if(error){
                console.error(error);
            }
            if(response.statusCode !== 200){
                return res.status(404).json({ msg: "No Github profile found" });
            }

            res.json(JSON.parse(body));
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");        
    }
});


module.exports = router;
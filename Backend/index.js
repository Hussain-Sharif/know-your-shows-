  require('dotenv').config()
  const express = require('express');
  // The error you're encountering is a Cross-Origin Resource Sharing (CORS) issue. CORS is a security feature implemented by web browsers to prevent web pages from making requests to a different domain than the one that served the web page.
  const cros=require("cors")
  // Image to generate local to URL
  // const cloudinary=require("cloudinary")
  const bcrypt=require("bcrypt")
  const jwt=require("jsonwebtoken")
  const path = require('path') 

  const {open}=require('sqlite');
  const sqlite3=require('sqlite3');

  const app=express(); //Server instance

  app.use(cros())
  app.use(express.json())


  const dbPath = path.join(__dirname, "knowyourshows.db");

  let db = null;
  let PORT=process.env.PORT


  // // Return "https" URLs by setting secure: true
  // cloudinary.config({
  //   secure: true,
  //   cloud_name:process.env.CLOUDINARY_NAME,
  //   api_key:process.env.CLOUDINARY_API_KEY,
  //   api_secret:process.env.CLOUDINARY_API_SECRET,
  // });





  const initializeDBAndServer = async () => {
    try {
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });
      app.listen( PORT, () => {
        console.log(`Server Running at http://localhost:${PORT}/`);
      });
    } catch (e) {
      console.log(`DB Error: ${e.message}`);
      process.exit(1);
    }
  };

  initializeDBAndServer();


  // <<<============Image Generation through Cloudinary API=======>>>>
  // Log the configuration For Cloudinary 
  // console.log(cloudinary.config());

  // let result=null;
  // const image='./Images_to_url/login_bg.png'


    



  //Middleware Function
  const securityCheck=(request,response,next)=>{
    let jwtToken;
    const authHeader=request.headers["authorization"]
    if(authHeader!==undefined){
        jwtToken=authHeader.split(" ")[1]
    }
    if(jwtToken===undefined){
      response.status(401);
      response.send("Invalid Access Token")
    }else{
      jwt.verify(jwtToken,"Secret_key",async(err,user)=>{
        if(err){
          response.send("Invalid JWT Token")
        }else{
          next()
  }
  })
  }
  }
  // <<<<============>>>>> API'S


  // API for Home Page.

  app.get("/all/", securityCheck,async (request, response) => {    
      const {search,limit,offset}=request.query;
      console.log({search,limit,offset})
      const getAllShowsQuery = `
        SELECT 
          Shows.id,
          Shows.channel_id,
          Channels.channel,
          Channels.genre,
          Shows.show,
          Shows.start_of_show,
          Shows.end_of_show,
          Shows.language 
          FROM 
          Shows INNER JOIN Channels ON  Shows.channel_id=Channels.id
          WHERE 
          ((Shows.language LIKE "%${search}%") AND (Channels.genre Like "%${search}%") AND ((Channels.channel like "%${search}%" OR Shows.show like "%${search}%")))
          LIMIT ${limit} OFFSET ${offset};
          `;
      const showsArray = await db.all(getAllShowsQuery);
      console.log("Array Length: ",showsArray.length)
      response.send(showsArray);
    

    });



// API For Sign Up

app.post("/signup/",async (request,response)=>{
  const {username,password,email}=request.body
  const hasedPassword=await bcrypt.hash(password,10);
  
  const selectUserQurey=`SELECT * FROM User Where username="${username}";`
  const dbUserResult=await db.get(selectUserQurey);
  
  if(dbUserResult===undefined){
    const createUserQuery=`
      INSERT 
      INTO
      User(username,password,email)
      VALUES("${username}","${hasedPassword}","${email}");
    `
    await db.run(createUserQuery);
    response.send(JSON.stringify({success_msg:"User Created Successfully"}));
  }else{
    response.status(400);
    response.send(JSON.stringify({error_msg:"User is Already Existed..."}));
    
  }
})

// API For Login

app.post("/login/",async (request,response)=>{
  const {username,password}=request.body

  const selectUserQurey=`SELECT * FROM User Where username="${username}" OR email="${username}";`
  const dbUserResult=await db.get(selectUserQurey);
  
  if(dbUserResult===undefined){
    response.status(400)
    response.send(JSON.stringify({error_msg:"Invalid User"}))
  }else{
    const isPasswordMatched= await bcrypt.compare(password,dbUserResult.password)
    if(isPasswordMatched){
      const payload={username,password}
      const jwtToken=jwt.sign(payload,"Secret_key");
      response.status(200)
      response.send({jwtToken})
    }else{
      response.status(400)
      response.send("Invalid Password");
    }
  }
})


//<<<================>>> Image API

app.get("/kyslogo/",async (request,response)=>{
  // const result = await cloudinary.uploader.upload(image)
    // console.log(result)
    // console.log("Inside Home All:",result.secure_url);
  const logoQuery=`
    SELECT
    *
    FROM
    images;
  `
  const dbResult=await db.get(logoQuery);
  response.send(dbResult)
});

//<<<=================>>> Top Telugu Movies

app.get("/toptelugu/",securityCheck,async(request,response)=>{
  const topTeluguQuery=`
    SELECT 
    * 
    FROM 
    Shows INNER JOIN Channels ON  Shows.channel_id=Channels.id
    WHERE 
    Shows.language LIKE "%Telugu%" AND Shows.show LIKE "%Evening%" 
    LIMIT 5;
  `
  const dbResult=await db.all(topTeluguQuery)
  response.send(dbResult)
})

//<<<=================>>> Top Hindi Movies

app.get("/tophindi/",securityCheck,async(request,response)=>{
  const topHindiQuery=`
    SELECT 
    * 
    FROM 
    Shows INNER JOIN Channels ON  Shows.channel_id=Channels.id
    WHERE 
    Shows.language LIKE "%Hindi%" AND Shows.show LIKE "%Evening%" 
    LIMIT 5;
  `
  const dbResult=await db.all(topHindiQuery)
  response.send(dbResult)
})

//<<<=================>>> Top English Movies

app.get("/topenglish/",securityCheck,async(request,response)=>{
  const topEnglishQuery=`
    SELECT 
    * 
    FROM 
    Shows INNER JOIN Channels ON  Shows.channel_id=Channels.id
    WHERE 
    Shows.language LIKE "%English%" AND Shows.show LIKE "%Evening%" 
    LIMIT 5;
  `
  const dbResult=await db.all(topEnglishQuery)
  response.send(dbResult)
})
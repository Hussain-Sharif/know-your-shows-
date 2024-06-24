const express = require('express');
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const path = require('path') 

const {open}=require('sqlite');
const sqlite3=require('sqlite3');
const app=express(); //Server instance

app.use(express.json())

const PORT=3001

const dbPath = path.join(__dirname, "knowyourshows.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(PORT, () => {
      console.log(`Server Running at http://localhost:${PORT}/`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();


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
  
    const {search,limit,offset,genre,language}=request.query;
    console.log({search,limit,offset,genre,language})
    const getAllShowsQuery = `
      SELECT 
        * 
        FROM 
        Shows INNER JOIN Channels ON  Shows.channel_id=Channels.id
        WHERE 
        ((Shows.language LIKE "%${language}%") AND (Channels.genre Like "%${genre}%") AND ((Channels.channel like "%${search}%" OR Shows.show like "%${search}%")))
        LIMIT ${limit} OFFSET ${offset};;
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
    response.send("User Created Successfully");
  }else{
    response.status(400);
    response.send("User is Already Existed...");
    
  }
})

// API For Login

app.post("/login/",async (request,response)=>{
  const {username,password}=request.body

  const selectUserQurey=`SELECT * FROM User Where username="${username}";`
  const dbUserResult=await db.get(selectUserQurey);
  
  if(dbUserResult===undefined){
    response.status(400)
    response.send("Invalid User")
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


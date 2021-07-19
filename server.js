const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.URI, {useNewUrlParser: true,
useUnifiedTopology: true });
console.log(mongoose.connection.readyState);
mongoose.set('useFindAndModify', false);

const exerciseSchema = new mongoose.Schema({
  userId: {type:String, required:true},
  description : {type:String, required:true},
  duration: {type:Number, required:true},
  date: String
});
const Exercise = mongoose.model("Exercise",exerciseSchema)


const userSchema = new mongoose.Schema({
  username : {type: String, unique:true}
});
const User = mongoose.model("User",userSchema);


app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users",(req,res)=>{
  console.log(req.body);
  const newUser = new User({username:req.body.username});
  newUser.save((err,data)=>{
    if(err){
      return res.send("username already taken");
      console.log(err);
    } 
    res.json({"username":data.username, "_id":data.id});
  })
})

app.get("/api/users",(req,res)=>{
  User.find({},(err,data)=>{
    if(err) return console.error(err);
    res.json(data);
  })
})

app.post("/api/users/:_id/exercises",(req,res)=>{
  let newExercise = new Exercise({
    userId: req.params._id,
    description:req.body.description,
    duration:parseInt(req.body.duration),
    date: req.body.date===""?Date.now.toDateString():new Date(req.body.date).toDateString()
  })
  newExercise.save((err,data)=>{
    if(err) return console.log(err);
    //console.log(data);
  })
  User.findById(req.params._id,(err,data)=>{
    if(err) {
      return console.log(err);
      res.send("ID does not exists!")
    }
      let resObj = {};
      resObj._id=req.params._id;
      resObj.username=data.username;
      resObj.date= newExercise.date;
      resObj.duration=newExercise.duration;
      resObj.description=req.body.description;
      res.json(resObj);
      //console.log(resObj);
  })
})
app.get("/api/users/:_id/logs",(req,res)=>{
  User.findById(req.params._id,(err,data)=>{
    if(err) return console.log(err);
    let resObj = {};
  resObj._id = req.params._id;
    resObj.username = data.username;
    Exercise.find({userId:req.params._id},(err,data)=>{
    if(err) return console.log(err);
    //console.log(data);
    resObj.log=data;
    
    if(req.query.from || req.query.to){
      let  fromDate = new Date(0);
      let toDate = new Date();
      if(req.query.from){
        fromDate = new Date(req.query.from);
      }
      if(req.query.to){
        toDate = new Date(req.query.to);
      }
      fromDate = fromDate.getTime();
      toDate = toDate.getTime();
      resObj.log = resObj.log.filter(session=>{
        let sessionDate = new Date(session.date).getTime();
        return sessionDate >= fromDate && sessionDate<=toDate
      }) 
    }
    if(req.query.limit){
      resObj.log = resObj.log.slice(0,req.query.limit)
    }
    resObj.count = resObj.log.length;
    res.json(resObj);
    console.log(resObj);
    })
  })
})






const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

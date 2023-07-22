// server.js (backend)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path=require('path');
const app = express();
const port = process.env.port||5000;
require('dotenv').config();
const dbUrl=process.env.DATABASE;
// Middleware
app.use(bodyParser.json());
app.use(cors());
//app.use(express.static(path.join(__dirname+"/public")))
// Connect to MongoDB
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
});



const factSchema = new mongoose.Schema({
    text: String,
    source:String,
    category: String,
    votesInteresting: Number,
    votesMindblowing: Number,
    votesFalse: Number,
   

});

const Fact = mongoose.model('Fact', factSchema);

// API Endpoints
app.get('/api/facts', async (req, res) => {
  try {
    const category = req.query.category;
    let query = {};
    if (category && category !== 'all') {
      query = { category };
      //the above is equivalent to query = { category:category };
    }

    const facts = await Fact.find(query);
    res.json(facts);
  } catch (error) {
    console.error('Error fetching facts:', error);
  
  }
});

app.post('/api/facts',async(req,res)=>{
   const {text,source,category,votesInteresting,votesMindblowing,votesFalse}=req.body;
   const newFact=new Fact({
    text,
    source,
    category,
    votesInteresting,
    votesMindblowing,
    votesFalse
   });
   await newFact.save();
})

app.patch('/api/facts',async (req, res) => {
 
  const {factID, typeofbutton, count } = req.body;
  
  await Fact.updateOne({_id:factID},{$set:{[typeofbutton]:count}});
  
});
// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

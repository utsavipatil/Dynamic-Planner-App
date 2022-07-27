//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash'); //For customise List
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
// mongoose.connect('mongodb://localhost:27017/todolistDB'); //mongoDB connection localhost
mongoose.connect('mongodb+srv://user:password@cluster0.zh0chzo.mongodb.net/todolistDB'); //mongoDB connection mongoDB Atlas

const itemsSchema = new mongoose.Schema( //mongoose Schema
  {
    name : String
  }
);

const Item = mongoose.model('Item' , itemsSchema); //mongoose Model

const item1 = new Item(
  {
    name : "Welcome to your todolist!"
  }
);

const item2 = new Item(
  {
    name : "Hit + button to add a new item"
  }
);

const item3 = new Item(
  {
    name : "<-- Hit this to delete an item"
  }
);

const defaultItems = [item1 , item2 , item3];

const listSchema = { //List Schema (new mongoose.Schema is optional)
    name : String,
    items : [itemsSchema]
}

const List = mongoose.model('List' , listSchema); //List model

// Home Get
app.get("/", function(req, res) {

  const day = date.getDate();
  Item.find({} , function(err , foundItems){

    if(foundItems.length === 0){
        Item.insertMany( defaultItems , function(err){ //Everytime it will save repetitively
          if(err){
            console.log(err);
          }else{
            console.log("Successfully saved default Items to DB");
          }
        });

      res.redirect('/'); //It will redirect and render items
    }else{
        res.render("list", {listTitle: day, newListItems: foundItems});
    }

  });

});

// Home Post
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item(
    {
      name : itemName
    }
  );

  const day = date.getDate();

  if(listName === day){
    item.save();
    res.redirect('/');
  }else{
    List.findOne({name : listName} , function(err , foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect('/' + listName);
    });
  }

});

// Delete
app.post('/delete' , function(req ,res){
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;
  // Item.deleteOne({_id : checkedItemID} , function(err){ //With deleteOne
  //   if(err){
  //     console.log(err);
  //   }else{
  //     console.log("Successfully delete from DB");
  //   }
  // });

  const day = date.getDate();

  if(listName === day){
    Item.findByIdAndRemove(checkedItemID , function(err){
      if(err){
            console.log(err);
          }else{
            console.log("Successfully delete from DB");
            res.redirect('/');
      }
    });
  }else{
    List.findOneAndUpdate({name:listName} , {$pull : {items : {_id : checkedItemID}}} , function(err , foundList){
      if(!err){
        res.redirect('/' + listName);
      }
    });
  }
});

// Dynamic Pages
app.get('/:customListName', function(req , res){ //: => any values will replicate to title key (Dynamic URL feature of express)
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name : customListName} , function(err , foundList){
      if(!err){
        if(!foundList){
          //Create new List
          const list = new List(
            {
              name : customListName,
              items : defaultItems //new List so default items added
            }
          );

          list.save();
          res.redirect('/' + customListName);
        }else{
          //Show and existing list
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
      }
  })


});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started Successfully");
});

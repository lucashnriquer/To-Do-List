const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/blogDB");

const itemsSchema = new mongoose.Schema({
  name: String,
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});
const item2 = new Item({
  name: "Hit the + button to add a new item.",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

app.listen(process.env.PORT || 3000, () => {
  console.log("Server has started succesfully.");
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/", (req, res) => {
  Item.find((err, items) => {
    if (err) {
      console.log(err);
    } else {
      if (items.length === 0) {
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Succesfully saved default items to DB.");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: items });
      }
    }
  });
});

app.get("/:customListName", (req, res) => {
  customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, (err, list) => {
    if (err) {
      console.log(err);
    } else {
      if (!list) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save().then(() => {
          res.redirect("/" + customListName);
        });
      } else {
        res.render("list", { listTitle: list.name, newListItems: list.items });
      }
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, list) => {
      if (err) {
        console.log(err);
      } else {
        list.items.push(item);
        list.save().then(() => {
          res.redirect("/" + listName);
        });
      }
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Succesfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      if (err) {
        console.log(err);
      } else {
        foundList.items.pull({ _id: checkedItemId });
        foundList.save(function () {
          res.redirect("/" + listName);
        });
      }
    });
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

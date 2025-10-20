const mysql = require("mysql2");
const express = require("express");
const app = express();

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'ecommerce',
    password: 'MySql@0910'
});

app.get("/home", (req, res) => {
    res.render("login.ejs");
});

app.post("/check", (req, res) => {
    let { c_id, Email } = req.body;
    let q = `select * from customer where c_id=? AND c_email=?;`;
    connection.query(q, [c_id, Email], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("<h1>Some error in database</h1>");
        }

        if (result.length > 0) {
            res.render("Category.ejs", { c_id });
        } else {
            res.render("index.ejs", { message: "Invalid Id or Email, please try again or register" });
        }
    });
});

app.get("/register", (req, res) => {
    res.render("Registration.ejs");
})

app.post("/register", (req, res) => {
    let { c_id, Username, Email } = req.body;
    let q = `INSERT INTO CUSTOMER VALUES(?,?,?);`;
    connection.query(q, [c_id, Username, Email], (err, result) => {
        res.send('<h1>Succesfully registed go to login page</h1><br><form action="/login"><button>Login</button></form>');
    })
})

app.get("/login", (req, res) => {
    res.render("login.ejs");
})

app.post("/show/:id", (req, res) => {
    let id = parseInt(req.params.id);
    let choice = parseInt(req.body.Category);
    console.log(choice);
    q = `select p_id,p_name,p_rate,p_quantity from product where id=?`;
    try {
        connection.query(q, [choice], (err, result) => {
            if (err) throw err;
            if (result.length > 0) {
                res.render("Products.ejs", { result, id });
            } else {
                res.send("No data is found of this category");
            }

        });
    } catch (err) {
        console.log(err);
        res.send("some error in database");
    }
});


app.post("/cart/:c_id/product/:id", (req, res) => {
    const c_id = parseInt(req.params.c_id);
    const id = parseInt(req.params.id);
    const quantity = parseInt(req.body.quantity);
    console.log("quantity is", quantity);
    let q1 = `select p_id,p_name,p_rate from product where p_id=?;`;
    let q2 = `insert into cart values(?,?,?,?,?,?);`;
    let q3 = `Select * from cart;`;
    connection.query(q1, [id], (err, result1) => {
        console.log("query 1 successfull");
        let { p_id, p_name, p_rate } = result1[0];
        connection.query(q2, [quantity, p_id, p_name, p_rate, c_id,quantity*p_rate], (err, result2) => {
            console.log("query 2 successfull");
            connection.query(q3, (err, result) => {
                console.log(result);
                res.render("cart.ejs", { product1: result, c_id });
            })
        });
    });
});

app.get("/category/:c_id", (req, res) => {
    let c_id = req.params.c_id;
    res.render("Category.ejs", { c_id });
})

app.get("/order/:c_id", (req, res) => {
    let c_id = req.params.c_id;
    let q1 = `select p_id,p_n,quantity,p_r from cart where c_id=?;`;
    let q2 = `insert into order_details (p_id,c_id,p_name,quantity,p_rate) values(?,?,?,?,?);`;
    let q3 = `select SUM(tr) as total from cart;`;
    let q4 = `Update product set p_quantity=p_quantity-? where p_id=?; `;
    connection.query(q1, [c_id], (err, result) => {
        if (err) throw err;
        console.log("q1 successfull");
        let completed = 0;
        result.forEach((item) => {
            connection.query(q2, [item.p_id, c_id, item.p_n, item.quantity, item.p_r], (err2) => {
                if (err2) throw err2;
                console.log("Value inserted");
                //total_rate+=item.p_r;
                connection.query(q4, [item.quantity, item.p_id], (err4, result4) => {
                    if (err4) throw err4;
                    console.log("q4 s successfull");
                    completed++;
                    if (completed === result.length) {
                        connection.query(q3, (err3, result3) => {
                            res.render("Orderdetails.ejs", { product2: result, Total: result3[0].total, c_id });
                            console.log(result3[0].total);
                        })
                    }
                })
            })
        })
    })
})

app.get("/final/:id", (req, res) => {
    let q1 = `truncate table cart;`;
    connection.query(q1,(err,result)=>{
        console.log("Successfull transaction");
        res.render("index.ejs",{message:"Thank You !! Visit Us Again.."});
    })
})

app.listen(8080, () => {
    console.log("app is listening");
})
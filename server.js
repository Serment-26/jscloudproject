const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const dbName='project';
const mongourl = 'mongodb+srv://s1253745:ccgss123@cluster0.diyj2.mongodb.net/test?retryWrites=true&w=majority';
const formidable = require('express-formidable');
const fs = require('fs');
var objID= require('mongodb').ObjectID;
const secretkey1="this is just too new for me to learn";
const secretkey2="why so many bug";
app.set('view engine','ejs');
/*start login session
    username:string
    authenticated:boolean
*/
const users = new Array(
	{name: 'demo', password: 'demo'},
	{name: 'student', password: 'student'}
);// support parsing of application/json type post data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    name: 'loginSession',
    keys: [secretkey1,secretkey2]
}));

// all the function related to database
const handle_Find = (ac,res,crit) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server(handle_find)");
        const db = client.db(dbName);
        console.log(crit);    
        var cursor = db.collection("restaurant").find(crit);
        cursor.toArray((err,docs) => {
            assert.equal(err,null);
            client.close();
            res.render('search',{user:ac,numofr:docs.length,crit:JSON.stringify(crit),c:docs})
        });     
    });
}
//--------------------this is useless--------------------
const login_user = (res,crit,callback) =>{
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server(login_user)");
        const db = client.db(dbName);
        db.collection('account').findOne(crit,(err,result)=>{
            if (result==null){
                client.close();           
                res.render('info',{tname:"login failure!",reason:"No such user(wrong password or username?)"});
            }else{
                client.close();
                callback();
            }
        });
    });
}
//---------------------this is useless-------------------------------
const reg_user = (res,crit) =>{
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server(reg_user)");
        const db = client.db(dbName);
        db.collection('account').findOne(crit,(err,result)=>{
            if (result==null){
                db.collection('account').insertOne(crit,(err,result)=>{
                    if (err) {console.log(err);}
                    else{
                        client.close();
                        console.log("Closed DB connection\nregister success!");
                        res.render('info',{tname:"register success!",reason:"you have register a new ac successfully!"})
                    }            
                });               
            }else{
                client.close();
                console.log("Closed DB connection");
                res.render('info',{tname:"register fail!",reason:"you have fail to register a new ac!(properly have the same account)"})
            }
        })      
    });
}
//create restaurant
const create_restaurant=(req, res,ac)=>{
    var doc={};
    doc['owner'] = ac;
    doc['name'] = req.fields.name;
    doc['borough'] = req.fields.borough;
    doc['cuisine'] = req.fields.cuisine;
    doc['address'] = {
        'street': req.fields.street,
        'zipcode': req.fields.zipcode,
        'building': req.fields.building,
        'coord': { 'lat': req.fields.lat, 
                   'lon': req.fields.lon }
    };
    var filename=req.files.sampleFile;
    if (filename.size > 0) {
        fs.readFile(filename.path, (err, data) => {
            if(err){console.log(err);}
            doc['photo'] = new Buffer.from(data).toString('base64');
        });
    }
    const client = new MongoClient(mongourl);
    client.connect((err)=>{
        assert.equal(null,err);
        console.log("Connected successfully to server(Create restarant)");
        const db = client.db(dbName);
        db.collection("restaurant").insertOne(doc,(err, results)=>{
                client.close();
                if(err){console.log(err);}
                res.render('info',{tname:"Create success!",reason:"you have create a new restaurant successfully!"})
            }
        );
    });
}
//restaurant detail
const restarant_detail=(ac,res,crit)=>{
    var restID=objID(crit._id);
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server(restarant_detail)");
        const db = client.db(dbName);
        db.collection("restaurant").findOne(restID,(err,docs) => {
            assert.equal(err,null);
            client.close();
            res.render('restaurant',{c:docs,user:ac});
        });          
    });
}
//remove restaurant
const del_restaurant=(crit,res,ac)=>{
    var restID=objID(crit._id);
    var doc={};
    doc['owner']=ac;
    doc['_id']=restID;
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server(del_restaurant)");
        const db = client.db(dbName);
        db.collection("restaurant").findOne(doc,(err,result)=>{
            if(result==null){
                client.close();
                res.render('info',{tname:"You faker!",reason:"Delete unsuccessful!"})
            }else{
                db.collection("restaurant").deleteOne(doc,(err,result)=>{
                    if (err) {console.log(err);}
                    client.close();
                    console.log("delete successfully!");
                    res.render('info',{tname:"Delete success!",reason:"you have delete a restaurant successfully!"})        
                })
            }              
        }); 
    });
}
//load data of targeted restaurant
const load_targetrestaurant=(crit,res,ac)=>{
    var restID=objID(crit._id);
    var doc={};
    doc['owner']=ac;
    doc['_id']=restID;
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server(load_restaurant)");
        const db = client.db(dbName);
        var cursor = db.collection("restaurant").find(doc);
        cursor.toArray((err,result)=>{
            assert.equal(err,null);
            if(result==null||result==""||result=="[]"){
                client.close();
                res.render('info',{tname:"You faker!",reason:"you are not the owner"})
            }else{
                if (err) {console.log(err);}
                client.close();
                res.render('modify',{c:result});        
            }
        });     
    });
}
//update restaurant remeber parameter after fixing here
const update_restaurant=(req,res)=>{
    var docid={}
    docid['_id']=objID(req.fields.restid);
    var doc={};
    doc['owner'] = req.fields.userid;
    doc['name'] = req.fields.name;
    doc['borough'] = req.fields.borough;
    doc['cuisine'] = req.fields.cuisine;
    doc['address'] = {
        'street': req.fields.street,
        'zipcode': req.fields.zipcode,
        'building': req.fields.building,
        'coord': { 'lat': req.fields.lat, 
                   'lon': req.fields.lon }
    };
    var filename=req.files.sampleFile;
    if (filename.size > 0) {
        fs.readFile(filename.path, (err, data) => {
            if(err){console.log(err);}
            doc['photo'] = new Buffer.from(data).toString('base64');
        });
    }
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server(update_restaurant)");
        const db = client.db(dbName);
        db.collection("restaurant").updateOne(docid,{
            $set : doc
        },(err,result)=>{
            if(err){throw err}         
            client.close();
            console.log(result.result.nModified+" updated document");
            res.render('info',{tname:"update success!",reason:"you have successfully update a restaurant!"});
            
        });
    }); 
}
//after rate action
const rate_restaurant=(req,res,ac)=>{
    var iddoc={};
    iddoc['_id']=objID(req.fields.restid);
    var doc={};
    doc['_id']=objID(req.fields.restid);
    doc['grades.user']=ac;
    var setdoc={};
    setdoc['grades']={'user':ac,
                      'score':req.fields.score};
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        console.log('connect to server successfully (rate restaurant)');
        const db = client.db(dbName);
        db.collection("restaurant").findOne(doc,(err,result)=>{
            //console.log(JSON.stringify(result));
            if(result==null){
                db.collection("restaurant").updateOne(iddoc,{
                    $push: setdoc
                },(err,results)=>{
                    client.close();
                    assert.equal(err, null);
                    res.render('info',{tname:"rate success!",reason:`you have rated ${results.result.nModified} restaurant!`});      
                });
            }else{
                client.close();
                res.render('info',{tname:"rate fail!",reason:"you have fail rating!"});
            }     
        });
    });
}
//get api data
const api_restdata=(para,crit,res)=>{
    var doc={}
    if(para=="_id"){doc[para]=objID(crit);}
    else{doc[para]=crit;}
    const client = new MongoClient(mongourl);    
    client.connect((err) => {
        assert.equal(null, err);
        const db = client.db(dbName);
        db.collection("restaurant").findOne(doc,(err,result)=>{
            client.close();
            res.json(result);
        });
    });
}
//end of functions

//default routing
app.get('/',(req,res)=>{
    if(!req.session.authenticated){
        res.redirect('/login');
    }else{
        res.redirect('/search')
    }
})
// register new user on the system
app.get('/register',(req,res)=>{
    res.status(200).render('register',{});
})
app.post(('/register'),(req,res)=>{
    reg_user(res,req.body)
})
//login user
app.get('/login',(req,res) => {
    res.status(200).render('login',{});
});
// receive user logined action
app.post('/login', (req,res) => {
   /* login_user(res,req.body,()=>{
        req.session.authenticated=true;
        req.session.username=req.body.acc;
        res.redirect('/');  
    });*/
  //maybe change to this stupid login(it happened!)
  users.forEach((user) => {
    if (user.name == req.body.acc) {
        req.session.authenticated = true;        
        req.session.username = req.body.acc;			
    }
});
res.redirect('/');
});
// search function?
app.get('/search',(req,res) => {
    console.log('going search');
    handle_Find(req.session.username,res,req.query);
    
});
// logout
app.get('/logout', function(req,res) {
    req.session = null;
    res.redirect('/');
});
//create new restaurant
app.get('/create',(req,res) => {
    res.render('create',{});
});
// receive restaurant info
app.post('/create', formidable(), (req,res) => {
    create_restaurant(req,res,req.session.username);
});
//restaurant detail
app.get('/restaurant',(req,res) => {
    restarant_detail(req.session.username,res,req.query);
});
app.get('/remove',(req,res) => {
    del_restaurant(req.query,res,req.session.username);
});
app.get('/modify',(req,res) => {
    load_targetrestaurant(req.query,res,req.session.username);
});
// receive restaurant info
app.post('/modify', formidable(), (req,res) => {
    update_restaurant(req,res);
});
//rate restaurant
app.post('/rate',formidable(),(req,res)=>{
    rate_restaurant(req,res,req.session.username);
});
app.get('/rate',(req,res) => {
    res.render('rate',{c:req.query});
});
//Q8 api 
app.get('/api/restaurant/:para/:crit',(req,res)=>{
    api_restdata(req.params.para,req.params.crit,res);
});

app.listen(process.env.PORT || 8099);
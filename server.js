var express = require('express');
//var session = require('cookie-session'); // Loads the piece of middleware for sessions
var bodyParser = require('body-parser'); // Loads the piece of middleware for managing the settings
https://github.com/pritilatab/node-demo-sample-api
var path = require('path');

const mysql = require('mysql');//mysql db
const port = 8080;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//fix the cross origin request (CORS) issue
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

/* Using sessions */
//app.use(session({ secret: 'wmt1ockbtopsecret' }));

/* 
* Init DB code
*/
const dbhost = 'custom-mysql.gamification.svc.cluster.local';
const dbuser = 'xxuser';
const dbpass = 'welcome1';
const dbschema = 'sampledb';

const db = mysql.createConnection({
  host: dbhost,
  user: dbuser,
  password: dbpass,
  database: dbschema
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

global.dbconn = db;

// default route
app.get('/', function (req, res) {
    return res.send({ error: true, message: 'Following APIs supported - /api/status/ ; /api/getproducts/' })

});

/* API action: product list */
app.get('/prodlist', function(req, res) {

  let sqlQuery = "Select item_number, CONCAT(description,'--',SKU_ATTRIBUTE_VALUE1,'--',SKU_ATTRIBUTE_VALUE2) item_desc from " + dbschema + ".XXIBM_PRODUCT_SKU";

  global.dbconn.query(sqlQuery, function(err, rows, fields) {
    if (err) throw err;

    console.log('DB fetch success for /prodlist');

    //console.log(rows);
    res.type('application/json');
    res.end(JSON.stringify(rows));
  })

})

  /* API action: DEBUG - Display product list as HTML */
  .get('/prodlist_show', function(req, res) {

    let sqlQuery = "Select item_number, CONCAT(description,'--',SKU_ATTRIBUTE_VALUE1,'--',SKU_ATTRIBUTE_VALUE2) item_desc from " + dbschema + ".XXIBM_PRODUCT_SKU";

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /prodlist_debug');

      res.render('prodlist.ejs', { prodlist: rows });
    })
  })

  /* API action: Item details based on Item_Number */
  .get('/itemdetail/:id', function(req, res) {

    let sqlQuery = "Select   a.Item_Number sku_Item_Number,   a.Description sku_Description,   a.Long_Description sku_Long_Description,   a.Catalogue_Category sku_Catalogue_Category,   a.SKU_UNIT_OF_MEASURE sku_SKU_UNIT_OF_MEASURE,   a.Style_Item sku_Style_Item,   a.SKU_ATTRIBUTE1 sku_SKU_ATTRIBUTE1,   a.SKU_ATTRIBUTE2 sku_SKU_ATTRIBUTE2,   a.SKU_ATTRIBUTE3 sku_SKU_ATTRIBUTE3,   a.SKU_ATTRIBUTE4 sku_SKU_ATTRIBUTE4,   a.SKU_ATTRIBUTE5 sku_SKU_ATTRIBUTE5,   a.SKU_ATTRIBUTE6 sku_SKU_ATTRIBUTE6,   a.SKU_ATTRIBUTE_VALUE1 sku_SKU_ATTRIBUTE_VALUE1,   a.SKU_ATTRIBUTE_VALUE2 sku_SKU_ATTRIBUTE_VALUE2,   a.SKU_ATTRIBUTE_VALUE3 sku_SKU_ATTRIBUTE_VALUE3,   a.SKU_ATTRIBUTE_VALUE4 sku_SKU_ATTRIBUTE_VALUE4,   a.SKU_ATTRIBUTE_VALUE5 sku_SKU_ATTRIBUTE_VALUE5,   a.SKU_ATTRIBUTE_VALUE6 sku_SKU_ATTRIBUTE_VALUE6,   b.Segment cat_Segment,   b.Segment_Name cat_Segment_Name,   b.Family cat_Family,   b.Family_Name cat_Family_Name,   b.Class cat_Class,   b.Class_Name cat_Class_Name,   b.Commodity_Name cat_Commodity_Name,   c.Description sty_Description,   c.Long_Description sty_Long_Description,   c.Brand sty_Brand,   p.PriceID prc_PriceID,   p.List_Price prc_List_Price,   p.Discount prc_Discount,   p.InStock prc_InStock,   p.Price_Effective_Date prc_Price_Effective_Date from   " + dbschema + ".XXIBM_PRODUCT_SKU a  inner join " + dbschema + ".XXIBM_PRODUCT_CATALOGUE b  on a.Catalogue_Category = b.Commodity inner join " + dbschema + ".XXIBM_PRODUCT_STYLE c  on a.Style_Item = c.Item_Number left outer join " + dbschema + ".XXIBM_PRODUCT_PRICING p  on a.Item_Number = p.Item_Number where a.Item_Number = ?";

    global.dbconn.query(sqlQuery, [req.params.id], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /itemdetail/id');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: DEBUG - Item details based on Item_Number */
  .get('/itemdetail_show/:id', function(req, res) {

    let sqlQuery = "Select   a.Item_Number sku_Item_Number,   a.Description sku_Description,   a.Long_Description sku_Long_Description,   a.Catalogue_Category sku_Catalogue_Category,   a.SKU_UNIT_OF_MEASURE sku_SKU_UNIT_OF_MEASURE,   a.Style_Item sku_Style_Item,   a.SKU_ATTRIBUTE1 sku_SKU_ATTRIBUTE1,   a.SKU_ATTRIBUTE2 sku_SKU_ATTRIBUTE2,   a.SKU_ATTRIBUTE3 sku_SKU_ATTRIBUTE3,   a.SKU_ATTRIBUTE4 sku_SKU_ATTRIBUTE4,   a.SKU_ATTRIBUTE5 sku_SKU_ATTRIBUTE5,   a.SKU_ATTRIBUTE6 sku_SKU_ATTRIBUTE6,   a.SKU_ATTRIBUTE_VALUE1 sku_SKU_ATTRIBUTE_VALUE1,   a.SKU_ATTRIBUTE_VALUE2 sku_SKU_ATTRIBUTE_VALUE2,   a.SKU_ATTRIBUTE_VALUE3 sku_SKU_ATTRIBUTE_VALUE3,   a.SKU_ATTRIBUTE_VALUE4 sku_SKU_ATTRIBUTE_VALUE4,   a.SKU_ATTRIBUTE_VALUE5 sku_SKU_ATTRIBUTE_VALUE5,   a.SKU_ATTRIBUTE_VALUE6 sku_SKU_ATTRIBUTE_VALUE6,   b.Segment cat_Segment,   b.Segment_Name cat_Segment_Name,   b.Family cat_Family,   b.Family_Name cat_Family_Name,   b.Class cat_Class,   b.Class_Name cat_Class_Name,   b.Commodity_Name cat_Commodity_Name,   c.Description sty_Description,   c.Long_Description sty_Long_Description,   c.Brand sty_Brand,   p.PriceID prc_PriceID,   p.List_Price prc_List_Price,   p.Discount prc_Discount,   p.InStock prc_InStock,   p.Price_Effective_Date prc_Price_Effective_Date from   " + dbschema + ".XXIBM_PRODUCT_SKU a  inner join " + dbschema + ".XXIBM_PRODUCT_CATALOGUE b  on a.Catalogue_Category = b.Commodity inner join " + dbschema + ".XXIBM_PRODUCT_STYLE c  on a.Style_Item = c.Item_Number left outer join " + dbschema + ".XXIBM_PRODUCT_PRICING p  on a.Item_Number = p.Item_Number where a.Item_Number = ?";

    global.dbconn.query(sqlQuery, [req.params.id], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /itemdetail/id');

      //console.log(rows);
      res.render('itemdetail.ejs', { itemdetail: rows });
    })

  })


  /* API action: Search - Products based on description */
  .get('/search/:q', function(req, res) {

    let sqlQuery = "SELECT a.Item_Number, a.Description, a.Long_Description, b.Commodity_Name from " + dbschema + ".XXIBM_PRODUCT_SKU a  inner join " + dbschema + ".XXIBM_PRODUCT_CATALOGUE b on a.Catalogue_Category = b.Commodity where a.Description like '%" + req.params.q + "%' or a.Long_Description like '%" + req.params.q + "%'";

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /search/:q');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })

  
  /* API action: All Item details Under a Commodity */
  .get('/commodity/:id', function(req, res) {

    let sqlQuery = "Select   a.Item_Number sku_Item_Number,   a.Description sku_Description,   a.Long_Description sku_Long_Description,   a.Catalogue_Category sku_Catalogue_Category,   a.SKU_UNIT_OF_MEASURE sku_SKU_UNIT_OF_MEASURE,   a.Style_Item sku_Style_Item,   a.SKU_ATTRIBUTE1 sku_SKU_ATTRIBUTE1,   a.SKU_ATTRIBUTE2 sku_SKU_ATTRIBUTE2,   a.SKU_ATTRIBUTE3 sku_SKU_ATTRIBUTE3,   a.SKU_ATTRIBUTE4 sku_SKU_ATTRIBUTE4,   a.SKU_ATTRIBUTE5 sku_SKU_ATTRIBUTE5,   a.SKU_ATTRIBUTE6 sku_SKU_ATTRIBUTE6,   a.SKU_ATTRIBUTE_VALUE1 sku_SKU_ATTRIBUTE_VALUE1,   a.SKU_ATTRIBUTE_VALUE2 sku_SKU_ATTRIBUTE_VALUE2,   a.SKU_ATTRIBUTE_VALUE3 sku_SKU_ATTRIBUTE_VALUE3,   a.SKU_ATTRIBUTE_VALUE4 sku_SKU_ATTRIBUTE_VALUE4,   a.SKU_ATTRIBUTE_VALUE5 sku_SKU_ATTRIBUTE_VALUE5,   a.SKU_ATTRIBUTE_VALUE6 sku_SKU_ATTRIBUTE_VALUE6,   b.Segment cat_Segment,   b.Segment_Name cat_Segment_Name,   b.Family cat_Family,   b.Family_Name cat_Family_Name,   b.Class cat_Class,   b.Class_Name cat_Class_Name,   b.Commodity_Name cat_Commodity_Name,   c.Description sty_Description,   c.Long_Description sty_Long_Description,   c.Brand sty_Brand,   p.PriceID prc_PriceID,   p.List_Price prc_List_Price,   p.Discount prc_Discount,   p.InStock prc_InStock,   p.Price_Effective_Date prc_Price_Effective_Date from   " + dbschema + ".XXIBM_PRODUCT_SKU a  inner join " + dbschema + ".XXIBM_PRODUCT_CATALOGUE b  on a.Catalogue_Category = b.Commodity inner join " + dbschema + ".XXIBM_PRODUCT_STYLE c  on a.Style_Item = c.Item_Number left outer join " + dbschema + ".XXIBM_PRODUCT_PRICING p  on a.Item_Number = p.Item_Number where a.Catalogue_Category = ?";

    global.dbconn.query(sqlQuery, [req.params.id], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /itemdetail/id');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: Segment List */
  .get('/segments', function(req, res) {

    let sqlQuery = "Select distinct segment_name from " + dbschema + ".XXIBM_PRODUCT_CATALOGUE";

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })
  })


  /* API action: Family List ALL */
  .get('/families', function(req, res) {

    let sqlQuery = "Select distinct family, Family_Name from " + dbschema + ".XXIBM_PRODUCT_CATALOGUE";

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /families');

      //console.log(rows);
      
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: Get Family, Class and Commodity */
  .get('/segment/:seg/families', function(req, res) {

    let sqlQuery = "Select distinct Segment_Name, Family_Name from " + dbschema + ".XXIBM_PRODUCT_CATALOGUE where Segment = ?";

    global.dbconn.query(sqlQuery, [req.params.seg], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments/id/families');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: Family List per Segment */
  .get('/segment/:seg/families', function(req, res) {

    let sqlQuery = "Select distinct Segment_Name, Family_Name from " + dbschema + ".XXIBM_PRODUCT_CATALOGUE where Segment = ?";

    global.dbconn.query(sqlQuery, [req.params.seg], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments/id/families');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })

  /* API action: Class List per Segment and Family */
  .get('/segment/:seg/family/:fam/classes', function(req, res) {

    let sqlQuery = "Select distinct Segment_Name, Family_Name, class_Name from " + dbschema + ".XXIBM_PRODUCT_CATALOGUE where Segment = ? and Family = ?";

    global.dbconn.query(sqlQuery, [req.params.seg, req.params.fam], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments/id/families/id/classes');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: Class List per Family */
  .get('/family/:fam/classes', function(req, res) {

    let sqlQuery = "Select distinct Segment_Name, Family_Name, class_Name from " + dbschema + ".XXIBM_PRODUCT_CATALOGUE where Family = ?";

    global.dbconn.query(sqlQuery, [req.params.fam], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /family/id/classes');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })

  /* API action: Commodity List per Segment, Family and class */
  .get('/segment/:seg/family/:fam/class/:cls/commodities', function(req, res) {

    let sqlQuery = "Select distinct Segment_Name, Family_Name, class_Name, commodity_Name from " + dbschema + ".XXIBM_PRODUCT_CATALOGUE where Segment = ? and Family = ? and class = ?";

    global.dbconn.query(sqlQuery, [req.params.seg, req.params.fam, req.params.cls], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments/id/families/id/class/id/commodities');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: Search by all */
  .get('/segment/:seg/family/:fam/classes', function(req, res) {

    let sqlQuery = "Select distinct Segment_Name, Family_Name, class_Name from " + dbschema + ".XXIBM_PRODUCT_CATALOGUE where Segment = ? and Family = ?";

    global.dbconn.query(sqlQuery, [req.params.seg, req.params.fam], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments/id/families/id/classes');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


//need to remove the code later
  /* API action: Homepage render */
  .get('/prodhome', function(req, res) {
      //res.render('prodhome.ejs', {});  
      res.sendFile(path.join(__dirname + '/views/prodhome.html'));
  })


  /* API action: Full Hierarchy - Segment -> family -> Class -> Commodities */
  /*.get('/prodhtree', function(req, res) {

    let sqlQuery = "Select distinct Segment_Name, Family_Name, class_Name, commodity_Name from " + dbschema + ".XXIBM_PRODUCT_CATALOGUE order by 1,2,3,4";

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments/id/families/id/classes'); 

      let obj = [];
      let seg;
      let fam;
      let cls;
      let comm;

      for(let i=1; i<=rows.length; i++){
        if (i == 0 )
          seg = 

      }

      //console.log(rows);
      //res.end(JSON.stringify(rows));
    })

  })*/

/* API action: Test Images pull */
  .get('/image/:id', function(req, res) {
      //console.log(rows)	  
      res.render('imageshow.ejs', { images: req.params.id });
  })

  /* test conn */
  .get('/testconn', function(req, res) {

    global.dbconn.query('Select 1 description;', function(err, rows, fields) {
      if (err) throw err;

      console.log('DB Connected - ', rows[0].description);
    })

    res.writeHead(200);
    res.end('connected');
  })

/* pull all tables in a schema */
  .get('/alltables/:id', function(req, res) {

    let sqlQuery = "SELECT * FROM information_schema.tables WHERE table_schema = ?";
    
    global.dbconn.query(sqlQuery, [req.params.id], function(err, rows, fields) {
      if (err) throw err;

      console.log('Fetch all tables');
      res.end(JSON.stringify(rows));
    })

  });


  /* Redirects to the products list if the page requested is not found */
  app.use(function(req, res, next) {
    res.redirect('/');
  });
  

app.set('port', process.env.port || port); // set express to use this port

// set the app to listen on the port
app.listen(port, () => {
  console.log(`Nodejs Server running on port: ${port}`);
});

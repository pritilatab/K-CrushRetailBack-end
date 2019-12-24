var express = require('express');
//var session = require('cookie-session'); // Loads the piece of middleware for sessions
var bodyParser = require('body-parser'); // Loads the piece of middleware for managing the settings

var path = require('path');

const mysql = require('mysql');//mysql db
const port = 8080;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/* Using sessions */
//app.use(session({ secret: 'wmt1ockbtopsecret' }));

/*
var prodlist = [
  {
    sku_item: 1001,
    item_desc: "Reflex Women’s Track Jacket",
    size: "Medium",
    color: "Black",
    list_prc: "$39.33",
    disc_pct: "5%",
    seg_nm: "Apparel and Luggage and Personal Care Products",
    fam_nm: "Clothing",
    cls_nm: "Athletic wear",
    com_nm: "Womens athletic wear",
    sty_nm: "Reflex Women’s Track Jacket",
    brnd_nm: "Reflex",
    sku_UOM: "Each"
  },
  {
    sku_item: 1002,
    item_desc: "MUSHARE Women's Formal Suit",
    size: "Large",
    color: "Army Green",
    list_prc: "$99",
    disc_pct: "0%",
    seg_nm: "Apparel and Luggage and Personal Care Products",
    fam_nm: "Clothing",
    cls_nm: "Suits",
    com_nm: "Womens suits",
    sty_nm: "MUSHARE Women's Formal Suit",
    brnd_nm: "MUSHARE",
    sku_UOM: "Each"
  }
];
*/

/* 
* Init DB code
*/
const db = mysql.createConnection({
  host: 'custom-mysql.gamification.svc.cluster.local',
  user: 'xxuser',
  password: 'welcome1',
  database: 'sampledb'
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

  let sqlQuery = "Select item_number, CONCAT(description,'--',SKUAtt_Value1,'--',SKUAtt_Value2) item_desc from xxuser.XXIBM_PRODUCT_SKU";

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

    let sqlQuery = "Select item_number, CONCAT(description,'--',SKUAtt_Value1,'--',SKUAtt_Value2) item_desc from xxuser.XXIBM_PRODUCT_SKU";

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /prodlist_debug');

      res.render('prodlist.ejs', { prodlist: rows });
    })
  })

  /* API action: Item details based on Item_Number */
  .get('/itemdetail/:id', function(req, res) {

    let sqlQuery = "Select   a.Item_Number sku_Item_Number,   a.Description sku_Description,   a.Long_Description sku_Long_Description,   a.Catalogue_Category sku_Catalogue_Category,   a.SKU_Unit_Of_Meaure sku_SKU_Unit_Of_Meaure,   a.Style_Item sku_Style_Item,   a.SKUAttribute1 sku_SKUAttribute1,   a.SKUAttribute2 sku_SKUAttribute2,   a.SKUAttribute3 sku_SKUAttribute3,   a.SKUAttribute4 sku_SKUAttribute4,   a.SKUAttribute5 sku_SKUAttribute5,   a.SKUAttribute6 sku_SKUAttribute6,   a.SKUAtt_Value1 sku_SKUAtt_Value1,   a.SKUAtt_Value2 sku_SKUAtt_Value2,   a.SKUAtt_Value3 sku_SKUAtt_Value3,   a.SKUAtt_Value4 sku_SKUAtt_Value4,   a.SKUAtt_Value5 sku_SKUAtt_Value5,   a.SKUAtt_Value6 sku_SKUAtt_Value6,   b.Segment cat_Segment,   b.Segment_Name cat_Segment_Name,   b.Family cat_Family,   b.Family_Name cat_Family_Name,   b.Class cat_Class,   b.Class_Name cat_Class_Name,   b.Commodity_Name cat_Commodity_Name,   c.Description sty_Description,   c.Long_Description sty_Long_Description,   c.Brand sty_Brand,   p.PriceID prc_PriceID,   p.List_Price prc_List_Price,   p.Discount prc_Discount,   p.InStock prc_InStock,   p.Price_Effective_Date prc_Price_Effective_Date from   xxuser.XXIBM_PRODUCT_SKU a  inner join xxuser.XXIBM_PRODUCT_CATALOG b  on a.Catalogue_Category = b.Commodity inner join xxuser.XXIBM_PRODUCT_STYLE c  on a.Style_Item = c.Item_Number left outer join xxuser.XXIBM_PRODUCT_PRICING p  on a.Item_Number = p.Item_Number where a.Item_Number = ?";

    global.dbconn.query(sqlQuery, [req.params.id], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /itemdetail/id');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: DEBUG - Item details based on Item_Number */
  .get('/itemdetail_show/:id', function(req, res) {

    let sqlQuery = "Select   a.Item_Number sku_Item_Number,   a.Description sku_Description,   a.Long_Description sku_Long_Description,   a.Catalogue_Category sku_Catalogue_Category,   a.SKU_Unit_Of_Meaure sku_SKU_Unit_Of_Meaure,   a.Style_Item sku_Style_Item,   a.SKUAttribute1 sku_SKUAttribute1,   a.SKUAttribute2 sku_SKUAttribute2,   a.SKUAttribute3 sku_SKUAttribute3,   a.SKUAttribute4 sku_SKUAttribute4,   a.SKUAttribute5 sku_SKUAttribute5,   a.SKUAttribute6 sku_SKUAttribute6,   a.SKUAtt_Value1 sku_SKUAtt_Value1,   a.SKUAtt_Value2 sku_SKUAtt_Value2,   a.SKUAtt_Value3 sku_SKUAtt_Value3,   a.SKUAtt_Value4 sku_SKUAtt_Value4,   a.SKUAtt_Value5 sku_SKUAtt_Value5,   a.SKUAtt_Value6 sku_SKUAtt_Value6,   b.Segment cat_Segment,   b.Segment_Name cat_Segment_Name,   b.Family cat_Family,   b.Family_Name cat_Family_Name,   b.Class cat_Class,   b.Class_Name cat_Class_Name,   b.Commodity_Name cat_Commodity_Name,   c.Description sty_Description,   c.Long_Description sty_Long_Description,   c.Brand sty_Brand,   p.PriceID prc_PriceID,   p.List_Price prc_List_Price,   p.Discount prc_Discount,   p.InStock prc_InStock,   p.Price_Effective_Date prc_Price_Effective_Date from   xxuser.XXIBM_PRODUCT_SKU a  inner join xxuser.XXIBM_PRODUCT_CATALOG b  on a.Catalogue_Category = b.Commodity inner join xxuser.XXIBM_PRODUCT_STYLE c  on a.Style_Item = c.Item_Number left outer join xxuser.XXIBM_PRODUCT_PRICING p  on a.Item_Number = p.Item_Number where a.Item_Number = ?";

    global.dbconn.query(sqlQuery, [req.params.id], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /itemdetail/id');

      //console.log(rows);
      res.render('itemdetail.ejs', { itemdetail: rows });
    })

  })


  /* API action: All Item details Under a Commodity */
  .get('/commodity/:id', function(req, res) {

    let sqlQuery = "Select   a.Item_Number sku_Item_Number,   a.Description sku_Description,   a.Long_Description sku_Long_Description,   a.Catalogue_Category sku_Catalogue_Category,   a.SKU_Unit_Of_Meaure sku_SKU_Unit_Of_Meaure,   a.Style_Item sku_Style_Item,   a.SKUAttribute1 sku_SKUAttribute1,   a.SKUAttribute2 sku_SKUAttribute2,   a.SKUAttribute3 sku_SKUAttribute3,   a.SKUAttribute4 sku_SKUAttribute4,   a.SKUAttribute5 sku_SKUAttribute5,   a.SKUAttribute6 sku_SKUAttribute6,   a.SKUAtt_Value1 sku_SKUAtt_Value1,   a.SKUAtt_Value2 sku_SKUAtt_Value2,   a.SKUAtt_Value3 sku_SKUAtt_Value3,   a.SKUAtt_Value4 sku_SKUAtt_Value4,   a.SKUAtt_Value5 sku_SKUAtt_Value5,   a.SKUAtt_Value6 sku_SKUAtt_Value6,   b.Segment cat_Segment,   b.Segment_Name cat_Segment_Name,   b.Family cat_Family,   b.Family_Name cat_Family_Name,   b.Class cat_Class,   b.Class_Name cat_Class_Name,   b.Commodity_Name cat_Commodity_Name,   c.Description sty_Description,   c.Long_Description sty_Long_Description,   c.Brand sty_Brand,   p.PriceID prc_PriceID,   p.List_Price prc_List_Price,   p.Discount prc_Discount,   p.InStock prc_InStock,   p.Price_Effective_Date prc_Price_Effective_Date from   xxuser.XXIBM_PRODUCT_SKU a  inner join xxuser.XXIBM_PRODUCT_CATALOG b  on a.Catalogue_Category = b.Commodity inner join xxuser.XXIBM_PRODUCT_STYLE c  on a.Style_Item = c.Item_Number left outer join xxuser.XXIBM_PRODUCT_PRICING p  on a.Item_Number = p.Item_Number where a.Catalogue_Category = ?";

    global.dbconn.query(sqlQuery, [req.params.id], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /itemdetail/id');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: Segment List */
  .get('/segments', function(req, res) {

    let sqlQuery = "Select distinct segment_name from xxuser.XXIBM_PRODUCT_CATALOG";

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })
  })


  /* API action: Family List ALL */
  .get('/families', function(req, res) {

    let sqlQuery = "Select distinct Family_Name from xxuser.XXIBM_PRODUCT_CATALOG";

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /families');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: Family List per Segment */
  .get('/segment/:seg/families', function(req, res) {

    let sqlQuery = "Select distinct Segment_Name, Family_Name from xxuser.XXIBM_PRODUCT_CATALOG where Segment = ?";

    global.dbconn.query(sqlQuery, [req.params.seg], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments/id/families');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })

  /* API action: Class List per Segment and Family */
  .get('/segment/:seg/family/:fam/classes', function(req, res) {

    let sqlQuery = "Select distinct Segment_Name, Family_Name, class_Name from xxuser.XXIBM_PRODUCT_CATALOG where Segment = ? and Family = ?";

    global.dbconn.query(sqlQuery, [req.params.seg, req.params.fam], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments/id/families/id/classes');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })

  /* API action: Commodity List per Segment, Family and class */
  .get('/segment/:seg/family/:fam/class/:cls/commodities', function(req, res) {

    let sqlQuery = "Select distinct Segment_Name, Family_Name, class_Name, commodity_Name from xxuser.XXIBM_PRODUCT_CATALOG where Segment = ? and Family = ? and class = ?";

    global.dbconn.query(sqlQuery, [req.params.seg, req.params.fam, req.params.cls], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments/id/families/id/class/id/commodities');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })

//need to remove the code later
  /* API action: Homepage render */
  .get('/prodhome', function(req, res) {
      //res.render('prodhome.ejs', {});  
      res.sendFile(path.join(__dirname + '/prodhome.html'));
  })


  /* API action: Full Hierarchy - Segment -> family -> Class -> Commodities */
  /*.get('/prodhtree', function(req, res) {

    let sqlQuery = "Select distinct Segment_Name, Family_Name, class_Name, commodity_Name from xxuser.XXIBM_PRODUCT_CATALOG order by 1,2,3,4";

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


  /* test conn */
  .get('/testconn', function(req, res) {

    global.dbconn.query('Select 1 description;', function(err, rows, fields) {
      if (err) throw err;

      console.log('DB Connected - ', rows[0].description);
    })

    res.writeHead(200);
    res.end('connected');

  });

  /* Redirects to the products list if the page requested is not found */
  /*app.use(function(req, res, next) {
    res.redirect('/');
  });
  */

app.set('port', process.env.port || port); // set express to use this port

// set the app to listen on the port
app.listen(port, () => {
  console.log(`Nodejs Server running on port: ${port}`);
});

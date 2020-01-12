const express = require('express');
//var session = require('cookie-session'); // Loads the piece of middleware for sessions
const bodyParser = require('body-parser'); // Loads the piece of middleware for managing the settings

const path = require('path');

//load the IBM COS sdk
const ibmCOS = require('ibm-cos-sdk');

const imgconfig = {
	cosconfig: {
		endpoint: 'https://s3.us-south.cloud-object-storage.appdomain.cloud',
		apiKeyId: '_bAzHuCAN1yPz4Rcg5CZY1Tbp0UOpshuMhpoNkIvJAa3',
		ibmAuthEndpoint: 'https://iam.cloud.ibm.com/identity/token',
		serviceInstanceId: 'crn:v1:bluemix:public:cloud-object-storage:global:a/693fe8ead49b44b192004113d21b15c2:fce26086-5b77-42cc-b1aa-d388aa2853d7::',
	},
	bucketName: 'gamification-cos-standard-tkq',
};

const mysql = require('mysql');//mysql db object

const port = 8080; //app port

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//fix the cross origin request (CORS) issue
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

//directory to serve static assets
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

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

  let sqlQuery = "Select ITEM_NUMBER, CONCAT(DESCRIPTION,'--',SKU_ATTRIBUTE_VALUE1,'--',SKU_ATTRIBUTE_VALUE2) LONG_DESCRIPTION from " + dbschema + ".XXIBM_PRODUCT_SKU";

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

    let sqlQuery = "Select ITEM_NUMBER, CONCAT(DESCRIPTION,'--',SKU_ATTRIBUTE_VALUE1,'--',SKU_ATTRIBUTE_VALUE2) LONG_DESCRIPTION from " + dbschema + ".XXIBM_PRODUCT_SKU";

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /prodlist_debug');

      res.render('prodlist.ejs', { prodlist: rows });
    })
  })

  /* API action: Item details based on ITEM_NUMBER */
  .get('/itemdetail/:id', function(req, res) {

    let sqlQuery = "Select   a.ITEM_NUMBER sku_ITEM_NUMBER,   a.DESCRIPTION sku_DESCRIPTION,   a.LONG_DESCRIPTION sku_LONG_DESCRIPTION,   a.CATALOGUE_CATEGORY sku_CATALOGUE_CATEGORY,   a.SKU_UNIT_OF_MEASURE sku_SKU_UNIT_OF_MEASURE,   a.STYLE_ITEM sku_STYLE_ITEM,   a.SKU_ATTRIBUTE1 sku_SKU_ATTRIBUTE1,   a.SKU_ATTRIBUTE2 sku_SKU_ATTRIBUTE2,   a.SKU_ATTRIBUTE3 sku_SKU_ATTRIBUTE3,   a.SKU_ATTRIBUTE4 sku_SKU_ATTRIBUTE4,   a.SKU_ATTRIBUTE5 sku_SKU_ATTRIBUTE5,   a.SKU_ATTRIBUTE6 sku_SKU_ATTRIBUTE6,   a.SKU_ATTRIBUTE_VALUE1 sku_SKU_ATTRIBUTE_VALUE1,   a.SKU_ATTRIBUTE_VALUE2 sku_SKU_ATTRIBUTE_VALUE2,   a.SKU_ATTRIBUTE_VALUE3 sku_SKU_ATTRIBUTE_VALUE3,   a.SKU_ATTRIBUTE_VALUE4 sku_SKU_ATTRIBUTE_VALUE4,   a.SKU_ATTRIBUTE_VALUE5 sku_SKU_ATTRIBUTE_VALUE5,   a.SKU_ATTRIBUTE_VALUE6 sku_SKU_ATTRIBUTE_VALUE6,   b.SEGMENT cat_Segment,   b.SEGMENT_NAME cat_SEGMENT_NAME,   b.FAMILY cat_Family,   b.FAMILY_NAME cat_FAMILY_NAME,   b.CLASS cat_Class,   b.CLASS_NAME cat_CLASS_NAME,   b.COMMODITY_NAME cat_COMMODITY_NAME,   c.DESCRIPTION sty_DESCRIPTION,   c.LONG_DESCRIPTION sty_LONG_DESCRIPTION,   c.BRAND sty_BRAND,   p.PRICE_ID prc_PRICE_ID,   p.LIST_PRICE prc_LIST_PRICE,   p.DISCOUNT prc_DISCOUNT,   p.IN_STOCK prc_IN_STOCK,   p.PRICE_EFFECTIVE_DATE prc_PRICE_EFFECTIVE_DATE from   " + dbschema + ".XXIBM_PRODUCT_SKU a  inner join " + dbschema + ".XXIBM_PRODUCT_CATALOG b  on a.CATALOGUE_CATEGORY = b.COMMODITY inner join " + dbschema + ".XXIBM_PRODUCT_STYLE c  on a.STYLE_ITEM = c.ITEM_NUMBER left outer join " + dbschema + ".XXIBM_PRODUCT_PRICING p  on a.ITEM_NUMBER = p.ITEM_NUMBER where a.ITEM_NUMBER = ?";

    global.dbconn.query(sqlQuery, [req.params.id], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /itemdetail/id');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: DEBUG - Item details based on ITEM_NUMBER */
  .get('/itemdetail_show/:id', function(req, res) {

    let sqlQuery = "Select   a.ITEM_NUMBER sku_ITEM_NUMBER,   a.DESCRIPTION sku_DESCRIPTION,   a.LONG_DESCRIPTION sku_LONG_DESCRIPTION,   a.CATALOGUE_CATEGORY sku_CATALOGUE_CATEGORY,   a.SKU_UNIT_OF_MEASURE sku_SKU_UNIT_OF_MEASURE,   a.STYLE_ITEM sku_STYLE_ITEM,   a.SKU_ATTRIBUTE1 sku_SKU_ATTRIBUTE1,   a.SKU_ATTRIBUTE2 sku_SKU_ATTRIBUTE2,   a.SKU_ATTRIBUTE3 sku_SKU_ATTRIBUTE3,   a.SKU_ATTRIBUTE4 sku_SKU_ATTRIBUTE4,   a.SKU_ATTRIBUTE5 sku_SKU_ATTRIBUTE5,   a.SKU_ATTRIBUTE6 sku_SKU_ATTRIBUTE6,   a.SKU_ATTRIBUTE_VALUE1 sku_SKU_ATTRIBUTE_VALUE1,   a.SKU_ATTRIBUTE_VALUE2 sku_SKU_ATTRIBUTE_VALUE2,   a.SKU_ATTRIBUTE_VALUE3 sku_SKU_ATTRIBUTE_VALUE3,   a.SKU_ATTRIBUTE_VALUE4 sku_SKU_ATTRIBUTE_VALUE4,   a.SKU_ATTRIBUTE_VALUE5 sku_SKU_ATTRIBUTE_VALUE5,   a.SKU_ATTRIBUTE_VALUE6 sku_SKU_ATTRIBUTE_VALUE6,   b.SEGMENT cat_Segment,   b.SEGMENT_NAME cat_SEGMENT_NAME,   b.FAMILY cat_Family,   b.FAMILY_NAME cat_FAMILY_NAME,   b.CLASS cat_Class,   b.CLASS_NAME cat_CLASS_NAME,   b.COMMODITY_NAME cat_COMMODITY_NAME,   c.DESCRIPTION sty_DESCRIPTION,   c.LONG_DESCRIPTION sty_LONG_DESCRIPTION,   c.BRAND sty_BRAND,   p.PRICE_ID prc_PRICE_ID,   p.LIST_PRICE prc_LIST_PRICE,   p.DISCOUNT prc_DISCOUNT,   p.IN_STOCK prc_IN_STOCK,   p.PRICE_EFFECTIVE_DATE prc_PRICE_EFFECTIVE_DATE from   " + dbschema + ".XXIBM_PRODUCT_SKU a  inner join " + dbschema + ".XXIBM_PRODUCT_CATALOG b  on a.CATALOGUE_CATEGORY = b.COMMODITY inner join " + dbschema + ".XXIBM_PRODUCT_STYLE c  on a.STYLE_ITEM = c.ITEM_NUMBER left outer join " + dbschema + ".XXIBM_PRODUCT_PRICING p  on a.ITEM_NUMBER = p.ITEM_NUMBER where a.ITEM_NUMBER = ?";

    global.dbconn.query(sqlQuery, [req.params.id], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /itemdetail/id');

      //console.log(rows);
      res.render('itemdetail.ejs', { itemdetail: rows });
    })

  })


  /* API action: Search Products based on DESCRIPTION */
  .get('/search/:q/:page', function(req, res) {

    let page = 1;
    let limit = 12;
    let offset = 0;
    let r = {};
    let cnt = 0;

    //check for valid page number
    if (req.params.page){
      try{
          page = parseInt(req.params.page);
          offset = ((page==0 ? 1 : page) - 1) * limit;
      }
      catch(e){
          console.log('Invalid Page number');
          r = {
            status : 'failed',
            data : [],
            count : cnt,
            error : 'Invalid Page number'
          };
          res.end(JSON.stringify(r));
      }
    }
    
    //check for null search string
    let srch_str = decodeURI(req.params.q);

    if (req.params.q == undefined || req.params.q == null || req.params.q == ""){
      console.log('Invalid Query string');
      r = {
        status : 'failed',
        data : [],
        count : cnt,
        error : 'Invalid Search'
      };
      res.end(JSON.stringify(r));
    }

    let sqlQuery = "Select count(1) as cnt from " + dbschema + ".XXIBM_PRODUCT_SKU a  inner join " + dbschema + ".XXIBM_PRODUCT_CATALOG b  on a.CATALOGUE_CATEGORY = b.COMMODITY inner join " + dbschema + ".XXIBM_PRODUCT_STYLE c  on a.STYLE_ITEM = c.ITEM_NUMBER left outer join " + dbschema + ".XXIBM_PRODUCT_PRICING p  on a.ITEM_NUMBER = p.ITEM_NUMBER where a.DESCRIPTION like '%" + req.params.q + "%' or a.LONG_DESCRIPTION like '%" + req.params.q + "%'";

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      if (err) throw err;

      if(rows.length == 0){
        console.log('DB fetch no records');
      }
      else {
        console.log(`DB fetch success for /search count = ${rows[0].cnt}`);
        cnt = rows[0].cnt;
      }
    });

    sqlQuery = "Select   a.ITEM_NUMBER sku_ITEM_NUMBER,   a.DESCRIPTION sku_DESCRIPTION,   a.LONG_DESCRIPTION sku_LONG_DESCRIPTION,   a.CATALOGUE_CATEGORY sku_CATALOGUE_CATEGORY,   a.SKU_UNIT_OF_MEASURE sku_SKU_UNIT_OF_MEASURE,   a.STYLE_ITEM sku_STYLE_ITEM, a.SKU_ATTRIBUTE_VALUE1 sku_SKU_ATTRIBUTE_VALUE1,   a.SKU_ATTRIBUTE_VALUE2 sku_SKU_ATTRIBUTE_VALUE2,   a.SKU_ATTRIBUTE_VALUE3 sku_SKU_ATTRIBUTE_VALUE3,   a.SKU_ATTRIBUTE_VALUE4 sku_SKU_ATTRIBUTE_VALUE4,   a.SKU_ATTRIBUTE_VALUE5 sku_SKU_ATTRIBUTE_VALUE5,   a.SKU_ATTRIBUTE_VALUE6 sku_SKU_ATTRIBUTE_VALUE6,   b.SEGMENT cat_Segment,   b.SEGMENT_NAME cat_SEGMENT_NAME,   b.FAMILY cat_Family,   b.FAMILY_NAME cat_FAMILY_NAME,   b.CLASS cat_Class,   b.CLASS_NAME cat_CLASS_NAME,   b.COMMODITY_NAME cat_COMMODITY_NAME,   c.DESCRIPTION sty_DESCRIPTION,   c.LONG_DESCRIPTION sty_LONG_DESCRIPTION,   c.BRAND sty_BRAND,   p.PRICE_ID prc_PRICE_ID,   p.LIST_PRICE prc_LIST_PRICE,   p.DISCOUNT prc_DISCOUNT,   p.IN_STOCK prc_IN_STOCK,   p.PRICE_EFFECTIVE_DATE prc_PRICE_EFFECTIVE_DATE from   " + dbschema + ".XXIBM_PRODUCT_SKU a  inner join " + dbschema + ".XXIBM_PRODUCT_CATALOG b  on a.CATALOGUE_CATEGORY = b.COMMODITY inner join " + dbschema + ".XXIBM_PRODUCT_STYLE c  on a.STYLE_ITEM = c.ITEM_NUMBER left outer join " + dbschema + ".XXIBM_PRODUCT_PRICING p  on a.ITEM_NUMBER = p.ITEM_NUMBER where a.DESCRIPTION like '%" + req.params.q + "%' or a.LONG_DESCRIPTION like '%" + req.params.q + "%' ORDER By cat_COMMODITY_NAME, sty_DESCRIPTION LIMIT ? OFFSET ?";


    global.dbconn.query(sqlQuery, [limit, offset], function(err, rows, fields) {
      if (err) throw err;

      if(rows.length == 0){
        console.log('DB fetch no records');
        r = {
          status : 'failed',
          data : [],
          count : cnt,
          error : 'No records'
        }
      }
      else {
        console.log(`DB fetch success for /search/${req.params.q}/${page}`);
        r = {
          status : 'success',
          data : rows,
          count : cnt,
          error : ''
        }
      }

      res.end(JSON.stringify(r));
    });

  })

  
  /* API action: All Item details Under a COMMODITY */
  .get('/COMMODITY/:id', function(req, res) {

    let sqlQuery = "Select   a.ITEM_NUMBER sku_ITEM_NUMBER,   a.DESCRIPTION sku_DESCRIPTION,   a.LONG_DESCRIPTION sku_LONG_DESCRIPTION,   a.CATALOGUE_CATEGORY sku_CATALOGUE_CATEGORY,   a.SKU_UNIT_OF_MEASURE sku_SKU_UNIT_OF_MEASURE,   a.STYLE_ITEM sku_STYLE_ITEM,   a.SKU_ATTRIBUTE1 sku_SKU_ATTRIBUTE1,   a.SKU_ATTRIBUTE2 sku_SKU_ATTRIBUTE2,   a.SKU_ATTRIBUTE3 sku_SKU_ATTRIBUTE3,   a.SKU_ATTRIBUTE4 sku_SKU_ATTRIBUTE4,   a.SKU_ATTRIBUTE5 sku_SKU_ATTRIBUTE5,   a.SKU_ATTRIBUTE6 sku_SKU_ATTRIBUTE6,   a.SKU_ATTRIBUTE_VALUE1 sku_SKU_ATTRIBUTE_VALUE1,   a.SKU_ATTRIBUTE_VALUE2 sku_SKU_ATTRIBUTE_VALUE2,   a.SKU_ATTRIBUTE_VALUE3 sku_SKU_ATTRIBUTE_VALUE3,   a.SKU_ATTRIBUTE_VALUE4 sku_SKU_ATTRIBUTE_VALUE4,   a.SKU_ATTRIBUTE_VALUE5 sku_SKU_ATTRIBUTE_VALUE5,   a.SKU_ATTRIBUTE_VALUE6 sku_SKU_ATTRIBUTE_VALUE6,   b.SEGMENT cat_Segment,   b.SEGMENT_NAME cat_SEGMENT_NAME,   b.FAMILY cat_Family,   b.FAMILY_NAME cat_FAMILY_NAME,   b.CLASS cat_Class,   b.CLASS_NAME cat_CLASS_NAME,   b.COMMODITY_NAME cat_COMMODITY_NAME,   c.DESCRIPTION sty_DESCRIPTION,   c.LONG_DESCRIPTION sty_LONG_DESCRIPTION,   c.BRAND sty_BRAND,   p.PRICE_ID prc_PRICE_ID,   p.LIST_PRICE prc_LIST_PRICE,   p.DISCOUNT prc_DISCOUNT,   p.IN_STOCK prc_IN_STOCK,   p.PRICE_EFFECTIVE_DATE prc_PRICE_EFFECTIVE_DATE from   " + dbschema + ".XXIBM_PRODUCT_SKU a  inner join " + dbschema + ".XXIBM_PRODUCT_CATALOG b  on a.CATALOGUE_CATEGORY = b.COMMODITY inner join " + dbschema + ".XXIBM_PRODUCT_STYLE c  on a.STYLE_ITEM = c.ITEM_NUMBER left outer join " + dbschema + ".XXIBM_PRODUCT_PRICING p  on a.ITEM_NUMBER = p.ITEM_NUMBER where a.CATALOGUE_CATEGORY = ?";

    global.dbconn.query(sqlQuery, [req.params.id], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /itemdetail/id');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: Segment List */
  .get('/segments', function(req, res) {

    let sqlQuery = "Select distinct SEGMENT_NAME from " + dbschema + ".XXIBM_PRODUCT_CATALOG";

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })
  })


  /* API action: Family List ALL */
  .get('/families', function(req, res) {

    let sqlQuery = "Select distinct FAMILY, FAMILY_NAME from " + dbschema + ".XXIBM_PRODUCT_CATALOG";

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /families');

      //console.log(rows);
      
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: Get Family, Class and COMMODITY */
  .get('/segment/:seg/families', function(req, res) {

    let sqlQuery = "Select distinct SEGMENT_NAME, FAMILY_NAME from " + dbschema + ".XXIBM_PRODUCT_CATALOG where SEGMENT = ?";

    global.dbconn.query(sqlQuery, [req.params.seg], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments/id/families');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: Family List per Segment */
  .get('/segment/:seg/families', function(req, res) {

    let sqlQuery = "Select distinct SEGMENT_NAME, FAMILY_NAME from " + dbschema + ".XXIBM_PRODUCT_CATALOG where SEGMENT = ?";

    global.dbconn.query(sqlQuery, [req.params.seg], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments/id/families');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })

  /* API action: Class List per Segment and Family */
  .get('/segment/:seg/family/:fam/classes', function(req, res) {

    let sqlQuery = "Select distinct SEGMENT_NAME, FAMILY_NAME, CLASS_NAME from " + dbschema + ".XXIBM_PRODUCT_CATALOG where SEGMENT = ? and FAMILY = ?";

    global.dbconn.query(sqlQuery, [req.params.seg, req.params.fam], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments/id/families/id/classes');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: Class List per Family */
  .get('/family/:fam/classes', function(req, res) {

    let sqlQuery = "Select distinct FAMILY_NAME, CLASS_NAME from " + dbschema + ".XXIBM_PRODUCT_CATALOG where FAMILY = ?";

    global.dbconn.query(sqlQuery, [req.params.fam], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /family/id/classes');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


   /* API action: All Classes */
  .get('/classes', function(req, res) {

    let sqlQuery = "Select distinct CLASS, CLASS_NAME, FAMILY, FAMILY_NAME from " + dbschema + ".XXIBM_PRODUCT_CATALOG order by FAMILY_NAME, CLASS_NAME";

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /classes');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: COMMODITY List per class */
  .get('/class/:cls/comm', function(req, res) {

    let sqlQuery = "Select distinct COMMODITY, COMMODITY_NAME from " + dbschema + ".XXIBM_PRODUCT_CATALOG where CLASS = ? order by COMMODITY_NAME";

    global.dbconn.query(sqlQuery, [req.params.cls], function(err, rows, fields) {
      if (err) throw err;

      console.log(`DB fetch success for /class/${req.params.cls}/comm`);

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })

  /* API action: COMMODITY List per Segment, Family and class */
  .get('/segment/:seg/family/:fam/class/:cls/commodities', function(req, res) {

    let sqlQuery = "Select distinct SEGMENT_NAME, FAMILY_NAME, CLASS_NAME, COMMODITY_NAME from " + dbschema + ".XXIBM_PRODUCT_CATALOG where SEGMENT = ? and FAMILY = ? and CLASS = ?";

    global.dbconn.query(sqlQuery, [req.params.seg, req.params.fam, req.params.cls], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments/id/families/id/class/id/commodities');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: Search by all */
  .get('/segment/:seg/family/:fam/classes', function(req, res) {

    let sqlQuery = "Select distinct SEGMENT_NAME, FAMILY_NAME, CLASS_NAME from " + dbschema + ".XXIBM_PRODUCT_CATALOG where SEGMENT = ? and FAMILY = ?";

    global.dbconn.query(sqlQuery, [req.params.seg, req.params.fam], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /segments/id/families/id/classes');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* test conn */
  .get('/testconn', function(req, res) {

    global.dbconn.query('Select 1 DESCRIPTION;', function(err, rows, fields) {
      if (err) throw err;

      console.log('DB Connected - ', rows[0].DESCRIPTION);
    })

    res.writeHead(200);
    res.end('connected');

  })

  //API Action: DEBUG - View all tables under a schema
  .get('/alltables/:id', function(req, res) {

    let sqlQuery = "SELECT * FROM information_schema.tables WHERE table_schema = ?";
    
    global.dbconn.query(sqlQuery, [req.params.id], function(err, rows, fields) {
      if (err) throw err;

      console.log('Fetch all tables');
      res.end(JSON.stringify(rows));
    })

  })

   //API Action: DEBUG - View all cols under a schema/table
  .get('/alltables/:sch/:tbl', function(req, res) {

    let sqlQuery = "SELECT * FROM information_schema.columns WHERE table_schema= ? and TABLE_NAME = ?";
    
    global.dbconn.query(sqlQuery, [req.params.sch, req.params.tbl], function(err, rows, fields) {
      if (err) throw err;

      console.log('Fetch all tables');
      res.end(JSON.stringify(rows));
    })

  })

  //API Action: DEBUG - view all columns of a table
  .get('/cols/:schema/:tbl', function(req, res) {

    let sqlQuery = "SELECT * FROM information_schema.columns WHERE table_schema = ? and TABLE_NAME = ?";
    
    global.dbconn.query(sqlQuery, [req.params.schema, req.params.tbl], function(err, rows, fields) {
      if (err) throw err;

      console.log('Fetch all tables');
      res.end(JSON.stringify(rows));
    })

  })

  //API Action: All SKUs
  .get('/items/all', function(req, res) {

    let sqlQuery = "select ITEM_NUMBER from sampledb.XXIBM_PRODUCT_SKU";
    
    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      if (err) throw err;

      console.log('Fetched all items');
      res.end(JSON.stringify(rows));
    })

  })

  //API Action: fetch an image as binary data
  .get('/image/:id', function(req, res) {
      const imgconfig = {
        cosconfig: {
            endpoint: 'https://s3.us-south.cloud-object-storage.appdomain.cloud',
            apiKeyId: '_bAzHuCAN1yPz4Rcg5CZY1Tbp0UOpshuMhpoNkIvJAa3',
            ibmAuthEndpoint: 'https://iam.cloud.ibm.com/identity/token',
            serviceInstanceId: 'crn:v1:bluemix:public:cloud-object-storage:global:a/693fe8ead49b44b192004113d21b15c2:fce26086-5b77-42cc-b1aa-d388aa2853d7::'
        },
        bucketName: 'gamification-cos-standard-tkq'
      };

      const cos = new ibmCOS.S3(imgconfig.cosconfig);

      const itemName = req.params.id + '.jpg';

      //default image
      const defaultimg = '<svg width="200" height="250" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" focusable="false" role="img" aria-label="Placeholder: Thumbnail"><title>Placeholder</title><rect width="100%" height="100%" fill="#55595c"></rect><text x="50%" y="50%" fill="#eceeef" dy=".3em">No Image</text></svg>';
      
      //call the COS API getObject()
      return cos.getObject({
          Bucket: imgconfig.bucketName, 
          Key: itemName
      }).promise()
      .then((data) => {
          if (data != null) {
              //console.log('File Contents: ' + Buffer.from(data.Body)//.toString());
              console.log(`Retrieved item from bucket: ${imgconfig.bucketName} for key: ${itemName}`);
              
              res.set('Content-Type', 'image/jpeg');
              res.send(data.Body);
          }
         else {
            res.set('Content-Type', 'image/svg+xml');
            res.send(defaultimg);
         }
            
      })
      .catch((e) => {
          console.error(`ERROR retrieving image from bucket ${imgconfig.bucketName}: ${e.code} - ${itemName} - ${e.message}\n`);
          
          res.set('Content-Type', 'image/svg+xml');
          res.send(defaultimg);
      });

  })


  //API Action: DEBUG - fetch an image as Base64 encoded data
  .get('/im/:id', function(req, res) {
      const imgconfig = {
        cosconfig: {
            endpoint: 'https://s3.us-south.cloud-object-storage.appdomain.cloud',
            apiKeyId: '_bAzHuCAN1yPz4Rcg5CZY1Tbp0UOpshuMhpoNkIvJAa3',
            ibmAuthEndpoint: 'https://iam.cloud.ibm.com/identity/token',
            serviceInstanceId: 'crn:v1:bluemix:public:cloud-object-storage:global:a/693fe8ead49b44b192004113d21b15c2:fce26086-5b77-42cc-b1aa-d388aa2853d7::'
        },
        bucketName: 'gamification-cos-standard-tkq'
      };

      const cos = new ibmCOS.S3(imgconfig.cosconfig);

      const itemName = req.params.id + '.jpg';

      //default image
      const defaultimg = '<svg width="200" height="250" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" focusable="false" role="img" aria-label="Placeholder: Thumbnail"><title>Placeholder</title><rect width="100%" height="100%" fill="#55595c"></rect><text x="50%" y="50%" fill="#eceeef" dy=".3em">No Image</text></svg>';
      
      //call the COS API getObject()
      return cos.getObject({
          Bucket: imgconfig.bucketName, 
          Key: itemName
      }).promise()
      .then((data) => {
          if (data != null) {
              //console.log('File Contents: ' + Buffer.from(data.Body)//.toString());
              console.log(`Retrieved item from bucket: ${imgconfig.bucketName} for key: ${itemName}`);
              
              //res.set('Content-Type', 'image/');
              res.send("data:image/jpeg;base64," + Buffer.from(data.Body).toString('base64'));
          }
         else {
            res.set('Content-Type', 'image/svg+xml');
            res.send(defaultimg);
         }
            
      })
      .catch((e) => {
          console.error(`ERROR retrieving image from bucket ${imgconfig.bucketName}: ${e.code} - ${itemName} - ${e.message}\n`);
          
          res.set('Content-Type', 'image/svg+xml');
          res.send(defaultimg);
      });

  })

  
  //need to remove the code later
  /* API action: Homepage render */
  .get('/app', function(req, res) {
      res.set('Content-Type','text/html');
      res.render('kcrush.ejs', {page:'Home', menuId:'home'});  
      //res.sendFile(path.join(__dirname + '/views/prodhome.html'));
  })


  /* API action: Full Hierarchy - Segment -> family -> Class -> Commodities */
  /*.get('/prodhtree', function(req, res) {
    let sqlQuery = "Select distinct SEGMENT_NAME, FAMILY_NAME, CLASS_NAME, COMMODITY_NAME from " + dbschema + ".XXIBM_PRODUCT_CATALOG order by 1,2,3,4";
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

  ;


  /* Redirects to the products list if the page requested is not found */
  app.use(function(req, res, next) {
    res.redirect('/');
  });
  

app.set('port', process.env.port || port); // set express to use this port

// set the app to listen on the port
app.listen(port, () => {
  console.log(`Nodejs Server running on port: ${port}`);
  //console.log(__dirname + '/public');
});

const express = require('express');
//var session = require('cookie-session'); // Loads the piece of middleware for sessions
const bodyParser = require('body-parser'); // Loads the piece of middleware for managing the settings

const request = require('request');

const path = require('path');

//load the IBM COS sdk
const ibmCOS = require('ibm-cos-sdk');

const imgconfig = {
  cosconfig: {
    endpoint: 'https://s3.us-south.cloud-object-storage.appdomain.cloud',
    apiKeyId: '_bAzHuCAN1yPz4Rcg5CZY1Tbp0UOpshuMhpoNkIvJAa3',
    ibmAuthEndpoint: 'https://iam.cloud.ibm.com/identity/token',
    serviceInstanceId: 'crn:v1:bluemix:public:cloud-object-storage:global:a/693fe8ead49b44b192004113d21b15c2:fce26086-5b77-42cc-b1aa-d388aa2853d7::'
  },
  bucketName: 'gamification-cos-standard-tkq'
};

//Watson STT token
let stt_token;

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
app.get('/', function(req, res) {
  return res.send({ error: true, message: 'Following APIs supported - /api/status/ ; /api/getproducts/' })

})

//API action: Get Watson STT service access using IAM Access token from IBM Cloud
app.get('/getstttoken', function(req, res) {
  // The following three lines translate the curl request provided by IBM into a nodeJS request format so that the token can be retrieved by our server code. 
  let form = {
    grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
    apikey: "BNVh4bMvUUIFeqQ3NeZr986PdCLaU4_Q47a6fCaYM3QM"
  };

  let headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  };

  let options = {
    url: 'https://iam.cloud.ibm.com/identity/token',
    method: 'POST',
    form: form,
    headers: headers
  };

  // get the new token
  request(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      // send the token back as the 'success' item in the returned json object
      stt_token = JSON.parse(body).access_token;
      res.send({ success: JSON.parse(body).access_token });
    }
    else {
      // send the failure message back as the 'failed' item in the returned json object.
      console.log('Error getting STT token:  ', error);
      stt_token = "";
      res.send({ failed: error.message })
    }
  });

})


  /* API action: Item details based on Item_Number */
  .get('/itemdetail/:id', function(req, res) {

    let sqlQuery = "Select   a.Item_Number sku_Item_Number,   a.Description sku_Description,   a.Long_Description sku_Long_Description,   a.Catalogue_Category sku_Catalogue_Category,   a.SKU_UNIT_OF_MEASURE sku_SKU_UNIT_OF_MEASURE,   a.Style_Item sku_Style_Item,   a.SKU_ATTRIBUTE1 sku_SKU_ATTRIBUTE1,   a.SKU_ATTRIBUTE2 sku_SKU_ATTRIBUTE2,   a.SKU_ATTRIBUTE3 sku_SKU_ATTRIBUTE3,   a.SKU_ATTRIBUTE4 sku_SKU_ATTRIBUTE4,   a.SKU_ATTRIBUTE5 sku_SKU_ATTRIBUTE5,   a.SKU_ATTRIBUTE6 sku_SKU_ATTRIBUTE6,   a.SKU_ATTRIBUTE_VALUE1 sku_SKU_ATTRIBUTE_VALUE1,   a.SKU_ATTRIBUTE_VALUE2 sku_SKU_ATTRIBUTE_VALUE2,   a.SKU_ATTRIBUTE_VALUE3 sku_SKU_ATTRIBUTE_VALUE3,   a.SKU_ATTRIBUTE_VALUE4 sku_SKU_ATTRIBUTE_VALUE4,   a.SKU_ATTRIBUTE_VALUE5 sku_SKU_ATTRIBUTE_VALUE5,   a.SKU_ATTRIBUTE_VALUE6 sku_SKU_ATTRIBUTE_VALUE6,   b.Segment cat_Segment,   b.Segment_Name cat_Segment_Name,   b.Family cat_Family,   b.Family_Name cat_Family_Name,   b.Class cat_Class,   b.Class_Name cat_Class_Name,   b.Commodity_Name cat_Commodity_Name,   c.Description sty_Description,   c.Long_Description sty_Long_Description,   c.Brand sty_Brand,   p.PriceID prc_PriceID,   p.List_Price prc_List_Price,   p.Discount prc_Discount,   p.IN_STOCK prc_IN_STOCK,   p.Price_Effective_Date prc_Price_Effective_Date from   " + dbschema + ".XXIBM_PRODUCT_SKU a  inner join " + dbschema + ".XXIBM_PRODUCT_CATALOGUE b  on a.Catalogue_Category = b.Commodity inner join " + dbschema + ".XXIBM_PRODUCT_STYLE c  on a.Style_Item = c.Item_Number left outer join " + dbschema + ".XXIBM_PRODUCT_PRICING p  on a.Item_Number = p.Item_Number where a.Item_Number = ?";

    global.dbconn.query(sqlQuery, [req.params.id], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /itemdetail/id');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: Get ALL products 
  * /products/:cat?p=1&l=12
  * p = page number, l = results per page
  */ 
  .get('/products/:cat?', function(req, res) {

      //defaults
      let page = 1;
      let limit = 10;
      let offset = 0;
      let r;

      //check for valid page number and limit
      if(req.query.p != undefined && req.query.l != undefined){
        page = parseInt(decodeURI(req.query.p));
        limit = parseInt(decodeURI(req.query.l));
        limit = (limit < 10) ? 10 : limit;
        offset = ((page == 0 ? 1 : page) - 1) * limit;
      }

      let sqlWhere = "";

      let catg = decodeURI(req.params.cat);
      console.log(catg);

      if(catg == "men"){

        sqlWhere = " where (b.Commodity_Name like '%men%' or a.Description like '%men%' or b.Commodity_Name like '%man%' or a.Description like '%man%') and (b.Commodity_Name not like '%women%' and a.Description not like '%women%' and b.Commodity_Name not like '%woman%' and a.Description not like '%woman%')";
      }
      else if(catg == "women"){

        sqlWhere = " where (b.Commodity_Name like '%women%' or a.Description like '%women%' or b.Commodity_Name like '%woman%' or a.Description like '%woman%')";
      }
      else if(catg == "boys"){

        sqlWhere = " where (b.Commodity_Name like '%boy%' or a.Description like '%boy%' or b.Commodity_Name like '%boys%' or a.Description like '%boys%')";
      }
      else if(catg == "girls"){
        
        sqlWhere = " where (b.Commodity_Name like '%girl%' or a.Description like '%girl%' or b.Commodity_Name like '%girls%' or a.Description like '%girls%')";
      }
      else if(catg == "oth"){
        sqlWhere = " where (b.Commodity_Name not like '%men%' and a.Description not like '%men%' and b.Commodity_Name not like '%man%' and a.Description not like '%man%') and (b.Commodity_Name not like '%women%' and a.Description not like '%women%' and b.Commodity_Name not like '%woman%' and a.Description not like '%woman%') and (b.Commodity_Name not like '%boy%' and a.Description not like '%boy%' and b.Commodity_Name not like '%boys%' and a.Description not like '%boys%') and (b.Commodity_Name not like '%girl%' and a.Description not like '%girl%' and b.Commodity_Name not like '%girls%' and a.Description not like '%girls%')";
      }
      else{  //"all", "default"
          sqlWhere = "";
      }

           
      let sqlQuery = "select x.* from (SELECT a.Item_Number, a.Description as sku_desc, b.Commodity_Name, b.Commodity, b.Class_Name, b.Class, a.SKU_ATTRIBUTE1, a.SKU_ATTRIBUTE_VALUE1, a.SKU_ATTRIBUTE2, a.SKU_ATTRIBUTE_VALUE2, a.SKU_ATTRIBUTE3, a.SKU_ATTRIBUTE_VALUE3, a.SKU_ATTRIBUTE4, a.SKU_ATTRIBUTE_VALUE4, a.SKU_ATTRIBUTE5, a.SKU_ATTRIBUTE_VALUE5, a.SKU_ATTRIBUTE6, a.SKU_ATTRIBUTE_VALUE6, s.Brand, p.List_Price, p.Discount, p.IN_STOCK, @row_number:=(CASE WHEN @commodity = Commodity THEN @row_number + 1 ELSE 1 END) AS rnk, @commodity := Commodity) as commprev from " + dbschema + ".XXIBM_PRODUCT_SKU a left outer join " + dbschema + ".XXIBM_PRODUCT_CATALOGUE b on a.Catalogue_Category = b.Commodity left outer join " + dbschema + ".XXIBM_PRODUCT_PRICING p on a.Item_Number = p.Item_Number left outer join " + dbschema + ".XXIBM_PRODUCT_STYLE s on a.Style_Item = s.Item_Number inner join (select @row_number := 0) var " + sqlWhere + " order by b.Commodity_Name, a.SKU_ATTRIBUTE_VALUE1, a.SKU_ATTRIBUTE_VALUE2, a.SKU_ATTRIBUTE_VALUE3, a.SKU_ATTRIBUTE_VALUE4, a.SKU_ATTRIBUTE_VALUE5, a.SKU_ATTRIBUTE_VALUE6)x order by rnk LIMIT ? OFFSET ?";
      
      
      global.dbconn.query(sqlQuery, [limit, offset], function(err, rows, fields) {

        try{
          
          let r;

          if(err){
            console.log('DB fetch error - ' + JSON.stringify(err));
            r = {
              status : 'failed',
              data : [],
              count : 0,
              error : 'No records'
            }
          }
          else {
            console.log(`DB fetch success for /products?p=${page}&l=${limit}`);
            r = {
              status : 'success',
              data : rows,
              count : rows.length,
              error : ''
            }
          }

          res.set('Content-Type', 'text/json');
          res.end(JSON.stringify(r));

        }
        catch(e){
           console.log('DB query error - ' + JSON.stringify(e));
            r = {
              status : 'failed',
              data : [],
              count : 0,
              error : 'Internal Error'
            }
        }
      });

  })



  /* API action: Search Products based on description */
  .get('/search/:q/?', function(req, res) {

    let page = 1;
    let limit = 12;
    let offset = 0;
    let r = {};
    let cnt = 0;


    //check for valid page number and limit
      if(req.query.p != undefined && req.query.l != undefined){
        page = parseInt(decodeURI(req.query.p));
        limit = parseInt(decodeURI(req.query.l));
        limit = (limit < 10) ? 10 : limit;
        offset = ((page == 0 ? 1 : page) - 1) * limit;
      }

    //check for null search string
    let srch_str = decodeURI(req.params.q);


    if (req.params.q == undefined || req.params.q == null || req.params.q == "") {
      console.log('Invalid Query string - ' + req.params.q);
      r = {
        status: 'failed',
        data: [],
        count: cnt,
        error: 'Invalid Search - ' + srch_str
      };
      res.set('Content-Type', 'text/json');
      res.end(JSON.stringify(r));
    }

    let sqlPartSrc = "";

    if (srch_str.toUpperCase() != 'ALL') {
      sqlPartSrc = " where a.Description like '%" + srch_str + "%' or a.Long_Description like '%" + srch_str + "%' or b.Commodity_Name like '%" + srch_str + "%' or b.Class_Name like '%" + srch_str + "%' or c.Brand like '%" + srch_str + "%' or a.SKU_ATTRIBUTE_VALUE1 like '%" + srch_str + "%' or a.SKU_ATTRIBUTE_VALUE2 like '%" + srch_str + "%' or a.SKU_ATTRIBUTE_VALUE3 like '%" + srch_str + "%' or a.SKU_ATTRIBUTE_VALUE4 like '%" + srch_str + "%' or a.SKU_ATTRIBUTE_VALUE5 like '%" + srch_str + "%' or a.SKU_ATTRIBUTE_VALUE6 like '%" + srch_str + "%'";
    }

    let sqlQuery = "Select count(1) as cnt from " + dbschema + ".XXIBM_PRODUCT_SKU a  left outer join " + dbschema + ".XXIBM_PRODUCT_CATALOGUE b  on a.Catalogue_Category = b.Commodity left outer join " + dbschema + ".XXIBM_PRODUCT_STYLE c  on a.Style_Item = c.Item_Number left outer join " + dbschema + ".XXIBM_PRODUCT_PRICING p  on a.Item_Number = p.Item_Number" + sqlPartSrc;

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      try{
          if (err) {
            console.log(sqlQuery);
            throw err;
          }

          if (rows.length == 0) {
            console.log('DB fetch no records');
          }
          else {
            console.log(`DB fetch success for /search/${srch_str}p=${page}&l=${limit}  count = ${rows[0].cnt}`);
            cnt = rows[0].cnt;
          }
       }
       catch(e){
         console.log('DB query error - ' + JSON.stringify(e));
            r = {
              status : 'failed',
              data : [],
              count : 0,
              error : 'Internal Error'
            }
       }
    });

    sqlQuery = "Select a.Item_Number,   a.Description sku_desc,   a.Long_Description,   a.Catalogue_Category,   a.SKU_UNIT_OF_MEASURE,   a.Style_Item, a.SKU_ATTRIBUTE_VALUE1,   a.SKU_ATTRIBUTE_VALUE2,   a.SKU_ATTRIBUTE_VALUE3,   a.SKU_ATTRIBUTE_VALUE4,   a.SKU_ATTRIBUTE_VALUE5,   a.SKU_ATTRIBUTE_VALUE6,   b.Segment,   b.Segment_Name,   b.Family,   b.Family_Name,   b.Class,   b.Class_Name,   b.Commodity_Name,   c.Description sty_Description,   c.Long_Description sty_Long_Description,  c.Brand,  p.List_Price,   p.Discount,   p.IN_STOCK from   " + dbschema + ".XXIBM_PRODUCT_SKU a  left outer join " + dbschema + ".XXIBM_PRODUCT_CATALOGUE b  on a.Catalogue_Category = b.Commodity left outer join " + dbschema + ".XXIBM_PRODUCT_STYLE c  on a.Style_Item = c.Item_Number left outer join " + dbschema + ".XXIBM_PRODUCT_PRICING p  on a.Item_Number = p.Item_Number " + sqlPartSrc + " ORDER By b.Commodity_Name, sty_Description LIMIT ? OFFSET ?";

    global.dbconn.query(sqlQuery, [limit, offset], function(err, rows, fields) {
      
      try {
        if(err){
            console.log('DB fetch error - ' + JSON.stringify(err));
            r = {
              status : 'failed',
              data : [],
              count : 0,
              error : 'No records'
            }
        }
        else {
            console.log(`DB fetch success for /search/${srch_str}?p=${page}&l=${limit}`);
            r = {
              status : 'success',
              data : rows,
              count : rows.length,
              error : ''
            }
        } 

      }catch(e){
          console.log('DB query error - ' + JSON.stringify(e));
            r = {
              status : 'failed',
              data : [],
              count : 0,
              error : 'Internal Error'
            }
      }

      res.set('Content-Type', 'text/json');
      res.end(JSON.stringify(r)); 

    });

  })


/* API action: V2 Search Products based on description */
  .get('/searchv2/:q/?', function(req, res) {

    let page = 1;
    let limit = 12;
    let offset = 0;
    let r = {};
    let cnt = 0;


    //check for valid page number and limit
      if(req.query.p != undefined && req.query.l != undefined){
        page = parseInt(decodeURI(req.query.p));
        limit = parseInt(decodeURI(req.query.l));
        limit = (limit < 10) ? 10 : limit;
        offset = ((page == 0 ? 1 : page) - 1) * limit;
      }

    //check for null search string
    let srch_str = decodeURI(req.params.q);

    if (req.params.q == undefined || req.params.q == null || req.params.q == "") {
      console.log('Invalid Query string - ' + req.params.q);
      r = {
        status: 'failed',
        data: [],
        count: cnt,
        error: 'Invalid Search - ' + srch_str
      };
      res.set('Content-Type', 'text/json');
      res.end(JSON.stringify(r));
    }

    let sqlPartSrc = "";

    if (srch_str.toUpperCase() != 'ALL') {
	
		//get the parts of the search string
		let srchArr = srch_str.split(" "); 
      
		sqlPartSrc += " where ";

		srchArr.forEach(function(item, index){

        sqlPartSrc += " (a.Description like '%" + item + "%' or a.Long_Description like '%" + item + "%' or b.Commodity_Name like '%" + item + "%' or b.Class_Name like '%" + item + "%' or s.Brand like '%" + item + "%' or a.SKU_ATTRIBUTE_VALUE1 like '%" + item + "%' or a.SKU_ATTRIBUTE_VALUE2 like '%" + item + "%' or a.SKU_ATTRIBUTE_VALUE3 like '%" + item + "%' or a.SKU_ATTRIBUTE_VALUE4 like '%" + item + "%' or a.SKU_ATTRIBUTE_VALUE5 like '%" + item + "%' or a.SKU_ATTRIBUTE_VALUE6 like '%" + item + "%')" + 
        (index === (srchArr.length - 1) ? "" : " and ");
      });

    }

    let sqlQuery = "Select count(1) as cnt from " + dbschema + ".XXIBM_PRODUCT_SKU a  left outer join " + dbschema + ".XXIBM_PRODUCT_CATALOGUE b  on a.Catalogue_Category = b.Commodity left outer join " + dbschema + ".XXIBM_PRODUCT_STYLE c  on a.Style_Item = c.Item_Number left outer join " + dbschema + ".XXIBM_PRODUCT_PRICING p  on a.Item_Number = p.Item_Number " + sqlPartSrc;

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      try{
          if (err) {
            console.log(sqlQuery);
            throw err;
          }

          if (rows.length == 0) {
            console.log('DB fetch no records');
          }
          else {
            console.log(`DB fetch success for /search/${srch_str}p=${page}&l=${limit}  count = ${rows[0].cnt}`);
            cnt = rows[0].cnt;
          }
       }
       catch(e){
         console.log('DB query error - ' + JSON.stringify(e));
            r = {
              status : 'failed',
              data : [],
              count : 0,
              error : 'Internal Error'
            }
       }
    });

    sqlQuery = "select x.* from (SELECT a.Item_Number, a.Description as sku_desc, b.Commodity_Name, b.Commodity, b.Class_Name, b.Class, a.SKU_ATTRIBUTE1, a.SKU_ATTRIBUTE_VALUE1, a.SKU_ATTRIBUTE2, a.SKU_ATTRIBUTE_VALUE2, a.SKU_ATTRIBUTE3, a.SKU_ATTRIBUTE_VALUE3, a.SKU_ATTRIBUTE4, a.SKU_ATTRIBUTE_VALUE4, a.SKU_ATTRIBUTE5, a.SKU_ATTRIBUTE_VALUE5, a.SKU_ATTRIBUTE6, a.SKU_ATTRIBUTE_VALUE6, s.Brand, p.List_Price, p.Discount, p.IN_STOCK, @row_number:=(CASE WHEN @commodity = Commodity THEN @row_number + 1 ELSE 1 END) AS rnk, @commodity := Commodity) as commprev from " + dbschema + ".XXIBM_PRODUCT_SKU a left outer join " + dbschema + ".XXIBM_PRODUCT_CATALOGUE b on a.Catalogue_Category = b.Commodity left outer join " + dbschema + ".XXIBM_PRODUCT_PRICING p on a.Item_Number = p.Item_Number left outer join " + dbschema + ".XXIBM_PRODUCT_STYLE s on a.Style_Item = s.Item_Number inner join (select @row_number := 0) var " + sqlWhere + " order by b.Commodity_Name, a.SKU_ATTRIBUTE_VALUE1, a.SKU_ATTRIBUTE_VALUE2, a.SKU_ATTRIBUTE_VALUE3, a.SKU_ATTRIBUTE_VALUE4, a.SKU_ATTRIBUTE_VALUE5, a.SKU_ATTRIBUTE_VALUE6)x order by rnk LIMIT ? OFFSET ?";

    global.dbconn.query(sqlQuery, [limit, offset], function(err, rows, fields) {
      
      try {
        if(err){
            console.log('DB fetch error - ' + JSON.stringify(err));
            r = {
              status : 'failed',
              data : [],
              count : 0,
              error : 'No records'
            }
        }
        else {
            console.log(`DB fetch success for /search/${srch_str}?p=${page}&l=${limit}`);
            console.log(sqlQuery);
            r = {
              status : 'success',
              data : rows,
              count : rows.length,
              error : ''
            }
        } 

      }catch(e){
          console.log('DB query error - ' + JSON.stringify(e));
            r = {
              status : 'failed',
              data : [],
              count : 0,
              error : 'Internal Error'
            }
      }

      res.set('Content-Type', 'text/json');
      res.end(JSON.stringify(r)); 

    });

  })


  /* API action: All Item details Under a Commodity */
  .get('/commodity/:id', function(req, res) {

    let sqlQuery = "Select   a.Item_Number sku_Item_Number,   a.Description sku_Description,   a.Long_Description sku_Long_Description,   a.Catalogue_Category sku_Catalogue_Category,   a.SKU_UNIT_OF_MEASURE sku_SKU_UNIT_OF_MEASURE,   a.Style_Item sku_Style_Item,   a.SKU_ATTRIBUTE1 sku_SKU_ATTRIBUTE1,   a.SKU_ATTRIBUTE2 sku_SKU_ATTRIBUTE2,   a.SKU_ATTRIBUTE3 sku_SKU_ATTRIBUTE3,   a.SKU_ATTRIBUTE4 sku_SKU_ATTRIBUTE4,   a.SKU_ATTRIBUTE5 sku_SKU_ATTRIBUTE5,   a.SKU_ATTRIBUTE6 sku_SKU_ATTRIBUTE6,   a.SKU_ATTRIBUTE_VALUE1 sku_SKU_ATTRIBUTE_VALUE1,   a.SKU_ATTRIBUTE_VALUE2 sku_SKU_ATTRIBUTE_VALUE2,   a.SKU_ATTRIBUTE_VALUE3 sku_SKU_ATTRIBUTE_VALUE3,   a.SKU_ATTRIBUTE_VALUE4 sku_SKU_ATTRIBUTE_VALUE4,   a.SKU_ATTRIBUTE_VALUE5 sku_SKU_ATTRIBUTE_VALUE5,   a.SKU_ATTRIBUTE_VALUE6 sku_SKU_ATTRIBUTE_VALUE6,   b.Segment cat_Segment,   b.Segment_Name cat_Segment_Name,   b.Family cat_Family,   b.Family_Name cat_Family_Name,   b.Class cat_Class,   b.Class_Name cat_Class_Name,   b.Commodity_Name cat_Commodity_Name,   c.Description sty_Description,   c.Long_Description sty_Long_Description,   c.Brand sty_Brand,   p.PriceID prc_PriceID,   p.List_Price prc_List_Price,   p.Discount prc_Discount,   p.IN_STOCK prc_IN_STOCK,   p.Price_Effective_Date prc_Price_Effective_Date from   " + dbschema + ".XXIBM_PRODUCT_SKU a  inner join " + dbschema + ".XXIBM_PRODUCT_CATALOGUE b  on a.Catalogue_Category = b.Commodity inner join " + dbschema + ".XXIBM_PRODUCT_STYLE c  on a.Style_Item = c.Item_Number left outer join " + dbschema + ".XXIBM_PRODUCT_PRICING p  on a.Item_Number = p.Item_Number where a.Catalogue_Category = ?";

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

    let sqlQuery = "Select distinct Family_Name, class_Name from " + dbschema + ".XXIBM_PRODUCT_CATALOGUE where Family = ?";

    global.dbconn.query(sqlQuery, [req.params.fam], function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /family/id/classes');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: All Classes */
  .get('/classes', function(req, res) {

    let sqlQuery = "Select distinct class, class_Name, family, family_Name from " + dbschema + ".XXIBM_PRODUCT_CATALOGUE order by family_Name, class_Name";

    global.dbconn.query(sqlQuery, function(err, rows, fields) {
      if (err) throw err;

      console.log('DB fetch success for /classes');

      //console.log(rows);
      res.end(JSON.stringify(rows));
    })

  })


  /* API action: Commodity List per class */
  .get('/class/:cls/comm', function(req, res) {

    let sqlQuery = "Select distinct commodity, commodity_Name from " + dbschema + ".XXIBM_PRODUCT_CATALOGUE where class = ? order by commodity_Name";

    global.dbconn.query(sqlQuery, [req.params.cls], function(err, rows, fields) {
      if (err) throw err;

      console.log(`DB fetch success for /class/${req.params.cls}/comm`);

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


  /* test conn */
  .get('/testconn', function(req, res) {

    global.dbconn.query('Select 1 description;', function(err, rows, fields) {
      if (err) throw err;

      console.log('DB Connected - ', rows[0].description);
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



  //API Action: fetch an image as binary data
  .get('/image/:id', function(req, res) {
    
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
  .get('/imgbase64/:id', function(req, res) {
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

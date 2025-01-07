const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('scientific_database.db');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000

const app = express();
//get the parent fields (fields with no parent)
function getMainFields() {
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all("select id, field_name from fields where fields.id not in (select child from fields_tree);", (err, rows) => {
                if (err) { return reject(err); }
                resolve(rows);
            });
        })
    })
}

//get child from a parent id
function getChild(id) {
    const parentrow = parseInt(id);
    //console.log(id);
    if (!id) { throw new Error("id is not a number") }
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all(`select id,field_name from fields where id in (select child from fields_tree where parent = ${id});`, (err, rows) => {
                if (err) { return reject(err); }
                resolve(rows);
            });
        })
    })
}

//get articles from a selection of parameters
function getArticles(...ids) {
    const idArray = ids;
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all(`SELECT id,title,abstract,doi,publication_year from Articles where id in (SELECT article_content.article_id from article_content where tech_id in (${idArray}) group by article_id having count(distinct tech_id) = ${idArray.length});`,
                (err, rows) => {
                    if (err) { return reject(err); }
                    resolve(rows);
                });
        })
    })
}

//each cannot be used, because it doesnt wait for the database to finish before resolving
//get articles from a selection of parameters, add the authors to each article
async function getArticlesWithAuthors(...ids) {
    const Articles = await getArticles(...ids);
    for (const art of Articles) {
        const authors = await getAuthors(art.id);
        art.authors = authors;
    }
    //console.log(Articles);
    return Articles;
}
//get authors from article id
function getAuthors(id) {
    return new Promise(function (resolve, reject) {
        if (!id || Number.isNaN(id)) { reject("not a valid number") }
        db.serialize(() => {
            db.all(`Select first_name, last_name,orcid from authors where id in (select author_id from article_authors where article_id=${id});`,
                (err, rows) => {
                    if (err) { return reject(err); }
                    resolve(rows);
                });
        })
    })
}


//express config
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

// website querries
app.get('/', (req, res) => {
    res.render('home');
});


app.get('/search', async (req, res) => {
    const param = await getMainFields();
    res.render('search', { fields: param });
});
app.get('/submit', async (req, res) => {
    const param = await getMainFields();
    res.render('input_forms', { fields: param });
});



app.post('/search', async (req, res) => {
    try {
        const parent = req.body.fieldId;
        //console.log(req);
        const Children = await getChild(parent);//array
        const Articles = await getArticles(...req.body.filters);
        const art2 = await getArticlesWithAuthors(...req.body.filters);
        //console.log(art2);
        //console.log(Articles);
        const resData = {
            children: Children,
            articles: art2
        }
        res.json(JSON.stringify(resData));
    } catch (e) {
        console.log(e);
    }
});
app.post('/submit', async (req, res) => {
    try {
        const parent = req.body.fieldId;
        //console.log(req);
        const Children = await getChild(parent);//array
        //console.log(art2);
        //console.log(Children);
        res.json(JSON.stringify(Children));
    } catch (e) {
        console.log(e);
    }
});

//called everytime a filter has been removed to update the articles list
app.post('/refresh', async (req, res) => {
    const Articles = await getArticlesWithAuthors(...req.body.filters);
    //console.log(Articles);
    res.json(JSON.stringify({ articles: Articles }))
})



app.listen(port, () => {
    console.log(`LISTENING ON PORT 3000 ${port}`)
});

//---------- testing output
/*
async function printMainFields() {

    const output = await getMainFields();
    console.log(output);
};
async function printChild(id) {

    const output = await getChild(id);
    console.log(output);
};
async function printArticles() {
    const output = await getArticles(1);
    console.log(output);
};
async function printAuthors() {
    const output = await getAuthors(1);
    console.log(output);
};
*/

/*
printMainFields();
printChild(159);
printArticles();
printAuthors(1);
*/

/*
This was only for transfering data from a excel sheet with a non conventional classification to the database
*/

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('scientific_database.db');




const physical = [
    "thermal", `microwave, hydrothermal, steam explosion, autoclave, thermal hydrolysis, liquid hot water, thermal pressure, steam, torrefaction, wet explosion, cooking, hot air, pyrolysis, saponification, steam cracking steam, distillation, boiling`,
    "mechanical", "grinding, milling, extruding, shearing, chopping",
    "pressure", "Hydrodynamic cavitation, high pressure homogenisation, shock treatment, mechanical jet",
    "ultrasound", "ultrasound",
    "pulse electric field", "pulse electric field"

]
const chemical = [
    "alkaline", "NAOH,NH4, CaO, CaOH, KoH, CaCO3, black liquor",
    "acidic", "H2SO4, HCl, citric acid, free nitrous acid, H3PO4, organic acids(lactic, acetic, butyric, oxalic acids), CO2, waste gas, vinegar residue",
    "oxidation", "peroxide(H2O2, CaO, peracetic acid),ozone, wet oxidation, K2FeO4, fenton, hypochlorite, chlorination, potassium ferrate, peroxymonosulfate, polyoxometalates, advanced oxidation process(fenton/UV), photooxidation, gamma radiation",
    "solvent", "ionic liquids, N-Methylmorpholine N-oxide (NMMO), deep eutectic solvent, ethanol, acetone",
    "other", "surfactants, deodorants, solubilizers, salts",
]
const biological = [
    "bac", "digesate, compost, rumen, activated sludge",
    "aerobic", "aerobic",
    "anaerobic", "anaerobic",
    "fungi", "fungi",
    "enzyme", "enzyme"
]
const methods = [
    physical, chemical, biological
]
function splitandtrim(arr) {
    const innerarr = arr.split(",")
    for (const element of innerarr) {
        innerarr[innerarr.indexOf(element)] = element.trim();
    }
    return innerarr;
}
for (let submethod of methods) {
    for (let i = 0; i < submethod.length; i++) {
        submethod[i] = splitandtrim(submethod[i]);
        if (i > 0 && submethod[i].toString() === submethod[i - 1].toString()) {
            submethod[i] = [""];
        }
    }
}
//console.log(physical);
//select id from fields where fields.field_name='physical'; looking for an id;

db.serialize(() => {
    /*
    const row = db.each("select id from fields where field_name='anaerobic_digestion'", (err, row) => {
        console.log(row.id);
    });*/
    let count = 0
    //first step is to add the second layer of fields
    for (const subfield of methods[2]) {
        //second step where submethods are added
        if (subfield.length > 1) {
            //console.log(">1 " + subfield);
            //console.log(methods[0]);
            //console.log(subfield);
            //console.log(methods[0][count - 1][0]);
            //console.log(methods[0][(methods[0].indexOf[subfield]) - 1]);
            for (const element of subfield) {

                db.run(`insert into fields(field_name) values("${element}")`)
                db.run(`insert into field_tree(parent,child) values((select id from fields where field_name="${methods[2][count - 1][0]}"),(select id from fields where field_name="${element}"))`)
            }
        } else if (subfield[0] !== '') {
            db.run(`insert into fields(field_name) values("${subfield[0]}")`)
            db.run(`insert into field_tree(parent,child) values((select id from fields where field_name="biological"),(select id from fields where field_name="${subfield[0]}"))`)
        }
        count++;
    }
});
db.close;


/*
let wordtext = "";
Boolean is2cat= false;
let arr = [];
let temparr=[];
for (const word of physical) {
if(word===":"){
    arr.push(wordtext);
    wordtext="";
    is2cat=true;
}else if(word===","){
    temparr
}else{
    wordtext = wordtext.concat(word);
}
}
console.log(wordtext);*/